import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { DictionaryService } from '../services/dictionaryService.ts';
import { StudySessionService } from '../services/studySessionService.ts';

export class DictionaryController {
  // Config
  static async getSettingsBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const startedAt = Date.now();
      const data = await DictionaryService.getSettingsBundle(userId);
      const elapsedMs = Date.now() - startedAt;
      console.log('[perf:dictionary/settings-bundle]', {
        userId,
        elapsedMs,
        dictionaryCount: data?.dictionaries?.length || 0,
        myDictionaryCount: data?.myDictionaries?.length || 0
      });
      res.json({ code: 200, message: 'success', data });
    } catch (e) {
      next(e);
    }
  }

  static async getConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const config = await DictionaryService.getConfig(userId);
      res.json({
        code: 200,
        message: 'success',
        data: config
      });
    } catch (e) {
      next(e);
    }
  }

  static async updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const before = await DictionaryService.getConfig(userId);
      const activeSession = await StudySessionService.getActiveSession(userId);

      // 修改会影响选词的学习配置时，当前批次属于旧学习计划。
      // 旧批次直接取消，不创建新批次；回到首页后显示“开始背单词”，
      // 用户主动点击后才按最新配置创建新的学习批次。
      const changedLearningConfig =
        before.defaultDictionaryId !== req.body?.defaultDictionaryId ||
        (before.wordStudyChapterId || '') !== (req.body?.wordStudyChapterId || '') ||
        Number(before.wordStudyCount || 20) !== Number(req.body?.wordStudyCount || 20) ||
        (before.wordStudySortMode || 'RANDOM') !== (req.body?.wordStudySortMode || 'RANDOM') ||
        Boolean(before.wordStudyExcludeMastered !== false) !== Boolean(req.body?.wordStudyExcludeMastered !== false) ||
        (before.wordStudyMode || 'LEARN_AND_WRITE') !== (req.body?.wordStudyMode || 'LEARN_AND_WRITE');

      const config = await DictionaryService.updateConfig(userId, req.body);

      if (activeSession && changedLearningConfig) {
        await StudySessionService.cancelSession(activeSession.id, userId);
      }

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
  static async getMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = await DictionaryService.getUserDictionaries(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static async getMyDictionaryWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const dictId = req.params.dictionaryId || req.params.id;
      const list = await DictionaryService.getUserDictionaryWords(userId, dictId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static async getAllDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const list = await DictionaryService.getAllDictionaries(userId);
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static async getDictionaryChapters(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ code: 200, message: 'success', data: await DictionaryService.getDictionaryChapters(req.params.id) }); } catch (e) { next(e); }
  }
  static async createDictionaryChapter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { const data=await DictionaryService.createDictionaryChapter(req.user?.id||'u-default',req.params.id,req.body); res.json({code:200,message:'success',data}); } catch(e){next(e);}
  }

  static async getDictionaryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dict = await DictionaryService.getDictionaryById(id);
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

  static async createDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const created = await DictionaryService.createUserDictionary(userId, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: created
      });
    } catch (e) {
      next(e);
    }
  }

  static async updateDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const updated = await DictionaryService.updateUserDictionary(userId, id, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: updated
      });
    } catch (e) {
      next(e);
    }
  }

  static async deleteDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      await DictionaryService.deleteUserDictionary(userId, id);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static async addWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const id = req.params.dictionaryId || req.params.id;
      const wordId = req.params.wordId || req.body?.wordId;
      if (!wordId) {
        return res.status(400).json({ code: 400, message: 'wordId 不能为空', data: null });
      }
      const result = await DictionaryService.addWordToDictionary(userId, id, wordId);
      res.json({
        code: 200,
        message: 'success',
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  static async removeWord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const id = req.params.dictionaryId || req.params.id;
      const wordId = req.params.wordId || req.body?.wordId;
      if (!wordId) {
        return res.status(400).json({ code: 400, message: 'wordId 不能为空', data: null });
      }
      await DictionaryService.removeWordFromDictionary(userId, id, wordId);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static async getWordMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { wordId } = req.params;
      const data = await DictionaryService.getWordUserDictionaries(userId, wordId);
      res.json({
        code: 200,
        message: 'success',
        data
      });
    } catch (e) {
      next(e);
    }
  }

  static async syncWordMyDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { wordId } = req.params;
      const { dictionaryIds } = req.body;
      const data = await DictionaryService.syncWordUserDictionaries(userId, wordId, dictionaryIds || []);
      res.json({
        code: 200,
        message: 'success',
        data
      });
    } catch (e) {
      next(e);
    }
  }

  static async batchAddWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'u-default';
      const { id } = req.params;
      const { wordIds } = req.body;
      const result = await DictionaryService.batchAddWords(userId, id, wordIds || []);
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
  static async getAdminDictionaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const list = await DictionaryService.getAdminDictionaries();
      res.json({
        code: 200,
        message: 'success',
        data: list
      });
    } catch (e) {
      next(e);
    }
  }

  static async createAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const created = await DictionaryService.createAdminDictionary(req.body);
      res.json({
        code: 200,
        message: 'success',
        data: created
      });
    } catch (e) {
      next(e);
    }
  }

  static async updateAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await DictionaryService.updateAdminDictionary(id, req.body);
      res.json({
        code: 200,
        message: 'success',
        data: updated
      });
    } catch (e) {
      next(e);
    }
  }

  static async deleteAdminDictionary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await DictionaryService.deleteAdminDictionary(id);
      res.json({
        code: 200,
        message: 'success',
        data: { success: true }
      });
    } catch (e) {
      next(e);
    }
  }

  static async importAdminWords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { words } = req.body;
      const result = await DictionaryService.importWordsToDictionary(id, words || []);
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
