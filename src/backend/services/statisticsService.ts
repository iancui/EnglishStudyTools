import { db } from '../db/storage.ts';
import { LearningRecord } from '../types/index.ts';

export class StatisticsService {
  /**
   * Calculates continuous streak days based strictly on real learning records.
   * If user was active today, count backwards consecutively.
   * If user was not active today, streak is 0.
   */
  static calculateStreakDays(records: LearningRecord[]): number {
    if (!records || records.length === 0) return 0;

    const activeDates = new Set<string>();
    records.forEach(r => {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activeDates.add(key);
      }
    });

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (!activeDates.has(todayKey)) {
      return 0;
    }

    let streak = 0;
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    while (true) {
      const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (activeDates.has(key)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  static async getTodayStatistics(userId: string) {
    const startedAt = Date.now();
    const logStep = (step: string, stepStartedAt: number, extra: Record<string, unknown> = {}) => {
      console.log('[perf:home/today-statistics]', {
        userId,
        step,
        elapsedMs: Date.now() - stepStartedAt,
        totalElapsedMs: Date.now() - startedAt,
        ...extra
      });
    };

    let stepStartedAt = Date.now();
    const records = await db.getLearningRecords(userId);
    logStep('get-learning-records', stepStartedAt, { recordCount: records.length });

    stepStartedAt = Date.now();
    const progresses = (await db.getAllWordProgresses(userId)).filter((p): p is import('../types/index.ts').UserWordProgress => Boolean(p));
    logStep('get-word-progresses', stepStartedAt, { progressCount: progresses.length });

    // Only the count is needed here. Loading every word with meanings/phonics
    // creates thousands of DB queries and can block other homepage requests.
    stepStartedAt = Date.now();
    const totalWords = await db.getWordCount();
    logStep('count-total-words', stepStartedAt, { totalWords });

    // Filter today's records (strictly starting from 00:00:00 today)
    stepStartedAt = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = records.filter(r => new Date(r.createdAt) >= today);

    const todayWordRecords = todayRecords.filter(r => r.itemType === 'WORD');
    const todaySentenceRecords = todayRecords.filter(r => r.itemType === 'SENTENCE');

    const todayCorrect = todayWordRecords.filter(r => r.isCorrect === true).length;
    const todayWrong = todayWordRecords.filter(r => r.isCorrect === false).length;

    // Distinct words and sentences with activity today
    const todayLearnedWords = new Set(todayWordRecords.map(r => r.itemId)).size;
    const todaySentences = new Set(todaySentenceRecords.map(r => r.itemId)).size;

    // Real study time spent in minutes strictly based on recorded timeSpentSec
    const totalTimeSec = todayRecords.reduce((acc, r) => acc + (r.timeSpentSec || 0), 0);
    const studyTimeMinutes = Math.round(totalTimeSec / 60);

    const masteredWords = progresses.filter(p => p.status === 'MASTERED').length;
    const learningWords = progresses.filter(p => p.status === 'LEARNING' || p.status === 'REVIEW').length;

    // Progress percentage strictly computed from mastered & learning words
    const progressPercent = totalWords > 0
      ? Math.min(100, Math.round(((masteredWords + learningWords * 0.5) / totalWords) * 100))
      : 0;

    // Accuracy rate: 0% if no attempts, otherwise real percentage
    const totalAttempts = todayCorrect + todayWrong;
    const accuracyRate = totalAttempts > 0
      ? Math.round((todayCorrect / totalAttempts) * 100)
      : 0;

    logStep('calculate-statistics', stepStartedAt, {
      todayRecordCount: todayRecords.length,
      todayWordRecordCount: todayWordRecords.length,
      todaySentenceRecordCount: todaySentenceRecords.length
    });

    logStep('total', startedAt);

    return {
      todayLearnedWords,
      todayCorrect,
      todayWrong,
      todaySentences,
      studyTimeMinutes,
      masteredWords,
      learningWords,
      learnedWords: masteredWords + learningWords,
      totalWords,
      progressPercent,
      accuracyRate
    };
  }

  static async getOverviewStatistics(userId: string) {
    const startedAt = Date.now();
    const logStep = (step: string, stepStartedAt: number, extra: Record<string, unknown> = {}) => {
      console.log('[perf:statistics/overview]', {
        userId,
        step,
        elapsedMs: Date.now() - stepStartedAt,
        totalElapsedMs: Date.now() - startedAt,
        ...extra
      });
    };

    let stepStartedAt = Date.now();
    const todayStats = await this.getTodayStatistics(userId);
    logStep('get-today-statistics', stepStartedAt);

    stepStartedAt = Date.now();
    const records = await db.getLearningRecords(userId);
    logStep('get-learning-records', stepStartedAt, { recordCount: records.length });

    stepStartedAt = Date.now();
    const progresses = (await db.getAllWordProgresses(userId)).filter((p): p is import('../types/index.ts').UserWordProgress => Boolean(p));
    logStep('get-word-progresses', stepStartedAt, { progressCount: progresses.length });

    stepStartedAt = Date.now();
    const totalSentences = await db.getSentenceCount();
    logStep('count-total-sentences', stepStartedAt, { totalSentences });

    stepStartedAt = Date.now();
    const currentStreakDays = this.calculateStreakDays(records);
    const totalReviewedWords = progresses.reduce((acc, p) => acc + p.reviewCount, 0);
    logStep('calculate-overview', stepStartedAt, { currentStreakDays, totalReviewedWords, totalSentences });

    logStep('total', startedAt);

    return {
      ...todayStats,
      totalReviewedWords,
      totalSentences,
      currentStreakDays
    };
  }
}
