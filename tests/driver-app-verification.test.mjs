import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '..');
class PostingError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
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
      if (id === '@/context/LanguageContext') return { useLanguage: () => ({ language: 'vi' }) };
      if (id === '@/context/CompanyInfoContext') return { useCompanyInfo: () => ({ companyInfo: {
        googlePlayUrl: 'https://play.google.com/store/apps/details?id=vn.test.mobile',
        appStoreUrl: 'https://apps.apple.com/vn/app/test/id123456789',
      } }) };
      if (id === 'next/image') return ({ sizes, ...props }) => React.createElement('img', props);
      if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (id === '@/components/common/Header' || id === '@/components/common/Footer') return () => null;
      if (id.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
      if (id.startsWith('.') || id.startsWith('@/')) {
        const path = id.startsWith('@/') ? resolve(root, 'src', id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + '.tsx') ? '.tsx' : '.ts'));
      }
      return require(id);
    };
    vm.runInNewContext('(function(require,module,exports){' + js + '\n})', {
      URL, URLSearchParams, FormData, Blob, File, AbortSignal, ...globals,
    }, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return name => load(resolve(root, name));
}
function events() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    fire(type) { for (const callback of [...(listeners.get(type) || [])]) callback(); },
  };
}
function storage() {
  const map = new Map([['txpro_token', 'token'], ['txpro_user_session', 'driver-session']]);
  return { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
}
const nodes = value => !value || typeof value !== 'object' ? [] : [value, ...React.Children.toArray(value.props?.children).flatMap(nodes)];
function harness(name, api, props = {}) {
  let cursor = 0, tree, dirty = false;
  const slots = [], pendingEffects = [], disposals = [];
  const window = { ...events(), location: { search: '' }, history: { replaceState() {} } };
  const document = { ...events(), hidden: false, getElementById: () => null };
  const localStorage = storage(), sessionStorage = storage();
  const react = { ...React,
    useState(initial) {
      const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { const next = typeof value === 'function' ? value(slots[index]) : value; if (!Object.is(slots[index], next)) { slots[index] = next; dirty = true; } }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ?? (slots[index] = { current: initial }); },
    useEffect(callback, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous[i]))) {
        slots[index] = deps; pendingEffects.push(() => { disposals[index]?.(); disposals[index] = callback(); });
      }
    },
  };
  const Component = modules({ react,
    '@/utils/posting-api': { PostingError, postingRequest: api },
    '@/utils/onboarding-api': { onboardingRequest: api, privateDocumentBlob() { throw new Error('Unexpected private documents'); } },
  }, { localStorage, sessionStorage, window, document, setInterval: () => 1, clearInterval() {} })(name).default;
  function render() { cursor = 0; dirty = false; tree = Component(props); while (pendingEffects.length) pendingEffects.shift()(); }
  render();
  return {
    async settle() { for (let i = 0; i < 18; i++) { await new Promise(resolve => setImmediate(resolve)); if (dirty) render(); } },
    nodes: () => nodes(tree),
    gate: () => nodes(tree).find(node => node.type?.name === 'DriverAppVerification'),
    form: () => nodes(tree).find(node => node.type?.name === 'PostingForm'),
    window, document, localStorage,
    dispose() { disposals.forEach(cleanup => cleanup?.()); },
  };
}
const catalog = { vehicleTypes: ['xe máy'], seatTypes: [], cargoTypes: [], weightRanges: [], weightVehicleTypes: [], containerTypes: [], constructionVehicleTypes: [] };
const vehicle = { id: '012345678901234567890123', type: 'xe máy', plateNumber: 'TEST-01', status: 'active' };
const posting = 'src/components/posting/PostingWorkspace.tsx';

test('backend eligibility is authoritative; pending/rejected/missing identity cannot be inferred as verified', () => {
  const { driverIdentityVerified } = modules()('src/utils/driver-web-access.ts');
  for (const access of [{}, { kycStatus: 'pending_review' }, { verificationEligibility: 'rejected' }, { kycStatus: 'verified', hasFullFeatureAccess: false }]) assert.equal(driverIdentityVerified(access), false);
  assert.equal(driverIdentityVerified({ hasFullFeatureAccess: true }), true);
  assert.equal(driverIdentityVerified({ verificationEligibility: 'verified' }), true);
  assert.equal(driverIdentityVerified({ kycStatus: 'verified' }), true);
});
test('unverified driver sees app instructions without querying vehicles, catalog or sending writes', async () => {
  const calls = [];
  const f = harness(posting, async path => { calls.push(path); return path === '/auth/me' ? { user: { role: 'tai-xe' } } : { hasFullFeatureAccess: false, verificationEligibility: 'pending_review' }; }, { role: 'tai-xe' });
  await f.settle(); assert.equal(f.gate().props.reason, 'identity'); assert.equal(f.gate().props.status, 'Đang chờ xét duyệt');
  assert.equal(f.form(), undefined); assert.deepEqual(calls, ['/auth/me', '/common/kyc-status']); f.dispose();
});
test('verified identity without active vehicles stays gated; refreshing after app registration opens posting', async () => {
  let ready = false; const calls = [];
  const f = harness(posting, async path => {
    calls.push(path);
    if (path === '/auth/me') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return { hasFullFeatureAccess: true };
    if (path.startsWith('/tai-xe/vehicles')) return ready ? [vehicle, { ...vehicle, id: 'inactive', status: 'inactive' }] : [{ ...vehicle, status: 'inactive' }];
    if (path.endsWith('/options')) return catalog;
    throw new Error('Unexpected request ' + path);
  }, { role: 'tai-xe' });
  await f.settle(); assert.equal(f.gate().props.reason, 'vehicle'); assert.equal(f.form(), undefined);
  ready = true; f.gate().props.onRefresh(); await f.settle();
  assert.ok(f.form()); assert.equal(f.gate(), undefined); assert.equal(f.form().props.vehicles.length, 1); assert.equal(f.form().props.vehicles[0].id, vehicle.id);
  assert.ok(calls.every(path => !path.includes('/posts'))); f.dispose();
});
test('returning to tab rechecks identity from app instead of requiring logout', async () => {
  let verified = false;
  const f = harness(posting, async path => path === '/auth/me' ? { user: { role: 'tai-xe' } } : path === '/common/kyc-status' ? { hasFullFeatureAccess: verified } : path.startsWith('/tai-xe/vehicles') ? [vehicle] : catalog, { role: 'tai-xe' });
  await f.settle(); assert.equal(f.gate().props.reason, 'identity');
  verified = true; f.window.fire('focus'); await f.settle(); assert.ok(f.form()); f.dispose();
});
test('server KYC rejection at posting time returns to app verification without creating a post', async () => {
  const calls = [];
  const f = harness(posting, async (path, init) => {
    calls.push(path);
    if (path === '/auth/me') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return { hasFullFeatureAccess: true };
    if (path.startsWith('/tai-xe/vehicles')) return [vehicle];
    if (path.endsWith('/options')) return catalog;
    assert.equal(init.method, 'POST');
    throw new PostingError('Verification required', 'KYC_REQUIRED');
  }, { role: 'tai-xe' });
  await f.settle();
  const from = new Date(Date.now() + 3600000).toISOString(), to = new Date(Date.now() + 7200000).toISOString();
  f.form().props.onChange({ vehicleId: vehicle.id, pickup: { address: 'Test pickup', lat: 10.7, lng: 106.6 }, dropoff: { address: 'Test dropoff', lat: 10.8, lng: 106.7 }, from, to, price: '100000' });
  await f.settle(); await f.form().props.onSubmit({ preventDefault() {} }); await f.settle();
  assert.equal(f.gate().props.reason, 'identity'); assert.equal(f.form(), undefined);
  assert.ok(calls.includes('/tai-xe/posts/precheck-wallet')); assert.ok(!calls.includes('/tai-xe/posts')); f.dispose();
});
test('shipper posting remains available without a driver verification or vehicle check', async () => {
  const calls = [];
  const f = harness(posting, async path => { calls.push(path); return path === '/auth/me' ? { user: { role: 'chu-hang', kycStatus: 'draft' } } : catalog; }, { role: 'chu-hang' });
  await f.settle(); assert.ok(f.form()); assert.equal(f.form().props.driver, false);
  assert.deepEqual(calls, ['/auth/me', '/chu-hang/find-vehicle/options']); f.dispose();
});
test('vehicle reads include later pages, reject malformed responses and propagate failures', async () => {
  const { readDriverVehicles } = modules()('src/utils/driver-web-access.ts');
  const calls = [];
  const all = await readDriverVehicles(async path => {
    calls.push(path); const last = path.endsWith('page=2');
    return { items: [{ ...vehicle, id: last ? 'second-page' : vehicle.id }], pagination: { hasMore: !last } };
  });
  assert.equal(calls.length, 2); assert.equal(all[1].id, 'second-page');
  await assert.rejects(readDriverVehicles(async () => ({})), /không hợp lệ/);
  await assert.rejects(readDriverVehicles(async () => { throw new Error('offline'); }), /offline/);
});
test('network error, wrong role and expired session do not turn into a verification success', async () => {
  for (const mode of ['offline', 'shipper', 'expired']) {
    const calls = [];
    const f = harness(posting, async path => {
      calls.push(path);
      if (mode === 'offline') throw new Error('offline');
      if (mode === 'expired') throw new PostingError('expired', 'LOGIN_REQUIRED');
      return { user: { role: 'chu-hang' } };
    }, { role: 'tai-xe' });
    await f.settle(); assert.equal(f.form(), undefined); assert.equal(f.gate(), undefined); assert.deepEqual(calls, ['/auth/me']); f.dispose();
  }
});
test('account change during pending access check cannot display the old account vehicles', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const calls = [];
  const f = harness(posting, async path => {
    calls.push(path);
    if (path === '/auth/me') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return pending;
    return [vehicle];
  }, { role: 'tai-xe' });
  await f.settle(); f.localStorage.setItem('txpro_user_session', 'new-account'); release({ hasFullFeatureAccess: true });
  await f.settle(); assert.equal(f.form(), undefined); assert.ok(!calls.some(path => path.startsWith('/tai-xe/vehicles'))); f.dispose();
});
test('driver identity page never exposes web upload or OCR and resumes after verification', async () => {
  let verified = false; const calls = [];
  const f = harness('src/components/onboarding/KycWorkspace.tsx', async path => {
    calls.push(path);
    if (path === '/auth/profile') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return { hasFullFeatureAccess: verified };
    throw new Error('Unexpected request ' + path);
  });
  await f.settle(); assert.equal(f.gate().props.reason, 'identity'); assert.equal(f.nodes().some(node => node.type === 'form'), false);
  verified = true; f.gate().props.onRefresh(); await f.settle();
  assert.equal(f.gate(), undefined); assert.ok(f.nodes().some(node => node.props?.href === '/tai-xe/dang-tin'));
  assert.ok(calls.every(path => path === '/auth/profile' || path === '/common/kyc-status')); f.dispose();
});
test('vehicle page shows synchronized vehicle list and app guidance, without web CRUD or file inputs', async () => {
  let ready = false; const calls = [];
  const f = harness('src/components/onboarding/VehicleWorkspace.tsx', async (path, init) => {
    calls.push([path, init]);
    if (path === '/auth/me') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return { hasFullFeatureAccess: true };
    return ready ? [vehicle] : [];
  });
  await f.settle(); assert.equal(f.gate().props.reason, 'vehicle');
  ready = true; f.gate().props.onRefresh(); await f.settle();
  assert.ok(f.nodes().some(node => node.type === 'h3' && node.props.children === vehicle.plateNumber));
  assert.equal(f.nodes().some(node => node.type === 'form' || node.props?.type === 'file'), false);
  assert.ok(calls.every(([, init]) => !init?.method)); f.dispose();
});
test('unverified driver opening vehicle management is sent to app identity verification first', async () => {
  const calls = [];
  const f = harness('src/components/onboarding/VehicleWorkspace.tsx', async path => {
    calls.push(path);
    if (path === '/auth/me') return { user: { role: 'tai-xe' } };
    if (path === '/common/kyc-status') return { hasFullFeatureAccess: false, verificationEligibility: 'rejected' };
    throw new Error('Vehicle data must not be loaded before verification');
  });
  await f.settle(); assert.equal(f.gate().props.reason, 'identity');
  assert.equal(f.nodes().some(node => node.type === 'form' || node.props?.type === 'file'), false);
  assert.deepEqual(calls, ['/auth/me', '/common/kyc-status']); f.dispose();
});
test('shipper opening the driver vehicle route sees role selection without an app requirement or vehicle disclosure', async () => {
  const calls = [];
  const f = harness('src/components/onboarding/VehicleWorkspace.tsx', async path => { calls.push(path); return { user: { role: 'chu-hang' } }; });
  await f.settle(); assert.equal(f.gate(), undefined);
  assert.ok(f.nodes().some(node => node.type?.name === 'RoleSwitchButton' && node.props.targetRole === 'tai-xe'));
  assert.equal(f.nodes().some(node => node.type === 'form' || node.props?.type === 'file'), false);
  assert.deepEqual(calls, ['/auth/me']); f.dispose();
});
test('shipper optional identity verification remains on web without driver-only access checks', async () => {
  const calls = [];
  const f = harness('src/components/onboarding/KycWorkspace.tsx', async path => {
    calls.push(path);
    if (path === '/auth/profile') return { user: { role: 'chu-hang', kycStatus: 'draft' } };
    if (path === '/kyc/submissions/latest') return { submission: null };
    throw new Error('No driver checks for shippers');
  });
  await f.settle(); assert.equal(f.gate(), undefined);
  assert.equal(f.nodes().filter(node => node.props?.type === 'file').length, 3);
  assert.deepEqual(calls, ['/auth/profile', '/kyc/submissions/latest']); f.dispose();
});
test('driver identity status failure is an unknown result, not a login requirement or completed verification', async () => {
  const f = harness('src/components/onboarding/KycWorkspace.tsx', async path => {
    if (path === '/auth/profile') return { user: { role: 'tai-xe' } };
    throw new Error('Status service unavailable');
  });
  await f.settle(); assert.equal(f.gate(), undefined);
  assert.ok(f.nodes().some(node => node.type === 'h2' && node.props.children === 'Chưa kiểm tra được trạng thái xác minh'));
  assert.equal(f.nodes().some(node => node.props?.href === '/tai-xe/dang-tin'), false);
  assert.equal(f.nodes().some(node => node.type === 'form' || node.props?.type === 'file'), false);
  f.dispose();
});
test('failed recheck clears old driver verification success and can recover without signing out', async () => {
  let offline = false;
  const f = harness('src/components/onboarding/KycWorkspace.tsx', async path => {
    if (path === '/auth/profile') return { user: { role: 'tai-xe', kycStatus: 'verified' } };
    if (offline) throw new Error('offline');
    return { hasFullFeatureAccess: true };
  });
  await f.settle(); assert.ok(f.nodes().some(node => node.props?.href === '/tai-xe/dang-tin'));
  offline = true; f.window.fire('focus'); await f.settle();
  assert.equal(f.nodes().some(node => node.props?.href === '/tai-xe/dang-tin'), false);
  assert.ok(f.nodes().some(node => node.type === 'h2' && node.props.children === 'Chưa kiểm tra được trạng thái xác minh'));
  offline = false;
  f.nodes().find(node => node.type === 'button' && node.props.children === 'Cập nhật trạng thái').props.onClick(); await f.settle();
  assert.ok(f.nodes().some(node => node.props?.href === '/tai-xe/dang-tin')); f.dispose();
});
test('opening driver identity review after verification never loads or submits private documents', async () => {
  const calls = [];
  const f = harness('src/components/onboarding/KycWorkspace.tsx', async path => {
    calls.push(path);
    return path === '/auth/profile' ? { user: { role: 'tai-xe', kycStatus: 'verified' } } : { hasFullFeatureAccess: true };
  });
  await f.settle(); assert.equal(f.gate(), undefined);
  assert.equal(f.nodes().some(node => node.type === 'form' || node.props?.type === 'file'), false);
  assert.deepEqual(calls, ['/auth/profile', '/common/kyc-status']); f.dispose();
});
test('verification instructions link to admin-configured store listings and have a single refresh action', () => {
  const Gate = modules()('src/components/onboarding/DriverAppVerification.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Gate, { reason: 'identity', onRefresh() {} }));
  assert.ok(html.includes('Google Play')); assert.ok(html.includes('App Store')); assert.ok(html.includes('cùng tài khoản'));
  assert.ok(html.includes('https://play.google.com/store/apps/details?id=vn.test.mobile'));
  assert.ok(html.includes('https://apps.apple.com/vn/app/test/id123456789'));
  assert.equal((html.match(/<button/g) || []).length, 1);
});
