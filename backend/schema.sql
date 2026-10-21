CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  instructor_erez INTEGER NOT NULL,
  instructor_sima INTEGER NOT NULL,
  instructor_leon INTEGER NOT NULL,
  instructor_comments TEXT,
  relevance_rating INTEGER NOT NULL,
  relevance_comments TEXT,
  environment_rating INTEGER NOT NULL,
  environment_comments TEXT,
  overall_rating INTEGER NOT NULL,
  overall_comments TEXT,
  improvement_comments TEXT
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
