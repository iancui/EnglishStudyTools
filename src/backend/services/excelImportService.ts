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



function chunk<T>(items: T[], size = 500): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

async function insertMany(
  conn: mysql.PoolConnection,
  sqlPrefix: string,
  rows: any[][],
  chunkSize = 500
) {
  for (const part of chunk(rows, chunkSize)) {
    const placeholders = part.map(() => '(' + part[0].map(() => '?').join(',') + ')').join(',');
    await conn.query(sqlPrefix + placeholders, part.flat());
  }
}

async function queryIn(
  conn: mysql.PoolConnection,
  sqlPrefix: string,
  values: string[]
): Promise<any[]> {
  if (!values.length) return [];
  const rows: any[] = [];
  for (const part of chunk(values, 500)) {
    const placeholders = part.map(() => '?').join(',');
    const [result] = await conn.query(sqlPrefix + placeholders + ')', part);
    rows.push(...(result as any[]));
  }
  return rows;
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
      const activeDictIds = new Set((dictRows as any[]).map(r => String(r.id)));
      if (!activeDictIds.has(wordDictionaryId)) throw new Error('目标单词辞书不存在或已停用');
      if (!activeDictIds.has(sentenceDictionaryId)) throw new Error('目标句子辞书不存在或已停用');

      // 关键优化：先在内存中整理数据，再批量查询/插入，避免“每行多次 SQL”。
      const normalizedWords = words.map((row, index) => ({
        index,
        text: String(row.text || '').trim(),
        key: String(row.text || '').trim().toLowerCase(),
        phonetic: String(row.phonetic || '').trim(),
        pos: String(row.pos || '').trim() || 'n.',
        meaning: String(row.meaningCn || '').trim()
      }));

      const validWordRows = normalizedWords.filter(r => r.text);
      result.words.skipped = normalizedWords.length - validWordRows.length;

      const sentenceRows = sentences.map((row, index) => ({
        index,
        content: String(row.content || '').trim(),
        translation: String(row.translation || '').trim()
      }));
      const validSentenceRows = sentenceRows.filter(r => r.content);
      result.sentences.skipped = sentenceRows.length - validSentenceRows.length;

      // 先收集 Excel 单词 + 所有句子 token，一次性预取已有单词。
      const tokenKeys = new Set<string>();
      for (const row of validWordRows) tokenKeys.add(row.key);
      const sentenceTokens = new Map<string, Array<{ text: string; punctAfter: string }>>();
      for (const row of validSentenceRows) {
        const tokens = splitWords(row.content);
        sentenceTokens.set(row.content, tokens);
        for (const token of tokens) tokenKeys.add(token.text.toLowerCase());
      }

      const allWordKeys = [...tokenKeys];
      const existingWordRows = await queryIn(
        conn,
        'SELECT id, text, phonetic_uk, phonetic_us, pos FROM word WHERE text IN (',
        allWordKeys
      );
      const wordMap = new Map<string, { id: string; meaning: string; pos: string }>();
      for (const row of existingWordRows) {
        wordMap.set(String(row.text).toLowerCase(), {
          id: String(row.id),
          meaning: '',
          pos: String(row.pos || 'n.')
        });
      }

      // 新单词一次性插入。
      const newWordRows: any[][] = [];
      for (const key of allWordKeys) {
        if (!wordMap.has(key)) {
          const source = validWordRows.find(r => r.key === key);
          const phonetic = source?.phonetic || '';
          const pos = source?.pos || 'n.';
          const id = randomUUID();
          wordMap.set(key, { id, meaning: source?.meaning || '', pos });
          newWordRows.push([id, key, phonetic, phonetic, pos, 1]);
        }
      }
      if (newWordRows.length) {
        await insertMany(
          conn,
          'INSERT INTO word (id, text, phonetic_uk, phonetic_us, pos, difficulty) VALUES ',
          newWordRows
        );
        result.words.newWords = newWordRows.length;
      }

      // 已有单词的音标/词性只对确实有新数据的词做更新。
      for (const part of chunk(validWordRows.filter(r => wordMap.has(r.key)), 500)) {
        for (const row of part) {
          if (!row.phonetic && !row.pos) continue;
          const info = wordMap.get(row.key)!;
          await conn.query(
            'UPDATE word SET phonetic_uk = CASE WHEN ? <> "" THEN ? ELSE phonetic_uk END, phonetic_us = CASE WHEN ? <> "" THEN ? ELSE phonetic_us END, pos = CASE WHEN ? <> "" THEN ? ELSE pos END WHERE id = ?',
            [row.phonetic, row.phonetic, row.phonetic, row.phonetic, row.pos === 'n.' ? '' : row.pos, row.pos === 'n.' ? '' : row.pos, info.id]
          );
        }
      }

      // 批量预取已有释义，避免每个单词 SELECT 一次。
      const wordIds = [...new Set([...wordMap.values()].map(v => v.id))];
      const existingMeaningRows = await queryIn(
        conn,
        'SELECT id, word_id, pos, definition_cn FROM word_meaning WHERE word_id IN (',
        wordIds
      );
      const meaningSet = new Set<string>();
      for (const row of existingMeaningRows) {
        const key = String(row.word_id) + '\0' + String(row.pos) + '\0' + String(row.definition_cn);
        meaningSet.add(key);
      }

      const meaningRowsToInsert: any[][] = [];
      for (const row of validWordRows) {
        if (!row.meaning) continue;
        const info = wordMap.get(row.key)!;
        const key = info.id + '\0' + row.pos + '\0' + row.meaning;
        if (!meaningSet.has(key)) {
          meaningSet.add(key);
          meaningRowsToInsert.push([randomUUID(), info.id, row.pos, row.meaning]);
          info.meaning = row.meaning;
        }
      }
      if (meaningRowsToInsert.length) {
        await insertMany(
          conn,
          'INSERT INTO word_meaning (id, word_id, pos, definition_cn) VALUES ',
          meaningRowsToInsert
        );
      }

      // 如果句子中用到的旧单词没有释义，补齐首个已有释义到内存 Map。
      const missingMeaningWordIds = wordIds.filter(id => {
        for (const info of wordMap.values()) if (info.id === id && info.meaning) return false;
        return true;
      });
      if (missingMeaningWordIds.length) {
        const rows = await queryIn(
          conn,
          'SELECT word_id, definition_cn, pos FROM word_meaning WHERE word_id IN (',
          missingMeaningWordIds
        );
        for (const row of rows) {
          const info = [...wordMap.values()].find(v => v.id === String(row.word_id));
          if (info && !info.meaning) {
            info.meaning = String(row.definition_cn || '');
            info.pos = String(row.pos || info.pos || 'n.');
          }
        }
      }

      // 单词 -> 辞书：一次批量 INSERT IGNORE。
      const dictionaryWordRows = validWordRows.map((row, i) => [
        randomUUID(), wordDictionaryId, wordMap.get(row.key)!.id, i + 1, 1
      ]);
      if (dictionaryWordRows.length) {
        await insertMany(
          conn,
          'INSERT IGNORE INTO dictionary_word (id, dictionary_id, word_id, sequence_no, is_active) VALUES ',
          dictionaryWordRows
        );
      }
      result.words.imported = validWordRows.length;

      // 一次性预取已有句子。
      const contents = validSentenceRows.map(r => r.content);
      const existingSentenceRows = await queryIn(
        conn,
        'SELECT id, content FROM sentence WHERE content IN (',
        contents
      );
      const sentenceMap = new Map<string, string>();
      for (const row of existingSentenceRows) {
        sentenceMap.set(String(row.content), String(row.id));
      }

      const existingSentenceIds = validSentenceRows
        .filter(r => sentenceMap.has(r.content))
        .map(r => sentenceMap.get(r.content)!);

      // 更新已有句子并清理旧步骤/词关系；DELETE 采用 IN 批量执行。
      for (const part of chunk(existingSentenceIds, 500)) {
        if (!part.length) continue;
        const placeholders = part.map(() => '?').join(',');
        await conn.query('DELETE FROM sentence_word WHERE sentence_id IN (' + placeholders + ')', part);
        await conn.query('DELETE FROM sentence_step WHERE sentence_id IN (' + placeholders + ')', part);
        await conn.query('DELETE FROM sentence_analysis WHERE sentence_id IN (' + placeholders + ')', part);
      }
      for (const row of validSentenceRows.filter(r => sentenceMap.has(r.content))) {
        await conn.query(
          'UPDATE sentence SET translation = ? WHERE id = ?',
          [row.translation, sentenceMap.get(row.content)]
        );
      }

      // 新句子批量插入。
      const newSentenceRows: any[][] = [];
      for (const row of validSentenceRows) {
        if (!sentenceMap.has(row.content)) {
          const id = randomUUID();
          sentenceMap.set(row.content, id);
          newSentenceRows.push([id, row.content, row.translation, 'A1', 1]);
        }
      }
      if (newSentenceRows.length) {
        await insertMany(
          conn,
          'INSERT INTO sentence (id, content, translation, level, difficulty) VALUES ',
          newSentenceRows
        );
      }
      result.sentences.newSentences = newSentenceRows.length;

      // 句子关系和步骤全部在内存组装后批量写入。
      const sentenceWordRows: any[][] = [];
      const sentenceStepRows: any[][] = [];
      const dictionarySentenceRows: any[][] = [];

      for (const row of validSentenceRows) {
        const sentenceId = sentenceMap.get(row.content)!;
        const tokens = sentenceTokens.get(row.content) || [];

        for (let position = 0; position < tokens.length; position++) {
          const token = tokens[position];
          const info = wordMap.get(token.text.toLowerCase());
          if (!info) continue;

          sentenceWordRows.push([
            randomUUID(), sentenceId, info.id, position + 1, info.meaning || ''
          ]);
          sentenceStepRows.push([
            randomUUID(), sentenceId, position + 1,
            token.text + token.punctAfter, info.meaning || '', '', 'WORD'
          ]);
        }

        sentenceStepRows.push([
          randomUUID(), sentenceId, tokens.length + 1,
          row.content, row.translation, '', 'SENTENCE'
        ]);
        dictionarySentenceRows.push([
          randomUUID(), sentenceDictionaryId, sentenceId, row.index + 1, 1
        ]);
      }

      if (sentenceWordRows.length) {
        await insertMany(
          conn,
          'INSERT INTO sentence_word (id, sentence_id, word_id, position_no, translation_cn) VALUES ',
          sentenceWordRows
        );
      }
      if (sentenceStepRows.length) {
        await insertMany(
          conn,
          'INSERT INTO sentence_step (id, sentence_id, step_number, content, translation, phonetic, type) VALUES ',
          sentenceStepRows
        );
      }
      if (dictionarySentenceRows.length) {
        await insertMany(
          conn,
          'INSERT IGNORE INTO dictionary_sentence (id, dictionary_id, sentence_id, sequence_no, is_active) VALUES ',
          dictionarySentenceRows
        );
      }

      result.sentences.imported = validSentenceRows.length;

      // 导入完成后只在事务内重算一次冗余计数，运行时读取不再 COUNT(dictionary_word)。
      await conn.query(
        'UPDATE dictionary d SET word_count=(SELECT COUNT(*) FROM dictionary_word dw WHERE dw.dictionary_id=d.id AND dw.is_active=1) WHERE d.id=?',
        [wordDictionaryId]
      );

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
