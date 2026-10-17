const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const loaded = new Map();
function loadSource(relative) {
  const filename = path.resolve(__dirname, '../src', relative);
  if (loaded.has(filename)) return loaded.get(filename);
  const compiled = new Module(filename, module);
  const nativeRequire = Module.createRequire(filename);
  compiled.require = (request) => {
    if (request === 'next/link') return { __esModule: true, default: props => React.createElement('a', props, props.children) };
    if (request.startsWith('@/') || request.startsWith('.')) {
      const candidate = request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : path.resolve(path.dirname(filename), request);
      const nextFile = ['.ts', '.tsx'].map(ext => candidate + ext).find(file => fs.existsSync(file));
      if (nextFile) return loadSource(path.relative(path.resolve(__dirname, '../src'), nextFile));
    }
    return nativeRequire(request);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, filename);
  loaded.set(filename, compiled.exports);
  return compiled.exports;
}
const states = loadSource('utils/admin-order-state.ts');
const posts = loadSource('utils/admin-driver-post.ts');
const finance = loadSource('components/admin/OrderFinancialSummary.tsx');
const operations = loadSource('components/admin/DriverPostOperations.tsx').default;
const truck = { type: 'Xe tải', vehicleTypeParent: 'Xe tải', capacity: 20 };

test('progress uses persisted arrival flags, not current location or a completed status guess', () => {
  assert.match(states.getAdminOrderStatus({ status: 'accepted' }).label, /đang đến/);
  assert.match(states.getAdminOrderStatus({ status: 'accepted', completion: { driverNearPickupNotifiedAt: '2026-10-12T01:00:00Z' } }).label, /đã đến điểm nhận/);
  assert.match(states.getAdminOrderStatus({ status: 'in_progress', completion: { driverNearDropoffNotifiedAt: '2026-10-12T01:00:00Z' } }).label, /đã đến điểm trả/);
  assert.match(states.getAdminOrderStatus({ status: 'disputed' }).label, /sự cố/);
  assert.match(states.getAdminOrderStatus({ status: 'legacy_unknown' }).label, /chưa hỗ trợ/);
});

test('24-hour notice uses actual deadline; active reports suspend normal auto completion', () => {
  const deadline = '2026-10-13T01:00:00Z';
  assert.equal(states.getAdminCompletionNotice({ status: 'delivered', shipperConfirmDeadlineAt: deadline }).deadline, deadline);
  assert.equal(states.getAdminCompletionNotice({ status: 'delivered' }).deadline, null);
  assert.equal(states.getAdminCompletionNotice({ status: 'completed' }), null);
  const held = states.getAdminCompletionNotice({ status: 'delivered', shipperConfirmDeadlineAt: deadline, activeIncident: { status: 'pending_review' } });
  assert.equal(held.held, true);
  assert.equal(held.deadline, null);
  assert.match(states.getAdminCompletionNotice({ status: 'delivered', shipperConfirmDeadlineAt: deadline, adminOperations: { autoSettlementEnabled: false } }).text, /đang tắt/);
  assert.match(states.getAdminCompletionNotice({ status: 'delivered', shipperConfirmDeadlineAt: deadline, adminOperations: { autoSettlementEnabled: true, autoSettlementEligible: false } }).text, /Đơn chưa thuộc/);
});

test('vehicle range respects post values, equal endpoints and shared capabilities', () => {
  assert.equal(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: truck, availableCapacityMin: 2, availableCapacityMax: 20 }), '2–20 tấn');
  assert.equal(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: truck, availableCapacityMin: 5, availableCapacityMax: 5 }), '5 tấn');
  assert.match(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: truck, availableCapacityMin: 20, availableCapacityMax: 21 }), /đối soát/);
  assert.match(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: truck, availableCapacityMin: 7 }), /đối soát/);
  assert.equal(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: { type: 'Ô tô', seats: 7, capacity: 20 } }), null);
  assert.equal(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: { type: 'Xe cứu hộ', capacity: 20 } }), null);
  assert.equal(posts.formatPostCapacity({ _id: 'p', status: 'active', vehicleId: truck, availableCapacity: 8 }), '8 tấn');
});

test('post funding distinguishes a voucher hold from cash already transferred to a trip', () => {
  assert.match(posts.getPostHoldLabel({ funding: { cashHeldAmount: 0, orderHeldAmount: 0, reservedVoucherId: 'voucher' } }), /Voucher đang giữ/);
  assert.match(posts.getPostHoldLabel({ funding: { cashHeldAmount: 33000, orderHeldAmount: 0 } }), /33.000/);
  assert.match(posts.getPostHoldLabel({ funding: { cashHeldAmount: 0, orderHeldAmount: 33000 } }), /chuyến liên kết/);
});

test('money rendering does not invent bank references, fees, payout or credits', () => {
  assert.equal(states.formatAdminMoney(0), '0 ₫');
  assert.match(states.getAdminSettlementStatus(null), /Chưa có/);
  assert.equal(states.getAdminSettlementStatus({ settlementStatus: 'pending' }), 'Chưa quyết toán');
  const missing = renderToStaticMarkup(React.createElement(finance.OrderFinancialSummary, {}));
  assert.match(missing, /Chưa có snapshot/);
  assert.doesNotMatch(missing, /95%|MB-TXE-/);
  const known = renderToStaticMarkup(React.createElement(finance.OrderFinancialSummary, { snapshot: { settlementStatus: 'settled', orderAmount: 1000000, settlementReference: 'ACTUAL-REF', shipperEscrow: { payableAmount: 0, waivedAmount: 30000, grossAmount: 30000 } } }));
  assert.match(known, /ACTUAL-REF/);
  assert.match(known, /Đã quyết toán/);
});

test('paid compensation and held compensation have different receipts', () => {
  const base = { id: 'claim', amount: 30000, recipientRole: 'driver', fundingSource: 'platform_fund' };
  const paid = renderToStaticMarkup(React.createElement(finance.CompensationReceipt, { claim: { ...base, status: 'paid', paidAt: '2026-10-12T01:00:00Z', promoAvailableAt: '2026-11-11T01:00:00Z' } }));
  assert.match(paid, /Đã ghi có bồi thường/);
  assert.match(paid, /Ví khuyến mãi/);
  assert.doesNotMatch(paid, /Chờ cấp nguồn/);
  const held = renderToStaticMarkup(React.createElement(finance.CompensationReceipt, { claim: { ...base, status: 'held', holdReason: 'platform_fund_insufficient' } }));
  assert.match(held, /chưa cộng ví/);
  assert.doesNotMatch(held, /Đã ghi có bồi thường/);
});

test('normal fee collection is not labelled as a violation and uses the Start receipt', () => {
  const lock = { _id: 'lock-fee', status: 'forfeited', role: 'driver', amount: 33000,
    meta: { startFee: { amount: 33000 } } };
  assert.equal(states.getAdminEscrowLockLabel(lock), 'Đã thu phí nền tảng và VAT');
  assert.equal(states.getAdminEscrowLockLabel({ ...lock, meta: undefined }), 'Đã khấu trừ');
  assert.equal(states.getAdminEscrowLockLabel({ ...lock, meta: { completionSettlement: { feeAmount: 33000 } } }), 'Đã thu phí nền tảng và VAT');
  const html = renderToStaticMarkup(React.createElement(finance.OrderFinancialSummary, {
    snapshot: { settlementStatus: 'pending', startFeeSettlementId: 'START-RECEIPT', driverFeeCollectedAt: '2026-10-13T01:00:00Z' },
    locks: [lock],
  }));
  assert.match(html, /START-RECEIPT/);
  assert.match(html, /Khi hoàn thành không thu lại/);
  assert.match(html, /Đã thu phí nền tảng và VAT/);
  assert.doesNotMatch(html, /Đã xử lý vi phạm/);
});

test('post operations link exact trip ids and show schedule without claiming it is already searchable', () => {
  const html = renderToStaticMarkup(React.createElement(operations, { post: { _id: 'post', status: 'scheduled', scheduleType: 'scheduled', autoSchedule: { weekdays: [1, 5], startHour: 8, endHour: 20, nextRunAt: '2026-10-13T01:00:00Z' }, relatedOrders: [{ _id: 'trip-a', orderCode: 'ORD-A', status: 'accepted' }, { _id: 'trip-b', orderCode: 'ORD-B', status: 'disputed' }] } }));
  assert.match(html, /\/admin\/orders\/trip-a/);
  assert.match(html, /\/admin\/orders\/trip-b/);
  assert.match(html, /Lịch đăng tin tự động/);
  assert.match(html, /đúng thời gian và đủ bảo đảm/);
  assert.match(html, /nhiều chuyến/);
});
