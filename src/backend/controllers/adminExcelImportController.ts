import { Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { ExcelImportService } from '../services/excelImportService.ts';

const getRows = (sheet: XLSX.WorkSheet, mapping: Record<string, number>) => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  return rows.slice(1).map(row => Object.fromEntries(
    Object.entries(mapping).map(([key, index]) => [key, index >= 0 ? String(row[index] ?? '').trim() : ''])
  )).filter(row => Object.values(row).some(Boolean));
};

export class AdminExcelImportController {
  static async import(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file?.buffer) throw new Error('未收到 Excel 文件');
      const wordDictionaryId = String(req.body?.wordDictionaryId || '');
      const sentenceDictionaryId = String(req.body?.sentenceDictionaryId || '');
      const wordSheetName = String(req.body?.wordSheetName || '');
      const sentenceSheetName = String(req.body?.sentenceSheetName || '');
      const wordMapping = JSON.parse(String(req.body?.wordMapping || '{}'));
      const sentenceMapping = JSON.parse(String(req.body?.sentenceMapping || '{}'));

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const wordSheet = workbook.Sheets[wordSheetName];
      const sentenceSheet = workbook.Sheets[sentenceSheetName];
      if (!wordSheet) throw new Error('找不到单词 Sheet：' + wordSheetName);
      if (!sentenceSheet) throw new Error('找不到句子 Sheet：' + sentenceSheetName);

      const words = getRows(wordSheet, wordMapping).map((row: any) => ({
        text: row.text, phonetic: row.phonetic, pos: row.pos, meaningCn: row.meaningCn
      }));
      const sentences = getRows(sentenceSheet, sentenceMapping).map((row: any) => ({
        content: row.content, translation: row.translation
      }));

      const result = await ExcelImportService.importWorkbookData(
        wordDictionaryId, sentenceDictionaryId, words, sentences
      );
      res.json({ code: 200, message: 'Excel 数据导入成功', data: result });
    } catch (e) {
      next(e);
    }
  }
}
