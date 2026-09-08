-- Migration number: 0010  2026-09-04
-- Re-hash the seeded administrator password using the Worker's PBKDF2 settings.
-- The plaintext password remains in the git-ignored sensen-backend/.env only.

UPDATE users
SET password_salt = '48498e29ce68865eb84fd30ed153264d',
    password_hash = '6b07c03531d89bc3663efa33bb54eecec627d1888aed7ac96eecd033e0bef5ab1efb80fac3e21b215ff6dd469aaf8b5ad8dff3d93084a7b16cc2f492541d5f1a',
    updated_at = CURRENT_TIMESTAMP
WHERE lower(email) = 'admin@sensen.local';
