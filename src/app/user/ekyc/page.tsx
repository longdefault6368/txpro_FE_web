import type { Metadata } from "next";
import KycWorkspace from "@/components/onboarding/KycWorkspace";

export const metadata: Metadata = {
  title: "Xác thực hồ sơ eKYC | TXE PRO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <KycWorkspace />;
}
