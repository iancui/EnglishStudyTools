import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { DictionaryService } from '../services/dictionaryService.ts';

export class DictionaryController {
  // Config
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

  // User / Public Dictionaries
  static getMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = DictionaryService.getUserDictionaries(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static getMyDictionaryWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const dictId = req.params.dictionaryId || req.params.id;
      const list = DictionaryService.getUserDictionaryWords(userId, dictId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static getAllDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = DictionaryService.getAllDictionaries(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static getDictionaryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dict = DictionaryService.getDictionaryById(id);
      if (!dict) {
        return res.status(404).json({
          code: 404,
          message: '辞书不存在',
          data: null
        });
      }
      res.json({
        code: 200,
        message: 'success',
        data: dict
      });
    } catch (e) {
      next(e);
    }
  }

  static createDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const created = DictionaryService.createUserDictionary(userId, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: created
      });
    } catch (e) {
      next(e);
    }
  }

  static updateDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const updated = DictionaryService.updateUserDictionary(userId, id, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: updated
      });
    } catch (e) {
      next(e);
    }
  }

  static deleteDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      DictionaryService.deleteUserDictionary(userId, id);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static addWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const id = req.params.dictionaryId || req.params.id;
      const wordId = req.params.wordId || req.body?.wordId;
      if (!wordId) {
        return res.status(400).json({ code: 400, message: 'wordId 不能为空', data: null });
      }
      const result = DictionaryService.addWordToDictionary(userId, id, wordId);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static removeWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const id = req.params.dictionaryId || req.params.id;
      const wordId = req.params.wordId || req.body?.wordId;
      if (!wordId) {
        return res.status(400).json({ code: 400, message: 'wordId 不能为空', data: null });
      }
      DictionaryService.removeWordFromDictionary(userId, id, wordId);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static getWordMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { wordId } = req.params;
      const data = DictionaryService.getWordUserDictionaries(userId, wordId);
      res.json({
        code: 200,
        message: 'success',
        data
      });
    } catch (e) {
      next(e);
    }
  }

  static syncWordMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { wordId } = req.params;
      const { dictionaryIds } = req.body;
      const data = DictionaryService.syncWordUserDictionaries(userId, wordId, dictionaryIds || []);
      res.json({
        code: 200,
        message: 'success',
        data
      });
    } catch (e) {
      next(e);
    }
  }

  static batchAddWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { wordIds } = req.body;
      const result = DictionaryService.batchAddWords(userId, id, wordIds || []);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  // Admin APIs
  static getAdminDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const list = DictionaryService.getAdminDictionaries();
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static createAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const created = DictionaryService.createAdminDictionary(req.body);
      res.json({
        code: 200,
        message: 'success',
        data: created
      });
    } catch (e) {
      next(e);
    }
  }

  static updateAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = DictionaryService.updateAdminDictionary(id, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: updated
      });
    } catch (e) {
      next(e);
    }
  }

  static deleteAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      DictionaryService.deleteAdminDictionary(id);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static importAdminWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { words } = req.body;
      const result = DictionaryService.importWordsToDictionary(id, words || []);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }
}
