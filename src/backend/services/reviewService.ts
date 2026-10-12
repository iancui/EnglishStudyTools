import { db } from '../db/storage.ts';
import { UserWordProgress, ReviewRecord, ProgressStatus } from '../types/index.ts';
import { WordProgressService } from './wordProgressService.ts';
import { DictionaryService } from './dictionaryService.ts';

// Interval sequence requested in Section Ten:
// 1st: 10 mins (0.007 days)
// 2nd: 1 day
// 3rd: 3 days
// 4th: 7 days
// 5th: 15 days
// 6th+: 30 days
const INTERVAL_DAYS = [10 / (24 * 60), 1, 3, 7, 15, 30];

export class ReviewService {
  /**
   * Calculates the next review date and updated streak
   */
  static calculateNextReview(currentStreak: number, isCorrect: boolean): { intervalDays: number; nextReviewAt: Date; newStreak: number } {
    let newStreak = currentStreak;
    let intervalDays = 0;

    if (isCorrect) {
      newStreak = currentStreak + 1;
      const index = Math.min(newStreak - 1, INTERVAL_DAYS.length - 1);
      intervalDays = INTERVAL_DAYS[Math.max(0, index)];
    } else {
      newStreak = 0;
      intervalDays = 10 / (24 * 60); // 10 minutes reset
    }

    const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
    return { intervalDays, nextReviewAt, newStreak };
  }

  /**
   * Process a review attempt for a word
   */
  static async processReview(userId: string, wordId: string, isCorrect: boolean): Promise<UserWordProgress> {
    let progress = await db.getWordProgress(userId, wordId);
    const now = new Date().toISOString();

    if (!progress) {
      progress = {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        wordId,
        status: 'LEARNING',
        learnCount: 1,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        mastery: 0,
        createdAt: now,
        updatedAt: now
      };
    }

    const { intervalDays, nextReviewAt, newStreak } = this.calculateNextReview(progress.streak, isCorrect);

    progress.reviewCount += 1;
    progress.lastReviewAt = now;
    progress.nextReviewAt = nextReviewAt.toISOString();
    progress.streak = newStreak;

    if (isCorrect) {
      progress.correctCount += 1;
      // Mastery accumulates progressively (+15 per correct step)
      progress.mastery = Math.min(100, progress.mastery + 15);
      if (progress.streak >= 5 && progress.mastery >= 90) {
        progress.status = 'MASTERED';
      } else {
        progress.status = 'REVIEW';
      }
    } else {
      progress.wrongCount += 1;
      progress.mastery = Math.max(0, progress.mastery - 20);
      progress.status = 'LEARNING';
    }

    // Save progress
    await db.saveWordProgress(progress);

    // Save review record
    const record: ReviewRecord = {
      id: `rr-${Date.now()}`,
      userId,
      wordId,
      intervalDays,
      nextReviewAt: nextReviewAt.toISOString(),
      result: isCorrect ? 'SUCCESS' : 'FAIL',
      createdAt: now
    };
    await db.addReviewRecord(record);

    return progress;
  }

  /**
   * Get words scheduled for review today or overdue
   */
  static async getTodayReviewWords(userId: string) {
    return db.getTodayReviewWords(userId);
  }

  /**
   * 普通复习：按词库聚合已学单词（掌握 / 已学未掌握），按单元分组。
   * 返回所有词库的整体进度供选择，以及所选词库的单词池。
   */
  static async getWordReviewPool(userId: string, reqDictionaryId: string, excludeMastered: boolean) {
    const config = await DictionaryService.getConfig(userId);
    const dictionaries = await db.getAllDictionaries(userId);
    const statsMap = await db.getAllDictionaryWordProgressStats(userId);

    const summaries = dictionaries.map((d: any) => {
      const s = statsMap.get(d.id) || { totalWords: Number(d.wordCount || 0), learnedWords: 0, masteredWords: 0 };
      const learned = s.learnedWords;
      const mastered = s.masteredWords;
      return {
        id: d.id,
        name: d.name,
        totalWords: s.totalWords,
        learnedWords: learned,
        masteredWords: mastered,
        learningWords: Math.max(0, learned - mastered),
        unlearnedWords: Math.max(0, s.totalWords - learned)
      };
    });

    const selectedDictionaryId = reqDictionaryId || config.defaultDictionaryId || summaries[0]?.id || '';
    const selected = summaries.find(s => s.id === selectedDictionaryId);

    if (!selectedDictionaryId) {
      return { dictionaries: summaries, selectedDictionaryId: '', dictionaryName: '', chapters: [], uncategorized: [] };
    }

    const rows = await db.getDictionaryWordReviewPool(userId, selectedDictionaryId, !excludeMastered);
    const words = await db.getWordsByIds(rows.map(r => String(r.word_id)));
    const wordMap = new Map(words.map(w => [w.id, w]));
    const chapters = await db.getDictionaryChapters(selectedDictionaryId);

    const grouped = new Map<string, any[]>();
    for (const r of rows as any[]) {
      const word = wordMap.get(String(r.word_id));
      if (!word) continue;
      const progress = {
        id: '',
        userId,
        wordId: String(r.word_id),
        status: r.status,
        learnCount: Number(r.learn_count || 0),
        reviewCount: Number(r.review_count || 0),
        correctCount: Number(r.correct_count || 0),
        wrongCount: Number(r.wrong_count || 0),
        streak: Number(r.streak || 0),
        mastery: Number(r.mastery || 0),
        nextReviewAt: r.next_review_at ? new Date(r.next_review_at).toISOString() : undefined
      };
      const key = r.chapter_id ? String(r.chapter_id) : '';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ ...word, progress });
    }

    const chapterGroups = chapters
      .map(c => ({ id: c.id, name: c.name, sequence: c.sequence, words: grouped.get(c.id) || [] }))
      .filter(g => g.words.length > 0);

    return {
      dictionaries: summaries,
      selectedDictionaryId,
      dictionaryName: selected?.name || '',
      chapters: chapterGroups,
      uncategorized: grouped.get('') || []
    };
  }
}
