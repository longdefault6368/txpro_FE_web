import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
function store() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function loadModules(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} }; cache.set(path, module);
    const source = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "@/config/env") return { API_BASE: "https://test.invalid/api/v1", API_BASE_URL: "https://test.invalid" };
      if (id === "@/utils/posting-api") return { postingRequest: () => { throw new Error("Unexpected API call during test"); } };
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi" }) };
      if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (id === "next/navigation") return { useRouter: () => ({ push: () => {} }) };
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const file = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(path), id);
        return load(file + (existsSync(file + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + source + "\n})", { URLSearchParams, ...globals }, { filename: path })(localRequire, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}
const drafts = loadModules()("src/utils/home-posting-draft.ts");
const pickup = { address: "Điểm nhận", lat: 10.7, lng: 106.7 }, dropoff = { address: "Điểm trả", lat: 10.9, lng: 106.9 };
const now = Date.now();
const draft = (role = "chu-hang") => ({ role, pickup, dropoff, vehicleType: "xe tải", scheduled: false,
  from: new Date(now + 3600000).toISOString(), to: new Date(now + 7200000).toISOString(), price: "250000" });

test("fresh role-specific drafts survive the login return path and are consumed once", () => {
  const storage = store();
  for (const role of ["chu-hang", "tai-xe"]) {
    const path = drafts.saveHomePostingDraft(storage, draft(role), now);
    assert.equal(path, role === "chu-hang" ? "/chu-hang/form-tao-don?from=home" : "/tai-xe/dang-tin?from=home");
    const { safePostingReturn } = loadModules()("src/utils/posting-contract.ts");
    assert.equal(safePostingReturn(path), path);
    const restored = drafts.takeHomePostingDraft(storage, role, "?from=home", now + 5000);
    assert.equal(restored.pickup.address, pickup.address);
    assert.equal(restored.dropoff.lat, dropoff.lat);
    assert.equal(restored.role, role);
    assert.equal(restored.price, role === "tai-xe" ? "250000" : "");
    assert.equal(drafts.takeHomePostingDraft(storage, role, "?from=home", now + 6000), null);
  }
});

test("driver draft preserves vehicle, cargo and child preferences without granting a registered vehicle", () => {
  const storage = store();
  drafts.saveHomePostingDraft(storage, { ...draft("tai-xe"), child: "1 - 5 tấn", weightLabel: "1 - 5 tấn", cargo: "đồ gia dụng / nội thất", vehicleId: "untrusted" }, now);
  const restored = drafts.takeHomePostingDraft(storage, "tai-xe", "?from=home", now);
  assert.equal(restored.vehicleType, "xe tải");
  assert.equal(restored.child, "1 - 5 tấn");
  assert.equal(restored.cargo, "đồ gia dụng / nội thất");
  assert.equal(restored.vehicleId, undefined);
});
test("ordinary visits, existing orders and the other role never consume a draft", () => {
  const storage = store();
  drafts.saveHomePostingDraft(storage, draft(), now);
  assert.equal(drafts.takeHomePostingDraft(storage, "chu-hang", "", now), null);
  assert.equal(drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home&order=123", now), null);
  assert.equal(drafts.takeHomePostingDraft(storage, "tai-xe", "?from=home", now), null);
  assert.equal(storage.data.size, 1);
  assert.ok(drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home", now));
});
test("expired, corrupt, unlocated and stale scheduled drafts are not restored", () => {
  const storage = store();
  drafts.saveHomePostingDraft(storage, draft(), now);
  assert.equal(drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home", now + 3600000), null);
  storage.setItem("txpro_home_posting_v1:chu-hang", "{broken");
  assert.equal(drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home", now), null);
  assert.throws(() => drafts.saveHomePostingDraft(storage, { ...draft(), pickup: { address: "Typed only" } }, now));
  assert.throws(() => drafts.saveHomePostingDraft(storage, { ...draft(), pickup: { ...pickup, lng: 200 } }, now));
  assert.throws(() => drafts.saveHomePostingDraft(storage, { ...draft("tai-xe"), price: "1.5" }, now));
  assert.throws(() => drafts.saveHomePostingDraft(storage, { ...draft("tai-xe"), to: "invalid" }, now));
  assert.throws(() => drafts.saveHomePostingDraft(storage, { ...draft(), role: "admin" }, now));
  drafts.saveHomePostingDraft(storage, { ...draft(), scheduled: true, from: new Date(now + 1000).toISOString() }, now);
  assert.equal(drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home", now + 2000), null);
});
test("draft storage whitelists form input and never carries financial or account authority", () => {
  const storage = store();
  drafts.saveHomePostingDraft(storage, { ...draft(), userId: "someone", confirmed: true, voucherGrantId: "fake", walletHoldStatus: "paid", pickup: { ...pickup, injected: true } }, now);
  const result = drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home", now);
  for (const key of ["userId", "confirmed", "voucherGrantId", "walletHoldStatus"]) assert.equal(result[key], undefined);
  assert.equal(result.pickup.injected, undefined);
});
test("form renders real two-tab semantics, localized copy and no submission on render", () => {
  for (const language of ["vi", "en", "zh"]) {
    const load = loadModules({ "@/context/LanguageContext": { useLanguage: () => ({ language }) } });
    const View = load("src/components/sections/HomePostingForm.tsx").default;
    const html = renderToStaticMarkup(React.createElement(View));
    assert.equal((html.match(/role="tab"/g) || []).length, 2);
    assert.ok(html.includes('role="tabpanel"'));
    assert.ok(html.includes('aria-controls="quick-posting-panel"'));
    assert.ok(html.includes('aria-selected="true"'));
    assert.ok(html.includes('href="/chu-hang/form-tao-don"'));
    assert.ok(!html.includes("<h1"));
  }
});

function formHarness({ storage = store(), catalog } = {}) {
  let cursor = 0;
  const values = [];
  if (catalog) { values[12] = catalog; values[13] = "ready"; }
  const pushed = [];
  const react = { ...React,
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial; return [values[index], value => { values[index] = typeof value === "function" ? value(values[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return values[index] ?? (values[index] = { current: initial }); },
    useEffect() {},
  };
  const View = loadModules({ react, "next/navigation": { useRouter: () => ({ push: value => pushed.push(value) }) } }, { sessionStorage: storage })("src/components/sections/HomePostingForm.tsx").default;
  let tree;
  function nodes(value = tree) {
    if (!value || typeof value !== "object") return [];
    return [value, ...React.Children.toArray(value.props?.children).flatMap(child => nodes(child))];
  }
  function render() { cursor = 0; tree = View(); return tree; }
  render();
  return { render, nodes, pushed, storage };
}
test("switching tabs preserves route, validates input and forwards draft without posting", () => {
  const fixture = formHarness();
  const routeFields = fixture.nodes().filter(node => node.props?.onChange && typeof node.type === "function");
  routeFields[0].props.onChange(pickup); routeFields[1].props.onChange(dropoff);
  fixture.render();
  fixture.nodes().find(node => node.props?.role === "tab" && node.props.id.endsWith("tai-xe")).props.onClick();
  fixture.render();
  const timeFields = fixture.nodes().filter(node => node.type?.name === "PostingTimeField");
  timeFields[0].props.onChange(new Date(Date.now() + 3600000).toISOString());
  timeFields[1].props.onChange(new Date(Date.now() + 7200000).toISOString());
  fixture.nodes().find(node => node.props?.type === "number").props.onChange({ target: { value: "250000" } });
  fixture.render();
  const form = fixture.nodes().find(node => node.type === "form");
  form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(fixture.pushed, ["/tai-xe/dang-tin?from=home"], "double click must not push twice");
  const restored = drafts.takeHomePostingDraft(fixture.storage, "tai-xe", "?from=home");
  assert.equal(restored.pickup.address, pickup.address);
  assert.equal(restored.price, "250000");
});

test("driver uses shared vehicle and cargo pickers and slider price survives continuation", () => {
  const catalog = { vehicleTypes: ["xe tải thùng kín"], cargoTypes: ["đồ gia dụng / nội thất"], seatTypes: [], weightRanges: [], containerTypes: [], constructionVehicleTypes: [], weightVehicleTypes: ["xe tải thùng kín"] };
  const fixture = formHarness({ catalog });
  fixture.nodes().find(node => node.props?.role === "tab" && node.props.id.endsWith("tai-xe")).props.onClick(); fixture.render();
  const locations = fixture.nodes().filter(node => node.type?.name === "LocationField");
  locations[0].props.onChange(pickup); locations[1].props.onChange(dropoff);
  fixture.nodes().find(node => node.type?.name === "VehicleCatalogField").props.onChange({ vehicleType: "xe tải", child: "1 - 5 tấn", weightLabel: "1 - 5 tấn" }); fixture.render();
  fixture.nodes().find(node => node.type?.name === "CargoCatalogField").props.onChange(catalog.cargoTypes[0]);
  const times = fixture.nodes().filter(node => node.type?.name === "PostingTimeField");
  times[0].props.onChange(new Date(Date.now() + 3600000).toISOString()); times[1].props.onChange(new Date(Date.now() + 7200000).toISOString());
  const slider = fixture.nodes().find(node => node.props?.type === "range");
  assert.equal(slider.props.step, "50000"); slider.props.onChange({ target: { value: "850000" } }); fixture.render();
  assert.equal(fixture.nodes().find(node => node.props?.type === "number").props.value, "850000");
  fixture.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  const restored = drafts.takeHomePostingDraft(fixture.storage, "tai-xe", "?from=home");
  assert.equal(restored.vehicleType, "xe tải"); assert.equal(restored.cargo, catalog.cargoTypes[0]); assert.equal(restored.price, "850000");
});
test("keyboard navigation selects tabs and storage failures leave the form recoverable", () => {
  const fixture = formHarness({ storage: { ...store(), setItem() { throw new Error("blocked"); } } });
  const first = fixture.nodes().find(node => node.props?.role === "tab");
  first.props.onKeyDown({ key: "End", preventDefault() {} }, 0);
  fixture.render();
  assert.equal(fixture.nodes().find(node => node.props?.role === "tab" && node.props["aria-selected"]).props.id, "quick-tab-tai-xe");
  const routeFields = fixture.nodes().filter(node => node.props?.onChange && typeof node.type === "function");
  routeFields[0].props.onChange(pickup); routeFields[1].props.onChange(dropoff);
  const timeFields = fixture.nodes().filter(node => node.type?.name === "PostingTimeField");
  timeFields[0].props.onChange(new Date(Date.now() + 3600000).toISOString());
  timeFields[1].props.onChange(new Date(Date.now() + 7200000).toISOString());
  fixture.nodes().find(node => node.props?.type === "number").props.onChange({ target: { value: "250000" } });
  fixture.render();
  fixture.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  fixture.render();
  assert.ok(fixture.nodes().some(node => node.props?.role === "alert"));
  assert.equal(fixture.nodes().find(node => node.props?.type === "submit").props.disabled, false);
  assert.equal(fixture.pushed.length, 0);
});
test("draft hydration stays behind auth/catalog checks and cannot submit or bypass confirmation", () => {
  const source = readFileSync(resolve(root, "src/components/posting/PostingWorkspace.tsx"), "utf8");
  const restore = source.indexOf("const draft = takeHomePostingDraft");
  assert.ok(restore > source.indexOf('if (me.user.role !== role)'));
  assert.ok(restore > source.indexOf("setOptions(catalog)"));
  const block = source.slice(restore, source.indexOf('setAuth("ready")', restore));
  assert.ok(!block.includes("postingRequest("));
  assert.ok(!block.includes("setConfirmed(true)"));
  assert.ok(source.includes('new URLSearchParams(window.location.search).get("order")'));
  assert.ok(source.includes('? "?from=home" : ""'), "login next path must retain the explicit homepage draft marker");
  const css = readFileSync(resolve(root, "src/components/sections/HomePostingForm.module.css"), "utf8");
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.ok(css.includes("prefers-reduced-motion"));
});
