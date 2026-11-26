import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import { MongoClient, ObjectId } from "mongodb";
import React from "react";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const CONTENT_LIMIT = 20000;

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = resolve(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || match[1] in process.env) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

function loader() {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (id) => {
      if (id === "@/config/env") return { API_BASE: "https://news.test/api/v1", API_BASE_URL: "https://news.test" };
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(filename), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + source + "\n})",
      { URL, URLSearchParams, AbortController, setTimeout, clearTimeout, React }, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  return (path) => load(resolve(root, path));
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function withLinks(value) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, "<a href=\"$2\">$1</a>");
}

function toHtml(article) {
  const guide = article.readingGuide;
  if (!guide) {
    return article.content.split(/\n\s*\n/).filter(Boolean).map((block) => (
      block.startsWith("## ") ? "<h2>" + escapeHtml(block.slice(3)) + "</h2>" : "<p>" + withLinks(block) + "</p>"
    )).join("\n");
  }
  const parts = ["<p>" + withLinks(guide.intro) + "</p>",
    "<ul>" + guide.takeaways.map((item) => "<li>" + withLinks(item) + "</li>").join("") + "</ul>"];
  for (const section of guide.sections) {
    parts.push("<h2>" + escapeHtml(section.heading) + "</h2>");
    for (const paragraph of section.paragraphs) parts.push("<p>" + withLinks(paragraph) + "</p>");
    if (section.image?.source) {
      const imgTag = '<img src="' + escapeHtml(section.image.source) + '" alt="' + escapeHtml(section.image.alt || section.heading) + '">';
      parts.push(
        section.image.caption
          ? "<figure>" + imgTag + "<figcaption>" + escapeHtml(section.image.caption) + "</figcaption></figure>"
          : imgTag,
      );
    }
    if (section.checklist?.length) {
      parts.push("<ul>" + section.checklist.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>");
    }
    if (section.example) parts.push("<p>" + escapeHtml(section.example) + "</p>");
    if (section.note) parts.push("<p><em>" + escapeHtml(section.note) + "</em></p>");
  }
  parts.push("<p>" + withLinks(guide.conclusion) + "</p>");
  return parts.join("\n");
}

function describeUri(uri) {
  const host = uri.split("@")[1]?.split("/")[0] || "(unknown-host)";
  const db = uri.split("/").pop()?.split("?")[0] || "(unknown-db)";
  return host + "/" + db;
}

function payloads(articles) {
  return articles.map((article) => {
    const content = toHtml(article);
    if (content.length > CONTENT_LIMIT) throw new Error(article.id + " content is " + content.length + " chars");
    const campaignKey = "editorial:" + article.id;
    return {
      _id: ObjectId.createFromHexString(createHash("sha256").update(campaignKey).digest("hex").slice(0, 24)),
      campaignKey,
      title: article.title.slice(0, 200),
      summary: article.summary.slice(0, 500),
      content,
      category: article.category || "guide",
      audience: article.audience || "all",
      channel: "web",
      slug: article.id.slice(0, 80),
      imageUrl: article.imageUrl || "",
      published: true,
    };
  });
}

async function run() {
  loadEnv();
  const articles = payloads(loader()("src/lib/news-content.ts").getEditorialArticles("vi"));
  const apply = process.argv.includes("--apply");
  const uri = String(process.env.MONGODB_URI || "").trim();
  console.log(articles.length + " editorial guides ready for /admin/news");
  for (const article of articles) {
    console.log("- " + article.audience + " / " + article.slug + " (" + article.content.length + " chars)");
  }
  if (!apply) {
    console.log("Preview only. Re-run with --apply to write to MongoDB.");
    return;
  }
  if (!uri) throw new Error("MONGODB_URI is required");
  console.log("Writing to " + describeUri(uri));
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const news = client.db().collection("news");
    const result = await news.bulkWrite(articles.map(({ _id, ...article }) => ({
      updateOne: {
        filter: { campaignKey: article.campaignKey },
        update: { $setOnInsert: { _id, ...article, publishedAt: new Date() } },
        upsert: true,
      },
    })), { ordered: false });
    const channel = await news.bulkWrite(articles.map((article) => ({
      updateOne: {
        filter: { campaignKey: article.campaignKey },
        update: { $set: { channel: "web", audience: article.audience } },
      },
    })), { ordered: false });
    console.log("Inserted " + (result.upsertedCount || 0) + ", already present " + (result.matchedCount || 0)
      + ", website " + (channel.modifiedCount || 0) + ".");
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Unable to upsert editorial news:", error.message);
  process.exitCode = 1;
});
