import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { SentenceService } from '../services/sentenceService.ts';

export class SentenceController {
  static getAllSentences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = SentenceService.getAllSentences(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static getTodaySentences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const list = SentenceService.getTodaySentences(userId, limit);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static getSentenceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const sentence = SentenceService.getSentenceById(id, userId);
      if (!sentence) {
        return res.status(404).json({
          code: 404,
          message: '未找到该句子',
          data: null
        });
      }
      res.json({
        code: 200,
        message: 'success',
        data: sentence
      });
    } catch (e) {
      next(e);
    }
  }

  static getSentenceSteps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const steps = SentenceService.getSentenceSteps(id);
      res.json({
        code: 200,
        message: 'success',
        data: steps
      });
    } catch (e) {
      next(e);
    }
  }

  static completeSentence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { currentStep } = req.body;
      const progress = SentenceService.completeSentence(userId, id, currentStep || 1);
      res.json({
        code: 200,
        message: 'success',
        data: progress
      });
    } catch (e) {
      next(e);
    }
  }
}
