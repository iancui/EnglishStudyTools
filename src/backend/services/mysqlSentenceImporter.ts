import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { GeminiSentenceResult } from './geminiSentenceService.ts';

export interface SentenceImportSummary {
  imported: number;
  skipped: number;
  sentenceIds: string[];
}

function getPool() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'linguastep';

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
    charset: 'utf8mb4'
  });
}

export class MysqlSentenceImporter {
  static async importSentences(dictionaryId: string, sentences: GeminiSentenceResult[]): Promise<SentenceImportSummary> {
    if (!dictionaryId) throw new Error('dictionaryId 不能为空');
    if (!sentences.length) return { imported: 0, skipped: 0, sentenceIds: [] };

    const pool = getPool();
    const conn = await pool.getConnection();
    const sentenceIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    try {
      await conn.beginTransaction();

      const [dictRows] = await conn.query('SELECT id FROM dictionary WHERE id = ? AND status = \'ACTIVE\'', [dictionaryId]);
      if (!(dictRows as any[]).length) {
        throw new Error('目标句子辞书不存在或已停用');
      }

      for (const item of sentences) {
        const content = item.content.trim();
        if (!content) {
          skipped++;
          continue;
        }

        const [existingRows] = await conn.query('SELECT id FROM sentence WHERE content = ? LIMIT 1', [content]);
        let sentenceId: string;

        if ((existingRows as any[]).length) {
          sentenceId = (existingRows as any[])[0].id;
        } else {
          sentenceId = randomUUID();
          await conn.execute(
            `INSERT INTO sentence
              (id, content, translation, level, difficulty)
             VALUES (?, ?, ?, ?, ?)`,
            [sentenceId, content, item.translation, item.level, Math.max(1, Math.min(5, item.difficulty))]
          );

          for (let i = 0; i < item.words.length; i++) {
            const w = item.words[i];
            const wordText = w.text.trim().toLowerCase();
            if (!wordText || /^[^a-zA-Z]+$/.test(wordText)) continue;

            const [wordRows] = await conn.query('SELECT id FROM word WHERE text = ? LIMIT 1', [wordText]);
            let wordId: string;
            if ((wordRows as any[]).length) {
              wordId = (wordRows as any[])[0].id;
            } else {
              wordId = randomUUID();
              await conn.execute(
                `INSERT INTO word
                  (id, text, phonetic_uk, phonetic_us, pos, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [wordId, wordText, w.phoneticUk || '', w.phoneticUs || '', w.pos || '', Math.max(1, Math.min(5, item.difficulty))]
              );
              await conn.execute(
                `INSERT INTO word_meaning
                  (id, word_id, pos, definition_cn)
                 VALUES (?, ?, ?, ?)`,
                [randomUUID(), wordId, w.pos || '', w.meaningCn || '']
              );
            }

            await conn.execute(
              `INSERT INTO sentence_word
                (id, sentence_id, word_id, position_no)
               VALUES (?, ?, ?, ?)`,
              [randomUUID(), sentenceId, wordId, i + 1]
            );
          }

          for (let i = 0; i < item.steps.length; i++) {
            const step = item.steps[i];
            await conn.execute(
              `INSERT INTO sentence_step
                (id, sentence_id, step_number, content, translation, phonetic, type)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [randomUUID(), sentenceId, i + 1, step.content, step.translation, step.phonetic || '', step.type]
            );
          }

          for (const analysis of item.analyses) {
            await conn.execute(
              `INSERT INTO sentence_analysis
                (id, sentence_id, text, start_position, end_position, type, explanation)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                randomUUID(),
                sentenceId,
                analysis.text,
                analysis.startPosition,
                analysis.endPosition,
                analysis.type,
                analysis.explanation
              ]
            );
          }
        }

        await conn.execute(
          `INSERT IGNORE INTO dictionary_sentence
            (id, dictionary_id, sentence_id, sequence_no, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [randomUUID(), dictionaryId, sentenceId, Date.now() % 2147483647]
        );

        sentenceIds.push(sentenceId);
        imported++;
      }

      await conn.commit();
      return { imported, skipped, sentenceIds };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
      await pool.end();
    }
  }
}
