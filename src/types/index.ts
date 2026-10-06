export type ProgressStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type StepType = 'WORD' | 'PHRASE' | 'STRUCTURE' | 'SENTENCE';
export type UserRole = 'USER' | 'ADMIN';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export type DictionaryOwnerType = 'SYSTEM' | 'USER';
export type DictionaryStatus = 'ACTIVE' | 'INACTIVE';

export interface DictionaryItem {
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

export interface DictionaryWordItem {
  id: string;
  dictionaryId: string;
  wordId: string;
  sequence: number;
  isActive: boolean;
  definitionSource?: string;
  createdAt: string;
  word?: WordItem;
}

export interface WordMyDictionariesInfo {
  wordId: string;
  dictionaryIds: string[];
  dictionaries: DictionaryItem[];
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

export type SessionMode = 'LEARN_AND_WRITE' | 'WRITE_ONLY';
export type SessionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SessionSortMode = 'RANDOM' | 'SEQUENCE' | 'REVIEW_FIRST';
export type SessionWordStatus = 'LEARN_PENDING' | 'LEARNED' | 'WRITE_PENDING' | 'WRITTEN' | 'COMPLETED';

export interface StudySessionWordItem {
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
  word?: WordItem;
}

export interface StudySessionItem {
  id: string;
  userId: string;
  mode: SessionMode;
  dictionaryId: string;
  dictionary?: DictionaryItem;
  totalCount: number;
  completedCount: number;
  excludeMastered: boolean;
  sortMode: SessionSortMode;
  status: SessionStatus;
  currentWordIndex: number;
  startedAt: string;
  completedAt?: string;
  words: StudySessionWordItem[];
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
  defaultDictionaryId?: string;
  englishDict?: string;
  ecDict?: string;
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
