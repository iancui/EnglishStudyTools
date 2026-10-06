import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { StatisticsService } from '../services/statisticsService.ts';

export class StatisticsController {
  static getTodayStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const stats = StatisticsService.getTodayStatistics(userId);
      res.json({
        code: 200,
        message: 'success',
        data: stats
      });
    } catch (e) {
      next(e);
    }
  }

  static getOverviewStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const overview = StatisticsService.getOverviewStatistics(userId);
      res.json({
        code: 200,
        message: 'success',
        data: overview
      });
    } catch (e) {
      next(e);
    }
  }

  static getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    return StatisticsController.getOverviewStatistics(req, res, next);
  }
}
