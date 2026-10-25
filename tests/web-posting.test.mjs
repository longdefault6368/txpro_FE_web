import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
async function loadTs(name) {
  const source = await fs.readFile(new URL("../src/utils/" + name + ".ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
}
const contract = await loadTs("posting-contract");
const { createPostingTransport, PostingError } = await loadTs("posting-transport");
const options = { vehicleTypes: ["xe máy", "ô tô", "xe tải thùng kín", "container / xe đầu kéo", "xe cẩu tự hành"],
  cargoTypes: ["đồ gia dụng / nội thất"], weightRanges: ["dưới 1 tấn", "2 - 3.5 tấn"],
  weightVehicleTypes: ["xe tải thùng kín", "xe cẩu tự hành"], seatTypes: ["7 ghế"], containerTypes: [], constructionVehicleTypes: [] };
const pickup = { address: "Điểm nhận thử nghiệm", lat: 10.7, lng: 106.6 }, dropoff = { address: "Điểm trả thử nghiệm", lat: 10.8, lng: 106.7 };
const shipper = overrides => contract.buildShipperPosting({ pickup, dropoff, vehicleType: "xe máy", child: "", weightLabel: "", cargo: "", time: "", notes: " Test ", images: [], ...overrides }, options);
const vehicle = { id: "012345678901234567890123", type: "xe tải thùng kín", plateNumber: "TEST", capacity: 5.8, cargoTypes: ["đồ gia dụng / nội thất"] };
const driver = overrides => contract.buildDriverPosting({ vehicle, pickup, dropoff, price: 1000000, radius: 30, min: 2, max: 5,
  from: new Date(Date.now() - 60000).toISOString(), to: new Date(Date.now() + 3600000).toISOString(), note: "", ...overrides }, options);

test("shipper motorcycle contains no cargo or financial fields", () => {
  const payload = shipper({});
  assert.equal(payload.cargoType, "");
  assert.equal(payload.weight, 0);
  assert.equal(payload.pickupTimeType, "now");
  for (const key of ["budget", "price", "walletHoldStatus", "voucherGrantId", "platformFeePercent"]) assert.equal(key in payload, false);
});
test("passenger car extracts seats and does not request freight fields", () => {
  const p = shipper({ vehicleType: "ô tô", child: "7 ghế", images: ["ignored"] });
  assert.equal(p.seats, 7); assert.equal(p.cargoType, ""); assert.deepEqual(p.cargoImageUrls, []);
});
test("truck weight and cargo use selected catalog values", () => {
  const p = shipper({ vehicleType: vehicle.type, cargo: options.cargoTypes[0], weightLabel: "2 - 3.5 tấn" });
  assert.equal(p.weight, 3.5); assert.equal(p.weightLabel, "2 - 3.5 tấn");
  assert.throws(() => shipper({ vehicleType: vehicle.type, cargo: "", weightLabel: "2 - 3.5 tấn" }), /hàng hóa/);
});
test("containers do not ask for tonnage", () => {
  const p = shipper({ vehicleType: "container / xe đầu kéo", cargo: options.cargoTypes[0] });
  assert.equal(p.weight, 0);
  assert.equal(contract.postingCapabilities("container / xe đầu kéo", options).capacity, false);
});
test("reject unresolved coordinates, invalid schedules and more than 3 images", () => {
  assert.throws(() => shipper({ pickup: null }), /địa chỉ/);
  assert.throws(() => shipper({ pickup: { ...pickup, lng: 190 } }), /địa chỉ/);
  assert.throws(() => shipper({ time: "invalid" }), /tương lai/);
  assert.throws(() => shipper({ time: new Date(Date.now() - 60000).toISOString() }), /tương lai/);
  assert.throws(() => shipper({ images: ["1", "2", "3", "4"] }), /3 ảnh/);
});
test("driver uses a fixed server-checkable price and 30km radius", () => {
  const p = driver({});
  assert.equal(p.route.pickupRadiusMeters, 30000); assert.equal(p.route.dropoffRadiusMeters, 30000);
  assert.equal(p.price, 1000000); assert.equal(p.pricing.minPrice, p.pricing.maxPrice);
  assert.equal(p.availableCapacityMin, 2); assert.equal(p.availableCapacityMax, 5);
  for (const key of ["platformFeePercent", "walletHoldStatus", "voucherGrantId"]) assert.equal(key in p, false);
});
test("driver rejects capacity above floored registered limit, reversed ranges and invalid money", () => {
  for (const change of [{ max: 6 }, { min: 4, max: 3 }, { max: 3.5 }, { price: -1 }, { radius: 2 }, { radius: 30.5 }, { to: new Date(0).toISOString() }]) assert.throws(() => driver(change));
  assert.throws(() => driver({ vehicle: { ...vehicle, cargoTypes: [] } }), /hàng hóa/);
});
test("driver motorcycle and car do not send capacity or freight cargo", () => {
  for (const type of ["xe máy", "ô tô"]) {
    const p = driver({ vehicle: { ...vehicle, type, seats: 7 } });
    assert.equal(p.pricingMode, "full_trip"); assert.deepEqual(p.cargoTypes, []);
    assert.equal("availableCapacityMax" in p, false);
  }
});
test("return paths are restricted to internal posting routes", () => {
  assert.equal(contract.safePostingReturn("/tai-xe/dang-tin"), "/tai-xe/dang-tin");
  assert.equal(contract.safePostingReturn("/chu-hang/form-tao-don?order=abc"), "/chu-hang/form-tao-don?order=abc");
  for (const path of ["https://evil.example", "//evil.example", "/admin", "/unknown", "/dang-tin/../admin"]) assert.equal(contract.safePostingReturn(path), null);
});
const response = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
test("transport never sends an authenticated request without a token", async () => {
  let calls = 0;
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => null, refresh: async () => null, send: async () => { calls++; return response(200, {}); } });
  await assert.rejects(api("/tai-xe/posts", { method: "POST", body: "{}" }), { code: "LOGIN_REQUIRED" }); assert.equal(calls, 0);
});
test("network failure never retries or falls back a financial mutation", async () => {
  const urls = [];
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "test-token", refresh: async () => null, send: async url => { urls.push(url); throw new TypeError("network"); } });
  await assert.rejects(api("/tai-xe/posts", { method: "POST", body: "{}" }), e => e instanceof PostingError && e.uncertain);
  assert.deepEqual(urls, ["https://example.test/api/v1/tai-xe/posts"]);
});
test("server errors and malformed success block duplicate submission", async () => {
  for (const value of [response(500, { message: "failed" }), response(200, { success: true })]) {
    const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "test", refresh: async () => null, send: async () => value });
    await assert.rejects(api("/tai-xe/posts", { method: "POST" }), e => e.uncertain === true);
  }
});
test("401 refresh retries once on the same backend with the replacement token", async () => {
  const calls = [];
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "old", refresh: async () => "new",
    send: async (url, init) => { calls.push([url, init.headers.get("Authorization")]); return calls.length === 1 ? response(401, {}) : response(200, { data: { postId: "ok" } }); } });
  assert.deepEqual(await api("/tai-xe/posts", { method: "POST" }), { postId: "ok" });
  assert.deepEqual(calls.map(x => x[1]), ["Bearer old", "Bearer new"]); assert.equal(calls[0][0], calls[1][0]);
});
test("insufficient funds preserves exact server missingAmount", async () => {
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "test", refresh: async () => null, send: async () =>
    response(400, { message: "Thiếu ký quỹ", errorCode: "SHIPPER_ESCROW_INSUFFICIENT_BALANCE", data: { missingAmount: 31415 } }) });
  await assert.rejects(api("/chu-hang/orders/test/select-driver", { method: "POST" }), e => e.details.missingAmount === 31415 && e.uncertain === false);
});
test("public reads omit credentials and multipart uploads preserve browser boundary", async () => {
  const sent = [];
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "test", refresh: async () => null, send: async (_, init) => { sent.push(init); return response(200, { data: [] }); } });
  await api("/chu-hang/find-vehicle/options", {}, false);
  const form = new FormData(); form.set("image", new Blob(["test"], { type: "image/png" }), "test.png");
  await api("/chu-hang/find-vehicle/cargo-image", { method: "POST", body: form });
  assert.equal(sent[0].headers.get("Authorization"), null); assert.equal(sent[1].headers.get("Content-Type"), null);
});
test("API paths cannot target another host", async () => {
  const api = createPostingTransport({ base: "https://example.test/api/v1", token: () => "test", refresh: async () => null });
  await assert.rejects(api("//evil.example"));
  await assert.rejects(api("https://evil.example"));
});
test("paginated and legacy lists are both read without inventing totals", () => {
  assert.deepEqual(contract.readPostingPage({ items: [{ id: "1" }], pagination: { page: 1, limit: 20, total: 1, hasMore: false } }), { items: [{ id: "1" }], hasMore: false });
  assert.equal(contract.readPostingPage(Array.from({ length: 20 }, (_, i) => i)).hasMore, true);
  assert.throws(() => contract.readPostingPage({ data: [] }), /danh sách/);
});
