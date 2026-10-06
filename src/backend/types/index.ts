export type ProgressStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type StepType = 'WORD' | 'PHRASE' | 'STRUCTURE' | 'SENTENCE';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type DictionaryOwnerType = 'SYSTEM' | 'USER';
export type DictionaryStatus = 'ACTIVE' | 'INACTIVE';

export interface Dictionary {
  id: string;
  name: string;
  code: string;
  description?: string;
  ownerType: DictionaryOwnerType;
  ownerUserId?: string | null;
  isSystem: boolean;
  isPublic: boolean;
  status: DictionaryStatus;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DictionaryWord {
  id: string;
  dictionaryId: string;
  wordId: string;
  sequence: number;
  isActive: boolean;
  definitionSource?: string;
  createdAt: string;
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
  type: string;
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
  defaultDictionaryId?: string;
  englishDict?: string; // legacy fallback
  ecDict?: string; // legacy fallback
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

export type SessionMode = 'LEARN_AND_WRITE' | 'WRITE_ONLY';
export type SessionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SessionSortMode = 'RANDOM' | 'SEQUENCE' | 'REVIEW_FIRST';
export type SessionWordStatus = 'LEARN_PENDING' | 'LEARNED' | 'WRITE_PENDING' | 'WRITTEN' | 'COMPLETED';

export interface StudySession {
  id: string;
  userId: string;
  mode: SessionMode;
  dictionaryId: string;
  totalCount: number;
  completedCount: number;
  excludeMastered: boolean;
  sortMode: SessionSortMode;
  status: SessionStatus;
  currentWordIndex: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySessionWord {
  id: string;
  sessionId: string;
  wordId: string;
  sequence: number;
  learnStatus: SessionWordStatus;
  writeStatus: SessionWordStatus;
  completed: boolean;
  isCorrect?: boolean | null;
  userInput?: string | null;
  learnedAt?: string | null;
  writtenAt?: string | null;
  createdAt: string;
  word?: Word;
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

export type SentenceSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SentencePhase = 'PHRASE' | 'REBUILD' | 'COMPLETED';

export interface SentencePhrase {
  id: string;
  sentenceId: string;
  sequence: number;
  english: string;
  chinese: string;
  phonetic?: string;
  type: StepType;
}

export interface SentencePracticeItem {
  id: string;
  sessionId: string;
  sentenceId: string;
  sequence: number;
  currentPhase: SentencePhase;
  currentPhraseIndex: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  sentence?: Sentence;
  phrases?: SentencePhrase[];
}

export interface SentencePracticeSession {
  id: string;
  userId: string;
  difficulty: string;
  totalCount: number;
  currentSentenceIndex: number;
  status: SentenceSessionStatus;
  createdAt: string;
  updatedAt: string;
  items?: SentencePracticeItem[];
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
