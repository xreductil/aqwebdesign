import { cartSummary, mergeGuestCart } from '../../cart-module/backend/cart-service.js';

function result(status, data, { commit = false, headers = {} } = {}) {
  return { status, data, commit, headers };
}

/**
 * Customer account routes. Authentication, hashing and cookie policy are
 * injected by the host application so this module remains portable.
 */
export async function handleCustomerRequest({
  method,
  path,
  body = {},
  db,
  repositories,
  auth,
  guestId,
  createToken,
  hashPassword,
  verifyPassword,
  publicUser,
  sessionCookie,
  clearSessionCookie
}) {
  if (method === 'POST' && path === '/api/register') {
    const userRepository = repositories?.users || {
      findByEmail: (email) => db.users.find(user => user.email === email) || null,
      insert: (user) => db.users.push(user)
    };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || email.split('@')[0] || 'Customer').trim();
    const phone = String(body.phone || '').trim();
    if (!email || !password) return result(400, { error: 'Email and password are required.' });
    if (await userRepository.findByEmail(email)) return result(409, { error: 'Email already registered.' });
    const passwordData = hashPassword(password);
    const user = {
      id: createToken(), name, email, phone,
      salt: passwordData.salt, passwordHash: passwordData.hash,
      address: null, role: 'customer', isAdmin: false,
      createdAt: new Date().toISOString()
    };
    userRepository.insert(user);
    const sessionToken = createToken();
    const session = { userId: user.id, createdAt: new Date().toISOString() };
    if (repositories?.sessions) await repositories.sessions.save(sessionToken, session);
    else db.sessions[sessionToken] = session;
    mergeGuestCart(db, user.id, guestId, repositories);
    const userCart = (repositories?.carts?.user ? await repositories.carts.user(user.id) : db.userCarts[user.id]) || [];
    return result(201, { user: publicUser(user), cart: cartSummary(userCart) }, {
      commit: true,
      headers: { 'Set-Cookie': sessionCookie(sessionToken) }
    });
  }

  if (method === 'POST' && path === '/api/login') {
    const login = String(body.login || body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = (repositories?.users?.findByLogin ? await repositories.users.findByLogin(login) : null) || db.users.find(entry => entry.email === login || entry.name.toLowerCase() === login);
    if (!user || !verifyPassword(password, user)) return result(401, { error: 'Invalid login or password.' });
    const sessionToken = createToken();
    const session = { userId: user.id, createdAt: new Date().toISOString() };
    if (repositories?.sessions) await repositories.sessions.save(sessionToken, session);
    else db.sessions[sessionToken] = session;
    mergeGuestCart(db, user.id, guestId, repositories);
    const userCart = (repositories?.carts?.user ? await repositories.carts.user(user.id) : db.userCarts[user.id]) || [];
    return result(200, { user: publicUser(user), cart: cartSummary(userCart) }, {
      commit: true,
      headers: { 'Set-Cookie': sessionCookie(sessionToken) }
    });
  }

  if (method === 'POST' && path === '/api/logout') {
    if (auth && repositories?.sessions?.remove) await repositories.sessions.remove(auth.sessionToken);
    else if (auth) delete db.sessions[auth.sessionToken];
    return result(200, { ok: true }, { commit: true, headers: { 'Set-Cookie': clearSessionCookie() } });
  }

  if (method === 'GET' && path === '/api/me') {
    if (!auth) return result(401, { error: 'Not logged in.' });
    const orders = (repositories?.orders?.findByUser ? await repositories.orders.findByUser(auth.user.id) : null) || db.orders.filter(order => order.userId === auth.user.id);
    return result(200, { user: publicUser(auth.user), orderCount: orders.length, address: auth.user.address || null });
  }

  if (method === 'PUT' && path === '/api/me') {
    if (!auth) return result(401, { error: 'Not logged in.' });
    const email = String(body.email || auth.user.email).trim().toLowerCase();
    if (!email) return result(400, { error: 'Email is required.' });
    const existingEmail = (repositories?.users?.findByEmail ? await repositories.users.findByEmail(email) : null) || db.users.find(user => user.email === email) || null;
    if (existingEmail && existingEmail.id !== auth.user.id) {
      return result(409, { error: 'Email already registered.' });
    }
    auth.user.name = String(body.name || auth.user.name).trim();
    auth.user.email = email;
    auth.user.phone = String(body.phone || '').trim();
    if (body.password) {
      const passwordData = hashPassword(String(body.password));
      auth.user.salt = passwordData.salt;
      auth.user.passwordHash = passwordData.hash;
    }
    return result(200, { user: publicUser(auth.user) }, { commit: true });
  }

  if (method === 'PUT' && path === '/api/address') {
    if (!auth) return result(401, { error: 'Please log in first.' });
    auth.user.address = {
      fullName: String(body.fullName || '').trim(),
      phone: String(body.phone || '').trim(),
      address: String(body.address || '').trim(),
      city: String(body.city || '').trim(),
      zip: String(body.zip || '').trim()
    };
    return result(200, { user: publicUser(auth.user) }, { commit: true });
  }

  if (method === 'DELETE' && path === '/api/address') {
    if (!auth) return result(401, { error: 'Please log in first.' });
    auth.user.address = null;
    return result(200, { user: publicUser(auth.user) }, { commit: true });
  }

  if (method === 'GET' && path === '/api/orders') {
    if (!auth) return result(401, { error: 'Please log in first.' });
    return result(200, { orders: (repositories?.orders?.findByUser ? await repositories.orders.findByUser(auth.user.id) : null) || db.orders.filter(order => order.userId === auth.user.id) });
  }

  return null;
}
