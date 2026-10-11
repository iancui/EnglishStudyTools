import { db } from '../db/storage.ts';
import {
  SentencePracticeSession,
  SentencePracticeItem,
  Sentence
} from '../types/index.ts';
import { checkSentenceAnswer, extractSentencePhrases } from '../utils/sentenceUtils.ts';
import {
  buildProgressiveChunks,
  providersFromMaps,
  ChunkOptions
} from '../utils/sentenceChunks.ts';

export class SentencePracticeService {
  /**
   * Preview matching sentences count for difficulty filter
   */
  static async previewPractice(userId: string, dictionaryId?: string) {
    const config = await db.getDictionaryConfig(userId);
    const count = Math.max(1, config.sentencePracticeCount || 5);
    const all: Sentence[] = await db.getAllSentences();
    const dict = dictionaryId ? await db.findDictionaryById(dictionaryId) : undefined;
    const dictWordSet = new Set(
      dictionaryId
        ? (await db.getDictionaryWords(dictionaryId))
            .map(dw => dw.word?.text?.toLowerCase())
            .filter(Boolean) as string[]
        : []
    );

    const matching = dictionaryId && dictWordSet.size > 0
      ? all.filter(s => {
          const words = s.content.toLowerCase().match(/[a-z']+/g) || [];
          return words.some((w: string) => dictWordSet.has(w));
        })
      : all;

    return {
      dictionaryId,
      dictionaryName: dict?.name,
      totalInDb: all.length,
      matchingCount: matching.length,
      requestedCount: count,
      effectiveCount: Math.min(count, matching.length)
    };
  }

  /**
   * Create and initialize a new Sentence Practice Session with a fixed sequence
   */
  static async createSession(
    userId: string,
    params: {
      dictionaryId?: string;
      chapterId?: string;
    }
  ) {
    // 辞书/单元优先使用调用方指定；没传则用用户配置里选定的辞书与单元
    const cfgForChapter = await db.getDictionaryConfig(userId);
    const dictionaryId = params.dictionaryId || cfgForChapter.sentenceDictionaryId;
    const chapterId = params.chapterId || cfgForChapter.sentenceChapterId;

    // 只加载本辞书（单元）的句子，避免全库 N+1 查询拖慢开始学习
    let candidates: Sentence[] = [];
    if (dictionaryId) {
      const dictionarySentences = await db.getDictionarySentences(dictionaryId);
      const filtered = chapterId
        ? dictionarySentences.filter(r => String(r.chapter_id || '') === chapterId)
        : dictionarySentences;
      const ids = filtered.map(r => String(r.sentence_id));
      // 按辞书排序去重后批量取详情
      const uniqueIds = [...new Set(ids)];
      const fetched = (await db.getSentencesByIds(uniqueIds)).filter(Boolean) as Sentence[];
      const byId = new Map(fetched.map((s: Sentence) => [String(s.id), s]));
      candidates = uniqueIds.map(id => byId.get(id)).filter(Boolean) as Sentence[];
    } else {
      candidates = await db.getAllSentences();
    }

    if (candidates.length === 0) {
      if (dictionaryId) {
        throw new Error('当前词库下没有符合条件的句子，请更换词库或调整练习数量');
      }
      throw new Error('当前条件下没有可练习的句子');
    }

    const requestedCount = Math.max(1, cfgForChapter.sentencePracticeCount || 5);

    // 优先选取用户未学过的句子；未学过的不足时，再按顺序从已学过的里补充，
    // 保证每次“再次学习”都能拿到新句子，而不是永远重复前 N 句。
    const learnedIds = new Set(await db.getLearnedSentenceIds(userId));
    const unlearned = candidates.filter(s => !learnedIds.has(String(s.id)));
    const learned = candidates.filter(s => learnedIds.has(String(s.id)));
    const selected = [...unlearned, ...learned].slice(0, requestedCount);

    const nowStr = new Date().toISOString();
    const sessionId = `sps-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const session: SentencePracticeSession = {
      id: sessionId,
      userId,
      difficulty: 'ALL',
      dictionaryId,
      chapterId,
      totalCount: selected.length,
      currentSentenceIndex: 0,
      status: 'IN_PROGRESS',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const items: SentencePracticeItem[] = selected.map((s, idx) => ({
      id: `spi-${sessionId}-${idx + 1}`,
      sessionId,
      sentenceId: s.id,
      sequence: idx + 1,
      // 当前产品的“学语句”页面直接进行完整句子输入，
      // 因此前后端统一从 REBUILD 阶段开始，不再先进入短语练习。
      currentPhase: 'REBUILD',
      currentPhraseIndex: 0,
      completed: false,
      createdAt: nowStr,
      updatedAt: nowStr
    }));

    await db.createSentencePracticeSession(session, items);

    const created = await db.findSentencePracticeSessionById(sessionId);
    return await SentencePracticeService.attachChunks(created!, userId);
  }

  /**
   * 根据用户配置，为会话中的每个句子生成“雪球式渐进块”：
   * 学习时从第一块开始逐块累加，最终得到完整句子。
   */
  private static async attachChunks(
    session: SentencePracticeSession,
    userId: string
  ): Promise<SentencePracticeSession> {
    if (!session || !session.items) return session;

    const config = await db.getDictionaryConfig(userId);
    const wantUk = (config.phoneticType || 'UK') === 'UK';
    // 统一按意群（PHRASE）切分：一次输入一个 2~4 词的意群，最后再输入整句。
    const opts: ChunkOptions = {
      granularity: 'PHRASE',
      fixedSize: config.sentenceChunkSize || 2,
    };

    // 一次性取出本会话所有单词（含释义/音标）
    const allWids = new Set<string>();
    for (const item of session.items) {
      for (const w of item.sentence?.words || []) {
        if (w.wordId) allWids.add(String(w.wordId));
      }
    }
    const fullWords = await db.getWordsByIds([...allWids]);
    const wordById = new Map(fullWords.map(w => [String(w.id), w]));

    for (const item of session.items) {
      const s = item.sentence;
      if (!s) continue;

      // 位置（0 基）→ wordId
      const wordIdAt = new Map<number, string>();
      (s.words || []).forEach(w => {
        wordIdAt.set((Number(w.position) || 1) - 1, String(w.wordId));
      });

      const meaningsByWordId = new Map<string, string[]>();
      const phoneticByWordId = new Map<string, string>();
      for (const wid of wordIdAt.values()) {
        const w = wordById.get(wid);
        if (!w) continue;
        meaningsByWordId.set(wid, w.meanings.map(m => m.definitionCn));
        phoneticByWordId.set(
          wid,
          wantUk ? w.phoneticUk || '' : w.phoneticUs || w.phoneticUk || ''
        );
      }

      const providers = providersFromMaps(
        pos => wordIdAt.get(pos),
        meaningsByWordId,
        phoneticByWordId
      );

      item.chunks = buildProgressiveChunks(s.content, opts, providers);
    }

    return session;
  }

  static async getSessionById(sessionId: string, userId: string) {
    const session = await db.findSentencePracticeSessionById(sessionId);
    if (!session) return null;
    if (session.userId !== userId) {
      throw new Error('无权访问该句子练习任务');
    }

    // 兼容此前已经创建的 PHRASE 会话：当前页面已经统一为“整句输入”，
    // 因此打开旧会话时自动切换当前句到 REBUILD，避免前端提交整句却被后端按短语校验。
    if (session.status === 'IN_PROGRESS') {
      const currentItem = session.items?.[session.currentSentenceIndex];
      if (currentItem && currentItem.currentPhase === 'PHRASE') {
        currentItem.currentPhase = 'REBUILD';
        currentItem.currentPhraseIndex = 0;
        await db.updateSentencePracticeItem(currentItem);
      }
    }

    // 统一附加按用户配置生成的渐进块，前端据此进行雪球式学习
    return await SentencePracticeService.attachChunks(session, userId);
  }

  static async getActiveSession(userId: string, chapterId?: string) {
    // 传 chapterId（可为 '' 表示无单元）时只返回该辞书+单元的进行中会话，
    // 支持多个单元各自保留学习进度
    let filter: { dictionaryId?: string; chapterId?: string } | undefined;
    if (chapterId !== undefined) {
      const cfg = await db.getDictionaryConfig(userId);
      filter = { dictionaryId: cfg.sentenceDictionaryId, chapterId };
    }
    const session = await db.getActiveSentencePracticeSession(userId, filter) || null;
    if (session && !session.chapterId) {
      // 兼容旧会话：按当前句子的章节补标注
      const current = session.items?.[session.currentSentenceIndex] || session.items?.[0];
      if (current?.sentenceId && session.dictionaryId) {
        session.chapterId = await db.getSentenceChapterId(current.sentenceId, session.dictionaryId);
      }
    }
    return session;
  }

  /**
   * Submit answer for a progressive phrase step
   */
  static async submitPhraseAnswer(
    sessionId: string,
    userId: string,
    phraseIndex: number,
    answer: string
  ) {
    const session = await db.findSentencePracticeSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('句子练习任务不存在');
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new Error('该练习任务已结束');
    }

    const currentItem = session.items[session.currentSentenceIndex];
    if (!currentItem) {
      throw new Error('未找到当前句子练习项');
    }

    if (currentItem.currentPhase !== 'PHRASE') {
      throw new Error('当前阶段不是短语练习');
    }

    const phrases = currentItem.phrases || [];
    const targetPhrase = phrases[phraseIndex];
    if (!targetPhrase) {
      throw new Error('短语不存在');
    }

    const cleanInput = (answer || '').trim();
    if (!cleanInput) {
      throw new Error('请输入英文短语答案');
    }

    const isCorrect = checkSentenceAnswer(cleanInput, targetPhrase.english);

    if (!isCorrect) {
      return {
        isCorrect: false,
        userInput: cleanInput,
        expectedAnswer: targetPhrase.english,
        phonetic: targetPhrase.phonetic,
        message: '❌ 再试一次'
      };
    }

    // Correct! Advance phrase or switch to REBUILD
    let nextPhase: 'PHRASE' | 'REBUILD' = 'PHRASE';
    let nextPhraseIndex = phraseIndex;

    if (phraseIndex < phrases.length - 1) {
      nextPhraseIndex = phraseIndex + 1;
      currentItem.currentPhraseIndex = nextPhraseIndex;
    } else {
      nextPhase = 'REBUILD';
      currentItem.currentPhase = 'REBUILD';
      currentItem.currentPhraseIndex = phrases.length - 1;
    }

    await db.updateSentencePracticeItem(currentItem);

    return {
      isCorrect: true,
      userInput: cleanInput,
      expectedAnswer: targetPhrase.english,
      phonetic: targetPhrase.phonetic,
      nextPhase,
      nextPhraseIndex,
      message: '✓ 正确'
    };
  }

  /**
   * Submit answer for the full sentence rebuild step
   */
  static async submitRebuildAnswer(
    sessionId: string,
    userId: string,
    answer: string
  ) {
    const session = await db.findSentencePracticeSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('句子练习任务不存在');
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new Error('该练习任务已结束');
    }

    const currentItem = session.items[session.currentSentenceIndex];
    if (!currentItem || !currentItem.sentence) {
      throw new Error('未找到当前句子练习项');
    }

    if (currentItem.currentPhase !== 'REBUILD') {
      throw new Error('当前阶段不是完整句子重建');
    }

    const cleanInput = (answer || '').trim();
    if (!cleanInput) {
      throw new Error('请输入完整英文句子');
    }

    const isCorrect = checkSentenceAnswer(cleanInput, currentItem.sentence.content);

    if (!isCorrect) {
      return {
        isCorrect: false,
        userInput: cleanInput,
        expectedAnswer: currentItem.sentence.content,
        message: '❌ 再试一次'
      };
    }

    // Rebuild is correct! Mark current sentence item completed
    currentItem.currentPhase = 'COMPLETED';
    currentItem.completed = true;
    await db.updateSentencePracticeItem(currentItem);

    // Save sentence progress and learning record
    await db.saveSentenceProgress({
      id: `usp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      sentenceId: currentItem.sentenceId,
      status: 'COMPLETED',
      currentStep: currentItem.sentence.steps.length,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.addLearningRecord({
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      itemType: 'SENTENCE',
      itemId: currentItem.sentenceId,
      action: 'STEP_COMPLETE',
      isCorrect: true,
      inputText: cleanInput,
      timeSpentSec: 8,
      createdAt: new Date().toISOString()
    });

    let sessionCompleted = false;
    let nextSentenceIndex = session.currentSentenceIndex;

    if (session.currentSentenceIndex < session.totalCount - 1) {
      nextSentenceIndex = session.currentSentenceIndex + 1;
      session.currentSentenceIndex = nextSentenceIndex;
      await db.updateSentencePracticeSession(session);
    } else {
      sessionCompleted = true;
      session.status = 'COMPLETED';
      await db.updateSentencePracticeSession(session);
    }

    // Return the persisted session as the single source of truth.
    // The frontend must receive the updated currentSentenceIndex/status,
    // especially for the final sentence where status becomes COMPLETED.
    const updatedSession = await db.findSentencePracticeSessionById(sessionId);
    // 重要：返回的会话也要附加渐进块，否则前端进入下一句时拿不到 chunks。
    const sessionWithChunks = await SentencePracticeService.attachChunks(updatedSession!, userId);

    return {
      isCorrect: true,
      userInput: cleanInput,
      expectedAnswer: currentItem.sentence.content,
      sentenceCompleted: true,
      sessionCompleted,
      nextSentenceIndex,
      message: '✓ 完成句子重建',
      session: sessionWithChunks
    };
  }

  /**
   * Reset the sentence that was just completed so the user can practice
   * the same sentence again without advancing the session.
   */
  static async retryCurrentSentence(sessionId: string, userId: string) {
    const session = await db.findSentencePracticeSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('句子练习任务不存在');
    }

    const retryIndex = session.status === 'COMPLETED'
      ? session.totalCount - 1
      : Math.max(0, session.currentSentenceIndex - 1);
    const item = session.items?.[retryIndex];
    if (!item) {
      throw new Error('未找到可重做的句子');
    }

    session.currentSentenceIndex = retryIndex;
    session.status = 'IN_PROGRESS';
    item.currentPhase = 'REBUILD';
    item.currentPhraseIndex = 0;
    item.completed = false;
    item.updatedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    await db.updateSentencePracticeItem(item);
    await db.updateSentencePracticeSession(session);

    const retried = await db.findSentencePracticeSessionById(sessionId);
    return await SentencePracticeService.attachChunks(retried!, userId);
  }

  static async cancelSession(sessionId: string, userId: string) {
    return await db.cancelSentencePracticeSession(sessionId, userId);
  }
}
