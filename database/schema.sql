-- LinguaStep MySQL 5.7 schema
-- 仅生成建表/初始化结构文件，本次不会执行。
-- 兼容 MySQL 5.7，不使用 MySQL 8.0 专用排序规则。
-- 业务数据应通过后台导入/管理，不再依赖 db_storage.json 作为最终数据源。

CREATE DATABASE IF NOT EXISTS linguastep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE linguastep;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS review_record;
DROP TABLE IF EXISTS learning_record;
DROP TABLE IF EXISTS study_session_word;
DROP TABLE IF EXISTS study_session;
DROP TABLE IF EXISTS user_sentence_progress;
DROP TABLE IF EXISTS user_word_progress;
DROP TABLE IF EXISTS user_dictionary_config;
DROP TABLE IF EXISTS sentence_practice_item;
DROP TABLE IF EXISTS sentence_practice_session;
DROP TABLE IF EXISTS sentence_analysis;
DROP TABLE IF EXISTS sentence_step;
DROP TABLE IF EXISTS sentence_word;
DROP TABLE IF EXISTS sentence;
DROP TABLE IF EXISTS word_phonics;
DROP TABLE IF EXISTS word_meaning;
DROP TABLE IF EXISTS dictionary_word;
DROP TABLE IF EXISTS word;
DROP TABLE IF EXISTS dictionary;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dictionary (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,
  owner_type ENUM('SYSTEM','USER') NOT NULL DEFAULT 'SYSTEM',
  owner_user_id VARCHAR(36) NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dictionary_owner(owner_user_id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE word (
  id VARCHAR(36) PRIMARY KEY,
  text VARCHAR(100) NOT NULL UNIQUE,
  phonetic_uk VARCHAR(100) NULL,
  phonetic_us VARCHAR(100) NULL,
  audio_uk_url VARCHAR(255) NULL,
  audio_us_url VARCHAR(255) NULL,
  pos VARCHAR(50) NULL,
  difficulty INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_word_text(text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE word_meaning (
  id VARCHAR(36) PRIMARY KEY,
  word_id VARCHAR(36) NOT NULL,
  pos VARCHAR(30) NOT NULL,
  definition_cn TEXT NOT NULL,
  definition_en TEXT NULL,
  example_en TEXT NULL,
  example_cn TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_word_meaning_word(word_id),
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE word_phonics (
  id VARCHAR(36) PRIMARY KEY,
  word_id VARCHAR(36) NOT NULL,
  sequence_no INT NOT NULL,
  text VARCHAR(50) NOT NULL,
  phonetic VARCHAR(50) NOT NULL,
  syllable VARCHAR(50) NOT NULL,
  audio_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_word_phonics(word_id, sequence_no),
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dictionary_word (
  id VARCHAR(36) PRIMARY KEY,
  dictionary_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  sequence_no INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  definition_source VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_dictionary_word(dictionary_id, word_id),
  INDEX idx_dictionary_word(dictionary_id, sequence_no),
  FOREIGN KEY (dictionary_id) REFERENCES dictionary(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence (
  id VARCHAR(36) PRIMARY KEY,
  content TEXT NOT NULL,
  translation TEXT NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'A1',
  audio_url VARCHAR(255) NULL,
  difficulty INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence_word (
  id VARCHAR(36) PRIMARY KEY,
  sentence_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  position_no INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sentence_word(sentence_id, position_no),
  INDEX idx_sentence_word_word(word_id),
  FOREIGN KEY (sentence_id) REFERENCES sentence(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence_step (
  id VARCHAR(36) PRIMARY KEY,
  sentence_id VARCHAR(36) NOT NULL,
  step_number INT NOT NULL,
  content TEXT NOT NULL,
  translation TEXT NOT NULL,
  phonetic VARCHAR(255) NULL,
  type ENUM('WORD','PHRASE','STRUCTURE','SENTENCE') NOT NULL DEFAULT 'WORD',
  audio_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sentence_step(sentence_id, step_number),
  FOREIGN KEY (sentence_id) REFERENCES sentence(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence_analysis (
  id VARCHAR(36) PRIMARY KEY,
  sentence_id VARCHAR(36) NOT NULL,
  text VARCHAR(100) NOT NULL,
  start_position INT NOT NULL,
  end_position INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  explanation TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sentence_analysis_sentence(sentence_id),
  FOREIGN KEY (sentence_id) REFERENCES sentence(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_dictionary_config (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  default_dictionary_id VARCHAR(36) NULL,
  sentence_dictionary_id VARCHAR(36) NULL,
  phonetic_type VARCHAR(10) NOT NULL DEFAULT 'UK',
  audio_type VARCHAR(10) NOT NULL DEFAULT 'UK',
  enable_phonics BOOLEAN NOT NULL DEFAULT TRUE,
  sentence_practice_count INT NOT NULL DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (default_dictionary_id) REFERENCES dictionary(id) ON DELETE SET NULL,
  FOREIGN KEY (sentence_dictionary_id) REFERENCES dictionary(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_word_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  status ENUM('NEW','LEARNING','REVIEW','MASTERED') NOT NULL DEFAULT 'NEW',
  learn_count INT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  mastery INT NOT NULL DEFAULT 0,
  last_learn_at DATETIME NULL,
  last_review_at DATETIME NULL,
  next_review_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_word_progress(user_id, word_id),
  INDEX idx_user_word_review(user_id, next_review_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_sentence_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  sentence_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  current_step INT NOT NULL DEFAULT 1,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_sentence_progress(user_id, sentence_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sentence_id) REFERENCES sentence(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE learning_record (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT TRUE,
  input_text VARCHAR(255) NULL,
  time_spent_sec INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_learning_record_user_time(user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review_record (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  interval_days DECIMAL(10,2) NOT NULL,
  next_review_at DATETIME NOT NULL,
  result VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_record_user_word(user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE study_session (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  mode ENUM('LEARN_AND_WRITE','WRITE_ONLY') NOT NULL DEFAULT 'LEARN_AND_WRITE',
  dictionary_id VARCHAR(36) NOT NULL,
  total_count INT NOT NULL,
  completed_count INT NOT NULL DEFAULT 0,
  exclude_mastered BOOLEAN NOT NULL DEFAULT TRUE,
  sort_mode ENUM('RANDOM','SEQUENCE','REVIEW_FIRST') NOT NULL DEFAULT 'RANDOM',
  status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  current_word_index INT NOT NULL DEFAULT 0,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_session_user_status(user_id, status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dictionary_id) REFERENCES dictionary(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE study_session_word (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  word_id VARCHAR(36) NOT NULL,
  sequence_no INT NOT NULL,
  learn_status ENUM('LEARN_PENDING','LEARNED','WRITE_PENDING','WRITTEN','COMPLETED') NOT NULL DEFAULT 'LEARN_PENDING',
  write_status ENUM('LEARN_PENDING','LEARNED','WRITE_PENDING','WRITTEN','COMPLETED') NOT NULL DEFAULT 'WRITE_PENDING',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN NULL,
  user_input VARCHAR(255) NULL,
  learned_at DATETIME NULL,
  written_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_study_session_word(session_id, sequence_no),
  INDEX idx_study_session_word_completed(session_id, completed),
  FOREIGN KEY (session_id) REFERENCES study_session(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES word(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence_practice_session (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  dictionary_id VARCHAR(36) NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'ALL',
  total_count INT NOT NULL,
  current_sentence_index INT NOT NULL DEFAULT 0,
  status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sentence_practice_user_status(user_id, status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dictionary_id) REFERENCES dictionary(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sentence_practice_item (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  sentence_id VARCHAR(36) NOT NULL,
  sequence_no INT NOT NULL,
  current_phase ENUM('PHRASE','REBUILD','COMPLETED') NOT NULL DEFAULT 'REBUILD',
  current_phrase_index INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sentence_practice_item(session_id, sequence_no),
  FOREIGN KEY (session_id) REFERENCES sentence_practice_session(id) ON DELETE CASCADE,
  FOREIGN KEY (sentence_id) REFERENCES sentence(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
