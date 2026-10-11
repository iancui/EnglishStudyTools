/**
 * 句子渐进拆分引擎（Snowball / 雪球式）
 *
 * 给定一个句子，按配置的粒度把它切成若干“块”，学习时逐块累加：
 *   "How" → "How do" → "How do you" → … → 完整句子
 *
 * 粒度可配置：
 *   WORD   逐词递进（一次加一个单词）
 *   PHRASE 意群递进（一次加一个 2~4 词的意群，如 "go to school"）
 *   FIXED  固定词数递进（一次加 N 个单词，N 由 fixedSize 指定）
 */
import { glossForWord } from './wordGloss.ts';

/**
 * 解码句子中的 HTML 实体。
 * 数据库里部分句子存了 &lsquo; &rsquo; &ldquo; &rdquo; 等实体，
 * 若不解码直接分词，会把 lsquo 当成单词、发音也会出错。
 */
const HTML_ENTITIES: Record<string, string> = {
  lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"',
  amp: '&', nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  apos: "'", quot: '"', lt: '<', gt: '>',
};

export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text.replace(/&([a-z]+);/gi, (_, name) => {
    const v = HTML_ENTITIES[name.toLowerCase()];
    return v !== undefined ? v : '&' + name + ';';
  });
}

export type ChunkGranularity = 'WORD' | 'PHRASE' | 'FIXED';

export interface ChunkOptions {
  granularity: ChunkGranularity;
  fixedSize?: number;
}

export interface ChunkToken {
  word: string;       // 单词原文（保留大小写，缩写中间的 ' 保留，如 I'm）
  punctBefore: string; // 单词前的标点（不含空格），如句首引号 " '
  punctAfter: string; // 单词后的标点（不含空格），如 "?" "." "," 句尾引号
}

export interface ProgressiveChunk {
  stepNumber: number;
  accumulatedText: string; // 截至本步的累计文本（雪球）
  newChunk: string;        // 本步新增的块
  meaning: string;         // 本步块的中文释义
  phonetic: string;        // 本步块的音标（可能为空）
  isFinal: boolean;        // 是否为最后一块（即完整句子）
}

export interface ChunkProviders {
  /** 取某位置单词的中文释义（word 为原大小写词形） */
  meaningAt: (word: string, position: number) => string;
  /** 取某位置单词的音标（可返回空串） */
  phoneticAt: (word: string, position: number) => string;
}

/**
 * 分词：前缀标点 + 单词 + 后缀标点。
 * 单词定义：字母开头/结尾，中间可含缩写撇号（I'm, don't, name's）。
 * 句首/句尾的引号（' "）归为标点，不会被并到单词里导致查词失败。
 */
export function tokenizeSentence(content: string): ChunkToken[] {
  const tokens: ChunkToken[] = [];
  const text = decodeHtmlEntities(content);
  const re = /([^A-Za-z]*?)([A-Za-z]+(?:'[A-Za-z]+)*)([^A-Za-z]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[2];
    if (!word) continue;
    tokens.push({
      word,
      punctBefore: (m[1] || '').replace(/\s+/g, ''),
      punctAfter: (m[3] || '').replace(/\s+/g, ''),
    });
  }
  return tokens;
}

/* ---------------- 意群（PHRASE）分组 ---------------- */

// 出现在这些词之前，可作为意群边界（介词/连词/不定式符号等）
const BOUNDARY_BEFORE = new Set([
  'to', 'in', 'on', 'at', 'for', 'from', 'of', 'with', 'by', 'about',
  'under', 'behind', 'beside', 'between', 'into', 'onto', 'over',
  'after', 'before', 'through', 'along', 'around', 'during', 'without',
  'and', 'or', 'but', 'so', 'because', 'if', 'then', 'than',
  'when', 'where', 'who', 'which', 'that',
]);

function hardPunct(t: ChunkToken): boolean {
  return /[,;:—–\-()（）]/.test(t.punctAfter);
}

function isBoundary(tokens: ChunkToken[], k: number): boolean {
  if (k <= 0 || k >= tokens.length) return false;
  if (hardPunct(tokens[k - 1])) return true;
  return BOUNDARY_BEFORE.has(tokens[k].word.toLowerCase());
}

/** 把一个不含硬标点的子句切成 2~4 词的意群 */
function groupClause(words: ChunkToken[]): ChunkToken[][] {
  const res: ChunkToken[][] = [];
  let start = 0;
  while (start < words.length) {
    const remaining = words.length - start;
    if (remaining <= 4) {
      if (remaining === 1 && res.length > 0) {
        res[res.length - 1].push(words[start]); // 尾部残留 1 词并入上一组
      } else {
        res.push(words.slice(start, start + remaining));
      }
      break;
    }
    // 在 start+2 … start+4 之间寻找最早的意群边界
    let br = -1;
    for (let k = start + 2; k <= start + 4 && k < words.length; k++) {
      if (isBoundary(words, k)) { br = k; break; }
    }
    if (br === -1) br = start + (remaining >= 8 ? 4 : 3);
    if (words.length - br === 1) br -= 1; // 不允许留下单个词
    res.push(words.slice(start, br));
    start = br;
  }
  return res;
}

/** 按意群切分：先按硬标点/逗号断成子句，再各自归并 */
export function phraseGroups(tokens: ChunkToken[]): ChunkToken[][] {
  const groups: ChunkToken[][] = [];
  let cur: ChunkToken[] = [];
  const flush = () => {
    if (cur.length) {
      for (const g of groupClause(cur)) groups.push(g);
      cur = [];
    }
  };
  for (const t of tokens) {
    cur.push(t);
    if (hardPunct(t)) flush();
  }
  flush();
  return groups;
}

/* ---------------- 分组调度 ---------------- */

function buildGroups(tokens: ChunkToken[], opts: ChunkOptions): ChunkToken[][] {
  if (tokens.length === 0) return [];
  if (opts.granularity === 'WORD') return tokens.map(t => [t]);
  if (opts.granularity === 'FIXED') {
    const size = Math.max(1, Math.min(8, opts.fixedSize || 2));
    const out: ChunkToken[][] = [];
    for (let i = 0; i < tokens.length; i += size) out.push(tokens.slice(i, i + size));
    return out;
  }
  return phraseGroups(tokens);
}

function renderTokens(tokens: ChunkToken[]): string {
  return tokens.map(t => t.punctBefore + t.word + t.punctAfter).join(' ');
}

/* ---------------- 主入口 ---------------- */

export function buildProgressiveChunks(
  content: string,
  opts: ChunkOptions,
  providers: ChunkProviders
): ProgressiveChunk[] {
  const tokens = tokenizeSentence(content);
  const groups = buildGroups(tokens, opts);

  // 每个单词在原句中的绝对位置（供 providers 使用）
  const groupAtPos: Array<{ group: ChunkToken[]; positions: number[] }> = [];
  let cursor = 0;
  for (const g of groups) {
    const positions = g.map(() => cursor++);
    groupAtPos.push({ group: g, positions });
  }

  let covered = 0;
  return groupAtPos.map(({ group, positions }, idx) => {
    covered += group.length;
    const accumulatedText = renderTokens(tokens.slice(0, positions[0] + group.length));

    const meaningParts: string[] = [];
    const phoneticParts: string[] = [];
    group.forEach((t, i) => {
      const pos = positions[i];
      const m = providers.meaningAt(t.word, pos);
      if (m && !meaningParts.includes(m)) meaningParts.push(m);
      const p = providers.phoneticAt(t.word, pos);
      if (p) phoneticParts.push(p);
    });

    return {
      stepNumber: idx + 1,
      accumulatedText,
      newChunk: renderTokens(group),
      meaning: meaningParts.join('；'),
      phonetic: phoneticParts.join(' '),
      isFinal: covered === tokens.length,
    };
  });
}

/** 便捷封装：从“wordId → 释义数组 / 音标”映射构造 providers */
export function providersFromMaps(
  positionToWordId: (position: number) => string | undefined,
  meaningsByWordId: Map<string, string[]>,
  phoneticByWordId: Map<string, string>
): ChunkProviders {
  return {
    meaningAt: (word, position) => {
      const wordLower = word.toLowerCase();
      const wid = positionToWordId(position);
      const meanings = wid ? meaningsByWordId.get(wid) || [] : [];
      // 句中（非句首）首字母大写、且不是 I：按人名/专有名词处理，
      // 避免把教材角色 Zip 解释成“拉链”。
      const proper = position !== 0 && word !== 'I' && /^[A-Z][a-z']*$/.test(word);
      return glossForWord(wordLower, meanings, { proper });
    },
    phoneticAt: (_word, position) => {
      const wid = positionToWordId(position);
      return wid ? phoneticByWordId.get(wid) || '' : '';
    },
  };
}
