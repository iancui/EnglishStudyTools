USE linguastep;

ALTER TABLE dictionary
  ADD COLUMN word_count INT NOT NULL DEFAULT 0 AFTER status;

UPDATE dictionary d
LEFT JOIN (
  SELECT dictionary_id, COUNT(*) AS cnt
  FROM dictionary_word
  WHERE is_active=1
  GROUP BY dictionary_id
) x ON x.dictionary_id=d.id
SET d.word_count=COALESCE(x.cnt,0);
