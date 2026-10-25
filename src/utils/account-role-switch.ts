/** Role changes are server operations, never a local display preference. */
export type AccountRole = "tai-xe" | "chu-hang";
export type RoleProfile = { id?: string; _id?: string; role: string; fullName?: string; name?: string; email?: string | null };
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
export const ROLE_CHANGED_KEY = "txpro_role_changed";
const SESSION_KEYS = ["txpro_token", "txpro_refresh_token", "txpro_user_session"];
export function isAccountRole(role: unknown): role is AccountRole { return role === "tai-xe" || role === "chu-hang"; }
export function roleDestination(role: AccountRole, posting = false) {
  return posting ? role === "tai-xe" ? "/tai-xe/dang-tin" : "/chu-hang/form-tao-don" : "/user";
}
export class RoleSwitchError extends Error {
  constructor(public code: "SESSION_CHANGED" | "INVALID_RESPONSE" | "STORAGE_ERROR" | "FORBIDDEN" | "BUSY", public recovery = false) { super(code); }
}
export function clearRoleSession(storage: Storage) {
  for (const key of SESSION_KEYS) { try { storage.removeItem(key); } catch { /* Best effort if browser storage is unavailable. */ } }
}
/** Recovery belongs to the failed attempt, never to a newer sign-in in another tab. */
export function recoverRoleSession(storage: Storage, expectedSession: string | null, destination: string) {
  if (storage.getItem("txpro_user_session") !== expectedSession && storage.getItem("txpro_token")) return "/user";
  clearRoleSession(storage);
  return "/login?next=" + encodeURIComponent(destination);
}
export function createRoleSwitcher(request: Request, storage: Storage) {
  let busy = false;
  return async (target: AccountRole, expected: RoleProfile) => {
    if (busy) throw new RoleSwitchError("BUSY");
    if (!isAccountRole(target) || !isAccountRole(expected.role)) throw new RoleSwitchError("FORBIDDEN");
    busy = true;
    try {
      const session = storage.getItem("txpro_user_session");
      const unchanged = () => Boolean(storage.getItem("txpro_token")) && storage.getItem("txpro_user_session") === session;
      const current = await request<{ user: RoleProfile }>("/auth/me");
      const id = String(current?.user?.id || current?.user?._id || "");
      if (!unchanged() || !id || id !== String(expected.id || expected._id || "") || current.user.role !== expected.role) {
        throw new RoleSwitchError("SESSION_CHANGED", true);
      }
      if (!isAccountRole(current.user.role)) throw new RoleSwitchError("FORBIDDEN");
      const result = await request<{ userProfile?: RoleProfile; user?: RoleProfile; accessToken: string; refreshToken: string; role: string }>("/auth/switch-role", {
        method: "POST", body: JSON.stringify({ role: target }),
      });
      // A logout/sign-in in another tab must not be overwritten by an older response.
      if (!unchanged()) throw new RoleSwitchError("SESSION_CHANGED", true);
      const profile = result?.userProfile || result?.user;
      if (!profile || String(profile.id || profile._id || "") !== id || profile.role !== target || result.role !== target ||
          typeof result.accessToken !== "string" || !result.accessToken.trim() ||
          typeof result.refreshToken !== "string" || !result.refreshToken.trim()) {
        throw new RoleSwitchError("INVALID_RESPONSE", true);
      }
      try {
        storage.setItem("txpro_token", result.accessToken);
        storage.setItem("txpro_refresh_token", result.refreshToken);
        storage.setItem("txpro_user_session", JSON.stringify({
          id, name: profile.fullName || profile.name || "TXEPRO", email: profile.email || "",
          role: target === "tai-xe" ? "Tài Xế" : "Chủ Hàng", rawRole: target,
        }));
      } catch {
        // The server has already changed roles: never restore stale credentials.
        clearRoleSession(storage);
        throw new RoleSwitchError("STORAGE_ERROR", true);
      }
      // Commit marker is last. Other tabs reload only after both tokens + profile exist.
      try { storage.setItem(ROLE_CHANGED_KEY, JSON.stringify({ role: target, at: Date.now(), nonce: Math.random() })); } catch { /* This tab can still continue safely. */ }
      return profile;
    } finally { busy = false; }
  };
}
