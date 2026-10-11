/**
 * 单词释义解析：
 * 1) 封闭类高频词（代词/冠词/助动词/介词/连词等）使用内置“小学生友好”释义，
 *    避免词库里这些词没有释义或取到冗长/错误的词典条目。
 * 2) 其它词从 word_meaning 中挑选“最干净、最简短”的核心释义，
 *    过滤 [域]/[军] 等词典残留以及明显的脏数据。
 */

/** 封闭类高频词的标准释义（小写词形 → 中文） */
export const FUNCTION_GLOSS: Record<string, string> = {
  // 代词 / 限定词
  i: '我', me: '我（宾格）', my: '我的', mine: '我的（东西）',
  you: '你；你们', your: '你的；你们的', yours: '你的；你们的（东西）',
  he: '他', him: '他（宾格）', his: '他的',
  she: '她', her: '她；她的',
  it: '它', its: '它的',
  we: '我们', us: '我们（宾格）', our: '我们的', ours: '我们的（东西）',
  they: '他们；她们；它们', them: '他们（宾格）', their: '他们的', theirs: '他们的（东西）',
  this: '这；这个', that: '那；那个', these: '这些', those: '那些',
  who: '谁', whom: '谁（宾格）', whose: '谁的',
  what: '什么', which: '哪一个',
  when: '什么时候', where: '在哪里', why: '为什么', how: '怎样；多么',
  // be / 助动词 / 情态动词
  am: '是', is: '是', are: '是', was: '是（过去式）', were: '是（过去式）',
  be: '是', been: '是（过去分词）', being: '是（现在分词）',
  do: '做；（助动词）', does: '做；（助动词）', did: '做（过去式）；（助动词）',
  have: '有；已经', has: '有；已经', had: '有（过去式）；已经',
  will: '将；会', would: '将；会（过去式）', shall: '将；会', should: '应该',
  can: '能；会', could: '能（过去式）', may: '可以；可能', might: '可能', must: '必须',
  // 介词
  to: '到；向；给', at: '在（某地/某时）', in: '在……里面', on: '在……上面',
  under: '在……下面', near: '在……附近', behind: '在……后面', beside: '在……旁边',
  between: '在……之间', for: '为；给；为了', of: '……的', from: '从；来自',
  with: '和……一起；用', about: '关于；大约', by: '乘；通过；在……旁边',
  into: '到……里面', onto: '到……上面', over: '在……上方；超过',
  after: '在……之后', before: '在……之前', during: '在……期间',
  through: '穿过', along: '沿着', around: '在……周围；大约', without: '没有',
  // 连词 / 冠词
  and: '和；并且', or: '或者；否则', but: '但是', so: '所以；如此',
  because: '因为', if: '如果', then: '然后；那么', than: '比',
  the: '（这个/那个，无实义）', a: '一（个）', an: '一（个）',
  some: '一些', any: '任何；一些', many: '许多', much: '许多',
  every: '每一个', all: '所有的；都', no: '不；没有', not: '不', yes: '是；对',
  // 高频副词 / 其它
  very: '非常', too: '也；太', also: '也',
  often: '经常', usually: '通常', sometimes: '有时', always: '总是', never: '从不',
  here: '这里', there: '那里；（表示存在）', now: '现在',
  today: '今天', tomorrow: '明天', yesterday: '昨天',
  up: '向上', down: '向下', out: '向外', off: '离开；关掉',
  again: '又；再', only: '只；仅仅', just: '刚刚；只是', well: '好；嗯',
  please: '请', thanks: '谢谢', thank: '谢谢', hello: '你好', hi: '你好',
};

/**
 * 常见缩略式（ contractions）的小学生友好释义。
 * 教材里 I'm / What's / name's 等在词库中往往没有任何释义，这里统一兜底。
 */
export const CONTRACTION_GLOSS: Record<string, string> = {
  "i'm": '我是', "you're": '你是；你们是', "we're": '我们是', "they're": '他们是',
  "he's": '他是', "she's": '她是', "it's": '它是', "that's": '那是', "here's": '这是',
  "what's": '是什么', "where's": '在哪里', "who's": '是谁', "how's": '怎样', "name's": '名字是',
  "let's": '让我们',
  "i've": '我有', "we've": '我们有', "they've": '他们有',
  "i'll": '我会', "you'll": '你会', "we'll": '我们会', "they'll": '他们会',
  "don't": '不；不要', "doesn't": '不', "didn't": '没有',
  "isn't": '不是', "aren't": '不是', "wasn't": '不是（过去式）', "weren't": '不是（过去式）',
  "can't": '不能；不会', "couldn't": '不能', "won't": '不会', "wouldn't": '不会',
  "haven't": '没有', "hasn't": '没有', "hadn't": '没有', "mustn't": '禁止；不准',
};

export interface GlossOptions {
  /** 原词在句中首字母大写、且不是句首词、也不是 I —— 通常是人名/专有名词 */
  proper?: boolean;
}

/** 判断释义是否为词典残留 / 脏数据 */
export function isDirtyMeaning(s: string): boolean {
  if (!s) return true;
  return /\[域\]|\[军\]|Internal Security|\bIceland\b|\[计\]|\[医\]|\[网\]/i.test(s);
}

/**
 * 从一组中文释义中挑选最适合初学者的核心释义：
 * 先过滤脏数据，再选“列表项最少、字符最短”的干净释义。
 */
export function bestMeaning(meanings: Array<string | undefined | null>): string {
  const clean = (meanings.filter(Boolean) as string[])
    .map(s => s.trim())
    .filter(s => s && !isDirtyMeaning(s));
  if (clean.length === 0) {
    const any = (meanings.filter(Boolean) as string[]).map(s => s.trim()).filter(Boolean);
    return any[0] || '';
  }
  const score = (s: string) => {
    const parts = s.split(/[；;]/).filter(p => p.trim()).length;
    return parts * 100 + s.length;
  };
  return clean.reduce((a, b) => (score(b) < score(a) ? b : a), clean[0]);
}

/**
 * 计算某个单词在句中的释义，优先级：
 * 缩略式（I'm…） → 封闭类高频词内置释义 → 句中大写专有名词 → 最佳词库释义。
 */
export function glossForWord(
  wordLower: string,
  meanings: Array<string | undefined | null>,
  opts?: GlossOptions
): string {
  const key = wordLower.toLowerCase();
  if (CONTRACTION_GLOSS[key]) return CONTRACTION_GLOSS[key];
  if (FUNCTION_GLOSS[key]) return FUNCTION_GLOSS[key];
  if (opts?.proper) return '（人名/专有名词）';
  return bestMeaning(meanings);
}
