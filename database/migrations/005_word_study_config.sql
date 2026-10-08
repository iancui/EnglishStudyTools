-- Add default word-study preferences to the user's configuration.
-- Run once against existing databases:
-- mysql -u linguastep -p linguastep < database/migrations/005_word_study_config.sql

ALTER TABLE user_dictionary_config
  ADD COLUMN word_study_count INT NOT NULL DEFAULT 20 AFTER sentence_practice_count,
  ADD COLUMN word_study_chapter_id VARCHAR(36) NULL AFTER word_study_count,
  ADD COLUMN word_study_sort_mode VARCHAR(20) NOT NULL DEFAULT 'RANDOM' AFTER word_study_chapter_id,
  ADD COLUMN word_study_exclude_mastered BOOLEAN NOT NULL DEFAULT TRUE AFTER word_study_sort_mode,
  ADD COLUMN word_study_mode VARCHAR(30) NOT NULL DEFAULT 'LEARN_AND_WRITE' AFTER word_study_exclude_mastered,
  ADD INDEX idx_user_dictionary_config_word_chapter(word_study_chapter_id),
  ADD CONSTRAINT fk_user_dictionary_config_word_chapter
    FOREIGN KEY (word_study_chapter_id) REFERENCES dictionary_chapter(id) ON DELETE SET NULL;
