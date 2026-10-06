import { db } from '../db/storage.ts';
import { UserDictionaryConfig, Dictionary, DictionaryWord, Word } from '../types/index.ts';

export class DictionaryService {
  static getConfig(userId: string): UserDictionaryConfig {
    return db.getDictionaryConfig(userId);
  }

  static updateConfig(userId: string, partial: Partial<UserDictionaryConfig>): UserDictionaryConfig {
    return db.saveDictionaryConfig(userId, partial);
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
  static getAllDictionaries(userId: string) {
    return db.getAllDictionaries(userId);
  }

  static getDictionaryById(id: string) {
    const dict = db.findDictionaryById(id);
    if (!dict) return null;
    const wordsWithDetails = db.getDictionaryWords(id);
    return {
      ...dict,
      words: wordsWithDetails
    };
  }

  static createUserDictionary(userId: string, data: { name: string; description?: string }) {
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

    return db.createDictionary(newDict);
  }

  static updateUserDictionary(userId: string, id: string, data: { name?: string; description?: string }) {
    const dict = db.findDictionaryById(id);
    if (!dict) {
      throw new Error('辞书不存在');
    }
    if (dict.ownerType === 'SYSTEM' || dict.ownerUserId !== userId) {
      throw new Error('无权修改该辞书');
    }

    return db.updateDictionary(id, data);
  }

  static deleteUserDictionary(userId: string, id: string) {
    const dict = db.findDictionaryById(id);
    if (!dict) {
      throw new Error('辞书不存在');
    }
    if (dict.ownerType === 'SYSTEM' || dict.ownerUserId !== userId) {
      throw new Error('无法删除系统辞书或非本人创建的辞书');
    }

    return db.deleteDictionary(id);
  }

  static addWordToDictionary(userId: string, dictionaryId: string, wordId: string) {
    const dict = db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权向该辞书添加单词');
    }

    const word = db.findWordById(wordId);
    if (!word) throw new Error('单词不存在');

    return db.addWordToDictionary(dictionaryId, wordId);
  }

  static removeWordFromDictionary(userId: string, dictionaryId: string, wordId: string) {
    const dict = db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权从该辞书移除单词');
    }

    return db.removeWordFromDictionary(dictionaryId, wordId);
  }

  static batchAddWords(userId: string, dictionaryId: string, wordIds: string[]) {
    const dict = db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');
    if (dict.ownerType === 'USER' && dict.ownerUserId !== userId) {
      throw new Error('无权向该辞书批量添加单词');
    }

    return db.batchAddWordsToDictionary(dictionaryId, wordIds);
  }

  // Admin Methods
  static getAdminDictionaries() {
    return db.getAdminDictionaries();
  }

  static createAdminDictionary(data: { name: string; code?: string; description?: string; isSystem?: boolean; isPublic?: boolean }) {
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

    return db.createDictionary(newDict);
  }

  static updateAdminDictionary(id: string, data: Partial<Dictionary>) {
    const dict = db.findDictionaryById(id);
    if (!dict) throw new Error('辞书不存在');
    return db.updateDictionary(id, data);
  }

  static deleteAdminDictionary(id: string) {
    const dict = db.findDictionaryById(id);
    if (!dict) throw new Error('辞书不存在');
    return db.deleteDictionary(id);
  }

  static importWordsToDictionary(dictionaryId: string, words: Array<{ text: string; phoneticUk?: string; pos?: string; definitionCn?: string }>) {
    const dict = db.findDictionaryById(dictionaryId);
    if (!dict) throw new Error('辞书不存在');

    const addedWords: Word[] = [];
    const addedDictWords: DictionaryWord[] = [];

    for (const item of words) {
      if (!item.text || !item.text.trim()) continue;
      const cleanText = item.text.trim().toLowerCase();
      let word = db.findWordByText(cleanText);

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
        db.createWord(word);
        addedWords.push(word);
      }

      const dw = db.addWordToDictionary(dictionaryId, word.id);
      addedDictWords.push(dw);
    }

    return {
      importedCount: addedDictWords.length,
      newWordsCount: addedWords.length
    };
  }
}
