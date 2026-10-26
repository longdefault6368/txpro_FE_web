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
const nativeRequire = createRequire(import.meta.url);
function loader(language = "vi", hooks, globals = {}) {
  const cache = new Map();
  const load = filename => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (id === "react" && hooks) return { ...React, ...hooks };
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language, changeLanguage: () => {} }) };
      if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (id === "next/image") return ({ priority, ...props }) => React.createElement("img", props);
      if (id === "next/navigation") return { usePathname: () => "/", useRouter: () => ({ push: () => {} }) };
      if (id === "@/config/env") return { API_BASE: "https://chosen.test/api/v1" };
      if (id === "@/components/account/RoleSwitchButton") return () => null;
      if (id === "@/utils/account-role-switch") return { ROLE_CHANGED_KEY: "role-changed" };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".")) {
        const path = resolve(dirname(filename), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return nativeRequire(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + code + "\n})", globals, { filename })(localRequire, module, module.exports);
    return module.exports;
  };
  return path => load(resolve(root, path));
}
test("header keeps services and uniform tracking without standalone role or guide links", () => {
  for (const [lang, services, tracking] of [["vi", "Dịch vụ", "Theo dõi đơn hàng"], ["en", "Services", "Track an order"], ["zh", "服务", "订单追踪"]]) {
    const Header = loader(lang)("src/components/common/Header.tsx").default;
    const html = renderToStaticMarkup(React.createElement(Header));
    assert.ok(html.includes("<summary"));
    assert.ok(html.includes(services));
    assert.ok(html.includes(tracking));
    assert.equal((html.match(/href="\/tracking"/g) || []).length, 1);
    assert.equal((html.match(/href="\/chu-hang\/form-tao-don"/g) || []).length, 1);
    assert.equal((html.match(/href="\/tai-xe\/dang-tin"/g) || []).length, 1);
    assert.ok(!html.includes('href="/#for-you"'));
    const trackingClass = html.match(/<a href="\/tracking" class="([^"]+)"/)?.[1];
    const newsClass = html.match(/<a href="\/tin-tuc" class="([^"]+)"/)?.[1];
    assert.ok(trackingClass);
    assert.equal(trackingClass, newsClass);
    assert.ok(html.includes('href="/login"'));
    assert.ok(html.includes('href="/dang-tin"'));
  }
});
test("services opens on hover, keeps focused links usable and closes on Escape or outside click", () => {
  const listeners = new Map();
  const ref = { current: null }, effects = [];
  class FakeNode {}
  const inside = new FakeNode(), outside = new FakeNode();
  let focused = false;
  const summary = { focus: () => { focused = true; } };
  const details = { open: false, contains: node => node === inside, querySelector: () => summary };
  const document = { activeElement: null, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const Menu = loader("vi", { useRef: () => ref, useEffect: fn => effects.push(fn) }, { Node: FakeNode, document })("src/components/common/ServicesDropdown.tsx").default;
  let navigated = 0;
  const tree = Menu({ label: "Dịch vụ", items: [{ href: "/chu-hang/form-tao-don", label: "Tìm xe", description: "Tìm phương tiện" }, { href: "/tai-xe/dang-tin", label: "Đăng xe trống", description: "Đăng phương tiện" }], onNavigate: () => navigated++ });
  ref.current = details;
  const cleanup = effects[0]();
  tree.props.onMouseEnter({ currentTarget: details }); assert.equal(details.open, true);
  document.activeElement = inside;
  tree.props.onMouseLeave({ currentTarget: details }); assert.equal(details.open, true);
  document.activeElement = null;
  tree.props.onMouseLeave({ currentTarget: details }); assert.equal(details.open, false);
  details.open = true;
  tree.props.onKeyDown({ key: "Escape", currentTarget: details, preventDefault() {}, stopPropagation() {} });
  assert.equal(details.open, false); assert.equal(focused, true);
  details.open = true; listeners.get("pointerdown")({ target: outside }); assert.equal(details.open, false);
  details.open = true;
  const links = tree.props.children[1].props.children.props.children;
  links[0].props.onClick();
  assert.equal(details.open, false); assert.equal(navigated, 1);
  cleanup(); assert.equal(listeners.size, 0);
});
test("mobile services remains a native tap disclosure instead of opening on hover", () => {
  const Menu = loader("vi", { useRef: () => ({ current: null }), useEffect: () => {} })("src/components/common/ServicesDropdown.tsx").default;
  const tree = Menu({ label: "Dịch vụ", items: [], mobile: true });
  const details = { open: false };
  tree.props.onMouseEnter({ currentTarget: details });
  assert.equal(details.open, false);
  assert.equal(tree.type, "details");
  assert.equal(tree.props.children[0].type, "summary");
});
