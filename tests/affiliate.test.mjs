import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';

const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
function modules(overrides = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const js = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const localRequire = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'next/link') return props => React.createElement('a', props);
      if (id === '@/components/common/Header' || id === '@/components/common/Footer') return () => null;
      if (id === '@/context/CompanyInfoContext') return { useCompanyInfo: () => ({ companyInfo: {
        googlePlayUrl: 'https://play.google.com/store/apps/details?id=vn.txepro.mobile',
        appStoreUrl: 'https://apps.apple.com/vn/app/txepro/id6819531395',
      } }) };
      if (id.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
      if (id.startsWith('.') || id.startsWith('@/')) {
        const path = id.startsWith('@/') ? resolve(root, 'src', id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + '.tsx') ? '.tsx' : '.ts'));
      }
      return require(id);
    };
    vm.runInNewContext('(function(require,module,exports){' + js + '\n})', {
      URL, URLSearchParams, AbortSignal, Event, crypto: globalThis.crypto, ...globals,
    }, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return name => load(resolve(root, name));
}
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const nodes = value => !value || typeof value !== 'object' ? [] : [value, ...React.Children.toArray(value.props?.children).flatMap(nodes)];
const label = value => React.Children.toArray(value?.props?.children).map(v => typeof v === 'string' ? v : label(v)).join('');
function harness(name, api, { initial = {}, hash = '', props = {}, strict = false, clipboard } = {}) {
  let cursor = 0, tree, dirty = false;
  const slots = [], pending = [], callbacks = [], cleanups = [], listeners = new Map(), assigned = [];
  const localStorage = storage(initial);
  const window = {
    location: { hash, pathname: '/doi-tac', assign: url => assigned.push(url) },
    history: { replaceState: () => { window.location.hash = ''; } },
    addEventListener(type, cb) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(cb); },
    removeEventListener(type, cb) { listeners.get(type)?.delete(cb); },
    dispatchEvent(event) { for (const cb of [...(listeners.get(event.type) || [])]) cb(event); },
  };
  const react = { ...React,
    useState(initial) {
      const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], v => { const next = typeof v === 'function' ? v(slots[i]) : v; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ?? (slots[i] = { current: initial }); },
    useCallback(cb, deps) { const i = cursor++, prior = slots[i]; if (!prior || deps.some((v, j) => !Object.is(v, prior.deps[j]))) slots[i] = { cb, deps }; return slots[i].cb; },
    useEffect(cb, deps) { const i = cursor++, prior = slots[i]; if (!prior || deps.some((v, j) => !Object.is(v, prior[j]))) { slots[i] = deps; callbacks[i] = cb; pending.push(() => { cleanups[i]?.(); cleanups[i] = cb(); }); } },
  };
  const Component = modules({ react, '@/utils/posting-api': { postingRequest: api } }, { localStorage, window, navigator: { clipboard: { writeText: clipboard || (async () => {}) } } })(name).default;
  function render() { cursor = 0; dirty = false; tree = Component(props); while (pending.length) pending.shift()(); }
  render();
  if (strict) { cleanups.forEach(fn => fn?.()); callbacks.forEach((fn, i) => { cleanups[i] = fn(); }); }
  return {
    async settle() { for (let i = 0; i < 18; i++) { await new Promise(resolve => setImmediate(resolve)); if (dirty) render(); } },
    nodes: () => nodes(tree), button: text => nodes(tree).find(n => n.type === 'button' && label(n).includes(text)),
    localStorage, window, assigned,
    dispose() { cleanups.forEach(fn => fn?.()); },
  };
}
const portal = 'src/components/affiliate/AffiliatePortal.tsx', invite = 'src/components/affiliate/AffiliateInvite.tsx';
const policy = { enabled: true, version: 'v1', terms: 'Partner terms', driverReward: 30000, shipperReward: 20000, minPayout: 20000, milestoneBasis: 'qualified', milestoneMode: 'each', milestones: [{ count: 200, amount: 1500000 }] };
const partner = { _id: 'p1', code: 'TXE123', status: 'active', balance: 30000, totalEarned: 50000, reservedAmount: 20000, paidAmount: 0, termsVersion: 'v1' };
const session = JSON.stringify({ id: 'user1', name: 'Nguyễn Văn Long' });
const emptyPage = { items: [], pagination: { page: 1, total: 0, hasMore: false } };
const summary = { policy, partner, stats: { registered: 2, qualified: 1 }, referralLink: 'https://txepro.vn/invite/TXE123' };

test('partner menu isolates sections, lazily loads data and preserves payment drafts', async () => {
  const calls = [];
  const f = harness(portal, async path => { calls.push(path); return path === '/affiliate/me' ? summary : emptyPage; }, { initial: { txpro_user_session: session } });
  await f.settle();
  assert.deepEqual(calls, ['/affiliate/me']);
  assert.ok(f.nodes().some(n => n.type === 'strong' && label(n).includes('Nguyễn Văn Long')));
  assert.equal(f.nodes().some(n => label(n) === 'Đã đăng ký đối tác'), false);
  assert.equal(f.nodes().some(n => n.props?.id === 'affiliate-sharing'), false);
  f.button('Yêu cầu thanh toán').props.onClick(); await f.settle();
  f.nodes().find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '25000' } }); await f.settle();
  f.button('Link giới thiệu').props.onClick(); await f.settle();
  assert.ok(f.button('Link giới thiệu'));
  assert.equal(f.nodes().some(n => n.type === 'form'), false);
  f.button('Yêu cầu thanh toán').props.onClick(); await f.settle();
  assert.equal(f.nodes().find(n => n.type === 'input' && n.props.type === 'number').props.value, '25000');
  f.button('Người được giới thiệu').props.onClick(); await f.settle();
  assert.ok(calls.includes('/affiliate/referrals?page=1'));
  assert.equal(f.nodes().some(n => n.type === 'table'), false);
  assert.equal(f.button('Trước'), undefined);
  assert.equal(f.button('Sau'), undefined);
  assert.equal(calls.some(p => p.includes('/rewards') || p.includes('/payouts')), false);
  f.button('Tiền thưởng & cấp độ').props.onClick(); await f.settle();
  assert.ok(calls.includes('/affiliate/rewards?limit=100'));
  f.button('Lịch sử thanh toán').props.onClick(); await f.settle();
  assert.ok(calls.includes('/affiliate/payouts?limit=100'));
  assert.equal(f.nodes().some(n => n.props?.id === 'affiliate-rewards'), false);
  f.dispose();
});

test('milestone progress follows qualified counts between policy milestones', async () => {
  for (const [qualified, expected] of [[0, 0], [200, 50], [350, 75], [900, 100]]) {
    const f = harness(portal, async () => ({ ...summary, stats: { registered: 1000, qualified }, policy: { ...policy, milestones: [{ count: 500, amount: 4000000 }, { count: 200, amount: 1500000 }] } }), { initial: { txpro_user_session: session } });
    await f.settle();
    const track = f.nodes().find(n => n.props?.role === 'progressbar');
    assert.equal(track.props['aria-valuenow'], Math.min(qualified, 500));
    assert.equal(track.props.children.props.style.width, expected + '%');
    f.dispose();
  }
});

test('referral pagination requests the selected page', async () => {
  const calls = [];
  const f = harness(portal, async path => {
    calls.push(path); if (path === '/affiliate/me') return summary;
    const page = path.endsWith('=2') ? 2 : 1;
    return { items: [{ id: 'referral-' + page, role: 'tai-xe', registeredAt: '2026-11-01', rewardAmount: 0 }], pagination: { page, total: 2, hasMore: page === 1 } };
  }, { initial: { txpro_user_session: session } });
  await f.settle(); f.button('Người được giới thiệu').props.onClick(); await f.settle();
  assert.equal(f.button('Trước').props.disabled, true);
  f.button('Sau').props.onClick(); await f.settle();
  assert.ok(calls.includes('/affiliate/referrals?page=2'));
  assert.equal(f.button('Sau').props.disabled, true); f.dispose();
});

test('guest sidebar exposes only available sections and dedicated affiliate authentication', async () => {
  const f = harness(portal, async () => { throw new Error('Please sign in'); });
  await f.settle();
  assert.equal(f.nodes().some(n => n.type === 'a' && n.props.href === '#affiliate-payment'), false);
  assert.ok(f.nodes().some(n => n.props?.href === '/doi-tac/dang-nhap'));
  assert.ok(f.nodes().some(n => n.props?.href === '/doi-tac/dang-ky'));
  f.dispose();
});

test('referral storage keeps the first valid code for 30 days and ignores malformed or expired data', () => {
  const { saveReferralCode, readReferralCode, validReferralCode } = modules()('src/utils/affiliate.ts'), s = storage();
  saveReferralCode(s, ' txe-one ', 100); saveReferralCode(s, 'TXE-TWO', 200);
  assert.equal(readReferralCode(s, 300), 'TXE-ONE'); assert.equal(readReferralCode(s, 100 + 30 * 86400000), '');
  s.setItem('txepro_affiliate_referral', '{broken'); assert.equal(readReferralCode(s), '');
  for (const bad of ['<script>', 'ab', 'x'.repeat(51), null, 123, 'code/evil']) assert.equal(validReferralCode(bad), '');
});
test('Play links carry the referral while rejecting foreign, insecure or credential-bearing URLs', () => {
  const { googlePlayReferralUrl } = modules()('src/utils/affiliate.ts');
  const url = new URL(googlePlayReferralUrl('https://play.google.com/store/apps/details?id=vn.txepro.mobile&hl=vi', 'txe-123'));
  assert.equal(url.searchParams.get('id'), 'vn.txepro.mobile'); assert.equal(new URLSearchParams(url.searchParams.get('referrer')).get('referral_code'), 'TXE-123');
  for (const raw of ['http://play.google.com/store/apps/details?id=vn.txepro.mobile', 'https://evil.test/store/apps/details?id=vn.txepro.mobile', 'https://someone@play.google.com/store/apps/details?id=vn.txepro.mobile', 'https://play.google.com/store/apps/details?id=invalid']) assert.equal(googlePlayReferralUrl(raw, 'TXE123'), null);
  assert.equal(googlePlayReferralUrl(url.href, '???'), null);
});
test('iOS bridge emits only a marked code and timestamp understood by the mobile parser', () => {
  const { referralClipboardPayload } = modules()('src/utils/affiliate.ts');
  assert.equal(referralClipboardPayload(' txe-123 ', 1793606400000), 'TXEPRO_REFERRAL:TXE-123:1793606400000');
  assert.equal(referralClipboardPayload('unrelated text'), '');
});
test('a validated invitation saves attribution and copies the code before opening the configured App Store URL', async () => {
  const sequence = [];
  const f = harness(invite, async path => { assert.equal(path, '/public/affiliate/codes/TXE123'); return { code: 'TXE123' }; }, { props: { code: 'txe123' }, clipboard: async text => { sequence.push(text); } });
  await f.settle(); assert.ok(f.localStorage.getItem('txepro_affiliate_referral').includes('TXE123'));
  const link = f.nodes().find(n => n.type === 'a' && label(n).includes('Tải từ App Store'));
  await link.props.onClick({ preventDefault() {} }); await f.settle();
  assert.match(sequence[0], /^TXEPRO_REFERRAL:TXE123:\d+$/); assert.equal(f.assigned[0], 'https://apps.apple.com/vn/app/txepro/id6819531395'); f.dispose();
});
test('denied clipboard access still lets an invited user download; invalid invitation never offers download actions', async () => {
  const f = harness(invite, async () => ({ code: 'TXE123' }), { props: { code: 'TXE123' }, clipboard: async () => { throw new Error('denied'); } });
  await f.settle(); await f.nodes().find(n => n.type === 'a' && label(n).includes('Tải từ App Store')).props.onClick({ preventDefault() {} }); await f.settle();
  assert.equal(f.assigned.length, 1); f.dispose();
  let calls = 0; const invalid = harness(invite, async () => { calls++; }, { props: { code: '../bad' } }); await invalid.settle();
  assert.equal(calls, 0); assert.equal(invalid.nodes().filter(n => n.type === 'a').length, 0); invalid.dispose();
});
test('enrollment needs explicit consent and uses the currently displayed policy version', async () => {
  const writes = []; let enrolled = false;
  const f = harness(portal, async (path, options) => {
    if (path === '/affiliate/enroll') { writes.push(JSON.parse(options.body)); enrolled = true; return {}; }
    return path === '/affiliate/me' ? { ...summary, partner: enrolled ? partner : null } : emptyPage;
  }, { initial: { txpro_user_session: session } });
  await f.settle(); assert.equal(f.button('Đồng ý và trở thành đối tác').props.disabled, true); assert.equal(writes.length, 0);
  f.nodes().find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); await f.settle();
  await f.button('Đồng ý và trở thành đối tác').props.onClick(); await f.settle();
  assert.deepEqual(writes, [{ accepted: true, version: 'v1' }]); assert.ok(f.button('Link giới thiệu')); f.dispose();
});
test('one-use app-to-web ticket is exchanged once under Strict Mode and does not leak into the URL', async () => {
  let exchanges = 0;
  const f = harness(portal, async path => {
    if (path === '/public/affiliate/web-session') { exchanges++; await new Promise(resolve => setImmediate(resolve)); return { user: { id: 'user1', role: 'tai-xe', name: 'Driver' }, tokens: { accessToken: 'web-token', refreshToken: 'web-refresh' } }; }
    return path === '/affiliate/me' ? summary : emptyPage;
  }, { hash: '#ticket=' + 'a'.repeat(64), strict: true });
  await f.settle(); assert.equal(exchanges, 1); assert.equal(f.window.location.hash, ''); assert.equal(f.localStorage.getItem('txpro_token'), 'web-token'); assert.ok(f.button('Link giới thiệu')); f.dispose();
});
test('app ticket cannot overwrite a different browser account', async () => {
  const f = harness(portal, async path => {
    assert.equal(path, '/public/affiliate/web-session'); return { user: { id: 'different', role: 'chu-hang' }, tokens: { accessToken: 'wrong', refreshToken: 'wrong' } };
  }, { hash: '#ticket=' + 'b'.repeat(64), initial: { txpro_user_session: session, txpro_token: 'existing' } });
  await f.settle(); assert.equal(f.localStorage.getItem('txpro_token'), 'existing'); assert.ok(f.nodes().some(n => n.props?.role === 'alert' && label(n).includes('tài khoản khác'))); f.dispose();
});
test('changing accounts clears partner data and bank information on the open page', async () => {
  const f = harness(portal, async path => path === '/affiliate/me' ? summary : emptyPage, { initial: { txpro_user_session: session } });
  await f.settle(); assert.ok(f.button('Link giới thiệu'));
  f.localStorage.setItem('txpro_user_session', JSON.stringify({ id: 'other' })); f.window.dispatchEvent(new Event('storage')); await f.settle();
  assert.equal(f.button('Sao chép mã'), undefined); assert.ok(f.nodes().some(n => n.props?.role === 'alert' && label(n).includes('Tài khoản đã thay đổi'))); f.dispose();
});
test('payout retry reuses the same request key after an ambiguous network failure', async () => {
  const requests = [];
  const f = harness(portal, async (path, options) => {
    if (path === '/affiliate/payouts' && options?.method === 'POST') { requests.push(JSON.parse(options.body)); if (requests.length === 1) throw new Error('timeout'); return {}; }
    return path === '/affiliate/me' ? summary : emptyPage;
  }, { initial: { txpro_user_session: session } });
  await f.settle(); f.button('Yêu cầu thanh toán').props.onClick(); await f.settle();
  for (const [i, value] of ['30000', 'Test Bank', '12345678', 'TEST OWNER'].entries()) { f.nodes().filter(n => n.type === 'input')[i].props.onChange({ target: { value } }); await f.settle(); }
  const submit = () => f.nodes().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await submit(); await f.settle(); await submit(); await f.settle();
  assert.equal(requests.length, 2); assert.equal(requests[0].requestKey, requests[1].requestKey); assert.equal(requests[0].amount, 30000); f.dispose();
});
