export type AppPlatform = "android" | "ios";
/** Only link to an explicit app listing, never to an arbitrary configured URL. */
export function appStoreUrl(raw: unknown, platform: AppPlatform): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (platform === "android") {
      if (url.hostname !== "play.google.com" || url.pathname !== "/store/apps/details" ||
          !/^[a-zA-Z][\w]*(?:\.[\w]+)+$/.test(url.searchParams.get("id") || "")) return null;
    } else if (url.hostname !== "apps.apple.com" || !/^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
export function appDownloadLink(raw: unknown, platform: AppPlatform) {
  const url = appStoreUrl(raw, platform);
  return { href: url || "/thong-tin/lien-he?topic=tai-ung-dung&platform=" + platform, available: Boolean(url) };
}
