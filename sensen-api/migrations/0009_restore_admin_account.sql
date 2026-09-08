-- Migration number: 0009  2026-09-04
-- Restore the seeded employee account name and administrator role.

UPDATE users
SET name = '管理員', role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@sensen.local';
