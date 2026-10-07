import { db } from '../db/storage.ts';
import {
  SentencePracticeSession,
  SentencePracticeItem,
  Sentence
} from '../types/index.ts';
import { checkSentenceAnswer, extractSentencePhrases } from '../utils/sentenceUtils.ts';

export class SentencePracticeService {
  /**
   * Preview matching sentences count for difficulty filter
   */
  static async previewPractice(userId: string, dictionaryId?: string) {
    const config = await db.getDictionaryConfig(userId);
    const count = Math.max(1, config.sentencePracticeCount || 5);
    const all = await db.getAllSentences();
    const dict = dictionaryId ? await db.findDictionaryById(dictionaryId) : undefined;
    const dictWordSet = new Set(
      dictionaryId
        ? await db.getDictionaryWords(dictionaryId)
            .map(dw => dw.word?.text?.toLowerCase())
            .filter(Boolean) as string[]
        : []
    );

    const matching = dictionaryId && dictWordSet.size > 0
      ? all.filter(s => {
          const words = s.content.toLowerCase().match(/[a-z']+/g) || [];
          return words.some(w => dictWordSet.has(w));
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
    }
  ) {
    const all = await db.getAllSentences();
    if (all.length === 0) {
      throw new Error('句子库为空，无法开启练习');
    }

    const dictionaryId = params.dictionaryId;
    const dictWordSet = new Set(
      dictionaryId
        ? await db.getDictionaryWords(dictionaryId)
            .map(dw => dw.word?.text?.toLowerCase())
            .filter(Boolean) as string[]
        : []
    );

    let candidates = [...all];

    if (dictionaryId && dictWordSet.size > 0) {
      candidates = candidates.filter(s => {
        const words = s.content.toLowerCase().match(/[a-z']+/g) || [];
        return words.some(w => dictWordSet.has(w));
      });
    }

    // 选择了词库时严格按词库筛选；没有匹配句子就不能偷偷回退到全库，
    // 否则用户会感觉“选择词库”没有生效。
    if (candidates.length === 0) {
      if (dictionaryId) {
        throw new Error('当前词库下没有符合条件的句子，请更换词库或调整练习数量');
      }
      throw new Error('当前条件下没有可练习的句子');
    }

    // True Fisher-Yates shuffle to randomize once
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const config = await db.getDictionaryConfig(userId);
    const requestedCount = Math.max(1, config.sentencePracticeCount || 5);
    const selected = candidates.slice(0, requestedCount);

    const nowStr = new Date().toISOString();
    const sessionId = `sps-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const session: SentencePracticeSession = {
      id: sessionId,
      userId,
      difficulty: 'ALL',
      dictionaryId,
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

    return await db.findSentencePracticeSessionById(sessionId);
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
        return await db.findSentencePracticeSessionById(sessionId);
      }
    }

    return session;
  }

  static async getActiveSession(userId: string) {
    return await db.getActiveSentencePracticeSession(userId) || null;
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
      id: `usp-${userId}-${currentItem.sentenceId}`,
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

    return {
      isCorrect: true,
      userInput: cleanInput,
      expectedAnswer: currentItem.sentence.content,
      sentenceCompleted: true,
      sessionCompleted,
      nextSentenceIndex,
      message: '✓ 完成句子重建',
      session: updatedSession
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

    return await db.findSentencePracticeSessionById(sessionId);
  }

  static async cancelSession(sessionId: string, userId: string) {
    return await db.cancelSentencePracticeSession(sessionId, userId);
  }
}
