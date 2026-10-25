import { validLocation, type LocationValue } from "./posting-contract";

export type PostingRole = "chu-hang" | "tai-xe";
export type HomePostingDraft = {
  role: PostingRole; pickup: LocationValue; dropoff: LocationValue;
  vehicleType: string; scheduled: boolean; from: string; to: string; price: string;
  child?: string; weightLabel?: string; cargo?: string;
};
type DraftStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const PREFIX = "txpro_home_posting_v1:";
const TTL = 60 * 60 * 1000;
const paths: Record<PostingRole, string> = { "chu-hang": "/chu-hang/form-tao-don", "tai-xe": "/tai-xe/dang-tin" };

export function homePostingPath(role: PostingRole) { return paths[role] + "?from=home"; }
function safeLocation(value: unknown): LocationValue | null {
  if (!value || typeof value !== "object") return null;
  const item = value as LocationValue;
  if (typeof item.address !== "string" || item.address.length > 1000 || !validLocation(item)) return null;
  return { address: item.address, lat: item.lat, lng: item.lng,
    ...(typeof item.placeId === "string" ? { placeId: item.placeId.slice(0, 300) } : {}) };
}
function parseDraft(value: unknown, role: PostingRole, now: number): HomePostingDraft | null {
  if (role !== "chu-hang" && role !== "tai-xe") return null;
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const pickup = safeLocation(item.pickup), dropoff = safeLocation(item.dropoff);
  if (item.role !== role || !pickup || !dropoff || typeof item.scheduled !== "boolean") return null;
  if (typeof item.vehicleType !== "string" || item.vehicleType.length > 200) return null;
  if (typeof item.from !== "string" || typeof item.to !== "string" || typeof item.price !== "string") return null;
  const from = Date.parse(item.from), to = Date.parse(item.to);
  if ((role === "tai-xe" || item.scheduled) && (!Number.isFinite(from) || from <= now)) return null;
  if (role === "tai-xe" && (!Number.isFinite(to) || to <= from || !/^\d{1,12}$/.test(item.price) || Number(item.price) <= 0)) return null;
  return { role, pickup, dropoff, vehicleType: item.vehicleType, scheduled: item.scheduled,
    ...(role === "chu-hang" ? Object.fromEntries(["child", "weightLabel", "cargo"].map(key => [key, typeof item[key] === "string" ? (item[key] as string).slice(0, 200) : ""])) : {}),
    from: role === "tai-xe" || item.scheduled ? item.from : "", to: role === "tai-xe" ? item.to : "", price: role === "tai-xe" ? item.price : "" };
}
export function saveHomePostingDraft(storage: DraftStore, draft: HomePostingDraft, now = Date.now()) {
  const safe = parseDraft(draft, draft.role, now);
  if (!safe) throw new Error("INVALID_DRAFT");
  storage.setItem(PREFIX + draft.role, JSON.stringify({ createdAt: now, draft: safe }));
  return homePostingPath(draft.role);
}
/** Called only after auth/catalog checks, and only on an explicit ?from=home visit. */
export function takeHomePostingDraft(storage: DraftStore, role: PostingRole, query: string, now = Date.now()): HomePostingDraft | null {
  const params = new URLSearchParams(query);
  if (params.get("from") !== "home" || params.has("order")) return null;
  try {
    const key = PREFIX + role, raw = storage.getItem(key);
    if (!raw || raw.length > 12000) { storage.removeItem(key); return null; }
    const data = JSON.parse(raw);
    storage.removeItem(key);
    if (!Number.isFinite(data.createdAt) || data.createdAt > now || now - data.createdAt >= TTL) return null;
    return parseDraft(data.draft, role, now);
  } catch { return null; }
}
