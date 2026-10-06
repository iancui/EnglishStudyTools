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
  static previewPractice(difficulty: string = 'ALL', count: number = 5) {
    const all = db.getAllSentences();
    const diffUpper = (difficulty || 'ALL').toUpperCase();

    const matching = diffUpper === 'ALL'
      ? all
      : all.filter(s => s.level.toUpperCase() === diffUpper);

    return {
      difficulty: diffUpper,
      totalInDb: all.length,
      matchingCount: matching.length,
      requestedCount: count,
      effectiveCount: Math.min(count, matching.length)
    };
  }

  /**
   * Create and initialize a new Sentence Practice Session with a fixed sequence
   */
  static createSession(
    userId: string,
    params: {
      difficulty?: string;
      count?: number;
    }
  ) {
    const all = db.getAllSentences();
    if (all.length === 0) {
      throw new Error('句子库为空，无法开启练习');
    }

    const diffUpper = (params.difficulty || 'ALL').toUpperCase();
    let candidates = diffUpper === 'ALL'
      ? [...all]
      : all.filter(s => s.level.toUpperCase() === diffUpper);

    // If not enough or no matching, fallback to all sentences
    if (candidates.length === 0) {
      candidates = [...all];
    }

    // True Fisher-Yates shuffle to randomize once
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const requestedCount = Math.max(1, params.count || 5);
    const selected = candidates.slice(0, requestedCount);

    const nowStr = new Date().toISOString();
    const sessionId = `sps-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const session: SentencePracticeSession = {
      id: sessionId,
      userId,
      difficulty: diffUpper,
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

    db.createSentencePracticeSession(session, items);

    return db.findSentencePracticeSessionById(sessionId);
  }

  static getSessionById(sessionId: string, userId: string) {
    const session = db.findSentencePracticeSessionById(sessionId);
    if (!session) return null;
    if (session.userId !== userId) {
      throw new Error('无权访问该句子练习任务');
    }
    return session;
  }

  static getActiveSession(userId: string) {
    return db.getActiveSentencePracticeSession(userId) || null;
  }

  /**
   * Submit answer for a progressive phrase step
   */
  static submitPhraseAnswer(
    sessionId: string,
    userId: string,
    phraseIndex: number,
    answer: string
  ) {
    const session = db.findSentencePracticeSessionById(sessionId);
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

    db.updateSentencePracticeItem(currentItem);

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
  static submitRebuildAnswer(
    sessionId: string,
    userId: string,
    answer: string
  ) {
    const session = db.findSentencePracticeSessionById(sessionId);
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
    db.updateSentencePracticeItem(currentItem);

    // Save sentence progress and learning record
    db.saveSentenceProgress({
      id: `usp-${userId}-${currentItem.sentenceId}`,
      userId,
      sentenceId: currentItem.sentenceId,
      status: 'COMPLETED',
      currentStep: currentItem.sentence.steps.length,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    db.addLearningRecord({
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
      db.updateSentencePracticeSession(session);
    } else {
      sessionCompleted = true;
      session.status = 'COMPLETED';
      db.updateSentencePracticeSession(session);
    }

    // Return the persisted session as the single source of truth.
    // The frontend must receive the updated currentSentenceIndex/status,
    // especially for the final sentence where status becomes COMPLETED.
    const updatedSession = db.findSentencePracticeSessionById(sessionId);

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

  static cancelSession(sessionId: string, userId: string) {
    return db.cancelSentencePracticeSession(sessionId, userId);
  }
}
