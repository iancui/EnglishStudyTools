import { GoogleGenAI } from '@google/genai';

export interface GeminiSentenceWord {
  text: string;
  pos: string;
  phoneticUk: string;
  phoneticUs: string;
  meaningCn: string;
}

export interface GeminiSentenceStep {
  content: string;
  translation: string;
  phonetic: string;
  type: 'WORD' | 'PHRASE' | 'STRUCTURE' | 'SENTENCE';
}

export interface GeminiSentenceAnalysis {
  text: string;
  startPosition: number;
  endPosition: number;
  type: string;
  explanation: string;
}

export interface GeminiSentenceResult {
  content: string;
  translation: string;
  level: string;
  difficulty: number;
  words: GeminiSentenceWord[];
  steps: GeminiSentenceStep[];
  analyses: GeminiSentenceAnalysis[];
}

const responseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      translation: { type: 'string' },
      level: { type: 'string' },
      difficulty: { type: 'integer' },
      words: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            pos: { type: 'string' },
            phoneticUk: { type: 'string' },
            phoneticUs: { type: 'string' },
            meaningCn: { type: 'string' }
          },
          required: ['text', 'pos', 'phoneticUk', 'phoneticUs', 'meaningCn']
        }
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            translation: { type: 'string' },
            phonetic: { type: 'string' },
            type: { type: 'string', enum: ['WORD', 'PHRASE', 'STRUCTURE', 'SENTENCE'] }
          },
          required: ['content', 'translation', 'phonetic', 'type']
        }
      },
      analyses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            startPosition: { type: 'integer' },
            endPosition: { type: 'integer' },
            type: { type: 'string' },
            explanation: { type: 'string' }
          },
          required: ['text', 'startPosition', 'endPosition', 'type', 'explanation']
        }
      }
    },
    required: ['content', 'translation', 'level', 'difficulty', 'words', 'steps', 'analyses']
  }
};

export class GeminiSentenceService {
  static async analyze(sentences: string[], model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'): Promise<GeminiSentenceResult[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('未配置 GEMINI_API_KEY，请先在服务器环境变量中配置 Gemini API Key');
    }

    const normalized = sentences.map(s => s.trim()).filter(Boolean);
    if (!normalized.length) {
      throw new Error('至少提供一个英文句子');
    }

    if (normalized.length > 50) {
      throw new Error('一次最多分析 50 个句子');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是 LinguaStep 的英语句子数据标注专家。
请处理下面的英文句子，返回严格 JSON 数组。

要求：
1. content 必须保留原英文句子的实际含义，不要改写原句。
2. translation 给出自然、准确、适合英语学习者的简体中文翻译。
3. level 使用 CEFR：A1/A2/B1/B2/C1/C2。
4. difficulty 为 1-5 的整数。
5. words 必须按照句子中实际出现的顺序逐词拆分。标点不要作为 word。
6. 每个 word 给出词性、英式/美式 IPA 和当前句子语境下最合适的中文含义。
7. words 的 meaningCn 必须是“当前句子语境中的准确中文含义”，不是孤立词典直译。特别注意 I=“我”、you=“你/你们”、it=“它/这件事”等代词，禁止把 I 翻译成“字母 i”。
8. steps 用于“渐进式句子学习”：必须包含有实际教学价值的 WORD/PHRASE 短步骤，每个步骤都必须填写自然、准确的中文 translation；最后必须有一个完整句子步骤，translation 必须与 sentence 的完整翻译一致或等价。不要只生成英文步骤而省略中文翻译。
9. sentence 的 translation 是完整自然中文译文；steps.translation 是对应短词、短语、结构和完整句子的中文译文，二者都必须完整返回。
10. analyses 标注重要的短语、语法结构或句法成分；startPosition/endPosition 使用 content 的 JavaScript 字符索引，endPosition 为排他位置。
11. 不要输出 Markdown，不要输出解释文字，只返回 JSON。
12. 输入句子可能有多个，请保持输入顺序。

待处理句子：
${normalized.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Gemini 没有返回有效结果');
    }

    let parsed: GeminiSentenceResult[];
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Gemini 返回的数据不是有效 JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Gemini 返回的数据格式错误');
    }

    return parsed;
  }
}
