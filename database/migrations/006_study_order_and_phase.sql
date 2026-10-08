-- Add separate presentation-order preferences for word writing and reinforcement dictation.
-- Run once against existing databases:
-- mysql -u linguastep -p linguastep < database/migrations/006_study_order_and_phase.sql

ALTER TABLE user_dictionary_config
  ADD COLUMN word_study_write_order VARCHAR(10) NOT NULL DEFAULT 'SEQUENCE' AFTER word_study_sort_mode,
  ADD COLUMN word_study_dictation_order VARCHAR(10) NOT NULL DEFAULT 'RANDOM' AFTER word_study_write_order;

ALTER TABLE study_session
  ADD COLUMN write_sort_mode VARCHAR(10) NOT NULL DEFAULT 'SEQUENCE' AFTER sort_mode,
  ADD COLUMN dictation_sort_mode VARCHAR(10) NOT NULL DEFAULT 'RANDOM' AFTER write_sort_mode,
  ADD COLUMN phase VARCHAR(20) NOT NULL DEFAULT 'LEARN_WRITE' AFTER dictation_sort_mode;

ALTER TABLE study_session_word
  ADD COLUMN dictation_sequence_no INT NULL AFTER sequence_no;
