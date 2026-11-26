import { notFound } from "next/navigation";
import InfoPageClient from "@/components/info/InfoPageClient";
import { INFO_PAGES, isInfoPageSlug } from "@/lib/info-pages";
import { siteOrigin } from "@/lib/news-seo";
import {
  aboutPageStructuredData,
  breadcrumbStructuredData,
  loadIndexableCompany,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isInfoPageSlug(slug)) notFound();

  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const page = INFO_PAGES[slug];
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Trung tâm trợ giúp", path: "/tro-giup" },
    { name: page.breadcrumbLabel, path: "/thong-tin/" + slug },
  ]);
  const aboutData =
    slug === "gioi-thieu" ? aboutPageStructuredData(origin, await loadIndexableCompany()) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      {aboutData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(aboutData) }} />
      )}
      <InfoPageClient slug={slug} />
    </>
  );
}
