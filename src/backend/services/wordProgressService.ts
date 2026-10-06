import { UserWordProgress } from '../types/index.ts';

export class WordProgressService {
  /**
   * Unified check for whether a word is considered MASTERED
   * based on status, mastery score, and consecutive correct streak
   */
  static isMastered(progress?: UserWordProgress | null): boolean {
    if (!progress) return false;
    if (progress.status === 'MASTERED') return true;
    if (progress.mastery >= 90 && progress.streak >= 4) return true;
    if (progress.streak >= 5) return true;
    return false;
  }
}
