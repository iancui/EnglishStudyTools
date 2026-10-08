import { db } from '../db/storage.ts';
import { UserDictionaryConfig, Dictionary, DictionaryWord, Word } from '../types/index.ts';

export class DictionaryService {
  static async getSettingsBundle(userId: string) {
    return await db.getSettingsBundle(userId);
  }

  static async getConfig(userId: string): Promise<UserDictionaryConfig> {
    return await db.getDictionaryConfig(userId);
  }

  static async updateConfig(userId: string, partial: Partial<UserDictionaryConfig>): Promise<UserDictionaryConfig> {
    return await db.saveDictionaryConfig(userId, partial);
  }

  static applyWordDictionaryConfig(word: any, config: UserDictionaryConfig) {
    const isUs = config.phoneticType === 'US';
    return {
      ...word,
      activePhonetic: isUs ? (word.phoneticUs || word.phoneticUk) : (word.phoneticUk || word.phoneticUs),
      phoneticPreference: config.phoneticType,
      dictionarySource: config.defaultDictionaryId || config.englishDict || 'System',
      enablePhonics: config.enablePhonics
    };
  }

  // Dictionaries
  static async getAllDictionaries(userId: string) {
    return await db.getAllDictionaries(userId);
  }

  static async getDictionaryById(id: string) {
    const dict = await db.findDictionaryById(id);
    if (!dict) return null;
    const wordsWithDetails = await db.getDictionaryWords(id);
    return {
      ...dict,
      words: wordsWithDetails
    };
  }

  static async createUserDictionary(userId: string, data: { name: string; description?: string }) {
    if (!data.name || !data.name.trim()) {
      throw new Error('辞书名称不能为空');
    }

    const newDict: Dictionary = {
      id: `dict-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      code: `user_${Date.now()}`,
      description: data.description || '',
      ownerType: 'USER',
      ownerUserId: userId,
      isSystem: false,
      isPublic: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await db.createDictionary(newDict);
  }

  static async updateUserDictionary(userId: string, id: string, data: { name?: string; description?: string }) {
    const dict = await db.findDictionaryById(id);
    if (!dict) {
      throw new Error('辞书不存在');
    }
    if (dict.ownerType === 'SYSTEM' || dict.ownerUserId !== userId) {
      throw new Error('无权修改该辞书');
    }

    return await db.updateDictionary(id, data);
  }

  static async deleteUserDictionary(userId: string, id: string) {
    const dict = await db.findDictionaryById(id);
    if (!dict) {
      throw new Error('辞书不存在');
    }
    if (dict.ownerType === 'SYSTEM' || dict.ownerUserId !== userId) {
      throw new Error('无法删除系统辞书或非本人创建的辞书');
    }

    return await db.deleteDictionary(id);
  }

  static async addWordToDictionary(userId: string, dictionaryId: string, wordId: string) {
    const dict = await db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.isSystem || dict.ownerType === 'SYSTEM') {
      throw new Error('系统辞书由管理员维护，普通用户不能修改内容');
    }
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权向该辞书添加单词');
    }

    const word = await db.findWordById(wordId);
    if (!word) throw new Error('单词不存在');

    return await db.addWordToDictionary(dictionaryId, wordId);
  }

  static async removeWordFromDictionary(userId: string, dictionaryId: string, wordId: string) {
    const dict = await db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.isSystem || dict.ownerType === 'SYSTEM') {
      throw new Error('系统辞书由管理员维护，普通用户不能修改内容');
    }
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权从该辞书移除单词');
    }

    return await db.removeWordFromDictionary(dictionaryId, wordId);
  }

  static async getUserDictionaries(userId: string) {
    return await db.getUserDictionaries(userId);
  }

  static async getUserDictionaryWords(userId: string, dictionaryId: string) {
    const dict = await db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权查看该私有辞书');
    }
    return await db.getDictionaryWords(dictionaryId);
  }

  static async getWordUserDictionaries(userId: string, wordId: string) {
    const word = await db.findWordById(wordId);
    if (!word) throw new Error('单词不存在');
    const dictionaryIds = await db.getWordUserDictionaries(userId, wordId);
    const userDicts = await db.getUserDictionaries(userId);
    return {
      wordId,
      dictionaryIds,
      dictionaries: userDicts.filter(d => dictionaryIds.includes(d.id))
    };
  }

  static async syncWordUserDictionaries(userId: string, wordId: string, targetDictionaryIds: string[]) {
    const word = await db.findWordById(wordId);
    if (!word) throw new Error('单词不存在');

    const userDicts = await db.getUserDictionaries(userId);
    const validUserDictIds = new Set(userDicts.map(d => d.id));
    const currentDictIds = new Set(await db.getWordUserDictionaries(userId, wordId));

    const toAdd = targetDictionaryIds.filter(id => validUserDictIds.has(id) && !currentDictIds.has(id));
    const toRemove = [...currentDictIds].filter(id => !targetDictionaryIds.includes(id));

    for (const dictId of toAdd) {
      await db.addWordToDictionary(dictId, wordId);
    }

    for (const dictId of toRemove) {
      await db.removeWordFromDictionary(dictId, wordId);
    }

    const updatedDictIds = await db.getWordUserDictionaries(userId, wordId);
    return {
      wordId,
      dictionaryIds: updatedDictIds,
      dictionaries: userDicts.filter(d => updatedDictIds.includes(d.id))
    };
  }

  static async batchAddWords(userId: string, dictionaryId: string, wordIds: string[]) {
    const dict = await db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权向该辞书批量添加单词');
    }

    return await db.batchAddWordsToDictionary(dictionaryId, wordIds);
  }

  // Admin Methods
  static async getAdminDictionaries() {
    return await db.getAdminDictionaries();
  }

  static async createAdminDictionary(data: { name: string; code?: string; description?: string; isSystem?: boolean; isPublic?: boolean }) {
    if (!data.name || !data.name.trim()) throw new Error('辞书名称不能为空');

    const newDict: Dictionary = {
      id: `dict-sys-${Date.now()}`,
      name: data.name.trim(),
      code: data.code || `sys_${Date.now()}`,
      description: data.description || '',
      ownerType: 'SYSTEM',
      ownerUserId: null,
      isSystem: true,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await db.createDictionary(newDict);
  }

  static async updateAdminDictionary(id: string, data: Partial<Dictionary>) {
    const dict = await db.findDictionaryById(id);
    if (!dict) throw new Error('辞书不存在');
    return await db.updateDictionary(id, data);
  }

  static async deleteAdminDictionary(id: string) {
    const dict = await db.findDictionaryById(id);
    if (!dict) throw new Error('辞书不存在');
    return await db.deleteDictionary(id);
  }

  static async importWordsToDictionary(dictionaryId: string, words: Array<{ text: string; phoneticUk?: string; pos?: string; definitionCn?: string }>) {
    const dict = await db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');

    const addedWords: Word[] = [];
    const addedDictWords: DictionaryWord[] = [];

    for (const item of words) {
      if (!item.text || !item.text.trim()) continue;
      const cleanText = item.text.trim().toLowerCase();
      let word = await db.findWordByText(cleanText);

      if (!word) {
        word = {
          id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: cleanText,
          phoneticUk: item.phoneticUk || `/${cleanText}/`,
          phoneticUs: item.phoneticUk || `/${cleanText}/`,
          pos: item.pos || 'n.',
          difficulty: 1,
          meanings: [
            {
              id: `wm-${Date.now()}`,
              wordId: '',
              pos: item.pos || 'n.',
              definitionCn: item.definitionCn || '释义待补'
            }
          ],
          phonics: [
            {
              id: `wp-${Date.now()}`,
              wordId: '',
              sequence: 1,
              text: cleanText,
              phonetic: item.phoneticUk || `/${cleanText}/`,
              syllable: cleanText
            }
          ]
        };
        word.meanings[0].wordId = word.id;
        word.phonics[0].wordId = word.id;
        await db.createWord(word);
        addedWords.push(word);
      }

      const dw = await db.addWordToDictionary(dictionaryId, word.id);
      addedDictWords.push(dw);
    }

    return {
      importedCount: addedDictWords.length,
      newWordsCount: addedWords.length
    };
  }
}
