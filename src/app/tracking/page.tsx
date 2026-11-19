import { Suspense } from "react";
import TrackingWorkspace from "@/components/tracking/TrackingWorkspace";
import { publicPageMetadata } from "@/lib/site-seo";
export const metadata = publicPageMetadata({
  path: "/tracking",
  title: "Theo dõi hành trình vận chuyển | TXE PRO",
  description: "Tra cứu chuyến đi bằng mã đơn và xem vị trí, trạng thái trên bản đồ TXE PRO.",
});
export default function TrackingPage() { return <Suspense fallback={<main style={{ minHeight: "70vh", padding: "130px 24px" }} role="status">Đang tải trang theo dõi…</main>}><TrackingWorkspace /></Suspense>; }
