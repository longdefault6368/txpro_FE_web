import type { Metadata } from "next";
import { INFO_PAGE_SLUGS, INFO_PAGES, isInfoPageSlug } from "@/lib/info-pages";
import { publicPageMetadata } from "@/lib/site-seo";

export function generateStaticParams() {
  return INFO_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isInfoPageSlug(slug)) {
    return {
      title: "Không tìm thấy trang | TXE PRO",
      robots: { index: false, follow: false },
    };
  }
  const page = INFO_PAGES[slug];
  return publicPageMetadata({ path: "/thong-tin/" + slug, title: page.title, description: page.description });
}

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
