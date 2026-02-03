-- MES API 연동 로그 테이블
CREATE TABLE IF NOT EXISTS mes_logs (
  id TEXT PRIMARY KEY,
  ts TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'search_orders', 'select_order', 'start_work'
  skirt_id TEXT,
  section_id TEXT,
  operator TEXT,
  device_id TEXT,
  response TEXT,  -- JSON 응답 저장
  success INTEGER DEFAULT 1,  -- 1: 성공, 0: 실패
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_mes_logs_ts ON mes_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_mes_logs_skirt ON mes_logs(skirt_id);
CREATE INDEX IF NOT EXISTS idx_mes_logs_action ON mes_logs(action);
