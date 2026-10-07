import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { WordService } from '../services/wordService.ts';

export class WordController {
  static async getTodayWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const words = await WordService.getTodayWords(userId, limit);
      res.json({
        code: 200,
        message: 'success',
        data: words
      });
    } catch (e) {
      next(e);
    }
  }

  static async getWordById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const word = await WordService.getWordById(id, userId);
      if (!word) {
        return res.status(404).json({
          code: 404,
          message: '未找到该单词',
          data: null
        });
      }
      res.json({
        code: 200,
        message: 'success',
        data: word
      });
    } catch (e) {
      next(e);
    }
  }

  static async getWordPhonics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const phonics = await WordService.getWordPhonics(id);
      res.json({
        code: 200,
        message: 'success',
        data: phonics
      });
    } catch (e) {
      next(e);
    }
  }

  static async getWordMeanings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meanings = await WordService.getWordMeanings(id);
      res.json({
        code: 200,
        message: 'success',
        data: meanings
      });
    } catch (e) {
      next(e);
    }
  }

  static async lookupWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const text = (req.query.text as string) || '';
      const data = await WordService.lookupByText(text);
      res.json({
        code: 200,
        message: 'success',
        data
      });
    } catch (e) {
      next(e);
    }
  }

  static async checkAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { answer, timeSpentSec } = req.body;
      const result = await WordService.checkAnswer(userId, id, answer, timeSpentSec);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async markLearned(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const progress = await WordService.markWordLearned(userId, id);
      res.json({
        code: 200,
        message: 'success',
        data: progress
      });
    } catch (e) {
      next(e);
    }
  }

  static async getWrongWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = await WordService.getWrongWords(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }
}
