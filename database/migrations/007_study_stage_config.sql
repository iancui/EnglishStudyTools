-- Add configurable post-learning stages for word study.
-- mysql -u linguastep -p linguastep < database/migrations/007_study_stage_config.sql

ALTER TABLE user_dictionary_config
  ADD COLUMN word_study_include_write BOOLEAN NOT NULL DEFAULT TRUE AFTER word_study_dictation_order,
  ADD COLUMN word_study_include_dictation BOOLEAN NOT NULL DEFAULT TRUE AFTER word_study_include_write;

ALTER TABLE study_session
  ADD COLUMN include_write BOOLEAN NOT NULL DEFAULT TRUE AFTER dictation_sort_mode,
  ADD COLUMN include_dictation BOOLEAN NOT NULL DEFAULT TRUE AFTER include_write;
