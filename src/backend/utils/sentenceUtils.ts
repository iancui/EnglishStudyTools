import { Sentence, SentencePhrase } from '../types/index.ts';

/**
 * Normalizes an English answer string according to Phase 2 rules:
 * 1. Trim leading and trailing whitespace
 * 2. Case-insensitive (lowercase)
 * 3. Collapse multiple whitespace characters into single space
 * 4. Normalize curly quotes and apostrophes
 * 5. Allow omission of terminal English punctuation (.?!,:;)
 */
export function normalizeAnswer(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.?!,:;]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkSentenceAnswer(userAnswer: string, expectedAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(expectedAnswer);
}

/**
 * Decomposes a Sentence into meaningful progressive phrases/structures.
 * Excludes the terminal full 'SENTENCE' step which is practiced during the REBUILD phase.
 */
export function extractSentencePhrases(sentence: Sentence): SentencePhrase[] {
  const steps = sentence.steps || [];
  const phraseSteps = steps.filter(s => s.type !== 'SENTENCE');

  if (phraseSteps.length > 0) {
    return phraseSteps.map((s, idx) => ({
      id: s.id || `sp-${sentence.id}-${idx + 1}`,
      sentenceId: sentence.id,
      sequence: idx + 1,
      english: s.content,
      chinese: s.translation,
      phonetic: s.phonetic,
      type: s.type
    }));
  }

  return [{
    id: `sp-${sentence.id}-1`,
    sentenceId: sentence.id,
    sequence: 1,
    english: sentence.content,
    chinese: sentence.translation,
    phonetic: '',
    type: 'PHRASE'
  }];
}
