// Contract checks against a temporary MongoDB, never the configured local/live DB.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const server = new URL("../../../BE/txepro-backend/server/", import.meta.url);
const backendRequire = createRequire(new URL("package.json", server));
const request = backendRequire("supertest"), mongoose = backendRequire("mongoose"), jwt = backendRequire("jsonwebtoken");
const { setupTestApp, teardownTestApp, authHeaderForUser } = await import(new URL("tests/helpers/testApp.js", server));
const User = (await import(new URL("src/models/User.model.js", server))).default;
const { WalletAccount } = await import(new URL("src/models/WalletAccount.model.js", server));
const { WalletTransaction } = await import(new URL("src/models/WalletTransaction.model.js", server));
const { EscrowLock } = await import(new URL("src/models/EscrowLock.model.js", server));
const { Vehicle } = await import(new URL("src/models/Vehicle.model.js", server));
const { jwtConfig } = await import(new URL("src/config/jwt.js", server));
const source = readFileSync(new URL("../src/utils/account-role-switch.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createRoleSwitcher } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
let app;
test.before(async () => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/not-used-role-switch-tests";
  app = await setupTestApp({ rateLimitMax: 1000 });
  process.env.VOUCHERS_ENABLED = "true"; process.env.VOUCHER_FINANCIAL_ENFORCEMENT_ENABLED = "true";
});
test.after(async () => {
  assert.equal(mongoose.connection.name, "txepro-test");
  await teardownTestApp();
});
let phone = 0;
function makeUser(overrides = {}) {
  return User.create({ name: "Role contract test", role: "chu-hang", phone: "+8499900080" + (++phone),
    password: "test-only-password", isActive: true, kycStatus: "verified",
    kycSummary: { verificationEligibility: "verified" }, ...overrides });
}
test("website coordinator switches shipper → driver → shipper using the real API contract", async () => {
  const user = await makeUser(), store = new Map();
  store.set("txpro_token", authHeaderForUser(user).slice(7));
  store.set("txpro_user_session", JSON.stringify({ rawRole: "chu-hang" }));
  await WalletAccount.create({ userId: user._id, mainBalance: 123456 });
  await Vehicle.create({ driverId: user._id, type: "xe máy", vehicleTypeParent: "xe máy", plateNumber: "ROLE-TEST", status: "active" });
  const calls = [];
  const send = async (path, options = {}) => {
    calls.push(path);
    const call = options.method === "POST" ? request(app).post("/api/v1" + path).send(JSON.parse(options.body)) : request(app).get("/api/v1" + path);
    const response = await call.set("Authorization", "Bearer " + store.get("txpro_token"));
    assert.equal(response.status, 200, JSON.stringify({ path, status: response.status, message: response.body.message }));
    return response.body.data;
  };
  const run = createRoleSwitcher(send, { getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) });
  const first = await run("tai-xe", { id: String(user._id), role: "chu-hang" });
  assert.equal(first.role, "tai-xe");
  assert.equal(jwt.verify(store.get("txpro_token"), jwtConfig.accessSecret).role, "tai-xe");
  assert.equal(jwt.verify(store.get("txpro_refresh_token"), jwtConfig.refreshSecret).id, String(user._id));
  assert.equal((await send("/auth/me")).user.role, "tai-xe");
  const restored = await run("chu-hang", first);
  assert.equal(restored.role, "chu-hang");
  assert.equal((await send("/auth/me")).user.role, "chu-hang");
  assert.equal((await User.findById(user._id)).role, "chu-hang");
  assert.equal(calls.filter(path => path === "/auth/switch-role").length, 2);
  assert.equal((await WalletAccount.findOne({ userId: user._id })).mainBalance, 123456);
  assert.equal(await WalletTransaction.countDocuments({ userId: user._id }), 0);
  assert.equal(await EscrowLock.countDocuments({ userId: user._id }), 0);
  assert.equal(await Vehicle.countDocuments({ driverId: user._id }), 1);
});
test("switching does not bypass driver KYC gates", async () => {
  const user = await makeUser({ kycStatus: "draft", kycSummary: { verificationEligibility: "not_started" } });
  const switched = await request(app).post("/api/v1/auth/switch-role")
    .set("Authorization", authHeaderForUser(user)).send({ role: "tai-xe" });
  assert.equal(switched.status, 200); assert.equal(switched.body.data.userProfile.requiresKyc, true);
  const access = await request(app).get("/api/v1/tai-xe/orders/waiting")
    .set("Authorization", "Bearer " + switched.body.data.accessToken);
  assert.equal(access.status, 403); assert.equal(access.body.errorCode, "KYC_VERIFICATION_REQUIRED");
});
test("API refuses unauthenticated, invalid target, admin and disabled accounts", async () => {
  const user = await makeUser(), admin = await makeUser({ role: "admin" }), disabled = await makeUser({ isActive: false });
  assert.equal((await request(app).post("/api/v1/auth/switch-role").send({ role: "tai-xe" })).status, 401);
  assert.equal((await request(app).post("/api/v1/auth/switch-role")
    .set("Authorization", authHeaderForUser(user)).send({ role: "admin" })).status, 400);
  for (const account of [admin, disabled]) {
    const response = await request(app).post("/api/v1/auth/switch-role")
      .set("Authorization", authHeaderForUser(account)).send({ role: "tai-xe" });
    assert.equal(response.status, 403);
  }
  assert.equal((await User.findById(user._id)).role, "chu-hang");
});
test("switch preserves remember-me token policy and renews the refresh cookie", async () => {
  const user = await makeUser();
  const { generateTokens } = await import(new URL("src/services/auth.service.js", server));
  const { accessToken } = generateTokens(user._id, user.role, user.authVersion, true);
  const response = await request(app).post("/api/v1/auth/switch-role")
    .set("Authorization", "Bearer " + accessToken).send({ role: "tai-xe" });
  assert.equal(response.status, 200);
  assert.equal(jwt.verify(response.body.data.accessToken, jwtConfig.accessSecret).rememberMe, true);
  assert.ok(response.headers["set-cookie"]?.some(cookie => cookie.startsWith("refreshToken=")));
});
