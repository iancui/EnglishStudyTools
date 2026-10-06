import fs from 'fs';
import path from 'path';
import {
  User,
  Word,
  Sentence,
  UserDictionaryConfig,
  UserWordProgress,
  UserSentenceProgress,
  LearningRecord,
  ReviewRecord,
  ProgressStatus
} from '../types/index.ts';
import { SEED_WORDS, SEED_SENTENCES } from './seedData.ts';

const STORAGE_FILE = path.resolve(process.cwd(), 'db_storage.json');

interface DatabaseState {
  users: User[];
  words: Word[];
  sentences: Sentence[];
  configs: UserDictionaryConfig[];
  wordProgresses: UserWordProgress[];
  sentenceProgresses: UserSentenceProgress[];
  learningRecords: LearningRecord[];
  reviewRecords: ReviewRecord[];
}

class Storage {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(data) as Partial<DatabaseState>;
        return {
          users: parsed.users || this.defaultUsers(),
          words: parsed.words && parsed.words.length > 0 ? parsed.words : SEED_WORDS,
          sentences: parsed.sentences && parsed.sentences.length > 0 ? parsed.sentences : SEED_SENTENCES,
          configs: parsed.configs || this.defaultConfigs(),
          wordProgresses: parsed.wordProgresses || this.defaultProgresses(),
          sentenceProgresses: parsed.sentenceProgresses || [],
          learningRecords: parsed.learningRecords || [],
          reviewRecords: parsed.reviewRecords || []
        };
      }
    } catch (e) {
      console.warn('Failed to load db_storage.json, initializing fresh database:', e);
    }

    const initial: DatabaseState = {
      users: this.defaultUsers(),
      words: SEED_WORDS,
      sentences: SEED_SENTENCES,
      configs: this.defaultConfigs(),
      wordProgresses: this.defaultProgresses(),
      sentenceProgresses: [],
      learningRecords: [],
      reviewRecords: []
    };

    this.saveState(initial);
    return initial;
  }

  private defaultUsers(): User[] {
    return [
      {
        id: 'u-default',
        username: 'learner',
        email: 'learner@linguastep.com',
        // Mock hashed password for "123456"
        passwordHash: '$2a$10$w9uL2v5/yZ9T0kM4X7gI2eR9iK2vX0aQ8yW3oP1rS6tU5vY4wZ123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private defaultConfigs(): UserDictionaryConfig[] {
    return [
      {
        id: 'cfg-default',
        userId: 'u-default',
        englishDict: 'Oxford',
        ecDict: 'Oxford',
        phoneticType: 'UK',
        audioType: 'UK',
        enablePhonics: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private defaultProgresses(): UserWordProgress[] {
    // Seed some progress for words so dashboard looks rich immediately
    return [
      {
        id: 'p-1',
        userId: 'u-default',
        wordId: 'w-1', // holiday
        status: 'LEARNING',
        learnCount: 2,
        reviewCount: 1,
        correctCount: 2,
        wrongCount: 0,
        streak: 2,
        mastery: 50,
        lastLearnAt: new Date(Date.now() - 3600000).toISOString(),
        lastReviewAt: new Date(Date.now() - 1800000).toISOString(),
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'p-2',
        userId: 'u-default',
        wordId: 'w-2', // where
        status: 'MASTERED',
        learnCount: 5,
        reviewCount: 4,
        correctCount: 5,
        wrongCount: 0,
        streak: 5,
        mastery: 100,
        lastLearnAt: new Date(Date.now() - 86400000).toISOString(),
        lastReviewAt: new Date(Date.now() - 43200000).toISOString(),
        nextReviewAt: new Date(Date.now() + 259200000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private saveState(stateToSave?: DatabaseState) {
    try {
      const data = JSON.stringify(stateToSave || this.state, null, 2);
      fs.writeFileSync(STORAGE_FILE, data, 'utf-8');
    } catch (e) {
      console.error('Failed to write db_storage.json:', e);
    }
  }

  // User queries
  findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string): User | undefined {
    return this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.state.users.push(user);
    // Create default config
    const config: UserDictionaryConfig = {
      id: `cfg-${Date.now()}`,
      userId: user.id,
      englishDict: 'Oxford',
      ecDict: 'Oxford',
      phoneticType: 'UK',
      audioType: 'UK',
      enablePhonics: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.configs.push(config);
    this.saveState();
    return user;
  }

  // Dictionary Config
  getDictionaryConfig(userId: string): UserDictionaryConfig {
    let cfg = this.state.configs.find(c => c.userId === userId);
    if (!cfg) {
      cfg = {
        id: `cfg-${Date.now()}`,
        userId,
        englishDict: 'Oxford',
        ecDict: 'Oxford',
        phoneticType: 'UK',
        audioType: 'UK',
        enablePhonics: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.state.configs.push(cfg);
      this.saveState();
    }
    return cfg;
  }

  saveDictionaryConfig(userId: string, partial: Partial<UserDictionaryConfig>): UserDictionaryConfig {
    let cfg = this.state.configs.find(c => c.userId === userId);
    if (cfg) {
      Object.assign(cfg, partial, { updatedAt: new Date().toISOString() });
    } else {
      cfg = {
        id: `cfg-${Date.now()}`,
        userId,
        englishDict: partial.englishDict || 'Oxford',
        ecDict: partial.ecDict || 'Oxford',
        phoneticType: partial.phoneticType || 'UK',
        audioType: partial.audioType || 'UK',
        enablePhonics: partial.enablePhonics !== undefined ? partial.enablePhonics : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.state.configs.push(cfg);
    }
    this.saveState();
    return cfg;
  }

  // Word queries
  getAllWords(): Word[] {
    return this.state.words;
  }

  findWordById(id: string): Word | undefined {
    return this.state.words.find(w => w.id === id);
  }

  findWordByText(text: string): Word | undefined {
    return this.state.words.find(w => w.text.toLowerCase() === text.trim().toLowerCase());
  }

  // Word Progress
  getWordProgress(userId: string, wordId: string): UserWordProgress | undefined {
    return this.state.wordProgresses.find(p => p.userId === userId && p.wordId === wordId);
  }

  getAllWordProgresses(userId: string): UserWordProgress[] {
    return this.state.wordProgresses.filter(p => p.userId === userId);
  }

  saveWordProgress(progress: UserWordProgress): UserWordProgress {
    const idx = this.state.wordProgresses.findIndex(
      p => p.userId === progress.userId && p.wordId === progress.wordId
    );
    if (idx >= 0) {
      this.state.wordProgresses[idx] = { ...progress, updatedAt: new Date().toISOString() };
    } else {
      this.state.wordProgresses.push(progress);
    }
    this.saveState();
    return progress;
  }

  // Sentence queries
  getAllSentences(): Sentence[] {
    return this.state.sentences;
  }

  findSentenceById(id: string): Sentence | undefined {
    return this.state.sentences.find(s => s.id === id);
  }

  getSentenceProgress(userId: string, sentenceId: string): UserSentenceProgress | undefined {
    return this.state.sentenceProgresses.find(p => p.userId === userId && p.sentenceId === sentenceId);
  }

  saveSentenceProgress(progress: UserSentenceProgress): UserSentenceProgress {
    const idx = this.state.sentenceProgresses.findIndex(
      p => p.userId === progress.userId && p.sentenceId === progress.sentenceId
    );
    if (idx >= 0) {
      this.state.sentenceProgresses[idx] = { ...progress, updatedAt: new Date().toISOString() };
    } else {
      this.state.sentenceProgresses.push(progress);
    }
    this.saveState();
    return progress;
  }

  // Learning Records
  addLearningRecord(record: LearningRecord): LearningRecord {
    this.state.learningRecords.push(record);
    this.saveState();
    return record;
  }

  getLearningRecords(userId: string): LearningRecord[] {
    return this.state.learningRecords.filter(r => r.userId === userId);
  }

  // Review Records
  addReviewRecord(record: ReviewRecord): ReviewRecord {
    this.state.reviewRecords.push(record);
    this.saveState();
    return record;
  }
}

export const db = new Storage();
