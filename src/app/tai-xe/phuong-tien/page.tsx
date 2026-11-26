import type { Metadata } from "next";
import VehicleWorkspace from "@/components/onboarding/VehicleWorkspace";

export const metadata: Metadata = {
  title: "Quản lý phương tiện | TXE PRO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VehicleWorkspace />;
}
