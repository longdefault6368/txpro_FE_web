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
const schemas = await import(new URL("../../../BE/txepro-backend/server/src/validators/auth.validator.js", import.meta.url));
class PostingError extends Error { constructor(message, code, details, uncertain) { super(message); Object.assign(this, { code, details, uncertain }); } }
function loader(overrides = {}, globals = {}) {
 const cache = new Map();
 const load = file => {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = id => {
   if (id in overrides) return overrides[id];
   if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
   if (id === "next/image") return ({ unoptimized, ...props }) => React.createElement("img", props);
   if (id === "@/components/common/Header" || id === "@/components/common/Footer") return () => null;
   if (id === "./RoleSwitchButton") return () => null;
   if (id === "@/components/posting/CatalogPicker") return { PickerDialog: ({ title, children }) => React.createElement("section", { "aria-label": title }, children) };
   if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi", changeLanguage() {} }) };
   if (id === "@/utils/posting-api") return { PostingError, postingRequest: () => { throw new Error("Unexpected request"); } };
   if (id === "@/utils/media") return { getServerMediaUrl: value => value || null };
   if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
   if (id.startsWith("@/") || id.startsWith(".")) { const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id); return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts")); }
   return require(id);
  };
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", { FormData, AbortController, AbortSignal, Event, ...globals }, { filename: file })(localRequire, module, module.exports);
  return module.exports;
 };
 return path => load(resolve(root, path));
}
const account = loader()("src/utils/account-profile.ts");
test("account mutations match backend OTP contracts; generic profile PATCH never changes identity", () => {
 for (const [action, value, schema] of [["name", "Tên mới", "nameUpdateOtpSchema"], ["email", "TEST@EXAMPLE.COM", "emailUpdateOtpSchema"], ["phone", "", "phoneUpdateOtpSchema"], ["password", "", "passwordChangeOtpSchema"]]) {
  const request = account.accountActionRequest(action, value);
  assert.equal(schemas[schema].validate(request.body).error, undefined);
  assert.notEqual(request.path, "/auth/profile");
 }
 assert.equal(account.accountActionRequest("email", " TEST@EXAMPLE.COM ").body.email, "test@example.com");
 const phone = account.accountActionRequest("phone", "0912345678", "proof");
 assert.equal(schemas.phoneUpdateOtpSchema.validate(phone.body).error, undefined);
 assert.equal(phone.body.verificationToken, "proof");
 assert.throws(() => account.accountActionRequest("email", ""));
 assert.throws(() => account.accountActionRequest("name", "<bad>"));
});
test("verification requires exact email challenge, both phone steps and current password", () => {
 const challenge = { destination: "test@example.com", challengeId: "3dd4ab4c-22e7-4af0-a8f6-7a9c9bcff012" };
 const email = account.accountActionVerification("email", "test@example.com", "123456", challenge);
 assert.equal(schemas.emailUpdateVerifySchema.validate(email.body).error, undefined);
 assert.throws(() => account.accountActionVerification("email", "other@example.com", "123456", challenge));
 assert.throws(() => account.accountActionVerification("email", "test@example.com", "123456", {}));
 for (const challenge of [{}, { verificationToken: "proof" }]) {
  const phone = account.accountActionVerification("phone", "0912345678", "123456", challenge);
  assert.equal(schemas.phoneUpdateVerifySchema.validate(phone.body).error, undefined);
 }
 const password = account.accountActionVerification("password", "", "123456", {}, { currentPassword: "oldPassword", newPassword: "newPassword", confirmPassword: "newPassword" });
 assert.equal(schemas.passwordChangeVerifySchema.validate(password.body).error, undefined);
 assert.throws(() => account.accountActionVerification("password", "", "123456", {}, { currentPassword: "", newPassword: "newPassword", confirmPassword: "newPassword" }));
 assert.throws(() => account.accountActionVerification("name", "Tên mới", "123", {}));
});
test("missing wallet values stay unknown; a real zero stays zero", () => {
 assert.equal(account.accountMoney(undefined), "Chưa có dữ liệu");
 assert.equal(account.accountMoney(NaN), "Chưa có dữ liệu");
 assert.equal(account.accountMoney(-1), "Chưa có dữ liệu");
 assert.equal(account.accountMoney(0), "0 đ");
 assert.equal(account.accountMoney(125000), "125.000 đ");
});
const profile = { id: "account-one", name: "Tài khoản thử nghiệm", phone: "0912345678", email: "test@example.com", role: "tai-xe", isActive: true, isPhoneVerified: false, isEmailVerified: false, kycStatus: "verified", referralCode: "REF-TEST" };
function workspaceMarkup(tab = "profile", overrides = {}) {
 let cursor = 0;
 const react = { ...React, useState(initial) { const index = cursor++; return [index === 0 ? { ...profile, ...overrides } : index === 1 ? false : index === 4 ? tab : typeof initial === "function" ? initial() : initial, () => {}]; }, useEffect() {}, useRef: value => ({ current: value }) };
 const View = loader({ react })("src/components/account/AccountWorkspace.tsx").default;
 return renderToStaticMarkup(React.createElement(View));
}
test("account routes users to the new orders page and never treats a phone number as verified", () => {
 const html = workspaceMarkup();
 assert.ok(html.includes('href="/don-cua-ban"'));
 assert.ok(html.includes('href="/tai-xe/phuong-tien"'));
 assert.ok(html.includes('data-verified="false"'));
 assert.ok(!html.includes('data-verified="true"'));
 assert.ok(html.includes("Xác minh"));
 assert.ok(!html.includes("Phân tích &amp; Thống kê"));
 assert.ok(!html.includes("<table"));
 assert.ok(!html.includes("Doanh thu"));
 assert.ok(workspaceMarkup("profile", { isPhoneVerified: true }).includes('data-verified="true"'));
});
test("wallet loading is separate from zero balances and security actions require explicit opening", () => {
 const html = workspaceMarkup("benefits");
 assert.ok(html.includes('aria-label="Đang tải ví"'));
 assert.ok(!html.includes("0 đ"));
 assert.ok(!html.includes("Tổng thu"));
 assert.ok(workspaceMarkup("security").includes("Đổi mật khẩu"));
});
function nodes(tree) { return !tree || typeof tree !== "object" ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }
function dialogFixture(action, request) {
 let cursor = 0, tree; const state = [], saved = [], values = new Map([["txpro_user_session", "same-session"]]);
 const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
 const react = { ...React, useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], next => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; }, useEffect() {}, useRef(initial) { const index = cursor++; return state[index] ?? (state[index] = { current: initial }); } };
 const View = loader({ react, "@/utils/posting-api": { postingRequest: request, PostingError } }, { localStorage: storage })("src/components/account/AccountChangeDialog.tsx").default;
 const render = () => { cursor = 0; tree = View({ action, profile, onClose() {}, onSaved: user => saved.push(user) }); };
 render();
 return { render, saved, values, nodes: () => nodes(tree), submit: async () => { const form = nodes(tree).find(node => node.type === "form"); form.props.onSubmit({ preventDefault() {} }); await new Promise(resolve => setImmediate(resolve)); render(); }, input: index => nodes(tree).filter(node => node.type === "input")[index] };
}
test("existing unverified email can request a challenge and only updates after OTP", async () => {
 const calls = [];
 const fixture = dialogFixture("email", async (path, options) => {
  calls.push([path, JSON.parse(options.body)]);
  return path.endsWith("email-otp") ? { destination: profile.email, challengeId: "email-challenge", resendAfterSeconds: 60 } : { user: { ...profile, isEmailVerified: true } };
 });
 await fixture.submit(); assert.equal(fixture.saved.length, 0);
 fixture.input(1).props.onChange({ target: { value: "123456" } }); fixture.render(); await fixture.submit();
 assert.equal(calls[1][1].challengeId, "email-challenge");
 assert.equal(fixture.saved[0].isEmailVerified, true);
});
test("phone change verifies current then new number, persisting rotated tokens only on final success", async () => {
 const calls = [];
 const fixture = dialogFixture("phone", async (path, options) => {
  const body = JSON.parse(options.body); calls.push([path, body]);
  if (path.endsWith("phone-otp")) return { destination: body.phone || profile.phone };
  return body.step === "current" ? { verificationToken: "phone-proof" } : { user: { ...profile, phone: body.phone, isPhoneVerified: true }, accessToken: "new-access", refreshToken: "new-refresh" };
 });
 await fixture.submit(); fixture.input(0).props.onChange({ target: { value: "123456" } }); fixture.render(); await fixture.submit();
 assert.equal(fixture.saved.length, 0); assert.equal(fixture.values.get("txpro_token"), undefined);
 fixture.input(0).props.onChange({ target: { value: "0987654321" } }); fixture.render(); await fixture.submit();
 fixture.input(1).props.onChange({ target: { value: "123456" } }); fixture.render(); await fixture.submit();
 assert.equal(calls[2][1].verificationToken, "phone-proof");
 assert.equal(fixture.saved[0].phone, "0987654321");
 assert.equal(fixture.values.get("txpro_token"), "new-access");
 assert.equal(fixture.values.get("txpro_refresh_token"), "new-refresh");
});
test("uncertain identity updates block replay and never show success", async () => {
 let writes = 0;
 const fixture = dialogFixture("name", async path => { if (path.endsWith("name-otp")) return { destination: profile.phone }; writes++; throw new PostingError("timeout", "NETWORK_ERROR", {}, true); });
 fixture.input(0).props.onChange({ target: { value: "Tên cập nhật" } }); fixture.render(); await fixture.submit();
 fixture.input(1).props.onChange({ target: { value: "123456" } }); fixture.render(); await fixture.submit(); await fixture.submit();
 assert.equal(writes, 1); assert.equal(fixture.saved.length, 0);
 assert.equal(fixture.nodes().find(node => node.type === "fieldset").props.disabled, true);
});
test("account typography and loading respect shared design and reduced motion", () => {
 const source = readFileSync(resolve(root, "src/components/account/AccountWorkspace.tsx"), "utf8");
 assert.doesNotMatch(source, /orders\/waiting|orders\/history|orders\/in-progress|home\/summary|mockProfile|setTimeout/);
 const css = readFileSync(resolve(root, "src/components/account/Account.module.css"), "utf8");
 for (const [, weight] of css.matchAll(/font-weight:(\d+)/g)) assert.ok(Number(weight) <= 700);
 assert.ok(css.includes("prefers-reduced-motion"));
});
