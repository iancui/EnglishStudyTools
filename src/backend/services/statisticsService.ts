import { db } from '../db/storage.ts';
import { LearningRecord } from '../types/index.ts';
import { DictionaryService } from './dictionaryService.ts';

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

    // 首页词库进度必须以当前默认辞书为口径，不能把其他辞书的词汇混进来。
    stepStartedAt = Date.now();
    const config = await DictionaryService.getConfig(userId);
    const dictionaryId = config.defaultDictionaryId;
    const dictionaryWordStats = dictionaryId
      ? await db.getDictionaryWordProgressStats(userId, dictionaryId)
      : { totalWords: 0, learnedWords: 0, masteredWords: 0 };
    const totalWords = dictionaryWordStats.totalWords;
    const wordChapters = dictionaryId
      ? await db.getDictionaryChapterWordProgressStats(userId, dictionaryId)
      : [];
    logStep('count-dictionary-word-progress', stepStartedAt, {
      dictionaryId,
      totalWords,
      learnedWords: dictionaryWordStats.learnedWords,
      masteredWords: dictionaryWordStats.masteredWords,
      wordChapterCount: wordChapters.length
    });

    stepStartedAt = Date.now();
    // 词库总进度始终统计整个已选句子词库；当前单元的进度单独由 sentenceChapters 提供。
    // 不能把 sentenceChapterId 传入总统计，否则切换单元后顶部进度也会变成单元进度。
    const sentenceDictionaryId = config.sentenceDictionaryId;
    const sentenceChapterId = config.sentenceChapterId;
    let totalSentences: number;
    let learnedSentences: number;
    let masteredSentences: number;
    let sentenceDictionaryName: string | undefined;
    let sentenceChapterName: string | undefined;
    let sentenceChapters: { id: string; name: string; sequence: number; total: number; learned: number; mastered: number }[] = [];
    if (sentenceDictionaryId) {
      const s = await db.getDictionarySentenceStats(sentenceDictionaryId, userId);
      totalSentences = s.total;
      learnedSentences = s.learned;
      masteredSentences = s.mastered;
      sentenceDictionaryName = await db.getDictionaryName(sentenceDictionaryId);
      // 辞书有单元时，返回每个单元的进度供首页切换
      const chapterStats = await db.getDictionaryChapterSentenceStats(sentenceDictionaryId, userId);
      sentenceChapters = chapterStats;
      if (sentenceChapterId) {
        const ch = chapterStats.find(c => c.id === sentenceChapterId);
        sentenceChapterName = ch?.name;
      } else if (chapterStats.length > 0) {
        // 没有显式选单元时，显示当前学习到的单元名
        const chapter = await db.getCurrentSentenceChapter(sentenceDictionaryId, userId);
        sentenceChapterName = chapter?.name;
      }
    } else {
      const p = await db.getSentenceProgressStats(userId);
      totalSentences = await db.getSentenceCount();
      learnedSentences = p.learned;
      masteredSentences = p.mastered;
    }
    logStep('count-sentence-progress', stepStartedAt, {
      sentenceDictionaryId,
      sentenceDictionaryName,
      sentenceChapterName,
      totalSentences,
      learnedSentences,
      masteredSentences
    });

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

    const masteredWords = dictionaryWordStats.masteredWords;
    const learnedWords = dictionaryWordStats.learnedWords;
    const learningWords = Math.max(0, learnedWords - masteredWords);

    // Progress percentage strictly computed from dictionary-scoped mastered & learned words.
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
      learnedWords,
      totalWords,
      wordChapters,
      totalSentences,
      learnedSentences,
      masteredSentences,
      sentenceDictionaryName,
      sentenceChapterName,
      sentenceChapterId,
      sentenceChapters,
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
    // 句子总数/进度已在 getTodayStatistics 中按用户选择的句子词库统计，直接复用，
    // 避免再次用全库 getSentenceCount() 覆盖导致口径不一致。
    const totalSentences = todayStats.totalSentences;
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
