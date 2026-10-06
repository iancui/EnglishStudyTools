import { db } from '../db/storage.ts';
import { UserWordProgress, ReviewRecord, ProgressStatus } from '../types/index.ts';
import { WordProgressService } from './wordProgressService.ts';

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
  static processReview(userId: string, wordId: string, isCorrect: boolean): UserWordProgress {
    let progress = db.getWordProgress(userId, wordId);
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
    db.saveWordProgress(progress);

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
    db.addReviewRecord(record);

    return progress;
  }

  /**
   * Get words scheduled for review today or overdue
   */
  static getTodayReviewWords(userId: string) {
    const allProgress = db.getAllWordProgresses(userId);
    const now = new Date();

    const dueWordIds = allProgress
      .filter(p => {
        if (!p.nextReviewAt) return false;
        return new Date(p.nextReviewAt) <= now;
      })
      .map(p => p.wordId);

    return dueWordIds.map(id => db.findWordById(id)).filter(Boolean);
  }
}
