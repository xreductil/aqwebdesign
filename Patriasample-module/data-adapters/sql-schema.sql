CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  password_salt TEXT,
  address_json TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'NOODLES',
  price_value REAL NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  lead_days INTEGER NOT NULL DEFAULT 5,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created',
  fulfillment_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
