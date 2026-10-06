import { useState, useCallback } from 'react';

export class SpeechPlayer {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  /**
   * Select best voice following priority: en-US -> en-GB -> any English voice -> default
   */
  private static selectVoice(preferredLang: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Exact or case-insensitive match for preferredLang (e.g. en-US)
    const exact = voices.find(v => v.lang.toLowerCase() === preferredLang.toLowerCase());
    if (exact) return exact;

    // 2. en-US priority
    const usVoice = voices.find(v => v.lang.toLowerCase().includes('en-us') || v.lang.toLowerCase() === 'en_us');
    if (usVoice) return usVoice;

    // 3. en-GB priority
    const gbVoice = voices.find(v => v.lang.toLowerCase().includes('en-gb') || v.lang.toLowerCase() === 'en_gb');
    if (gbVoice) return gbVoice;

    // 4. Any English voice
    const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;

    // 5. Default browser voice fallback
    return voices[0] || null;
  }

  /**
   * Speak a word, phrase, or sentence using Web Speech API
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

      const targetLang = options.lang || 'en-US';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      const chosenVoice = this.selectVoice(targetLang);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      let hasResolved = false;
      const done = () => {
        if (!hasResolved) {
          hasResolved = true;
          resolve();
        }
      };

      utterance.onend = done;
      utterance.onerror = done;

      // Timeout fallback in case browser speech synthesis hangs
      setTimeout(done, 8000);

      this.synth.speak(utterance);
    });
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

/**
 * React hook to manage audio speaking state with visual feedback
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, options?: { lang?: string; rate?: number }) => {
    setIsSpeaking(true);
    try {
      await SpeechPlayer.speak(text, options);
    } catch {
      // non-blocking
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    SpeechPlayer.stop();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
