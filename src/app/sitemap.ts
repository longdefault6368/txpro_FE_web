import type { MetadataRoute } from "next";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { buildNewsSitemap } from "@/lib/news-sitemap";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildNewsSitemap(await getNewsSiteOrigin());
}
