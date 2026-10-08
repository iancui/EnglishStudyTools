import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { ReviewService } from '../services/reviewService.ts';
import { WordService } from '../services/wordService.ts';

export class ReviewController {
  static async getTodayReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const startedAt = Date.now();
      const words = await ReviewService.getTodayReviewWords(userId);
      console.log('[perf:home/today-review]', { userId, elapsedMs: Date.now() - startedAt, wordCount: words.length });
      res.json({
        code: 200,
        message: 'success',
        data: words
      });
    } catch (e) {
      next(e);
    }
  }

  static async submitReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { answer, isCorrect: directCorrect } = req.body;

      if (answer !== undefined) {
        // If user submitted text answer
        const result = await WordService.checkAnswer(userId, id, answer);
        return res.json({
          code: 200,
          message: 'success',
          data: result
        });
      }

      // If user directly marked correct/incorrect
      const isCorrect = Boolean(directCorrect);
      const progress = await ReviewService.processReview(userId, id, isCorrect);
      res.json({
        code: 200,
        message: 'success',
        data: {
          isCorrect,
          progress
        }
      });
    } catch (e) {
      next(e);
    }
  }
}
