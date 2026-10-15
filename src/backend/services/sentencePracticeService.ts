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
  static async previewPractice(userId: string, dictionaryId?: string, chapterId?: string) {
    const config = await db.getDictionaryConfig(userId);
    const count = Math.max(1, config.sentencePracticeCount || 5);
    const all: Sentence[] = await db.getAllSentences();
    const dict = dictionaryId ? await db.findDictionaryById(dictionaryId) : undefined;

    // Match the real session-selection rules: dictionary membership and the
    // explicitly selected chapter, rather than guessing membership by shared words.
    let matching = all;
    if (dictionaryId) {
      const rows = await db.getDictionarySentences(dictionaryId);
      const filtered = chapterId
        ? rows.filter((row: any) => String(row.chapter_id || '') === chapterId)
        : rows;
      const ids = new Set(filtered.map((row: any) => String(row.sentence_id)));
      matching = all.filter(sentence => ids.has(String(sentence.id)));
    }

    return {
      dictionaryId,
      dictionaryName: dict?.name,
      chapterId,
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
    // undefined means "use saved preference"; an explicit empty string means
    // "all chapters" and must not fall back to the saved chapter.
    let chapterId = params.chapterId !== undefined
      ? (params.chapterId || undefined)
      : cfgForChapter.sentenceChapterId;

    // 防御：切换到没有单元的词库后，配置里可能仍残留上一个词库的单元 id。
    // 若不校验就会筛出 0 条候选句子并直接报错（首页点击“开始学句子”看起来毫无反应）。
    // 单元不属于当前词库时，按整本词库处理。
    if (dictionaryId && chapterId) {
      const chapters = await db.getDictionaryChapters(dictionaryId);
      if (!chapters.some(c => c.id === chapterId)) {
        chapterId = undefined;
      }
    }

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

    // 学习会话只挑「从未学过」的句子（没有 user_sentence_progress 记录），
    // 按单元内的顺序取下一批；复习与掌握的调度由复习页面负责，不再混入旧句。
    const learnedIds = new Set(await db.getLearnedSentenceIds(userId));
    const selected = candidates
      .filter(s => !learnedIds.has(String(s.id)))
      .slice(0, requestedCount);

    if (selected.length === 0) {
      throw new Error(dictionaryId
        ? '本单元句子已全部学过，暂无可学习的新句子'
        : '当前条件下没有可学习的句子');
    }

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

    // 完成一次整句输入只代表本次学习/复习完成，不代表已经掌握。
    // 首次学完进入 LEARNING；已有进度的句子每次复习答对记一次 REVIEW，
    // 累计 3 次正确复习后才标记 MASTERED。旧版 COMPLETED 会自然进入待复习队列。
    const previousProgress = await db.getSentenceProgress(userId, currentItem.sentenceId);
    const isReviewAttempt = !!previousProgress;
    const successfulReviews = previousProgress && previousProgress.status !== 'MASTERED'
      ? await db.getSentenceReviewSuccessCount(userId, currentItem.sentenceId)
      : 0;
    const nextStatus = previousProgress?.status === 'MASTERED'
      ? 'MASTERED'
      : (isReviewAttempt && successfulReviews + 1 >= 3 ? 'MASTERED' : 'LEARNING');
    const completedAt = new Date().toISOString();

    const sentenceProgress = {
      id: `usp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      sentenceId: currentItem.sentenceId,
      status: nextStatus,
      currentStep: currentItem.sentence.steps.length,
      completedAt,
      createdAt: completedAt,
      updatedAt: completedAt
    };
    await db.saveSentenceProgress(sentenceProgress);
    if (session.dictionaryId) {
      // When learning across the whole dictionary, attribute this sentence to its
      // actual unit instead of the empty "all units" scope.
      const progressChapterId = session.chapterId
        || await db.getSentenceChapterId(currentItem.sentenceId, session.dictionaryId);
      await db.saveSentenceChapterProgress(sentenceProgress, session.dictionaryId, progressChapterId);
    }

    await db.addLearningRecord({
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      itemType: 'SENTENCE',
      itemId: currentItem.sentenceId,
      action: isReviewAttempt ? 'REVIEW' : 'LEARN',
      isCorrect: true,
      inputText: cleanInput,
      timeSpentSec: 8,
      createdAt: completedAt
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
