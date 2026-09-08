import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { beforeAll, describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("sensen-api Worker", () => {
  beforeAll(async () => {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL,
        category TEXT, excerpt TEXT, content TEXT, image_key TEXT,
        publish_at TEXT, is_published INTEGER DEFAULT 0, layout_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`).run();
  });

  it("returns an API 404 for an unknown route", async () => {
    const request = new IncomingRequest("https://example.com/unknown/");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "找不到 API 路徑。" });
  });

  it("returns a health response through the deployed Worker entrypoint", async () => {
    const response = await SELF.fetch("https://example.com/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, database: "connected" });
  });

  it("rejects a legacy news image proxy request for another host", async () => {
    const response = await SELF.fetch("https://example.com/images/legacy-news?url=https%3A%2F%2Fexample.com%2Fimage.jpg");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "不允許代理此圖片來源。" });
  });

  it("server-renders published news metadata and content", async () => {
    const id = `seo-news-${crypto.randomUUID()}`;
    await env.DB.prepare(`
      INSERT INTO news (id, title, slug, category, excerpt, content, publish_at, is_published)
      VALUES (?1, 'SEO 測試文章', ?2, 'latest-news', '這是搜尋摘要。', '這是伺服器端文章內容。', '2026-01-01T00:00:00.000Z', 1)
    `).bind(id, `${id}-slug`).run();

    const response = await SELF.fetch(`https://example.com/latest-news/article/${encodeURIComponent(`${id}-slug`)}/`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title>SEO 測試文章 – 森森點心坊</title>");
    expect(html).toContain('content="這是搜尋摘要。"');
    expect(html).toContain("這是伺服器端文章內容。");
    expect(html).toContain('data-article-hydrated="true"');
    expect(html.match(/<h1\b/gi)).toHaveLength(1);

    const idResponse = await SELF.fetch(`https://example.com/latest-news/article/${encodeURIComponent(id)}/`, { redirect: "manual" });
    expect(idResponse.status).toBe(301);
    expect(idResponse.headers.get("location")).toBe(`https://example.com/latest-news/article/${encodeURIComponent(`${id}-slug`)}/`);
  });

  it("redirects duplicate page URL variants to one trailing-slash URL", async () => {
    const request = new IncomingRequest("https://example.com/cart?source=test", { redirect: "manual" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://example.com/cart/?source=test");
  });

  it("redirects a duplicate legacy privacy URL to its canonical page", async () => {
    const request = new IncomingRequest(`https://example.com/${encodeURIComponent("隱私權條件")}/`, { redirect: "manual" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://example.com/${encodeURIComponent("隱私權條款")}/`);
  });

  it("permanently removes retired orphan content", async () => {
    const request = new IncomingRequest(`https://example.com/latest-news/${encodeURIComponent("2019頂家彌月目錄")}/`);
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(410);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("returns an HTML 404 for a missing news article", async () => {
    const response = await SELF.fetch("https://example.com/latest-news/article/missing-news-for-seo/");
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await response.text()).toContain("找不到這則最新消息");
  });
});
