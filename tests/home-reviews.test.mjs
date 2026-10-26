import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(import.meta.dirname, ".."), nativeRequire = createRequire(import.meta.url);
function loader(language = "vi", hooks, globals = {}) {
  function load(filename) {
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const require = id => {
      if (id === "react" && hooks) return { ...React, ...hooks };
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language }) };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith("@/") || id.startsWith(".")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(filename), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return nativeRequire(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + code + "\n})", globals)(require, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}
test("six illustrative review cards render in all languages with an explicit sample label", () => {
  for (const [language, label] of [["vi", "Nội dung tham khảo"], ["en", "Illustrative examples"], ["zh", "参考内容"]]) {
    const load = loader(language);
    const cards = load("src/lib/home-review-examples.ts").getHomeReviewExamples(language);
    assert.equal(cards.length, 6);
    assert.equal(new Set(cards.map(item => item.id)).size, 6);
    assert.ok(cards.every(item => item.isExample === true && item.quote.length > (language === "zh" ? 20 : 40)));
    const Page = load("src/components/sections/ReviewsCarousel.tsx").default;
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.ok(html.includes(label));
    assert.equal((html.match(/<blockquote[ >]/g) || []).length, 6);
    assert.ok(html.includes('aria-roledescription="carousel"'));
    assert.ok(!html.includes("AggregateRating"));
    assert.ok(!html.includes("đã xác thực"));
    for (const card of cards) assert.ok(html.includes(card.quote));
  }
});
test("review arrows, keyboard and scroll position share bounded metrics and clean up listeners", () => {
  const refs = [], effects = [], updates = [], listeners = new Map(), windowListeners = new Map(), scrolls = [];
  let reduced = false, disconnected = false;
  class Observer { constructor(fn) { this.fn = fn; } observe() {} disconnect() { disconnected = true; } }
  const hooks = {
    useRef: value => { const ref = { current: value }; refs.push(ref); return ref; },
    useState: initial => { const index = updates.length; updates.push([]); return [initial, value => updates[index].push(value)]; },
    useEffect: fn => effects.push(fn),
  };
  const window = { matchMedia: () => ({ matches: reduced }), addEventListener: (name, fn) => windowListeners.set(name, fn), removeEventListener: name => windowListeners.delete(name) };
  const Page = loader("vi", hooks, { window, ResizeObserver: Observer })("src/components/sections/ReviewsCarousel.tsx").default;
  const tree = Page();
  const element = { clientWidth: 944, scrollWidth: 1910, scrollLeft: 0, children: [{ offsetLeft: 0 }, { offsetLeft: 322 }],
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
    scrollTo: options => scrolls.push(options) };
  refs[0].current = element;
  const cleanup = effects[0]();
  const next = tree.props.children[0].props.children[1].props.children[1];
  next.props.onClick();
  assert.equal(scrolls.at(-1).left, 966);
  assert.equal(scrolls.at(-1).behavior, "smooth");
  reduced = true;
  tree.props.children[1].props.onKeyDown({ key: "End", preventDefault() {} });
  assert.equal(scrolls.at(-1).left, 966);
  assert.equal(scrolls.at(-1).behavior, "auto");
  tree.props.children[1].props.onKeyDown({ key: "Home", preventDefault() {} });
  assert.equal(scrolls.at(-1).left, 0);
  element.scrollLeft = 966; listeners.get("scroll")();
  assert.equal(updates[0].at(-1), 1);
  cleanup();
  assert.equal(disconnected, true);
  assert.equal(listeners.size, 0);
  assert.equal(windowListeners.size, 0);
});
test("review styles are responsive, stay at bold and use no autoplay timers", () => {
  const source = readFileSync(resolve(root, "src/components/sections/ReviewsCarousel.tsx"), "utf8");
  const css = readFileSync(resolve(root, "src/components/sections/ReviewsCarousel.module.css"), "utf8");
  for (const [, name] of source.matchAll(/\bs\.(\w+)/g)) assert.match(css, new RegExp("\\." + name + "(?![\\w-])"));
  assert.ok(css.includes("scroll-snap-type:x mandatory"));
  assert.ok(css.includes("max-width:1000px"));
  assert.ok(css.includes("max-width:600px"));
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.doesNotMatch(css, /font-weight:\s*(?:800|900)/);
  assert.doesNotMatch(source, /setInterval|requestAnimationFrame/);
});
