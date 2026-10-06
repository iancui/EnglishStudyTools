import { db } from '../db/storage.ts';
import { UserSentenceProgress, LearningRecord } from '../types/index.ts';

export class SentenceService {
  static getAllSentences(userId: string) {
    const sentences = db.getAllSentences();
    return sentences.map(s => {
      const progress = db.getSentenceProgress(userId, s.id);
      return {
        ...s,
        progress: progress || null
      };
    });
  }

  static getSentenceById(id: string, userId: string) {
    const sentence = db.findSentenceById(id);
    if (!sentence) return null;

    const progress = db.getSentenceProgress(userId, id);
    return {
      ...sentence,
      progress: progress || {
        currentStep: 1,
        status: 'IN_PROGRESS'
      }
    };
  }

  static getSentenceSteps(sentenceId: string) {
    const sentence = db.findSentenceById(sentenceId);
    return sentence ? sentence.steps : [];
  }

  static getTodaySentences(userId: string, limit = 5) {
    const all = db.getAllSentences();
    return all.slice(0, limit).map(s => {
      const progress = db.getSentenceProgress(userId, s.id);
      return {
        ...s,
        progress: progress || null
      };
    });
  }

  static completeSentence(userId: string, sentenceId: string, currentStep: number) {
    const sentence = db.findSentenceById(sentenceId);
    if (!sentence) {
      throw new Error('Sentence not found');
    }

    const isFinished = currentStep >= sentence.steps.length;
    const now = new Date().toISOString();

    const progress: UserSentenceProgress = {
      id: `sp-${userId}-${sentenceId}`,
      userId,
      sentenceId,
      status: isFinished ? 'COMPLETED' : 'IN_PROGRESS',
      currentStep,
      completedAt: isFinished ? now : undefined,
      createdAt: now,
      updatedAt: now
    };

    db.saveSentenceProgress(progress);

    const record: LearningRecord = {
      id: `lr-${Date.now()}`,
      userId,
      itemType: 'SENTENCE',
      itemId: sentenceId,
      action: isFinished ? 'LEARN' : 'STEP_COMPLETE',
      isCorrect: true,
      timeSpentSec: 20,
      createdAt: now
    };
    db.addLearningRecord(record);

    return progress;
  }
}
