import fs from 'fs';
import path from 'path';
import {
  User,
  Word,
  Sentence,
  Dictionary,
  DictionaryWord,
  StudySession,
  StudySessionWord,
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
  dictionaries: Dictionary[];
  dictionaryWords: DictionaryWord[];
  studySessions: StudySession[];
  studySessionWords: StudySessionWord[];
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
        const loaded: DatabaseState = {
          users: parsed.users && parsed.users.length > 0 ? parsed.users : this.defaultUsers(),
          words: parsed.words && parsed.words.length > 0 ? parsed.words : SEED_WORDS,
          sentences: parsed.sentences && parsed.sentences.length > 0 ? parsed.sentences : SEED_SENTENCES,
          dictionaries: parsed.dictionaries && parsed.dictionaries.length > 0 ? parsed.dictionaries : this.defaultDictionaries(),
          dictionaryWords: parsed.dictionaryWords && parsed.dictionaryWords.length > 0 ? parsed.dictionaryWords : this.defaultDictionaryWords(),
          studySessions: parsed.studySessions || [],
          studySessionWords: parsed.studySessionWords || [],
          configs: parsed.configs || this.defaultConfigs(),
          wordProgresses: parsed.wordProgresses || this.defaultProgresses(),
          sentenceProgresses: parsed.sentenceProgresses || [],
          learningRecords: parsed.learningRecords || [],
          reviewRecords: parsed.reviewRecords || []
        };
        // Ensure default admin & demo users exist
        if (!loaded.users.find(u => u.role === 'ADMIN')) {
          loaded.users.push(this.defaultAdminUser());
        }
        return loaded;
      }
    } catch (e) {
      console.warn('Failed to load db_storage.json, initializing fresh database:', e);
    }

    const initial: DatabaseState = {
      users: this.defaultUsers(),
      words: SEED_WORDS,
      sentences: SEED_SENTENCES,
      dictionaries: this.defaultDictionaries(),
      dictionaryWords: this.defaultDictionaryWords(),
      studySessions: [],
      studySessionWords: [],
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
        role: 'USER',
        passwordHash: '$2a$10$w9uL2v5/yZ9T0kM4X7gI2eR9iK2vX0aQ8yW3oP1rS6tU5vY4wZ123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      this.defaultAdminUser()
    ];
  }

  private defaultAdminUser(): User {
    return {
      id: 'u-admin',
      username: 'admin',
      email: 'admin@linguastep.com',
      role: 'ADMIN',
      passwordHash: '$2a$10$w9uL2v5/yZ9T0kM4X7gI2eR9iK2vX0aQ8yW3oP1rS6tU5vY4wZ123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private defaultDictionaries(): Dictionary[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'dict-primary-6',
        name: '小学英语六年级上册',
        code: 'primary_grade_6',
        description: '教育部教材同步词汇，涵盖日常生活、学校活动与假期的核心常用词汇',
        ownerType: 'SYSTEM',
        ownerUserId: null,
        isSystem: true,
        isPublic: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dict-junior',
        name: '初中英语核心词汇',
        code: 'junior_middle_school',
        description: '中考高频核心词汇精选，重点攻克交流表达、句式展开与习惯用语',
        ownerType: 'SYSTEM',
        ownerUserId: null,
        isSystem: true,
        isPublic: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dict-cet4',
        name: '大学英语四级必备',
        code: 'cet_4_core',
        description: '全国大学英语四级考试核心必背词汇，涵盖学术探索、社会与科技常用词',
        ownerType: 'SYSTEM',
        ownerUserId: null,
        isSystem: true,
        isPublic: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dict-travel',
        name: '日常生活与出行旅游',
        code: 'travel_and_life',
        description: '出国旅行、城市探索、交通与生活问候必备的高频场景词汇',
        ownerType: 'SYSTEM',
        ownerUserId: null,
        isSystem: true,
        isPublic: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dict-user-custom',
        name: '我的生词本',
        code: 'my_vocab_notes',
        description: '个性化收藏的高频生词、难词与重点复习词库',
        ownerType: 'USER',
        ownerUserId: 'u-default',
        isSystem: false,
        isPublic: false,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private defaultDictionaryWords(): DictionaryWord[] {
    const now = new Date().toISOString();
    const result: DictionaryWord[] = [];

    // Primary 6 words (Words 1-20, plus seasons and family)
    const primaryWordIds = [
      'w-1', 'w-2', 'w-3', 'w-7', 'w-8', 'w-9', 'w-10', 'w-11', 'w-12', 'w-13',
      'w-14', 'w-15', 'w-16', 'w-18', 'w-19', 'w-21', 'w-45', 'w-47', 'w-48', 'w-50'
    ];
    primaryWordIds.forEach((wid, idx) => {
      result.push({
        id: `dw-p6-${wid}`,
        dictionaryId: 'dict-primary-6',
        wordId: wid,
        sequence: idx + 1,
        isActive: true,
        definitionSource: 'PEP Primary English',
        createdAt: now
      });
    });

    // Junior words (Words 1-35)
    const juniorWordIds = [
      'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-7', 'w-8', 'w-9', 'w-17',
      'w-20', 'w-21', 'w-22', 'w-23', 'w-24', 'w-25', 'w-26', 'w-27', 'w-28', 'w-30',
      'w-31', 'w-32', 'w-33', 'w-34', 'w-35', 'w-36', 'w-45', 'w-46', 'w-47', 'w-49'
    ];
    juniorWordIds.forEach((wid, idx) => {
      result.push({
        id: `dw-jn-${wid}`,
        dictionaryId: 'dict-junior',
        wordId: wid,
        sequence: idx + 1,
        isActive: true,
        definitionSource: 'Junior English Core',
        createdAt: now
      });
    });

    // CET-4 words (Words 20-50, academic & advanced)
    const cet4WordIds = [
      'w-4', 'w-5', 'w-6', 'w-22', 'w-23', 'w-24', 'w-25', 'w-26', 'w-27', 'w-28',
      'w-29', 'w-30', 'w-36', 'w-37', 'w-38', 'w-39', 'w-40', 'w-41', 'w-42', 'w-43',
      'w-44', 'w-46', 'w-48', 'w-49'
    ];
    cet4WordIds.forEach((wid, idx) => {
      result.push({
        id: `dw-cet-${wid}`,
        dictionaryId: 'dict-cet4',
        wordId: wid,
        sequence: idx + 1,
        isActive: true,
        definitionSource: 'CET-4 Syllabus',
        createdAt: now
      });
    });

    // Travel words
    const travelWordIds = [
      'w-1', 'w-2', 'w-3', 'w-10', 'w-11', 'w-17', 'w-18', 'w-19', 'w-21', 'w-23',
      'w-31', 'w-32', 'w-42', 'w-43', 'w-49', 'w-50'
    ];
    travelWordIds.forEach((wid, idx) => {
      result.push({
        id: `dw-tr-${wid}`,
        dictionaryId: 'dict-travel',
        wordId: wid,
        sequence: idx + 1,
        isActive: true,
        definitionSource: 'Travel English',
        createdAt: now
      });
    });

    // User notebook words
    const userWordIds = ['w-1', 'w-4', 'w-6', 'w-24', 'w-38', 'w-41', 'w-43', 'w-49'];
    userWordIds.forEach((wid, idx) => {
      result.push({
        id: `dw-user-${wid}`,
        dictionaryId: 'dict-user-custom',
        wordId: wid,
        sequence: idx + 1,
        isActive: true,
        definitionSource: 'User Vocabulary Notes',
        createdAt: now
      });
    });

    return result;
  }

  private defaultConfigs(): UserDictionaryConfig[] {
    return [
      {
        id: 'cfg-default',
        userId: 'u-default',
        defaultDictionaryId: 'dict-primary-6',
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
      defaultDictionaryId: 'dict-primary-6',
      englishDict: 'Oxford',
      ecDict: 'Oxford',
      phoneticType: 'UK',
      audioType: 'UK',
      enablePhonics: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.configs.push(config);
    // Create default personal dictionary
    const personalDict: Dictionary = {
      id: `dict-user-${user.id}`,
      name: `${user.username}的生词本`,
      code: `vocab_${user.username}_${Date.now().toString(36)}`,
      description: '个人专属生词与高频复习词汇集',
      ownerType: 'USER',
      ownerUserId: user.id,
      isSystem: false,
      isPublic: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.dictionaries.push(personalDict);
    this.saveState();
    return user;
  }

  // Dictionary queries
  getAllDictionaries(userId?: string): (Dictionary & { wordCount: number })[] {
    return this.state.dictionaries
      .filter(d => {
        if (d.status === 'INACTIVE') return false;
        if (d.isSystem || d.isPublic) return true;
        if (userId && d.ownerUserId === userId) return true;
        return false;
      })
      .map(d => {
        const count = this.state.dictionaryWords.filter(dw => dw.dictionaryId === d.id && dw.isActive).length;
        return { ...d, wordCount: count };
      });
  }

  getAdminDictionaries(): (Dictionary & { wordCount: number })[] {
    return this.state.dictionaries.map(d => {
      const count = this.state.dictionaryWords.filter(dw => dw.dictionaryId === d.id && dw.isActive).length;
      return { ...d, wordCount: count };
    });
  }

  findDictionaryById(id: string): (Dictionary & { wordCount: number }) | undefined {
    const d = this.state.dictionaries.find(item => item.id === id);
    if (!d) return undefined;
    const count = this.state.dictionaryWords.filter(dw => dw.dictionaryId === d.id && dw.isActive).length;
    return { ...d, wordCount: count };
  }

  createDictionary(dict: Dictionary): Dictionary {
    this.state.dictionaries.push(dict);
    this.saveState();
    return dict;
  }

  updateDictionary(id: string, partial: Partial<Dictionary>): Dictionary | undefined {
    const idx = this.state.dictionaries.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.state.dictionaries[idx] = {
      ...this.state.dictionaries[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    this.saveState();
    return this.state.dictionaries[idx];
  }

  deleteDictionary(id: string): boolean {
    const beforeCount = this.state.dictionaries.length;
    this.state.dictionaries = this.state.dictionaries.filter(d => d.id !== id);
    this.state.dictionaryWords = this.state.dictionaryWords.filter(dw => dw.dictionaryId !== id);
    this.saveState();
    return this.state.dictionaries.length < beforeCount;
  }

  // Dictionary Word queries
  getDictionaryWords(dictionaryId: string): (DictionaryWord & { word?: Word })[] {
    const list = this.state.dictionaryWords
      .filter(dw => dw.dictionaryId === dictionaryId && dw.isActive)
      .sort((a, b) => a.sequence - b.sequence);

    return list.map(dw => ({
      ...dw,
      word: this.findWordById(dw.wordId)
    }));
  }

  addWordToDictionary(dictionaryId: string, wordId: string, sequence?: number): DictionaryWord {
    const existing = this.state.dictionaryWords.find(dw => dw.dictionaryId === dictionaryId && dw.wordId === wordId);
    if (existing) {
      existing.isActive = true;
      this.saveState();
      return existing;
    }

    const currentWords = this.state.dictionaryWords.filter(dw => dw.dictionaryId === dictionaryId);
    const maxSeq = currentWords.length > 0 ? Math.max(...currentWords.map(w => w.sequence)) : 0;

    const newDW: DictionaryWord = {
      id: `dw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dictionaryId,
      wordId,
      sequence: sequence ?? (maxSeq + 1),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.state.dictionaryWords.push(newDW);
    this.saveState();
    return newDW;
  }

  removeWordFromDictionary(dictionaryId: string, wordId: string): boolean {
    const idx = this.state.dictionaryWords.findIndex(dw => dw.dictionaryId === dictionaryId && dw.wordId === wordId);
    if (idx === -1) return false;
    this.state.dictionaryWords.splice(idx, 1);
    this.saveState();
    return true;
  }

  batchAddWordsToDictionary(dictionaryId: string, wordIds: string[]): DictionaryWord[] {
    const added: DictionaryWord[] = [];
    wordIds.forEach(wid => {
      if (this.findWordById(wid)) {
        added.push(this.addWordToDictionary(dictionaryId, wid));
      }
    });
    return added;
  }

  // Dictionary Config
  getDictionaryConfig(userId: string): UserDictionaryConfig {
    let cfg = this.state.configs.find(c => c.userId === userId);
    if (!cfg) {
      cfg = {
        id: `cfg-${Date.now()}`,
        userId,
        defaultDictionaryId: 'dict-primary-6',
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
        defaultDictionaryId: partial.defaultDictionaryId || 'dict-primary-6',
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

  createWord(word: Word): Word {
    this.state.words.push(word);
    this.saveState();
    return word;
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

  // Study Sessions
  createStudySession(session: StudySession, sessionWords: StudySessionWord[]): StudySession {
    // If there's an existing IN_PROGRESS session for this user, mark it CANCELLED
    this.state.studySessions.forEach(s => {
      if (s.userId === session.userId && s.status === 'IN_PROGRESS') {
        s.status = 'CANCELLED';
        s.updatedAt = new Date().toISOString();
      }
    });

    this.state.studySessions.push(session);
    this.state.studySessionWords.push(...sessionWords);
    this.saveState();
    return session;
  }

  findStudySessionById(id: string): (StudySession & { words: StudySessionWord[]; dictionary?: Dictionary }) | undefined {
    const session = this.state.studySessions.find(s => s.id === id);
    if (!session) return undefined;

    const words = this.state.studySessionWords
      .filter(sw => sw.sessionId === id)
      .sort((a, b) => a.sequence - b.sequence)
      .map(sw => ({
        ...sw,
        word: this.findWordById(sw.wordId)
      }));

    const dictionary = this.findDictionaryById(session.dictionaryId);

    return {
      ...session,
      words,
      dictionary
    };
  }

  getActiveSessionByUserId(userId: string): (StudySession & { words: StudySessionWord[]; dictionary?: Dictionary }) | undefined {
    const session = this.state.studySessions
      .filter(s => s.userId === userId && s.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    if (!session) return undefined;
    return this.findStudySessionById(session.id);
  }

  updateStudySession(session: StudySession): StudySession {
    const idx = this.state.studySessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      this.state.studySessions[idx] = { ...session, updatedAt: new Date().toISOString() };
    }
    this.saveState();
    return session;
  }

  updateStudySessionWord(sessionWord: StudySessionWord): StudySessionWord {
    const idx = this.state.studySessionWords.findIndex(sw => sw.id === sessionWord.id);
    if (idx >= 0) {
      this.state.studySessionWords[idx] = { ...sessionWord };
    }
    this.saveState();
    return sessionWord;
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
