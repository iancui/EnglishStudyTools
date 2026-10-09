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
      writeSortMode?: 'RANDOM' | 'SEQUENCE';
      dictationSortMode?: 'RANDOM' | 'SEQUENCE';
      includeWrite?: boolean;
      includeDictation?: boolean;
      mode?: SessionMode;
    }
  ) {
    let { dictionaryId } = params;
    const {
      wordIds,
      chapterId,
      count = 20,
      excludeMastered = true,
      sortMode = 'RANDOM',
      writeSortMode = 'SEQUENCE',
      dictationSortMode = 'RANDOM',
      includeWrite = true,
      includeDictation = true,
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
          return word ? { wordId: String(r.word_id), word, sequence: Number(r.sequence_no || idx + 1) } : null;
        })
        .filter(Boolean) as { wordId: string; word: Word; sequence: number }[];
    }

    // The batch selection rule decides WHICH words enter the batch;
    // the write-order setting decides the presentation order inside the batch.
    if (writeSortMode === 'RANDOM') {
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
    } else {
      selected.sort((a, b) => a.sequence - b.sequence);
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
      writeSortMode,
      dictationSortMode,
      includeWrite: mode === 'WRITE_ONLY' ? false : includeWrite,
      includeDictation: mode === 'WRITE_ONLY' ? true : includeDictation,
      phase: mode === 'WRITE_ONLY' ? 'DICTATION' : 'LEARN_WRITE',
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

    if (mode === 'WRITE_ONLY') {
      return await db.startStudyDictationPhase(sessionId, dictationSortMode);
    }

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
      sessionId,
      phase: session.phase,
      itemType: 'WORD',
      itemId: wordId,
      action: 'LEARN',
      isCorrect: true,
      inputText: undefined,
      timeSpentSec: 0,
      createdAt: now
    });

    // If 背写 is disabled, 学习阶段直接进入下一阶段。
    if (!session.includeWrite) {
      const freshSession = await db.findStudySessionById(sessionId);
      const allLearned = freshSession
        ? freshSession.words.every(w => w.learnStatus === 'LEARNED')
        : false;

      if (allLearned && session.includeDictation) {
        const nextSession = await db.startStudyDictationPhase(
          session.id,
          session.dictationSortMode || 'RANDOM'
        );
        return {
          sessionWord: sw,
          phaseChanged: true,
          sessionCompleted: false,
          sessionPhase: nextSession?.phase || 'DICTATION',
          session: await this.getSessionById(session.id, userId)
        };
      }

      if (allLearned && !session.includeDictation) {
        const completedNow = new Date().toISOString();
        if (freshSession) {
          for (const item of freshSession.words) {
            if (!item.completed) {
              item.completed = true;
              item.writeStatus = 'WRITTEN';
              item.isCorrect = true;
              await db.updateStudySessionWord(item);
            }
          }
          freshSession.completedCount = freshSession.totalCount;
          freshSession.status = 'COMPLETED';
          freshSession.completedAt = completedNow;
          await db.updateStudySession(freshSession);
        }
        return {
          sessionWord: sw,
          phaseChanged: false,
          sessionCompleted: true,
          sessionPhase: 'LEARN_WRITE',
          session: await this.getSessionById(session.id, userId)
        };
      }

      if (freshSession && freshSession.currentWordIndex < freshSession.totalCount - 1) {
        freshSession.currentWordIndex += 1;
        freshSession.updatedAt = new Date().toISOString();
        await db.updateStudySession(freshSession);
      }

      return {
        sessionWord: sw,
        phaseChanged: false,
        sessionCompleted: false,
        sessionPhase: 'LEARN_WRITE',
        session: await this.getSessionById(session.id, userId)
      };
    }

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
      sw.wrongAttemptCount = (sw.wrongAttemptCount || 0) + 1;
    }

    await db.updateStudySessionWord(sw);

    // Update ReviewService & spaced repetition record
    const updatedProgress = await ReviewService.processReview(userId, wordId, isCorrect);

    // Save learning record
    await db.addLearningRecord({
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      sessionId,
      phase: session.phase,
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

    let phaseChanged = false;
    let nextSession: any = null;

    if (completedWordsCount >= session.totalCount && session.totalCount > 0) {
      if (session.phase === 'LEARN_WRITE' && session.mode === 'LEARN_AND_WRITE' && session.includeDictation) {
        // The learning/write stage is complete. Keep the same wordIds and
        // immediately enter the reinforcement dictation stage when enabled.
        nextSession = await db.startStudyDictationPhase(
          session.id,
          session.dictationSortMode || 'RANDOM'
        );
        phaseChanged = true;
      } else {
        session.status = 'COMPLETED';
        session.completedAt = now;
        await db.updateStudySession(session);
        nextSession = await this.getSessionById(session.id, userId);
      }
    } else {
      session.status = 'IN_PROGRESS';
      delete (session as any).completedAt;
      await db.updateStudySession(session);
      nextSession = await this.getSessionById(session.id, userId);
    }

    return {
      isCorrect,
      userInput: rawInput,
      correctAnswer: word.text,
      phonetic: word.phoneticUk,
      meanings: word.meanings,
      sessionWord: sw,
      sessionCompleted: nextSession?.status === 'COMPLETED',
      phaseChanged,
      sessionPhase: nextSession?.phase || session.phase,
      completedCount: nextSession?.completedCount ?? session.completedCount,
      totalCount: nextSession?.totalCount ?? session.totalCount,
      progress: updatedProgress,
      session: nextSession
    };
  }

  /**
   * Advance to the next unfinished word. Deferred wrong answers are moved to
   * the end of the active phase queue, but completed words are never repeated.
   */
  static async nextWord(sessionId: string, userId: string) {
    const session = await db.findStudySessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('学习任务不存在');

    const currentWord = session.words[session.currentWordIndex];
    if (!currentWord) throw new Error('当前单词不存在');

    const oldIndex = session.currentWordIndex;
    if (!currentWord.completed) {
      await db.rotateStudySessionWordToEnd(sessionId, currentWord.wordId, session.phase);
    }

    const freshSession = await db.findStudySessionById(sessionId);
    if (!freshSession) throw new Error('学习任务不存在');

    // After a rotation, the word now occupying oldIndex is the next queued
    // item. If no unfinished word follows it, wrap to the first unfinished.
    const startAt = currentWord.completed ? oldIndex + 1 : oldIndex;
    let nextIndex = freshSession.words.findIndex((word, index) => index >= startAt && !word.completed);
    if (nextIndex < 0) nextIndex = freshSession.words.findIndex(word => !word.completed);

    if (nextIndex < 0) {
      freshSession.completedCount = freshSession.totalCount;
      freshSession.status = 'COMPLETED';
      freshSession.completedAt = new Date().toISOString();
    } else {
      freshSession.currentWordIndex = nextIndex;
      freshSession.completedCount = freshSession.words.filter(word => word.completed).length;
      freshSession.status = 'IN_PROGRESS';
      delete freshSession.completedAt;
    }

    freshSession.updatedAt = new Date().toISOString();
    await db.updateStudySession(freshSession);
    return await db.findStudySessionById(sessionId);
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
