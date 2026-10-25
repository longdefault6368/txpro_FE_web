import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const module = { exports: {} };
const source = readFileSync(resolve(root, "src/hooks/useLandingMotion.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
vm.runInNewContext("(function(require,module,exports){" + compiled + "\n})", {})(require, module, module.exports);
const { startLandingMotion } = module.exports;

// Lifecycle tests with DOM/animation doubles, not browser or performance measurements.
function setup({ reduced = false, unsupported = false, failing = false } = {}) {
  const animations = [];
  function target() {
    const element = { style: {} };
    if (!unsupported) element.animate = (frames, timing) => {
      if (failing) throw new Error("Animation unavailable");
      const animation = {
        frames, timing, cancelled: 0, onfinish: null, oncancel: null,
        cancel() { this.cancelled++; this.oncancel?.(); },
      };
      animations.push(animation);
      return animation;
    };
    return element;
  }
  const targets = [target(), target()];
  let observer;
  const listeners = new Set();
  const media = {
    matches: reduced,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.observed = new Set(); this.disconnected = 0; observer = this; }
    observe(element) { this.observed.add(element); }
    unobserve(element) { this.observed.delete(element); }
    disconnect() { this.disconnected++; this.observed.clear(); }
  }
  const cleanup = startLandingMotion({ querySelectorAll: () => targets }, { media, Observer });
  return { targets, animations, media, listeners, observer, cleanup };
}

test("reduced motion skips all observer and animation work", () => {
  const fixture = setup({ reduced: true });
  assert.equal(fixture.observer, undefined);
  assert.equal(fixture.listeners.size, 0);
  assert.equal(fixture.animations.length, 0);
  fixture.cleanup();
});
test("only intersecting sections animate once without persistent hidden styles", () => {
  const fixture = setup();
  const [target] = fixture.targets;
  fixture.observer.callback([{ target, isIntersecting: false }]);
  assert.equal(fixture.animations.length, 0);
  fixture.observer.callback([{ target, isIntersecting: true }, { target, isIntersecting: true }]);
  assert.equal(fixture.animations.length, 1);
  assert.equal(fixture.observer.observed.has(target), false);
  assert.deepEqual(target.style, {});
  assert.equal(fixture.animations[0].timing.fill, "none");
  assert.ok(fixture.animations[0].timing.duration <= 600);
  fixture.cleanup();
});
test("finishing and leaving the page cleans up listeners and active animations", () => {
  const fixture = setup();
  fixture.observer.callback(fixture.targets.map(target => ({ target, isIntersecting: true })));
  fixture.animations[0].onfinish();
  fixture.cleanup();
  assert.equal(fixture.listeners.size, 0);
  assert.equal(fixture.animations[0].cancelled, 0);
  assert.equal(fixture.animations[1].cancelled, 1);
  assert.equal(fixture.observer.disconnected, 1);
  fixture.observer.callback([{ target: {}, isIntersecting: true }]);
  assert.equal(fixture.animations.length, 2, "a queued callback cannot animate after cleanup");
});
test("turning reduced motion on cancels running effects immediately", () => {
  const fixture = setup();
  fixture.observer.callback([{ target: fixture.targets[0], isIntersecting: true }]);
  fixture.media.matches = true;
  for (const listener of fixture.listeners) listener();
  assert.equal(fixture.animations[0].cancelled, 1);
  fixture.observer.callback([{ target: fixture.targets[1], isIntersecting: true }]);
  assert.equal(fixture.animations.length, 1);
  fixture.cleanup();
});
test("missing or failing animation support never hides or breaks content", () => {
  for (const options of [{ unsupported: true }, { failing: true }]) {
    const fixture = setup(options);
    assert.doesNotThrow(() => fixture.observer.callback([{ target: fixture.targets[0], isIntersecting: true }]));
    assert.deepEqual(fixture.targets[0].style, {});
    assert.equal(fixture.animations.length, 0);
    fixture.cleanup();
  }
});
test("key dark-surface text pairs have at least 4.5:1 computed contrast", () => {
  const css = readFileSync(resolve(root, "src/components/sections/LandingExperience.module.css"), "utf8");
  function luminance(hex) {
    const full = hex.length === 4 ? "#" + [...hex.slice(1)].map(value => value + value).join("") : hex;
    const channels = full.slice(1).match(/../g).map(value => {
      const s = parseInt(value, 16) / 255;
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    });
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }
  const textColor = selector => {
    const rule = css.slice(css.lastIndexOf(selector + "{"));
    return rule.slice(0, rule.indexOf("}")).match(/(?:^|[;{])color:(#[\da-f]+)/i)[1];
  };
  for (const [selector, background] of [
    [".heroCopy>p", "#1c568f"],
    [".heroStrip", "#1c568f"],
    [".quickGrid>a:nth-child(-n+2) p", "#146be7"],
    [".trust p", "#124c63"],
    [".download p", "#103c87"],
  ]) {
    const values = [luminance(textColor(selector)), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, selector);
  }
});
