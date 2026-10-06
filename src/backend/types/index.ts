export type ProgressStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type StepType = 'WORD' | 'PHRASE' | 'STRUCTURE' | 'SENTENCE';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface Word {
  id: string;
  text: string;
  phoneticUk: string;
  phoneticUs: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
  pos: string;
  difficulty: number;
  meanings: WordMeaning[];
  phonics: WordPhonics[];
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
  type: string; // 称呼, 疑问词, 助动词, 主语, 动词, 时间状语, etc.
  explanation: string;
}

export interface Sentence {
  id: string;
  content: string;
  translation: string;
  level: string;
  audioUrl?: string;
  difficulty: number;
  steps: SentenceStep[];
  analyses: SentenceAnalysis[];
}

export interface UserDictionaryConfig {
  id: string;
  userId: string;
  englishDict: string; // 'Oxford' | 'Cambridge' | 'Collins' | 'Longman'
  ecDict: string;
  phoneticType: 'UK' | 'US';
  audioType: 'UK' | 'US';
  enablePhonics: boolean;
  createdAt: string;
  updatedAt: string;
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
  mastery: number; // 0 - 100
  lastLearnAt?: string;
  lastReviewAt?: string;
  nextReviewAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSentenceProgress {
  id: string;
  userId: string;
  sentenceId: string;
  status: string;
  currentStep: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningRecord {
  id: string;
  userId: string;
  itemType: 'WORD' | 'SENTENCE';
  itemId: string;
  action: 'LEARN' | 'MEMORIZE' | 'REVIEW' | 'STEP_COMPLETE';
  isCorrect: boolean;
  inputText?: string;
  timeSpentSec: number;
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  userId: string;
  wordId: string;
  intervalDays: number;
  nextReviewAt: string;
  result: 'SUCCESS' | 'FAIL';
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}
