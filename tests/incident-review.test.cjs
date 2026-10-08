const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Test the same pure presentation rules used by the Next client, without a browser.
const filename = path.resolve(__dirname, '../src/utils/incident-review.ts');
const compiled = new Module(filename, module);
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const rules = compiled.exports;
const incident = (fields = {}) => ({ status: 'pending_review', reporterRole: 'driver',
  settlementStatus: 'none', availableActions: ['confirmed', 'dismissed'], ...fields });

test('role aliases and both directions identify the correct responder', () => {
  assert.equal(rules.incidentRoleLabel('chu-hang'), 'Chủ hàng');
  assert.equal(rules.incidentRoleLabel('tai-xe'), 'Tài xế');
  assert.equal(rules.incidentResponderRole(incident()), 'shipper');
  assert.equal(rules.incidentResponderRole(incident({ reporterRole: 'shipper' })), 'driver');
  assert.equal(rules.incidentResponderRole(incident({ reporterRole: 'system' })), null);
});
test('appeals, acceptance and withdrawal are distinct from order cancellation', () => {
  assert.equal(rules.incidentResponseLabel(incident()), 'Chưa có phản hồi');
  assert.equal(rules.incidentResponseLabel(incident({ counterpartyResponse: { decision: 'appealed' } })), 'Đã kháng cáo');
  assert.equal(rules.incidentResponseLabel(incident({ counterpartyResponse: { decision: 'accepted' } })), 'Đã chấp nhận báo cáo');
  assert.equal(rules.incidentResponseLabel(incident({ status: 'cancelled' })), 'Báo cáo đã được rút lại');
  assert.equal(rules.incidentResponseLabel(incident({ status: 'cancelled', counterpartyResponse: { decision: 'appealed' } })), 'Báo cáo đã được rút lại');
});
test('terminal cases cannot be changed even with stale API actions', () => {
  for (const status of ['cancelled', 'resolved']) assert.deepEqual(rules.incidentReviewActions(incident({ status })), []);
  assert.deepEqual(rules.incidentReviewActions(incident({ availableActions: ['confirmed', 'resolved'] })), ['confirmed']);
});
test('closing is forbidden until held escrow and held compensation are decided', () => {
  const record = incident({ status: 'confirmed', availableActions: ['resolved'] });
  assert.deepEqual(rules.incidentReviewActions(record), ['resolved']);
  assert.deepEqual(rules.incidentReviewActions({ ...record, settlementStatus: 'held' }), []);
  assert.deepEqual(rules.incidentReviewActions(record, [{ status: 'held' }]), []);
  assert.deepEqual(rules.incidentReviewActions(record, [{ status: 'paid' }]), ['resolved']);
});
test('confirmation does not falsely promise money when the preview is advisory', () => {
  for (const side of ['shipper', 'driver', 'none']) assert.match(rules.incidentConfirmMessage(side, false), /không trừ tiền hay bồi thường lần nữa/);
  assert.match(rules.incidentConfirmMessage('shipper', true), /Ví khuyến mãi của Tài xế/);
  assert.match(rules.incidentConfirmMessage('driver', true), /Ví khuyến mãi của Chủ hàng/);
  assert.match(rules.incidentConfirmMessage('driver', true), /30 ngày/);
});
test('voucher verdict explicitly revokes the applied right and pays cash from funded platform budget', () => {
  const plan = { payerMethod: 'voucher', compensationAmount: 30000, revokesLifetimeVoucher: true };
  const shipper = rules.incidentConfirmMessage('shipper', true, 30, plan);
  assert.match(shipper, /toàn bộ voucher miễn ký quỹ trọn đời/);
  assert.match(shipper, /30\.000/);
  assert.match(shipper, /quỹ đã cấp nguồn/);
  assert.match(shipper, /chưa cộng ví/);
  assert.match(rules.incidentConfirmMessage('driver', true, 30, { ...plan, revokesLifetimeVoucher: false }), /không trừ thêm voucher chưa dùng/);
});
test('audit distinguishes a party response from an administrator verdict', () => {
  assert.equal(rules.incidentEventLabel({ type: 'confirmed', actorRole: 'shipper' }), 'Chấp nhận báo cáo, xác nhận trách nhiệm');
  assert.equal(rules.incidentEventLabel({ type: 'confirmed', actorRole: 'admin' }), 'Kết luận trách nhiệm');
  assert.equal(rules.incidentEventLabel({ type: 'pending_review', actorRole: 'driver' }), 'Gửi kháng cáo');
});
