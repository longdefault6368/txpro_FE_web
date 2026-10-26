import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, ".."), require = createRequire(import.meta.url);
const module = { exports: {} };
const source = readFileSync(resolve(root, "src/hooks/useAmbientMotion.ts"), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
vm.runInNewContext("(function(require,module,exports){" + js + "\n})", {})(require, module, module.exports);
const { startAmbientMotion } = module.exports;
function setup({ enabled = true, reduced = false, hidden = false } = {}) {
  const root = { dataset: {} }, mediaListeners = new Set(), visibilityListeners = new Set();
  const media = { matches: reduced, addEventListener: (_, callback) => mediaListeners.add(callback), removeEventListener: (_, callback) => mediaListeners.delete(callback) };
  const visibility = { hidden, addEventListener: (_, callback) => visibilityListeners.add(callback), removeEventListener: (_, callback) => visibilityListeners.delete(callback) };
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const cleanup = startAmbientMotion(root, enabled, { media, visibility, Observer });
  return { root, media, visibility, observer, cleanup, mediaListeners, visibilityListeners,
    intersect(value) { observer.callback([{ target: root, isIntersecting: value }]); },
    setHidden(value) { visibility.hidden = value; for (const callback of visibilityListeners) callback(); },
    setReduced(value) { media.matches = value; for (const callback of mediaListeners) callback(); },
  };
}
test("ambient effects are paused until the hero enters the viewport", () => {
  const fixture = setup();
  assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.intersect(true); assert.equal(fixture.root.dataset.motionRunning, "true");
  fixture.intersect(false); assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.cleanup();
});
test("switching tabs pauses motion and returning resumes only when the hero is visible", () => {
  const fixture = setup();
  fixture.intersect(true); fixture.setHidden(true);
  assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.setHidden(false); assert.equal(fixture.root.dataset.motionRunning, "true");
  fixture.intersect(false); fixture.setHidden(true); fixture.setHidden(false);
  assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.cleanup();
});
test("reduced motion is honored initially and when the preference changes", () => {
  const fixture = setup({ reduced: true });
  fixture.intersect(true); assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.setReduced(false); assert.equal(fixture.root.dataset.motionRunning, "true");
  fixture.setReduced(true); assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.cleanup();
});
test("manual pause creates no observer or listeners, and cannot resume automatically", () => {
  const fixture = setup({ enabled: false });
  assert.equal(fixture.observer, undefined);
  assert.equal(fixture.mediaListeners.size, 0);
  assert.equal(fixture.visibilityListeners.size, 0);
  fixture.setHidden(false); fixture.setReduced(false);
  assert.equal(fixture.root.dataset.motionRunning, "false");
  fixture.cleanup();
});
test("cleanup disconnects the observer, removes listeners and blocks stale callbacks", () => {
  const fixture = setup();
  fixture.intersect(true); fixture.cleanup();
  assert.equal(fixture.observer.disconnected, true);
  assert.equal(fixture.mediaListeners.size, 0);
  assert.equal(fixture.visibilityListeners.size, 0);
  fixture.intersect(true);
  assert.equal(fixture.root.dataset.motionRunning, "false");
});
test("hero starts ambient motion by default without an effects button", () => {
  const hero = readFileSync(resolve(root, "src/components/sections/HeroShowcase.tsx"), "utf8");
  const css = readFileSync(resolve(root, "src/components/sections/HeroShowcase.module.css"), "utf8");
  assert.ok(hero.includes("useAmbientMotion(showcaseRef, true)"));
  assert.ok(hero.includes('data-motion-running="false"'));
  assert.doesNotMatch(hero, /motionToggle|motionEnabled|Hiệu ứng|Pause banner animations/);
  assert.ok(css.includes("pointer-events: none"));
  assert.ok(css.includes("animation-play-state:paused"));
  assert.ok(css.includes("data-motion-running=true"));
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
});
test("new loops only animate transforms or opacity and add no per-frame JavaScript", () => {
  const css = readFileSync(resolve(root, "src/components/sections/HeroShowcase.module.css"), "utf8");
  for (const keyframe of ["orbitTravel", "orbitBreathe", "photoDrift"]) {
    const start = css.indexOf("@keyframes " + keyframe);
    assert.ok(start >= 0);
    let index = css.indexOf("{", start), depth = 1;
    const endStart = index++;
    while (depth && index < css.length) { if (css[index] === "{") depth++; if (css[index] === "}") depth--; index++; }
    const rules = css.slice(endStart, index);
    for (const [, property] of rules.matchAll(/([a-z-]+)\s*:/g)) assert.ok(["transform", "opacity"].includes(property), property);
  }
  assert.ok(!/setInterval|requestAnimationFrame|addEventListener\(["']scroll/.test(source));
  assert.ok(!source.includes("useState("));
});
