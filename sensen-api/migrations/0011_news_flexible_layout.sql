-- Migration number: 0011  2026-09-05
-- Persist the block order and width chosen in the news live editor.

ALTER TABLE news ADD COLUMN layout_json TEXT;
