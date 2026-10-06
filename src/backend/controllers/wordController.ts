import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { WordService } from '../services/wordService.ts';

export class WordController {
  static getTodayWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const words = WordService.getTodayWords(userId, limit);
      res.json({
        code: 200,
        message: 'success',
        data: words
      });
    } catch (e) {
      next(e);
    }
  }

  static getWordById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const word = WordService.getWordById(id, userId);
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

  static getWordPhonics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const phonics = WordService.getWordPhonics(id);
      res.json({
        code: 200,
        message: 'success',
        data: phonics
      });
    } catch (e) {
      next(e);
    }
  }

  static getWordMeanings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meanings = WordService.getWordMeanings(id);
      res.json({
        code: 200,
        message: 'success',
        data: meanings
      });
    } catch (e) {
      next(e);
    }
  }

  static checkAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { answer, timeSpentSec } = req.body;
      const result = WordService.checkAnswer(userId, id, answer, timeSpentSec);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static markLearned(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const progress = WordService.markWordLearned(userId, id);
      res.json({
        code: 200,
        message: 'success',
        data: progress
      });
    } catch (e) {
      next(e);
    }
  }

  static getWrongWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = WordService.getWrongWords(userId);
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
