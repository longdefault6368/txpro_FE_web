export class PostingError extends Error {
  constructor(message: string, public code = "", public details: Record<string, unknown> = {}, public uncertain = false) { super(message); }
}
export function createPostingTransport({ base, token, refresh, send = fetch }: {
  base: string; token: () => string | null; refresh: () => Promise<string | null>; send?: typeof fetch;
}) {
  return async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) throw new PostingError("Đường dẫn API không hợp lệ.");
    const mutation = Boolean(options.method && options.method.toUpperCase() !== "GET");
    const run = (accessToken: string | null) => {
      const headers = new Headers(options.headers);
      if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
      if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
      return send(base + path, { ...options, signal: options.signal || AbortSignal.timeout(25000), cache: "no-store", headers });
    };
    const accessToken = authenticated ? token() : null;
    if (authenticated && !accessToken) throw new PostingError("Vui lòng đăng nhập.", "LOGIN_REQUIRED");
    let res: Response;
    try {
      res = await run(accessToken);
      // Only a definite pre-authentication rejection may be replayed.
      // Network errors/timeouts are never automatically retried.
      if (res.status === 401 && authenticated) {
        const next = await refresh();
        if (!next) throw new PostingError("Phiên đăng nhập đã hết hạn.", "LOGIN_REQUIRED");
        res = await run(next);
      }
    } catch (error) {
      if (error instanceof PostingError || (!mutation && error instanceof DOMException && error.name === "AbortError")) throw error;
      throw new PostingError(mutation
        ? "Chưa xác định được kết quả. Vui lòng kiểm tra Tin/đơn của tôi trước khi thực hiện lại."
        : "Không kết nối được máy chủ. Vui lòng thử lại.", "NETWORK_ERROR", {}, mutation);
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new PostingError(body?.message || "Không thực hiện được yêu cầu.", body?.errorCode || "",
      body?.data && typeof body.data === "object" ? body.data : {}, mutation && res.status >= 500);
    if (!body || !("data" in body)) throw new PostingError("Máy chủ chưa trả đủ dữ liệu. Vui lòng kiểm tra Tin/đơn của tôi.", "INVALID_RESPONSE", {}, mutation);
    return body.data as T;
  };
}
