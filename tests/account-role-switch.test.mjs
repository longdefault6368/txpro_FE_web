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
const source = readFileSync(resolve(root, "src/utils/account-role-switch.ts"), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createRoleSwitcher, RoleSwitchError, clearRoleSession, recoverRoleSession, isAccountRole, roleDestination, ROLE_CHANGED_KEY } =
  await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
const original = { id: "user-1", role: "chu-hang", fullName: "Tên cũ" };
const switched = { userProfile: { id: "user-1", role: "tai-xe", fullName: "Tên chính thức", email: "test@example.invalid" },
  role: "tai-xe", accessToken: "new-access", refreshToken: "new-refresh" };
function storage() {
  const values = new Map([["txpro_token", "old-access"], ["txpro_refresh_token", "old-refresh"],
    ["txpro_user_session", JSON.stringify({ name: "Tên cũ", rawRole: "chu-hang" })], ["unrelated", "keep"]]);
  const writes = [];
  return { values, writes, getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes.push(key); values.set(key, value); }, removeItem: key => values.delete(key) };
}
function fixture(response = switched) {
  const store = storage(), calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return path === "/auth/me" ? { user: original } : response;
  };
  return { store, calls, switchRole: createRoleSwitcher(request, store) };
}
test("checks server account, posts exact target, commits both tokens before tab sync", async () => {
  const { store, calls, switchRole } = fixture();
  const result = await switchRole("tai-xe", original);
  assert.equal(result.role, "tai-xe");
  assert.deepEqual(calls.map(x => x.path), ["/auth/me", "/auth/switch-role"]);
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].options.body), { role: "tai-xe" });
  assert.equal(store.getItem("txpro_token"), "new-access");
  assert.equal(store.getItem("txpro_refresh_token"), "new-refresh");
  assert.deepEqual(store.writes, ["txpro_token", "txpro_refresh_token", "txpro_user_session", ROLE_CHANGED_KEY]);
  assert.deepEqual(JSON.parse(store.getItem("txpro_user_session")), {
    id: "user-1", name: "Tên chính thức", email: "test@example.invalid", role: "Tài Xế", rawRole: "tai-xe",
  });
  assert.equal(store.getItem("unrelated"), "keep");
});
test("switching back to shipper uses server credentials", async () => {
  const store = storage(), driver = { ...original, role: "tai-xe" };
  const result = { ...switched, role: "chu-hang", userProfile: original };
  const run = createRoleSwitcher(async path => path === "/auth/me" ? { user: driver } : result, store);
  await run("chu-hang", driver);
  assert.equal(JSON.parse(store.getItem("txpro_user_session")).rawRole, "chu-hang");
});
test("rejects admin, unknown and forged local roles before any request", async () => {
  const { calls, switchRole } = fixture();
  for (const role of ["admin", "driver", "", null]) assert.equal(isAccountRole(role), false);
  await assert.rejects(switchRole("admin", original), e => e.code === "FORBIDDEN");
  await assert.rejects(switchRole("tai-xe", { ...original, role: "admin" }), e => e.code === "FORBIDDEN");
  assert.equal(calls.length, 0);
});
test("changed account/role during confirmation cannot switch another account", async () => {
  for (const user of [{ ...original, id: "user-2" }, { ...original, role: "tai-xe" }, null]) {
    let mutations = 0;
    const store = storage(), run = createRoleSwitcher(async path => {
      if (path === "/auth/me") return { user };
      mutations++; return switched;
    }, store);
    await assert.rejects(run("tai-xe", original), e => e.code === "SESSION_CHANGED" && e.recovery);
    assert.equal(mutations, 0); assert.equal(store.writes.length, 0);
  }
});
test("duplicate confirm attempts share a lock across entry points", async () => {
  let release;
  const wait = new Promise(resolve => { release = resolve; }), store = storage();
  let mutations = 0;
  const run = createRoleSwitcher(async path => {
    if (path === "/auth/me") { await wait; return { user: original }; }
    mutations++; return switched;
  }, store);
  const first = run("tai-xe", original);
  await assert.rejects(run("tai-xe", original), e => e instanceof RoleSwitchError && e.code === "BUSY");
  release(); await first; assert.equal(mutations, 1);
});
test("server rejection leaves previous credentials and role untouched", async () => {
  const store = storage(), error = new Error("Account disabled");
  const run = createRoleSwitcher(async path => { if (path === "/auth/me") return { user: original }; throw error; }, store);
  await assert.rejects(run("tai-xe", original), error);
  assert.equal(store.getItem("txpro_token"), "old-access"); assert.equal(store.writes.length, 0);
});
test("timeouts are not replayed or optimistically committed", async () => {
  const store = storage(); let posts = 0;
  const run = createRoleSwitcher(async path => {
    if (path === "/auth/me") return { user: original };
    posts++; throw new Error("Network timeout");
  }, store);
  await assert.rejects(run("tai-xe", original), /Network timeout/);
  assert.equal(posts, 1); assert.equal(store.writes.length, 0);
});
test("malformed success, wrong role or another account requires recovery, without local edits", async () => {
  for (const response of [null, {}, { ...switched, accessToken: "" }, { ...switched, refreshToken: 123 },
    { ...switched, role: "chu-hang" }, { ...switched, userProfile: { ...switched.userProfile, role: "chu-hang" } },
    { ...switched, userProfile: { ...switched.userProfile, id: "someone-else" } }]) {
    const { store, switchRole } = fixture(response);
    await assert.rejects(switchRole("tai-xe", original), e => e.code === "INVALID_RESPONSE" && e.recovery);
    assert.equal(store.writes.length, 0);
  }
});
test("another login while POST is pending is never overwritten", async () => {
  const store = storage();
  const run = createRoleSwitcher(async path => {
    if (path === "/auth/me") return { user: original };
    store.setItem("txpro_user_session", JSON.stringify({ rawRole: "chu-hang", name: "Another account" }));
    store.setItem("txpro_token", "other-account-access"); return switched;
  }, store);
  await assert.rejects(run("tai-xe", original), e => e.code === "SESSION_CHANGED");
  assert.equal(store.getItem("txpro_token"), "other-account-access");
  assert.equal(store.getItem(ROLE_CHANGED_KEY), null);
});
test("storage failure after success clears inconsistent credentials, never restores old tokens", async () => {
  const store = storage(), base = store.setItem;
  store.setItem = (key, value) => { if (key === "txpro_refresh_token") throw new Error("Storage denied"); base(key, value); };
  const run = createRoleSwitcher(async path => path === "/auth/me" ? { user: original } : switched, store);
  await assert.rejects(run("tai-xe", original), e => e.code === "STORAGE_ERROR" && e.recovery);
  for (const key of ["txpro_token", "txpro_refresh_token", "txpro_user_session"]) assert.equal(store.getItem(key), null);
  assert.equal(store.getItem("unrelated"), "keep");
});
test("already-updated role can renew its session, and destinations are explicit same-origin routes", async () => {
  const { calls, switchRole } = fixture({ ...switched, role: "chu-hang", userProfile: original });
  await switchRole("chu-hang", original); assert.equal(calls.length, 2);
  assert.equal(roleDestination("tai-xe"), "/user");
  assert.equal(roleDestination("tai-xe", true), "/tai-xe/dang-tin");
  assert.equal(roleDestination("chu-hang", true), "/chu-hang/form-tao-don");
  const store = storage(); clearRoleSession(store); assert.equal(store.getItem("unrelated"), "keep");
});
test("recovery clears only the failed session and retains the intended destination", () => {
  const store = storage(), snapshot = store.getItem("txpro_user_session");
  assert.equal(recoverRoleSession(store, snapshot, "/tai-xe/dang-tin"), "/login?next=%2Ftai-xe%2Fdang-tin");
  for (const key of ["txpro_token", "txpro_refresh_token", "txpro_user_session"]) assert.equal(store.getItem(key), null);
  assert.equal(store.getItem("unrelated"), "keep");
});
test("recovery never signs out an account that signed in after the failed attempt", () => {
  const store = storage(), snapshot = store.getItem("txpro_user_session");
  store.setItem("txpro_user_session", JSON.stringify({ id: "another-user", rawRole: "tai-xe" }));
  store.setItem("txpro_token", "other-access"); store.setItem("txpro_refresh_token", "other-refresh");
  assert.equal(recoverRoleSession(store, snapshot, "/chu-hang/form-tao-don"), "/user");
  assert.equal(store.getItem("txpro_token"), "other-access");
  assert.equal(store.getItem("txpro_refresh_token"), "other-refresh");
  assert.equal(JSON.parse(store.getItem("txpro_user_session")).id, "another-user");
});
test("recovery after partial storage failure still redirects to sign-in", () => {
  const store = storage(), snapshot = store.getItem("txpro_user_session");
  clearRoleSession(store);
  assert.equal(recoverRoleSession(store, snapshot, "/user"), "/login?next=%2Fuser");
});
function modules(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi" }) };
      if (id === "@/utils/posting-api") return { postingRequest: async () => { throw Error("No network allowed"); }, PostingError: class extends Error {} };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + compiled + "\n})", globals)(localRequire, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}
test("switch entry is hidden for guests/admin and supports a disabled offline state", () => {
  const Button = modules()("src/components/account/RoleSwitchButton.tsx").default;
  for (const role of [undefined, "", "admin"]) assert.equal(renderToStaticMarkup(React.createElement(Button, { currentRole: role })), "");
  const html = renderToStaticMarkup(React.createElement(Button, { currentRole: "tai-xe" }));
  assert.match(html, /Chuyển vai trò/); assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /<dialog/);
  assert.match(renderToStaticMarkup(React.createElement(Button, { currentRole: "chu-hang", disabled: true })), /disabled/);
});
test("shared dialog blocks close/Escape/backdrop during pending switch", () => {
  const { PickerDialog } = modules()("src/components/posting/CatalogPicker.tsx");
  let closes = 0;
  // Supply mock hooks since inspecting handlers directly, outside a React render.
  const MockDialog = modules({ react: { ...React, useId: () => "title", useRef: () => ({ current: null }), useEffect: () => {} } })("src/components/posting/CatalogPicker.tsx").PickerDialog;
  const blocked = MockDialog({ title: "Chuyển vai trò", dismissible: false, onClose: () => { closes++; }, children: "Content" });
  let prevented = false;
  blocked.props.onCancel({ preventDefault() { prevented = true; } });
  const target = { getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 }) };
  blocked.props.onClick({ target, currentTarget: target, clientX: 0, clientY: 0 });
  assert.equal(prevented, true); assert.equal(closes, 0);
  const html = renderToStaticMarkup(React.createElement(PickerDialog, { title: "Switch", dismissible: false, onClose() {}, children: "Content" }));
  assert.match(html, /disabled=""[^>]*aria-label="Đóng"/);
  const enabled = MockDialog({ title: "Normal", onClose: () => { closes++; }, children: "Content" });
  enabled.props.onCancel({ preventDefault() {} }); assert.equal(closes, 1);
});
test("all entry points connected, with no auto-switch on navigation or API fallback", () => {
  const header = readFileSync(resolve(root, "src/components/common/Header.tsx"), "utf8");
  const profile = readFileSync(resolve(root, "src/components/account/AccountWorkspace.tsx"), "utf8");
  const posting = readFileSync(resolve(root, "src/components/posting/PostingWorkspace.tsx"), "utf8");
  assert.equal((header.match(/<RoleSwitchButton/g) || []).length, 2);
  assert.match(header, /event.key === ROLE_CHANGED_KEY/);
  assert.match(header, /import RoleSwitchButton from/);
  assert.match(header, /load\(\); window.addEventListener\("storage", sync\)/);
  assert.match(header, /!document.querySelector\("dialog\[open\]"\)/);
  assert.match(profile, /<RoleSwitchButton currentRole=\{normalizedRole\} disabled=\{isOffline \|\| busy \|\| Boolean\(action\)\}/);
  assert.match(posting, /auth === "wrong-role" && <RoleSwitchButton currentRole=\{accountRole\} targetRole=\{role\}/);
  const component = readFileSync(resolve(root, "src/components/account/RoleSwitchButton.tsx"), "utf8");
  assert.match(component, /window.location.replace\(/); assert.match(component, /returnTo === '\/tai-xe\/phuong-tien'/); assert.match(component, /dismissible=\{!busy\}/);
  assert.doesNotMatch(component, /fetchWithAuth|API_FALLBACK|router\.refresh/);
});
function dialogHarness({ pending = false, recovery = false, returnTo } = {}) {
  let index = 0;
  const values = [true, false, pending, original, "tai-xe", "", recovery], updates = [], effects = [];
  const calls = [], navigations = [], store = storage();
  const Button = modules({
    react: { ...React, useState: initial => {
      const position = index++;
      return [position < values.length ? values[position] : initial, value => updates.push({ position, value })];
    }, useEffect: callback => effects.push(callback), useRef: () => ({ current: false }) },
    "@/utils/posting-api": {
      postingRequest: async (path, options) => { calls.push({ path, options }); return path === "/auth/me" ? { user: original } : switched; },
      PostingError: class extends Error {},
    },
  }, { localStorage: store, window: { dispatchEvent() {}, location: { replace: path => navigations.push(path) } }, Event })("src/components/account/RoleSwitchButton.tsx").default;
  const tree = Button({ currentRole: "chu-hang", returnTo });
  const dialog = tree.props.children[1];
  function find(predicate, node = tree) {
    if (!node || typeof node !== "object") return undefined;
    if (Array.isArray(node)) { for (const item of node) { const result = find(predicate, item); if (result) return result; } return undefined; }
    if (predicate(node)) return node;
    return node.props?.children === undefined ? undefined : find(predicate, node.props.children);
  }
  return { tree, dialog, find, updates, effects, calls, navigations, store };
}
test("opening a role dialog reads the account only; Not now closes without switching", async () => {
  const h = dialogHarness();
  for (const effect of h.effects) effect();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.calls.map(call => call.path), ["/auth/me"]);
  h.dialog.props.onClose();
  assert.ok(h.updates.some(update => update.position === 0 && update.value === false));
  assert.equal(h.store.getItem("txpro_token"), "old-access");
  assert.equal(h.navigations.length, 0);
});
test("confirm actually rotates tokens and navigates only after API success", async () => {
  const h = dialogHarness();
  const confirm = h.find(node => node.type === "button" && node.props.className === "confirm");
  assert.ok(confirm); confirm.props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.calls.map(call => call.path), ["/auth/me", "/auth/switch-role"]);
  assert.equal(h.store.getItem("txpro_token"), "new-access");
  assert.deepEqual(h.navigations, ["/user"]);
});
test("pending popup has disabled actions, a status message and cannot be dismissed", () => {
  const h = dialogHarness({ pending: true });
  assert.equal(h.dialog.props.dismissible, false);
  const confirm = h.find(node => node.type === "button" && node.props.className === "confirm");
  assert.equal(confirm.props.disabled, true);
  assert.ok(h.find(node => node.props?.role === "status"));
});

test('vehicle onboarding resumes after role confirmation, and arbitrary return URLs are ignored', async () => {
  for (const [returnTo, expected] of [['/tai-xe/phuong-tien', '/tai-xe/phuong-tien'], ['https://example.test', '/user'], ['/admin', '/user']]) {
    const h = dialogHarness({ returnTo });
    h.find(node => node.type === 'button' && node.props.className === 'confirm').props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.navigations, [expected]);
    assert.equal(h.store.getItem('txpro_token'), 'new-access');
  }
});
