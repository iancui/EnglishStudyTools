import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { DictionaryService } from '../services/dictionaryService.ts';

export class DictionaryController {
  static getConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const config = DictionaryService.getConfig(userId);
      res.json({
        code: 200,
        message: 'success',
        data: config
      });
    } catch (e) {
      next(e);
    }
  }

  static updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const config = DictionaryService.updateConfig(userId, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: config
      });
    } catch (e) {
      next(e);
    }
  }
}
