import test from "node:test";
import assert from "node:assert/strict";
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

test("four complete guides and bundled covers exist in all supported languages", () => {
  const { getEditorialArticles } = loader()("src/lib/news-content.ts");
  for (const language of ["vi", "en", "zh"]) {
    const articles = getEditorialArticles(language);
    assert.equal(articles.length, 4);
    assert.equal(new Set(articles.map(item => item.id)).size, 4);
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

test("CMS markup is rendered as inert text, including encoded tags", () => {
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
  assert.equal(normalizeNews({ ...base, audience: "driver" }), null);
  assert.equal(normalizeNews({ ...base, publishedAt: "2099-01-01" }), null);
  assert.equal(normalizeNews({ ...base, id: "../admin" }), null);
  for (const source of ["javascript:alert(1)", "data:image/svg+xml,<svg/>", "//evil.example/a", "https://user:password@host.test/x"]) {
    assert.equal(newsImageSource(source), "/splash1.png");
  }
  assert.equal(newsImageSource("/uploads/news/x.png"), "https://news.test/uploads/news/x.png");
  assert.equal(newsImageSource("/images/news/furniture.png"), "/images/news/furniture.png");
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
