export { API_BASE_URL, API_BASE, API_FALLBACK } from "@/config/env";
import { API_BASE, API_FALLBACK } from "@/config/env";

/**
 * Execute fetch with automatic token and fallback management based on environment variables
 */
export const executeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    // If request failed and a fallback API is configured in environment, retry with fallback
    if (API_FALLBACK && url.startsWith(API_BASE)) {
      const fallbackUrl = url.replace(API_BASE, API_FALLBACK);
      res = await fetch(fallbackUrl, options);
    } else {
      throw netErr;
    }
  }

  // If primary API returns 404 (endpoint not deployed yet) and fallback is configured, try fallback
  if (res.status === 404 && API_FALLBACK && url.startsWith(API_BASE)) {
    try {
      const fallbackUrl = url.replace(API_BASE, API_FALLBACK);
      const fallbackRes = await fetch(fallbackUrl, options);
      if (fallbackRes.status !== 404) {
        return fallbackRes;
      }
    } catch {
      // Fallback not reachable, keep original response
    }
  }

  return res;
};

// Singleton in-flight refresh promise to prevent race conditions during token rotation
let activeRefreshPromise: Promise<string | null> | null = null;

export const performTokenRefresh = async (): Promise<string | null> => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    if (typeof window === "undefined") return null;
    const refreshToken = localStorage.getItem("txpro_refresh_token");
    if (!refreshToken) return null;

    try {
      console.log("Access token expired, attempting deduplicated silent refresh...");
      const refreshRes = await executeFetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.data?.accessToken;
        const newRefreshToken = refreshData.data?.refreshToken;

        // Save new tokens to local storage
        if (newAccessToken) {
          localStorage.setItem("txpro_token", newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem("txpro_refresh_token", newRefreshToken);
        }

        console.log("Token refreshed successfully. Retrying queued requests...");
        return newAccessToken || null;
      } else {
        console.warn("Refresh token invalid or expired. Logging out user...");
        localStorage.removeItem("txpro_token");
        localStorage.removeItem("txpro_refresh_token");
        localStorage.removeItem("txpro_user_session");
        window.dispatchEvent(new Event("storage"));

        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
        return null;
      }
    } catch (err) {
      console.error("Token refresh processing error:", err);
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
};

/**
 * Wrapper around standard fetch to automatically handle token expiry (401 Unauthorized)
 * with single-promise deduplication and graceful retry.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = typeof window !== "undefined" ? localStorage.getItem("txpro_token") : null;

  // Initialize headers if not present
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const currentOptions: RequestInit = { ...options, headers };

  let res = await executeFetch(url, currentOptions);

  // If unauthorized, perform deduplicated silent token refresh
  if (res.status === 401 && typeof window !== "undefined") {
    const newToken = await performTokenRefresh();
    if (newToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      res = await executeFetch(url, { ...options, headers: retryHeaders });
    }
  }

  return res;
};
