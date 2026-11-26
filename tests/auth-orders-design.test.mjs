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
 const register = render("src/app/register/page.tsx", { 7: "otp", 9: 35 });
 assert.ok(register.includes('autoComplete="one-time-code"'));
 assert.ok(register.includes("35"));
 assert.ok(register.includes("Hoàn tất đăng ký"));
});

test('affiliate sign-in and signup have dedicated routes, copy and navigation without vehicle role selection', () => {
 const login = render('src/app/doi-tac/dang-nhap/page.tsx');
 const signup = render('src/app/doi-tac/dang-ky/page.tsx');
 for (const html of [login, signup]) {
  assert.ok(html.includes('TXE PRO AFFILIATE'));
  assert.ok(html.includes('href="/doi-tac/dang-nhap"'));
  assert.ok(html.includes('href="/doi-tac/dang-ky"'));
  assert.ok(!html.includes('href="/register"'));
  assert.ok(!html.includes('role="group"'));
  assert.ok(!html.includes('Một tài khoản.'));
 }
 assert.ok(login.includes('Đăng nhập đối tác'));
 assert.ok(login.includes('autoComplete="current-password"'));
 assert.ok(signup.includes('Đăng ký đối tác TXE PRO'));
 assert.ok(signup.includes('autoComplete="new-password"'));
 assert.ok(!signup.includes('id="referralCode"'));
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

test("affiliate login rejects internal admin/attendance staff and custom admin roles never escalate to super_admin", () => {
 const mod = (() => {
  const cache = new Map();
  function load(file) {
   if (cache.has(file)) return cache.get(file).exports;
   const module = { exports: {} }; cache.set(file, module);
   const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
   const req = id => {
    if (id.startsWith("@/") || id.startsWith(".")) {
     const target = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
     return load(target + (existsSync(target + ".tsx") ? ".tsx" : ".ts"));
    }
    return nativeRequire(id);
   };
   vm.runInNewContext("(function(require,module,exports){" + js + "\n})", {}, { filename: file })(req, module, module.exports);
   return module.exports;
  }
  return load(resolve(root, "src/utils/admin-access.ts"));
 })();

 const blocked = mod.resolvePostLoginDestination({
  userRole: "admin",
  affiliate: true,
  adminRole: "nh_n_vi_n",
  adminPermissions: ["/admin/attendance"],
 });
 assert.ok(blocked.blockedError);
 assert.equal(blocked.targetRoute, undefined);

 const partner = mod.resolvePostLoginDestination({ userRole: "tai-xe", affiliate: true });
 assert.equal(partner.blockedError, undefined);
 assert.equal(partner.targetRoute, "/doi-tac");

 const standalonePartner = mod.resolvePostLoginDestination({ userRole: "doi-tac", affiliate: false, next: "/user" });
 assert.equal(standalonePartner.blockedError, undefined);
 assert.equal(standalonePartner.targetRoute, "/doi-tac");

 const staff = mod.resolvePostLoginDestination({
  userRole: "admin",
  affiliate: false,
  adminRole: "nh_n_vi_n",
  adminPermissions: ["/admin/attendance"],
 });
 assert.equal(staff.targetRoute, "/admin/attendance");

 assert.deepEqual(
  Array.from(mod.resolveEffectiveAdminPermissions({ adminRole: "nh_n_vi_n", sessionPermissions: ["/admin/attendance"] })),
  ["/admin/attendance"]
 );
 assert.deepEqual(
  Array.from(mod.resolveEffectiveAdminPermissions({ adminRole: "", sessionPermissions: [] })),
  []
 );
 assert.equal(mod.resolveAdminRoleDisplay("nh_n_vi_n").shortLabel, "Nhân sự");
 assert.deepEqual(
  Array.from(mod.resolveEffectiveAdminPermissions({ adminRole: "super_admin", sessionPermissions: [] })),
  ["*"]
 );
});

test("admin path access and notification filtering strictly enforce role permissions", () => {
 const mod = (() => {
  const cache = new Map();
  function load(file) {
   if (cache.has(file)) return cache.get(file).exports;
   const module = { exports: {} }; cache.set(file, module);
   const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
   const req = id => {
    if (id.startsWith("@/") || id.startsWith(".")) {
     const target = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
     return load(target + (existsSync(target + ".tsx") ? ".tsx" : ".ts"));
    }
    return nativeRequire(id);
   };
   vm.runInNewContext("(function(require,module,exports){" + js + "\n})", {}, { filename: file })(req, module, module.exports);
   return module.exports;
  }
  return load(resolve(root, "src/utils/admin-access.ts"));
 })();

 // Attendance-only staff cannot access /admin/settings or /admin/notifications, only /admin/attendance & /admin/profile
 assert.equal(mod.canAccessAdminPath("/admin/settings", "nh_n_vi_n", ["/admin/attendance"]), false);
 assert.equal(mod.canAccessAdminPath("/admin/notifications", "nh_n_vi_n", ["/admin/attendance"]), false);
 assert.equal(mod.canAccessAdminPath("/admin/attendance", "nh_n_vi_n", ["/admin/attendance"]), true);
 assert.equal(mod.canAccessAdminPath("/admin/profile", "nh_n_vi_n", ["/admin/attendance"]), true);

 // "/admin" (dashboard overview) must NOT leak access to sibling "/admin/settings", "/admin/team", "/admin/logs"
 const opsPerms = ["/admin", "/admin/notifications", "/admin/orders", "/admin/users"];
 assert.equal(mod.canAccessAdminPath("/admin", "operations", opsPerms), true);
 assert.equal(mod.canAccessAdminPath("/admin/orders/drivers", "operations", opsPerms), true);
 assert.equal(mod.canAccessAdminPath("/admin/settings", "operations", opsPerms), false);
 assert.equal(mod.canAccessAdminPath("/admin/team", "operations", opsPerms), false);
 assert.equal(mod.canAccessAdminPath("/admin/logs", "operations", opsPerms), false);

 // Super admin has full access
 assert.equal(mod.canAccessAdminPath("/admin/settings", "super_admin", []), true);
 assert.equal(mod.canAccessAdminPath("/admin/notifications", "super_admin", []), true);

 const sampleFeed = [
  { id: "1", type: "user_registered", link: "/admin/users", read: false },
  { id: "2", type: "kyc_pending", link: "/admin/users", read: false },
  { id: "3", type: "order_cancelled", link: "/admin/orders", read: false },
  { id: "4", type: "support_ticket", link: "/admin/support?tab=tickets&ticketId=t1", read: false },
  { id: "5", type: "chat", link: "/admin/support?tab=chats&chatId=c1", read: false },
  { id: "6", type: "system", link: "", read: false },
  { id: "7", type: "system", link: "/admin/settings", read: false },
 ];

 // Attendance-only staff (no /admin/notifications) sees zero notifications
 assert.deepEqual(
  Array.from(mod.filterAdminNotifications(sampleFeed, "nh_n_vi_n", ["/admin/attendance"])).map((n) => n.id),
  []
 );

 // KYC officer sees user_registered, kyc_pending, and general system broadcast (not orders/support/settings)
 assert.deepEqual(
  Array.from(
   mod.filterAdminNotifications(sampleFeed, "kyc_officer", ["/admin/notifications", "/admin/users", "/admin/attendance"])
  ).map((n) => n.id),
  ["1", "2", "6"]
 );

 // CSKH sees support_ticket, chat, and general system broadcast
 assert.deepEqual(
  Array.from(
   mod.filterAdminNotifications(sampleFeed, "cskh", ["/admin/notifications", "/admin/support", "/admin/attendance"])
  ).map((n) => n.id),
  ["4", "5", "6"]
 );

 // Accountant sees order_cancelled and general system broadcast
 assert.deepEqual(
  Array.from(
   mod.filterAdminNotifications(sampleFeed, "accountant", ["/admin/notifications", "/admin/orders", "/admin/analytics"])
  ).map((n) => n.id),
  ["3", "6"]
 );

 // Super admin sees all notifications including settings-linked alerts
 assert.deepEqual(
  Array.from(mod.filterAdminNotifications(sampleFeed, "super_admin", [])).map((n) => n.id),
  ["1", "2", "3", "4", "5", "6", "7"]
 );
});
