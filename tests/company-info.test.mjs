import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(import.meta.dirname, "..");
const nativeRequire = createRequire(import.meta.url);
function load(path, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const require = id => id in mocks ? mocks[id] : nativeRequire(id);
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", { URL, Headers, AbortSignal, FormData, ...globals })(require, module, module.exports);
  return module.exports;
}
const config = { "@/config/env": { API_BASE: "https://chosen.test/api/v1", API_FALLBACK: "https://other.test/api/v1" } };
test("company info normalizes only public fields, keeps missing values empty, rejects invalid contact links", () => {
  const { normalizeCompanyInfo, phoneLink } = load("src/utils/companyInfo.ts", config);
  const info = normalizeCompanyInfo({ hotline: " +84 901 234 567 ", addressHcm: " Actual office ", workingHours: "Actual hours", emailSupport: "support@example.com", websiteUrl: "javascript:alert(1)", facebookUrl: "https://user:pass@example.com", privateKey: "secret" });
  assert.equal(info.hotline, "+84 901 234 567");
  assert.equal(info.addressHcm, "Actual office");
  assert.equal(info.workingHours, "Actual hours");
  assert.equal(info.websiteUrl, ""); assert.equal(info.facebookUrl, "");
  assert.equal(info.privateKey, undefined); assert.equal(info.addressHn, "");
  assert.equal(phoneLink(info.hotline), "tel:+84901234567");
  assert.equal(phoneLink("javascript:bad"), "");
});
test("company info reads only the selected backend, without credentials or cache; errors are not replaced by samples", async () => {
  const calls = [];
  const send = async (...args) => { calls.push(args); return Response.json({ data: { hotline: "0901234567" } }); };
  const utils = load("src/utils/companyInfo.ts", config, { fetch: send });
  assert.equal((await utils.fetchCompanyInfo()).hotline, "0901234567");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://chosen.test/api/v1/contacts/company-info");
  assert.equal(calls[0][1].cache, "no-store");
  assert.equal(calls[0][1].headers, undefined);
  const broken = load("src/utils/companyInfo.ts", config, { fetch: async () => { throw new Error("Offline"); } });
  await assert.rejects(broken.fetchCompanyInfo(), /Offline/);
});
test("shared transport never retries reads or mutations on another backend", async () => {
  const calls = [];
  const api = load("src/utils/api.ts", config, { fetch: async (...args) => { calls.push(args); throw new Error("Offline"); } });
  for (const method of ["GET", "POST"]) await assert.rejects(api.executeFetch("https://chosen.test/api/v1/test", { method }), /Offline/);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(([url]) => url.startsWith("https://chosen.test/")));
});
test("store buttons use current admin configuration and show contact help when unset", () => {
  const { appDownloadLink } = load("src/utils/app-downloads.ts");
  const render = companyInfo => {
    const Page = load("src/components/common/AppStoreLinks.tsx", {
      "@/context/LanguageContext": { useLanguage: () => ({ language: "vi" }) },
      "@/context/CompanyInfoContext": { useCompanyInfo: () => ({ companyInfo }) },
      "@/utils/app-downloads": { appDownloadLink },
      "./AppStoreLinks.module.css": {},
    }).default;
    return renderToStaticMarkup(React.createElement(Page));
  };
  const html = render({ googlePlayUrl: "https://play.google.com/store/apps/details?id=vn.actual.app", appStoreUrl: "https://apps.apple.com/vn/app/actual/id123456789" });
  assert.ok(html.includes('href="https://play.google.com/store/apps/details?id=vn.actual.app"'));
  assert.ok(html.includes('href="https://apps.apple.com/vn/app/actual/id123456789"'));
  const empty = render({});
  assert.ok(empty.includes("/thong-tin/lien-he"));
  assert.ok(!empty.includes('href="https://play.google.com'));
});
