import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
function modules(overrides = {}, globals = {}) {
  const cache = new Map();
  const load = file => {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const js = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (id in overrides) return overrides[id];
      if (id === '@/config/env') return { API_BASE: 'https://community.test/api/v1' };
      if (id === '@/context/LanguageContext') return { useLanguage: () => ({ language: 'vi' }) };
      if (id === '@/utils/posting-api') return { postingRequest: () => { throw Error('Unexpected private API call'); } };
      if (id.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
      if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (id === 'next/image') return ({ fill, priority, ...props }) => React.createElement('img', props);
      if (id.startsWith('.') || id.startsWith('@/')) {
        const path = id.startsWith('@/') ? resolve(root, 'src', id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + '.tsx') ? '.tsx' : '.ts'));
      }
      return require(id);
    };
    vm.runInNewContext('(function(require,module,exports){' + js + '\n})', globals)(localRequire, module, module.exports);
    return module.exports;
  };
  return path => load(resolve(root, path));
}
const profile = { id: '12345678-1234-4234-8234-123456789abc', role: 'tai-xe', displayName: 'Tên tự chọn', region: 'Hà Nội', introduction: 'Giới thiệu công khai' };
test('public profile normalization is an explicit whitelist, rejects incorrect roles and deduplicates', async () => {
  const { normalizeCommunity, getCommunityProfiles } = modules({}, {
    AbortSignal, fetch: async () => ({ ok: true, json: async () => ({ success: true, data: { items: [profile, profile, { ...profile, role: 'admin' }] } }) }),
  })('src/lib/community-public.ts');
  const item = normalizeCommunity({ ...profile, phone: 'private', kycData: { fullName: 'private' }, avatar: 'private' }, 'tai-xe');
  assert.deepEqual(Object.keys(item).sort(), ['id', 'role', 'displayName', 'region', 'introduction'].sort());
  assert.equal(normalizeCommunity({ ...profile, role: 'chu-hang' }, 'tai-xe'), null);
  assert.equal((await getCommunityProfiles('tai-xe', new AbortController().signal)).length, 1);
});
test('public directory fetch omits credentials and bypasses cache; failures never invent profiles', async () => {
  let fail = false;
  const { getCommunityProfiles } = modules({}, { AbortSignal, fetch: async (url, options) => {
    assert.equal(url, 'https://community.test/api/v1/public/community?role=chu-hang&limit=6');
    assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert.equal(options.headers, undefined);
    return { ok: !fail, json: async () => ({ success: true, data: { items: [] } }) };
  } })('src/lib/community-public.ts');
  assert.equal((await getCommunityProfiles('chu-hang', new AbortController().signal)).length, 0);
  fail = true; await assert.rejects(getCommunityProfiles('chu-hang', new AbortController().signal), /UNAVAILABLE/);
});
test('missing community API preserves 404 for a deployment-specific error message', async () => {
  const { getCommunityProfiles, CommunityRequestError } = modules({}, { AbortSignal, fetch: async () => ({ ok: false, status: 404 }) })('src/lib/community-public.ts');
  await assert.rejects(getCommunityProfiles('chu-hang', new AbortController().signal), error => error instanceof CommunityRequestError && error.status === 404);
});
function renderShowcase(values = [], language = 'vi', setup = {}) {
  let index = 0; const updates = [], effects = [];
  const Page = modules({ react: { ...React,
    useState: initial => { const position = index++; return [values[position] ?? initial, value => updates.push({ position, value })]; },
    useEffect: callback => effects.push(callback),
    useRef: initial => ({ current: initial === null && setup.track ? setup.track : initial }),
  }, '@/context/LanguageContext': { useLanguage: () => ({ language }) },
  }, setup.globals || {})('src/components/sections/CommunityShowcase.tsx').default;
  const tree = Page();
  function find(predicate, node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const child of node) { const found = find(predicate, child); if (found) return found; } return; }
    if (predicate(node)) return node;
    return node.props?.children === undefined ? undefined : find(predicate, node.props.children);
  }
  return { tree, find: predicate => find(predicate, tree), updates, effects, html: renderToStaticMarkup(tree) };
}

test('community shows six demo cards immediately and has no public/private API dependency', () => {
  const source = readFileSync(resolve(root, 'src/components/sections/CommunityShowcase.tsx'), 'utf8');
  assert.doesNotMatch(source, /getCommunityProfiles|postingRequest|fetch\(|AbortController|visibilitychange|setInterval|localStorage/);
  const html = renderShowcase().html;
  assert.equal((html.match(/<article/g) || []).length, 6);
  assert.doesNotMatch(html, /Hồ sơ mẫu|[Dd]emo|[Mm]inh họa|Sample profile|示例资料/);
  assert.doesNotMatch(html, /Đang tải hồ sơ|Chưa tải được|Chưa có hồ sơ|public-community/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /href="\/register"/);
});

test('sample profiles are complete, distinct, localized and use existing illustrations', () => {
  const { getCommunityExamples } = modules()('src/lib/community-examples.ts');
  const allIDs = new Set();
  for (const role of ['chu-hang', 'tai-xe']) for (const language of ['vi', 'en', 'zh']) {
    const examples = getCommunityExamples(role, language);
    assert.equal(examples.length, 6);
    for (const item of examples) {
      assert.equal(item.demo, true); assert.equal(item.role, role); assert.ok(item.id.startsWith('demo-'));
      for (const key of ['displayName', 'region', 'destination', 'introduction', 'specialty']) assert.ok(item[key].length > 2, key);
      assert.ok(existsSync(resolve(root, 'public', item.image.slice(1))));
      assert.equal(item.phone, undefined); assert.equal(item.rating, undefined);
      if (language === 'vi') { assert.ok(!allIDs.has(item.id)); allIDs.add(item.id); }
    }
    const html = renderShowcase([role], language).html;
    assert.doesNotMatch(html, /Hồ sơ mẫu|[Dd]emo|[Mm]inh họa|Sample profile|示例资料/);
    assert.doesNotMatch(html, /Đã xác minh|đang online|tel:|mailto:/);
  }
});

test('whole-card action opens authentication choice; neither choice selects a fictional user', () => {
  const { getCommunityExamples } = modules()('src/lib/community-examples.ts');
  for (const role of ['chu-hang', 'tai-xe']) {
    const h = renderShowcase([role]);
    h.find(node => node.type === 'button' && node.props.className === 'cardAction').props.onClick();
    assert.ok(h.updates.some(update => update.position === 1 && update.value.demo === true));
    const profile = getCommunityExamples(role, 'vi')[0];
    const opened = renderShowcase([role, profile]).html;
    const next = role === 'tai-xe' ? '/chu-hang/form-tao-don' : '/tai-xe/dang-tin';
    assert.ok(opened.includes('href="/login?next=' + encodeURIComponent(next) + '"'));
    assert.match(opened, /href="\/register"/);
    assert.match(opened, /Đăng nhập/); assert.match(opened, /Tạo tài khoản/);
    assert.match(opened, /không phải tài khoản hay tin xe đang mở/);
    assert.doesNotMatch(opened, /demo-chu-hang-0|demo-tai-xe-0/);
  }
});

test('tabs support arrow keys, reset the carousel and close the previous authentication prompt', () => {
  const h = renderShowcase();
  const tab = h.find(node => node.props?.role === 'tab' && node.props['aria-selected']);
  let prevented = false;
  tab.props.onKeyDown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.ok(h.updates.some(update => update.position === 0 && update.value === 'tai-xe'));
  assert.ok(h.updates.some(update => update.position === 1 && update.value === null));
  assert.ok(h.updates.some(update => update.position === 2 && update.value === 0));
});

test('carousel metrics handle three/two/one visible cards and stop at the last real scroll position', () => {
  const { communitySlideMetrics: metrics, communitySlideTarget: target, communitySlidePage: page } = modules()('src/utils/community-slider.ts');
  for (const [width, total, stride, visible, pages] of [[1152, 2326, 390, 3, 2], [750, 2294, 386, 2, 3], [335, 1800, 304, 1, 6]]) {
    const m = metrics(width, total, stride, 6);
    assert.equal(m.visible, visible); assert.equal(m.pages, pages);
    assert.equal(target(-10, m), 0); assert.ok(target(100, m) <= m.maxScroll);
    assert.equal(page(m.maxScroll, m), pages - 1);
  }
  assert.equal(page(0, metrics(1200, 1200, 400, 3)), 0);
});

test('next/dots/swipe use scroll position, respect reduced motion and clean up resize listeners', () => {
  const scrolls = [], listeners = new Map(); let observed = false, disconnected = false;
  const track = { clientWidth: 1152, scrollWidth: 2326, scrollLeft: 0,
    children: [{ offsetLeft: 0, offsetWidth: 368 }, { offsetLeft: 390, offsetWidth: 368 }],
    scrollTo(options) { scrolls.push(options); this.scrollLeft = options.left; },
  };
  const h = renderShowcase([], 'vi', { track, globals: {
    window: { matchMedia: () => ({ matches: true }), addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
    ResizeObserver: class { observe() { observed = true; } disconnect() { disconnected = true; } },
  } });
  const cleanup = h.effects[0]();
  assert.equal(observed, true);
  h.find(node => node.props?.['aria-label'] === 'Slide tiếp theo').props.onClick();
  assert.ok(scrolls.at(-1).left > 0); assert.equal(scrolls.at(-1).behavior, 'instant');
  track.scrollLeft = track.scrollWidth - track.clientWidth;
  h.find(node => node.props?.id === 'community-slides').props.onScroll();
  assert.ok(h.updates.some(update => update.position === 2 && update.value === 1));
  assert.equal(h.find(node => node.props?.['aria-label'] === 'Slide trước').props.disabled, true);
  cleanup(); assert.equal(disconnected, true); assert.equal(listeners.size, 0);
});

test('community CSS is complete, responsive, capped at bold and reduced-motion aware', () => {
  const source = readFileSync(resolve(root, 'src/components/sections/CommunityShowcase.tsx'), 'utf8');
  const css = readFileSync(resolve(root, 'src/components/sections/CommunityShowcase.module.css'), 'utf8');
  for (const match of source.matchAll(/\bs\.(\w+)/g)) assert.match(css, new RegExp('\\.' + match[1] + '(?![\\w-])'));
  for (const [, weight] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(weight) <= 700);
  assert.match(css, /prefers-reduced-motion/); assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /grid-auto-columns: 86%/); assert.match(css, /\.cardAction::after[^}]+inset: 0/);
});
test('community brand surfaces retain readable contrast and the shared primary color', () => {
  const css = readFileSync(resolve(root, 'src/components/sections/CommunityShowcase.module.css'), 'utf8');
  const luminance = hex => {
    const expanded = hex.length === 4 ? '#' + [...hex.slice(1)].map(value => value + value).join('') : hex;
    const channels = expanded.slice(1).match(/../g).map(value => {
      const n = parseInt(value, 16) / 255;
      return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  const colorFor = selector => {
    const escaped = selector.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    const block = css.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))?.[1];
    return block?.match(/(?:^|;)\s*color:\s*(#[\da-f]{3,6})/i)?.[1];
  };
  for (const [selector, background] of [
    ['.section .heading h2', '#123b58'], ['.section .heading p', '#123b58'],
    ['.eyebrow', '#123b58'],
    ['.cardAction', '#edf5ff'], ['.tabs button[aria-selected=true]', '#136dec'],
  ]) {
    const text = colorFor(selector);
    assert.ok(text, selector + ' must explicitly set its readable text color');
    const [light, dark] = [luminance(text), luminance(background)].sort((a, b) => b - a);
    assert.ok((light + .05) / (dark + .05) >= 4.5, selector);
  }
  assert.match(css, /--community-primary:\s*#136dec/);
  assert.match(css, /\.heading::after[^}]+pointer-events:\s*none/);
  assert.match(renderShowcase().html, /class="board"/);
});

test('settings start with a read only; explicit withdrawal sends no personal fields', async () => {
  let index = 0; const calls = [], effects = [];
  const values = [{ enabled: false, displayName: 'Private draft', region: 'Draft', introduction: 'Draft', consentVersion: 'community-v1' }, false, false, '', false, 0];
  const Page = modules({ react: { ...React, useState: initial => [values[index++] ?? initial, () => {}], useEffect: fn => effects.push(fn), useRef: initial => ({ current: initial }) },
    '@/utils/posting-api': { postingRequest: async (path, options) => { calls.push({ path, options }); return values[0]; } },
  }, { localStorage: { getItem: () => 'owner-session' } })('src/components/account/PublicCommunitySettings.tsx').default;
  const tree = Page({ role: 'chu-hang' });
  for (const effect of effects) effect(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1); assert.equal(calls[0].options, undefined);
  const html = renderToStaticMarkup(tree); assert.doesNotMatch(html, /checked=""/); assert.match(html, /Mặc định hồ sơ không công khai/);
  const form = tree.props.children.find(node => node?.type === 'form');
  form.props.onSubmit({ preventDefault() {} }); form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.filter(call => call.options?.method === 'PUT').length, 1);
  assert.deepEqual(JSON.parse(calls[1].options.body), { enabled: false });
});
test('publishing requires the explicit checked form and includes the consent version once', async () => {
  let index = 0; const calls = [];
  const prefs = { enabled: true, displayName: 'Public name', region: 'Hà Nội', introduction: 'My introduction', consentVersion: 'community-v1' };
  const values = [prefs, false, false, '', false, 0];
  const Page = modules({ react: { ...React, useState: initial => [values[index++] ?? initial, () => {}], useEffect() {}, useRef: initial => ({ current: initial === null ? 'owner-session' : initial }) },
    '@/utils/posting-api': { postingRequest: async (path, options) => { calls.push({ path, options }); return prefs; } },
  }, { localStorage: { getItem: () => 'owner-session' } })('src/components/account/PublicCommunitySettings.tsx').default;
  const tree = Page({ role: 'tai-xe' });
  assert.equal(calls.length, 0, 'checking the form must not publish during render');
  const html = renderToStaticMarkup(tree); assert.match(html, /checked=""/); assert.match(html, /người chưa đăng nhập/);
  const form = tree.props.children.find(node => node?.type === 'form');
  form.props.onSubmit({ preventDefault() {} }); form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1); assert.equal(calls[0].path, '/community/profile');
  assert.deepEqual(JSON.parse(calls[0].options.body), prefs);
});
test('an older consent form cannot publish for a different account signed in in another tab', () => {
  let index = 0; const calls = [];
  const values = [{ enabled: true, displayName: 'Old account', region: '', introduction: '', consentVersion: 'community-v1' }, false, false, '', false, 0];
  const Page = modules({ react: { ...React, useState: initial => [values[index++] ?? initial, () => {}], useEffect() {}, useRef: initial => ({ current: initial === null ? 'old-session' : initial }) },
    '@/utils/posting-api': { postingRequest: () => { calls.push('unexpected write'); } },
  }, { localStorage: { getItem: () => 'new-session' } })('src/components/account/PublicCommunitySettings.tsx').default;
  const tree = Page({ role: 'chu-hang' });
  tree.props.children.find(node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 0);
});
