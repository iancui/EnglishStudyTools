import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { StatisticsService } from '../services/statisticsService.ts';

export class StatisticsController {
  static async getTodayStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const startedAt = Date.now();
      const stats = await StatisticsService.getTodayStatistics(userId);
      console.log('[perf:home/today-statistics]', { userId, elapsedMs: Date.now() - startedAt });
      res.json({
        code: 200,
        message: 'success',
        data: stats
      });
    } catch (e) {
      next(e);
    }
  }

  static async getOverviewStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const overview = await StatisticsService.getOverviewStatistics(userId);
      res.json({
        code: 200,
        message: 'success',
        data: overview
      });
    } catch (e) {
      next(e);
    }
  }

  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    return StatisticsController.getOverviewStatistics(req, res, next);
  }
}
