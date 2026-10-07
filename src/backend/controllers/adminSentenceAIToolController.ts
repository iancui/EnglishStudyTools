import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { GeminiSentenceService } from '../services/geminiSentenceService.ts';
import { MysqlSentenceImporter } from '../services/mysqlSentenceImporter.ts';

export class AdminSentenceAIToolController {
  static async analyze(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    GeminiSentenceService.analyze(req.body?.sentences || [], req.body?.model)
      .then(data => res.json({ code: 200, message: 'success', data }))
      .catch(next);
  }

  static async import(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    MysqlSentenceImporter.importSentences(req.body?.dictionaryId, req.body?.sentences || [])
      .then(data => res.json({ code: 200, message: 'success', data }))
      .catch(next);
  }
}
