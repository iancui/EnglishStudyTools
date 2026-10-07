import { db } from '../db/storage.ts';
import { UserSentenceProgress, LearningRecord } from '../types/index.ts';

export class SentenceService {
  static async getAllSentences(userId: string) {
    const sentences = await db.getAllSentences();
    return Promise.all(sentences.map(async s => {
      const progress = await db.getSentenceProgress(userId, s.id);
      return { ...s, progress: progress || null };
    }));
  }

  static async getSentenceById(id: string, userId: string) {
    const sentence = await db.findSentenceById(id);
    if (!sentence) return null;

    const progress = await db.getSentenceProgress(userId, id);
    return {
      ...sentence,
      progress: progress || {
        currentStep: 1,
        status: 'IN_PROGRESS'
      }
    };
  }

  static async getSentenceSteps(sentenceId: string) {
    const sentence = await db.findSentenceById(sentenceId);
    return sentence ? sentence.steps : [];
  }

  static async getTodaySentences(userId: string, limit = 5) {
    const all = await db.getAllSentences();
    return Promise.all(all.slice(0, limit).map(async s => {
      const progress = await db.getSentenceProgress(userId, s.id);
      return { ...s, progress: progress || null };
    }));
  }

  static async completeSentence(userId: string, sentenceId: string, currentStep: number) {
    const sentence = await db.findSentenceById(sentenceId);
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

    await db.saveSentenceProgress(progress);

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
    await db.addLearningRecord(record);

    return progress;
  }
}
