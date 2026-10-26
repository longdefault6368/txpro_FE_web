import type { MetadataRoute } from "next";
import { getNewsSiteOrigin } from "@/lib/news-site";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getNewsSiteOrigin();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/user", "/api/", "/route-tracking", "/don-cua-ban", "/tai-xe/phuong-tien"] },
    ...(origin ? { sitemap: origin + "/sitemap.xml" } : {}) };
}
