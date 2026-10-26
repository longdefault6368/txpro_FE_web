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
class PostingError extends Error {
  constructor(message, code, details = {}, uncertain = false) { super(message); Object.assign(this, { code, details, uncertain }); }
}
function modules(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi" }) };
      if (id === "@/config/env") return { API_BASE_URL: "https://test.invalid" };
      if (id === "@/utils/posting-api") return { PostingError, postingRequest: () => { throw new Error("Unexpected network request"); } };
      if (id === "next/image") return ({ sizes, ...props }) => React.createElement("img", props);
      if (id === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (id === "@/components/common/Header" || id === "@/components/common/Footer") return () => null;
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    };
    vm.runInNewContext("(function(require,module,exports){" + js + "\n})", { URLSearchParams, URL, FormData, Blob, ...globals }, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return path => load(resolve(root, path));
}
const options = { vehicleTypes: ["xe máy", "ô tô", "xe tải thùng kín", "xe tải đông lạnh", "xe cẩu tự hành"],
  seatTypes: ["4 ghế", "7 ghế"], containerTypes: [], constructionVehicleTypes: [],
  cargoTypes: ["đồ gia dụng / nội thất", "hàng đông lạnh"], weightRanges: ["dưới 1 tấn", "2 - 3.5 tấn"],
  weightVehicleTypes: ["xe tải thùng kín", "xe tải đông lạnh", "xe cẩu tự hành"] };
const vehicles = [
  { id: "012345678901234567890123", type: "xe tải thùng kín", plateNumber: "TEST-01", capacity: 5.8, status: "active", cargoTypes: [options.cargoTypes[0]] },
  { id: "012345678901234567890124", type: "xe máy", plateNumber: "TEST-02", status: "active" },
];
const pickup = { address: "Điểm nhận thử nghiệm", lat: 10.7, lng: 106.7 }, dropoff = { address: "Điểm trả thử nghiệm", lat: 10.9, lng: 106.9 };
const inputDate = milliseconds => { const date = new Date(milliseconds); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const initial = () => ({ pickup, dropoff, type: "xe tải", child: "1 - 5 tấn", cargo: options.cargoTypes[0], weight: "1 - 5 tấn",
  vehicleId: vehicles[0].id, price: "250000", min: 5, max: 5, radius: 30,
  from: inputDate(Date.now() + 3600000), to: inputDate(Date.now() + 7200000),
  scheduled: false, note: "", images: [], confirmed: false });
const props = (changes = {}) => ({ driver: false, options, vehicles, value: initial(), busy: false, uploading: false, uncertain: false,
  quote: null, onChange() {}, onSubmit() {}, onUpload() {}, onRemoveImage() {}, imagePreview: () => "blob:test", ...changes });
const View = modules()("src/components/posting/PostingForm.tsx").default;
const markup = changes => renderToStaticMarkup(React.createElement(View, props(changes)));
function nodes(value) { return !value || typeof value !== "object" ? [] : [value, ...React.Children.toArray(value.props?.children).flatMap(nodes)]; }
function formFixture(changes = {}) {
  let current = props(changes), tree;
  const changesSeen = [];
  function render() { tree = View({ ...current, onChange: patch => { changesSeen.push(patch); current = { ...current, value: { ...current.value, ...patch } }; } }); }
  render();
  return { render, nodes: () => nodes(tree), changesSeen, value: () => current.value };
}

test("shipper form follows Flutter order and exposes exactly one native submit action", () => {
  const html = markup();
  assert.ok(html.indexOf('aria-label="Ngày và giờ"') < html.indexOf('id="posting-route-title"'));
  assert.ok(html.indexOf("Vị trí nhận") < html.indexOf("Loại phương tiện"));
  assert.ok(html.indexOf("Loại phương tiện") < html.indexOf("Loại hàng hóa"));
  assert.equal((html.match(/type="submit"/g) || []).length, 1);
  assert.ok(html.includes('id="posting-form"'));
  assert.ok(html.includes("Ngay bây giờ"));
  assert.ok(!html.includes('type="datetime-local"'), "ASAP must not show a second clock/time field");
  assert.ok(html.includes("vehicle_picker_truck.webp"));
});
test("scheduled pickup is controlled; passenger and motorcycle forms do not ask for freight images", () => {
  const fixture = formFixture();
  const future = inputDate(Date.now() + 3600000);
  fixture.nodes().find(node => node.type?.name === "PostingTimeField").props.onChange(future);
  fixture.render();
  assert.equal(fixture.value().scheduled, true);
  assert.equal(fixture.value().from, future);
  assert.equal(fixture.nodes().filter(node => node.props?.type === "datetime-local").length, 0);
  fixture.nodes().find(node => node.type?.name === "PostingTimeField").props.onChange("");
  fixture.render();
  assert.equal(fixture.value().scheduled, false);
  for (const type of ["xe máy", "ô tô"]) {
    const html = markup({ value: { ...initial(), type, child: type === "ô tô" ? "4 ghế" : "" } });
    assert.ok(!html.includes('type="file"'));
    assert.ok(!html.includes("Loại hàng hóa"));
  }
});
test("driver form shows route before time and uses the registered capacity as an integer ceiling", () => {
  const html = markup({ driver: true });
  assert.ok(html.indexOf("Lộ trình di chuyển") < html.indexOf("Thời gian xe sẵn sàng"));
  assert.ok(html.includes('max="5"'));
  assert.ok(!html.includes('max="5.8"'));
  const fixture = formFixture({ driver: true });
  fixture.nodes().find(node => node.props?.["aria-label"] === "Tải trọng từ (tấn)").props.onChange({ target: { value: "2" } });
  fixture.render();
  assert.equal(fixture.value().min, 2);
  fixture.nodes().find(node => node.props?.["aria-label"] === "Tải trọng đến (tấn)").props.onChange({ target: { value: "1" } });
  assert.equal(fixture.value().min, 1);
  assert.equal(fixture.value().max, 1);
});
test("registered vehicle selection keeps the exact ID and resets capacity from that vehicle", () => {
  const fixture = formFixture({ driver: true });
  fixture.nodes().find(node => node.props?.vehicles).props.onChange(vehicles[1].id);
  assert.equal(fixture.value().vehicleId, vehicles[1].id);
  assert.equal(fixture.value().max, 0);
  fixture.render();
  assert.equal(fixture.nodes().filter(node => node.props?.["aria-label"] === "Tải trọng từ (tấn)").length, 0);
});
test("fee amounts come only from a supplied backend quote, never from a UI percentage", () => {
  assert.ok(!markup({ driver: true }).includes("Phí trước VAT"));
  const html = markup({ driver: true, quote: { requiredAmount: 12345, platformFeeAmount: 11222, vatAmount: 1123, voucherEligible: false } });
  assert.ok(html.includes("12.345 ₫")); assert.ok(html.includes("11.222 ₫")); assert.ok(html.includes("1.123 ₫"));
  const free = markup({ driver: true, quote: { requiredAmount: 0, platformFeeAmount: 0, vatAmount: 0, voucherEligible: false, paymentPolicy: "motorcycle_free_v1" } });
  assert.ok(free.includes("Xe máy miễn phí nền tảng"));
});
test("busy, upload and uncertain states lock fields, consent and the only submit button", () => {
  for (const flag of ["busy", "uploading", "uncertain"]) {
    const fixture = formFixture({ driver: true, [flag]: true });
    assert.equal(fixture.nodes().find(node => node.type === "fieldset").props.disabled, true);
    assert.equal(fixture.nodes().find(node => node.props?.type === "submit").props.disabled, true);
    assert.equal(fixture.nodes().find(node => node.props?.type === "checkbox").props.disabled, true);
  }
  assert.equal(formFixture({ driver: true, value: { ...initial(), vehicleId: "" } }).nodes().find(node => node.props?.type === "submit").props.disabled, true);
});
test("image picker allows multiple files and caps at three; previews and removal are explicit", () => {
  let filesSeen, removed;
  const fixture = formFixture({ value: { ...initial(), images: ["a", "b", "c"] }, onUpload: files => { filesSeen = files; }, onRemoveImage: url => { removed = url; } });
  const input = fixture.nodes().find(node => node.props?.type === "file");
  assert.equal(input.props.multiple, true); assert.equal(input.props.disabled, true);
  assert.equal(input.props.hidden, undefined, "The file input must remain focusable for keyboard users");
  const event = { target: { files: ["file"], value: "chosen" } };
  input.props.onChange(event);
  assert.deepEqual(filesSeen, ["file"]); assert.equal(event.target.value, "");
  fixture.nodes().find(node => node.props?.["aria-label"] === "Xóa ảnh hàng hóa 2").props.onClick();
  assert.equal(removed, "b");
  assert.equal(fixture.nodes().filter(node => node.type === "a" && node.props["aria-label"]?.startsWith("Xem ảnh")).length, 3);
});
test("full-form skeleton, safe new-tab links, font weights and reduced-motion support remain intact", () => {
  const Skeleton = modules()("src/components/posting/PostingForm.tsx").PostingFormSkeleton;
  const html = renderToStaticMarkup(React.createElement(Skeleton));
  assert.ok(html.includes('aria-busy="true"')); assert.ok(html.includes('class="summarySkeleton"'));
  for (const node of formFixture().nodes().filter(node => node.type === "a" && node.props.target === "_blank")) assert.equal(node.props.rel, "noopener noreferrer");
  const css = readFileSync(resolve(root, "src/components/posting/PostingExperience.module.css"), "utf8");
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.ok(css.includes("prefers-reduced-motion")); assert.ok(css.includes("env(safe-area-inset-bottom)"));
  assert.ok(css.includes("position:fixed")); assert.ok(css.includes("padding-bottom:160px"));
  const source = readFileSync(resolve(root, "src/components/posting/PostingForm.tsx"), "utf8");
  assert.ok(!source.includes("postingRequest(")); assert.ok(!source.includes("fetch("));
});
function workspaceFixture(role, api = async () => { throw new Error("Unexpected API"); }) {
  let cursor = 0, tree; const state = [], history = [];
  const react = { ...React,
    useState(initialValue) { const index = cursor++; if (!(index in state)) state[index] = index === 0 ? "ready" : index === 1 ? options : index === 2 ? vehicles : typeof initialValue === "function" ? initialValue() : initialValue;
      return [state[index], next => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; },
    useRef(initialValue) { const index = cursor++; return state[index] ?? (state[index] = { current: initialValue }); },
    useEffect() {},
  };
  const Workspace = modules({ react, "@/utils/posting-api": { PostingError, postingRequest: api } }, {
    window: { location: { search: "" }, history: { replaceState: (...args) => history.push(args) } },
  })("src/components/posting/PostingWorkspace.tsx").default;
  function render() { cursor = 0; tree = Workspace({ role }); }
  render();
  return { render, nodes: () => nodes(tree), form: () => nodes(tree).find(node => node.type?.name === "PostingForm"), history };
}
const event = () => ({ preventDefault() {} });
const quote = { canPost: true, missingAmount: 0, requiredAmount: 20000, platformFeeAmount: 18000, vatAmount: 2000, voucherEligible: false };
test("new driver form still prechecks before create, requires explicit consent and rejects double submits", async () => {
  const calls = [];
  const fixture = workspaceFixture("tai-xe", async (path, input) => {
    calls.push([path, JSON.parse(input.body)]);
    return path.endsWith("precheck-wallet") ? quote : { postId: "112345678901234567890123" };
  });
  fixture.form().props.onChange({ ...initial() }); fixture.render();
  await fixture.form().props.onSubmit(event()); fixture.render();
  assert.equal(calls.length, 1); assert.ok(calls[0][0].endsWith("precheck-wallet"));
  fixture.form().props.onChange({ confirmed: true }); fixture.render();
  const submit = fixture.form().props.onSubmit;
  await Promise.all([submit(event()), submit(event())]); fixture.render();
  assert.equal(calls.filter(([path]) => path === "/tai-xe/posts").length, 1);
  assert.equal(calls.at(-1)[1].vehicleId, vehicles[0].id);
  assert.equal(fixture.form(), undefined);
});
test("insufficient funds carries the exact missing amount to MB funding and never creates a post", async () => {
  const calls = [];
  const fixture = workspaceFixture("tai-xe", async path => { calls.push(path); return { ...quote, canPost: false, missingAmount: 31415 }; });
  fixture.form().props.onChange(initial()); fixture.render();
  await fixture.form().props.onSubmit(event()); fixture.render();
  assert.equal(calls.length, 1);
  assert.equal(fixture.nodes().find(node => node.type?.name === "FundingPanel").props.missingAmount, 31415);
  assert.equal(fixture.form().props.value.confirmed, false);
});
test("new shipper form sends the same grouped payload and does not touch wallet endpoints", async () => {
  const calls = [];
  const fixture = workspaceFixture("chu-hang", async (path, input) => { calls.push([path, JSON.parse(input.body)]); return { orderId: "112345678901234567890124", status: "searching_driver" }; });
  fixture.form().props.onChange(initial()); fixture.render();
  await fixture.form().props.onSubmit(event()); fixture.render();
  assert.equal(calls.length, 1); assert.equal(calls[0][0], "/chu-hang/orders");
  assert.equal(calls[0][1].vehicleType, "xe tải"); assert.equal(calls[0][1].weightLabel, "1 - 5 tấn");
  assert.equal(calls[0][1].cargoType, options.cargoTypes[0]);
  assert.equal(fixture.history.length, 1);
});
test("unknown registered vehicle IDs cannot create posts or precheck someone else's vehicle", async () => {
  let calls = 0;
  const fixture = workspaceFixture("tai-xe", async () => { calls++; });
  fixture.form().props.onChange({ ...initial(), vehicleId: "999999999999999999999999" }); fixture.render();
  await fixture.form().props.onSubmit(event());
  assert.equal(calls, 0);
});
test("uncertain mutation errors freeze the form instead of allowing a duplicate retry", async () => {
  let calls = 0;
  const fixture = workspaceFixture("tai-xe", async path => { calls++; if (path.endsWith("precheck-wallet")) return quote; throw new PostingError("Uncertain", "NETWORK_ERROR", {}, true); });
  fixture.form().props.onChange({ ...initial(), confirmed: true }); fixture.render();
  await fixture.form().props.onSubmit(event()); fixture.render();
  assert.equal(fixture.form().props.uncertain, true);
  const before = calls;
  await fixture.form().props.onSubmit(event());
  assert.equal(calls, before);
});

function locationFixture() {
  let cursor = 0, tree;
  const state = [], changed = [], results = [pickup, dropoff];
  const react = { ...React,
    useState(initialValue) { const index = cursor++; if (!(index in state)) state[index] = index === 0 ? "Điểm" : index === 1 ? results : initialValue;
      return [state[index], next => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; },
    useRef(initialValue) { const index = cursor++; return state[index] ?? (state[index] = { current: initialValue }); },
    useId() { return "location-test"; }, useEffect() {},
  };
  const Location = modules({ react })("src/components/posting/LocationField.tsx").default;
  function render() { cursor = 0; tree = Location({ label: "Vị trí nhận", value: null, onChange: value => changed.push(value) }); }
  render();
  return { render, changed, input: () => nodes(tree).find(node => node.props?.role === "combobox"),
    options: () => nodes(tree).filter(node => node.props?.role === "option") };
}

const bookingOrderId = "112345678901234567890124";
const bookingMatch = (postId, price = 250000) => ({ postId, driverId: "driver-one", driverName: "Tài xế thử nghiệm", price,
  status: "active", availableTo: new Date(Date.now() + 3600000).toISOString(), vehicle: { type: "xe tải thùng kín", plateNumber: postId } });
async function bookingFixture() {
  const calls = [], original = [bookingMatch("post-one"), bookingMatch("post-two")];
  let matches = original, status = "searching_driver", failure = null;
  const fixture = workspaceFixture("chu-hang", async (path, input) => {
    calls.push({ path, input });
    if (path === "/chu-hang/orders") return { orderId: bookingOrderId, status };
    if (path.endsWith("/matches")) return matches;
    if (path.endsWith("/select-driver")) {
      if (failure) throw failure;
      status = "waiting_driver_acceptance";
      return { orderId: bookingOrderId, status, financialSummary: { shipperEscrow: { payableAmount: 7500 } } };
    }
    return { status };
  });
  fixture.form().props.onChange(initial()); fixture.render();
  await fixture.form().props.onSubmit(event()); fixture.render();
  await fixture.nodes().find(node => node.type === "button" && node.props.className === "secondaryButton").props.onClick();
  // The button intentionally starts its async refresh without returning it.
  await new Promise(resolve => setImmediate(resolve)); fixture.render();
  fixture.nodes().filter(node => node.type === "button" && node.props.className === "matchButton")[1].props.onClick(); fixture.render();
  const consent = () => { fixture.nodes().find(node => node.props?.type === "checkbox").props.onChange({ target: { checked: true } }); fixture.render(); };
  const confirm = async () => { fixture.nodes().find(node => node.type === "button" && node.props.className === "primaryButton").props.onClick(); await new Promise(resolve => setImmediate(resolve)); fixture.render(); };
  return { ...fixture, calls, original, consent, confirm, setMatches: value => { matches = value; }, setStatus: value => { status = value; }, setFailure: value => { failure = value; } };
}

test("booking rechecks both exact post and driver, and submits only the selected post", async () => {
  const fixture = await bookingFixture(); fixture.consent(); await fixture.confirm();
  const writes = fixture.calls.filter(call => call.path.endsWith("/select-driver"));
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0].input.body), { postId: "post-two", driverId: "driver-one", offerPrice: 250000 });
  assert.ok(fixture.nodes().some(node => React.Children.toArray(node.props?.children).some(child => typeof child === "string" && child.includes("Đã ký quỹ 7.500"))));
});

test("price changes require new consent; removed or paused posts cannot be booked", async () => {
  const fixture = await bookingFixture(); fixture.consent();
  fixture.setMatches([bookingMatch("post-two", 300000)]); await fixture.confirm();
  assert.equal(fixture.calls.filter(call => call.path.endsWith("/select-driver")).length, 0);
  assert.equal(fixture.nodes().find(node => node.props?.type === "checkbox").props.checked, false);
  fixture.consent(); await fixture.confirm();
  assert.equal(JSON.parse(fixture.calls.at(-1).input.body).offerPrice, 300000);
  for (const replacement of [[], [{ ...bookingMatch("post-two"), status: "paused" }], [{ ...bookingMatch("post-two"), availableTo: new Date(0).toISOString() }], [{ ...bookingMatch("post-two"), driverId: "someone-else" }]]) {
    const unavailable = await bookingFixture(); unavailable.consent(); unavailable.setMatches(replacement); await unavailable.confirm();
    assert.equal(unavailable.calls.filter(call => call.path.endsWith("/select-driver")).length, 0);
  }
});

test("QR success rechecks current order and offer instead of replaying the old selection", async () => {
  const fixture = await bookingFixture(); fixture.consent();
  fixture.setFailure(new PostingError("Nạp thêm", "SHIPPER_ESCROW_INSUFFICIENT_BALANCE", { missingAmount: 31415 }));
  await fixture.confirm();
  const funding = fixture.nodes().find(node => node.type?.name === "FundingPanel");
  assert.equal(funding.props.missingAmount, 31415);
  funding.props.onPaid(); fixture.render();
  assert.equal(fixture.nodes().find(node => node.props?.type === "checkbox").props.checked, false);
  fixture.setStatus("accepted"); fixture.consent(); await fixture.confirm();
  assert.equal(fixture.calls.filter(call => call.path.endsWith("/select-driver")).length, 1);
});
test("address keyboard selection commits exact coordinates and never submits the parent form", () => {
  const fixture = locationFixture(); let prevented = 0;
  fixture.input().props.onKeyDown({ key: "ArrowDown", preventDefault() { prevented++; } }); fixture.render();
  assert.equal(fixture.input().props["aria-activedescendant"], "location-test-result-0");
  fixture.input().props.onKeyDown({ key: "ArrowDown", preventDefault() { prevented++; } }); fixture.render();
  fixture.input().props.onKeyDown({ key: "Enter", preventDefault() { prevented++; } }); fixture.render();
  assert.equal(fixture.changed.at(-1).address, dropoff.address);
  assert.equal(fixture.changed.at(-1).lat, dropoff.lat);
  assert.equal(fixture.options().length, 0);
  assert.equal(prevented, 3);
});
test("escape dismisses address suggestions without selecting; editing invalidates old coordinates", () => {
  const fixture = locationFixture();
  fixture.input().props.onKeyDown({ key: "Escape" }); fixture.render();
  assert.equal(fixture.options().length, 0);
  assert.equal(fixture.changed.length, 0);
  fixture.input().props.onChange({ target: { value: "Địa chỉ mới" } }); fixture.render();
  assert.equal(fixture.changed.at(-1), null);
  assert.equal(fixture.input().props.value, "Địa chỉ mới");
});
