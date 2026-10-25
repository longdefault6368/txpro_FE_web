"use client";

import { useEffect, type RefObject } from "react";

type MotionEnvironment = {
  media: Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;
  Observer: typeof IntersectionObserver;
};

/** Animate visible sections once. Content is never hidden by a JS-ready CSS class. */
export function startLandingMotion(root: HTMLElement, { media, Observer }: MotionEnvironment) {
  if (media.matches) return () => {};
  const active = new Set<Animation>();
  const seen = new WeakSet<Element>();
  let stopped = false;
  const cancelActive = () => {
    for (const animation of active) animation.cancel();
    active.clear();
  };
  const observer = new Observer(entries => {
    if (stopped || media.matches) return;
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      observer.unobserve(entry.target);
      const element = entry.target as HTMLElement;
      if (typeof element.animate !== "function") return;
      try {
        const animation = element.animate([
          { opacity: 0.2, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 520, delay: (index % 3) * 45, easing: "cubic-bezier(.2,.7,.2,1)", fill: "none" });
        active.add(animation);
        animation.onfinish = animation.oncancel = () => active.delete(animation);
      } catch { /* Presentation failure must never prevent access to content. */ }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
  const preferenceChanged = () => {
    if (media.matches) { stopped = true; observer.disconnect(); cancelActive(); }
  };
  root.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
  if (typeof media.addEventListener === "function") media.addEventListener("change", preferenceChanged);
  return () => {
    stopped = true;
    observer.disconnect();
    if (typeof media.removeEventListener === "function") media.removeEventListener("change", preferenceChanged);
    cancelActive();
  };
}

export default function useLandingMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current || typeof window.matchMedia !== "function" || typeof window.IntersectionObserver !== "function") return;
    return startLandingMotion(ref.current, {
      media: window.matchMedia("(prefers-reduced-motion: reduce)"),
      Observer: window.IntersectionObserver,
    });
  }, [ref]);
}
