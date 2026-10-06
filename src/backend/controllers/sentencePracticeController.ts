import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { SentencePracticeService } from '../services/sentencePracticeService.ts';

export class SentencePracticeController {
  /**
   * Preview sentence practice count for filter
   * GET /api/sentence-practice/preview?difficulty=A1&count=5
   */
  static preview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
            const dictionaryId = (req.query.dictionaryId as string) || undefined;
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 5;
      const preview = SentencePracticeService.previewPractice(count, dictionaryId);
      res.json({
        code: 200,
        message: 'success',
        data: preview
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Create a new sentence practice session
   * POST /api/sentence-practice
   * Body: { difficulty, count }
   */
  static createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { count, dictionaryId } = req.body;
      const session = SentencePracticeService.createSession(userId, {
        difficulty,
        count: count ? parseInt(count, 10) : 5,
        dictionaryId
      });
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Get current active session
   * GET /api/sentence-practice/current
   */
  static getCurrentSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const session = SentencePracticeService.getActiveSession(userId);
      res.json({
        code: 200,
        message: 'success',
        data: session
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Get specific session by ID
   * GET /api/sentence-practice/:id
   */
  static getSessionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const session = SentencePracticeService.getSessionById(id, userId);
      if (!session) {
        return res.status(404).json({
          code: 404,
          message: '未找到该句子练习任务',
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

  /**
   * Unified submit answer endpoint:
   * POST /api/sentence-practice/:id/answer
   * Body: { answer }
   * The backend dynamically verifies phrase or rebuild based on currentPhase & currentPhraseIndex!
   */
  static submitAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { answer } = req.body;

      const session = SentencePracticeService.getSessionById(id, userId);
      if (!session) {
        return res.status(404).json({
          code: 404,
          message: '未找到该句子练习任务',
          data: null
        });
      }

      if (session.status !== 'IN_PROGRESS') {
        return res.status(400).json({
          code: 400,
          message: '该练习任务已结束',
          data: null
        });
      }

      const currentItem = session.items?.[session.currentSentenceIndex];
      if (!currentItem) {
        return res.status(400).json({
          code: 400,
          message: '未找到当前句子练习项',
          data: null
        });
      }

      let result;
      if (currentItem.currentPhase === 'PHRASE') {
        result = SentencePracticeService.submitPhraseAnswer(
          id,
          userId,
          currentItem.currentPhraseIndex,
          answer || ''
        );
      } else if (currentItem.currentPhase === 'REBUILD') {
        result = SentencePracticeService.submitRebuildAnswer(
          id,
          userId,
          answer || ''
        );
      } else {
        return res.status(400).json({
          code: 400,
          message: '当前阶段不可提交答案',
          data: null
        });
      }

      // Re-fetch updated session state
      const updatedSession = SentencePracticeService.getSessionById(id, userId);

      res.json({
        code: 200,
        message: 'success',
        data: {
          isCorrect: result.isCorrect,
          correctAnswer: result.expectedAnswer,
          userInput: result.userInput,
          message: result.message,
          currentPhase: updatedSession?.items?.[updatedSession.currentSentenceIndex]?.currentPhase || currentItem.currentPhase,
          currentPhraseIndex: updatedSession?.items?.[updatedSession.currentSentenceIndex]?.currentPhraseIndex || 0,
          completed: updatedSession?.items?.[updatedSession.currentSentenceIndex]?.completed || false,
          sessionCompleted: updatedSession?.status === 'COMPLETED',
          progress: {
            currentSentenceIndex: updatedSession?.currentSentenceIndex || 0,
            totalCount: updatedSession?.totalCount || 0
          },
          session: updatedSession
        }
      });
    } catch (e: any) {
      res.status(400).json({
        code: 400,
        message: e.message || '提交答案失败',
        data: null
      });
    }
  }

  /**
   * Cancel session
   * POST /api/sentence-practice/:id/cancel
   */
  static cancelSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const success = SentencePracticeService.cancelSession(id, userId);
      res.json({
        code: 200,
        message: 'success',
        data: { cancelled: success }
      });
    } catch (e) {
      next(e);
    }
  }
}
