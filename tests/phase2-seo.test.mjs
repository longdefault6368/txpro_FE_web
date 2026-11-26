import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const nativeRequire = createRequire(import.meta.url);

function createLoader() {
  const cache = new Map();
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (id) => {
      if (id === "@/config/env") return { API_BASE: "https://api.test/api/v1", API_BASE_URL: "https://api.test" };
      if (id.startsWith(".") || id.startsWith("@/")) {
        const target = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(filename), id);
        return load(target + (existsSync(target + ".tsx") ? ".tsx" : ".ts"));
      }
      return nativeRequire(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + code + "\n})", { URL, URLSearchParams }, { filename })(
      localRequire,
      mod,
      mod.exports
    );
    return mod.exports;
  };
  return (rel) => load(resolve(root, rel));
}

test("all 6 /thong-tin/[slug] pages have original content distinct from /tro-giup FAQ paragraphs", () => {
  const load = createLoader();
  const { INFO_PAGE_SLUGS } = load("src/lib/info-pages.ts");
  const { getInfoPageContent } = load("src/lib/info-pages-content.ts");
  const { getHelpArticles } = load("src/lib/help-content.ts");

  for (const lang of ["vi", "en", "zh"]) {
    const helpParagraphs = new Set(
      getHelpArticles(lang).flatMap((article) => article.paragraphs.map((p) => p.trim()))
    );
    for (const slug of INFO_PAGE_SLUGS) {
      const content = getInfoPageContent(slug);
      assert.ok(content.title[lang].length > 3, `${slug}:${lang} title`);
      assert.ok(content.sections.length >= 2, `${slug}:${lang} sections`);
      assert.ok(content.highlights[lang].length >= 3, `${slug}:${lang} highlights`);
      for (const section of content.sections) {
        for (const p of section.paragraphs) {
          assert.equal(helpParagraphs.has(p[lang].trim()), false, `Duplicate FAQ copy found in ${slug}:${lang}`);
        }
      }
    }
  }
});

test("commercial service pages and freight route corridors have valid assets, unique metadata, and valid cross-links", () => {
  const load = createLoader();
  const { SERVICES, SERVICE_SLUGS, isServiceSlug, getServiceBySlug } = load("src/lib/services-data.ts");
  const { ROUTE_CORRIDORS, ROUTE_SLUGS, isRouteSlug, getRouteBySlug } = load("src/lib/routes-data.ts");
  const { getEditorialArticles } = load("src/lib/news-content.ts");
  const { serviceStructuredData, itemListStructuredData, faqStructuredData } = load("src/lib/site-seo.ts");

  const editorialIds = new Set(getEditorialArticles("vi").map((item) => item.id));
  const serviceTitles = new Set();
  const routeTitles = new Set();

  assert.equal(SERVICES.length, 5);
  assert.equal(SERVICE_SLUGS.length, 5);
  assert.equal(isServiceSlug("khong-ton-tai"), false);

  for (const service of SERVICES) {
    assert.equal(isServiceSlug(service.slug), true);
    assert.equal(getServiceBySlug(service.slug).slug, service.slug);
    assert.equal(serviceTitles.has(service.seoTitle), false, service.seoTitle);
    serviceTitles.add(service.seoTitle);
    assert.ok(existsSync(resolve(root, "public", service.image.slice(1))), service.image);
    assert.ok(service.workflow.length === 4, service.slug);
    assert.ok(service.faqs.length >= 3, service.slug);
    for (const routeSlug of service.relatedRoutes) {
      assert.equal(isRouteSlug(routeSlug), true, `Broken related route ${routeSlug} in ${service.slug}`);
    }
    for (const guide of service.relatedGuides) {
      assert.equal(editorialIds.has(guide.slug), true, `Broken guide ${guide.slug} in ${service.slug}`);
    }
    const schema = serviceStructuredData("https://txepro.vn", {
      path: "/dich-vu/" + service.slug,
      name: service.name,
      description: service.seoDescription,
      serviceType: service.serviceType,
      image: service.image,
    });
    assert.equal(schema["@type"], "Service");
    assert.equal(schema.url, "https://txepro.vn/dich-vu/" + service.slug);
    const faq = faqStructuredData(service.faqs);
    assert.equal(faq["@type"], "FAQPage");
    assert.equal(faq.mainEntity.length, service.faqs.length);
  }

  assert.equal(ROUTE_CORRIDORS.length, 8);
  assert.equal(ROUTE_SLUGS.length, 8);
  assert.equal(isRouteSlug("khong-ton-tai"), false);

  for (const route of ROUTE_CORRIDORS) {
    assert.equal(isRouteSlug(route.slug), true);
    assert.equal(getRouteBySlug(route.slug).slug, route.slug);
    assert.equal(routeTitles.has(route.seoTitle), false, route.seoTitle);
    routeTitles.add(route.seoTitle);
    assert.ok(existsSync(resolve(root, "public", route.image.slice(1))), route.image);
    assert.ok(route.faqs.length >= 3, route.slug);
    for (const svcSlug of route.relatedServices) {
      assert.equal(isServiceSlug(svcSlug), true, `Broken related service ${svcSlug} in ${route.slug}`);
    }
    for (const neighbor of route.relatedRoutes) {
      assert.equal(isRouteSlug(neighbor), true, `Broken neighbor route ${neighbor} in ${route.slug}`);
    }
    for (const guide of route.relatedGuides) {
      assert.equal(editorialIds.has(guide.slug), true, `Broken guide ${guide.slug} in ${route.slug}`);
    }
  }

  const listSchema = itemListStructuredData("https://txepro.vn", {
    path: "/tuyen-duong",
    name: "Tuyến vận chuyển",
    description: "Mô tả",
    items: ROUTE_CORRIDORS.map((r) => ({ name: r.name, path: "/tuyen-duong/" + r.slug })),
  });
  assert.equal(listSchema["@type"], "CollectionPage");
  assert.equal(listSchema.mainEntity.numberOfItems, 8);
});

test("sitemap includes all Phase 2 commercial, driver, and route corridor URLs", async () => {
  const load = createLoader();
  const { buildNewsSitemap } = load("src/lib/news-sitemap.ts");
  const { SERVICE_SLUGS } = load("src/lib/services-data.ts");
  const { ROUTE_SLUGS } = load("src/lib/routes-data.ts");

  const entries = await buildNewsSitemap("https://txepro.vn", async () => ({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }));
  const urls = new Set(entries.map((entry) => entry.url));

  for (const path of [
    "/dich-vu",
    ...SERVICE_SLUGS.map((slug) => "/dich-vu/" + slug),
    "/tai-xe",
    "/tuyen-duong",
    ...ROUTE_SLUGS.map((slug) => "/tuyen-duong/" + slug),
  ]) {
    assert.equal(urls.has("https://txepro.vn" + path), true, `Missing sitemap URL: ${path}`);
  }
});
