import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

export interface ExcelWordRow {
  text: string;
  phonetic?: string;
  pos?: string;
  meaningCn?: string;
}

export interface ExcelSentenceRow {
  content: string;
  translation?: string;
}

export interface ExcelImportResult {
  words: { total: number; imported: number; newWords: number; skipped: number };
  sentences: { total: number; imported: number; newSentences: number; skipped: number };
}

function getPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'linguastep',
    password: process.env.DB_PASSWORD || 'LinguaDB@123456',
    database: process.env.DB_NAME || 'linguastep',
    connectionLimit: 5,
    charset: 'utf8mb4'
  });
}

function splitWords(sentence: string): Array<{ text: string; punctAfter: string }> {
  const result: Array<{ text: string; punctAfter: string }> = [];
  const regex = /([A-Za-z']+)([^A-Za-z']*)?/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(sentence)) !== null) {
    result.push({ text: m[1], punctAfter: m[2] || '' });
  }
  return result;
}

export class ExcelImportService {
  static async importWorkbookData(
    wordDictionaryId: string,
    sentenceDictionaryId: string,
    words: ExcelWordRow[],
    sentences: ExcelSentenceRow[]
  ): Promise<ExcelImportResult> {
    if (!wordDictionaryId) throw new Error('单词辞书不能为空');
    if (!sentenceDictionaryId) throw new Error('句子辞书不能为空');

    const pool = getPool();
    const conn = await pool.getConnection();

    const result: ExcelImportResult = {
      words: { total: words.length, imported: 0, newWords: 0, skipped: 0 },
      sentences: { total: sentences.length, imported: 0, newSentences: 0, skipped: 0 }
    };

    try {
      await conn.beginTransaction();

      const [dictRows] = await conn.query(
        'SELECT id FROM dictionary WHERE id IN (?, ?) AND status = "ACTIVE"',
        [wordDictionaryId, sentenceDictionaryId]
      );
      const activeDictIds = new Set((dictRows as any[]).map(r => r.id));
      if (!activeDictIds.has(wordDictionaryId)) throw new Error('目标单词辞书不存在或已停用');
      if (!activeDictIds.has(sentenceDictionaryId)) throw new Error('目标句子辞书不存在或已停用');

      // 1. 单词表：先建立/更新全局 word，再加入目标辞书。
      const wordMap = new Map<string, { id: string; meaning: string; pos: string }>();

      for (let i = 0; i < words.length; i++) {
        const row = words[i];
        const text = String(row.text || '').trim();
        if (!text) {
          result.words.skipped++;
          continue;
        }

        const key = text.toLowerCase();
        const phonetic = String(row.phonetic || '').trim();
        const pos = String(row.pos || '').trim();
        const meaning = String(row.meaningCn || '').trim();

        const [existing] = await conn.query('SELECT id, phonetic_uk, phonetic_us, pos FROM word WHERE text = ? LIMIT 1', [key]);
        let wordId: string;

        if ((existing as any[]).length) {
          wordId = (existing as any[])[0].id;
          await conn.query(
            'UPDATE word SET phonetic_uk = CASE WHEN ? <> "" THEN ? ELSE phonetic_uk END, phonetic_us = CASE WHEN ? <> "" THEN ? ELSE phonetic_us END, pos = CASE WHEN ? <> "" THEN ? ELSE pos END WHERE id = ?',
            [phonetic, phonetic, phonetic, phonetic, pos, pos, wordId]
          );
        } else {
          wordId = randomUUID();
          await conn.query(
            'INSERT INTO word (id, text, phonetic_uk, phonetic_us, pos, difficulty) VALUES (?, ?, ?, ?, ?, 1)',
            [wordId, key, phonetic, phonetic, pos || 'n.']
          );
          result.words.newWords++;
        }

        if (meaning) {
          const [meaningRows] = await conn.query(
            'SELECT id FROM word_meaning WHERE word_id = ? AND pos = ? AND definition_cn = ? LIMIT 1',
            [wordId, pos || 'n.', meaning]
          );
          if (!(meaningRows as any[]).length) {
            await conn.query(
              'INSERT INTO word_meaning (id, word_id, pos, definition_cn) VALUES (?, ?, ?, ?)',
              [randomUUID(), wordId, pos || 'n.', meaning]
            );
          }
        }

        await conn.query(
          'INSERT IGNORE INTO dictionary_word (id, dictionary_id, word_id, sequence_no, is_active) VALUES (?, ?, ?, ?, 1)',
          [randomUUID(), wordDictionaryId, wordId, i + 1]
        );

        wordMap.set(key, { id: wordId, meaning, pos: pos || 'n.' });
        result.words.imported++;
      }

      // 2. 句子表：创建句子，并建立 sentence_word / sentence_step。
      for (let i = 0; i < sentences.length; i++) {
        const row = sentences[i];
        const content = String(row.content || '').trim();
        if (!content) {
          result.sentences.skipped++;
          continue;
        }

        const translation = String(row.translation || '').trim();
        const [existingRows] = await conn.query(
          'SELECT id FROM sentence WHERE content = ? LIMIT 1',
          [content]
        );

        let sentenceId: string;
        const isExisting = (existingRows as any[]).length > 0;

        if (isExisting) {
          sentenceId = (existingRows as any[])[0].id;
          await conn.query(
            'UPDATE sentence SET translation = ? WHERE id = ?',
            [translation, sentenceId]
          );
          await conn.query('DELETE FROM sentence_word WHERE sentence_id = ?', [sentenceId]);
          await conn.query('DELETE FROM sentence_step WHERE sentence_id = ?', [sentenceId]);
          await conn.query('DELETE FROM sentence_analysis WHERE sentence_id = ?', [sentenceId]);
        } else {
          sentenceId = randomUUID();
          await conn.query(
            'INSERT INTO sentence (id, content, translation, level, difficulty) VALUES (?, ?, ?, "A1", 1)',
            [sentenceId, content, translation]
          );
          result.sentences.newSentences++;
        }

        const tokens = splitWords(content);

        for (let position = 0; position < tokens.length; position++) {
          const token = tokens[position];
          const key = token.text.toLowerCase();
          let info = wordMap.get(key);

          if (!info) {
            const [wordRows] = await conn.query(
              'SELECT id, pos FROM word WHERE text = ? LIMIT 1',
              [key]
            );

            if ((wordRows as any[]).length) {
              const wordId = (wordRows as any[])[0].id;
              const [meaningRows] = await conn.query(
                'SELECT definition_cn FROM word_meaning WHERE word_id = ? ORDER BY id LIMIT 1',
                [wordId]
              );
              info = {
                id: wordId,
                meaning: (meaningRows as any[])[0]?.definition_cn || '',
                pos: (wordRows as any[])[0].pos || 'n.'
              };
            } else {
              const wordId = randomUUID();
              await conn.query(
                'INSERT INTO word (id, text, phonetic_uk, phonetic_us, pos, difficulty) VALUES (?, ?, "", "", "n.", 1)',
                [wordId, key]
              );
              info = { id: wordId, meaning: '', pos: 'n.' };
            }
            wordMap.set(key, info);
          }

          await conn.query(
            'INSERT INTO sentence_word (id, sentence_id, word_id, position_no, translation_cn) VALUES (?, ?, ?, ?, ?)',
            [randomUUID(), sentenceId, info.id, position + 1, info.meaning]
          );

          await conn.query(
            'INSERT INTO sentence_step (id, sentence_id, step_number, content, translation, phonetic, type) VALUES (?, ?, ?, ?, ?, "", "WORD")',
            [randomUUID(), sentenceId, position + 1, token.text + token.punctAfter, info.meaning || '']
          );
        }

        await conn.query(
          'INSERT INTO sentence_step (id, sentence_id, step_number, content, translation, phonetic, type) VALUES (?, ?, ?, ?, ?, "", "SENTENCE")',
          [randomUUID(), sentenceId, tokens.length + 1, content, translation]
        );

        await conn.query(
          'INSERT IGNORE INTO dictionary_sentence (id, dictionary_id, sentence_id, sequence_no, is_active) VALUES (?, ?, ?, ?, 1)',
          [randomUUID(), sentenceDictionaryId, sentenceId, i + 1]
        );

        result.sentences.imported++;
      }

      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
      await pool.end();
    }
  }
}
