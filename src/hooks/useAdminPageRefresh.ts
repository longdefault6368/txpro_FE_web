"use client";

import { useEffect, useRef } from "react";

// Refresh on returning to an admin page, not an unconditional polling loop.
export function useAdminPageRefresh(refresh: () => unknown) {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; }, [refresh]);
  useEffect(() => {
    let lastRefresh = 0;
    const refreshVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastRefresh < 750) return;
      lastRefresh = Date.now();
      void callback.current();
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) refreshVisible(); };
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, []);
}
