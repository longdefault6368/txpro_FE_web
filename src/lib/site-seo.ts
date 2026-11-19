import type { Metadata } from "next";
import { fetchCompanyInfo, type CompanyInfo } from "@/utils/companyInfo";
import { safeStructuredJson } from "@/lib/news-seo";

export const SITE_NAME = "TXE PRO";
export const PRODUCTION_SITE_ORIGIN = "https://txepro.vn";
export const HOME_TITLE = "TXE PRO | Tìm xe chở hàng và kết nối tài xế";
export const HOME_DESCRIPTION = "Đăng nhu cầu tìm xe, chọn tài xế theo tuyến và theo dõi hành trình. Dành cho khách hàng cần chở hàng hoặc di chuyển và tài xế có xe trống.";
const SHARE_IMAGE = "/logo-mark.webp";

export function publicPageMetadata({ title, description, path, index = true }: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index, follow: true },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [{ url: SHARE_IMAGE, alt: SITE_NAME }],
    },
    twitter: { card: "summary", title, description, images: [SHARE_IMAGE] },
  };
}

/** Env origin wins. The live process is `next dev`, so a missing origin still uses the public site except in automated tests. */
export function resolveMetadataOrigin(configured: string | null, nodeEnv = process.env.NODE_ENV) {
  return configured || (nodeEnv === "test" ? null : PRODUCTION_SITE_ORIGIN);
}

export function rootMetadata(origin: string | null): Metadata {
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    metadataBase: origin ? new URL(origin) : null,
    icons: { icon: "/logo-circle.png" },
  };
}

const text = (value: string) => value.trim() || null;

export async function loadIndexableCompany(): Promise<Partial<CompanyInfo>> {
  try {
    return await fetchCompanyInfo();
  } catch {
    return {};
  }
}

export function websiteStructuredData(origin: string | null, company: Partial<CompanyInfo>) {
  const legalName = text(company.companyName || "");
  const phone = text(company.phoneSupport || company.hotline || "");
  const email = text(company.emailSupport || company.emailGeneral || "");
  const address = text(company.addressHcm || company.addressHn || "");
  const sameAs = [company.facebookUrl, company.zaloUrl].map(item => text(item || "")).filter((item): item is string => Boolean(item));
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["TXEPRO"],
    ...(legalName ? { legalName } : {}),
    ...(origin ? { url: origin, logo: origin + SHARE_IMAGE } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: ["TXEPRO"],
        inLanguage: "vi",
        ...(origin ? { url: origin } : {}),
        publisher: { "@type": "Organization", name: SITE_NAME },
      },
    ],
  };
}

export const structuredDataScript = (data: unknown) => safeStructuredJson(data);
