var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// sensen-api/src/index.ts
var JSON_CONTENT_TYPE = "application/json; charset=utf-8";
var GUEST_COOKIE = "sensen_guest";
var SESSION_COOKIE = "sensen_session";
var getGuestId = /* @__PURE__ */ __name((request) => {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)sensen_guest=([^;]+)/);
  return match?.[1] || crypto.randomUUID();
}, "getGuestId");
var responseHeaders = /* @__PURE__ */ __name((request, extra = {}) => {
  const origin = request.headers.get("Origin");
  return {
    "Content-Type": JSON_CONTENT_TYPE,
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    ...extra
  };
}, "responseHeaders");
var json = /* @__PURE__ */ __name((request, body, status = 200, guestId, sessionToken) => {
  const headers = new Headers(responseHeaders(request));
  const secureCookie = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  if (guestId) {
    headers.append("Set-Cookie", `${GUEST_COOKIE}=${encodeURIComponent(guestId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secureCookie}`);
  }
  if (sessionToken !== void 0) {
    const cookie = sessionToken ? `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${secureCookie}` : `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureCookie}`;
    headers.append("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(body), { status, headers });
}, "json");
var parseBody = /* @__PURE__ */ __name(async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
}, "parseBody");
var getCookie = /* @__PURE__ */ __name((request, name) => {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] || "";
}, "getCookie");
var bytesToHex = /* @__PURE__ */ __name((bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""), "bytesToHex");
var randomToken = /* @__PURE__ */ __name(() => bytesToHex(crypto.getRandomValues(new Uint8Array(32))), "randomToken");
var derivePasswordHash = /* @__PURE__ */ __name(async (password, salt) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 1e5, hash: "SHA-512" },
    key,
    512
  );
  return bytesToHex(new Uint8Array(bits));
}, "derivePasswordHash");
var createPasswordHash = /* @__PURE__ */ __name(async (password) => {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await derivePasswordHash(password, salt) };
}, "createPasswordHash");
var verifyPassword = /* @__PURE__ */ __name(async (password, user) => {
  if (!user.password_salt || !user.password_hash) return false;
  try {
    return await derivePasswordHash(password, user.password_salt) === user.password_hash;
  } catch {
    return false;
  }
}, "verifyPassword");
var getSessionUser = /* @__PURE__ */ __name(async (env, request) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.password_salt, u.password_hash
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token = ?1
  `).bind(token).first();
}, "getSessionUser");
var publicUser = /* @__PURE__ */ __name((user) => ({
  id: user.id,
  name: user.name || "\u6703\u54E1",
  email: user.email || "",
  phone: user.phone || "",
  role: user.role || "customer",
  isAdmin: user.role === "admin"
}), "publicUser");
var parseJson = /* @__PURE__ */ __name((value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}, "parseJson");
var slugify = /* @__PURE__ */ __name((value) => {
  const slug = value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return slug || `product-${Date.now()}`;
}, "slugify");
var shippingLabel = /* @__PURE__ */ __name((method) => ({
  pickup: "\u9580\u5E02\u81EA\u53D6",
  home: "\u5B85\u914D",
  frozen: "\u51B7\u51CD\u5B85\u914D"
})[String(method || "pickup")] || "\u9580\u5E02\u81EA\u53D6", "shippingLabel");
var publicNewsImageUrl = /* @__PURE__ */ __name((value) => {
  const image = String(value || "").trim();
  if (!image) return "";
  try {
    const source = new URL(image);
    if (source.hostname === "www.sensen.com.tw" && source.pathname.startsWith("/wp-content/uploads/")) {
      return `/images/legacy-news?url=${encodeURIComponent(source.href)}`;
    }
  } catch {
  }
  return image;
}, "publicNewsImageUrl");
var newsFromRow = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  category: row.category || "latest-news",
  excerpt: row.excerpt || "",
  content: row.content || "",
  image: publicNewsImageUrl(row.image_key),
  layout: parseJson(String(row.layout_json || ""), null),
  publishAt: row.publish_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: Number(row.is_published) === 1 ? "published" : "draft"
}), "newsFromRow");
var SITE_ORIGIN = "https://www.sensen.com.tw";
var RETIRED_CONTENT_PATHS = /* @__PURE__ */ new Set([
  "/author/admin",
  "/slide-types/index-slider",
  "/\u7522\u54C1\u4ECB\u7D39/page/2",
  "/\u7522\u54C1\u4ECB\u7D39/page/3",
  "/\u7522\u54C1\u4ECB\u7D39/\u751F\u65E5\u86CB\u7CD5-\u4E0B\u65B9\u6709dm\u4F9B\u4E0B\u8F09-264/page/2",
  "/latest-news/\xB2\u2070\xB2\xB9-\u{1D405}\u{1D41A}\u{1D42D}\u{1D421}\u{1D41E}\u{1D42B}\u{1D42C}-\u{1D403}\u{1D41A}\u{1D432}\u2728-2",
  "/latest-news/\u7236\u89AA\u7BC0\u86CB\u7CD5\u9810\u8CFC\u958B\u8DD1\u56C9-2",
  "/latest-news/\u5409\u7965\u6842\u5713\u7CD5-2",
  "/latest-news/\u8089\u9B06\u9905-2",
  "/latest-news/\u5F4C\u6708\u8A66\u5403\u54C1\u9805-2",
  "/new-arrival/\u591A\u4F73\u7C73\u62C9-2",
  "/new-arrival/\u8292\u679C\u5976\u9732\u9EB5\u5305-2",
  "/new-arrival/\u8349\u8393\u751C\u5FC3-2",
  "/latest-news/\u{1F4E3}\u6F84\u548C\u5E97\u9031\u5E74\u6176\u{1F4E3}",
  "/latest-news/2019\u9802\u5BB6\u5F4C\u6708\u76EE\u9304",
  "/latest-news/2021\u6BCD\u89AA\u7BC0\u86CB\u7CD5",
  "/latest-news/2022\u4E2D\u79CBdm",
  "/latest-news/2023\u4E2D\u79CBdm",
  "/latest-news/2023\u6BCD\u89AA\u7BC0\u86CB\u7CD5",
  "/latest-news/2024\u6BCD\u89AA\u7BC0\u86CB\u7CD5",
  "/latest-news/2024\u65B0\u6625\u79AE\u76D2",
  "/latest-news/88\u7BC0\u86CB\u7CD5\u9810\u8CFC\u958B\u8DD1",
  "/latest-news/\u4E2D\u79CBdm\u51FA\u7210\u56C9",
  "/latest-news/\u4ECA\u5E74\u7684\u68EE\u68EE\u8292\u679C\u5B63\u958B\u59CB\u56C9-3",
  "/latest-news/\u6587\u9F8D\u5E74\u4E2D\u6176",
  "/latest-news/\u6587\u9F8D\u521D\u79CB\u8CDE",
  "/latest-news/\u751F\u65E5\u86CB\u7CD5\u5377",
  "/latest-news/\u8089\u9B06\u9905\u79AE\u76D2",
  "/latest-news/\u828B\u898B\u5E78\u798F",
  "/latest-news/\u6CE2\u863F\u86CB\u9EC3\u9165-2",
  "/latest-news/\u6625\u7BC0\u79AE\u76D2\u9810\u8CFC\u958B\u8DD1\u56C9",
  "/latest-news/\u8349\u8393\u5927\u798F\u79AE\u76D2",
  "/latest-news/\u9802\u5BB6\u5F4C\u6708\u{1F525}\u4EBA\u6C23\u6CE2\u58EB\u9813\u6D3E\u{1F525}",
  "/latest-news/\u68EE\u68EE\u5410\u53F8",
  "/latest-news/\u65B0\u5BCC\u5E97\u958B\u5E55\u6176",
  "/latest-news/\u6F84\u548C\u5E97\u512A\u60E0",
  "/latest-news/\u9910\u76D2",
  "/latest-news/\u9910\u76D2menu",
  "/latest-news/\u6B61\u6176\u65B0\u5BCC\u5E97\u958B\u5E55",
  "/latest-news/bebuilder-1930",
  "/new-arrival/\u5E03\u4E01\u71D2",
  "/new-arrival/\u6817\u5B50\u8499\u5E03\u6717-mont-blanc",
  "/new-arrival/\u68EE\u68EE\u8774\u8776\u9165",
  "/new-arrival/\u65B0\u54C1\u4E0A\u5E02",
  "/new-arrival/\u65B0\u54C1\u4E0A\u5E02-2",
  "/new-arrival/\u8774\u8776\u9165",
  "/new-arrival/\u512A\u8354-lichi",
  "/new-arrival/new-\u674F\u4EC1\u5343\u5C64\u9165-new"
]);
var escapeMarkup = /* @__PURE__ */ __name((value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[character] || character), "escapeMarkup");
var newsImageUrl = /* @__PURE__ */ __name((value) => {
  const image = publicNewsImageUrl(value);
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${SITE_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
}, "newsImageUrl");
var newsDate = /* @__PURE__ */ __name((value) => {
  const raw = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.replace(/-/g, ".") : "";
}, "newsDate");
var newsCopyHtml = /* @__PURE__ */ __name((value) => {
  const imagePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;
  return String(value || "").split(/\r?\n/).filter((line) => !imagePattern.test(line.trim())).map(escapeMarkup).join("<br>");
}, "newsCopyHtml");
var renderNewsArticleShell = /* @__PURE__ */ __name((row) => {
  const title = String(row.title || "\u6700\u65B0\u6D88\u606F");
  const copy = newsCopyHtml(row.content || row.excerpt || "\u76EE\u524D\u6C92\u6709\u6587\u7AE0\u5167\u5BB9\u3002");
  const date = newsDate(row.publish_at || row.created_at);
  const layout = parseJson(String(row.layout_json || ""), null);
  if (layout?.length) {
    const blocks = layout.filter((block) => ["date", "title", "copy", "image", "gallery", "text"].includes(String(block.type || "")));
    const blockHtml = /* @__PURE__ */ __name((block) => {
      if (block.type === "date") return `<p class="latest-news-layout-date"><span aria-hidden="true">\u25F7</span>${escapeMarkup(date)}</p>`;
      if (block.type === "title") return `<h1 class="latest-news-layout-title">${escapeMarkup(title)}</h1>`;
      if (block.type === "copy") return `<div class="latest-news-layout-copy">${copy}</div>`;
      if (block.type === "text") return `<div class="latest-news-layout-copy">${escapeMarkup(block.value).replace(/\r?\n/g, "<br>")}</div>`;
      if (block.type === "image") return `<img class="latest-news-layout-image" src="${escapeMarkup(newsImageUrl(block.src))}" alt="${escapeMarkup(title)}\uFF0D\u5167\u6587\u5716\u7247" loading="lazy">`;
      const images2 = Array.isArray(block.images) ? block.images : [];
      return `<div class="latest-news-layout-gallery">${images2.map((image) => `<img class="latest-news-layout-image" src="${escapeMarkup(newsImageUrl(image))}" alt="${escapeMarkup(title)}\uFF0D\u5167\u6587\u5716\u7247" loading="lazy">`).join("")}</div>`;
    }, "blockHtml");
    return `<div class="latest-news-article-shell is-free-layout">${blocks.map((block) => {
      const markup = blockHtml(block);
      const link = /^(https?:\/\/|\/)/i.test(String(block.link || "").trim()) ? String(block.link).trim() : "";
      return `<section class="latest-news-layout-block span-${Number(block.span) === 6 ? "6" : "12"}">${link ? `<a class="latest-news-layout-link" href="${escapeMarkup(link)}">${markup}</a>` : markup}</section>`;
    }).join("")}</div>`;
  }
  const imagePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;
  const images = String(row.content || "").split(/\r?\n/).map((line) => line.trim()).filter((line) => imagePattern.test(line));
  return `<div class="latest-news-article-shell"><header class="latest-news-article-header"><p class="latest-news-card-date"><span aria-hidden="true">\u25F7</span>${escapeMarkup(date)}</p><h1 id="latest-news-article-title">${escapeMarkup(title)}</h1></header><div class="latest-news-article-image"${images.length ? "" : " hidden"}>${images.map((image, index) => `<img src="${escapeMarkup(newsImageUrl(image))}" alt="${escapeMarkup(title)}\uFF0D\u5167\u6587\u5716\u7247 ${index + 1}" loading="lazy">`).join("")}</div><div class="latest-news-article-copy"><div class="latest-news-article-content">${copy}</div></div></div>`;
}, "renderNewsArticleShell");
var renderNewsArticlePage = /* @__PURE__ */ __name((template, row) => {
  const title = String(row.title || "\u6700\u65B0\u6D88\u606F");
  const description = String(row.excerpt || newsCopyHtml(row.content).replace(/<br>/g, " ") || title).replace(/\s+/g, " ").trim().slice(0, 155);
  const articleKey = String(row.slug || row.id || "");
  const canonical = `${SITE_ORIGIN}/latest-news/article/${encodeURIComponent(articleKey)}/`;
  const image = newsImageUrl(row.image_key);
  const seo = `<title>${escapeMarkup(title)} \u2013 \u68EE\u68EE\u9EDE\u5FC3\u574A</title>
  <meta name="description" content="${escapeMarkup(description)}">
  <link rel="canonical" href="${escapeMarkup(canonical)}">
  <meta name="robots" content="index, follow">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="\u68EE\u68EE\u9EDE\u5FC3\u574A">
  <meta property="og:title" content="${escapeMarkup(title)}">
  <meta property="og:description" content="${escapeMarkup(description)}">
  <meta property="og:url" content="${escapeMarkup(canonical)}">${image ? `
  <meta property="og:image" content="${escapeMarkup(image)}">` : ""}`;
  return template.replace(/<title>[\s\S]*?<\/title>[\s\S]*?<meta property="og:url"[^>]*>/i, seo).replace("data-latest-news-article-page", 'data-latest-news-article-page data-article-hydrated="true"').replace(/<!-- NEWS_ARTICLE_SHELL_START -->[\s\S]*?<!-- NEWS_ARTICLE_SHELL_END -->/, `<!-- NEWS_ARTICLE_SHELL_START -->${renderNewsArticleShell(row)}<!-- NEWS_ARTICLE_SHELL_END -->`);
}, "renderNewsArticlePage");
var adminProductFromRow = /* @__PURE__ */ __name((row) => {
  const product = productFromRow(row);
  const metadata = parseJson(row.metadata_json, {});
  return {
    ...product,
    sku: String(metadata.sku || product.id),
    spec: String(metadata.spec || ""),
    day: String(metadata.day || 5),
    img: String(metadata.img || product.img)
  };
}, "adminProductFromRow");
var orderFromRow = /* @__PURE__ */ __name((row, items) => {
  const total = Number(row.total_amount || 0);
  const shippingFee = Number(row.shipping_fee || 0);
  const discount = Number(row.discount_amount || 0);
  const shippingAddress = parseJson(String(row.shipping_address || ""), null);
  const status = String(row.status || "created");
  return {
    id: row.order_number,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status,
    statusHistory: [{ status, at: row.updated_at || row.created_at }],
    total,
    subtotal: Number((total - shippingFee + discount).toFixed(2)),
    shippingFee,
    discount,
    shippingMethod: row.shipping_method || "pickup",
    shippingLabel: shippingLabel(String(row.shipping_method || "pickup")),
    fulfillmentDate: row.fulfillment_date || "",
    trackingNumber: row.tracking_number || "",
    shippingAddress,
    customerNote: row.customer_note || "",
    customer: {
      id: row.user_id,
      name: row.customer_name || row.user_name || "\u6703\u54E1",
      email: row.customer_email || row.user_email || "",
      phone: row.customer_phone || row.user_phone || ""
    },
    items
  };
}, "orderFromRow");
var productFromRow = /* @__PURE__ */ __name((row) => {
  let metadata = {};
  try {
    metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {};
  } catch {
    metadata = {};
  }
  const priceValue = Number(row.price || 0);
  const imageKey = String(row.image_key || "").replace(/^images\//, "");
  return {
    id: row.slug,
    title: row.title,
    cat: row.category || String(metadata.cat || "\u672A\u5206\u985E"),
    price: `$${priceValue.toFixed(2)}`,
    priceValue,
    quantity: Math.max(0, Number(row.stock || 0)),
    day: String(metadata.day || 5),
    img: imageKey ? `/assets/images/${imageKey}` : "",
    desc: row.description || String(metadata.desc || ""),
    published: row.is_active === 1
  };
}, "productFromRow");
var imagePathFromKey = /* @__PURE__ */ __name((value) => {
  const key = String(value || "").trim().replace(/^\/?(?:assets\/)?images\//i, "");
  return key ? `/assets/images/${key}` : "";
}, "imagePathFromKey");
var adminOrderItemFromRow = /* @__PURE__ */ __name((item) => ({
  ...item,
  cat: String(item.category || "Menu"),
  price: `$${Number(item.priceValue || 0).toFixed(2)}`,
  img: imagePathFromKey(item.imageKey)
}), "adminOrderItemFromRow");
var productSelect = `
  SELECT
    p.id AS db_id,
    p.slug,
    p.name AS title,
    p.description,
    p.price,
    p.stock,
    p.image_key,
    p.is_active,
    c.name AS category,
    p.metadata_json
  FROM products p
`;
var findProduct = /* @__PURE__ */ __name(async (env, value) => {
  if (!value) return null;
  const row = await env.DB.prepare(`${productSelect}
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND (p.slug = ?1 OR p.name = ?1)
    LIMIT 1`).bind(value).first();
  return row || null;
}, "findProduct");
var cartSummary = /* @__PURE__ */ __name(async (env, guestId) => {
  const result = await env.DB.prepare(`${productSelect}
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN cart_items ci ON ci.product_id = p.id
    WHERE ci.guest_id = ?1 AND p.is_active = 1
    ORDER BY ci.created_at ASC`).bind(guestId).all();
  const items = result.results.map((row) => ({
    ...productFromRow(row),
    qty: Math.max(1, Number(row.quantity || 1))
  }));
  const subtotal = items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
  const leadDays = items.reduce((max, item) => Math.max(max, Number(item.day || 5)), 0);
  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    total: Number(subtotal.toFixed(2)),
    leadDays
  };
}, "cartSummary");
var imageResponse = /* @__PURE__ */ __name(async (request, env) => {
  const url = new URL(request.url);
  const requestedKey = url.pathname.slice("/images/".length);
  if (!requestedKey || requestedKey.split("/").includes("..")) {
    return json(request, { error: "\u5716\u7247\u8DEF\u5F91\u7121\u6548\u3002" }, 400);
  }
  if (requestedKey === "legacy-news") {
    let source;
    try {
      source = new URL(url.searchParams.get("url") || "");
    } catch {
      return json(request, { error: "\u820A\u7AD9\u5716\u7247\u7DB2\u5740\u7121\u6548\u3002" }, 400);
    }
    if (source.protocol !== "https:" || source.hostname !== "www.sensen.com.tw" || !source.pathname.startsWith("/wp-content/uploads/")) {
      return json(request, { error: "\u4E0D\u5141\u8A31\u4EE3\u7406\u6B64\u5716\u7247\u4F86\u6E90\u3002" }, 403);
    }
    const upstream = await fetch(source.href, { headers: { Accept: "image/*" } });
    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !contentType.startsWith("image/")) {
      return json(request, { error: "\u7121\u6CD5\u8F09\u5165\u820A\u7AD9\u5716\u7247\u3002" }, 404);
    }
    const headers2 = new Headers({
      "content-type": contentType,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800"
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers2.set("content-length", contentLength);
    return new Response(upstream.body, { headers: headers2 });
  }
  const object = await env.BUCKET.get("images/" + requestedKey);
  if (!object) return json(request, { error: "\u627E\u4E0D\u5230\u5716\u7247\u3002" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}, "imageResponse");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: responseHeaders(request) });
    }
    try {
      const decodedPathname = decodeURI(url.pathname);
      const normalizedPathname = decodedPathname.replace(/\/+$/, "") || "/";
      if ((request.method === "GET" || request.method === "HEAD") && RETIRED_CONTENT_PATHS.has(normalizedPathname)) {
        return new Response("\u6B64\u5167\u5BB9\u5DF2\u6C38\u4E45\u79FB\u9664\u3002", {
          status: 410,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" }
        });
      }
      if ((request.method === "GET" || request.method === "HEAD") && decodedPathname.replace(/\/+$/, "") === "/product-item/\u6CD5\u5F0F\u8776\u8768\u9165-1657") {
        return Response.redirect(`${url.origin}/product-item/${encodeURIComponent("\u6CD5\u5F0F\u8774\u8776\u9165-1657")}/`, 301);
      }
      if ((request.method === "GET" || request.method === "HEAD") && decodedPathname.replace(/\/+$/, "") === "/\u96B1\u79C1\u6B0A\u689D\u4EF6") {
        return Response.redirect(`${url.origin}/${encodeURIComponent("\u96B1\u79C1\u6B0A\u689D\u6B3E")}/`, 301);
      }
      if ((request.method === "GET" || request.method === "HEAD") && /^\/latest-news\/article\/?$/.test(url.pathname) && url.searchParams.get("id")) {
        return Response.redirect(`${url.origin}/latest-news/article/${encodeURIComponent(url.searchParams.get("id") || "")}/`, 301);
      }
      if ((request.method === "GET" || request.method === "HEAD") && !url.pathname.endsWith("/") && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/images/") && url.pathname !== "/health" && !/\/[^/]+\.[a-z0-9]+$/i.test(url.pathname)) {
        return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
      }
      if (url.pathname === "/health" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT 1 AS ok").first();
        return json(request, { ok: result?.ok === 1, database: "connected" });
      }
      if (url.pathname === "/api/products" && request.method === "GET") {
        const result = await env.DB.prepare(`${productSelect}
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = 1 ORDER BY p.id DESC`).all();
        return json(request, { products: result.results.map(productFromRow) });
      }
      if (url.pathname === "/api/news" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const result = id ? await env.DB.prepare(`SELECT * FROM news WHERE is_published = 1 AND (id = ?1 OR slug = ?1) LIMIT 1`).bind(id).all() : await env.DB.prepare(`SELECT * FROM news WHERE is_published = 1 AND (publish_at IS NULL OR datetime(replace(publish_at, 'T', ' ')) <= CURRENT_TIMESTAMP) ORDER BY COALESCE(publish_at, created_at) DESC`).all();
        return json(request, { news: result.results.map(newsFromRow) });
      }
      if (url.pathname === "/api/coupons" && request.method === "GET") {
        const result = await env.DB.prepare(`SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons WHERE enabled = 1 ORDER BY updated_at DESC`).all();
        return json(request, { coupons: result.results });
      }
      if (url.pathname === "/api/contact" && request.method === "POST") {
        const body = await parseBody(request);
        const name = String(body.name || "").trim();
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim();
        const subject = String(body.subject || "\u5916\u71F4\u8A62\u50F9").trim();
        const message = String(body.message || body.requests || "").trim();
        if (!name || !email || !message) return json(request, { error: "\u8ACB\u586B\u5BEB\u59D3\u540D\u3001Email \u8207\u9700\u6C42\u5167\u5BB9\u3002" }, 400);
        await env.DB.prepare(`
          INSERT INTO engagement_records (record_type, payload_json)
          VALUES ('message', ?1)
        `).bind(JSON.stringify({ name, email, phone, subject, message })).run();
        return json(request, { message: "\u8A0A\u606F\u5DF2\u9001\u51FA\uFF0C\u6211\u5011\u6703\u76E1\u5FEB\u8207\u60A8\u806F\u7D61\u3002", record: { name, email, phone, subject, message }, ok: true }, 201);
      }
      if (url.pathname === "/api/reservations" && request.method === "POST") {
        const body = await parseBody(request);
        const name = String(body.name || "").trim();
        const phone = String(body.phone || "").trim();
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const date = String(body.date || "").trim();
        const time = String(body.time || "").trim();
        if (!name || !phone || !email || !date || !time) return json(request, { error: "\u8ACB\u586B\u5BEB\u5B8C\u6574\u7684\u9810\u7D04\u8CC7\u6599\u3002" }, 400);
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('reservation', ?1)").bind(JSON.stringify({ name, phone, email, guests: body.guests || "", date, time, requests: String(body.requests || body.specialRequests || "").trim() })).run();
        return json(request, { reservation: { name, phone, email, guests: body.guests || "", date, time, requests: String(body.requests || body.specialRequests || "").trim() }, ok: true }, 201);
      }
      if (url.pathname === "/api/newsletter" && request.method === "POST") {
        const body = await parseBody(request);
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        if (!email || !email.includes("@")) return json(request, { error: "\u8ACB\u586B\u5BEB\u6709\u6548\u7684 Email\u3002" }, 400);
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('subscriber', ?1)").bind(JSON.stringify({ email, status: "active" })).run();
        return json(request, { subscriber: { email, status: "active" }, ok: true }, 201);
      }
      if (url.pathname === "/api/search" && (request.method === "GET" || request.method === "POST")) {
        const body = request.method === "POST" ? await parseBody(request) : {};
        const query = String(request.method === "POST" ? body.query || body.q || "" : url.searchParams.get("q") || "").trim();
        if (!query) return json(request, { query: "", products: [] });
        const like = `%${query}%`;
        const result = await env.DB.prepare(`${productSelect}
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = 1 AND (p.name LIKE ?1 OR p.description LIKE ?1 OR c.name LIKE ?1)
          ORDER BY p.id DESC LIMIT 50`).bind(like).all();
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('search', ?1)").bind(JSON.stringify({ query, resultCount: result.results.length })).run();
        return json(request, { query, products: result.results.map(productFromRow) });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        const admin = await getSessionUser(env, request);
        if (!admin || admin.role !== "admin") {
          return json(request, { error: "\u9700\u8981\u7BA1\u7406\u54E1\u6B0A\u9650\u3002" }, 403);
        }
        if (url.pathname === "/api/admin/images" && request.method === "POST") {
          const form = await request.formData();
          const file = form.get("image");
          if (!(file instanceof File) || file.size === 0) {
            return json(request, { error: "\u8ACB\u9078\u64C7\u5716\u7247\u6A94\u6848\u3002" }, 400);
          }
          const extensions = {
            "image/avif": "avif",
            "image/gif": "gif",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
          };
          const extension = extensions[file.type];
          if (!extension) return json(request, { error: "\u50C5\u652F\u63F4 JPG\u3001PNG\u3001WebP\u3001GIF \u6216 AVIF \u5716\u7247\u3002" }, 415);
          if (file.size > 8 * 1024 * 1024) return json(request, { error: "\u5716\u7247\u4E0D\u53EF\u8D85\u904E 8 MB\u3002" }, 413);
          const key = `news/${Date.now()}-${crypto.randomUUID()}.${extension}`;
          await env.BUCKET.put(`images/${key}`, file.stream(), {
            httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }
          });
          return json(request, { image: `/images/${key}` }, 201);
        }
        if (url.pathname === "/api/admin/categories" && request.method === "GET") {
          const result = await env.DB.prepare(`
            SELECT c.id, c.name, c.slug
            FROM categories c
            INNER JOIN products p ON p.category_id = c.id AND p.is_active = 1
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.id
          `).all();
          return json(request, { categories: result.results });
        }
        if (url.pathname === "/api/admin/products" && request.method === "GET") {
          const result = await env.DB.prepare(`${productSelect}
            LEFT JOIN categories c ON c.id = p.category_id
            ORDER BY p.id DESC`).all();
          return json(request, { products: result.results.map(adminProductFromRow) });
        }
        if (url.pathname === "/api/admin/products" && (request.method === "POST" || request.method === "PATCH")) {
          const body = await parseBody(request);
          const lookup = String(body.id || "").trim();
          const existing = request.method === "PATCH" ? await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ?1 OR CAST(p.id AS TEXT) = ?1 LIMIT 1`).bind(lookup).first() : null;
          if (request.method === "PATCH" && !existing) return json(request, { error: "\u627E\u4E0D\u5230\u5546\u54C1\u3002" }, 404);
          const existingMetadata = parseJson(existing?.metadata_json, {});
          const title = String(body.title ?? existing?.title ?? "").trim();
          const categoryName = String(body.cat ?? existing?.category ?? "\u672A\u5206\u985E").trim();
          const price = Math.max(0, Math.round(Number(body.priceValue ?? body.price ?? existing?.price ?? 0)));
          const stock = Math.max(0, Math.round(Number(body.quantity ?? existing?.stock ?? 0)));
          const published = body.published !== void 0 ? body.published !== false : existing?.is_active === 1;
          if (!title) return json(request, { error: "\u5546\u54C1\u540D\u7A31\u4E0D\u53EF\u70BA\u7A7A\u767D\u3002" }, 400);
          if (!Number.isFinite(price) || !Number.isFinite(stock)) return json(request, { error: "\u552E\u50F9\u6216\u5EAB\u5B58\u683C\u5F0F\u932F\u8AA4\u3002" }, 400);
          let category = await env.DB.prepare("SELECT id FROM categories WHERE name = ?1 OR slug = ?1 LIMIT 1").bind(categoryName).first();
          if (!category) {
            const insertedCategory = await env.DB.prepare("INSERT INTO categories (name, slug) VALUES (?1, ?2)").bind(categoryName, slugify(categoryName)).run();
            category = { id: Number(insertedCategory.meta.last_row_id) };
          }
          const imageValue = String(body.img ?? existingMetadata.img ?? existing?.image_key ?? "").trim();
          const imageKey = imageValue.replace(/^\/?assets\/images\//, "").replace(/^\/?images\//, "");
          const metadata = JSON.stringify({
            sku: String(body.sku ?? existingMetadata.sku ?? "").trim(),
            spec: String(body.spec ?? existingMetadata.spec ?? "").trim(),
            day: String(body.day ?? existingMetadata.day ?? "5").trim(),
            img: imageValue
          });
          if (request.method === "POST") {
            let slug = slugify(title);
            const duplicate = await env.DB.prepare("SELECT id FROM products WHERE slug = ?1 OR name = ?2 LIMIT 1").bind(slug, title).first();
            if (duplicate) slug = `${slug}-${Date.now().toString(36)}`;
            const result = await env.DB.prepare(`
              INSERT INTO products (category_id, name, slug, description, price, stock, image_key, is_active, metadata_json)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            `).bind(category.id, title, slug, String(body.desc || "").trim(), price, stock, imageKey, published ? 1 : 0, metadata).run();
            const row = await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?1`).bind(Number(result.meta.last_row_id)).first();
            return json(request, { product: row ? adminProductFromRow(row) : null }, 201);
          }
          await env.DB.prepare(`
            UPDATE products SET category_id = ?1, name = ?2, description = ?3, price = ?4,
              stock = ?5, image_key = ?6, is_active = ?7, metadata_json = ?8, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?9
          `).bind(category.id, title, String(body.desc ?? existing?.description ?? "").trim(), price, stock, imageKey, published ? 1 : 0, metadata, existing?.db_id).run();
          const updated = await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?1`).bind(existing?.db_id).first();
          return json(request, { product: updated ? adminProductFromRow(updated) : null });
        }
        if (url.pathname === "/api/admin/products" && request.method === "DELETE") {
          const body = await parseBody(request);
          const lookup = String(body.id || "").trim();
          const row = await env.DB.prepare("SELECT id FROM products WHERE slug = ?1 OR CAST(id AS TEXT) = ?1 LIMIT 1").bind(lookup).first();
          if (!row) return json(request, { error: "\u627E\u4E0D\u5230\u5546\u54C1\u3002" }, 404);
          const orderReferences = await env.DB.prepare("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?1").bind(row.id).first();
          const cartReferences = await env.DB.prepare("SELECT COUNT(*) AS count FROM cart_items WHERE product_id = ?1").bind(row.id).first();
          const hasReferences = Number(orderReferences?.count || 0) > 0 || Number(cartReferences?.count || 0) > 0;
          if (!hasReferences) {
            await env.DB.prepare("DELETE FROM product_images WHERE product_id = ?1").bind(row.id).run();
            await env.DB.prepare("DELETE FROM products WHERE id = ?1").bind(row.id).run();
            return json(request, { ok: true, id: lookup, deleted: true });
          }
          await env.DB.prepare("UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(row.id).run();
          return json(request, { ok: true, id: lookup, deleted: false, archived: true });
        }
        if (url.pathname === "/api/admin/news" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT * FROM news ORDER BY COALESCE(publish_at, created_at) DESC").all();
          return json(request, { news: result.results.map(newsFromRow) });
        }
        if (url.pathname === "/api/admin/news" && (request.method === "POST" || request.method === "PATCH")) {
          const body = await parseBody(request);
          const title = String(body.title || "").trim();
          const content = String(body.content || "").trim();
          const excerpt = String(body.excerpt || "").trim();
          const category = String(body.category || "latest-news").trim();
          const image = String(body.image || "").trim();
          const layout = Array.isArray(body.layout) ? JSON.stringify(body.layout) : null;
          const published = String(body.status || "draft") === "published";
          const publishAt = String(body.publishAt || (/* @__PURE__ */ new Date()).toISOString());
          if (!title) return json(request, { error: "\u6587\u7AE0\u6A19\u984C\u4E0D\u53EF\u70BA\u7A7A\u767D\u3002" }, 400);
          if (request.method === "POST") {
            const id2 = `news-${Date.now().toString(36)}`;
            const slug = `${slugify(title)}-${id2}`;
            await env.DB.prepare(`
              INSERT INTO news (id, title, slug, category, excerpt, content, image_key, publish_at, is_published, layout_json)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            `).bind(id2, title, slug, category, excerpt, content, image, publishAt, published ? 1 : 0, layout).run();
            const row2 = await env.DB.prepare("SELECT * FROM news WHERE id = ?1").bind(id2).first();
            return json(request, { news: row2 ? newsFromRow(row2) : null }, 201);
          }
          const id = String(body.id || "").trim();
          const exists = await env.DB.prepare("SELECT id FROM news WHERE id = ?1").bind(id).first();
          if (!exists) return json(request, { error: "\u627E\u4E0D\u5230\u6587\u7AE0\u3002" }, 404);
          await env.DB.prepare(`
            UPDATE news SET title = ?1, category = ?2, excerpt = ?3, content = ?4, image_key = ?5,
              publish_at = ?6, is_published = ?7, layout_json = ?8, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?9
          `).bind(title, category, excerpt, content, image, publishAt, published ? 1 : 0, layout, id).run();
          const row = await env.DB.prepare("SELECT * FROM news WHERE id = ?1").bind(id).first();
          return json(request, { news: row ? newsFromRow(row) : null });
        }
        if (url.pathname === "/api/admin/news" && request.method === "DELETE") {
          const body = await parseBody(request);
          const id = String(body.id || "").trim();
          await env.DB.prepare("DELETE FROM news WHERE id = ?1").bind(id).run();
          return json(request, { ok: true, id });
        }
        if (url.pathname === "/api/admin/coupons" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY updated_at DESC").all();
          return json(request, { coupons: result.results });
        }
        if (url.pathname === "/api/admin/coupons" && request.method === "POST") {
          const body = await parseBody(request);
          const code = String(body.code || "").trim().toUpperCase();
          const label = String(body.label || "").trim();
          const type = String(body.type || "fixed").trim();
          const value = Number(body.value || 0);
          const min = Number(body.min || 0);
          if (!code || !label || !["fixed", "percent"].includes(type) || !Number.isFinite(value)) return json(request, { error: "\u512A\u60E0\u78BC\u8CC7\u6599\u683C\u5F0F\u932F\u8AA4\u3002" }, 400);
          await env.DB.prepare(`INSERT INTO coupons (code, label, type, value, min_amount, enabled, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP) ON CONFLICT(code) DO UPDATE SET label = excluded.label, type = excluded.type, value = excluded.value, min_amount = excluded.min_amount, enabled = excluded.enabled, updated_at = CURRENT_TIMESTAMP`).bind(code, label, type, value, min, body.enabled === false ? 0 : 1).run();
          const coupon = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons WHERE code = ?1").bind(code).first();
          return json(request, { coupon });
        }
        if (url.pathname === "/api/admin/coupons" && (request.method === "PATCH" || request.method === "DELETE")) {
          const body = await parseBody(request);
          const code = String(body.code || "").trim().toUpperCase();
          if (request.method === "DELETE") await env.DB.prepare("DELETE FROM coupons WHERE code = ?1").bind(code).run();
          else await env.DB.prepare("UPDATE coupons SET enabled = ?1, updated_at = CURRENT_TIMESTAMP WHERE code = ?2").bind(body.enabled === false ? 0 : 1, code).run();
          const result = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY updated_at DESC").all();
          return json(request, { coupons: result.results });
        }
        if (url.pathname === "/api/admin/orders" && request.method === "GET") {
          const result = await env.DB.prepare(`
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
          `).all();
          const orders = [];
          for (const row of result.results) {
            const items = await env.DB.prepare(`
              SELECT oi.id, oi.product_id AS productId, oi.product_name AS title,
                oi.price AS priceValue, oi.quantity AS qty, p.image_key AS imageKey,
                c.name AS category
              FROM order_items oi
              LEFT JOIN products p ON p.id = oi.product_id
              LEFT JOIN categories c ON c.id = p.category_id
              WHERE oi.order_id = ?1 ORDER BY oi.id ASC
            `).bind(row.id).all();
            orders.push(orderFromRow(row, items.results.map(adminOrderItemFromRow)));
          }
          return json(request, { orders });
        }
        if (url.pathname === "/api/admin/orders/status" && request.method === "PATCH") {
          const body = await parseBody(request);
          const orderId = String(body.orderId || "").trim();
          const status = String(body.status || "processing").trim();
          const trackingNumber = String(body.trackingNumber || "").trim();
          const allowedStatuses = ["created", "pending", "pending_payment", "processing", "shipped", "ready_for_pickup", "completed", "picked_up", "cancelled"];
          if (!orderId || !allowedStatuses.includes(status)) return json(request, { error: "\u8A02\u55AE\u72C0\u614B\u8CC7\u6599\u683C\u5F0F\u932F\u8AA4\u3002" }, 400);
          const existing = await env.DB.prepare("SELECT id FROM orders WHERE order_number = ?1 OR CAST(id AS TEXT) = ?1 LIMIT 1").bind(orderId).first();
          if (!existing) return json(request, { error: "\u627E\u4E0D\u5230\u8A02\u55AE\u3002" }, 404);
          await env.DB.prepare(`UPDATE orders SET status = ?1, tracking_number = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3`).bind(status, trackingNumber, existing.id).run();
          const row = await env.DB.prepare(`
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?1
          `).bind(existing.id).first();
          const items = await env.DB.prepare(`
            SELECT oi.id, oi.product_id AS productId, oi.product_name AS title,
              oi.price AS priceValue, oi.quantity AS qty, p.image_key AS imageKey,
              c.name AS category
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE oi.order_id = ?1 ORDER BY oi.id ASC
          `).bind(existing.id).all();
          return json(request, {
            order: row ? { ...orderFromRow(row, items.results.map(adminOrderItemFromRow)), shippingNotification: body.notify ? { status: "pending", recipient: row.customer_email || row.user_email || "" } : { status: "not_requested" } } : null
          });
        }
        if (url.pathname === "/api/admin/customers" && request.method === "GET") {
          const customerId = url.searchParams.get("id");
          if (customerId) {
            const row = await env.DB.prepare(`
              SELECT u.*, a.full_name AS address_name, a.phone AS address_phone, a.address, a.city, a.zip
              FROM users u LEFT JOIN user_addresses a ON a.id = (
                SELECT id FROM user_addresses WHERE user_id = u.id ORDER BY is_default DESC, id ASC LIMIT 1
              ) WHERE u.id = ?1
            `).bind(customerId).first();
            if (!row) return json(request, { error: "\u627E\u4E0D\u5230\u6703\u54E1\u3002" }, 404);
            const totals = await env.DB.prepare("SELECT COUNT(*) AS orderCount, COALESCE(SUM(total_amount), 0) AS totalSpent FROM orders WHERE user_id = ?1").bind(row.id).first();
            const orders = await env.DB.prepare("SELECT order_number AS id, total_amount AS total, status, created_at AS createdAt FROM orders WHERE user_id = ?1 ORDER BY created_at DESC").bind(row.id).all();
            return json(request, {
              customer: {
                id: row.id,
                name: row.name || "",
                email: row.email || "",
                phone: row.phone || "",
                address: row.address ? { fullName: row.address_name || row.name || "", phone: row.address_phone || row.phone || "", address: row.address, city: row.city || "", zip: row.zip || "" } : null,
                orderCount: Number(totals?.orderCount || 0),
                totalSpent: Number(totals?.totalSpent || 0)
              },
              orders: orders.results
            });
          }
          const result = await env.DB.prepare(`
            SELECT u.id, u.name, u.email, u.phone,
              a.full_name AS address_name, a.address, a.city, a.zip,
              COUNT(o.id) AS orderCount, COALESCE(SUM(o.total_amount), 0) AS totalSpent
            FROM users u
            LEFT JOIN user_addresses a ON a.id = (SELECT id FROM user_addresses WHERE user_id = u.id ORDER BY is_default DESC, id ASC LIMIT 1)
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id ORDER BY u.created_at DESC
          `).all();
          return json(request, { customers: result.results.map((row) => ({
            id: row.id,
            name: row.name || "",
            email: row.email || "",
            phone: row.phone || "",
            address: row.address ? { fullName: row.address_name || row.name || "", address: row.address, city: row.city || "", zip: row.zip || "" } : null,
            orderCount: Number(row.orderCount || 0),
            totalSpent: Number(row.totalSpent || 0)
          })) });
        }
        if (url.pathname === "/api/admin/engagement" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT id, record_type, payload_json, created_at, updated_at FROM engagement_records ORDER BY created_at DESC").all();
          const grouped = { reservations: [], messages: [], subscribers: [], searches: [] };
          const groupName = { reservation: "reservations", message: "messages", subscriber: "subscribers", search: "searches" };
          for (const row of result.results) {
            const group = groupName[String(row.record_type)] || "messages";
            grouped[group].push({ id: row.id, ...parseJson(String(row.payload_json || ""), {}), createdAt: row.created_at, updatedAt: row.updated_at });
          }
          return json(request, grouped);
        }
        if (url.pathname === "/api/admin/summary" && request.method === "GET") {
          const totals = await env.DB.prepare(`
            SELECT COUNT(*) AS orderCount,
              COALESCE(SUM(total_amount), 0) AS totalSales,
              COALESCE(SUM(CASE WHEN status IN ('completed', 'picked_up') THEN total_amount ELSE 0 END), 0) AS completedSales,
              COALESCE(SUM(CASE WHEN status NOT IN ('completed', 'picked_up', 'cancelled') THEN total_amount ELSE 0 END), 0) AS pendingSales,
              SUM(CASE WHEN status IN ('completed', 'picked_up') THEN 1 ELSE 0 END) AS completedOrderCount
            FROM orders
          `).first();
          const itemCount = await env.DB.prepare("SELECT COALESCE(SUM(quantity), 0) AS itemCount FROM order_items").first();
          const customerCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role IS NULL OR role != 'admin'").first();
          const customersWithOrders = await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS count FROM orders WHERE user_id IS NOT NULL").first();
          const pending = await env.DB.prepare("SELECT order_number, status, customer_name FROM orders WHERE status NOT IN ('completed', 'picked_up', 'cancelled') ORDER BY created_at DESC LIMIT 5").all();
          return json(request, {
            summary: {
              totalSales: Number(totals?.totalSales || 0),
              itemCount: Number(itemCount?.itemCount || 0),
              completedSales: Number(totals?.completedSales || 0),
              pendingSales: Number(totals?.pendingSales || 0),
              completedOrderCount: Number(totals?.completedOrderCount || 0),
              orderCount: Number(totals?.orderCount || 0),
              customerCount: Number(customerCount?.count || 0),
              customersWithOrders: Number(customersWithOrders?.count || 0)
            },
            notifications: pending.results.map((row) => ({ type: "order", title: `\u8A02\u55AE ${row.order_number} \u5F85\u8655\u7406`, status: row.status, customer: row.customer_name || "\u6703\u54E1" }))
          });
        }
      }
      if (url.pathname === "/api/cart" && request.method === "GET") {
        const guestId = getGuestId(request);
        return json(request, await cartSummary(env, guestId), 200, guestId);
      }
      if (url.pathname === "/api/cart/add" && request.method === "POST") {
        const body = await parseBody(request);
        const lookup = String(body.productId || body.title || "").trim();
        const product = await findProduct(env, lookup);
        if (!product) return json(request, { error: "\u627E\u4E0D\u5230\u6B64\u5546\u54C1\uFF0C\u8ACB\u91CD\u65B0\u6574\u7406\u5546\u54C1\u9801\u3002" }, 404);
        const guestId = getGuestId(request);
        const quantity = Math.min(99, Math.max(1, Number(body.qty || 1)));
        await env.DB.prepare(`
          INSERT INTO cart_items (guest_id, product_id, quantity)
          VALUES (?1, ?2, ?3)
          ON CONFLICT (guest_id, product_id)
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP
        `).bind(guestId, product.db_id, quantity).run();
        return json(request, await cartSummary(env, guestId), 200, guestId);
      }
      if (url.pathname === "/api/cart/item" && (request.method === "PATCH" || request.method === "DELETE")) {
        const body = await parseBody(request);
        const lookup = String(body.productId || "").trim();
        const product = await findProduct(env, lookup);
        if (!product) return json(request, { error: "\u8CFC\u7269\u8ECA\u5546\u54C1\u4E0D\u5B58\u5728\u3002" }, 404);
        const guestId = getGuestId(request);
        const quantity = Number(body.qty || 0);
        if (request.method === "DELETE" || quantity <= 0) {
          await env.DB.prepare("DELETE FROM cart_items WHERE guest_id = ?1 AND product_id = ?2").bind(guestId, product.db_id).run();
        } else {
          await env.DB.prepare("UPDATE cart_items SET quantity = ?1, updated_at = CURRENT_TIMESTAMP WHERE guest_id = ?2 AND product_id = ?3").bind(Math.min(99, quantity), guestId, product.db_id).run();
        }
        return json(request, await cartSummary(env, guestId), 200, guestId);
      }
      if (url.pathname === "/api/cart/quote" && request.method === "POST") {
        const body = await parseBody(request);
        const guestId = getGuestId(request);
        const cart = await cartSummary(env, guestId);
        const shippingMethod = String(body.shippingMethod || "pickup");
        const shippingFee = shippingMethod === "frozen" ? 240 : shippingMethod === "home" ? 120 : 0;
        return json(request, {
          ...cart,
          shippingMethod,
          shippingFee,
          total: Number((cart.subtotal + shippingFee).toFixed(2)),
          discount: 0
        }, 200, guestId);
      }
      if (url.pathname === "/api/register" && request.method === "POST") {
        const body = await parseBody(request);
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const name = String(body.name || email.split("@")[0] || "Customer").trim();
        const phone = String(body.phone || "").trim();
        if (!/^\S+@\S+\.\S+/.test(email) || password.length < 6) {
          return json(request, { error: "\u8ACB\u586B\u5BEB\u6709\u6548\u7684 Email \u8207\u5BC6\u78BC\u3002" }, 400);
        }
        const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1").bind(email).first();
        if (existing) return json(request, { error: "\u6B64 Email \u5DF2\u8A3B\u518A\u3002" }, 409);
        const credentials = await createPasswordHash(password);
        const inserted = await env.DB.prepare(`
          INSERT INTO users (name, email, phone, password_salt, password_hash)
          VALUES (?1, ?2, ?3, ?4, ?5)
        `).bind(name, email, phone, credentials.salt, credentials.hash).run();
        const userId = Number(inserted.meta.last_row_id);
        const sessionToken = randomToken();
        await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?1, ?2)").bind(sessionToken, userId).run();
        const user = await env.DB.prepare("SELECT id, name, email, phone, role, password_salt, password_hash FROM users WHERE id = ?1").bind(userId).first();
        return json(request, { user: user ? publicUser(user) : null }, 201, void 0, sessionToken);
      }
      if (url.pathname === "/api/login" && request.method === "POST") {
        const body = await parseBody(request);
        const login = String(body.login || body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const user = await env.DB.prepare(`
          SELECT id, name, email, phone, role, password_salt, password_hash
          FROM users
          WHERE lower(email) = ?1 OR lower(name) = ?1
          LIMIT 1
        `).bind(login).first();
        if (!user || !await verifyPassword(password, user)) {
          return json(request, { error: "\u5E33\u865F\u6216\u5BC6\u78BC\u932F\u8AA4\u3002" }, 401);
        }
        const sessionToken = randomToken();
        await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?1, ?2)").bind(sessionToken, user.id).run();
        return json(request, { user: publicUser(user) }, 200, void 0, sessionToken);
      }
      if (url.pathname === "/api/logout" && request.method === "POST") {
        const token = getCookie(request, SESSION_COOKIE);
        if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
        return json(request, { ok: true }, 200, void 0, "");
      }
      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "\u5C1A\u672A\u767B\u5165\u3002" }, 401);
        const address = await env.DB.prepare(`
          SELECT full_name AS fullName, phone, address, city, zip
          FROM user_addresses
          WHERE user_id = ?1
          ORDER BY is_default DESC, id ASC
          LIMIT 1
        `).bind(user.id).first();
        const orderCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE user_id = ?1").bind(user.id).first();
        return json(request, { user: publicUser(user), orderCount: Number(orderCount?.count || 0), address: address || null });
      }
      if (url.pathname === "/api/me" && request.method === "PUT") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "\u5C1A\u672A\u767B\u5165\u3002" }, 401);
        const body = await parseBody(request);
        const email = String(body.email || user.email || "").trim().toLowerCase();
        const name = String(body.name || user.name || "").trim();
        const phone = String(body.phone || "").trim();
        if (!email || !email.includes("@")) return json(request, { error: "\u8ACB\u586B\u5BEB\u6709\u6548\u7684 Email\u3002" }, 400);
        const duplicate = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?1 AND id != ?2 LIMIT 1").bind(email, user.id).first();
        if (duplicate) return json(request, { error: "\u6B64 Email \u5DF2\u88AB\u5176\u4ED6\u6703\u54E1\u4F7F\u7528\u3002" }, 409);
        let salt = user.password_salt;
        let hash = user.password_hash;
        if (body.password) {
          const credentials = await createPasswordHash(String(body.password));
          salt = credentials.salt;
          hash = credentials.hash;
        }
        await env.DB.prepare(`
          UPDATE users
          SET name = ?1, email = ?2, phone = ?3, password_salt = ?4, password_hash = ?5, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?6
        `).bind(name, email, phone, salt, hash, user.id).run();
        const updated = await env.DB.prepare("SELECT id, name, email, phone, role, password_salt, password_hash FROM users WHERE id = ?1").bind(user.id).first();
        return json(request, { user: updated ? publicUser(updated) : null });
      }
      if (url.pathname === "/api/address" && request.method === "PUT") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "\u8ACB\u5148\u767B\u5165\u3002" }, 401);
        const body = await parseBody(request);
        const values = [
          String(body.fullName || "").trim(),
          String(body.phone || "").trim(),
          String(body.address || "").trim(),
          String(body.city || "").trim(),
          String(body.zip || "").trim()
        ];
        const existing = await env.DB.prepare("SELECT id FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1").bind(user.id).first();
        if (existing) {
          await env.DB.prepare(`UPDATE user_addresses SET full_name = ?1, phone = ?2, address = ?3, city = ?4, zip = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6`).bind(...values, existing.id).run();
        } else {
          await env.DB.prepare(`INSERT INTO user_addresses (user_id, label, full_name, phone, address, city, zip) VALUES (?1, 'default', ?2, ?3, ?4, ?5, ?6)`).bind(user.id, ...values).run();
        }
        return json(request, { user: publicUser(user) });
      }
      if (url.pathname === "/api/orders" && request.method === "GET") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "\u8ACB\u5148\u767B\u5165\u3002" }, 401);
        const result = await env.DB.prepare(`
          SELECT order_number AS id, total_amount AS total, status, created_at AS createdAt,
                 shipping_method AS shippingMethod, fulfillment_date AS fulfillmentDate,
                 tracking_number AS trackingNumber, shipping_address AS shippingAddress,
                 customer_note AS customerNote
          FROM orders
          WHERE user_id = ?1
          ORDER BY created_at DESC
        `).bind(user.id).all();
        return json(request, { orders: result.results });
      }
      if (url.pathname === "/api/checkout" && request.method === "POST") {
        const body = await parseBody(request);
        const guestId = getGuestId(request);
        const sessionUser2 = await getSessionUser(env, request);
        const cart = await cartSummary(env, guestId);
        if (!cart.items.length) return json(request, { error: "\u8CFC\u7269\u8ECA\u662F\u7A7A\u7684\u3002" }, 400);
        const shippingMethod = String(body.shippingMethod || "pickup");
        if (!["pickup", "home", "frozen"].includes(shippingMethod)) {
          return json(request, { error: "\u7269\u6D41\u65B9\u5F0F\u7121\u6548\u3002" }, 400);
        }
        const fulfillmentDate = String(body.fulfillmentDate || "").trim();
        const requestedAddress = body.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress : {};
        const savedAddress = sessionUser2 ? await env.DB.prepare("SELECT full_name AS fullName, phone, address, city, zip FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1").bind(sessionUser2.id).first() : null;
        const shippingAddress = { ...savedAddress || {}, ...requestedAddress };
        const name = String(shippingAddress.fullName || sessionUser2?.name || body.name || "").trim();
        const email = String(body.email || sessionUser2?.email || "").trim().toLowerCase();
        const phone = String(shippingAddress.phone || sessionUser2?.phone || body.phone || "").trim();
        const address = String(shippingAddress.address || "").trim();
        if (!name || !email || !phone || !fulfillmentDate) {
          return json(request, { error: "\u8ACB\u586B\u5BEB\u59D3\u540D\u3001\u96FB\u5B50\u4FE1\u7BB1\u3001\u96FB\u8A71\u8207\u53D6\u8CA8\uFF0F\u914D\u9001\u65E5\u671F\u3002" }, 400);
        }
        if (shippingMethod !== "pickup" && (!address || !String(shippingAddress.city || "").trim() || !String(shippingAddress.zip || "").trim())) {
          return json(request, { error: "\u5B85\u914D\u8A02\u55AE\u8ACB\u586B\u5BEB\u5730\u5740\u3001\u7E23\u5E02\u8207\u90F5\u905E\u5340\u865F\u3002" }, 400);
        }
        const shippingFee = shippingMethod === "frozen" ? 240 : shippingMethod === "home" ? 120 : 0;
        const total = Number((cart.subtotal + shippingFee).toFixed(2));
        const orderNumber = `S${Date.now().toString(36).toUpperCase()}`;
        const addressJson = JSON.stringify({
          fullName: name,
          phone,
          address,
          city: String(shippingAddress.city || "").trim(),
          zip: String(shippingAddress.zip || "").trim()
        });
        await env.DB.prepare(`
          INSERT INTO orders (
            user_id, order_number, total_amount, status, customer_name, customer_email,
            customer_phone, shipping_method, shipping_address, fulfillment_date,
            customer_note, shipping_fee, discount_amount
          ) VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0)
        `).bind(
          sessionUser2?.id || null,
          orderNumber,
          total,
          name,
          email,
          phone,
          shippingMethod,
          addressJson,
          fulfillmentDate,
          String(body.customerNote || "").trim(),
          shippingFee
        ).run();
        const order = await env.DB.prepare("SELECT id, order_number, total_amount, status, created_at FROM orders WHERE order_number = ?1").bind(orderNumber).first();
        for (const item of cart.items) {
          const product = await findProduct(env, item.id);
          await env.DB.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
            VALUES (?1, ?2, ?3, ?4, ?5)
          `).bind(order?.id, product?.db_id || null, item.title, item.priceValue, item.qty).run();
        }
        if (sessionUser2) {
          await env.DB.prepare(`
            UPDATE users SET name = ?1, phone = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3
          `).bind(name, phone, sessionUser2.id).run();
          const city = String(shippingAddress.city || "").trim();
          const zip = String(shippingAddress.zip || "").trim();
          if (address || city || zip) {
            const existingAddress = await env.DB.prepare(`
              SELECT id FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1
            `).bind(sessionUser2.id).first();
            if (existingAddress) {
              await env.DB.prepare(`
                UPDATE user_addresses
                SET full_name = ?1, phone = ?2, address = ?3, city = ?4, zip = ?5, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?6
              `).bind(name, phone, address, city, zip, existingAddress.id).run();
            } else {
              await env.DB.prepare(`
                INSERT INTO user_addresses (user_id, label, full_name, phone, address, city, zip)
                VALUES (?1, 'default', ?2, ?3, ?4, ?5, ?6)
              `).bind(sessionUser2.id, name, phone, address, city, zip).run();
            }
          }
        }
        await env.DB.prepare("DELETE FROM cart_items WHERE guest_id = ?1").bind(guestId).run();
        return json(request, {
          order: { ...order, id: orderNumber, total },
          email: { status: "pending", recipient: email }
        }, 201, guestId);
      }
      if (url.pathname.startsWith("/images/") && request.method === "GET") {
        return imageResponse(request, env);
      }
      const articlePathMatch = url.pathname.match(/^\/latest-news\/article\/([^/]+)\/?$/);
      if (articlePathMatch && request.method === "GET") {
        const articleKey = decodeURIComponent(articlePathMatch[1] || "").trim();
        const templateResponse = await env.ASSETS.fetch(new Request(`${url.origin}/latest-news/article/`, request));
        const template = await templateResponse.text();
        const row = articleKey ? await env.DB.prepare(`
              SELECT * FROM news
              WHERE is_published = 1 AND (id = ?1 OR slug = ?1)
                AND (publish_at IS NULL OR datetime(replace(publish_at, 'T', ' ')) <= CURRENT_TIMESTAMP)
              LIMIT 1
            `).bind(articleKey).first() : null;
        if (!row) {
          const missing = template.replace('<p class="latest-news-article-status" data-article-status role="status">\u8F09\u5165\u6587\u7AE0\u4E2D\u2026</p>', '<p class="latest-news-article-status is-error" data-article-status role="status">\u627E\u4E0D\u5230\u9019\u5247\u6700\u65B0\u6D88\u606F\uFF0C\u53EF\u80FD\u5DF2\u4E0B\u67B6\u6216\u4E0D\u5B58\u5728\u3002</p>').replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex, nofollow">');
          return new Response(missing, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" } });
        }
        const articleSlug = String(row.slug || "").trim();
        if (articleSlug && articleKey !== articleSlug) {
          return Response.redirect(`${url.origin}/latest-news/article/${encodeURIComponent(articleSlug)}/`, 301);
        }
        return new Response(renderNewsArticlePage(template, row), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" }
        });
      }
      if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
        return json(request, { error: "\u627E\u4E0D\u5230 API \u8DEF\u5F91\u3002" }, 404);
      }
      const assetRequest = url.pathname.startsWith("/admin/") ? new Request(`${request.url}${request.url.includes("?") ? "&" : "?"}sensen_admin_asset=20260826-2`, request) : request;
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      if (assetResponse.status === 404) {
        return json(request, { error: "\u627E\u4E0D\u5230 API \u8DEF\u5F91\u3002" }, 404);
      }
      if (/^\/(?:admin|customer|cart|checkout|orders)(?:\/|$)/i.test(url.pathname)) {
        const headers = new Headers(assetResponse.headers);
        headers.set("X-Robots-Tag", "noindex, nofollow");
        return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
      }
      return assetResponse;
    } catch (error) {
      const requestId = crypto.randomUUID();
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Worker request failed", { requestId, method: request.method, path: url.pathname, detail });
      const message = /no such table|no such column/i.test(detail) ? "\u6703\u54E1\u8CC7\u6599\u5EAB\u5C1A\u672A\u5B8C\u6210\u521D\u59CB\u5316\uFF0C\u8ACB\u5148\u57F7\u884C D1 migration\u3002" : "\u670D\u52D9\u66AB\u6642\u7121\u6CD5\u8655\u7406\u8ACB\u6C42\u3002";
      return json(request, { error: message, requestId }, 500);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
