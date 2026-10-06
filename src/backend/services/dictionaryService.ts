import { db } from '../db/storage.ts';
import { UserDictionaryConfig } from '../types/index.ts';

export class DictionaryService {
  static getConfig(userId: string): UserDictionaryConfig {
    return db.getDictionaryConfig(userId);
  }

  static updateConfig(userId: string, partial: Partial<UserDictionaryConfig>): UserDictionaryConfig {
    return db.saveDictionaryConfig(userId, partial);
  }

  /**
   * Decorate word phonetic and display according to user config
   */
  static applyWordDictionaryConfig(word: any, config: UserDictionaryConfig) {
    const isUs = config.phoneticType === 'US';
    return {
      ...word,
      activePhonetic: isUs ? (word.phoneticUs || word.phoneticUk) : (word.phoneticUk || word.phoneticUs),
      phoneticPreference: config.phoneticType,
      dictionarySource: config.englishDict,
      enablePhonics: config.enablePhonics
    };
  }
}
