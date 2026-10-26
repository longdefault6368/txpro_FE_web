import { cache } from "react";
import { API_BASE } from "@/config/env";
import { siteOrigin } from "./news-seo";
// The canonical domain is configuration, never inferred from an untrusted Host header.
export const getNewsSiteOrigin = cache(async () => {
  const configured = siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;
  try {
    const response = await fetch(API_BASE + "/contacts/company-info", { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const result = await response.json();
    return typeof result?.data?.websiteUrl === "string" ? siteOrigin(result.data.websiteUrl) : null;
  } catch { return null; }
});
