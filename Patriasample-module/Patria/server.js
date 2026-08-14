import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_ENV_PATH = path.join(__dirname, '.env');
const ENV_PATH = fs.existsSync(LOCAL_ENV_PATH) ? LOCAL_ENV_PATH : path.resolve(__dirname, '../../.env');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

loadEnvFile(ENV_PATH);

const ROOT = __dirname;
const PUBLIC_ROOT = path.join(ROOT, 'public');
const ADMIN_ROOT = path.join(PUBLIC_ROOT, "admin");
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const PORT = Number(process.env.PORT || 8080);
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL || 'https://www.aq-webdesign.com/auth/line/callback';
const IS_PRODUCTION = ['production', 'prod'].includes(String(process.env.NODE_ENV || process.env.PATRIA_ENV || '').toLowerCase())
  || String(process.env.VERCEL_ENV || '').toLowerCase() === 'production'
  || String(process.env.CF_PAGES || '') === '1';
if (IS_PRODUCTION && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || 'patria-local-session-secret';
const SESSION_COOKIE = IS_PRODUCTION ? '__Host-patria_session' : 'patria_session';
const GUEST_COOKIE = IS_PRODUCTION ? '__Host-patria_guest' : 'patria_guest';
const COOKIE_SECURE = IS_PRODUCTION || process.env.COOKIE_SECURE === 'true';
const DEFAULT_FRONTEND_ORIGIN = 'https://www.aq-webdesign.com';
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || process.env.VITE_API_BASE_URL || DEFAULT_FRONTEND_ORIGIN)
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
);
if (!IS_PRODUCTION) {
  ALLOWED_ORIGINS.add('http://localhost:5173');
  ALLOWED_ORIGINS.add('http://127.0.0.1:5173');
  ALLOWED_ORIGINS.add('http://localhost:' + PORT);
  ALLOWED_ORIGINS.add('http://127.0.0.1:' + PORT);
}
const RATE_BUCKETS = new Map();
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
const DEFAULT_COUPONS = [
  { code: 'WELCOME15', label: 'Welcome 15% off', type: 'percent', value: 15, min: 0, enabled: true },
  { code: 'PATRIA10', label: 'Patria 10% off', type: 'percent', value: 10, min: 0, enabled: true },
  { code: 'FAMILY5', label: '$5 family order discount', type: 'fixed', value: 5, min: 40, enabled: true }
];

if (!fs.existsSync(DB_PATH)) writeDb({ users: [], sessions: {}, lineStates: {}, lineTickets: {}, guestCarts: {}, userCarts: {}, orders: [], productOverrides: {}, productAdditions: [], deletedProducts: [], reservations: [], messages: [], subscribers: [], searches: [], coupons: DEFAULT_COUPONS });

function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  db.users ||= [];
  db.sessions ||= {};
  db.lineStates ||= {};
  db.lineTickets ||= {};
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
  db.coupons ||= DEFAULT_COUPONS;
  db.users = db.users.map(normalizeUser);
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function corsHeaders(req) {
  const origin = String(req && req.headers.origin || '').replace(/\/$/, '');
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin'
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function originAllowed(req) {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function send(res, status, data, extraHeaders = {}) {
  const req = res._patriaReq;
  const setCookies = [
    ...(res._patriaGuestCookie ? [res._patriaGuestCookie] : []),
    ...(extraHeaders['Set-Cookie'] ? (Array.isArray(extraHeaders['Set-Cookie']) ? extraHeaders['Set-Cookie'] : [extraHeaders['Set-Cookie']]) : [])
  ];
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(req),
    ...extraHeaders
  };
  delete headers['Set-Cookie'];
  if (setCookies.length) headers['Set-Cookie'] = setCookies;
  res.writeHead(status, headers);
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

function hmac(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function signedCookieValue(value) {
  return 's:' + value + '.' + hmac(value);
}

function unsignCookieValue(value) {
  const raw = decodeURIComponent(String(value || ''));
  if (!raw.startsWith('s:')) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 3) return null;
  const payload = raw.slice(2, dot);
  const signature = raw.slice(dot + 1);
  const expected = hmac(payload);
  if (signature.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? payload : null;
}

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index < 0) return cookies;
    cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    return cookies;
  }, {});
}

function cookieOptions(maxAge) {
  return 'HttpOnly; Path=/; SameSite=Lax; Max-Age=' + maxAge + (COOKIE_SECURE ? '; Secure' : '');
}

function sessionCookie(sessionToken) {
  return SESSION_COOKIE + '=' + encodeURIComponent(signedCookieValue(sessionToken)) + '; ' + cookieOptions(30 * 24 * 60 * 60);
}

function clearSessionCookie() {
  return SESSION_COOKIE + '=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' + (COOKIE_SECURE ? '; Secure' : '');
}

function guestCookie(guestId) {
  return GUEST_COOKIE + '=' + encodeURIComponent(signedCookieValue(guestId)) + '; ' + cookieOptions(180 * 24 * 60 * 60);
}

function lineConfigured() {
  return Boolean(LINE_CHANNEL_ID && LINE_CHANNEL_SECRET && LINE_CALLBACK_URL);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function lineTokenExchange(code) {
  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINE_CALLBACK_URL,
      client_id: LINE_CHANNEL_ID,
      client_secret: LINE_CHANNEL_SECRET
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'LINE token exchange failed.');
  return data;
}

async function lineProfile(accessToken) {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'LINE profile request failed.');
  return data;
}

async function lineVerifyIdToken(idToken, nonce) {
  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: LINE_CHANNEL_ID, nonce })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'LINE ID token verification failed.');
  return data;
}

function lineCallbackPage(res, message) {
  res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><meta charset="utf-8"><title>LINE Login</title><p>' + String(message).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</p>');
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
  const cookies = parseCookies(req);
  let sessionToken = unsignCookieValue(cookies[SESSION_COOKIE]);
  if (!sessionToken && !IS_PRODUCTION) {
    const header = req.headers.authorization || '';
    sessionToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  }
  const session = sessionToken && db.sessions[sessionToken];
  if (!session) return null;
  const user = db.users.find(u => u.id === session.userId);
  return user ? { user, sessionToken } : null;
}

function getGuestId(req, res) {
  const cookies = parseCookies(req);
  const existing = unsignCookieValue(cookies[GUEST_COOKIE]);
  if (existing) return existing;
  const guestId = token();
  res._patriaGuestCookie = guestCookie(guestId);
  return guestId;
}

function normalizeUser(user) {
  const role = user.role || (user.isAdmin === true ? 'admin' : 'customer');
  return {
    ...user,
    role,
    isAdmin: user.isAdmin === true || role === 'admin'
  };
}

function isAdminUser(user) {
  return Boolean(user && (user.isAdmin === true || user.role === 'admin'));
}

function requireAdmin(res, auth) {
  if (!auth) {
    send(res, 401, { error: 'Admin login required.' });
    return false;
  }
  if (!isAdminUser(auth.user)) {
    send(res, 403, { error: 'Administrator role required.' });
    return false;
  }
  return true;
}

function clientIp(req) {
  return String(req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim() || 'unknown';
}

function rateLimit(req, key, limit, windowMs) {
  const now = Date.now();
  const bucketKey = key + ':' + clientIp(req);
  const bucket = (RATE_BUCKETS.get(bucketKey) || []).filter(timestamp => now - timestamp < windowMs);
  if (bucket.length >= limit) {
    RATE_BUCKETS.set(bucketKey, bucket);
    return false;
  }
  bucket.push(now);
  RATE_BUCKETS.set(bucketKey, bucket);
  if (RATE_BUCKETS.size > 10000) {
    for (const [entryKey, entries] of RATE_BUCKETS.entries()) {
      if (!entries.some(timestamp => now - timestamp < 60 * 60 * 1000)) RATE_BUCKETS.delete(entryKey);
    }
  }
  return true;
}

function checkRateLimit(req, res, pathName) {
  const rules = {
    '/api/login': [8, 15 * 60 * 1000],
    '/api/register': [5, 60 * 60 * 1000],
    '/api/contact': [6, 10 * 60 * 1000],
    '/api/newsletter': [6, 10 * 60 * 1000]
  };
  const rule = rules[pathName];
  if (!rule) return true;
  if (rateLimit(req, pathName, rule[0], rule[1])) return true;
  send(res, 429, { error: 'Too many requests. Please try again later.' });
  return false;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || null,
    role: user.role || 'customer',
    isAdmin: isAdminUser(user)
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

function normalizeCoupon(coupon) {
  const type = coupon && coupon.type === 'fixed' ? 'fixed' : 'percent';
  let value = Math.max(0, Number(coupon && coupon.value) || 0);
  if (type === 'percent') value = Math.min(100, value);
  return {
    code: String(coupon && coupon.code || '').trim().toUpperCase(),
    label: String(coupon && coupon.label || '').trim(),
    type,
    value,
    min: Math.max(0, Number(coupon && coupon.min) || 0),
    enabled: coupon && coupon.enabled === false ? false : true,
    updatedAt: coupon && coupon.updatedAt ? coupon.updatedAt : new Date().toISOString()
  };
}

function couponDetails(db, code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();
  const coupon = (db.coupons || []).map(normalizeCoupon).find(item => item.enabled && item.code === normalized);
  if (!coupon) return null;
  if (subtotal < Number(coupon.min || 0)) return { code: normalized, coupon, valid: false, discount: 0 };
  const discount = coupon.type === 'percent' ? subtotal * (Number(coupon.value || 0) / 100) : Number(coupon.value || 0);
  return { code: normalized, coupon, valid: true, discount: Math.min(subtotal, Math.max(0, discount)) };
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
  res._patriaReq = req;
  if (!originAllowed(req)) return send(res, 403, { error: 'Origin is not allowed.' });
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  const url = new URL(req.url, 'http://localhost');
  const db = readDb();
  const products = productsWithOverrides(db);
  const auth = getAuth(req, db);
  const guestId = getGuestId(req, res);

  try {
    const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
    if (!checkRateLimit(req, res, url.pathname)) return;
    if (url.pathname.startsWith('/api/admin/') && !requireAdmin(res, auth)) return;
    if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, { products });

    if (req.method === 'GET' && url.pathname === '/api/coupons') {
      return send(res, 200, { coupons: (db.coupons || []).map(normalizeCoupon).filter(coupon => coupon.enabled) });
    }

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
      const user = { id: token(), name, email, phone, salt: pw.salt, passwordHash: pw.hash, address: null, role: 'customer', isAdmin: false, createdAt: new Date().toISOString() };
      db.users.push(user);
      const sessionToken = token();
      db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
      mergeGuestCart(db, user.id, guestId);
      writeDb(db);
      return send(res, 201, { user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) }, { 'Set-Cookie': sessionCookie(sessionToken) });
    }

    if (req.method === 'POST' && url.pathname === '/api/login') {
      const login = String(body.login || body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = db.users.find(u => u.email === login || u.name.toLowerCase() === login);
      if (!user || !verifyPassword(password, user)) return send(res, 401, { error: 'Invalid login or password.' });
      const sessionToken = token();
      db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
      mergeGuestCart(db, user.id, guestId);
      writeDb(db);
      return send(res, 200, { user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) }, { 'Set-Cookie': sessionCookie(sessionToken) });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/line/exchange') {
      const ticket = String(body.ticket || '');
      const entry = db.lineTickets[ticket];
      if (!entry || entry.expiresAt < Date.now()) return send(res, 401, { error: 'LINE login ticket is invalid or expired.' });
      delete db.lineTickets[ticket];
      const user = db.users.find(item => item.id === entry.userId);
      if (!user || !db.sessions[entry.sessionToken]) return send(res, 401, { error: 'LINE session is no longer available.' });
      mergeGuestCart(db, user.id, guestId);
      writeDb(db);
      return send(res, 200, { user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) }, { 'Set-Cookie': sessionCookie(entry.sessionToken) });
    }

    if (req.method === 'POST' && (url.pathname === '/api/auth/line/liff' || url.pathname === '/api/auth/liff')) {
      const idToken = String(body.idToken || body.id_token || '').trim();
      if (!idToken || !LINE_CHANNEL_ID) return send(res, 400, { error: 'LIFF Login is not configured.' });

      const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: idToken, client_id: LINE_CHANNEL_ID })
      });
      const lineUser = await verifyResponse.json();
      if (!verifyResponse.ok) return send(res, 401, { error: lineUser.error_description || 'LIFF ID token verification failed.' });
      if (lineUser.aud !== LINE_CHANNEL_ID || lineUser.iss !== 'https://access.line.me' || !lineUser.sub) {
        return send(res, 401, { error: 'LIFF ID token is invalid.' });
      }

      let user = db.users.find(item => item.lineUserId === lineUser.sub);
      if (!user) {
        user = {
          id: token(),
          name: String(lineUser.name || 'LINE Customer').trim(),
          email: 'line_' + lineUser.sub + '@line.local',
          phone: '',
          lineUserId: lineUser.sub,
          linePictureUrl: lineUser.picture || '',
          address: null,
          role: 'customer',
          isAdmin: false,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      } else {
        user.name = String(lineUser.name || user.name || 'LINE Customer').trim();
        user.linePictureUrl = lineUser.picture || user.linePictureUrl || '';
      }

      const sessionToken = token();
      db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
      mergeGuestCart(db, user.id, guestId);
      writeDb(db);
      return send(res, 200, { user: publicUser(user), cart: cartSummary(db.userCarts[user.id] || []) }, { 'Set-Cookie': sessionCookie(sessionToken) });
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      if (auth) delete db.sessions[auth.sessionToken];
      writeDb(db);
      return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
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
      const cart = getCart(db, auth, guestId);
      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.qty += qty;
      else cart.push({ ...product, qty });
      writeDb(db);
      return send(res, 200, cartSummary(cart));
    }

    if (req.method === 'PATCH' && url.pathname === '/api/cart/item') {
      const cart = getCart(db, auth, guestId);
      const item = cart.find(x => x.id === body.productId);
      if (!item) return send(res, 404, { error: 'Cart item not found.' });
      item.qty = Math.max(0, Number(body.qty || 0));
      if (item.qty === 0) cart.splice(cart.indexOf(item), 1);
      writeDb(db);
      return send(res, 200, cartSummary(cart));
    }

    if (req.method === 'DELETE' && url.pathname === '/api/cart/item') {
      const cart = getCart(db, auth, guestId);
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
      const subtotal = cart.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
      const coupon = couponDetails(db, body.couponCode, subtotal);
      const discount = coupon && coupon.valid ? coupon.discount : 0;
      const total = Math.max(0, subtotal - discount);
      const order = {
        id: token().slice(0, 12),
        userId: auth.user.id,
        items: cart,
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        couponCode: coupon && coupon.valid ? coupon.code : '',
        total: Number(total.toFixed(2)),
        fulfillmentDate,
        leadDays,
        status: 'created',
        createdAt: new Date().toISOString()
      };
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

    if (req.method === 'GET' && url.pathname === '/api/admin/coupons') {
      db.coupons = (db.coupons || DEFAULT_COUPONS).map(normalizeCoupon);
      writeDb(db);
      return send(res, 200, { coupons: db.coupons });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/coupons') {
      db.coupons = (db.coupons || DEFAULT_COUPONS).map(normalizeCoupon);
      const coupon = normalizeCoupon({ ...body, updatedAt: new Date().toISOString() });
      if (!coupon.code) return send(res, 400, { error: 'Please enter a coupon code.' });
      if (db.coupons.some(item => item.code === coupon.code)) return send(res, 409, { error: 'This coupon code already exists.' });
      db.coupons.push(coupon);
      writeDb(db);
      return send(res, 201, { coupon, coupons: db.coupons });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/admin/coupons') {
      db.coupons = (db.coupons || DEFAULT_COUPONS).map(normalizeCoupon);
      const code = String(body.code || '').trim().toUpperCase();
      const existing = db.coupons.find(coupon => coupon.code === code);
      if (!existing) return send(res, 404, { error: 'Coupon not found.' });
      db.coupons = db.coupons.map(coupon => coupon.code === code ? normalizeCoupon({ ...coupon, ...body, code, updatedAt: new Date().toISOString() }) : coupon);
      writeDb(db);
      return send(res, 200, { coupon: db.coupons.find(coupon => coupon.code === code), coupons: db.coupons });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/admin/coupons') {
      db.coupons = (db.coupons || DEFAULT_COUPONS).map(normalizeCoupon);
      const code = String(body.code || '').trim().toUpperCase();
      db.coupons = db.coupons.filter(coupon => coupon.code !== code);
      writeDb(db);
      return send(res, 200, { ok: true, coupons: db.coupons });
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

async function handleLineCallback(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!lineConfigured()) return lineCallbackPage(res, 'LINE Login is not configured on this server.');
  const state = url.searchParams.get('state');
  const db = readDb();
  const lineState = state && db.lineStates[state];
  if (!lineState || Date.now() - lineState.createdAt > 10 * 60 * 1000) {
    return lineCallbackPage(res, 'LINE Login state is invalid or expired.');
  }
  delete db.lineStates[state];
  writeDb(db);
  if (url.searchParams.get('error')) return redirect(res, '/?line_error=' + encodeURIComponent(url.searchParams.get('error_description') || 'LINE Login was cancelled.'));

  const code = url.searchParams.get('code');
  if (!code) return lineCallbackPage(res, 'LINE did not return an authorization code.');

  try {
    const lineTokens = await lineTokenExchange(code);
    const lineUser = await lineVerifyIdToken(lineTokens.id_token, lineState.nonce);
    if (lineUser.nonce !== lineState.nonce) return lineCallbackPage(res, 'LINE Login nonce verification failed.');
    if (lineUser.aud !== LINE_CHANNEL_ID) return lineCallbackPage(res, 'LINE Login client verification failed.');
    if (lineUser.iss !== 'https://access.line.me') return lineCallbackPage(res, 'LINE Login issuer verification failed.');
    if (!lineUser.exp || Number(lineUser.exp) * 1000 <= Date.now()) return lineCallbackPage(res, 'LINE Login token is expired.');
    const lineProfile = {
      lineUserId: lineUser.sub,
      name: lineUser.name ?? null,
      avatar: lineUser.picture ?? null
    };
    db.lineTickets ||= {};
    let user = db.users.find(item => item.lineUserId === lineProfile.lineUserId);
    if (!user) {
      user = {
        id: token(),
        name: String(lineProfile.name || 'LINE Customer').trim(),
        email: 'line_' + lineProfile.lineUserId + '@line.local',
        phone: '',
        lineUserId: lineProfile.lineUserId,
        linePictureUrl: lineProfile.avatar || '',
        address: null,
        role: 'customer',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      user.name = String(lineProfile.name || user.name || 'LINE Customer').trim();
      user.linePictureUrl = lineProfile.avatar || user.linePictureUrl || '';
    }

    const sessionToken = token();
    db.sessions[sessionToken] = { userId: user.id, createdAt: new Date().toISOString() };
    const ticket = token();
    db.lineTickets[ticket] = { sessionToken, userId: user.id, expiresAt: Date.now() + 5 * 60 * 1000 };
    writeDb(db);
    return redirect(res, '/?line_ticket=' + encodeURIComponent(ticket));
  } catch (error) {
    return lineCallbackPage(res, error.message || 'LINE Login failed.');
  }
}

function startLineLogin(req, res) {
  if (!lineConfigured()) return lineCallbackPage(res, 'LINE Login is not configured on this server.');
  const state = token();
  const nonce = token();
  const db = readDb();
  db.lineStates[state] = { nonce, createdAt: Date.now() };
  writeDb(db);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_CALLBACK_URL,
    state,
    scope: 'profile openid',
    nonce
  });
  return redirect(res, 'https://access.line.me/oauth2/v2.1/authorize?' + params.toString());
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

function adminLoginRedirect(res) {
  res.writeHead(302, { Location: '/admin/signin.html' });
  res.end();
}

function serveAdmin(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let filePath = decodeURIComponent(url.pathname).replace(/^\/admin/, '');
  if (!filePath || filePath === '/') filePath = '/index.html';
  const page = path.basename(filePath);
  const isHtml = path.extname(filePath).toLowerCase() === '.html';
  const isPublicAdminPage = page === 'signin.html' || page === 'signup.html' || page === '404-error.html';
  if (isHtml && !isPublicAdminPage) {
    const db = readDb();
    const auth = getAuth(req, db);
    if (!auth || !isAdminUser(auth.user)) return adminLoginRedirect(res);
  }
  return serveFileFromRoot(ADMIN_ROOT, filePath, res);
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/') filePath = '/index.html';
  return serveFileFromRoot(PUBLIC_ROOT, filePath, res);
}

http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/auth/line' || req.url.startsWith('/auth/line?'))) return startLineLogin(req, res);
  if (req.method === 'GET' && req.url.startsWith('/auth/line/start')) return startLineLogin(req, res);
  if (req.method === 'GET' && req.url.startsWith('/auth/line/callback')) return handleLineCallback(req, res);
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  if (req.url === '/admin' || req.url.startsWith('/admin/')) return serveAdmin(req, res);
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log('Patria backend running at http://127.0.0.1:' + PORT);
});
