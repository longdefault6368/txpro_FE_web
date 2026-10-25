import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(import.meta.dirname, ".."), require = createRequire(import.meta.url);
function modules(overrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi" }) };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + js + "\n})", {})(localRequire, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}
const time = modules()("src/utils/posting-time.ts");
const now = new Date(2026, 9, 25, 10, 0).getTime();
const future = "2026-10-25T11:00";
test("local wall-clock selection roundtrips without a UTC offset shift", () => {
  const date = new Date(2026, 9, 25, 11, 30);
  assert.equal(time.localPostingTime(date), "2026-10-25T11:30");
  assert.equal(time.validPostingTime("2026-10-25T11:30"), true);
  assert.equal(new Date(time.localPostingTime(date)).getTime(), date.getTime());
});
test("picker rejects missing, impossible dates and invalid time values", () => {
  for (const input of ["", "invalid", "2026-02-30T10:00", "2026-10-25T24:00", "2026-10-25T11:99", "2026-13-25T11:00"]) {
    assert.equal(time.pickedTimeError(input, { now }), "invalid", input);
  }
  assert.equal(time.validPostingTime("2028-02-29T10:00"), true);
});
test("scheduled pickup must be future; end time must strictly follow the selected start", () => {
  assert.equal(time.pickedTimeError("2026-10-25T09:00", { requireFuture: true, now }), "past");
  assert.equal(time.pickedTimeError(future, { requireFuture: true, now }), "");
  assert.equal(time.pickedTimeError(future, { min: future, now }), "min");
  assert.equal(time.pickedTimeError("2026-10-25T10:30", { min: future, now }), "min");
  assert.equal(time.pickedTimeError("2026-10-25T12:00", { min: future, now }), "");
});
test("opening an empty picker suggests a valid time without modifying the controlled value", () => {
  assert.equal(time.initialPostingTime("", "", now), future);
  assert.equal(time.initialPostingTime("", future, now), "2026-10-25T12:00");
  assert.equal(time.initialPostingTime("2026-10-26T18:30", "", now), "2026-10-26T18:30");
});
function nodes(value) { return !value || typeof value !== "object" ? [] : [value, ...React.Children.toArray(value.props?.children).flatMap(nodes)]; }
function fixture(props = {}) {
  const state = [], changed = [];
  let cursor = 0, tree;
  const react = { ...React,
    useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; },
    useId() { return "time-test"; },
  };
  const View = modules({ react })("src/components/posting/PostingTimeField.tsx").default;
  function render() { cursor = 0; tree = View({ label: "Thời gian", value: future, onChange: value => changed.push(value), ...props }); }
  render();
  return { changed, render, nodes: () => nodes(tree),
    open() { nodes(tree).find(node => node.props?.["aria-haspopup"] === "dialog").props.onClick(); render(); },
    button(className) { return nodes(tree).find(node => node.type === "button" && node.props.className === className); },
    dialog() { return nodes(tree).find(node => node.props?.onClose); },
  };
}
test("clicking opens picker with stored date/time; cancel does not commit changes", () => {
  const f = fixture(); f.open();
  assert.equal(f.nodes().find(node => node.props?.type === "date").props.value, "2026-10-25");
  assert.equal(f.nodes().find(node => node.props?.type === "time").props.value, "11:00");
  f.nodes().find(node => node.props?.type === "time").props.onChange({ target: { value: "12:30" } });
  f.render(); f.dialog().props.onClose(); f.render();
  assert.equal(f.changed.length, 0);
  assert.equal(f.dialog(), undefined);
  f.open();
  assert.equal(f.nodes().find(node => node.props?.type === "time").props.value, "11:00");
});
test("confirm commits exactly the chosen local time; there is no nested form or submit button", () => {
  const f = fixture(); f.open();
  f.nodes().find(node => node.props?.type === "date").props.onChange({ target: { value: "2026-10-26" } });
  f.nodes().find(node => node.props?.type === "time").props.onChange({ target: { value: "18:45" } });
  f.render(); f.button("confirm").props.onClick(); f.render();
  assert.equal(f.changed[0], "2026-10-26T18:45");
  assert.equal(f.nodes().filter(node => node.type === "form" || node.props?.type === "submit").length, 0);
});
test("invalid end time stays open with a short warning and no committed change", () => {
  const f = fixture({ min: future }); f.open();
  f.button("confirm").props.onClick(); f.render();
  assert.equal(f.changed.length, 0);
  assert.ok(f.dialog());
  assert.equal(f.nodes().find(node => node.props?.role === "alert").props.children, "Giờ kết thúc phải sau giờ bắt đầu.");
});
test("Now is available only for shipper mode and commits an empty schedule", () => {
  const f = fixture({ value: "", allowNow: true }); f.open();
  f.button("nowButton").props.onClick(); f.render();
  assert.equal(f.changed[0], "");
  const driver = fixture(); driver.open();
  assert.equal(driver.button("nowButton"), undefined);
});
test("time field reuses the exact vehicle trigger class and 66px sizing in all languages", () => {
  for (const language of ["vi", "en", "zh"]) {
    const View = modules({ "@/context/LanguageContext": { useLanguage: () => ({ language }) } })("src/components/posting/PostingTimeField.tsx").default;
    const html = renderToStaticMarkup(React.createElement(View, { label: "Time", value: future, onChange() {} }));
    assert.ok(html.includes('class="trigger"'));
    assert.ok(html.includes('aria-haspopup="dialog"'));
    assert.ok(!html.includes("<input"));
    assert.ok(html.includes(time.postingTimeDisplay(future, language)));
  }
  const fieldCss = readFileSync(resolve(root, "src/components/posting/CatalogPicker.module.css"), "utf8");
  assert.match(fieldCss, /\.trigger\{[^}]*min-height:66px/);
  const picker = readFileSync(resolve(root, "src/components/posting/PostingTimeField.tsx"), "utf8");
  assert.ok(picker.includes('import catalog from "./CatalogPicker.module.css"'));
});
