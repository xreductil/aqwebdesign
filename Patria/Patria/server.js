const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const ADMIN_ROOT = path.resolve(ROOT, "../../dashboard/dist");
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const PORT = Number(process.env.PORT || 8080);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) writeDb({ users: [], sessions: {}, guestCarts: {}, userCarts: {}, orders: [], productOverrides: {}, productAdditions: [], deletedProducts: [], reservations: [], messages: [], subscribers: [], searches: [] });

function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  db.users ||= [];
  db.sessions ||= {};
  db.guestCarts ||= {};
  db.userCarts ||= {};
  db.orders ||= [];
  db.productOverrides ||= {};
  db.productAdditions ||= [];
  db.deletedProducts ||= [];
  db.reservations ||= [];
  db.messages ||= [];
  db.subscribers ||= [];
  db.searches ||= [];
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Id'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function token() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  const check = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(check.hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

function getAuth(req, db) {
  const header = req.headers.authorization || '';
  const sessionToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = sessionToken && db.sessions[sessionToken];
  if (!session) return null;
  const user = db.users.find(u => u.id === session.userId);
  return user ? { user, sessionToken } : null;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || null
  };
}

function productsFromData() {
  if (!fs.existsSync(PRODUCTS_PATH)) return [];
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  return products.map(product => {
    const priceValue = Number(product.priceValue || String(product.price || '').replace(/[^0-9.]/g, '')) || 0;
    return {
      ...product,
      id: product.id || slug(product.title),
      source: product.source || 'static',
      cat: product.cat || 'NOODLES',
      priceValue,
      price: product.price || ('$' + priceValue.toFixed(2)),
      quantity: Math.max(0, Number(product.quantity ?? 25)),
      day: String(product.day || '5')
    };
  });
}

function productsWithOverrides(db) {
  const overrides = db.productOverrides || {};
  const deleted = new Set(db.deletedProducts || []);
  const baseProducts = [...productsFromData(), ...(db.productAdditions || []).map(product => ({ ...product, source: product.source || 'admin' }))];
  return baseProducts.filter(product => !deleted.has(product.id)).map(product => {
    const edited = overrides[product.id] || {};
    const merged = { ...product, ...edited, id: product.id };
    merged.priceValue = Number(merged.priceValue || String(merged.price || '').replace(/[^0-9.]/g, '')) || 0;
    merged.price = merged.price || ('$' + merged.priceValue.toFixed(2));
    merged.quantity = Math.max(0, Number(merged.quantity ?? 0));
    return merged;
  });
}

function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueProductId(title, db) {
  const base = slug(title) || 'product';
  const used = new Set([...productsFromData(), ...(db.productAdditions || [])].map(product => product.id));
  let id = base;
  let index = 2;
  while (used.has(id)) {
    id = base + '-' + index;
    index += 1;
  }
  return id;
}

function getCart(db, auth, guestId) {
  if (auth) {
    db.userCarts[auth.user.id] ||= [];
    return db.userCarts[auth.user.id];
  }
  const key = guestId || 'guest';
  db.guestCarts[key] ||= [];
  return db.guestCarts[key];
}

function cartSummary(cart) {
  const total = cart.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
  return { items: cart, total: Number(total.toFixed(2)) };
}

function mergeGuestCart(db, userId, guestId) {
  if (!guestId || !db.guestCarts[guestId]) return;
  db.userCarts[userId] ||= [];
  for (const item of db.guestCarts[guestId]) {
    const existing = db.userCarts[userId].find(x => x.id === item.id);
    if (existing) existing.qty += item.qty;
    else db.userCarts[userId].push(item);
  }
  delete db.guestCarts[guestId];
}

async function handleApi(req, res) {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  const url = new URL(req.url, 'http://localhost');
  const db = readDb();
  const products = productsWithOverrides(db);
  const auth = getAuth(req, db);
  const guestId = req.headers['x-guest-id'];

  try {
    const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
    if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, { products });

    if (req.method === 'POST' && url.pathname === '/api/reservations') {
      const required = ['name', 'phone', 'email', 'guests', 'date', 'time'];
      for (const field of required) {
        if (!String(body[field] || '').trim()) return send(res, 400, { error: 'Please complete all required reservation fields.' });
      }
      const reservation = {
        id: token().slice(0, 12),
        name: String(body.name || '').trim(),
        phone: String(body.phone || '').trim(),
        email: String(body.email || '').trim().toLowerCase(),
        guests: String(body.guests || '').trim(),
        date: String(body.date || '').trim(),
        time: String(body.time || '').trim(),
        requests: String(body.requests || '').trim(),
        status: 'new',
        createdAt: new Date().toISOString()
      };
      db.reservations.push(reservation);
      writeDb(db);
      return send(res, 201, { reservation });
    }

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      const required = ['name', 'email', 'subject', 'message'];
      for (const field of required) {
        if (!String(body[field] || '').trim()) return send(res, 400, { error: 'Please complete all required contact fields.' });
      }
      const message = {
        id: token().slice(0, 12),
        name: String(body.name || '').trim(),
        email: String(body.email || '').trim().toLowerCase(),
        phone: String(body.phone || '').trim(),
        subject: String(body.subject || '').trim(),
        message: String(body.message || '').trim(),
        status: 'new',
        createdAt: new Date().toISOString()
      };
      db.messages.push(message);
      writeDb(db);
      return send(res, 201, { message });
    }

    if (req.method === 'POST' && url.pathname === '/api/newsletter') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return send(res, 400, { error: 'Please enter a valid email address.' });
      let subscriber = db.subscribers.find(item => item.email === email);
      if (!subscriber) {
        subscriber = { id: token().slice(0, 12), email, status: 'active', createdAt: new Date().toISOString() };
        db.subscribers.push(subscriber);
      } else {
        subscriber.status = 'active';
        subscriber.updatedAt = new Date().toISOString();
      }
      writeDb(db);
      return send(res, 201, { subscriber });
    }

    if (req.method === 'POST' && url.pathname === '/api/search') {
      const query = String(body.query || '').trim();
      const matchedProducts = query
        ? products.filter(product => {
            const haystack = [product.title, product.cat, product.desc, product.tags].join(' ').toLowerCase();
            return haystack.includes(query.toLowerCase());
          })
        : [];
      if (query) {
        db.searches.push({ id: token().slice(0, 12), query, resultCount: matchedProducts.length, createdAt: new Date().toISOString() });
        writeDb(db);
      }
      return send(res, 200, { query, products: matchedProducts });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/products') {
      const title = String(body.title || '').trim();
      const cat = String(body.cat || 'NOODLES').trim().toUpperCase();
      const sku = String(body.sku || '').trim();
      const img = String(body.img || 'img/menu/1.webp').trim();
      const desc = String(body.desc || '').trim();
      const day = String(body.day || '5').trim();
      const quantity = Math.max(0, Number(body.quantity ?? 0));
      const priceValue = Number(body.priceValue || String(body.price || '').replace(/[^0-9.]/g, ''));
      if (!title) return send(res, 400, { error: 'Product title is required.' });
      if (!Number.isFinite(priceValue) || priceValue < 0) return send(res, 400, { error: 'Product price is invalid.' });
      if (!Number.isFinite(quantity)) return send(res, 400, { error: 'Product quantity is invalid.' });

      const product = {
        id: uniqueProductId(title, db),
        source: 'admin',
        title,
        sku,
        cat,
        priceValue: Number(priceValue.toFixed(2)),
        price: '$' + Number(priceValue).toFixed(2),
        quantity,
        day,
        img,
        desc,
        rating: '4.8',
        reviews: '24',
        cal: '520',
        time: '15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.productAdditions ||= [];
      db.productAdditions.push(product);
      writeDb(db);
      return send(res, 201, { product });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/admin/products') {
      const product = products.find(p => p.id === body.id);
      if (!product) return send(res, 404, { error: 'Product not found.' });
      const title = String(body.title || product.title).trim();
      const cat = String(body.cat || product.cat || 'Menu').trim();
      const img = String(body.img || product.img || '').trim();
      const desc = String(body.desc || product.desc || '').trim();
      const day = String(body.day || product.day || '5').trim();
      const quantity = Math.max(0, Number(body.quantity ?? product.quantity ?? 0));
      const priceValue = Number(body.priceValue || String(body.price || product.price).replace(/[^0-9.]/g, ''));
      if (!title) return send(res, 400, { error: 'Product title is required.' });
      if (!Number.isFinite(priceValue) || priceValue < 0) return send(res, 400, { error: 'Product price is invalid.' });
      if (!Number.isFinite(quantity)) return send(res, 400, { error: 'Product quantity is invalid.' });

      db.productOverrides ||= {};
      db.productOverrides[product.id] = {
        title,
        cat,
        img,
        desc,
        quantity,
        day,
        priceValue: Number(priceValue.toFixed(2)),
        price: '$' + Number(priceValue).toFixed(2),
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      return send(res, 200, { product: { ...product, ...db.productOverrides[product.id], id: product.id } });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/admin/products') {
      const product = products.find(p => p.id === body.id);
      if (!product) return send(res, 404, { error: 'Product not found.' });
      db.deletedProducts ||= [];
      if (!db.deletedProducts.includes(product.id)) db.deletedProducts.push(product.id);
      if (db.productOverrides) delete db.productOverrides[product.id];
      writeDb(db);
      return send(res, 200, { ok: true, id: product.id });
    }

    if (req.method === 'POST' && url.pathname === '/api/register') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || email.split('@')[0] || 'Customer').trim();
      const phone = String(body.phone || '').trim();
      if (!email || !password) return send(res, 400, { error: 'Email and password are required.' });
      if (db.users.some(u => u.email === email)) return send(res, 409, { error: 'Email already registered.' });
      const pw = hashPassword(password);
      const user = { id: token(), name, email, phone, salt: pw.salt, passwordHash: pw.hash, address: null, createdAt: new Date().toISOString() };
      db.users.push(user);
      const sessionToken = token();
      db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
      mergeGuestCart(db, user.id, body.guestId || guestId);
      writeDb(db);
      return send(res, 201, { token: sessionToken, user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) });
    }

    if (req.method === 'POST' && url.pathname === '/api/login') {
      const login = String(body.login || body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = db.users.find(u => u.email === login || u.name.toLowerCase() === login);
      if (!user || !verifyPassword(password, user)) return send(res, 401, { error: 'Invalid login or password.' });
      const sessionToken = token();
      db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
      mergeGuestCart(db, user.id, body.guestId || guestId);
      writeDb(db);
      return send(res, 200, { token: sessionToken, user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) });
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      if (auth) delete db.sessions[auth.sessionToken];
      writeDb(db);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/me') {
      if (!auth) return send(res, 401, { error: 'Not logged in.' });
      const orders = db.orders.filter(o => o.userId === auth.user.id);
      return send(res, 200, { user: publicUser(auth.user), orderCount: orders.length, address: auth.user.address || null });
    }

    if (req.method === 'PUT' && url.pathname === '/api/me') {
      if (!auth) return send(res, 401, { error: 'Not logged in.' });
      const email = String(body.email || auth.user.email).trim().toLowerCase();
      if (!email) return send(res, 400, { error: 'Email is required.' });
      if (db.users.some(u => u.id !== auth.user.id && u.email === email)) return send(res, 409, { error: 'Email already registered.' });
      auth.user.name = String(body.name || auth.user.name).trim();
      auth.user.email = email;
      auth.user.phone = String(body.phone || '').trim();
      if (body.password) {
        const pw = hashPassword(String(body.password));
        auth.user.salt = pw.salt;
        auth.user.passwordHash = pw.hash;
      }
      writeDb(db);
      return send(res, 200, { user: publicUser(auth.user) });
    }

    if (req.method === 'GET' && url.pathname === '/api/cart') {
      return send(res, 200, cartSummary(getCart(db, auth, guestId)));
    }

    if (req.method === 'POST' && url.pathname === '/api/cart/add') {
      const product = products.find(p => p.id === body.productId || p.title === body.title);
      const qty = Math.max(1, Number(body.qty || 1));
      if (!product) return send(res, 404, { error: 'Product not found.' });
      const cart = getCart(db, auth, body.guestId || guestId);
      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.qty += qty;
      else cart.push({ ...product, qty });
      writeDb(db);
      return send(res, 200, cartSummary(cart));
    }

    if (req.method === 'PATCH' && url.pathname === '/api/cart/item') {
      const cart = getCart(db, auth, body.guestId || guestId);
      const item = cart.find(x => x.id === body.productId);
      if (!item) return send(res, 404, { error: 'Cart item not found.' });
      item.qty = Math.max(0, Number(body.qty || 0));
      if (item.qty === 0) cart.splice(cart.indexOf(item), 1);
      writeDb(db);
      return send(res, 200, cartSummary(cart));
    }

    if (req.method === 'DELETE' && url.pathname === '/api/cart/item') {
      const cart = getCart(db, auth, body.guestId || guestId);
      const idx = cart.findIndex(x => x.id === body.productId);
      if (idx >= 0) cart.splice(idx, 1);
      writeDb(db);
      return send(res, 200, cartSummary(cart));
    }

    if (req.method === 'PUT' && url.pathname === '/api/address') {
      if (!auth) return send(res, 401, { error: 'Please log in first.' });
      auth.user.address = {
        fullName: String(body.fullName || '').trim(),
        phone: String(body.phone || '').trim(),
        address: String(body.address || '').trim(),
        city: String(body.city || '').trim(),
        zip: String(body.zip || '').trim()
      };
      writeDb(db);
      return send(res, 200, { user: publicUser(auth.user) });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/address') {
      if (!auth) return send(res, 401, { error: 'Please log in first.' });
      auth.user.address = null;
      writeDb(db);
      return send(res, 200, { user: publicUser(auth.user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/checkout') {
      if (!auth) return send(res, 401, { error: 'Please log in before checkout.' });
      const cart = db.userCarts[auth.user.id] || [];
      if (!cart.length) return send(res, 400, { error: 'Cart is empty.' });
      const fulfillmentDate = String(body.fulfillmentDate || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fulfillmentDate)) return send(res, 400, { error: 'Please choose a pickup date.' });
      const leadDays = cart.reduce((max, item) => {
        const days = Number(item.day == null || item.day === '' ? 5 : item.day);
        return Math.max(max, Number.isFinite(days) ? days : 5);
      }, 0);
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      minDate.setDate(minDate.getDate() + leadDays);
      const selectedDate = new Date(fulfillmentDate + 'T00:00:00');
      const minDateText = minDate.getFullYear() + '-' + String(minDate.getMonth() + 1).padStart(2, '0') + '-' + String(minDate.getDate()).padStart(2, '0');
      if (selectedDate < minDate) return send(res, 400, { error: 'Pickup date must be on or after ' + minDateText + '.' });
      const total = cart.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
      const order = { id: token().slice(0, 12), userId: auth.user.id, items: cart, total: Number(total.toFixed(2)), fulfillmentDate, leadDays, status: 'created', createdAt: new Date().toISOString() };
      db.orders.push(order);
      db.userCarts[auth.user.id] = [];
      writeDb(db);
      return send(res, 201, { order, cart: cartSummary([]) });
    }

    if (req.method === 'GET' && url.pathname === '/api/orders') {
      if (!auth) return send(res, 401, { error: 'Please log in first.' });
      return send(res, 200, { orders: db.orders.filter(o => o.userId === auth.user.id) });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/orders') {
      const adminOrders = db.orders.map(order => {
        const user = db.users.find(u => u.id === order.userId);
        return {
          ...order,
          customer: user ? { name: user.name, email: user.email, phone: user.phone || '' } : null
        };
      });
      return send(res, 200, { orders: adminOrders });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/customers') {
      const customers = db.users.map(user => ({
        ...publicUser(user),
        orderCount: db.orders.filter(order => order.userId === user.id).length
      }));
      return send(res, 200, { customers });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/engagement') {
      return send(res, 200, {
        reservations: db.reservations.slice().reverse(),
        messages: db.messages.slice().reverse(),
        subscribers: db.subscribers.slice().reverse(),
        searches: db.searches.slice().reverse()
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
      const completedOrders = db.orders.filter(order => ['completed', 'picked_up'].includes(String(order.status || '').toLowerCase()));
      const customersWithOrders = new Set(db.orders.map(order => order.userId).filter(Boolean));
      const customersWithAddresses = db.users.filter(user => user.address && user.address.address).length;
      const totalSales = db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const completedSales = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const itemCount = db.orders.reduce((sum, order) => {
        return sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0);
      }, 0);
      const notifications = [
        ...db.orders.slice(-5).map(order => {
          const user = db.users.find(u => u.id === order.userId);
          const status = String(order.status || '').toLowerCase();
          return {
            type: 'order',
            title: status === 'picked_up' ? 'Order picked up' : (status === 'completed' ? 'Order completed' : 'New order received'),
            message: 'Order #' + order.id + ' from ' + (user ? user.name : 'Guest customer'),
            time: order.updatedAt || order.createdAt || new Date().toISOString()
          };
        }),
        ...db.users.slice(-3).map(user => ({
          type: 'user',
          title: 'Customer account active',
          message: user.name + ' is connected to My Account',
          time: user.createdAt || new Date().toISOString()
        }))
      ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 5);

      return send(res, 200, {
        summary: {
          totalSales: Number(totalSales.toFixed(2)),
          completedSales: Number(completedSales.toFixed(2)),
          pendingSales: Number(Math.max(0, totalSales - completedSales).toFixed(2)),
          itemCount,
          customerCount: db.users.length,
          customersWithOrders: customersWithOrders.size,
          customersWithAddresses,
          orderCount: db.orders.length,
          completedOrderCount: completedOrders.length,
          notificationCount: notifications.length
        },
        notifications
      });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/admin/orders/status') {
      const order = db.orders.find(o => o.id === body.orderId);
      if (!order) return send(res, 404, { error: 'Order not found.' });
      order.status = String(body.status || 'completed').trim() || 'completed';
      order.updatedAt = new Date().toISOString();
      writeDb(db);
      const user = db.users.find(u => u.id === order.userId);
      return send(res, 200, {
        order: {
          ...order,
          customer: user ? { name: user.name, email: user.email, phone: user.phone || '' } : null
        }
      });
    }

    return send(res, 404, { error: 'API not found.' });
  } catch (err) {
    return send(res, 500, { error: err.message || 'Server error.' });
  }
}

function serveFileFromRoot(baseRoot, filePath, res) {
  const resolved = path.normalize(path.join(baseRoot, filePath));
  if (!resolved.startsWith(baseRoot)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

function serveAdmin(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let filePath = decodeURIComponent(url.pathname).replace(/^\/admin/, '');
  if (!filePath || filePath === '/') filePath = '/index.html';
  return serveFileFromRoot(ADMIN_ROOT, filePath, res);
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/') filePath = '/index.html';
  return serveFileFromRoot(ROOT, filePath, res);
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  if (req.url === '/admin' || req.url.startsWith('/admin/')) return serveAdmin(req, res);
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log('Patria backend running at http://127.0.0.1:' + PORT);
});
