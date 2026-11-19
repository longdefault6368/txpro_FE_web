import { cache } from "react";
import { API_BASE } from "@/config/env";
import { siteOrigin } from "./news-seo";
import { resolveMetadataOrigin } from "./site-seo";
// The canonical domain is configuration, never inferred from an untrusted Host header.
export const getNewsSiteOrigin = cache(async () => {
  const configured = siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;
  try {
    const response = await fetch(API_BASE + "/contacts/company-info", { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const result = await response.json();
      const fromAdmin = typeof result?.data?.websiteUrl === "string" ? siteOrigin(result.data.websiteUrl) : null;
      if (fromAdmin) return fromAdmin;
    }
  } catch { /* The public origin below still keeps canonicals and the sitemap. */ }
  return resolveMetadataOrigin(null);
});
