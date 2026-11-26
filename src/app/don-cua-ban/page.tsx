import type { Metadata } from "next";
import OrdersWorkspace from "@/components/posting/OrdersWorkspace";

export const metadata: Metadata = {
  title: "Đơn của bạn | TXE PRO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OrdersWorkspace />;
}
