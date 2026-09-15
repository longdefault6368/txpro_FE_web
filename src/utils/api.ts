export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://api.txepro.vn";
export const API_BASE = `${API_BASE_URL}/api/v1`;

/**
 * Execute fetch with automatic localhost:5000 fallback when developing locally
 */
export const executeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    // If running on localhost and remote fetch fails (e.g. network/SSL error), try local backend
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      url.startsWith(API_BASE) &&
      !url.includes("localhost:5000")
    ) {
      const localUrl = url.replace(API_BASE, "http://localhost:5000/api/v1");
      res = await fetch(localUrl, options);
    } else {
      throw netErr;
    }
  }

  // If cloud API returns 404 (endpoint not deployed on cloud yet), retry with local backend
  if (
    res.status === 404 &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    url.startsWith(API_BASE) &&
    !url.includes("localhost:5000")
  ) {
    try {
      const localUrl = url.replace(API_BASE, "http://localhost:5000/api/v1");
      const localRes = await fetch(localUrl, options);
      if (localRes.status !== 404) {
        return localRes;
      }
    } catch {
      // Local backend not reachable, keep original response
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
