import type { Metadata } from "next";
import { fetchCompanyInfo, type CompanyInfo } from "@/utils/companyInfo";
import { safeStructuredJson } from "@/lib/news-seo";
import type { CareerJob } from "@/lib/careers-data";

export const SITE_NAME = "TXE PRO";
export const PRODUCTION_SITE_ORIGIN = "https://txepro.vn";
export const HOME_TITLE = "TXE PRO | Tìm xe chở hàng và kết nối tài xế";
export const HOME_DESCRIPTION = "Đăng nhu cầu tìm xe, chọn tài xế theo tuyến và theo dõi hành trình. Dành cho khách hàng cần chở hàng hoặc di chuyển và tài xế có xe trống.";
export const SHARE_IMAGE = "/og-txepro.jpg";
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

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
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [{ url: SHARE_IMAGE, width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, alt: title || SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  };
}

/** Env origin wins. The live process is `next dev`, so a missing origin still uses the public site except in automated tests. */
export function resolveMetadataOrigin(
  configured: string | null,
  nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined
) {
  return configured || (nodeEnv === "test" ? null : PRODUCTION_SITE_ORIGIN);
}

export function rootMetadata(origin: string | null): Metadata {
  const googleVerification = (
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION : "") || ""
  ).trim();
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    metadataBase: origin ? new URL(origin) : null,
    icons: { icon: "/logo-circle.png", apple: "/apple-icon.png" },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [{ url: SHARE_IMAGE, width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION, images: [SHARE_IMAGE] },
  };
}

const text = (value: string) => value.trim() || null;

export async function loadIndexableCompany(): Promise<Partial<CompanyInfo>> {
  try {
    return await fetchCompanyInfo({ revalidate: 300 });
  } catch {
    return {};
  }
}

export function websiteStructuredData(origin: string | null, company: Partial<CompanyInfo>) {
  const legalName = text(company.companyName || "");
  const phone = text(company.phoneSupport || company.hotline || "");
  const email = text(company.emailSupport || company.emailGeneral || "");
  const address = text(company.addressHcm || company.addressHn || "");
  const sameAs = [company.facebookUrl, company.zaloUrl]
    .map((item) => text(item || ""))
    .filter((item): item is string => Boolean(item));
  const downloadUrls = [company.googlePlayUrl, company.appStoreUrl]
    .map((item) => text(item || ""))
    .filter((item): item is string => Boolean(item));

  const orgId = origin ? origin + "/#organization" : undefined;
  const websiteId = origin ? origin + "/#website" : undefined;

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    ...(orgId ? { "@id": orgId } : {}),
    name: SITE_NAME,
    alternateName: ["TXEPRO"],
    ...(legalName ? { legalName } : {}),
    ...(origin
      ? {
          url: origin,
          logo: {
            "@type": "ImageObject",
            url: origin + "/logo-circle.png",
            width: 430,
            height: 430,
          },
          image: origin + SHARE_IMAGE,
        }
      : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(phone || email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...(phone ? { telephone: phone } : {}),
            ...(email ? { email } : {}),
            contactType: "customer support",
            areaServed: "VN",
            availableLanguage: ["Vietnamese", "English", "Chinese"],
          },
        }
      : {}),
    ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    ...(websiteId ? { "@id": websiteId } : {}),
    name: SITE_NAME,
    alternateName: ["TXEPRO"],
    inLanguage: "vi",
    ...(origin ? { url: origin } : {}),
    publisher: orgId ? { "@id": orgId } : { "@type": "Organization", name: SITE_NAME },
  };

  const mobileApp: Record<string, unknown> = {
    "@type": "MobileApplication",
    name: SITE_NAME,
    alternateName: ["TXEPRO"],
    operatingSystem: "Android, iOS",
    applicationCategory: "BusinessApplication",
    inLanguage: "vi",
    ...(origin ? { url: origin, image: origin + SHARE_IMAGE } : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    ...(downloadUrls.length
      ? {
          downloadUrl: downloadUrls[0],
          ...(downloadUrls.length > 1 ? { sameAs: downloadUrls } : {}),
        }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, mobileApp],
  };
}

export function breadcrumbStructuredData(
  origin: string | null,
  items: Array<{ name: string; path?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(origin && item.path ? { item: origin + item.path } : {}),
    })),
  };
}

export function faqStructuredData(
  entries: Array<{ question: string; paragraphs?: string[]; answer?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "vi",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer || (entry.paragraphs || []).join(" "),
      },
    })),
  };
}

export function serviceStructuredData(
  origin: string | null,
  params: {
    path: string;
    name: string;
    description: string;
    serviceType: string;
    areaServed?: string | string[];
    image?: string;
    company?: Partial<CompanyInfo>;
  }
) {
  const orgName = text(params.company?.companyName || "") || SITE_NAME;
  const areaServed = Array.isArray(params.areaServed)
    ? params.areaServed.map((place) => ({ "@type": "Place", name: place }))
    : { "@type": "Country", name: params.areaServed || "Việt Nam" };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    description: params.description,
    serviceType: params.serviceType,
    inLanguage: "vi",
    ...(origin ? { url: origin + params.path } : {}),
    ...(origin && params.image ? { image: origin + params.image } : {}),
    areaServed,
    provider: {
      "@type": "Organization",
      ...(origin ? { "@id": origin + "/#organization", url: origin } : {}),
      name: orgName,
    },
  };
}

export function itemListStructuredData(
  origin: string | null,
  params: {
    path: string;
    name: string;
    description: string;
    items: Array<{ name: string; path: string; description?: string }>;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    inLanguage: "vi",
    ...(origin ? { url: origin + params.path } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: params.items.length,
      itemListElement: params.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(origin ? { url: origin + item.path } : {}),
      })),
    },
  };
}

export function contactPageStructuredData(origin: string | null, company: Partial<CompanyInfo>) {
  const phone = text(company.phoneSupport || company.hotline || "");
  const email = text(company.emailSupport || company.emailGeneral || "");
  const address = text(company.addressHcm || company.addressHn || "");
  const legalName = text(company.companyName || "");
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Liên hệ TXE PRO",
    inLanguage: "vi",
    ...(origin ? { url: origin + "/thong-tin/lien-he" } : {}),
    mainEntity: {
      "@type": "Organization",
      ...(origin ? { "@id": origin + "/#organization", url: origin } : {}),
      name: SITE_NAME,
      ...(legalName ? { legalName } : {}),
      ...(phone ? { telephone: phone } : {}),
      ...(email ? { email } : {}),
      ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" } } : {}),
    },
  };
}

export function aboutPageStructuredData(origin: string | null, company: Partial<CompanyInfo>) {
  const legalName = text(company.companyName || "");
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Giới thiệu TXE PRO",
    description: "TXE PRO kết nối khách hàng có nhu cầu tìm xe với tài xế có xe trống theo tuyến và lịch chạy.",
    inLanguage: "vi",
    ...(origin ? { url: origin + "/thong-tin/gioi-thieu" } : {}),
    mainEntity: {
      "@type": "Organization",
      ...(origin ? { "@id": origin + "/#organization", url: origin } : {}),
      name: SITE_NAME,
      ...(legalName ? { legalName } : {}),
    },
  };
}

export function jobPostingsStructuredData(
  origin: string | null,
  jobs: CareerJob[],
  company: Partial<CompanyInfo>
) {
  const orgName = text(company.companyName || "") || SITE_NAME;
  return {
    "@context": "https://schema.org",
    "@graph": jobs.map((job) => {
      const isRemoteCapable = /từ xa|remote|online/i.test(job.location.vi);
      const isFlexibleOnline = /online|bán thời gian|linh hoạt/i.test(job.type.vi);
      return {
        "@type": "JobPosting",
        identifier: {
          "@type": "PropertyValue",
          name: SITE_NAME,
          value: job.id,
        },
        title: job.title.vi,
        description: [
          job.overview.vi,
          "Công việc chính: " + job.duties.vi.join(" "),
          "Yêu cầu: " + job.requirements.vi.join(" "),
          "Quyền lợi: " + job.benefits.vi.join(" "),
        ].join(" "),
        employmentType: isFlexibleOnline ? ["FULL_TIME", "PART_TIME"] : "FULL_TIME",
        inLanguage: "vi",
        ...(origin ? { url: origin + "/tuyen-dung#job-" + job.id } : {}),
        hiringOrganization: {
          "@type": "Organization",
          name: orgName,
          ...(origin ? { sameAs: origin, logo: origin + "/logo-circle.png" } : {}),
        },
        ...(job.baseSalaryVnd
          ? {
              baseSalary: {
                "@type": "MonetaryAmount",
                currency: "VND",
                value: {
                  "@type": "QuantitativeValue",
                  minValue: job.baseSalaryVnd,
                  unitText: "MONTH",
                },
              },
            }
          : {}),
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Huế",
            addressRegion: "Thừa Thiên Huế",
            addressCountry: "VN",
          },
        },
        ...(isRemoteCapable
          ? {
              jobLocationType: "TELECOMMUTE",
              applicantLocationRequirements: { "@type": "Country", name: "Vietnam" },
            }
          : {}),
      };
    }),
  };
}

export const structuredDataScript = (data: unknown) => safeStructuredJson(data);
