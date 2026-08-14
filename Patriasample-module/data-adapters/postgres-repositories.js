/**
 * PostgreSQL adapter. Pass a pg Pool-like object with query(text, values).
 * Methods are async; use this adapter from an async host/router.
 */
export function createPostgresRepositories({ pool }) {
  const user = row => row && ({ ...row, passwordHash: row.password_hash, salt: row.password_salt, address: row.address_json ? JSON.parse(row.address_json) : null, isAdmin: Boolean(row.is_admin) });
  const product = row => row && ({ ...row, cat: row.category, priceValue: row.price_value, img: row.image_url, desc: row.description, day: String(row.lead_days) });
  return {
    users: {
      findById: async id => user((await pool.query('SELECT * FROM users WHERE id=$1', [id])).rows[0]),
      findByEmail: async email => user((await pool.query('SELECT * FROM users WHERE email=$1', [String(email).toLowerCase()])).rows[0]),
      findByLogin: async login => user((await pool.query('SELECT * FROM users WHERE lower(email)=lower($1) OR lower(name)=lower($1)', [login])).rows[0]),
      list: async () => (await pool.query('SELECT * FROM users ORDER BY created_at')).rows.map(user),
      insert: async value => { await pool.query('INSERT INTO users (id,name,email,phone,password_hash,password_salt,address_json,role,is_admin,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [value.id, value.name, value.email, value.phone || '', value.passwordHash || '', value.salt || '', JSON.stringify(value.address || null), value.role || 'customer', value.isAdmin || false, value.createdAt || new Date().toISOString()]); return value; }
    },
    sessions: {
      find: async token => (await pool.query('SELECT user_id AS "userId", created_at AS "createdAt" FROM sessions WHERE token=$1', [token])).rows[0] || null,
      save: async (token, value) => { await pool.query('INSERT INTO sessions (token,user_id,created_at) VALUES ($1,$2,$3) ON CONFLICT (token) DO UPDATE SET user_id=EXCLUDED.user_id,created_at=EXCLUDED.created_at', [token, value.userId, value.createdAt]); return value; },
      remove: async token => { await pool.query('DELETE FROM sessions WHERE token=$1', [token]); }
    },
    products: {
      list: async () => (await pool.query('SELECT * FROM products WHERE deleted=0 ORDER BY title')).rows.map(product),
      findById: async id => product((await pool.query('SELECT * FROM products WHERE id=$1 AND deleted=0', [id])).rows[0])
    }
  };
}
