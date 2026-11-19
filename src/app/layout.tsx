import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteOrigin } from "@/lib/news-seo";
import { resolveMetadataOrigin, rootMetadata } from "@/lib/site-seo";
import NextTopLoader from "nextjs-toploader";
import GlobalChatWidget from "@/components/common/GlobalChatWidget";
import ScrollToTop from "@/components/common/ScrollToTop";
import MobileBottomBar from "@/components/common/MobileBottomBar";
import { LanguageProvider } from "@/context/LanguageContext";
import { CompanyInfoProvider } from "@/context/CompanyInfoContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "../../public/PlusJakartaSans-Variable.ttf",
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = rootMetadata(resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL)));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${plusJakartaSans.variable} font-sans antialiased selection:bg-primary-600 selection:text-white relative`}>
        <LanguageProvider>
          <CompanyInfoProvider>
            <ToastProvider>
              <NextTopLoader
                color="#2563eb" // primary-600 theme color
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #2563eb,0 0 5px #2563eb"
              />
              {children}
              <ScrollToTop />
              <GlobalChatWidget />
              <MobileBottomBar />
            </ToastProvider>
          </CompanyInfoProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
