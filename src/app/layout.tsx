import type { Metadata } from "next";
import localFont from "next/font/local";
import NextTopLoader from "nextjs-toploader";
import FirstLoadProgressBar from "@/components/common/FirstLoadProgressBar";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "../../public/PlusJakartaSans-Variable.ttf",
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TXEPRO - Hệ Sinh Thái Vận Tải Thông Minh",
  description: "TXEPRO - Nền tảng kết nối chủ hàng và tài xế thời gian thực. Tối ưu chi phí, an toàn và minh bạch.",
  icons: {
    icon: "/logo-circle.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${plusJakartaSans.variable} font-sans antialiased selection:bg-primary-600 selection:text-white relative`}>
        <LanguageProvider>
          <FirstLoadProgressBar />
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
        </LanguageProvider>
      </body>
    </html>
  );
}
