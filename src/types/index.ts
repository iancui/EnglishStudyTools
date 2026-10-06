export type ProgressStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type StepType = 'WORD' | 'PHRASE' | 'STRUCTURE' | 'SENTENCE';

export interface WordMeaning {
  id: string;
  wordId: string;
  pos: string;
  definitionCn: string;
  definitionEn?: string;
  exampleEn?: string;
  exampleCn?: string;
}

export interface WordPhonics {
  id: string;
  wordId: string;
  sequence: number;
  text: string;
  phonetic: string;
  syllable: string;
  audioUrl?: string;
}

export interface UserWordProgress {
  id: string;
  userId: string;
  wordId: string;
  status: ProgressStatus;
  learnCount: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  mastery: number;
  lastLearnAt?: string;
  lastReviewAt?: string;
  nextReviewAt?: string;
}

export interface WordItem {
  id: string;
  text: string;
  phoneticUk: string;
  phoneticUs: string;
  activePhonetic?: string;
  phoneticPreference?: 'UK' | 'US';
  dictionarySource?: string;
  enablePhonics?: boolean;
  audioUkUrl?: string;
  audioUsUrl?: string;
  pos: string;
  difficulty: number;
  meanings: WordMeaning[];
  phonics: WordPhonics[];
  progress?: UserWordProgress | null;
}

export interface SentenceStep {
  id: string;
  sentenceId: string;
  stepNumber: number;
  content: string;
  translation: string;
  phonetic?: string;
  type: StepType;
  audioUrl?: string;
}

export interface SentenceAnalysis {
  id: string;
  sentenceId: string;
  text: string;
  startPosition: number;
  endPosition: number;
  type: string;
  explanation: string;
}

export interface SentenceItem {
  id: string;
  content: string;
  translation: string;
  level: string;
  audioUrl?: string;
  difficulty: number;
  steps: SentenceStep[];
  analyses: SentenceAnalysis[];
  progress?: {
    currentStep: number;
    status: string;
  } | null;
}

export interface DictionaryConfig {
  id: string;
  userId: string;
  englishDict: string;
  ecDict: string;
  phoneticType: 'UK' | 'US';
  audioType: 'UK' | 'US';
  enablePhonics: boolean;
}

export interface StatisticsData {
  todayLearnedWords: number;
  todayCorrect: number;
  todayWrong: number;
  todaySentences: number;
  studyTimeMinutes: number;
  masteredWords: number;
  learningWords: number;
  totalWords: number;
  progressPercent: number;
  accuracyRate: number;
}
