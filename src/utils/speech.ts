export class SpeechPlayer {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  /**
   * Speak a phrase or word using Web Speech API
   */
  static speak(
    text: string,
    options: {
      lang?: string;
      rate?: number;
      pitch?: number;
    } = {}
  ): Promise<void> {
    return new Promise(resolve => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'en-GB';
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      // Find suitable voice if possible
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(
          v => v.lang.toLowerCase() === utterance.lang.toLowerCase()
        ) || voices.find(v => v.lang.startsWith('en'));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  /**
   * Pronounce a single phonics syllable
   */
  static speakSyllable(syllable: string, lang = 'en-GB'): Promise<void> {
    return this.speak(syllable, { lang, rate: 0.85, pitch: 1.05 });
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
