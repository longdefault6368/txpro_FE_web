
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";
export const API_BASE = `${API_BASE_URL}/api/v1`;

/**
 * Wrapper around standard fetch to automatically handle token expiry (401 Unauthorized)
 * by silently calling the refresh token API and retrying the failed request.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = typeof window !== "undefined" ? localStorage.getItem("txpro_token") : null;

  // Initialize headers if not present
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  options.headers = headers;

  let res = await fetch(url, options);

  // If unauthorized, attempt to perform silent token refresh
  if (res.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("txpro_refresh_token");
    if (refreshToken) {
      try {
        console.log("Access token expired, attempting silent refresh...");
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.data.accessToken;
          const newRefreshToken = refreshData.data.refreshToken;

          // Save new tokens to local storage
          localStorage.setItem("txpro_token", newAccessToken || "");
          if (newRefreshToken) {
            localStorage.setItem("txpro_refresh_token", newRefreshToken);
          }

          console.log("Token refreshed successfully. Retrying original request...");
          // Update headers and retry the fetch request
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set("Authorization", `Bearer ${newAccessToken || ""}`);
          options.headers = retryHeaders;
          res = await fetch(url, options);
        } else {
          console.warn("Refresh token expired. Logging out user...");
          // Refresh token also expired, sign out user
          localStorage.removeItem("txpro_token");
          localStorage.removeItem("txpro_refresh_token");
          localStorage.removeItem("txpro_user_session");
          window.dispatchEvent(new Event("storage"));
          
          // Redirect to correct login page depending on path
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else {
            window.location.href = "/login";
          }
        }
      } catch (err) {
        console.error("Token refresh processing error:", err);
      }
    }
  }

  return res;
};
