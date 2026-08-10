CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'percent',
    value REAL NOT NULL DEFAULT 0,
    min_total REAL NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_enabled
ON coupons(enabled);

INSERT OR IGNORE INTO coupons (code, label, type, value, min_total, enabled)
VALUES
  ('WELCOME15', 'Welcome 15% off', 'percent', 15, 0, 1),
  ('PATRIA10', 'Patria 10% off', 'percent', 10, 0, 1),
  ('FAMILY5', '$5 family order discount', 'fixed', 5, 40, 1);
