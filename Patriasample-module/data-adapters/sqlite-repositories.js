/**
 * SQLite adapter for Node versions that provide node:sqlite.
 * The adapter exposes the same repository shape as json-repositories.js.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function createSqliteRepositories({ filename, schemaPath }) {
  const database = new DatabaseSync(filename);
  if (schemaPath && fs.existsSync(schemaPath)) database.exec(fs.readFileSync(schemaPath, 'utf8'));
  const now = () => new Date().toISOString();
  const parseUser = row => row && ({ ...row, passwordHash: row.password_hash, salt: row.password_salt, address: row.address_json ? JSON.parse(row.address_json) : null, isAdmin: Boolean(row.is_admin) });
  const parseProduct = row => row && ({ ...row, cat: row.category, priceValue: row.price_value, img: row.image_url, desc: row.description, day: String(row.lead_days) });

  return {
    users: {
      findById: id => parseUser(database.prepare('SELECT * FROM users WHERE id = ?').get(id)),
      findByEmail: email => parseUser(database.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase())),
      findByLogin: login => parseUser(database.prepare('SELECT * FROM users WHERE lower(email) = lower(?) OR lower(name) = lower(?)').get(login, login)),
      list: () => database.prepare('SELECT * FROM users ORDER BY created_at').all().map(parseUser),
      insert: user => { database.prepare('INSERT INTO users (id,name,email,phone,password_hash,password_salt,address_json,role,is_admin,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(user.id, user.name, user.email, user.phone || '', user.passwordHash || '', user.salt || '', JSON.stringify(user.address || null), user.role || 'customer', user.isAdmin ? 1 : 0, user.createdAt || now()); return user; }
    },
    sessions: {
      find: token => database.prepare('SELECT user_id AS userId, created_at AS createdAt FROM sessions WHERE token = ?').get(token) || null,
      save: (token, session) => { database.prepare('INSERT OR REPLACE INTO sessions (token,user_id,created_at) VALUES (?,?,?)').run(token, session.userId, session.createdAt || now()); return session; },
      remove: token => { database.prepare('DELETE FROM sessions WHERE token = ?').run(token); }
    },
    orders: {
      list: () => database.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(row => ({ ...row, userId: row.user_id, items: JSON.parse(row.items_json || '[]') })),
      findByUser: userId => database.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(row => ({ ...row, userId: row.user_id, items: JSON.parse(row.items_json || '[]') }))
    },
    products: {
      list: () => database.prepare('SELECT * FROM products WHERE deleted = 0 ORDER BY title').all().map(parseProduct),
      findById: id => parseProduct(database.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').get(id)),
      insert: product => { database.prepare('INSERT INTO products (id,title,sku,category,price_value,image_url,description,quantity,lead_days,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(product.id, product.title, product.sku || '', product.cat || 'NOODLES', product.priceValue || 0, product.img || '', product.desc || '', product.quantity || 0, Number(product.day || 5), product.updatedAt || now()); return product; },
      override: (id, changes) => { database.prepare('UPDATE products SET title=?,category=?,price_value=?,image_url=?,description=?,quantity=?,lead_days=?,updated_at=? WHERE id=?').run(changes.title, changes.cat, changes.priceValue, changes.img, changes.desc, changes.quantity, changes.day, changes.updatedAt || now(), id); return changes; },
      remove: id => { database.prepare('UPDATE products SET deleted = 1, updated_at = ? WHERE id = ?').run(now(), id); }
    },
    close: () => database.close()
  };
}
