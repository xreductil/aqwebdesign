interface Env {
  patria_db: D1Database;
  patria_images: R2Bucket;

  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CALLBACK_URL: string;
  ADMIN_EMAILS?: string;

  LOGIN_SUCCESS_URL?: string;
}

interface LineTokenResponse {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;

  error?: string;
  error_description?: string;
}

interface LineVerifyResponse {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  nonce?: string;

  name?: string;
  picture?: string;

  error?: string;
  error_description?: string;
}

function randomString(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function passwordHash(
  password: string,
  salt: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

function getCookie(
  request: Request,
  name: string
): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function createCookie(
  name: string,
  value: string,
  maxAge = 600
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

function clearCookie(name: string): string {
  return [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

function getSessionToken(request: Request): string | null {
  const cookieToken = getCookie(request, "patria_session");
  if (cookieToken) return cookieToken;

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice("Bearer ".length).trim() || null;
}

async function createSession(
  db: D1Database,
  userId: number
): Promise<string> {
  const token = randomString(48);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  await db
    .prepare(`
      INSERT INTO sessions (
        token_hash,
        user_id,
        expires_at
      ) VALUES (?, ?, ?)
    `)
    .bind(tokenHash, userId, expiresAt)
    .run();

  return token;
}

async function getCurrentUser(
  request: Request,
  db: D1Database
): Promise<{ sessionId: number; user: Record<string, unknown> } | null> {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) return null;

  const tokenHash = await sha256(sessionToken);
  const row = await db
    .prepare(`
      SELECT
        sessions.id AS session_id,
        users.id,
        users.line_user_id,
        users.display_name,
        users.avatar_url,
        users.email,
        users.phone,
        users.address_json,
        users.created_at,
        users.updated_at
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `)
    .bind(tokenHash)
    .first<Record<string, unknown>>();

  if (!row) return null;

  return {
    sessionId: Number(row.session_id),
    user: {
      id: row.id,
      lineUserId: row.line_user_id,
      name: row.display_name,
      avatar: row.avatar_url,
      email: row.email,
      phone: row.phone,
      address: row.address_json ? JSON.parse(String(row.address_json)) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

type ProductRow = Record<string, unknown>;

function publicProduct(row: ProductRow): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    cat: row.category,
    price: row.price,
    priceValue: Number(row.price_value || 0),
    old: row.old_price || "",
    img: row.image_url || "",
    desc: row.description || "",
    rating: row.rating,
    reviews: row.reviews,
    cal: row.calories,
    time: row.prep_time,
    tags: row.tags || "",
    quantity: Number(row.quantity || 0),
    day: String(row.lead_days ?? 5),
  };
}

function isAdminEmail(email: unknown, env: Env): boolean {
  const allowed = String(env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowed.includes(String(email).toLowerCase()));
}

async function getAdminUser(
  request: Request,
  env: Env
): Promise<{ sessionId: number; user: Record<string, unknown> } | null> {
  const current = await getCurrentUser(request, env.patria_db);
  return current && isAdminEmail(current.user.email, env) ? current : null;
}

function productIdFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${randomString(6)}`;
}

async function getAdminOrders(
  db: D1Database
): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(`
      SELECT orders.*, users.display_name, users.email, users.avatar_url
      FROM orders
      LEFT JOIN users ON users.id = orders.user_id
      ORDER BY orders.created_at DESC
    `)
    .all<Record<string, unknown>>();

  return Promise.all(result.results.map(async (order) => {
    const items = await db
      .prepare(`
        SELECT product_id AS id, title, image_url AS img,
               price_value AS priceValue, quantity AS qty
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
      `)
      .bind(order.id)
      .all<Record<string, unknown>>();

    return {
      id: order.id,
      userId: order.user_id,
      customer: {
        name: order.display_name || "Member",
        email: order.email || "",
        avatar: order.avatar_url || "",
      },
      items: items.results,
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discount || 0),
      couponCode: order.coupon_code || "",
      total: Number(order.total || 0),
      fulfillmentDate: order.fulfillment_date,
      leadDays: Number(order.lead_days || 0),
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }));
}

async function getProducts(
  db: D1Database,
  productId?: string
): Promise<Record<string, unknown>[]> {
  const statement = productId
    ? db
        .prepare("SELECT * FROM products WHERE id = ? AND enabled = 1 LIMIT 1")
        .bind(productId)
    : db
        .prepare("SELECT * FROM products WHERE enabled = 1 ORDER BY title ASC")
        .bind();
  const result = await statement.all<ProductRow>();
  return result.results.map(publicProduct);
}

async function getStoreCart(
  db: D1Database,
  userId: number | null,
  guestId: string | null
): Promise<Record<string, unknown>[]> {
  if (!userId && !guestId) return [];

  const isUserCart = Boolean(userId);
  const table = isUserCart ? "cart_items" : "guest_cart_items";
  const ownerColumn = isUserCart ? "user_id" : "guest_id";
  const owner = isUserCart ? userId : guestId;
  const result = await db
    .prepare(`
      SELECT p.*, c.quantity AS cart_quantity
      FROM ${table} c
      INNER JOIN products p ON p.id = c.product_id
      WHERE c.${ownerColumn} = ? AND p.enabled = 1
      ORDER BY c.updated_at DESC
    `)
    .bind(owner)
    .all<ProductRow>();

  return result.results.map((row) => ({
    ...publicProduct(row),
    qty: Number(row.cart_quantity || 0),
  }));
}

function cartSummary(items: Record<string, unknown>[]) {
  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.priceValue || 0) * Number(item.qty || 0),
    0
  );

  return {
    items,
    total: Number(total.toFixed(2)),
  };
}

function storeToken(): string {
  return randomString(18);
}

async function getUserOrders(
  db: D1Database,
  userId: number
): Promise<Record<string, unknown>[]> {
  const orders = await db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<Record<string, unknown>>();

  return Promise.all(
    orders.results.map(async (order) => {
      const items = await db
        .prepare(`
          SELECT product_id AS id, title, image_url AS img,
                 price_value AS priceValue, quantity AS qty
          FROM order_items
          WHERE order_id = ?
          ORDER BY id ASC
        `)
        .bind(order.id)
        .all<Record<string, unknown>>();

      return {
        id: order.id,
        userId: order.user_id,
        items: items.results,
        subtotal: Number(order.subtotal || 0),
        discount: Number(order.discount || 0),
        couponCode: order.coupon_code || "",
        total: Number(order.total || 0),
        fulfillmentDate: order.fulfillment_date,
        leadDays: Number(order.lead_days || 0),
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    })
  );
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const url = new URL(request.url);

    try {

      if (
        request.method === "GET" &&
        url.pathname.startsWith("/images/")
      ) {
        const key = decodeURIComponent(
          url.pathname.slice("/images/".length)
        );
        const object = await env.patria_images.get(key);

        if (!object) {
          return new Response("Image not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set(
          "Content-Type",
          object.httpMetadata?.contentType || "application/octet-stream"
        );
        headers.set(
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );

        return new Response(object.body, { headers });
      }

      /*
       * --------------------------------
       * 首頁 / 健康檢查
       * --------------------------------
       */
      if (url.pathname === "/") {
        return Response.json({
          ok: true,
          service: "Patria API",
          lineLogin: "/auth/line",
        });
      }

      if (request.method === "POST" && url.pathname === "/api/register") {
        const body = await readJson<{
          name?: string;
          email?: string;
          phone?: string;
          password?: string;
        }>(request);
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!name || !email || !password) {
          return Response.json(
            { success: false, error: "Name, email, and password are required." },
            { status: 400 }
          );
        }

        if (password.length < 8) {
          return Response.json(
            { success: false, error: "Password must be at least 8 characters." },
            { status: 400 }
          );
        }

        const existing = await env.patria_db
          .prepare("SELECT id FROM users WHERE lower(email) = ? LIMIT 1")
          .bind(email)
          .first();

        if (existing) {
          return Response.json(
            { success: false, error: "Email already registered." },
            { status: 409 }
          );
        }

        const salt = randomString(16);
        const hash = await passwordHash(password, salt);
        const lineUserId = `local:${randomString(16)}`;

        await env.patria_db
          .prepare(`
            INSERT INTO users (
              line_user_id,
              display_name,
              email,
              phone,
              password_salt,
              password_hash
            ) VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(lineUserId, name, email, String(body.phone || "").trim(), salt, hash)
          .run();

        const user = await env.patria_db
          .prepare(`
            SELECT id, line_user_id, display_name, avatar_url, email, phone, address_json,
                   created_at, updated_at
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
          .bind(email)
          .first<Record<string, unknown>>();

        if (!user) {
          return Response.json(
            { success: false, error: "Unable to create account." },
            { status: 500 }
          );
        }

        const sessionToken = await createSession(
          env.patria_db,
          Number(user.id)
        );
        const headers = new Headers({
          "Content-Type": "application/json; charset=utf-8",
        });
        headers.append(
          "Set-Cookie",
          createCookie("patria_session", sessionToken, 30 * 24 * 60 * 60)
        );

        return new Response(
          JSON.stringify({ success: true, token: sessionToken, user }),
          { status: 201, headers }
        );
      }

      if (request.method === "POST" && url.pathname === "/api/login") {
        const body = await readJson<{
          login?: string;
          email?: string;
          password?: string;
        }>(request);
        const login = String(body.login || body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!login || !password) {
          return Response.json(
            { success: false, error: "Email and password are required." },
            { status: 400 }
          );
        }

        const user = await env.patria_db
          .prepare(`
            SELECT id, line_user_id, display_name, avatar_url, email, phone, address_json,
                   created_at, updated_at, password_salt, password_hash
            FROM users
            WHERE lower(email) = ? OR lower(display_name) = ?
            LIMIT 1
          `)
          .bind(login, login)
          .first<Record<string, unknown>>();

        if (!user || !user.password_salt || !user.password_hash) {
          return Response.json(
            { success: false, error: "Invalid login or password." },
            { status: 401 }
          );
        }

        const hash = await passwordHash(
          password,
          String(user.password_salt)
        );

        if (hash !== String(user.password_hash)) {
          return Response.json(
            { success: false, error: "Invalid login or password." },
            { status: 401 }
          );
        }

        const sessionToken = await createSession(
          env.patria_db,
          Number(user.id)
        );
        const headers = new Headers({
          "Content-Type": "application/json; charset=utf-8",
        });
        headers.append(
          "Set-Cookie",
          createCookie("patria_session", sessionToken, 30 * 24 * 60 * 60)
        );

        const publicUser = {
          id: user.id,
          lineUserId: user.line_user_id,
          name: user.display_name,
          avatar: user.avatar_url,
          email: user.email,
          phone: user.phone,
          address: user.address_json ? JSON.parse(String(user.address_json)) : {},
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        };

        return new Response(
          JSON.stringify({ success: true, token: sessionToken, user: publicUser }),
          { status: 200, headers }
        );
      }

      if (request.method === "POST" && url.pathname === "/api/contact") {
        const body = await readJson<{
          name?: string;
          email?: string;
          phone?: string;
          subject?: string;
          message?: string;
        }>(request);
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const subject = String(body.subject || "").trim();
        const message = String(body.message || "").trim();

        if (!name || !email || !subject || !message) {
          return Response.json(
            { success: false, error: "Name, email, subject, and message are required." },
            { status: 400 }
          );
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return Response.json(
            { success: false, error: "Please enter a valid email address." },
            { status: 400 }
          );
        }

        const current = await getCurrentUser(request, env.patria_db);
        await env.patria_db
          .prepare(`
            INSERT INTO contact_messages (user_id, name, email, phone, subject, message)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(current ? Number(current.user.id) : null, name, email, String(body.phone || "").trim(), subject, message)
          .run();

        return Response.json({ success: true, message: "Message sent successfully." }, { status: 201 });
      }

      if (request.method === "POST" && url.pathname === "/api/reservations") {
        const body = await readJson<{
          name?: string;
          phone?: string;
          email?: string;
          guests?: string;
          date?: string;
          time?: string;
          requests?: string;
        }>(request);
        const name = String(body.name || "").trim();
        const phone = String(body.phone || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const guests = String(body.guests || "").trim();
        const date = String(body.date || "").trim();
        const time = String(body.time || "").trim();
        if (!name || !phone || !email || !guests || !date || !time) {
          return Response.json({ success: false, error: "Name, phone, email, guests, date, and time are required." }, { status: 400 });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return Response.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
        }
        const current = await getCurrentUser(request, env.patria_db);
        await env.patria_db.prepare(`
          INSERT INTO reservations (user_id, name, phone, email, guests, date, time, requests)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(current ? Number(current.user.id) : null, name, phone, email, guests, date, time, String(body.requests || "").trim()).run();
        return Response.json({ success: true, message: "Reservation received successfully." }, { status: 201 });
      }

      if (request.method === "POST" && url.pathname === "/api/newsletter") {
        const body = await readJson<{ email?: string }>(request);
        const email = String(body.email || "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return Response.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
        }
        await env.patria_db.prepare(`
          INSERT INTO newsletter_subscribers (email)
          VALUES (?)
          ON CONFLICT(email) DO UPDATE SET status = 'active'
        `).bind(email).run();
        return Response.json({ success: true, message: "Subscribed successfully." }, { status: 201 });
      }

      if (url.pathname.startsWith("/api/admin/")) {
        const admin = await getAdminUser(request, env);
        if (!admin) {
          return Response.json(
            { success: false, error: "Administrator access required." },
            { status: 403 }
          );
        }

        if (request.method === "GET" && url.pathname === "/api/admin/orders") {
          return Response.json({ success: true, orders: await getAdminOrders(env.patria_db) });
        }

        if (request.method === "PATCH" && url.pathname === "/api/admin/orders/status") {
          const body = await readJson<{ orderId?: string; status?: string }>(request);
          const status = String(body.status || "").trim().toLowerCase();
          const allowedStatuses = new Set(["created", "completed", "picked_up", "cancelled"]);
          if (!body.orderId || !allowedStatuses.has(status)) {
            return Response.json({ success: false, error: "Invalid order status." }, { status: 400 });
          }
          await env.patria_db
            .prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(status, body.orderId)
            .run();
          const orders = await getAdminOrders(env.patria_db);
          const order = orders.find((item) => String(item.id) === String(body.orderId));
          if (!order) {
            return Response.json({ success: false, error: "Order not found." }, { status: 404 });
          }
          return Response.json(
            { success: true, order },
            { headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" } }
          );
        }

        if (request.method === "GET" && url.pathname === "/api/admin/customers") {
          const customers = await env.patria_db
            .prepare(`
              SELECT users.id, users.display_name AS name, users.email,
                     users.avatar_url AS avatar, users.created_at AS createdAt,
                     COUNT(orders.id) AS orderCount
              FROM users
              LEFT JOIN orders ON orders.user_id = users.id
              GROUP BY users.id
              ORDER BY users.created_at DESC
            `)
            .all<Record<string, unknown>>();
          return Response.json({ success: true, customers: customers.results });
        }

        if (request.method === "GET" && url.pathname === "/api/admin/engagement") {
          const [reservations, messages, subscribers] = await Promise.all([
            env.patria_db.prepare("SELECT id, name, phone, email, guests, date, time, requests, status, created_at AS createdAt FROM reservations ORDER BY created_at DESC").all(),
            env.patria_db.prepare("SELECT id, name, email, phone, subject, message, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC").all(),
            env.patria_db.prepare("SELECT id, email, status, created_at AS createdAt FROM newsletter_subscribers ORDER BY created_at DESC").all(),
          ]);
          return Response.json({ success: true, reservations: reservations.results, messages: messages.results, subscribers: subscribers.results, searches: [] });
        }

        if (request.method === "GET" && url.pathname === "/api/admin/summary") {
          const orders = await getAdminOrders(env.patria_db);
          const products = await getProducts(env.patria_db);
          const users = await env.patria_db.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
          const completed = orders.filter((order) => ["completed", "picked_up"].includes(String(order.status)));
          const itemCount = orders.reduce(
            (sum, order) => sum + (order.items as Record<string, unknown>[]).reduce(
              (itemSum, item) => itemSum + Number(item.qty || 0), 0
            ),
            0
          );
          const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
          return Response.json({
            success: true,
            summary: {
              totalSales,
              completedSales: completed.reduce((sum, order) => sum + Number(order.total || 0), 0),
              pendingSales: orders.filter((order) => !["completed", "picked_up", "cancelled"].includes(String(order.status))).reduce((sum, order) => sum + Number(order.total || 0), 0),
              itemCount,
              orderCount: orders.length,
              completedOrderCount: completed.length,
              customerCount: Number(users?.count || 0),
              productCount: products.length,
            },
            notifications: [],
          });
        }

        if (request.method === "POST" && url.pathname === "/api/admin/products") {
          const body = await readJson<Record<string, unknown>>(request);
          const title = String(body.title || "").trim();
          if (!title) return Response.json({ success: false, error: "Product title is required." }, { status: 400 });
          const id = String(body.id || productIdFromTitle(title));
          const priceValue = Number(body.priceValue || 0);
          await env.patria_db.prepare(`
            INSERT INTO products (id, title, category, price_value, price, old_price, image_url, description, quantity, lead_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, title, String(body.cat || "MENU"), priceValue,
            String(body.price || `$${priceValue.toFixed(2)}`), String(body.old || ""),
            String(body.img || ""), String(body.desc || ""),
            Math.max(0, Math.floor(Number(body.quantity || 0))), Math.max(0, Math.floor(Number(body.day || 5)))
          ).run();
          const product = (await getProducts(env.patria_db, id))[0];
          return Response.json({ success: true, product }, { status: 201 });
        }

        if (request.method === "PATCH" && url.pathname === "/api/admin/products") {
          const body = await readJson<Record<string, unknown>>(request);
          const id = String(body.id || "");
          if (!id) return Response.json({ success: false, error: "Product id is required." }, { status: 400 });
          await env.patria_db.prepare(`
            UPDATE products SET title = ?, category = ?, price_value = ?, price = ?,
              image_url = ?, description = ?, quantity = ?, lead_days = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            String(body.title || ""), String(body.cat || "MENU"), Number(body.priceValue || 0),
            String(body.price || `$${Number(body.priceValue || 0).toFixed(2)}`), String(body.img || ""),
            String(body.desc || ""), Math.max(0, Math.floor(Number(body.quantity || 0))),
            Math.max(0, Math.floor(Number(body.day || 5))), id
          ).run();
          const product = (await getProducts(env.patria_db, id))[0];
          return Response.json({ success: true, product });
        }

        if (request.method === "DELETE" && url.pathname === "/api/admin/products") {
          const body = await readJson<{ id?: string }>(request);
          if (!body.id) return Response.json({ success: false, error: "Product id is required." }, { status: 400 });
          await env.patria_db.prepare("UPDATE products SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.id).run();
          return Response.json({ success: true });
        }

        if (url.pathname === "/api/admin/coupons") {
          if (request.method === "GET") {
            const coupons = await env.patria_db.prepare("SELECT code, label, type, value, min_total AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY created_at DESC").all<Record<string, unknown>>();
            return Response.json({ success: true, coupons: coupons.results.map((coupon) => ({ ...coupon, enabled: Boolean(coupon.enabled) })) });
          }
          const body = await readJson<Record<string, unknown>>(request);
          const code = String(body.code || "").trim().toUpperCase();
          if (!code) return Response.json({ success: false, error: "Coupon code is required." }, { status: 400 });
          if (request.method === "POST") {
            await env.patria_db.prepare("INSERT INTO coupons (code, label, type, value, min_total, enabled) VALUES (?, ?, ?, ?, ?, ?)").bind(code, String(body.label || ""), body.type === "fixed" ? "fixed" : "percent", Number(body.value || 0), Number(body.min || 0), body.enabled === false ? 0 : 1).run();
          } else if (request.method === "PATCH") {
            await env.patria_db.prepare("UPDATE coupons SET label = COALESCE(?, label), type = COALESCE(?, type), value = COALESCE(?, value), min_total = COALESCE(?, min_total), enabled = COALESCE(?, enabled), updated_at = CURRENT_TIMESTAMP WHERE code = ?").bind(body.label ?? null, body.type ?? null, body.value ?? null, body.min ?? null, typeof body.enabled === "boolean" ? (body.enabled ? 1 : 0) : null, code).run();
          } else if (request.method === "DELETE") {
            await env.patria_db.prepare("DELETE FROM coupons WHERE code = ?").bind(code).run();
          }
          const coupons = await env.patria_db.prepare("SELECT code, label, type, value, min_total AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY created_at DESC").all<Record<string, unknown>>();
          return Response.json({ success: true, coupons: coupons.results.map((coupon) => ({ ...coupon, enabled: Boolean(coupon.enabled) })) });
        }

        return Response.json({ success: false, error: "Admin endpoint not found." }, { status: 404 });
      }

      if (request.method === "GET" && url.pathname === "/api/products") {
        return Response.json({
          success: true,
          products: await getProducts(env.patria_db),
        });
      }

      if (request.method === "GET" && url.pathname === "/api/coupons") {
        const result = await env.patria_db
          .prepare("SELECT code, label, type, value, min_total AS min FROM coupons WHERE enabled = 1 ORDER BY created_at DESC")
          .all<Record<string, unknown>>();
        return Response.json({
          success: true,
          coupons: result.results.map((coupon) => ({
            ...coupon,
            value: Number(coupon.value || 0),
            min: Number(coupon.min || 0),
          })),
        });
      }

      if (url.pathname === "/api/cart") {
        const current = await getCurrentUser(request, env.patria_db);
        const guestId = request.headers.get("X-Guest-Id");
        const userId = current ? Number(current.user.id) : null;

        if (request.method === "GET") {
          return Response.json({
            success: true,
            ...cartSummary(
              await getStoreCart(env.patria_db, userId, guestId)
            ),
          });
        }
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/cart/add"
      ) {
        const body = await readJson<{ productId?: string; qty?: number }>(request);
        const productId = String(body.productId || "");
        const qty = Math.max(1, Math.floor(Number(body.qty || 1)));
        const product = (await getProducts(env.patria_db, productId))[0];
        const current = await getCurrentUser(request, env.patria_db);
        const guestId = request.headers.get("X-Guest-Id");

        if (!product) {
          return Response.json(
            { success: false, error: "Product not found." },
            { status: 404 }
          );
        }

        if (current) {
          await env.patria_db
            .prepare(`
              INSERT INTO cart_items (user_id, product_id, quantity)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id, product_id)
              DO UPDATE SET
                quantity = cart_items.quantity + excluded.quantity,
                updated_at = CURRENT_TIMESTAMP
            `)
            .bind(Number(current.user.id), productId, qty)
            .run();
        } else if (guestId) {
          await env.patria_db
            .prepare(`
              INSERT INTO guest_cart_items (guest_id, product_id, quantity)
              VALUES (?, ?, ?)
              ON CONFLICT(guest_id, product_id)
              DO UPDATE SET
                quantity = guest_cart_items.quantity + excluded.quantity,
                updated_at = CURRENT_TIMESTAMP
            `)
            .bind(guestId, productId, qty)
            .run();
        } else {
          return Response.json(
            { success: false, error: "Guest ID is required." },
            { status: 400 }
          );
        }

        const cart = await getStoreCart(
          env.patria_db,
          current ? Number(current.user.id) : null,
          guestId
        );
        return Response.json({ success: true, ...cartSummary(cart) });
      }

      if (
        (request.method === "PATCH" || request.method === "DELETE") &&
        url.pathname === "/api/cart/item"
      ) {
        const body = await readJson<{ productId?: string; qty?: number }>(request);
        const productId = String(body.productId || "");
        const current = await getCurrentUser(request, env.patria_db);
        const guestId = request.headers.get("X-Guest-Id");
        const owner = current ? Number(current.user.id) : guestId;

        if (!owner) {
          return Response.json(
            { success: false, error: "Guest ID is required." },
            { status: 400 }
          );
        }

        const table = current ? "cart_items" : "guest_cart_items";
        const ownerColumn = current ? "user_id" : "guest_id";
        const quantity = Math.max(0, Math.floor(Number(body.qty || 0)));

        if (request.method === "DELETE" || quantity === 0) {
          await env.patria_db
            .prepare(`DELETE FROM ${table} WHERE ${ownerColumn} = ? AND product_id = ?`)
            .bind(owner, productId)
            .run();
        } else {
          await env.patria_db
            .prepare(`
              UPDATE ${table}
              SET quantity = ?, updated_at = CURRENT_TIMESTAMP
              WHERE ${ownerColumn} = ? AND product_id = ?
            `)
            .bind(quantity, owner, productId)
            .run();
        }

        const cart = await getStoreCart(
          env.patria_db,
          current ? Number(current.user.id) : null,
          guestId
        );
        return Response.json({ success: true, ...cartSummary(cart) });
      }

      if (request.method === "POST" && url.pathname === "/api/checkout") {
        const current = await getCurrentUser(request, env.patria_db);
        if (!current) {
          return Response.json(
            { success: false, error: "Please log in before checkout." },
            { status: 401 }
          );
        }

        const body = await readJson<{
          fulfillmentDate?: string;
          couponCode?: string;
        }>(request);
        const fulfillmentDate = String(body.fulfillmentDate || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fulfillmentDate)) {
          return Response.json(
            { success: false, error: "Please choose a pickup date." },
            { status: 400 }
          );
        }

        const userId = Number(current.user.id);
        const cart = await getStoreCart(env.patria_db, userId, null);
        if (!cart.length) {
          return Response.json(
            { success: false, error: "Cart is empty." },
            { status: 400 }
          );
        }

        const leadDays = cart.reduce(
          (max, item) => Math.max(max, Number(item.day || 5)),
          0
        );
        const minimumDate = new Date();
        minimumDate.setHours(0, 0, 0, 0);
        minimumDate.setDate(minimumDate.getDate() + leadDays);
        const selectedDate = new Date(`${fulfillmentDate}T00:00:00`);
        if (selectedDate < minimumDate) {
          return Response.json(
            {
              success: false,
              error: `Pickup date must be on or after ${minimumDate
                .toISOString()
                .slice(0, 10)}.`,
            },
            { status: 400 }
          );
        }

        const subtotal = Number(cartSummary(cart).total.toFixed(2));
        const couponCode = String(body.couponCode || "").trim().toUpperCase();
        let discount = 0;
        if (couponCode) {
          const coupon = await env.patria_db
            .prepare("SELECT code, label, type, value, min_total AS min FROM coupons WHERE code = ? AND enabled = 1 LIMIT 1")
            .bind(couponCode)
            .first<Record<string, unknown>>();
          if (!coupon) {
            return Response.json({ success: false, error: "Invalid coupon code." }, { status: 400 });
          }
          if (subtotal < Number(coupon.min || 0)) {
            return Response.json({ success: false, error: "This coupon requires a subtotal of $" + Number(coupon.min || 0).toFixed(2) + "." }, { status: 400 });
          }
          discount = coupon.type === "percent"
            ? subtotal * Number(coupon.value || 0) / 100
            : Number(coupon.value || 0);
          discount = Number(Math.min(subtotal, Math.max(0, discount)).toFixed(2));
        }
        const total = Number(Math.max(0, subtotal - discount).toFixed(2));
        const orderId = storeToken();
        const now = new Date().toISOString();
        const statements = [
          env.patria_db
            .prepare(`
              INSERT INTO orders (
                id, user_id, subtotal, discount, coupon_code, total,
                fulfillment_date, lead_days, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)
            `)
            .bind(
              orderId,
              userId,
              subtotal,
              discount,
              couponCode,
              total,
              fulfillmentDate,
              leadDays,
              now,
              now
            ),
          ...cart.map((item) =>
            env.patria_db
              .prepare(`
                INSERT INTO order_items (
                  order_id, product_id, title, image_url, price_value, quantity
                ) VALUES (?, ?, ?, ?, ?, ?)
              `)
              .bind(
                orderId,
                item.id,
                item.title,
                item.img,
                Number(item.priceValue || 0),
                Number(item.qty || 0)
              )
          ),
          env.patria_db
            .prepare("DELETE FROM cart_items WHERE user_id = ?")
            .bind(userId),
        ];
        await env.patria_db.batch(statements);

        return Response.json(
          {
            success: true,
            order: {
              id: orderId,
              userId,
              items: cart,
              subtotal,
              discount,
              couponCode,
              total,
              fulfillmentDate,
              leadDays,
              status: "created",
              createdAt: now,
            },
            cart: cartSummary([]),
          },
          { status: 201 }
        );
      }

      if (request.method === "GET" && url.pathname === "/api/orders") {
        const current = await getCurrentUser(request, env.patria_db);
        if (!current) {
          return Response.json(
            { success: false, error: "Please log in first." },
            { status: 401 }
          );
        }

        return Response.json(
          {
            success: true,
            orders: await getUserOrders(
              env.patria_db,
              Number(current.user.id)
            ),
          },
          { headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" } }
        );
      }

      if (request.method === "PUT" && url.pathname === "/api/address") {
        const current = await getCurrentUser(request, env.patria_db);
        if (!current) return Response.json({ success: false, error: "Not logged in" }, { status: 401 });

        const body = await readJson<{
          fullName?: string;
          phone?: string;
          address?: string;
          city?: string;
          zip?: string;
        }>(request);
        const address = {
          fullName: String(body.fullName || "").trim(),
          address: String(body.address || "").trim(),
          city: String(body.city || "").trim(),
          zip: String(body.zip || "").trim(),
        };

        await env.patria_db
          .prepare("UPDATE users SET phone = ?, address_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(String(body.phone || "").trim(), JSON.stringify(address), Number(current.user.id))
          .run();

        const updated = await getCurrentUser(request, env.patria_db);
        return Response.json({ success: true, user: updated?.user });
      }

      if (request.method === "PUT" && url.pathname === "/api/me") {
        const current = await getCurrentUser(request, env.patria_db);
        if (!current) return Response.json({ success: false, error: "Not logged in" }, { status: 401 });

        const body = await readJson<{
          name?: string;
          email?: string;
          phone?: string;
          password?: string;
        }>(request);
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        if (!name || !email) {
          return Response.json({ success: false, error: "Name and email are required." }, { status: 400 });
        }

        const duplicate = await env.patria_db
          .prepare("SELECT id FROM users WHERE lower(email) = ? AND id <> ? LIMIT 1")
          .bind(email, Number(current.user.id))
          .first();
        if (duplicate) return Response.json({ success: false, error: "Email already registered." }, { status: 409 });

        if (body.password && String(body.password).length < 8) {
          return Response.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
        }

        if (body.password) {
          const salt = randomString(16);
          const hash = await passwordHash(String(body.password), salt);
          await env.patria_db.prepare(`
            UPDATE users
            SET display_name = ?, email = ?, phone = ?, password_salt = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(name, email, String(body.phone || "").trim(), salt, hash, Number(current.user.id)).run();
        } else {
          await env.patria_db.prepare(`
            UPDATE users
            SET display_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(name, email, String(body.phone || "").trim(), Number(current.user.id)).run();
        }

        const updated = await getCurrentUser(request, env.patria_db);
        return Response.json({ success: true, user: updated?.user });
      }

      if (request.method === "GET" && url.pathname === "/api/me") {
        const current = await getCurrentUser(request, env.patria_db);

        if (!current) {
          return Response.json(
            { success: false, error: "Not logged in" },
            { status: 401 }
          );
        }

        return Response.json({ success: true, user: current.user });
      }

      if (
        (request.method === "POST" || request.method === "GET") &&
        url.pathname === "/api/logout"
      ) {
        const sessionToken = getSessionToken(request);

        if (sessionToken) {
          const tokenHash = await sha256(sessionToken);
          await env.patria_db
            .prepare("DELETE FROM sessions WHERE token_hash = ?")
            .bind(tokenHash)
            .run();
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Set-Cookie": clearCookie("patria_session"),
            },
          }
        );
      }


      /*
       * --------------------------------
       * STEP 1
       * 開始 LINE Login
       * --------------------------------
       */
      if (
        url.pathname === "/auth/line" ||
        url.pathname === "/auth/line/link"
      ) {
        const isLinkFlow = url.pathname === "/auth/line/link";

        if (isLinkFlow) {
          const current = await getCurrentUser(request, env.patria_db);
          if (!current) {
            return Response.json(
              { success: false, error: "Please log in before linking LINE." },
              { status: 401 }
            );
          }
        }

        const state = randomString(32);
        const nonce = randomString(32);

        const params = new URLSearchParams({
          response_type: "code",

          client_id:
            env.LINE_CHANNEL_ID,

          redirect_uri:
            env.LINE_CALLBACK_URL,

          state,

          scope:
            "openid profile",

          nonce,
        });

        const lineLoginUrl =
          "https://access.line.me/oauth2/v2.1/authorize?" +
          params.toString();

        const headers = new Headers();

        headers.set(
          "Location",
          lineLoginUrl
        );

        headers.append(
          "Set-Cookie",
          createCookie(
            "line_login_state",
            state
          )
        );

        headers.append(
          "Set-Cookie",
          createCookie(
            "line_login_nonce",
            nonce
          )
        );

        headers.append(
          "Set-Cookie",
          createCookie("line_login_mode", isLinkFlow ? "link" : "login")
        );

        return new Response(null, {
          status: 302,
          headers,
        });
      }


      /*
       * --------------------------------
       * STEP 2
       * LINE Callback
       * --------------------------------
       */
      if (
        url.pathname ===
        "/auth/line/callback"
      ) {

        const error =
          url.searchParams.get("error");

        const errorDescription =
          url.searchParams.get(
            "error_description"
          );

        if (error) {
          return Response.json(
            {
              success: false,
              error,
              error_description:
                errorDescription,
            },
            {
              status: 400,
            }
          );
        }


        const code =
          url.searchParams.get("code");

        const state =
          url.searchParams.get("state");


        if (!code || !state) {
          return Response.json(
            {
              success: false,
              error:
                "Missing code or state",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * 驗證 state
         */

        const savedState =
          getCookie(
            request,
            "line_login_state"
          );

        if (
          !savedState ||
          savedState !== state
        ) {
          return Response.json(
            {
              success: false,
              error:
                "Invalid LINE login state",
            },
            {
              status: 400,
            }
          );
        }


        const savedNonce =
          getCookie(
            request,
            "line_login_nonce"
          );

        if (!savedNonce) {
          return Response.json(
            {
              success: false,
              error:
                "Missing LINE login nonce",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 3
         * authorization code
         * 換 token
         * --------------------------------
         */

        const tokenResponse =
          await fetch(
            "https://api.line.me/oauth2/v2.1/token",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },

              body:
                new URLSearchParams({
                  grant_type:
                    "authorization_code",

                  code,

                  redirect_uri:
                    env.LINE_CALLBACK_URL,

                  client_id:
                    env.LINE_CHANNEL_ID,

                  client_secret:
                    env.LINE_CHANNEL_SECRET,
                }),
            }
          );


        const tokenData =
          (await tokenResponse.json()) as LineTokenResponse;


        if (
          !tokenResponse.ok ||
          !tokenData.id_token
        ) {
          console.error(
            "LINE token error:",
            tokenData
          );

          return Response.json(
            {
              success: false,
              error:
                "Failed to get LINE token",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 4
         * 驗證 LINE ID Token
         * --------------------------------
         */

        const verifyResponse =
          await fetch(
            "https://api.line.me/oauth2/v2.1/verify",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },

              body:
                new URLSearchParams({
                  id_token:
                    tokenData.id_token,

                  client_id:
                    env.LINE_CHANNEL_ID,

                  nonce:
                    savedNonce,
                }),
            }
          );


        const lineUser =
          (await verifyResponse.json()) as LineVerifyResponse;


        if (
          !verifyResponse.ok ||
          !lineUser.sub ||
          lineUser.nonce !== savedNonce ||
          lineUser.aud !== env.LINE_CHANNEL_ID
        ) {
          console.error(
            "LINE verify error:",
            lineUser
          );

          return Response.json(
            {
              success: false,
              error:
                "Failed to verify LINE user",
            },
            {
              status: 400,
            }
          );
        }


        /*
         * --------------------------------
         * STEP 5
         * 取得 LINE 身分
         * --------------------------------
         */

        const lineUserId =
          lineUser.sub;

        const displayName =
          lineUser.name ?? null;

        const avatarUrl =
          lineUser.picture ?? null;

        const isLinkFlow =
          getCookie(request, "line_login_mode") === "link";
        const current = isLinkFlow
          ? await getCurrentUser(request, env.patria_db)
          : null;

        if (isLinkFlow) {
          if (!current) {
            return Response.json(
              { success: false, error: "Your login session has expired." },
              { status: 401 }
            );
          }

          const linkedUser = await env.patria_db
            .prepare("SELECT id FROM users WHERE line_user_id = ? LIMIT 1")
            .bind(lineUserId)
            .first<{ id: number }>();

          if (linkedUser && Number(linkedUser.id) !== Number(current.user.id)) {
            return Response.json(
              {
                success: false,
                error: "This LINE account is already linked to another member.",
              },
              { status: 409 }
            );
          }

          await env.patria_db
            .prepare(`
              UPDATE users
              SET line_user_id = ?,
                  display_name = COALESCE(?, display_name),
                  avatar_url = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(
              lineUserId,
              displayName,
              avatarUrl,
              Number(current.user.id)
            )
            .run();
        } else {

          await env.patria_db
            .prepare(`
              INSERT INTO users (
                line_user_id,
                display_name,
                avatar_url
              )
              VALUES (?, ?, ?)

              ON CONFLICT(line_user_id)
              DO UPDATE SET
                display_name = excluded.display_name,
                avatar_url = excluded.avatar_url,
                updated_at = CURRENT_TIMESTAMP
            `)
            .bind(lineUserId, displayName, avatarUrl)
            .run();
        }


        /*
         * --------------------------------
         * STEP 7
         * 把會員重新查出來
         * --------------------------------
         */

        const user =
          await env.patria_db

            .prepare(`
              SELECT
                id,
                line_user_id,
                display_name,
                avatar_url,
                created_at,
                updated_at

              FROM users

              WHERE ${isLinkFlow ? "id" : "line_user_id"} = ?

              LIMIT 1
            `)

            .bind(
              isLinkFlow ? Number(current?.user.id) : lineUserId
            )

            .first();

        if (!user) {
          return Response.json(
            {
              success: false,
              error: "Unable to load member after LINE login",
            },
            { status: 500 }
          );
        }


        /*
         * 清掉 OAuth 暫存 Cookie
         */

        const responseHeaders =
          new Headers();

        await env.patria_db
          .prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP")
          .run();

        if (!isLinkFlow) {
          const sessionToken = await createSession(
            env.patria_db,
            Number((user as { id: number }).id)
          );

          responseHeaders.append(
            "Set-Cookie",
            createCookie(
              "patria_session",
              sessionToken,
              30 * 24 * 60 * 60
            )
          );
        }

        responseHeaders.append(
          "Set-Cookie",
          clearCookie(
            "line_login_state"
          )
        );

        responseHeaders.append(
          "Set-Cookie",
          clearCookie(
            "line_login_nonce"
          )
        );

        responseHeaders.append(
          "Set-Cookie",
          clearCookie("line_login_mode")
        );


        /*
         * 如果設定登入成功網址，
         * 就跳回前端
         */

        if (
          env.LOGIN_SUCCESS_URL
        ) {

          responseHeaders.set(
            "Location",
            env.LOGIN_SUCCESS_URL
          );

          return new Response(
            null,
            {
              status: 302,
              headers:
                responseHeaders,
            }
          );
        }


        /*
         * 測試階段先直接顯示結果
         */

        responseHeaders.set(
          "Content-Type",
          "application/json; charset=utf-8"
        );

        return new Response(
          JSON.stringify(
            {
              success: true,

              message:
                "LINE login successful",

              user,
            },
            null,
            2
          ),
          {
            status: 200,
            headers:
              responseHeaders,
          }
        );
      }


      /*
       * --------------------------------
       * 404
       * --------------------------------
       */

      return Response.json(
        {
          success: false,
          error: "Not found",
        },
        {
          status: 404,
        }
      );


    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      return Response.json(
        {
          success: false,
          error:
            "Internal server error",
        },
        {
          status: 500,
        }
      );
    }
  },
};
