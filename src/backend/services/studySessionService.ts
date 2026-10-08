import { db } from '../db/storage.ts';
import {
  StudySession,
  StudySessionWord,
  SessionMode,
  SessionSortMode,
  Word
} from '../types/index.ts';
import { WordProgressService } from './wordProgressService.ts';
import { ReviewService } from './reviewService.ts';
import { DictionaryService } from './dictionaryService.ts';

export class StudySessionService {
  /**
   * Preview matching words count for candidate session settings
   */
  static async previewSession(
    userId: string,
    params: { dictionaryId: string; chapterId?: string; count?: number; excludeMastered?: boolean; sortMode?: SessionSortMode }
  ) {
    const { dictionaryId, chapterId, count = 20, excludeMastered = true } = params;
    const preview = await db.getStudyPreview(dictionaryId, userId);
    if (!preview) throw new Error('辞书不存在');

    const totalInDict = Number(preview.total_in_dict || 0);
    const matchingCount = Number(preview.matching_count || 0);
    return {
      dictionaryId,
      dictionaryName: String(preview.dictionary_name || ''),
      totalInDict,
      matchingCount,
      requestedCount: count,
      excludedMasteredCount: Math.max(0, totalInDict - matchingCount),
      effectiveCount: Math.min(count, matchingCount)
    };
  }

  /**
   * Create and initialize a study session with a fixed word set or custom wordIds
   */
  static async createSession(
    userId: string,
    params: {
      dictionaryId?: string;
      chapterId?: string;
      wordIds?: string[];
      count?: number;
      excludeMastered?: boolean;
      sortMode?: SessionSortMode;
      mode?: SessionMode;
    }
  ) {
    let { dictionaryId } = params;
    const {
      wordIds,
      count = 20,
      excludeMastered = true,
      sortMode = 'RANDOM',
      mode = 'LEARN_AND_WRITE'
    } = params;

    let selected: { wordId: string; word: Word; sequence: number }[] = [];

    // Case 1: Specific wordIds provided (e.g. from WrongWordsView or selection from dictionary)
    if (wordIds && Array.isArray(wordIds) && wordIds.length > 0) {
      // Deduplicate wordIds
      const uniqueWordIds = Array.from(new Set(wordIds.filter(Boolean)));
      if (uniqueWordIds.length === 0) {
        throw new Error('未选择任何有效单词');
      }

      const foundWords: { wordId: string; word: Word; sequence: number }[] = [];
      for (const [idx, wid] of uniqueWordIds.entries()) {
        const w = await db.findWordById(wid);
        if (w) foundWords.push({ wordId: wid, word: w, sequence: idx + 1 });
      }

      if (foundWords.length === 0) {
        throw new Error('所选单词均不存在');
      }

      selected = foundWords;
      if (!dictionaryId) {
        const config = await DictionaryService.getConfig(userId);
        dictionaryId = config.defaultDictionaryId || 'dict-primary-6';
      }
    } else {
      if (!dictionaryId) {
        const config = await DictionaryService.getConfig(userId);
        dictionaryId = config.defaultDictionaryId || 'dict-primary-6';
      }

      const dict = await db.findDictionaryById(dictionaryId);
      if (!dict) throw new Error('所选辞书不存在');

      const candidateRows = await db.getStudyCandidates(
        dictionaryId,
        userId,
        excludeMastered,
        sortMode,
        Math.max(1, count),
        chapterId
      );
      if (!candidateRows.length) {
        throw new Error('该辞书中没有符合条件的单词');
      }

      const wordIds = candidateRows.map((r: any) => String(r.word_id));
      const wordsById = new Map(
        (await db.getWordsByIds(wordIds)).map(w => [w.id, w])
      );

      selected = candidateRows
        .map((r: any, idx: number) => {
          const word = wordsById.get(String(r.word_id));
          return word ? { wordId: String(r.word_id), word, sequence: idx + 1 } : null;
        })
        .filter(Boolean) as { wordId: string; word: Word; sequence: number }[];
    }

    const nowStr = new Date().toISOString();
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const session: StudySession = {
      id: sessionId,
      userId,
      mode,
      dictionaryId,
      totalCount: selected.length,
      completedCount: 0,
      excludeMastered,
      sortMode,
      status: 'IN_PROGRESS',
      currentWordIndex: 0,
      startedAt: nowStr,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const isWriteOnly = mode === 'WRITE_ONLY';

    const sessionWords: StudySessionWord[] = selected.map((item, idx) => ({
      id: `sw-${sessionId}-${idx + 1}`,
      sessionId,
      wordId: item.wordId,
      sequence: idx + 1,
      learnStatus: isWriteOnly ? 'LEARNED' : 'LEARN_PENDING',
      writeStatus: 'WRITE_PENDING',
      completed: false,
      isCorrect: null,
      userInput: null,
      createdAt: nowStr,
      word: item.word
    }));

    await db.createStudySession(session, sessionWords);

    return await this.getSessionById(sessionId, userId);
  }

  /**
   * Get session details with decorated words and dictionary info
   */
  static async getSessionById(sessionId: string, userId: string) {
    const session = await db.findStudySessionById(sessionId);
    if (!session) return null;
    if (session.userId !== userId) {
      throw new Error('无权访问该学习任务');
    }

    const config = await DictionaryService.getConfig(userId);

    // Decorate words with dictionary preferences
    const decoratedWords = await Promise.all(session.words.map(async sw => {
      const fullWord = sw.word || await db.findWordById(sw.wordId);
      const decorated = fullWord ? await DictionaryService.applyWordDictionaryConfig(fullWord, config) : null;
      return {
        ...sw,
        word: decorated
      };
    }));

    return {
      ...session,
      words: decoratedWords
    };
  }

  /**
   * Get active ongoing session for resumption
   */
  static async getActiveSession(userId: string) {
    const session = await db.getActiveSessionByUserId(userId);
    if (!session) return null;
    return await this.getSessionById(session.id, userId);
  }

  /**
   * Complete Learn step of a word in session (Step 1 -> Step 2)
   */
  static async markWordLearned(sessionId: string, wordId: string, userId: string) {
    const session = await db.findStudySessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('学习任务不存在');

    const sw = session.words.find(w => w.wordId === wordId);
    if (!sw) throw new Error('单词不属于此任务');

    const now = new Date().toISOString();
    sw.learnStatus = 'LEARNED';
    sw.learnedAt = now;
    sw.writeStatus = 'WRITE_PENDING';

    await db.updateStudySessionWord(sw);

    // Update word progress in db
    let progress = await db.getWordProgress(userId, wordId);
    if (!progress) {
      progress = {
        id: `p-${Date.now()}`,
        userId,
        wordId,
        status: 'LEARNING',
        learnCount: 1,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        mastery: 20,
        lastLearnAt: now,
        nextReviewAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now
      };
    } else {
      progress.learnCount += 1;
      progress.lastLearnAt = now;
    }
    await db.saveWordProgress(progress);

    // Record the learning action immediately so "学习记录" reflects
    // the Learn step even before the user finishes the spelling step.
    await db.addLearningRecord({
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      itemType: 'WORD',
      itemId: wordId,
      action: 'LEARN',
      isCorrect: true,
      inputText: undefined,
      timeSpentSec: 0,
      createdAt: now
    });

    return sw;
  }

  /**
   * Complete Write step of a word in session (Step 2 -> Word Completed)
   */
  static async writeWord(
    sessionId: string,
    wordId: string,
    userId: string,
    rawInput: string,
    timeSpentSec = 5
  ) {
    const session = await db.findStudySessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('学习任务不存在');

    const sw = session.words.find(w => w.wordId === wordId);
    if (!sw) throw new Error('单词不属于此任务');

    const word = await db.findWordById(wordId);
    if (!word) throw new Error('单词数据不存在');

    const cleanInput = (rawInput || '').trim().toLowerCase();
    const expected = word.text.trim().toLowerCase();
    const isCorrect = cleanInput === expected;

    const now = new Date().toISOString();
    sw.userInput = rawInput;

    if (isCorrect) {
      sw.writeStatus = 'WRITTEN';
      sw.completed = true;
      sw.isCorrect = true;
      sw.writtenAt = now;
    } else {
      sw.writeStatus = 'WRITE_PENDING';
      sw.completed = false;
      sw.isCorrect = false;
    }

    await db.updateStudySessionWord(sw);

    // Update ReviewService & spaced repetition record
    const updatedProgress = await ReviewService.processReview(userId, wordId, isCorrect);

    // Save learning record
    await db.addLearningRecord({
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      itemType: 'WORD',
      itemId: wordId,
      action: 'MEMORIZE',
      isCorrect,
      inputText: rawInput,
      timeSpentSec,
      createdAt: now
    });

    // Check session progress strictly based on completed words
    const freshSession = await db.findStudySessionById(sessionId);
    const completedWordsCount = freshSession
      ? freshSession.words.filter(w => w.completed).length
      : session.words.filter(w => w.completed).length;

    session.completedCount = completedWordsCount;

    if (completedWordsCount >= session.totalCount && session.totalCount > 0) {
      session.status = 'COMPLETED';
      session.completedAt = now;
    } else {
      session.status = 'IN_PROGRESS';
      delete (session as any).completedAt;
    }

    await db.updateStudySession(session);

    return {
      isCorrect,
      userInput: rawInput,
      correctAnswer: word.text,
      phonetic: word.phoneticUk,
      meanings: word.meanings,
      sessionWord: sw,
      sessionCompleted: session.status === 'COMPLETED',
      completedCount: session.completedCount,
      totalCount: session.totalCount,
      progress: updatedProgress
    };
  }

  /**
   * Advance current word index in the session
   */
  static async nextWord(sessionId: string, userId: string) {
    const session = await db.findStudySessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('学习任务不存在');

    const currentWord = session.words[session.currentWordIndex];
    if (currentWord && !currentWord.completed) {
      throw new Error('当前单词尚未拼写正确，不能进入下一个单词');
    }

    if (session.currentWordIndex < session.totalCount - 1) {
      session.currentWordIndex += 1;
      await db.updateStudySession(session);
    }

    return session;
  }

  /**
   * Cancel an in-progress session
   */
  static async cancelSession(sessionId: string, userId: string) {
    const session = await db.findStudySessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('学习任务不存在');

    session.status = 'CANCELLED';
    await db.updateStudySession(session);
    return session;
  }
}
