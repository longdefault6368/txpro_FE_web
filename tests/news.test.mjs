import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
function loader({ language = "vi", fetch = async () => { throw new Error("Unexpected network call in render test"); } } = {}) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const localRequire = id => {
      if (id === "@/config/env") return { API_BASE: "https://news.test/api/v1", API_BASE_URL: "https://news.test" };
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language }) };
      if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (id === "next/image") return ({ fill, priority, ...props }) => React.createElement("img", props);
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(filename), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + source + "\n})",
      { URL, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch }, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}

test("eighteen complete guides have unique URLs and bundled covers", () => {
  const { getEditorialArticles } = loader()("src/lib/news-content.ts");
  for (const language of ["vi", "en", "zh"]) {
    const articles = getEditorialArticles(language);
    assert.equal(articles.length, 18);
    assert.equal(new Set(articles.map(item => item.id)).size, 18);
    assert.equal(new Set(articles.map(item => item.imageUrl)).size, 18, "every article needs a different cover");
    assert.equal(new Set(articles.map(item => createHash("sha256").update(readFileSync(resolve(root, "public", item.imageUrl.slice(1)))).digest("hex"))).size, 18, "different filenames must not hide duplicate images");
    for (const item of articles) {
      assert.ok(item.title.length >= (language === "zh" ? 8 : 10));
      assert.ok(item.summary.length > 15);
      assert.ok(item.content.length > (language === "zh" ? 900 : 2600), item.id + " " + language);
      assert.equal(item.content.match(/^## /gm).length, 3);
      assert.equal(item.publishedAt, null, "evergreen guides must not invent publication dates");
      assert.ok(existsSync(resolve(root, "public", item.imageUrl.slice(1))), item.imageUrl);
    }
  }
});

test("each guide renders a full article, navigation and related articles", () => {
  for (const language of ["vi", "en", "zh"]) {
    const load = loader({ language });
    const { getEditorialArticles } = load("src/lib/news-content.ts");
    const View = load("src/components/news/NewsArticle.tsx").default;
    for (const item of getEditorialArticles(language)) {
      const html = renderToStaticMarkup(React.createElement(View, { editorialId: item.id }));
      assert.ok(html.includes(item.title));
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
      assert.equal((html.match(/id="phan-/g) || []).length, 3);
      assert.ok(html.includes('href="/tin-tuc"'));
      assert.ok(html.includes('href="/dang-tin"'));
    }
  }
});

test("CMS HTML renders semantic structure safely while stripping scripts and unsafe tags", () => {
  const load = loader();
  const { newsPlainText } = load("src/lib/news-content.ts");
  const text = newsPlainText('<p>Đoạn một &amp; hai</p><script>alert(1)</script><p>&lt;img src=x onerror=alert(2)&gt;</p>');
  assert.ok(text.includes("Đoạn một & hai"));
  assert.ok(!text.includes("alert(1)"));
  const View = load("src/components/news/NewsArticle.tsx").default;
  const html = renderToStaticMarkup(React.createElement(View, { article: {
    id: "123456789012345678901234", title: "Test article", summary: "Summary",
    content: text, category: "news", imageUrl: "", publishedAt: null,
  } }));
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<img src=x"));

  const richHtml = renderToStaticMarkup(React.createElement(View, { article: {
    id: "123456789012345678901235", title: "Bài viết CMS", summary: "Tóm tắt bài CMS",
    content: `<h3>Mục lớn một</h3>
<p>Đọc thêm <a href="/tin-tuc/chon-xe-phu-hop">cẩm nang chọn xe</a> và <a href="https://example.com/ref">tài liệu ngoài</a> và <a href="javascript:alert(1)">link xấu</a>.</p>
<ul><li>Bước một</li><li>Bước hai</li></ul>
<div class="card-note"><strong>Lưu ý:</strong> Kiểm tra kỹ.</div>
<figure><img src="/uploads/news/sample.webp" alt="Ảnh minh họa xe tải"><figcaption>Chú thích ảnh</figcaption></figure>
<img src="x" onerror="alert(3)"><script>alert(4)</script>
<h4>Mục con</h4>`,
    category: "news", imageUrl: "/marketing/driver-pioneer.webp", publishedAt: "2026-11-20T08:00:00.000Z",
  } }));
  // Starts at h3 -> promoted to h2 with TOC anchor #phan-0; h4 promoted to h3
  assert.ok(richHtml.includes('<h2 id="phan-0">Mục lớn một</h2>'));
  assert.ok(richHtml.includes('href="#phan-0"'));
  assert.ok(richHtml.includes("<h3>Mục con</h3>"));
  assert.ok(richHtml.includes("<ul><li>Bước một</li><li>Bước hai</li></ul>"));
  assert.ok(richHtml.includes('class="cardNote"'));
  assert.ok(richHtml.includes('href="/tin-tuc/chon-xe-phu-hop"'));
  assert.ok(richHtml.includes('href="https://example.com/ref" target="_blank" rel="noopener noreferrer"'));
  assert.ok(!richHtml.includes("javascript:alert"));
  assert.ok(richHtml.includes('src="https://news.test/uploads/news/sample.webp"'));
  assert.ok(richHtml.includes('alt="Ảnh minh họa xe tải"'));
  assert.ok(richHtml.includes("<figcaption>Chú thích ảnh</figcaption>"));
  assert.ok(richHtml.includes('src="https://news.test/marketing/driver-pioneer.webp"'));
  assert.ok(!richHtml.includes("onerror"));
  assert.ok(!richHtml.includes("<script"));
});

test("expanded guides have complete text, two relevant inline images and captions in every language", () => {
  const load = loader();
  const { getEditorialArticles } = load("src/lib/news-content.ts");
  const { newsImageSource } = load("src/lib/news-public.ts");
  for (const language of ["vi", "en", "zh"]) {
    for (const article of getEditorialArticles(language)) {
      const guide = article.readingGuide;
      assert.ok(guide, article.id);
      assert.ok(guide.intro.length > 60);
      assert.equal(guide.takeaways.length, 3);
      assert.ok(guide.conclusion.length > (language === "zh" ? 40 : 120), article.id + " conclusion " + language);
      assert.ok(article.content.includes(guide.intro));
      assert.ok(article.content.includes(guide.conclusion));
      assert.equal(guide.sections.length, 3);
      const media = guide.sections.flatMap(section => section.image ? [section.image] : []);
      assert.equal(media.length, 2);
      assert.equal(new Set(media.map(image => image.source)).size, 2);
      for (const image of media) {
        assert.notEqual(image.source, article.imageUrl, "inline images must not just repeat the cover");
        assert.ok(existsSync(resolve(root, "public", image.source.slice(1))), image.source);
        assert.equal(newsImageSource(image.source), image.source, "inline image must not fall back due to an invalid source");
        assert.ok(image.alt.length > 10);
        assert.ok(image.caption.length > 20);
      }
      for (const section of guide.sections) {
        assert.equal(section.paragraphs.length, 2);
        assert.ok(section.paragraphs.every(text => text.length > 60));
        for (const text of section.paragraphs) assert.ok(article.content.includes(text));
        for (const text of section.checklist || []) assert.ok(article.content.includes(text));
      }
      assert.ok(guide.sections.some(section => section.example));
      assert.ok(guide.sections.some(section => section.checklist?.length === 3));
      assert.ok(guide.sections.some(section => section.note));
    }
  }
});

test("article layout renders alternating figures, checklist and stable section links", () => {
  for (const language of ["vi", "en", "zh"]) {
    const load = loader({ language });
    const { getEditorialArticles } = load("src/lib/news-content.ts");
    const View = load("src/components/news/NewsArticle.tsx").default;
    for (const article of getEditorialArticles(language)) {
      const html = renderToStaticMarkup(React.createElement(View, { editorialId: article.id }));
      assert.equal((html.match(/class="inlineFigure"/g) || []).length, 2);
      assert.ok(html.includes("imageLeft"), "the second figure alternates on desktop");
      assert.ok(html.includes('class="takeaways"'));
      assert.ok(html.includes('class="checklist"'));
      assert.ok(html.includes('class="conclusion"'));
      for (let index = 0; index < 3; index++) {
        assert.ok(html.includes('id="phan-' + index + '"'));
        assert.ok(html.includes('href="#phan-' + index + '"'));
      }
      for (const section of article.readingGuide.sections) {
        if (section.image) assert.ok(html.includes(section.image.caption));
      }
    }
  }
});

test("invalid image schemes and incomplete or private records are rejected", () => {
  const { normalizeNews, newsImageSource } = loader()("src/lib/news-public.ts");
  const base = { id: "123456789012345678901234", title: "News" };
  assert.equal(normalizeNews({ ...base, published: false }), null);
  assert.ok(normalizeNews({ ...base, audience: "driver" }));
  assert.equal(normalizeNews({ ...base, audience: "admin" }), null);
  assert.equal(normalizeNews({ ...base, publishedAt: "2099-01-01" }), null);
  assert.equal(normalizeNews({ ...base, id: "../admin" }), null);
  assert.equal(normalizeNews({ ...base, slug: "uu-dai-thang-9" }).slug, "uu-dai-thang-9");
  for (const source of ["javascript:alert(1)", "data:image/svg+xml,<svg/>", "//evil.example/a", "https://user:password@host.test/x"]) {
    assert.equal(newsImageSource(source), "/splash1.png");
  }
  assert.equal(newsImageSource("/uploads/news/x.png"), "https://news.test/uploads/news/x.png");
  assert.equal(newsImageSource("/marketing/driver-pioneer.webp"), "https://news.test/marketing/driver-pioneer.webp");
  assert.equal(newsImageSource("/images/news/furniture.png"), "/images/news/furniture.png");
  const { isTrustedNewsImageUrl } = loader()("src/lib/news-public.ts");
  assert.equal(isTrustedNewsImageUrl("/images/news/furniture.webp"), true);
  assert.equal(isTrustedNewsImageUrl("https://news.test/uploads/news/a.webp"), true);
  assert.equal(isTrustedNewsImageUrl("https://news.test/marketing/b.webp"), true);
  assert.equal(isTrustedNewsImageUrl("https://evil.example/c.png"), false);
});

test("public news requests are credential-free, filtered and deduplicated", async () => {
  let requested;
  const load = loader({ fetch: async (url, options) => {
    requested = { url, options };
    const item = { id: "123456789012345678901234", title: "News" };
    return new Response(JSON.stringify({ success: true, data: { items: [item, item], pagination: { page: 2, totalPages: 3, total: 4 } } }), { status: 200 });
  } });
  const { getPublicNews } = load("src/lib/news-public.ts");
  const result = await getPublicNews({ page: 2, limit: 9, category: "guide", search: "đúng xe" });
  assert.equal(result.items.length, 1);
  assert.equal(requested.options.credentials, "omit");
  assert.equal(requested.options.cache, "no-store");
  assert.equal(new URL(requested.url).searchParams.get("search"), "đúng xe");
  assert.equal(new URL(requested.url).searchParams.get("page"), "2");
  assert.equal(new URL(requested.url).searchParams.get("category"), "guide");
  assert.equal(requested.options.headers, undefined);
});

test("errors and missing details are not mistaken for empty successful news", async () => {
  const load = loader({ fetch: async () => new Response("{}", { status: 404 }) });
  const { getPublicNews, getPublicNewsArticle } = load("src/lib/news-public.ts");
  await assert.rejects(getPublicNews(), error => error.status === 404);
  await assert.rejects(getPublicNewsArticle("123456789012345678901234"), error => error.status === 404);
  await assert.rejects(getPublicNewsArticle("../admin"), error => error.status === 404);
});

test("news styles respect the bold cap and reduced-motion preference", () => {
  const css = readFileSync(resolve(root, "src/components/news/News.module.css"), "utf8");
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.ok(css.includes("prefers-reduced-motion"));
  const feed = readFileSync(resolve(root, "src/components/news/NewsFeed.tsx"), "utf8");
  assert.ok(feed.includes("return () => controller.abort()"), "stale feed requests must be cancelled on navigation or filter changes");
});

test("news listing renders crawlable article links on the server, including when CMS is unavailable", () => {
  const load = loader();
  const Feed = load("src/components/news/NewsFeed.tsx").default;
  const articles = load("src/lib/news-content.ts").getEditorialArticles();
  for (const initialData of [null, { items: [], pagination: { page: 1, totalPages: 1, total: 0 } }]) {
    const html = renderToStaticMarkup(React.createElement(Feed, { initialData }));
    for (const article of articles.slice(0, 9)) {
      assert.ok(html.includes(article.title));
      assert.ok(html.includes('href="/tin-tuc/' + article.id + '"'));
    }
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(!html.includes("Đang tải bài viết"));
    assert.ok(html.includes("Tài xế"));
    assert.ok(html.includes("Khách hàng"));
  }
  const drivers = renderToStaticMarkup(React.createElement(Feed, { initialData: null, initialAudience: "driver" }));
  assert.ok(drivers.includes('href="/tin-tuc/dang-xe-trong-hieu-qua"'));
  assert.ok(!drivers.includes('href="/tin-tuc/chup-anh-hang-hoa-ro-rang"'));
});

test("article metadata and structured data agree on canonical URLs, images and real publication dates", () => {
  const load = loader();
  const { articleMetadata, articleStructuredData, siteOrigin, safeStructuredJson } = load("src/lib/news-seo.ts");
  const article = load("src/lib/news-content.ts").getEditorialArticles()[0];
  const origin = siteOrigin("https://www.example.com/old-path");
  assert.equal(origin, "https://www.example.com");
  assert.equal(siteOrigin("javascript:alert(1)"), null);
  assert.equal(siteOrigin("https://user:pass@example.com"), null);
  const meta = articleMetadata(article, origin);
  const schema = articleStructuredData(article, origin);
  assert.equal(meta.alternates.canonical, origin + "/tin-tuc/" + article.id);
  assert.equal(meta.openGraph.url, meta.alternates.canonical);
  assert.equal(meta.openGraph.images[0].url, origin + article.imageUrl);
  assert.equal(schema.mainEntityOfPage, meta.alternates.canonical);
  assert.equal(schema.datePublished, undefined);
  assert.equal(meta.openGraph.publishedTime, undefined);
  assert.equal(articleMetadata(article, null).alternates, undefined);
  const payload = safeStructuredJson({ headline: "</script><img src=x onerror=alert(1)>" });
  assert.ok(!payload.includes("<"));
  assert.equal(JSON.parse(payload).headline, "</script><img src=x onerror=alert(1)>");
});

test("news sitemap paginates actual public CMS articles across audiences and keeps editorial links when CMS is unavailable", async () => {
  const { buildNewsSitemap } = loader()("src/lib/news-sitemap.ts");
  const calls = [];
  const read = async ({ page, limit, audience }) => {
    calls.push([audience || "all", page, limit]);
    if (audience === "driver") {
      return { items: [
        { id: "d00000000000000000000001", slug: "tin-rieng-tai-xe", title: "Driver", imageUrl: "", summary: "", content: "", category: "promotion", publishedAt: "2026-11-20T00:00:00.000Z" },
      ], pagination: { page: 1, totalPages: 1, total: 1 } };
    }
    if (audience === "shipper") {
      return { items: [
        { id: "e00000000000000000000001", slug: "tin-rieng-chu-hang", title: "Shipper", imageUrl: "", summary: "", content: "", category: "guide", publishedAt: "2026-11-21T00:00:00.000Z" },
      ], pagination: { page: 1, totalPages: 1, total: 1 } };
    }
    return { items: [
      { id: String(page).padStart(24, "0"), slug: "tin-cms-trang-" + page, title: "Public", imageUrl: "", summary: "", content: "", category: "news", publishedAt: "2026-11-19T00:00:00.000Z" },
      { id: "c504588a16b5452346a06d78", title: "Bài không slug", imageUrl: "", summary: "", content: "", category: "news", publishedAt: null },
    ], pagination: { page, totalPages: 2, total: 2 } };
  };
  const entries = await buildNewsSitemap("https://www.example.com", read);
  assert.deepEqual(calls, [["all", 1, 24], ["all", 2, 24], ["driver", 1, 24], ["shipper", 1, 24]]);
  const cms2 = entries.find(item => item.url.endsWith("/tin-tuc/tin-cms-trang-2"));
  assert.ok(cms2);
  assert.equal(cms2.lastModified, "2026-11-19T00:00:00.000Z");
  assert.ok(entries.some(item => item.url.endsWith("/tin-tuc/tin-rieng-tai-xe")));
  assert.ok(entries.some(item => item.url.endsWith("/tin-tuc/tin-rieng-chu-hang")));
  assert.ok(!entries.some(item => item.url.includes("c504588a16b5452346a06d78")));
  assert.ok(!entries.some(item => /\/tin-tuc\/[a-f0-9]{24}$/i.test(item.url)));
  assert.ok(entries.some(item => item.url.endsWith("/tin-tuc/chon-xe-phu-hop")));
  for (const path of ["/tai-xe/dang-tin", "/chu-hang/form-tao-don", "/tracking", "/tuyen-dung", "/thong-tin/quy-che-hoat-dong", "/thong-tin/thanh-toan-ky-quy", "/thong-tin/khieu-nai-boi-thuong"]) {
    assert.ok(entries.some(item => item.url === "https://www.example.com" + path));
  }
  for (const excluded of ["/doi-tac", "/login", "/register", "/admin"]) {
    assert.ok(!entries.some(item => item.url === "https://www.example.com" + excluded || item.url.includes(excluded + "/")));
  }
  const offline = await buildNewsSitemap("https://www.example.com", async () => { throw new Error("Offline"); });
  assert.ok(offline.some(item => item.url.endsWith("/tin-tuc/dang-xe-trong-hieu-qua")));
  assert.equal((await buildNewsSitemap(null, read)).length, 0);
});

test("homepage structured data uses TXE PRO and omits unknown contact fields", () => {
  const { websiteStructuredData, structuredDataScript, HOME_TITLE } = loader()("src/lib/site-seo.ts");
  const data = websiteStructuredData("https://www.example.com", {});
  assert.equal(data["@graph"][0].name, "TXE PRO");
  assert.equal(data["@graph"][1].name, "TXE PRO");
  assert.equal(data["@graph"][0].url, "https://www.example.com");
  assert.equal("telephone" in data["@graph"][0], false);
  assert.equal("address" in data["@graph"][0], false);
  const withContact = websiteStructuredData(null, { companyName: "Công ty TXE PRO", phoneSupport: "0898080820", addressHcm: "Huế" });
  assert.equal(withContact["@graph"][0].legalName, "Công ty TXE PRO");
  assert.equal(withContact["@graph"][0].telephone, "0898080820");
  assert.equal(withContact["@graph"][0].address.streetAddress, "Huế");
  assert.equal(structuredDataScript(data).includes("<"), false);
  assert.match(HOME_TITLE, /Tìm xe chở hàng/);
  const { resolveMetadataOrigin, PRODUCTION_SITE_ORIGIN, rootMetadata } = loader()("src/lib/site-seo.ts");
  assert.equal(resolveMetadataOrigin(null, "production"), PRODUCTION_SITE_ORIGIN);
  assert.equal(resolveMetadataOrigin(null, "development"), PRODUCTION_SITE_ORIGIN);
  assert.equal(resolveMetadataOrigin(null, "test"), null);
  assert.equal(resolveMetadataOrigin("https://staging.example", "production"), "https://staging.example");
  assert.equal(rootMetadata(PRODUCTION_SITE_ORIGIN).metadataBase.href, PRODUCTION_SITE_ORIGIN + "/");
});

test("combined news pages have no gaps or duplicates at the CMS/editorial boundary", () => {
  const load = loader();
  const editorial = load("src/lib/news-content.ts").getEditorialArticles();
  const { paginateNews, readNewsQuery, newsPageHref } = load("src/lib/news-pagination.ts");
  for (const remoteTotal of [0, 2, 10, 18]) {
    const remote = Array.from({ length: remoteTotal }, (_, i) => ({ ...editorial[0], id: "cms-" + i }));
    const count = Math.ceil((remote.length + editorial.length) / 9);
    const all = [];
    for (let page = 1; page <= count; page++) {
      const result = paginateNews({ items: remote.slice((page - 1) * 9, page * 9),
        pagination: { page, total: remoteTotal, totalPages: Math.max(1, Math.ceil(remoteTotal / 9)) } }, editorial, page);
      assert.ok(result.items.length <= 9);
      assert.equal(result.pagination.totalPages, count);
      assert.equal(result.pagination.total, remoteTotal + editorial.length);
      all.push(...result.items.map(item => item.id));
    }
    assert.deepEqual(all, [...remote, ...editorial].map(item => item.id));
    assert.equal(new Set(all).size, all.length);
  }
  assert.equal(paginateNews(null, editorial, 2).items.length, 9);
  assert.equal(readNewsQuery({ page: "-1", category: ["guide"] }).page, 1);
  assert.equal(readNewsQuery({ category: ["guide"] }).category, "all");
  assert.equal(newsPageHref(2, "guide", "xe trống"), "/tin-tuc?page=2&category=guide&search=xe+tr%E1%BB%91ng");
  assert.equal(newsPageHref(1, "all", "", "driver"), "/tin-tuc?audience=driver");
  assert.equal(readNewsQuery({ audience: "shipper" }).audience, "shipper");
  const driverGuides = load("src/lib/news-pagination.ts").filterEditorials(editorial, "all", "", "driver");
  assert.ok(driverGuides.some(item => item.id === "dang-xe-trong-hieu-qua"));
  assert.ok(!driverGuides.some(item => item.id === "chup-anh-hang-hoa-ro-rang"));
});

test("listing renders nine uniform cards, then the remaining guides on a separate crawlable page", () => {
  const load = loader();
  const Feed = load("src/components/news/NewsFeed.tsx").default;
  const editorial = load("src/lib/news-content.ts").getEditorialArticles();
  const links = [];
  for (const [page, expected] of [[1, 9], [2, 9]]) {
    const html = renderToStaticMarkup(React.createElement(Feed, { initialData: null, initialPage: page }));
    const ids = [...html.matchAll(/href="\/tin-tuc\/([^"]+)"/g)].map(item => item[1]);
    assert.equal(ids.length, expected);
    assert.ok(!html.includes('class="spotlight"'));
    assert.ok(html.includes(page === 1 ? 'href="/tin-tuc?page=2"' : 'href="/tin-tuc"'));
    links.push(...ids);
  }
  assert.deepEqual(links, Array.from(editorial, item => item.id));
  const css = readFileSync(resolve(root, "src/components/news/News.module.css"), "utf8");
  assert.match(css, /\.grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test("listing page uses crawlable filter links, h2 card headings, and complete article SEO schema", () => {
  const load = loader();
  const Feed = load("src/components/news/NewsFeed.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Feed, { initialData: null }));
  assert.ok(html.includes('href="/tin-tuc?audience=driver"'));
  assert.ok(html.includes('href="/tin-tuc?category=guide"'));
  assert.equal((html.match(/<h2[ >]/g) || []).length, 9);
  assert.equal((html.match(/<h3[ >]/g) || []).length, 0);

  const { articleMetadata, articleStructuredData } = load("src/lib/news-seo.ts");
  const cmsNews = {
    id: "123456789012345678901234", slug: "tin-moi-txe-pro", title: "Thông báo mở tuyến mới",
    summary: "", content: "<h2>Nội dung chính</h2><p>Đoạn mô tả tự động trích xuất khi tóm tắt đang bỏ trống trên hệ thống.</p>",
    category: "news", imageUrl: "/uploads/news/a.webp",
    publishedAt: "2026-11-20T08:00:00.000Z", updatedAt: "2026-11-21T08:00:00.000Z",
  };
  const meta = articleMetadata(cmsNews, "https://txepro.vn");
  const schema = articleStructuredData(cmsNews, "https://txepro.vn");
  assert.ok(meta.description.includes("Đoạn mô tả tự động"));
  assert.equal(meta.robots.googleBot["max-image-preview"], "large");
  assert.equal(meta.openGraph.modifiedTime, "2026-11-21T08:00:00.000Z");
  assert.equal(schema["@type"], "NewsArticle");
  assert.equal(schema.dateModified, "2026-11-21T08:00:00.000Z");
  assert.equal(schema.publisher.logo.url, "https://txepro.vn/logo-mark.webp");
  assert.equal(schema.author.url, "https://txepro.vn");
  assert.ok(schema.wordCount > 10);

  const { extractNewsSeoStats } = load("src/lib/news-html.ts");
  const stats = extractNewsSeoStats('<h2>Mục 1</h2><p>Xem <a href="/tin-tuc/a">bài A</a> và <a href="https://ext.test">ngoài</a></p><img src="/uploads/news/1.webp" alt="Xe tải"><img src="/uploads/news/2.webp" alt="">');
  assert.equal(stats.h2Count, 1);
  assert.equal(stats.imageCount, 2);
  assert.equal(stats.imagesMissingAlt, 1);
  assert.equal(stats.internalLinkCount, 1);
  assert.equal(stats.externalLinkCount, 1);
});

test("phase 1 sitewide SEO helpers produce 1200x630 OG, full googleBot, rich schemas, and strict info slugs", () => {
  const load = loader();
  const siteSeo = load("src/lib/site-seo.ts");
  const { CAREER_JOBS } = load("src/lib/careers-data.ts");
  const { getHelpArticles } = load("src/lib/help-content.ts");
  const { INFO_PAGE_SLUGS, isInfoPageSlug } = load("src/lib/info-pages.ts");

  const meta = siteSeo.publicPageMetadata({ title: "Trang mẫu", description: "Mô tả mẫu", path: "/mau" });
  assert.equal(meta.robots.googleBot["max-image-preview"], "large");
  assert.equal(meta.twitter.card, "summary_large_image");
  assert.equal(meta.openGraph.images[0].url, "/og-txepro.jpg");
  assert.equal(meta.openGraph.images[0].width, 1200);
  assert.equal(meta.openGraph.images[0].height, 630);

  const siteGraph = siteSeo.websiteStructuredData("https://txepro.vn", {
    companyName: "Công ty TXE PRO",
    phoneSupport: "0898080820",
    emailSupport: "support@txepro.vn",
    googlePlayUrl: "https://play.google.com/store/apps/details?id=vn.txepro",
  });
  assert.equal(siteGraph["@graph"].length, 3);
  assert.equal(siteGraph["@graph"][0]["@id"], "https://txepro.vn/#organization");
  assert.equal(siteGraph["@graph"][0].logo["@type"], "ImageObject");
  assert.equal(siteGraph["@graph"][0].contactPoint["@type"], "ContactPoint");
  assert.equal("potentialAction" in siteGraph["@graph"][1], false);
  assert.equal(siteGraph["@graph"][2]["@type"], "MobileApplication");
  assert.equal(siteGraph["@graph"][2].offers.price, "0");

  const faq = siteSeo.faqStructuredData(getHelpArticles("vi"));
  assert.equal(faq["@type"], "FAQPage");
  assert.ok(faq.mainEntity.length >= 10);

  const jobs = siteSeo.jobPostingsStructuredData("https://txepro.vn", CAREER_JOBS, {});
  assert.equal(jobs["@graph"].length, CAREER_JOBS.length);
  assert.equal(jobs["@graph"][0]["@type"], "JobPosting");
  assert.ok(jobs["@graph"].some(job => job.jobLocationType === "TELECOMMUTE"));

  const crumbs = siteSeo.breadcrumbStructuredData("https://txepro.vn", [
    { name: "Trang chủ", path: "/" },
    { name: "Theo dõi đơn hàng", path: "/tracking" },
  ]);
  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.equal(crumbs.itemListElement[1].item, "https://txepro.vn/tracking");

  assert.equal(INFO_PAGE_SLUGS.length, 6);
  assert.equal(isInfoPageSlug("gioi-thieu"), true);
  assert.equal(isInfoPageSlug("khong-ton-tai"), false);
  assert.equal(isInfoPageSlug("toString"), false);
});
