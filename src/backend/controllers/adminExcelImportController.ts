import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { ExcelImportService } from '../services/excelImportService.ts';

export class AdminExcelImportController {
  static async import(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { wordDictionaryId, sentenceDictionaryId, words, sentences } = req.body || {};
      const result = await ExcelImportService.importWorkbookData(
        wordDictionaryId,
        sentenceDictionaryId,
        Array.isArray(words) ? words : [],
        Array.isArray(sentences) ? sentences : []
      );
      res.json({ code: 200, message: 'Excel 数据导入成功', data: result });
    } catch (e) {
      next(e);
    }
  }
}
