import { Suspense } from "react";
import type { Metadata } from "next";
import TrackingWorkspace from "@/components/tracking/TrackingWorkspace";
export const metadata: Metadata = { title: "Theo dõi đơn hàng | TXE PRO", description: "Tra cứu trạng thái hành trình bằng mã đơn TXE PRO.", robots: { index: false, follow: true } };
export default function TrackingPage() { return <Suspense fallback={<main style={{ minHeight: "70vh", padding: "130px 24px" }} role="status">Đang tải trang theo dõi…</main>}><TrackingWorkspace /></Suspense>; }
