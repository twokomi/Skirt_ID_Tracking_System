-- Skirt Tracking System - Initial Schema

-- Locations table (MOD stations)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT,
  x INTEGER,
  y INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Events table (Scan logs)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  ts TEXT NOT NULL,
  operator TEXT,
  location_id TEXT NOT NULL,
  skirt_id TEXT NOT NULL,
  heat_no TEXT,
  source TEXT DEFAULT 'PD',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(location_id) REFERENCES locations(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_skirt_ts ON events(skirt_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
