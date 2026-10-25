"use client";

import { useEffect, type RefObject } from "react";

type AmbientEnvironment = {
  media: Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;
  visibility: Pick<Document, "hidden" | "addEventListener" | "removeEventListener">;
  Observer: typeof IntersectionObserver;
};

/** Only gates CSS animations; no scroll listeners, timers or per-frame React state. */
export function startAmbientMotion(root: HTMLElement, enabled: boolean, { media, visibility, Observer }: AmbientEnvironment) {
  let visible = false, stopped = false;
  const sync = () => {
    if (!stopped) root.dataset.motionRunning = String(enabled && visible && !visibility.hidden && !media.matches);
  };
  root.dataset.motionRunning = "false";
  if (!enabled) return () => { root.dataset.motionRunning = "false"; };
  const observer = new Observer(entries => {
    if (stopped) return;
    const entry = entries.find(item => item.target === root);
    if (entry) { visible = entry.isIntersecting; sync(); }
  }, { threshold: 0, rootMargin: "0px" });
  observer.observe(root);
  media.addEventListener?.("change", sync);
  visibility.addEventListener("visibilitychange", sync);
  return () => {
    stopped = true;
    root.dataset.motionRunning = "false";
    observer.disconnect();
    media.removeEventListener?.("change", sync);
    visibility.removeEventListener("visibilitychange", sync);
  };
}

export default function useAmbientMotion(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!ref.current || typeof window.matchMedia !== "function" || typeof window.IntersectionObserver !== "function") return;
    return startAmbientMotion(ref.current, enabled, {
      media: window.matchMedia("(prefers-reduced-motion: reduce)"),
      visibility: document,
      Observer: window.IntersectionObserver,
    });
  }, [ref, enabled]);
}
