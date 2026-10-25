import { API_BASE } from "@/config/env";
import { createPostingTransport } from "./posting-transport";
export { PostingError } from "./posting-transport";
let refreshing: Promise<string | null> | null = null;
function refreshOnSameBackend() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = localStorage.getItem("txpro_refresh_token");
    const session = localStorage.getItem('txpro_user_session');
    if (!refreshToken) return null;
    try {
      const res = await fetch(API_BASE + "/auth/refresh", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (!res.ok) return null;
      const body = await res.json();
      if (localStorage.getItem('txpro_refresh_token') !== refreshToken || localStorage.getItem('txpro_user_session') !== session) return null;
      if (!body?.data?.accessToken || !body?.data?.refreshToken) return null;
      localStorage.setItem("txpro_token", body.data.accessToken);
      localStorage.setItem("txpro_refresh_token", body.data.refreshToken);
      return String(body.data.accessToken);
    } catch { return null; }
    finally { refreshing = null; }
  })();
  return refreshing;
}
// No API_FALLBACK: writes must remain on the selected backend.
export const postingRequest = createPostingTransport({
  base: API_BASE,
  token: () => typeof window === "undefined" ? null : localStorage.getItem("txpro_token"),
  refresh: refreshOnSameBackend,
});
