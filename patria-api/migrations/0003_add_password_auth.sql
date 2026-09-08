-- Migration number: 0003 2026-08-10T12:05:00.000Z
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(email)
WHERE email IS NOT NULL AND email <> '';
