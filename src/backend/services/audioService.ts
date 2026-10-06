import { db } from '../db/storage.ts';

export class AudioService {
  /**
   * Resolve audio playback configuration for a text string or word
   */
  static getSpeechConfig(userId: string, text: string, speed: 'normal' | 'slow' = 'normal') {
    const config = db.getDictionaryConfig(userId);
    const lang = config.audioType === 'US' ? 'en-US' : 'en-GB';
    const rate = speed === 'slow' ? 0.75 : 1.0;

    return {
      text,
      lang,
      rate,
      audioType: config.audioType,
      pitch: 1.0
    };
  }

  /**
   * Generates web speech synthesis payload or simulated audio asset descriptor
   */
  static getWordAudioDescriptor(wordId: string, userId: string) {
    const word = db.findWordById(wordId);
    if (!word) return null;

    const config = db.getDictionaryConfig(userId);
    const audioUrl = config.audioType === 'US' ? word.audioUsUrl : word.audioUkUrl;

    return {
      word: word.text,
      audioUrl: audioUrl || null,
      lang: config.audioType === 'US' ? 'en-US' : 'en-GB',
      preferredType: config.audioType
    };
  }
}
