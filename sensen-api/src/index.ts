const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const GUEST_COOKIE = "sensen_guest";
const SESSION_COOKIE = "sensen_session";

type ProductRow = {
  db_id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  image_key: string | null;
  is_active: number;
  category: string | null;
  metadata_json: string | null;
};

type StoreProduct = {
  id: string;
  title: string;
  cat: string;
  price: string;
  priceValue: number;
  quantity: number;
  day: string;
  img: string;
  desc: string;
  published: boolean;
};

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  password_salt: string | null;
  password_hash: string | null;
};

const getGuestId = (request: Request) => {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)sensen_guest=([^;]+)/);
  return match?.[1] || crypto.randomUUID();
};

const responseHeaders = (request: Request, extra: Record<string, string> = {}) => {
  const origin = request.headers.get("Origin");
  return {
    "Content-Type": JSON_CONTENT_TYPE,
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    ...extra,
  };
};

const json = (request: Request, body: unknown, status = 200, guestId?: string, sessionToken?: string) => {
  const headers = new Headers(responseHeaders(request));
  const secureCookie = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  if (guestId) {
    headers.append("Set-Cookie", `${GUEST_COOKIE}=${encodeURIComponent(guestId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secureCookie}`);
  }
  if (sessionToken !== undefined) {
    const cookie = sessionToken
      ? `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${secureCookie}`
      : `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureCookie}`;
    headers.append("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(body), { status, headers });
};

const parseBody = async (request: Request) => {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    return {};
  }
};

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] || "";
};

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

const randomToken = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

const derivePasswordHash = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-512" },
    key,
    512,
  );
  return bytesToHex(new Uint8Array(bits));
};

const createPasswordHash = async (password: string) => {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await derivePasswordHash(password, salt) };
};

const verifyPassword = async (password: string, user: UserRow) => {
  if (!user.password_salt || !user.password_hash) return false;
  try {
    return (await derivePasswordHash(password, user.password_salt)) === user.password_hash;
  } catch {
    return false;
  }
};

const getSessionUser = async (env: Env, request: Request) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.password_salt, u.password_hash
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token = ?1
  `).bind(token).first<UserRow>();
};

const publicUser = (user: UserRow) => ({
  id: user.id,
  name: user.name || "會員",
  email: user.email || "",
  phone: user.phone || "",
  role: user.role || "customer",
  isAdmin: user.role === "admin",
});

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};

const slugify = (value: string) => {
  const slug = value.trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `product-${Date.now()}`;
};

const shippingLabel = (method: string | null | undefined) => ({
  pickup: "門市自取",
  home: "宅配",
  frozen: "冷凍宅配",
}[String(method || "pickup")] || "門市自取");

const archivedNewsImages: Record<string, string> = {
  "/wp-content/uploads/2025/07/1-scaled.jpg": "/assets/images/photo-1-8.jpg",
  "/wp-content/uploads/2025/07/2-1528x1080.jpg": "/assets/images/photo-2-3.jpg",
  "/wp-content/uploads/2025/07/3-1528x1080.jpg": "/assets/images/photo-3-3.jpg",
  "/wp-content/uploads/2025/07/4-1528x1080.jpg": "/assets/images/photo-4-2.jpg",
};

const publicNewsImageUrl = (value: unknown) => {
  const image = String(value || "").trim();
  if (!image) return "";
  try {
    const source = new URL(image);
    if (source.hostname === "www.sensen.com.tw" && source.pathname.startsWith("/wp-content/uploads/")) {
      if (archivedNewsImages[source.pathname]) return archivedNewsImages[source.pathname];
      return `/images/legacy-news?url=${encodeURIComponent(source.href)}`;
    }
  } catch {
    // Relative image paths are returned unchanged.
  }
  return image;
};

const newsFromRow = (row: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  category: row.category || "latest-news",
  excerpt: row.excerpt || "",
  content: row.content || "",
  image: publicNewsImageUrl(row.image_key),
  layout: parseJson<Record<string, unknown>[] | null>(String(row.layout_json || ""), null)?.map(block => ({
    ...block,
    ...(block.type === "image" ? { src: publicNewsImageUrl(block.src) } : {}),
    ...(block.type === "gallery" && Array.isArray(block.images) ? { images: block.images.map(publicNewsImageUrl) } : {}),
  })) ?? null,
  publishAt: row.publish_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: Number(row.is_published) === 1 ? "published" : "draft",
});

const SITE_ORIGIN = "https://www.sensen.com.tw";
const RETIRED_CONTENT_PATHS = new Set([
  "/author/admin", "/slide-types/index-slider",
  "/產品介紹/page/2", "/產品介紹/page/3", "/產品介紹/生日蛋糕-下方有dm供下載-264/page/2",
  "/latest-news/²⁰²¹-𝐅𝐚𝐭𝐡𝐞𝐫𝐬-𝐃𝐚𝐲✨-2", "/latest-news/父親節蛋糕預購開跑囉-2",
  "/latest-news/吉祥桂圓糕-2", "/latest-news/肉鬆餅-2", "/latest-news/彌月試吃品項-2",
  "/new-arrival/多佳米拉-2", "/new-arrival/芒果奶露麵包-2", "/new-arrival/草莓甜心-2",
  "/latest-news/📣澄和店週年慶📣", "/latest-news/2019頂家彌月目錄", "/latest-news/2021母親節蛋糕",
  "/latest-news/2022中秋dm", "/latest-news/2023中秋dm", "/latest-news/2023母親節蛋糕",
  "/latest-news/2024母親節蛋糕", "/latest-news/2024新春禮盒", "/latest-news/88節蛋糕預購開跑",
  "/latest-news/中秋dm出爐囉", "/latest-news/今年的森森芒果季開始囉-3", "/latest-news/文龍年中慶",
  "/latest-news/文龍初秋賞", "/latest-news/生日蛋糕卷", "/latest-news/肉鬆餅禮盒", "/latest-news/芋見幸福",
  "/latest-news/波蘿蛋黃酥-2", "/latest-news/春節禮盒預購開跑囉", "/latest-news/草莓大福禮盒",
  "/latest-news/頂家彌月🔥人氣波士頓派🔥", "/latest-news/森森吐司", "/latest-news/新富店開幕慶",
  "/latest-news/澄和店優惠", "/latest-news/餐盒", "/latest-news/餐盒menu", "/latest-news/歡慶新富店開幕",
  "/latest-news/bebuilder-1930", "/new-arrival/布丁燒", "/new-arrival/栗子蒙布朗-mont-blanc",
  "/new-arrival/森森蝴蝶酥", "/new-arrival/新品上市", "/new-arrival/新品上市-2", "/new-arrival/蝴蝶酥",
  "/new-arrival/優荔-lichi", "/new-arrival/new-杏仁千層酥-new",
  // 90 orphaned latest-news pages and 22 orphaned new-arrival pages.
  "/latest-news/【2019moon-cake】",
  "/latest-news/🍍🍍🍍鳳梨來了🍍🍍🍍",
  "/latest-news/🍓🍓🍓黃金草莓捲🍓🍓🍓",
  "/latest-news/🍓草莓蛋糕罐子🍓",
  "/latest-news/🍹森森全新飲品上市🍹",
  "/latest-news/🎀2019母親節蛋糕🎀預購開跑囉",
  "/latest-news/🎉春節伴手禮系列🎉",
  "/latest-news/💐明天就是母親節了💐",
  "/latest-news/100元生日蛋糕抵用卷",
  "/latest-news/11月份的好康大放送將於10號開始舉行囉",
  "/latest-news/11月份的好康大放送熱烈進行中",
  "/latest-news/1460",
  "/latest-news/1489",
  "/latest-news/1522",
  "/latest-news/1577",
  "/latest-news/2019中秋目錄即將出爐",
  "/latest-news/2019母親節蛋糕預告",
  "/latest-news/2019頂家彌月新目錄",
  "/latest-news/2019聖誕新品",
  "/latest-news/2020中秋禮盒",
  "/latest-news/2020父親節",
  "/latest-news/2020母親節蛋糕",
  "/latest-news/²⁰²¹-𝐅𝐚𝐭𝐡𝐞𝐫𝐬-𝐃𝐚𝐲✨",
  "/latest-news/2021中秋dm",
  "/latest-news/2021父親節蛋糕",
  "/latest-news/2022母親節蛋糕",
  "/latest-news/2022新春禮盒",
  "/latest-news/88節快樂",
  "/latest-news/土鳳梨酥禮盒",
  "/latest-news/中秋月圓",
  "/latest-news/中秋預購開跑",
  "/latest-news/丹麥波羅",
  "/latest-news/五倍券優惠",
  "/latest-news/文龍周年慶",
  "/latest-news/文龍週年慶",
  "/latest-news/文龍感恩季",
  "/latest-news/父愛",
  "/latest-news/父親節蛋糕預購",
  "/latest-news/父親節蛋糕預購開跑囉",
  "/latest-news/布丁燒禮盒",
  "/latest-news/生吐司",
  "/latest-news/仲夏88折",
  "/latest-news/吉祥桂圓糕",
  "/latest-news/肉鬆餅",
  "/latest-news/初夏賞",
  "/latest-news/芋頭蛋糕罐",
  "/latest-news/咖啡買一送一",
  "/latest-news/果乾塔",
  "/latest-news/法式經典檸檬塔",
  "/latest-news/法式蝴蝶酥",
  "/latest-news/波蘿蛋黃酥",
  "/latest-news/春節日式大福禮盒",
  "/latest-news/春節限定-如意發糕",
  "/latest-news/春節禮盒-買10送1",
  "/latest-news/活力陽光三明治",
  "/latest-news/重要公告",
  "/latest-news/振興券專屬優惠",
  "/latest-news/桂圓糕",
  "/latest-news/㊙情人節限定㊙",
  "/latest-news/草莓芙蓮蛋糕盒-2",
  "/latest-news/草莓芙蓮蛋糕盒-3",
  "/latest-news/草莓蛋糕盒開賣",
  "/latest-news/草莓蛋糕盒熱銷中🔥🔥🔥",
  "/latest-news/草莓藏心－季節限定",
  "/latest-news/頂家彌月油飯",
  "/latest-news/頂家彌月試吃",
  "/latest-news/森森日式烤年糕",
  "/latest-news/森森春節伴手禮預購中",
  "/latest-news/森森特調",
  "/latest-news/森森草莓季",
  "/latest-news/森森感恩季part2",
  "/latest-news/森森vip集點卡",
  "/latest-news/週三新富優惠日",
  "/latest-news/陽光三明治",
  "/latest-news/新春禮盒",
  "/latest-news/新富仲夏賞",
  "/latest-news/預購活動",
  "/latest-news/實聯制登記",
  "/latest-news/瑪格麗特",
  "/latest-news/維也納麵包",
  "/latest-news/聚財金元寶",
  "/latest-news/慶新年",
  "/latest-news/摩登媽咪",
  "/latest-news/摯愛森林",
  "/latest-news/澄和初夏賞",
  "/latest-news/澄和感恩季",
  "/latest-news/澄和慶新年",
  "/latest-news/蝴蝶酥宅配訂購",
  "/latest-news/彌月試吃品項",
  "/latest-news/職人手感",
  "/new-arrival/🍫義式巧克🍫",
  "/new-arrival/🎉蛋糕罐子-新發售🎉",
  "/new-arrival/3吋草莓塔",
  "/new-arrival/日式烤年糕",
  "/new-arrival/白葡萄",
  "/new-arrival/多佳米拉",
  "/new-arrival/芒果仙境",
  "/new-arrival/芒果奶酪",
  "/new-arrival/芒果奶露麵包",
  "/new-arrival/芒果季即將開始囉",
  "/new-arrival/芒果蛋糕盒",
  "/new-arrival/芒果輕乳酪",
  "/new-arrival/芒果慕斯",
  "/new-arrival/法式核桃",
  "/new-arrival/洛神花小吐司",
  "/new-arrival/香芒泡芙",
  "/new-arrival/草莓甜心",
  "/new-arrival/新品上市✨肉鬆球✨",
  "/new-arrival/新品上市✨蔥酥熱狗✨",
  "/new-arrival/聖誕草莓泡芙",
  "/new-arrival/葡萄圓舞曲",
  "/new-arrival/戀戀草莓季",
]);
const escapeMarkup = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] || character));
const newsImageUrl = (value: unknown) => {
  const image = publicNewsImageUrl(value);
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${SITE_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
};
const newsDate = (value: unknown) => {
  const raw = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.replace(/-/g, ".") : "";
};
const newsCopyHtml = (value: unknown) => {
  const imagePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;
  return String(value || "").split(/\r?\n/).filter(line => !imagePattern.test(line.trim())).map(escapeMarkup).join("<br>");
};
const renderNewsArticleShell = (row: Record<string, unknown>) => {
  const title = String(row.title || "最新消息");
  const copy = newsCopyHtml(row.content || row.excerpt || "目前沒有文章內容。");
  const date = newsDate(row.publish_at || row.created_at);
  const layout = parseJson<Record<string, unknown>[] | null>(String(row.layout_json || ""), null);
  if (layout?.length) {
    const blocks = layout.filter(block => ["date", "title", "copy", "image", "gallery", "text"].includes(String(block.type || "")));
    const blockHtml = (block: Record<string, unknown>) => {
      if (block.type === "date") return `<p class="latest-news-layout-date"><span aria-hidden="true">◷</span>${escapeMarkup(date)}</p>`;
      if (block.type === "title") return `<h1 class="latest-news-layout-title">${escapeMarkup(title)}</h1>`;
      if (block.type === "copy") return `<div class="latest-news-layout-copy">${copy}</div>`;
      if (block.type === "text") return `<div class="latest-news-layout-copy">${escapeMarkup(block.value).replace(/\r?\n/g, "<br>")}</div>`;
      if (block.type === "image") return `<img class="latest-news-layout-image" src="${escapeMarkup(newsImageUrl(block.src))}" alt="${escapeMarkup(title)}－內文圖片" loading="lazy">`;
      const images = Array.isArray(block.images) ? block.images : [];
      return `<div class="latest-news-layout-gallery">${images.map(image => `<img class="latest-news-layout-image" src="${escapeMarkup(newsImageUrl(image))}" alt="${escapeMarkup(title)}－內文圖片" loading="lazy">`).join("")}</div>`;
    };
    return `<div class="latest-news-article-shell is-free-layout">${blocks.map(block => {
      const markup = blockHtml(block);
      const link = /^(https?:\/\/|\/)/i.test(String(block.link || "").trim()) ? String(block.link).trim() : "";
      return `<section class="latest-news-layout-block span-${Number(block.span) === 6 ? "6" : "12"}">${link ? `<a class="latest-news-layout-link" href="${escapeMarkup(link)}">${markup}</a>` : markup}</section>`;
    }).join("")}</div>`;
  }
  const imagePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;
  const images = String(row.content || "").split(/\r?\n/).map(line => line.trim()).filter(line => imagePattern.test(line));
  return `<div class="latest-news-article-shell"><header class="latest-news-article-header"><p class="latest-news-card-date"><span aria-hidden="true">◷</span>${escapeMarkup(date)}</p><h1 id="latest-news-article-title">${escapeMarkup(title)}</h1></header><div class="latest-news-article-image"${images.length ? "" : " hidden"}>${images.map((image, index) => `<img src="${escapeMarkup(newsImageUrl(image))}" alt="${escapeMarkup(title)}－內文圖片 ${index + 1}" loading="lazy">`).join("")}</div><div class="latest-news-article-copy"><div class="latest-news-article-content">${copy}</div></div></div>`;
};

const renderNewsArticlePage = (template: string, row: Record<string, unknown>) => {
  const title = String(row.title || "最新消息");
  const description = String(row.excerpt || newsCopyHtml(row.content).replace(/<br>/g, " ") || title).replace(/\s+/g, " ").trim().slice(0, 155);
  const articleKey = String(row.slug || row.id || "");
  const canonical = `${SITE_ORIGIN}/latest-news/article/${encodeURIComponent(articleKey)}/`;
  const image = newsImageUrl(row.image_key);
  const seo = `<title>${escapeMarkup(title)} – 森森點心坊</title>\n  <meta name="description" content="${escapeMarkup(description)}">\n  <link rel="canonical" href="${escapeMarkup(canonical)}">\n  <meta name="robots" content="index, follow">\n  <meta property="og:locale" content="zh_TW">\n  <meta property="og:type" content="article">\n  <meta property="og:site_name" content="森森點心坊">\n  <meta property="og:title" content="${escapeMarkup(title)}">\n  <meta property="og:description" content="${escapeMarkup(description)}">\n  <meta property="og:url" content="${escapeMarkup(canonical)}">${image ? `\n  <meta property="og:image" content="${escapeMarkup(image)}">` : ""}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>[\s\S]*?<meta property="og:url"[^>]*>/i, seo)
    .replace('data-latest-news-article-page', 'data-latest-news-article-page data-article-hydrated="true"')
    .replace(/<!-- NEWS_ARTICLE_SHELL_START -->[\s\S]*?<!-- NEWS_ARTICLE_SHELL_END -->/, `<!-- NEWS_ARTICLE_SHELL_START -->${renderNewsArticleShell(row)}<!-- NEWS_ARTICLE_SHELL_END -->`);
};

const adminProductFromRow = (row: ProductRow) => {
  const product = productFromRow(row);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json, {});
  return {
    ...product,
    sku: String(metadata.sku || product.id),
    spec: String(metadata.spec || ""),
    day: String(metadata.day || 5),
    img: String(metadata.img || product.img),
  };
};

const orderFromRow = (row: Record<string, unknown>, items: Record<string, unknown>[]) => {
  const total = Number(row.total_amount || 0);
  const shippingFee = Number(row.shipping_fee || 0);
  const discount = Number(row.discount_amount || 0);
  const shippingAddress = parseJson<Record<string, unknown> | null>(String(row.shipping_address || ""), null);
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
      name: row.customer_name || row.user_name || "會員",
      email: row.customer_email || row.user_email || "",
      phone: row.customer_phone || row.user_phone || "",
    },
    items,
  };
};

const productFromRow = (row: ProductRow): StoreProduct => {
  let metadata: Record<string, unknown> = {};
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
    cat: row.category || String(metadata.cat || "未分類"),
    price: `$${priceValue.toFixed(2)}`,
    priceValue,
    quantity: Math.max(0, Number(row.stock || 0)),
    day: String(metadata.day || 5),
    img: imageKey ? `/assets/images/${imageKey}` : "",
    desc: row.description || String(metadata.desc || ""),
    published: row.is_active === 1,
  };
};

const imagePathFromKey = (value: unknown) => {
  const key = String(value || "").trim().replace(/^\/?(?:assets\/)?images\//i, "");
  return key ? `/assets/images/${key}` : "";
};

const adminOrderItemFromRow = (item: Record<string, unknown>) => ({
  ...item,
  cat: String(item.category || "Menu"),
  price: `$${Number(item.priceValue || 0).toFixed(2)}`,
  img: imagePathFromKey(item.imageKey),
});

const productSelect = `
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

const findProduct = async (env: Env, value: string) => {
  if (!value) return null;
  const row = await env.DB.prepare(`${productSelect}
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND (p.slug = ?1 OR p.name = ?1)
    LIMIT 1`).bind(value).first<ProductRow>();
  return row || null;
};

const cartSummary = async (env: Env, guestId: string) => {
  const result = await env.DB.prepare(`${productSelect}
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN cart_items ci ON ci.product_id = p.id
    WHERE ci.guest_id = ?1 AND p.is_active = 1
    ORDER BY ci.created_at ASC`).bind(guestId).all<ProductRow & { quantity: number }>();
  const items = result.results.map((row) => ({
    ...productFromRow(row),
    qty: Math.max(1, Number(row.quantity || 1)),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
  const leadDays = items.reduce((max, item) => Math.max(max, Number(item.day || 5)), 0);
  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    total: Number(subtotal.toFixed(2)),
    leadDays,
  };
};

const imageResponse = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const requestedKey = url.pathname.slice("/images/".length);
  if (!requestedKey || requestedKey.split("/").includes("..")) {
    return json(request, { error: "圖片路徑無效。" }, 400);
  }

  if (requestedKey === "legacy-news") {
    let source: URL;
    try {
      source = new URL(url.searchParams.get("url") || "");
    } catch {
      return json(request, { error: "舊站圖片網址無效。" }, 400);
    }
    if (source.protocol !== "https:"
      || source.hostname !== "www.sensen.com.tw"
      || !source.pathname.startsWith("/wp-content/uploads/")) {
      return json(request, { error: "不允許代理此圖片來源。" }, 403);
    }

    const archived = archivedNewsImages[source.pathname];
    if (archived && env.ASSETS) {
      return env.ASSETS.fetch(new Request(new URL(archived, request.url), { method: request.method }));
    }
    const upstream = await fetch(source.href, { headers: { Accept: "image/*" } });
    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !contentType.startsWith("image/")) {
      return json(request, { error: "無法載入舊站圖片。" }, 404);
    }
    const headers = new Headers({
      "content-type": contentType,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("content-length", contentLength);
    return new Response(upstream.body, { headers });
  }

  const object = await env.BUCKET.get("images/" + requestedKey);
  if (!object) return json(request, { error: "找不到圖片。" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: responseHeaders(request) });
    }

    try {
      const decodedPathname = decodeURI(url.pathname);
      const normalizedPathname = decodedPathname.replace(/\/+$/, "") || "/";
      if ((request.method === "GET" || request.method === "HEAD") && RETIRED_CONTENT_PATHS.has(normalizedPathname)) {
        return new Response("此內容已永久移除。", {
          status: 410,
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
        });
      }
      if ((request.method === "GET" || request.method === "HEAD") && decodedPathname.replace(/\/+$/, "") === "/product-item/法式蝶蝨酥-1657") {
        return Response.redirect(`${url.origin}/product-item/${encodeURIComponent("法式蝴蝶酥-1657")}/`, 301);
      }
      if ((request.method === "GET" || request.method === "HEAD") && decodedPathname.replace(/\/+$/, "") === "/隱私權條件") {
        return Response.redirect(`${url.origin}/${encodeURIComponent("隱私權條款")}/`, 301);
      }

      if ((request.method === "GET" || request.method === "HEAD") && /^\/latest-news\/article\/?$/.test(url.pathname) && url.searchParams.get("id")) {
        return Response.redirect(`${url.origin}/latest-news/article/${encodeURIComponent(url.searchParams.get("id") || "")}/`, 301);
      }

      if ((request.method === "GET" || request.method === "HEAD")
        && !url.pathname.endsWith("/")
        && !url.pathname.startsWith("/api/")
        && !url.pathname.startsWith("/images/")
        && url.pathname !== "/health"
        && !/\/[^/]+\.[a-z0-9]+$/i.test(url.pathname)) {
        return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
      }

      if (url.pathname === "/health" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
        return json(request, { ok: result?.ok === 1, database: "connected" });
      }

      if (url.pathname === "/api/products" && request.method === "GET") {
        const result = await env.DB.prepare(`${productSelect}
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = 1 ORDER BY p.id DESC`).all<ProductRow>();
        return json(request, { products: result.results.map(productFromRow) });
      }

      if (url.pathname === "/api/news" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const result = id
          ? await env.DB.prepare(`SELECT * FROM news WHERE is_published = 1 AND (id = ?1 OR slug = ?1) LIMIT 1`).bind(id).all<Record<string, unknown>>()
          : await env.DB.prepare(`SELECT * FROM news WHERE is_published = 1 AND (publish_at IS NULL OR datetime(replace(publish_at, 'T', ' ')) <= CURRENT_TIMESTAMP) ORDER BY COALESCE(publish_at, created_at) DESC`).all<Record<string, unknown>>();
        return json(request, { news: result.results.map(newsFromRow) });
      }

      if (url.pathname === "/api/coupons" && request.method === "GET") {
        const result = await env.DB.prepare(`SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons WHERE enabled = 1 ORDER BY updated_at DESC`).all<Record<string, unknown>>();
        return json(request, { coupons: result.results });
      }

      if (url.pathname === "/api/contact" && request.method === "POST") {
        const body = await parseBody(request);
        const name = String(body.name || "").trim();
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim();
        const subject = String(body.subject || "外燴詢價").trim();
        const message = String(body.message || body.requests || "").trim();
        if (!name || !email || !message) return json(request, { error: "請填寫姓名、Email 與需求內容。" }, 400);
        await env.DB.prepare(`
          INSERT INTO engagement_records (record_type, payload_json)
          VALUES ('message', ?1)
        `).bind(JSON.stringify({ name, email, phone, subject, message })).run();
        return json(request, { message: "訊息已送出，我們會盡快與您聯絡。", record: { name, email, phone, subject, message }, ok: true }, 201);
      }

      if (url.pathname === "/api/reservations" && request.method === "POST") {
        const body = await parseBody(request);
        const name = String(body.name || "").trim();
        const phone = String(body.phone || "").trim();
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const date = String(body.date || "").trim();
        const time = String(body.time || "").trim();
        if (!name || !phone || !email || !date || !time) return json(request, { error: "請填寫完整的預約資料。" }, 400);
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('reservation', ?1)")
          .bind(JSON.stringify({ name, phone, email, guests: body.guests || "", date, time, requests: String(body.requests || body.specialRequests || "").trim() })).run();
        return json(request, { reservation: { name, phone, email, guests: body.guests || "", date, time, requests: String(body.requests || body.specialRequests || "").trim() }, ok: true }, 201);
      }

      if (url.pathname === "/api/newsletter" && request.method === "POST") {
        const body = await parseBody(request);
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        if (!email || !email.includes("@")) return json(request, { error: "請填寫有效的 Email。" }, 400);
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('subscriber', ?1)")
          .bind(JSON.stringify({ email, status: "active" })).run();
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
          ORDER BY p.id DESC LIMIT 50`).bind(like).all<ProductRow>();
        await env.DB.prepare("INSERT INTO engagement_records (record_type, payload_json) VALUES ('search', ?1)")
          .bind(JSON.stringify({ query, resultCount: result.results.length })).run();
        return json(request, { query, products: result.results.map(productFromRow) });
      }

      if (url.pathname.startsWith("/api/admin/")) {
        const admin = await getSessionUser(env, request);
        if (!admin || admin.role !== "admin") {
          return json(request, { error: "需要管理員權限。" }, 403);
        }

        if (url.pathname === "/api/admin/images" && request.method === "POST") {
          const form = await request.formData();
          const file = form.get("image");
          if (!(file instanceof File) || file.size === 0) {
            return json(request, { error: "請選擇圖片檔案。" }, 400);
          }
          const extensions: Record<string, string> = {
            "image/avif": "avif",
            "image/gif": "gif",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
          };
          const extension = extensions[file.type];
          if (!extension) return json(request, { error: "僅支援 JPG、PNG、WebP、GIF 或 AVIF 圖片。" }, 415);
          if (file.size > 8 * 1024 * 1024) return json(request, { error: "圖片不可超過 8 MB。" }, 413);

          const key = `news/${Date.now()}-${crypto.randomUUID()}.${extension}`;
          await env.BUCKET.put(`images/${key}`, file.stream(), {
            httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
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
          `).all<{ id: number; name: string; slug: string }>();
          return json(request, { categories: result.results });
        }

        if (url.pathname === "/api/admin/products" && request.method === "GET") {
          const result = await env.DB.prepare(`${productSelect}
            LEFT JOIN categories c ON c.id = p.category_id
            ORDER BY p.id DESC`).all<ProductRow>();
          return json(request, { products: result.results.map(adminProductFromRow) });
        }

        if (url.pathname === "/api/admin/products" && (request.method === "POST" || request.method === "PATCH")) {
          const body = await parseBody(request);
          const lookup = String(body.id || "").trim();
          const existing = request.method === "PATCH"
            ? await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ?1 OR CAST(p.id AS TEXT) = ?1 LIMIT 1`).bind(lookup).first<ProductRow>()
            : null;
          if (request.method === "PATCH" && !existing) return json(request, { error: "找不到商品。" }, 404);
          const existingMetadata = parseJson<Record<string, unknown>>(existing?.metadata_json, {});
          const title = String(body.title ?? existing?.title ?? "").trim();
          const categoryName = String(body.cat ?? existing?.category ?? "未分類").trim();
          const price = Math.max(0, Math.round(Number(body.priceValue ?? body.price ?? existing?.price ?? 0)));
          const stock = Math.max(0, Math.round(Number(body.quantity ?? existing?.stock ?? 0)));
          const published = body.published !== undefined ? body.published !== false : existing?.is_active === 1;
          if (!title) return json(request, { error: "商品名稱不可為空白。" }, 400);
          if (!Number.isFinite(price) || !Number.isFinite(stock)) return json(request, { error: "售價或庫存格式錯誤。" }, 400);

          let category = await env.DB.prepare("SELECT id FROM categories WHERE name = ?1 OR slug = ?1 LIMIT 1").bind(categoryName).first<{ id: number }>();
          if (!category) {
            const insertedCategory = await env.DB.prepare("INSERT INTO categories (name, slug) VALUES (?1, ?2)").bind(categoryName, slugify(categoryName)).run();
            category = { id: Number(insertedCategory.meta.last_row_id) };
          }
          const imageValue = String(body.img ?? existingMetadata.img ?? existing?.image_key ?? "").trim();
          const imageKey = imageValue
            .replace(/^\/?assets\/images\//, "")
            .replace(/^\/?images\//, "");
          const metadata = JSON.stringify({
            sku: String(body.sku ?? existingMetadata.sku ?? "").trim(),
            spec: String(body.spec ?? existingMetadata.spec ?? "").trim(),
            day: String(body.day ?? existingMetadata.day ?? "5").trim(),
            img: imageValue,
          });

          if (request.method === "POST") {
            let slug = slugify(title);
            const duplicate = await env.DB.prepare("SELECT id FROM products WHERE slug = ?1 OR name = ?2 LIMIT 1").bind(slug, title).first<{ id: number }>();
            if (duplicate) slug = `${slug}-${Date.now().toString(36)}`;
            const result = await env.DB.prepare(`
              INSERT INTO products (category_id, name, slug, description, price, stock, image_key, is_active, metadata_json)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            `).bind(category.id, title, slug, String(body.desc || "").trim(), price, stock, imageKey, published ? 1 : 0, metadata).run();
            const row = await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?1`).bind(Number(result.meta.last_row_id)).first<ProductRow>();
            return json(request, { product: row ? adminProductFromRow(row) : null }, 201);
          }

          await env.DB.prepare(`
            UPDATE products SET category_id = ?1, name = ?2, description = ?3, price = ?4,
              stock = ?5, image_key = ?6, is_active = ?7, metadata_json = ?8, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?9
          `).bind(category.id, title, String(body.desc ?? existing?.description ?? "").trim(), price, stock, imageKey, published ? 1 : 0, metadata, existing?.db_id).run();
          const updated = await env.DB.prepare(`${productSelect} LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?1`).bind(existing?.db_id).first<ProductRow>();
          return json(request, { product: updated ? adminProductFromRow(updated) : null });
        }

        if (url.pathname === "/api/admin/products" && request.method === "DELETE") {
          const body = await parseBody(request);
          const lookup = String(body.id || "").trim();
          const row = await env.DB.prepare("SELECT id FROM products WHERE slug = ?1 OR CAST(id AS TEXT) = ?1 LIMIT 1").bind(lookup).first<{ id: number }>();
          if (!row) return json(request, { error: "找不到商品。" }, 404);

          const orderReferences = await env.DB.prepare("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?1").bind(row.id).first<{ count: number }>();
          const cartReferences = await env.DB.prepare("SELECT COUNT(*) AS count FROM cart_items WHERE product_id = ?1").bind(row.id).first<{ count: number }>();
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
          const result = await env.DB.prepare("SELECT * FROM news ORDER BY COALESCE(publish_at, created_at) DESC").all<Record<string, unknown>>();
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
          const publishAt = String(body.publishAt || new Date().toISOString());
          if (!title) return json(request, { error: "文章標題不可為空白。" }, 400);
          if (request.method === "POST") {
            const id = `news-${Date.now().toString(36)}`;
            const slug = `${slugify(title)}-${id}`;
            await env.DB.prepare(`
              INSERT INTO news (id, title, slug, category, excerpt, content, image_key, publish_at, is_published, layout_json)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            `).bind(id, title, slug, category, excerpt, content, image, publishAt, published ? 1 : 0, layout).run();
            const row = await env.DB.prepare("SELECT * FROM news WHERE id = ?1").bind(id).first<Record<string, unknown>>();
            return json(request, { news: row ? newsFromRow(row) : null }, 201);
          }
          const id = String(body.id || "").trim();
          const exists = await env.DB.prepare("SELECT id FROM news WHERE id = ?1").bind(id).first<{ id: string }>();
          if (!exists) return json(request, { error: "找不到文章。" }, 404);
          await env.DB.prepare(`
            UPDATE news SET title = ?1, category = ?2, excerpt = ?3, content = ?4, image_key = ?5,
              publish_at = ?6, is_published = ?7, layout_json = ?8, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?9
          `).bind(title, category, excerpt, content, image, publishAt, published ? 1 : 0, layout, id).run();
          const row = await env.DB.prepare("SELECT * FROM news WHERE id = ?1").bind(id).first<Record<string, unknown>>();
          return json(request, { news: row ? newsFromRow(row) : null });
        }

        if (url.pathname === "/api/admin/news" && request.method === "DELETE") {
          const body = await parseBody(request);
          const id = String(body.id || "").trim();
          await env.DB.prepare("DELETE FROM news WHERE id = ?1").bind(id).run();
          return json(request, { ok: true, id });
        }

        if (url.pathname === "/api/admin/coupons" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY updated_at DESC").all<Record<string, unknown>>();
          return json(request, { coupons: result.results });
        }

        if (url.pathname === "/api/admin/coupons" && request.method === "POST") {
          const body = await parseBody(request);
          const code = String(body.code || "").trim().toUpperCase();
          const label = String(body.label || "").trim();
          const type = String(body.type || "fixed").trim();
          const value = Number(body.value || 0);
          const min = Number(body.min || 0);
          if (!code || !label || !["fixed", "percent"].includes(type) || !Number.isFinite(value)) return json(request, { error: "優惠碼資料格式錯誤。" }, 400);
          await env.DB.prepare(`INSERT INTO coupons (code, label, type, value, min_amount, enabled, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP) ON CONFLICT(code) DO UPDATE SET label = excluded.label, type = excluded.type, value = excluded.value, min_amount = excluded.min_amount, enabled = excluded.enabled, updated_at = CURRENT_TIMESTAMP`).bind(code, label, type, value, min, body.enabled === false ? 0 : 1).run();
          const coupon = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons WHERE code = ?1").bind(code).first<Record<string, unknown>>();
          return json(request, { coupon });
        }

        if (url.pathname === "/api/admin/coupons" && (request.method === "PATCH" || request.method === "DELETE")) {
          const body = await parseBody(request);
          const code = String(body.code || "").trim().toUpperCase();
          if (request.method === "DELETE") await env.DB.prepare("DELETE FROM coupons WHERE code = ?1").bind(code).run();
          else await env.DB.prepare("UPDATE coupons SET enabled = ?1, updated_at = CURRENT_TIMESTAMP WHERE code = ?2").bind(body.enabled === false ? 0 : 1, code).run();
          const result = await env.DB.prepare("SELECT code, label, type, value, min_amount AS min, enabled, updated_at AS updatedAt FROM coupons ORDER BY updated_at DESC").all<Record<string, unknown>>();
          return json(request, { coupons: result.results });
        }

        if (url.pathname === "/api/admin/orders" && request.method === "GET") {
          const result = await env.DB.prepare(`
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
          `).all<Record<string, unknown>>();
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
            `).bind(row.id).all<Record<string, unknown>>();
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
          if (!orderId || !allowedStatuses.includes(status)) return json(request, { error: "訂單狀態資料格式錯誤。" }, 400);
          const existing = await env.DB.prepare("SELECT id FROM orders WHERE order_number = ?1 OR CAST(id AS TEXT) = ?1 LIMIT 1").bind(orderId).first<{ id: number }>();
          if (!existing) return json(request, { error: "找不到訂單。" }, 404);
          await env.DB.prepare(`UPDATE orders SET status = ?1, tracking_number = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3`)
            .bind(status, trackingNumber, existing.id).run();
          const row = await env.DB.prepare(`
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?1
          `).bind(existing.id).first<Record<string, unknown>>();
          const items = await env.DB.prepare(`
            SELECT oi.id, oi.product_id AS productId, oi.product_name AS title,
              oi.price AS priceValue, oi.quantity AS qty, p.image_key AS imageKey,
              c.name AS category
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE oi.order_id = ?1 ORDER BY oi.id ASC
          `).bind(existing.id).all<Record<string, unknown>>();
          return json(request, {
            order: row ? { ...orderFromRow(row, items.results.map(adminOrderItemFromRow)), shippingNotification: body.notify ? { status: "pending", recipient: row.customer_email || row.user_email || "" } : { status: "not_requested" } } : null,
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
            `).bind(customerId).first<Record<string, unknown>>();
            if (!row) return json(request, { error: "找不到會員。" }, 404);
            const totals = await env.DB.prepare("SELECT COUNT(*) AS orderCount, COALESCE(SUM(total_amount), 0) AS totalSpent FROM orders WHERE user_id = ?1").bind(row.id).first<{ orderCount: number; totalSpent: number }>();
            const orders = await env.DB.prepare("SELECT order_number AS id, total_amount AS total, status, created_at AS createdAt FROM orders WHERE user_id = ?1 ORDER BY created_at DESC").bind(row.id).all<Record<string, unknown>>();
            return json(request, {
              customer: {
                id: row.id, name: row.name || "", email: row.email || "", phone: row.phone || "",
                address: row.address ? { fullName: row.address_name || row.name || "", phone: row.address_phone || row.phone || "", address: row.address, city: row.city || "", zip: row.zip || "" } : null,
                orderCount: Number(totals?.orderCount || 0), totalSpent: Number(totals?.totalSpent || 0),
              },
              orders: orders.results,
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
          `).all<Record<string, unknown>>();
          return json(request, { customers: result.results.map(row => ({
            id: row.id, name: row.name || "", email: row.email || "", phone: row.phone || "",
            address: row.address ? { fullName: row.address_name || row.name || "", address: row.address, city: row.city || "", zip: row.zip || "" } : null,
            orderCount: Number(row.orderCount || 0), totalSpent: Number(row.totalSpent || 0),
          })) });
        }

        if (url.pathname === "/api/admin/engagement" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT id, record_type, payload_json, created_at, updated_at FROM engagement_records ORDER BY created_at DESC").all<Record<string, unknown>>();
          const grouped: Record<string, Record<string, unknown>[]> = { reservations: [], messages: [], subscribers: [], searches: [] };
          const groupName: Record<string, string> = { reservation: "reservations", message: "messages", subscriber: "subscribers", search: "searches" };
          for (const row of result.results) {
            const group = groupName[String(row.record_type)] || "messages";
            grouped[group].push({ id: row.id, ...parseJson<Record<string, unknown>>(String(row.payload_json || ""), {}), createdAt: row.created_at, updatedAt: row.updated_at });
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
          `).first<Record<string, unknown>>();
          const itemCount = await env.DB.prepare("SELECT COALESCE(SUM(quantity), 0) AS itemCount FROM order_items").first<{ itemCount: number }>();
          const customerCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role IS NULL OR role != 'admin'").first<{ count: number }>();
          const customersWithOrders = await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS count FROM orders WHERE user_id IS NOT NULL").first<{ count: number }>();
          const pending = await env.DB.prepare("SELECT order_number, status, customer_name FROM orders WHERE status NOT IN ('completed', 'picked_up', 'cancelled') ORDER BY created_at DESC LIMIT 5").all<Record<string, unknown>>();
          return json(request, {
            summary: {
              totalSales: Number(totals?.totalSales || 0), itemCount: Number(itemCount?.itemCount || 0),
              completedSales: Number(totals?.completedSales || 0), pendingSales: Number(totals?.pendingSales || 0),
              completedOrderCount: Number(totals?.completedOrderCount || 0), orderCount: Number(totals?.orderCount || 0),
              customerCount: Number(customerCount?.count || 0), customersWithOrders: Number(customersWithOrders?.count || 0),
            },
            notifications: pending.results.map(row => ({ type: "order", title: `訂單 ${row.order_number} 待處理`, status: row.status, customer: row.customer_name || "會員" })),
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
        if (!product) return json(request, { error: "找不到此商品，請重新整理商品頁。" }, 404);

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
        if (!product) return json(request, { error: "購物車商品不存在。" }, 404);
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
          discount: 0,
        }, 200, guestId);
      }

      if (url.pathname === "/api/register" && request.method === "POST") {
        const body = await parseBody(request);
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const name = String(body.name || email.split("@")[0] || "Customer").trim();
        const phone = String(body.phone || "").trim();
        if (!/^\S+@\S+\.\S+/.test(email) || password.length < 6) {
          return json(request, { error: "請填寫有效的 Email 與密碼。" }, 400);
        }
        const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?1 LIMIT 1").bind(email).first<{ id: number }>();
        if (existing) return json(request, { error: "此 Email 已註冊。" }, 409);

        const credentials = await createPasswordHash(password);
        const inserted = await env.DB.prepare(`
          INSERT INTO users (name, email, phone, password_salt, password_hash)
          VALUES (?1, ?2, ?3, ?4, ?5)
        `).bind(name, email, phone, credentials.salt, credentials.hash).run();
        const userId = Number(inserted.meta.last_row_id);
        const sessionToken = randomToken();
        await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?1, ?2)").bind(sessionToken, userId).run();
        const user = await env.DB.prepare("SELECT id, name, email, phone, role, password_salt, password_hash FROM users WHERE id = ?1").bind(userId).first<UserRow>();
        return json(request, { user: user ? publicUser(user) : null }, 201, undefined, sessionToken);
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
        `).bind(login).first<UserRow>();
        if (!user || !(await verifyPassword(password, user))) {
          return json(request, { error: "帳號或密碼錯誤。" }, 401);
        }
        const sessionToken = randomToken();
        await env.DB.prepare("INSERT INTO sessions (token, user_id) VALUES (?1, ?2)").bind(sessionToken, user.id).run();
        return json(request, { user: publicUser(user) }, 200, undefined, sessionToken);
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        const token = getCookie(request, SESSION_COOKIE);
        if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
        return json(request, { ok: true }, 200, undefined, "");
      }

      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "尚未登入。" }, 401);
        const address = await env.DB.prepare(`
          SELECT full_name AS fullName, phone, address, city, zip
          FROM user_addresses
          WHERE user_id = ?1
          ORDER BY is_default DESC, id ASC
          LIMIT 1
        `).bind(user.id).first<Record<string, unknown>>();
        const orderCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE user_id = ?1").bind(user.id).first<{ count: number }>();
        return json(request, { user: publicUser(user), orderCount: Number(orderCount?.count || 0), address: address || null });
      }

      if (url.pathname === "/api/me" && request.method === "PUT") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "尚未登入。" }, 401);
        const body = await parseBody(request);
        const email = String(body.email || user.email || "").trim().toLowerCase();
        const name = String(body.name || user.name || "").trim();
        const phone = String(body.phone || "").trim();
        if (!email || !email.includes("@")) return json(request, { error: "請填寫有效的 Email。" }, 400);
        const duplicate = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?1 AND id != ?2 LIMIT 1").bind(email, user.id).first<{ id: number }>();
        if (duplicate) return json(request, { error: "此 Email 已被其他會員使用。" }, 409);
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
        const updated = await env.DB.prepare("SELECT id, name, email, phone, role, password_salt, password_hash FROM users WHERE id = ?1").bind(user.id).first<UserRow>();
        return json(request, { user: updated ? publicUser(updated) : null });
      }

      if (url.pathname === "/api/address" && request.method === "PUT") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "請先登入。" }, 401);
        const body = await parseBody(request);
        const values = [
          String(body.fullName || "").trim(),
          String(body.phone || "").trim(),
          String(body.address || "").trim(),
          String(body.city || "").trim(),
          String(body.zip || "").trim(),
        ];
        const existing = await env.DB.prepare("SELECT id FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1").bind(user.id).first<{ id: number }>();
        if (existing) {
          await env.DB.prepare(`UPDATE user_addresses SET full_name = ?1, phone = ?2, address = ?3, city = ?4, zip = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6`).bind(...values, existing.id).run();
        } else {
          await env.DB.prepare(`INSERT INTO user_addresses (user_id, label, full_name, phone, address, city, zip) VALUES (?1, 'default', ?2, ?3, ?4, ?5, ?6)`).bind(user.id, ...values).run();
        }
        return json(request, { user: publicUser(user) });
      }

      if (url.pathname === "/api/orders" && request.method === "GET") {
        const user = await getSessionUser(env, request);
        if (!user) return json(request, { error: "請先登入。" }, 401);
        const result = await env.DB.prepare(`
          SELECT order_number AS id, total_amount AS total, status, created_at AS createdAt,
                 shipping_method AS shippingMethod, fulfillment_date AS fulfillmentDate,
                 tracking_number AS trackingNumber, shipping_address AS shippingAddress,
                 customer_note AS customerNote
          FROM orders
          WHERE user_id = ?1
          ORDER BY created_at DESC
        `).bind(user.id).all<Record<string, unknown>>();
        return json(request, { orders: result.results });
      }

      if (url.pathname === "/api/checkout" && request.method === "POST") {
        const body = await parseBody(request);
        const guestId = getGuestId(request);
        const sessionUser = await getSessionUser(env, request);
        const cart = await cartSummary(env, guestId);
        if (!cart.items.length) return json(request, { error: "購物車是空的。" }, 400);

        const shippingMethod = String(body.shippingMethod || "pickup");
        if (!["pickup", "home", "frozen"].includes(shippingMethod)) {
          return json(request, { error: "物流方式無效。" }, 400);
        }
        const fulfillmentDate = String(body.fulfillmentDate || "").trim();
        const requestedAddress = body.shippingAddress && typeof body.shippingAddress === "object"
          ? body.shippingAddress as Record<string, unknown>
          : {};
        const savedAddress = sessionUser
          ? await env.DB.prepare("SELECT full_name AS fullName, phone, address, city, zip FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1").bind(sessionUser.id).first<Record<string, unknown>>()
          : null;
        const shippingAddress = { ...(savedAddress || {}), ...requestedAddress };
        const name = String(shippingAddress.fullName || sessionUser?.name || body.name || "").trim();
        const email = String(body.email || sessionUser?.email || "").trim().toLowerCase();
        const phone = String(shippingAddress.phone || sessionUser?.phone || body.phone || "").trim();
        const address = String(shippingAddress.address || "").trim();
        if (!name || !email || !phone || !fulfillmentDate) {
          return json(request, { error: "請填寫姓名、電子信箱、電話與取貨／配送日期。" }, 400);
        }
        if (shippingMethod !== "pickup" && (!address || !String(shippingAddress.city || "").trim() || !String(shippingAddress.zip || "").trim())) {
          return json(request, { error: "宅配訂單請填寫地址、縣市與郵遞區號。" }, 400);
        }

        const shippingFee = shippingMethod === "frozen" ? 240 : shippingMethod === "home" ? 120 : 0;
        const total = Number((cart.subtotal + shippingFee).toFixed(2));
        const orderNumber = `S${Date.now().toString(36).toUpperCase()}`;
        const addressJson = JSON.stringify({
          fullName: name,
          phone,
          address,
          city: String(shippingAddress.city || "").trim(),
          zip: String(shippingAddress.zip || "").trim(),
        });

        await env.DB.prepare(`
          INSERT INTO orders (
            user_id, order_number, total_amount, status, customer_name, customer_email,
            customer_phone, shipping_method, shipping_address, fulfillment_date,
            customer_note, shipping_fee, discount_amount
          ) VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0)
        `).bind(
          sessionUser?.id || null,
          orderNumber,
          total,
          name,
          email,
          phone,
          shippingMethod,
          addressJson,
          fulfillmentDate,
          String(body.customerNote || "").trim(),
          shippingFee,
        ).run();

        const order = await env.DB.prepare("SELECT id, order_number, total_amount, status, created_at FROM orders WHERE order_number = ?1").bind(orderNumber).first<Record<string, unknown>>();
        for (const item of cart.items) {
          const product = await findProduct(env, item.id);
          await env.DB.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
            VALUES (?1, ?2, ?3, ?4, ?5)
          `).bind(order?.id, product?.db_id || null, item.title, item.priceValue, item.qty).run();
        }
        if (sessionUser) {
          await env.DB.prepare(`
            UPDATE users SET name = ?1, phone = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3
          `).bind(name, phone, sessionUser.id).run();

          const city = String(shippingAddress.city || "").trim();
          const zip = String(shippingAddress.zip || "").trim();
          if (address || city || zip) {
            const existingAddress = await env.DB.prepare(`
              SELECT id FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, id ASC LIMIT 1
            `).bind(sessionUser.id).first<{ id: number }>();
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
              `).bind(sessionUser.id, name, phone, address, city, zip).run();
            }
          }
        }
        await env.DB.prepare("DELETE FROM cart_items WHERE guest_id = ?1").bind(guestId).run();
        return json(request, {
          order: { ...order, id: orderNumber, total },
          email: { status: "pending", recipient: email },
        }, 201, guestId);
      }

      if (url.pathname.startsWith("/images/") && request.method === "GET") {
        return imageResponse(request, env);
      }

      const articlePathMatch = url.pathname.match(/^\/latest-news\/article\/([^/]+)\/?$/);
      if (articlePathMatch && request.method === "GET") {
        const articleKey = decodeURIComponent(articlePathMatch[1] || "").trim();
        const templateResponse = await env.ASSETS.fetch(new Request(`${url.origin}/latest-news/article/index.html`, request));
        const template = await templateResponse.text();
        const row = articleKey
          ? await env.DB.prepare(`
              SELECT * FROM news
              WHERE is_published = 1 AND (id = ?1 OR slug = ?1)
                AND (publish_at IS NULL OR datetime(replace(publish_at, 'T', ' ')) <= CURRENT_TIMESTAMP)
              LIMIT 1
            `).bind(articleKey).first<Record<string, unknown>>()
          : null;
        if (!row) {
          const missing = template
            .replace('<p class="latest-news-article-status" data-article-status role="status">載入文章中…</p>', '<p class="latest-news-article-status is-error" data-article-status role="status">找不到這則最新消息，可能已下架或不存在。</p>')
            .replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex, nofollow">');
          return new Response(missing, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" } });
        }
        const articleSlug = String(row.slug || "").trim();
        if (articleSlug && articleKey !== articleSlug) {
          return Response.redirect(`${url.origin}/latest-news/article/${encodeURIComponent(articleSlug)}/`, 301);
        }
        return new Response(renderNewsArticlePage(template, row), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" },
        });
      }

      if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
        return json(request, { error: "找不到 API 路徑。" }, 404);
      }

      const assetUrl = new URL(request.url);
      if (assetUrl.pathname.endsWith("/")) assetUrl.pathname += "index.html";
      if (url.pathname.startsWith("/admin/")) assetUrl.searchParams.set("sensen_admin_asset", "20260826-2");
      const assetRequest = new Request(assetUrl, request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      if (assetResponse.status === 404) {
        return json(request, { error: "找不到 API 路徑。" }, 404);
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
      const message = /no such table|no such column/i.test(detail)
        ? "會員資料庫尚未完成初始化，請先執行 D1 migration。"
        : "服務暫時無法處理請求。";
      return json(request, { error: message, requestId }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
