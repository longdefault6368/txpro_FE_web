import { API_BASE } from "@/config/env";
export type CommunityRole = "chu-hang" | "tai-xe";
export type CommunityProfile = { id: string; role: CommunityRole; displayName: string; region: string; introduction: string };
export class CommunityRequestError extends Error {
  constructor(public status: number) { super("COMMUNITY_UNAVAILABLE"); }
}
export function normalizeCommunity(value: unknown, role: CommunityRole): CommunityProfile | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !/^[a-f\d-]{36}$/i.test(item.id) || item.role !== role ||
      typeof item.displayName !== "string" || !item.displayName.trim() || item.displayName.length > 60 ||
      typeof item.region !== "string" || item.region.length > 60 || typeof item.introduction !== "string" || item.introduction.length > 180) return null;
  // Explicit projection; never spread arbitrary backend account properties into the UI.
  return { id: item.id, role, displayName: item.displayName.trim(), region: item.region, introduction: item.introduction };
}
export async function getCommunityProfiles(role: CommunityRole, signal: AbortSignal): Promise<CommunityProfile[]> {
  const response = await fetch(API_BASE + "/public/community?role=" + role + "&limit=6", {
    credentials: "omit", cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  if (!response.ok) throw new CommunityRequestError(response.status);
  const body = await response.json();
  if (!body.success || !Array.isArray(body.data?.items)) throw new Error("COMMUNITY_INVALID_RESPONSE");
  const seen = new Set<string>();
  return body.data.items.map((item: unknown) => normalizeCommunity(item, role)).filter((item: CommunityProfile | null): item is CommunityProfile => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id); return true;
  }).slice(0, 6);
}
