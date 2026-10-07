import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { StudySessionService } from '../services/studySessionService.ts';

export class StudySessionController {
  static async previewSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const result = await StudySessionService.previewSession(userId, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const session = await StudySessionService.createSession(userId, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }

  static async getActiveSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const session = await StudySessionService.getActiveSession(userId);
      res.json({
        code: 200,
        message: 'success',
        data: session || null
      });
    } catch (e) {
      next(e);
    }
  }

  static async getSessionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const session = await StudySessionService.getSessionById(id, userId);
      if (!session) {
        return res.status(404).json({
          code: 404,
          message: '未找到该学习任务',
          data: null
        });
      }
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }

  static async markWordLearned(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id, wordId } = req.params;
      const result = await StudySessionService.markWordLearned(id, wordId, userId);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async writeWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id, wordId } = req.params;
      const { answer, timeSpentSec } = req.body;
      const result = await StudySessionService.writeWord(id, wordId, userId, answer, timeSpentSec);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async nextWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const session = await StudySessionService.nextWord(id, userId);
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }

  static async cancelSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const session = await StudySessionService.cancelSession(id, userId);
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }
}
