-- Dictionary chapter hierarchy migration for MySQL 5.7
-- Dictionary -> Chapter -> Words / Sentences
USE linguastep;

CREATE TABLE IF NOT EXISTS dictionary_chapter (
  id VARCHAR(36) PRIMARY KEY,
  dictionary_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NULL,
  description TEXT NULL,
  sequence_no INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_dictionary_chapter_code(dictionary_id, code),
  INDEX idx_dictionary_chapter_order(dictionary_id, sequence_no),
  FOREIGN KEY (dictionary_id) REFERENCES dictionary(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE dictionary_word
  ADD COLUMN chapter_id VARCHAR(36) NULL AFTER dictionary_id,
  ADD INDEX idx_dictionary_word_chapter(dictionary_id, chapter_id),
  ADD CONSTRAINT fk_dictionary_word_chapter
    FOREIGN KEY (chapter_id) REFERENCES dictionary_chapter(id) ON DELETE SET NULL;

ALTER TABLE dictionary_sentence
  ADD COLUMN chapter_id VARCHAR(36) NULL AFTER dictionary_id,
  ADD INDEX idx_dictionary_sentence_chapter(dictionary_id, chapter_id),
  ADD CONSTRAINT fk_dictionary_sentence_chapter
    FOREIGN KEY (chapter_id) REFERENCES dictionary_chapter(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO schema_migrations(version) VALUES ('004_dictionary_chapter');
