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
function loadPage(path, overrides = {}) {
 const cache = new Map();
 function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  let index = 0;
  const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const require = id => {
   if (id === "react") return { ...React, useState: value => [file === resolve(root, path) && index in overrides ? overrides[index++] : (index++, value), () => {}], useEffect: () => {}, useRef: value => ({ current: value }) };
   if (id === "next/navigation") return { useRouter: () => ({ push() {}, replace() {} }) };
   if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
   if (id === "next/image") return ({ fill, priority, ...props }) => React.createElement("img", props);
   if (id === "@/components/common/Header" || id === "@/components/common/Footer") return () => null;
   if (id === "@/utils/api") return { API_BASE: "https://test.invalid/api/v1" };
   if (id === "@/utils/posting-api") return { postingRequest: () => { throw Error("Unexpected render request"); } };
   if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
   if (id.startsWith("@/") || id.startsWith(".")) {
    const target = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
    return load(target + (existsSync(target + ".tsx") ? ".tsx" : ".ts"));
   }
   return nativeRequire(id);
  };
  vm.runInNewContext("(function(require,module,exports){" + js + "\n})", { console, setTimeout, clearTimeout, fetch, URLSearchParams, AbortSignal, FormData, Headers })(require, module, module.exports);
  return module.exports;
 }
 return load(resolve(root, path)).default;
}
const render = (path, states) => renderToStaticMarkup(React.createElement(loadPage(path, states)));
test("login/register render labelled fields with autofill and correct password semantics", () => {
 const login = render("src/app/login/page.tsx");
 assert.equal((login.match(/<h1/g) || []).length, 1);
 assert.ok(login.includes('autoComplete="username"'));
 assert.ok(login.includes('autoComplete="current-password"'));
 assert.ok(login.includes('aria-label="Hiện mật khẩu"'));
 assert.ok(login.includes('href="/forgot-password"'));
 const register = render("src/app/register/page.tsx");
 assert.ok(register.includes('autoComplete="new-password"'));
 assert.ok(register.includes("Email (không bắt buộc)"));
 assert.ok(register.includes('role="group"'));
 assert.ok(register.includes('aria-pressed="true"'));
});
test("OTP states have numeric keyboards, one-time-code autofill and disabled pending actions", () => {
 const login = render("src/app/login/page.tsx", { 6: true, 7: { userId: "test", phone: "0900000021" }, 9: true });
 assert.ok(login.includes('autoComplete="one-time-code"'));
 assert.ok(login.includes('inputMode="numeric"'));
 assert.ok(login.includes("Đang xác minh"));
 const register = render("src/app/register/page.tsx", { 6: "otp", 8: 35 });
 assert.ok(register.includes('autoComplete="one-time-code"'));
 assert.ok(register.includes("35"));
 assert.ok(register.includes("Hoàn tất đăng ký"));
});
test("orders shows account sign-in, loading and real cards without invented prices or invalid dates", () => {
 const path = "src/components/posting/OrdersWorkspace.tsx";
 assert.ok(render(path, { 1: false, 6: false }).includes('href="/login?next=%2Fdon-cua-ban"'));
 assert.ok(render(path).includes('aria-label="Đang tải danh sách"'));
 const html = render(path, { 0: "chu-hang", 5: [{ id: "order1", orderCode: "ORD-TEST", status: "searching_driver", pickup: { address: "Điểm thực tế A" }, dropoff: { address: "Điểm thực tế B" }, updatedAt: "invalid" }], 6: false });
 assert.ok(html.includes("ORD-TEST"));
 assert.ok(html.includes("Chưa có giá"));
 assert.ok(html.includes("Điểm thực tế A"));
 assert.ok(html.includes("/chu-hang/form-tao-don?order=order1"));
 assert.ok(!html.includes("Invalid Date"));
});

test("all is the default tab and compact cards retain actions and accessible full addresses", () => {
 const path = "src/components/posting/OrdersWorkspace.tsx";
 const html = render(path, { 0: "chu-hang", 5: [{ id: "order1", orderCode: "ORD-ALL", status: "searching_driver", price: 250000, pickup: { address: "Địa chỉ nhận dài đầy đủ" }, dropoff: { address: "Địa chỉ trả dài đầy đủ" } }], 6: false, 9: 31 });
 assert.match(html, /aria-pressed="true"[^>]*disabled=""[^>]*>.*?Tất cả/);
 assert.ok(html.includes("31 đơn"));
 assert.ok(html.includes('title="Địa chỉ nhận dài đầy đủ"'));
 assert.ok(html.includes("Điểm nhận:"));
 assert.ok(html.includes("250.000 đ"));
 assert.ok(html.includes("Xem thông tin"));
 const posts = render(path, { 0: "tai-xe", 5: [{ id: "post1", kind: "post", status: "paused", vehicle: { plateNumber: "POST-01" }, route: { from: "Điểm A", to: "Điểm B" } }], 6: false });
 assert.ok(posts.includes("POST-01"));
 assert.ok(posts.includes("Tạm dừng"));
 assert.ok(!posts.includes("/tracking?code="));
});
