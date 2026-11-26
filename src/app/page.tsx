import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import LandingExperience from "@/components/sections/LandingExperience";
import { getPublicNews } from "@/lib/news-public";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { HOME_DESCRIPTION, HOME_TITLE, loadIndexableCompany, publicPageMetadata, structuredDataScript, websiteStructuredData } from "@/lib/site-seo";

export const revalidate = 300;
export const metadata = publicPageMetadata({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION });

export default async function Home() {
  const [origin, company, initialNews] = await Promise.all([
    getNewsSiteOrigin(),
    loadIndexableCompany(),
    getPublicNews({ page: 1, limit: 4, revalidate: 300 }).catch(() => null),
  ]);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(websiteStructuredData(origin, company)) }} />
    <Header /><LandingExperience initialNews={initialNews} /><Footer />
  </>;
}
