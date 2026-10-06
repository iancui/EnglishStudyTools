import { db } from '../db/storage.ts';
import { Word, UserWordProgress, LearningRecord } from '../types/index.ts';
import { DictionaryService } from './dictionaryService.ts';
import { ReviewService } from './reviewService.ts';

export class WordService {
  static getWordById(id: string, userId: string) {
    const word = db.findWordById(id);
    if (!word) return null;

    const config = DictionaryService.getConfig(userId);
    const progress = db.getWordProgress(userId, id);

    return {
      ...DictionaryService.applyWordDictionaryConfig(word, config),
      progress: progress || null
    };
  }

  static getTodayWords(userId: string, limit = 20) {
    const allWords = db.getAllWords();
    const allProgress = db.getAllWordProgresses(userId);
    const config = DictionaryService.getConfig(userId);

    const progressMap = new Map<string, UserWordProgress>();
    for (const p of allProgress) {
      progressMap.set(p.wordId, p);
    }

    // Sort order:
    // 1. LEARNING status
    // 2. NEW (no progress or status === 'NEW')
    // 3. REVIEW
    // 4. MASTERED
    const sorted = [...allWords].sort((a, b) => {
      const pa = progressMap.get(a.id);
      const pb = progressMap.get(b.id);

      const scoreA = !pa ? 1 : pa.status === 'LEARNING' ? 0 : pa.status === 'REVIEW' ? 2 : 3;
      const scoreB = !pb ? 1 : pb.status === 'LEARNING' ? 0 : pb.status === 'REVIEW' ? 2 : 3;
      return scoreA - scoreB;
    });

    return sorted.slice(0, limit).map(w => {
      const prog = progressMap.get(w.id);
      return {
        ...DictionaryService.applyWordDictionaryConfig(w, config),
        progress: prog || null
      };
    });
  }

  static getWordPhonics(wordId: string) {
    const word = db.findWordById(wordId);
    return word ? word.phonics : [];
  }

  static getWordMeanings(wordId: string) {
    const word = db.findWordById(wordId);
    return word ? word.meanings : [];
  }

  /**
   * Check user answer for word memorization (Section Seven & Eight)
   * Trims whitespace and compares lowercased input with word text
   */
  static checkAnswer(userId: string, wordId: string, rawInput: string, timeSpentSec = 5) {
    const word = db.findWordById(wordId);
    if (!word) {
      throw new Error('Word not found');
    }

    const cleanInput = (rawInput || '').trim().toLowerCase();
    const expected = word.text.trim().toLowerCase();
    const isCorrect = cleanInput === expected;

    // Call ReviewService to update spaced repetition schedule
    const updatedProgress = ReviewService.processReview(userId, wordId, isCorrect);

    // Save learning record
    const record: LearningRecord = {
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      itemType: 'WORD',
      itemId: wordId,
      action: 'MEMORIZE',
      isCorrect,
      inputText: rawInput,
      timeSpentSec,
      createdAt: new Date().toISOString()
    };
    db.addLearningRecord(record);

    return {
      isCorrect,
      userInput: rawInput,
      correctAnswer: word.text,
      phonetic: word.phoneticUk,
      meanings: word.meanings,
      progress: updatedProgress
    };
  }

  /**
   * Mark word as studied in Stage 1 (学)
   */
  static markWordLearned(userId: string, wordId: string) {
    let progress = db.getWordProgress(userId, wordId);
    const now = new Date().toISOString();

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
      if (progress.status === 'NEW') {
        progress.status = 'LEARNING';
      }
    }

    db.saveWordProgress(progress);

    db.addLearningRecord({
      id: `lr-${Date.now()}`,
      userId,
      itemType: 'WORD',
      itemId: wordId,
      action: 'LEARN',
      isCorrect: true,
      timeSpentSec: 10,
      createdAt: now
    });

    return progress;
  }

  /**
   * Get list of troublesome / wrong words
   */
  static getWrongWords(userId: string) {
    const allProgress = db.getAllWordProgresses(userId);
    const wrongProgresses = allProgress.filter(p => p.wrongCount > 0);
    const config = DictionaryService.getConfig(userId);

    return wrongProgresses
      .map(p => {
        const word = db.findWordById(p.wordId);
        if (!word) return null;
        return {
          ...DictionaryService.applyWordDictionaryConfig(word, config),
          progress: p
        };
      })
      .filter(Boolean);
  }
}
