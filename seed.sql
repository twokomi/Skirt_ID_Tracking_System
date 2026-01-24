-- Seed data for Skirt Tracking System

-- Insert MOD locations
INSERT OR IGNORE INTO locations (id, name, zone, x, y) VALUES
  ('MOD_01', 'Fit-up MOD 01', 'Assembly', 100, 100),
  ('MOD_02', 'Fit-up MOD 02', 'Assembly', 300, 100),
  ('MOD_03', 'Fit-up MOD 03', 'Assembly', 500, 100),
  ('MOD_04', 'Fit-up MOD 04', 'Welding', 100, 300),
  ('MOD_05', 'Fit-up MOD 05', 'Welding', 300, 300);

-- Sample events for testing (optional)
INSERT OR IGNORE INTO events (id, ts, operator, location_id, skirt_id, heat_no, source) VALUES
  ('test-001', '2026-01-24T00:00:00Z', 'TestUser', 'MOD_01', 'SK-0001', '23712041', 'PD'),
  ('test-002', '2026-01-24T01:00:00Z', 'TestUser', 'MOD_02', 'SK-0001', '23712041', 'PD'),
  ('test-003', '2026-01-24T02:00:00Z', 'TestUser', 'MOD_03', 'SK-0001', '23712041', 'PD');
