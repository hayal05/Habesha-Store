-- Habesha Store schema (Postgres / Neon). Safe to run repeatedly: `npm run migrate`.
CREATE TABLE IF NOT EXISTS developers (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS apps (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  developer_id INTEGER NOT NULL REFERENCES developers(id),
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL CHECK (platform IN ('android','ios')),
  distribution TEXT NOT NULL DEFAULT 'apk',   -- apk | app_store | testflight | external
  download_url TEXT,
  icon_url TEXT,                              -- Cloudinary https URL
  version TEXT,
  min_os TEXT,                                -- e.g. 'Android 8.0+' or 'iOS 15+'
  file_size BIGINT,                           -- bytes
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','unpublished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS download_clicks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS screenshots (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                          -- Cloudinary https URL
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,                -- sha256 of the cookie value; the raw token is never stored
  developer_id INTEGER NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL                  -- epoch milliseconds
);
CREATE INDEX IF NOT EXISTS idx_shots_app ON screenshots(app_id, position);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_apps_developer ON apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_clicks_app ON download_clicks(app_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
