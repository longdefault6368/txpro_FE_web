import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");
const sections = resolve(root, "src/components/sections");

// Render-only checks, not a substitute for responsive browser / interaction QA.
function renderLanding(language = "vi", role = "shipper", feature = 0) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = id => {
      if (id === "react") return { ...React, useState: value => [value === "shipper" ? role : filename === resolve(sections, "LandingExperience.tsx") && value === 0 ? feature : value, () => {}] };
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language }) };
      if (id === "@/config/env") return { API_BASE: "http://news.test/api/v1", API_BASE_URL: "http://news.test" };
      if (id === "@/utils/posting-api") return { postingRequest: () => { throw new Error("Unexpected API call during render"); } };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (id === "next/navigation") return { useRouter: () => ({ push: () => {} }) };
      if (id === "next/image") return ({ fill, priority, ...props }) => React.createElement("img", props);
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(filename), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + code + "\n})", {}, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  const Page = load(resolve(sections, "LandingExperience.tsx")).default;
  return renderToStaticMarkup(React.createElement(Page));
}

test("landing hero retains translated actions and illustration accessibility without visible disclaimer", () => {
  for (const [language, label, title] of [
    ["vi", "Trải nghiệm TXE PRO", "Tìm xe ngay"],
    ["en", "The TXE PRO experience", "Find a vehicle"],
    ["zh", "TXE PRO 体验", "立即找车"],
  ]) {
    const html = renderLanding(language);
    assert.ok(html.includes(label), language);
    assert.ok(html.includes(title), language);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(html.includes('href="/chu-hang/form-tao-don"'));
    assert.ok(html.includes('href="/tai-xe/dang-tin"'));
  }
});

test("removed role section stays absent while posting actions and the guide anchor remain", () => {
  for (const language of ["vi", "en", "zh"]) {
    const html = renderLanding(language);
    assert.doesNotMatch(html, /Hai vai trò|Một kết nối tốt hơn|Two roles|One better connection|两种角色|更好的连接/);
    assert.ok(!html.includes('class="roleTabs"'));
    assert.ok(html.includes('href="/chu-hang/form-tao-don"'));
    assert.ok(html.includes('href="/tai-xe/dang-tin"'));
    assert.ok(html.includes('id="for-you"'));
    assert.ok(html.includes('id="reviews"'));
  }
});

test("every local image rendered by the landing exists", () => {
  for (const role of ["shipper", "driver"]) {
    for (const [, src] of renderLanding("vi", role).matchAll(/<img[^>]* src="([^"]+)"/g)) {
      assert.ok(existsSync(resolve(root, "public", src.slice(1))), src);
    }
  }
});

test("quick actions keep four exact destinations and fully clickable cards in every language", () => {
  for (const [language, title] of [["vi", "Bạn muốn làm gì hôm nay?"], ["en", "What’s your next move?"], ["zh", "今天想做什么？"]]) {
    const html = renderLanding(language);
    const section = html.match(/<section[^>]*id="quick-actions"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, language); assert.ok(section.includes(title));
    const targets = [...section.matchAll(/<a[^>]+href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(targets, ["/chu-hang/form-tao-don", "/tai-xe/dang-tin", "/don-cua-ban", "/tracking"]);
    assert.equal((section.match(/<h3/g) || []).length, 4);
    assert.equal((section.match(/<img/g) || []).length, 2);
    assert.doesNotMatch(section, /<button|<form|tabindex="-1"/);
  }
  const source = readFileSync(resolve(sections, "HomeQuickActions.tsx"), "utf8");
  assert.doesNotMatch(source, /fetch\(|postingRequest|localStorage|setInterval|onClick/);
});

test("quick action styles are complete, responsive and respect bold and reduced motion", () => {
  const source = readFileSync(resolve(sections, "HomeQuickActions.tsx"), "utf8");
  const css = readFileSync(resolve(sections, "HomeQuickActions.module.css"), "utf8");
  for (const [, name] of source.matchAll(/\bs\.(\w+)/g)) assert.match(css, new RegExp("\\." + name + "(?![\\w-])"));
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*650px\)[^{]*\{[^]*?\.grid,\s*\.tools\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /prefers-reduced-motion/); assert.match(css, /focus-visible/);
  assert.match(css, /\.art[^}]+pointer-events:\s*none/);
});

test("quick action text remains readable on both primary card surfaces", () => {
  const css = readFileSync(resolve(sections, "HomeQuickActions.module.css"), "utf8");
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(value => { const n = parseInt(value, 16) / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; });
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const bodyColor = css.match(/\.section \.copy p\s*\{[^}]*color:\s*(#[\da-f]{6})/)?.[1];
  assert.ok(bodyColor);
  for (const background of ["#125dce", "#12485f"]) {
    const [light, dark] = [luminance(bodyColor), luminance(background)].sort((a, b) => b - a);
    assert.ok((light + .05) / (dark + .05) >= 4.5, background);
  }
});

test("removed homepage copy and three-step section stay absent in every language", () => {
  for (const language of ["vi", "en", "zh"]) {
    const html = renderLanding(language);
    assert.doesNotMatch(html, /Bước này chỉ lưu tạm|browser draft for 1 hour|本步骤仅在浏览器|Không hiển thị số điện thoại|No phone numbers|不展示电话/);
    assert.doesNotMatch(html, /Sẵn sàng trong 3 bước|Get going in 3 steps|三步即可出发|id="how-it-works"/);
    assert.doesNotMatch(html, /Minh họa trải nghiệm TXE PRO|Không phải ảnh chụp màn hình ứng dụng|Not an app screenshot|非应用截图/);
    assert.doesNotMatch(html, /01 \/|Hành trình bắt đầu từ bạn|Your journey starts here|旅程从您开始|Chỉ hồ sơ tự nguyện công khai/);
  }
  const header = readFileSync(resolve(root, "src/components/common/Header.tsx"), "utf8");
  assert.doesNotMatch(header, /#how-it-works/);
  const posting = readFileSync(resolve(root, "src/components/posting/PostingWorkspace.tsx"), "utf8");
  assert.doesNotMatch(posting, /Thông tin môi trường kết nối|<details className=\{w.environment\}/);
});

test("homepage typography stops at bold and supports reduced motion", () => {
  for (const name of ["LandingExperience.module.css", "HeroShowcase.module.css"]) {
    const css = readFileSync(resolve(sections, name), "utf8");
    for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700, name + ": " + weight);
    assert.ok(css.includes("prefers-reduced-motion"), name);
  }
  const header = readFileSync(resolve(root, "src/components/common/Header.tsx"), "utf8");
  assert.ok(!/font-(extrabold|black)/.test(header));
  const heroCss = readFileSync(resolve(sections, "HeroShowcase.module.css"), "utf8");
  assert.ok(heroCss.includes(".screen .screenTitle"), "phone heading must override page heading size regardless of CSS chunk order");
});

test("every referenced homepage CSS module class has a definition", () => {
  for (const name of ["LandingExperience", "HeroShowcase"]) {
    const source = readFileSync(resolve(sections, name + ".tsx"), "utf8");
    const css = readFileSync(resolve(sections, name + ".module.css"), "utf8");
    const classes = new Set([...source.matchAll(/styles\.(\w+)/g)].map(match => match[1]));
    for (const className of classes) assert.match(css, new RegExp("\\." + className + "(?![\\w-])"), name + ": " + className);
  }
});

test("experience shows the corresponding app interface instead of a vehicle banner in every language", () => {
  for (const language of ["vi", "en", "zh"]) for (let feature = 0; feature < 3; feature++) {
    const html = renderLanding(language, "shipper", feature);
    const section = html.match(/<section[^>]*id="features"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section);
    assert.match(section, /class="phone"/); assert.doesNotMatch(section, /src="\/splash1.png"|class="experienceImage"/);
    assert.equal((section.match(/aria-pressed="true"/g) || []).length, 1);
    const selectedScreen = feature === 0 ? 'class="search"' : feature === 1 ? 'class="tracking"' : 'class="chat"';
    assert.ok(section.includes(selectedScreen), language + ': ' + feature);
    assert.doesNotMatch(section, /[Mm]inh họa|Hồ sơ mẫu|[Dd]emo|Illustration|Sample profile|示意图|示例资料/);
    assert.doesNotMatch(section, /<input|<form|<textarea/);
  }
  const source = readFileSync(resolve(sections, "AppFeaturePreview.tsx"), "utf8");
  assert.doesNotMatch(source, /fetch\(|postingRequest|setInterval|navigator\.|localStorage|onClick/);
});

test("app interface styles are complete, contain screen geometry and respect reduced motion", () => {
  const source = readFileSync(resolve(sections, "AppFeaturePreview.tsx"), "utf8");
  const css = readFileSync(resolve(sections, "AppFeaturePreview.module.css"), "utf8");
  for (const [, name] of source.matchAll(/\bs\.(\w+)/g)) assert.match(css, new RegExp("\\." + name + "(?![\\w-])"));
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.match(css, /\.phone\s*\{[^}]*max-width:\s*285px/);
  assert.match(css, /\.screen\s*\{[^}]*height:\s*500px[^}]*overflow:\s*hidden/);
  assert.match(css, /prefers-reduced-motion/);
});

test("fill images stay inside positioned, dimensioned wrappers instead of covering the page", () => {
  for (const [file, className] of [["LandingExperience", "experienceImage"], ["LandingExperience", "roleVisual"], ["HeroShowcase", "photo"]]) {
    const css = readFileSync(resolve(sections, file + ".module.css"), "utf8");
    const blocks = [...css.matchAll(new RegExp("\\." + className + "\\s*\\{([^}]+)\\}", "g"))].map(match => match[1]).join(";");
    assert.match(blocks, /position:\s*relative|position:\s*absolute/, className + " must contain the fill image");
    assert.match(blocks, /(?:aspect-ratio|min-height|height):\s*[^;]+/, className + " must reserve space before loading");
    assert.match(blocks, /overflow:\s*hidden/, className + " must clip its own image");
  }
});

test("app download layout has a bounded responsive grid and a contained phone illustration", () => {
  const css = readFileSync(resolve(sections, "LandingExperience.module.css"), "utf8");
  assert.match(css, /\.appDownload\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.appPhone\s*\{[^}]*max-width:\s*\d+px/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[^{]*\{\s*\.appDownload\s*\{[^}]*grid-template-columns:\s*1fr/);
});
