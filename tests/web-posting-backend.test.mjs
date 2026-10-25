// Optional monorepo integration suite. It uses the backend's temporary Mongo
// fixture and NEVER the API URL or Mongo URI configured for the landing site.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import { createRequire } from "node:module";
const server = new URL("../../../BE/txepro-backend/server/", import.meta.url);
const requireBackend = createRequire(new URL("package.json", server));
const request = requireBackend("supertest");
const mongoose = requireBackend("mongoose");
const { setupTestApp, teardownTestApp, authHeaderForUser } = await import(new URL("tests/helpers/testApp.js", server));
const User = (await import(new URL("src/models/User.model.js", server))).default;
const { Vehicle } = await import(new URL("src/models/Vehicle.model.js", server));
const { WalletAccount } = await import(new URL("src/models/WalletAccount.model.js", server));
const { EscrowLock } = await import(new URL("src/models/EscrowLock.model.js", server));
const { WalletTransaction } = await import(new URL("src/models/WalletTransaction.model.js", server));
const { shipperCreateOrderSchema, driverPostCreateSchema } = await import(new URL("src/validators/contract.validator.js", server));
const source = await fs.readFile(new URL("../src/utils/posting-contract.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { buildShipperPosting, buildDriverPosting, readPostingPage } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
let app, driver, shipper, bike, options, postId, orderId;
const pickup = { address: "Điểm nhận test", lat: 10.7, lng: 106.6 }, dropoff = { address: "Điểm trả test", lat: 10.8, lng: 106.7 };
test.before(async () => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/not-used-web-tests";
  app = await setupTestApp({ rateLimitMax: 1000 });
  process.env.VOUCHERS_ENABLED = "true"; process.env.VOUCHER_FINANCIAL_ENFORCEMENT_ENABLED = "true";
  const base = { password: "test-only-password", isActive: true, kycStatus: "verified", kycSummary: { verificationEligibility: "verified" } };
  [driver, shipper] = await User.create([
    { ...base, role: "tai-xe", name: "Web test driver", phone: "+84999000901" },
    { ...base, role: "chu-hang", name: "Web test shipper", phone: "+84999000902" },
  ]);
  await WalletAccount.create([{ userId: driver._id, mainBalance: 0 }, { userId: shipper._id, mainBalance: 1000000 }]);
  bike = await Vehicle.create({ driverId: driver._id, type: "xe máy", vehicleTypeParent: "xe máy", plateNumber: "WEB-TEST", status: "active" });
});
test.after(async () => {
  assert.equal(mongoose.connection.name, "txepro-test");
  await teardownTestApp();
});
test("web reads live catalog and explicit vehicle pagination envelope", async () => {
  const catalog = await request(app).get("/api/v1/chu-hang/find-vehicle/options");
  assert.equal(catalog.status, 200); options = catalog.body.data;
  assert.ok(options.vehicleTypes.includes("xe máy"));
  const list = await request(app).get("/api/v1/tai-xe/vehicles?paginated=true&limit=100&page=1").set("Authorization", authHeaderForUser(driver));
  assert.equal(list.status, 200); const result = readPostingPage(list.body.data, 100);
  assert.equal(result.items.length, 1); assert.equal(result.hasMore, false);
});
test("generated web driver payload validates, prechecks and creates motorcycle with no money/voucher debit", async () => {
  const payload = buildDriverPosting({ vehicle: { id: String(bike._id), type: "xe máy", plateNumber: "WEB-TEST" },
    pickup, dropoff, price: 100000, radius: 30, min: 0, max: 0, from: new Date(Date.now() - 60000).toISOString(),
    to: new Date(Date.now() + 3600000).toISOString(), note: "" }, options);
  assert.equal(driverPostCreateSchema.validate(payload).error, undefined);
  const quote = await request(app).post("/api/v1/tai-xe/posts/precheck-wallet").set("Authorization", authHeaderForUser(driver))
    .send({ vehicleId: payload.vehicleId, price: payload.price, pricing: payload.pricing, pricingMode: payload.pricingMode });
  assert.equal(quote.status, 200); assert.equal(quote.body.data.paymentPolicy, "motorcycle_free_v1");
  const created = await request(app).post("/api/v1/tai-xe/posts").set("Authorization", authHeaderForUser(driver)).send(payload);
  assert.equal(created.status, 201, JSON.stringify(created.body)); postId = created.body.data.postId;
  assert.equal(await EscrowLock.countDocuments({ userId: driver._id }), 0);
  assert.equal(await WalletTransaction.countDocuments({ userId: driver._id }), 0);
});
test("generated web shipper payload creates an order without locking a deposit", async () => {
  const payload = buildShipperPosting({ pickup, dropoff, vehicleType: "xe máy", child: "", cargo: "", weightLabel: "", time: "", notes: "", images: [] }, options);
  assert.equal(shipperCreateOrderSchema.validate(payload).error, undefined);
  const created = await request(app).post("/api/v1/chu-hang/orders").set("Authorization", authHeaderForUser(shipper)).send(payload);
  assert.equal(created.status, 201, JSON.stringify(created.body)); orderId = created.body.data.orderId;
  assert.equal(await EscrowLock.countDocuments({ userId: shipper._id }), 0);
});
test("web match results use exact postId; booking moves shipper rights only at selection", async () => {
  const matches = await request(app).get("/api/v1/chu-hang/orders/" + orderId + "/matches").set("Authorization", authHeaderForUser(shipper));
  assert.equal(matches.status, 200); assert.ok(matches.body.data.some(x => x.postId === postId));
  const selected = await request(app).post("/api/v1/chu-hang/orders/" + orderId + "/select-driver").set("Authorization", authHeaderForUser(shipper))
    .send({ driverId: String(driver._id), postId, offerPrice: 100000 });
  assert.equal(selected.status, 200, JSON.stringify(selected.body));
  assert.equal(await EscrowLock.countDocuments({ userId: driver._id }), 0);
  const detail = await request(app).get("/api/v1/chu-hang/orders/" + orderId).set("Authorization", authHeaderForUser(shipper));
  assert.equal(detail.body.data.status, "waiting_driver_acceptance");
});
test("backend rejects wrong-role web requests", async () => {
  const res = await request(app).post("/api/v1/tai-xe/posts").set("Authorization", authHeaderForUser(shipper)).send({});
  assert.equal(res.status, 403);
});
test("MB QR uses common wallet endpoint and remains pending until provider confirmation", async () => {
  const before = await WalletAccount.findOne({ userId: shipper._id }).lean();
  const qr = await request(app).post("/api/v1/common/wallet/topup").set("Authorization", authHeaderForUser(shipper))
    .send({ amount: 12345, method: "bank_transfer" });
  assert.equal(qr.status, 200, JSON.stringify(qr.body)); const data = qr.body.data;
  assert.ok(data.qrImage); assert.ok(data.transactionId); assert.equal(data.status, "pending");
  assert.equal(data.netAmount, 12345);
  const list = await request(app).get("/api/v1/common/wallet/transactions?limit=50&page=1").set("Authorization", authHeaderForUser(shipper));
  assert.equal(list.status, 200); const tx = list.body.data.find(row => row.id === data.transactionId);
  assert.equal(tx.status, "pending");
  const after = await WalletAccount.findOne({ userId: shipper._id }).lean();
  assert.equal(after.mainBalance, before.mainBalance);
});

test("Flutter-style grouped choices create real web orders with exact matching fields and no deposit at creation", async () => {
  const before = await EscrowLock.countDocuments({ userId: shipper._id });
  const cases = [
    ...["dưới 1 tấn", "1 - 5 tấn", "5 - 10 tấn", "10 - 40 tấn"].map(weightLabel => ({ vehicleType: "xe tải", child: weightLabel, weightLabel })),
    ...["xe container", "xe container lạnh (reefer)", "xe container moóc sàn"].map(child => ({ vehicleType: "container / xe đầu kéo", child, weightLabel: "" })),
    { vehicleType: "xe cẩu tự hành / cần cẩu", child: "", weightLabel: options.weightRanges[0] },
    { vehicleType: "xe tải / container lồng chở ô tô", child: "", weightLabel: "" },
    { vehicleType: "ô tô", child: options.seatTypes[0], weightLabel: "" },
  ];
  for (const selection of cases) {
    const payload = buildShipperPosting({ pickup, dropoff, ...selection, cargo: options.cargoTypes[0], time: "", notes: "", images: [] }, options);
    assert.equal(shipperCreateOrderSchema.validate(payload).error, undefined);
    const created = await request(app).post("/api/v1/chu-hang/orders").set("Authorization", authHeaderForUser(shipper)).send(payload);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const detail = await request(app).get("/api/v1/chu-hang/orders/" + created.body.data.orderId).set("Authorization", authHeaderForUser(shipper));
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.vehicleType, selection.vehicleType);
    if (selection.child) assert.equal(detail.body.data.vehicleTypeChild, selection.child);
    if (selection.vehicleType === "xe tải") assert.equal(detail.body.data.weightLabel, selection.weightLabel);
  }
  assert.equal(await EscrowLock.countDocuments({ userId: shipper._id }), before);
});
