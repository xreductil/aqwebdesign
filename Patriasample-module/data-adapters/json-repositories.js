/**
 * Repository adapter for the current JSON-backed demo database.
 * Routers use this contract instead of knowing where records are stored.
 */
export function createJsonRepositories({ db, products = [], productSource, persist = () => {} }) {
  db.users ||= [];
  db.sessions ||= {};
  db.orders ||= [];
  db.userCarts ||= {};
  db.guestCarts ||= {};

  return {
    users: {
      findById: (id) => db.users.find(user => user.id === id) || null,
      findByLogin: (login) => {
        const value = String(login || '').trim().toLowerCase();
        return db.users.find(user => user.email === value || String(user.name || '').toLowerCase() === value) || null;
      },
      findByEmail: (email) => db.users.find(user => user.email === String(email || '').trim().toLowerCase()) || null,
      list: () => db.users,
      insert: (user) => { db.users.push(user); return user; },
      update: (user) => user
    },
    sessions: {
      find: (token) => db.sessions[token] || null,
      save: (token, session) => { db.sessions[token] = session; return session; },
      remove: (token) => { delete db.sessions[token]; }
    },
    orders: {
      findByUser: (userId) => db.orders.filter(order => order.userId === userId),
      list: () => db.orders
    },
    products: {
      list: () => {
        if (typeof productSource === 'function') return productSource();
        return [...products, ...(db.productAdditions || [])].filter(product => !(db.deletedProducts || []).includes(product.id)).map(product => ({ ...product, ...(db.productOverrides?.[product.id] || {}) }));
      },
      findById: (id) => {
        const product = (typeof productSource === 'function' ? productSource() : [...products, ...(db.productAdditions || [])]).find(item => item.id === id);
        return product && !(db.deletedProducts || []).includes(id) ? { ...product, ...(db.productOverrides?.[id] || {}) } : null;
      },
      insert: (product) => { db.productAdditions ||= []; db.productAdditions.push(product); return product; },
      override: (id, changes) => { db.productOverrides ||= {}; db.productOverrides[id] = changes; return changes; },
      remove: (id) => {
        db.deletedProducts ||= [];
        if (!db.deletedProducts.includes(id)) db.deletedProducts.push(id);
        if (db.productOverrides) delete db.productOverrides[id];
      }
    },
    carts: {
      user: (userId) => {
        db.userCarts[userId] ||= [];
        return db.userCarts[userId];
      },
      guest: (guestId) => {
        const key = guestId || 'guest';
        db.guestCarts[key] ||= [];
        return db.guestCarts[key];
      },
      removeGuest: (guestId) => { delete db.guestCarts[guestId]; }
    },
    commit: persist
  };
}
