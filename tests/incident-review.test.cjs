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

test('direct driver reports override old monetary plans before and after Start', () => {
  for (const supportOnly of [false, true]) {
    const display = rules.incidentFinancialDisplay({ noFinancialPenalty: true, supportOnly,
      financialPolicyVersion: 2 }, { advisoryOnly: true });
    assert.match(display.title, /Không phạt hoặc bồi thường/);
    assert.match(display.guidance, /24 giờ/);
    assert.match(display.guidance, /hoàn voucher\/ký quỹ còn giữ/);
    assert.match(display.guidance, /Nếu phản đối, admin đối chiếu thủ công/);
    assert.doesNotMatch(display.guidance, /nhận thêm tiền|60 ngày/);
    const confirmation = rules.incidentConfirmMessage('shipper', true, 60, {
      payerMethod: 'voucher', compensationAmount: 30000, revokesLifetimeVoucher: true,
      noFinancialPenalty: true, supportOnly,
    });
    assert.match(confirmation, /không phạt, thu hồi voucher, thu thêm tiền hoặc bồi thường/);
    assert.match(confirmation, /hoàn voucher\/ký quỹ còn giữ/);
    assert.doesNotMatch(confirmation, /ghi có|30\.000|60 ngày/);
  }
});

test('automatic acceptance is explicitly a system outcome, never a shipper click', () => {
  const record = incident({ status: 'resolved', counterpartyResponse: {
    decision: 'accepted', automatic: true, responderRole: 'shipper',
  } });
  assert.equal(rules.incidentResponseLabel(record), 'Tự động chấp nhận sau 24 giờ không phản hồi');
  assert.equal(rules.incidentEventLabel({ type: 'confirmed', actorRole: 'system' }),
    'Tự động chấp nhận sau 24 giờ không phản hồi');
  assert.deepEqual(rules.incidentReviewActions(record), []);
});

test('role aliases and both directions identify the correct responder', () => {
  assert.equal(rules.incidentRoleLabel('chu-hang'), 'Chủ hàng');
  assert.equal(rules.incidentRoleLabel('tai-xe'), 'Tài xế');
  assert.equal(rules.incidentResponderRole(incident()), 'shipper');
  assert.equal(rules.incidentResponderRole(incident({ reporterRole: 'shipper' })), 'driver');
  assert.equal(rules.incidentResponderRole(incident({ reporterRole: 'system' })), null);
});
test('appeals, acceptance and withdrawal are distinct from order cancellation', () => {
  assert.equal(rules.incidentResponseLabel(incident()), 'Chưa có phản hồi');
  assert.equal(rules.incidentResponseLabel(incident({ counterpartyResponse: { decision: 'appealed' } })), 'Đã phản đối');
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
  assert.match(rules.incidentConfirmMessage('driver', true), /60 ngày/);
});
test('voucher verdict explicitly revokes the applied right and pays cash from funded platform budget', () => {
  const plan = { payerMethod: 'voucher', compensationAmount: 30000, revokesLifetimeVoucher: true };
  const shipper = rules.incidentConfirmMessage('shipper', true, 60, plan);
  assert.match(shipper, /toàn bộ voucher miễn ký quỹ trọn đời/);
  assert.match(shipper, /30\.000/);
  assert.match(shipper, /quỹ đã cấp nguồn/);
  assert.match(shipper, /chưa cộng ví/);
  assert.match(rules.incidentConfirmMessage('driver', true, 60, { ...plan, revokesLifetimeVoucher: false }), /không trừ thêm voucher chưa dùng/);
});
test('post-start support verdict never offers monetary settlement or fee refunds', () => {
  const message = rules.incidentConfirmMessage('driver', true, 60, {
    payerMethod: 'none', compensationAmount: 0, revokesLifetimeVoucher: false, supportOnly: true,
  });
  assert.match(message, /Chuyến đã bắt đầu/);
  assert.match(message, /không phạt tiền/);
  assert.doesNotMatch(message, /Ví khuyến mãi/);
  assert.equal(rules.incidentEventLabel({ type: 'support_frozen', actorRole: 'admin' }), 'Đóng băng để hỗ trợ');
});

test('new-policy voucher verdict promises promotional credit only after a verdict, without waiting for funding', () => {
  const message = rules.incidentConfirmMessage('shipper', true, 60, {
    payerMethod: 'voucher', compensationAmount: 30000, revokesLifetimeVoucher: true, virtualCredit: true,
  });
  assert.match(message, /ghi có ngay 30\.000/);
  assert.match(message, /không chờ cấp nguồn/);
  assert.match(message, /Dùng ký quỹ được ngay/);
  assert.match(message, /60 ngày/);
  assert.doesNotMatch(message, /Thiếu nguồn thì|quỹ đã cấp nguồn/);
  assert.doesNotMatch(rules.incidentConfirmMessage('shipper', false, 60, {
    payerMethod: 'voucher', compensationAmount: 30000, revokesLifetimeVoucher: true, virtualCredit: true,
  }), /ghi có ngay/);
});

test('audit distinguishes a party response from an administrator verdict', () => {
  assert.equal(rules.incidentEventLabel({ type: 'confirmed', actorRole: 'shipper' }), 'Chấp nhận báo cáo, xác nhận trách nhiệm');
  assert.equal(rules.incidentEventLabel({ type: 'confirmed', actorRole: 'admin' }), 'Kết luận trách nhiệm');
  assert.equal(rules.incidentEventLabel({ type: 'pending_review', actorRole: 'driver' }), 'Gửi phản đối');
});

test('support-only guidance never mislabels an active trip as already settled', () => {
  for (const [record, preview] of [
    [{ supportOnly: true, financialPolicyVersion: 2 }, null],
    [{ financialPolicyVersion: 2 }, { advisoryOnly: true, plan: { supportOnly: true } }],
  ]) {
    const display = rules.incidentFinancialDisplay(record, preview);
    assert.equal(display.supportOnly, true);
    assert.match(display.title, /sau khi bắt đầu/);
    assert.match(display.guidance, /Không phạt tiền/);
    assert.match(display.guidance, /không tự hoàn thành chuyến/);
    assert.doesNotMatch(display.guidance, /đã quyết toán|nhận thêm tiền|60 ngày/);
  }
});

test('financial guidance distinguishes pending new-policy settlement and closed or legacy cases', () => {
  const pending = rules.incidentFinancialDisplay({ financialPolicyVersion: 2 });
  assert.match(pending.title, /trước khi bắt đầu/);
  assert.match(pending.guidance, /5 phút kể từ khi tài xế chấp nhận/);
  assert.match(pending.guidance, /60 ngày kể từ lúc ghi có/);
  const closed = rules.incidentFinancialDisplay({ financialPolicyVersion: 2 }, { advisoryOnly: true });
  assert.match(closed.guidance, /không trừ tiền/);
  assert.doesNotMatch(closed.guidance, /nhận thêm tiền/);
  const legacy = rules.incidentFinancialDisplay({ financialPolicyVersion: 1 });
  assert.match(legacy.guidance, /Không áp dụng hồi tố/);
});
