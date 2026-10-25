"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, BarChart3 } from "lucide-react";
import { postingRequest } from "@/utils/posting-api";

interface Overview {
  metrics: { totalUsers: number; totalDrivers: number; totalShippers: number; totalOrders: number; activeDrivers: number; pendingKyc: number };
  statusBreakdown: Record<string, { label: string; count: number; percent: number }>;
  topCorridors: { route: string; count: number }[];
}
export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await postingRequest<Overview>("/admin/users/overview");
      if (!result?.metrics || !result?.statusBreakdown) throw new Error("Backend chưa trả đủ dữ liệu thống kê.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa tải được thống kê."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const metrics = data ? [
    ["Người dùng", data.metrics.totalUsers], ["Tài xế", data.metrics.totalDrivers],
    ["Chủ hàng", data.metrics.totalShippers], ["Đơn hàng", data.metrics.totalOrders],
    ["Tài xế hoạt động", data.metrics.activeDrivers], ["Hồ sơ chờ duyệt", data.metrics.pendingKyc],
  ] as const : [];
  return <div className="space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><BarChart3 />Phân tích hệ thống</h1>
        <p className="mt-2 text-sm text-slate-500">Dữ liệu tổng hợp từ backend đang kết nối.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Làm mới</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}{data ? " Đang giữ dữ liệu của lần tải thành công trước." : ""}</p>}
    {loading && !data && <div role="status" aria-label="Đang tải thống kê" className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>}
    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value.toLocaleString("vi-VN")}</p></div>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5"><h2 className="mb-5 text-lg font-bold">Trạng thái đơn hàng</h2>
          <div className="space-y-5">{Object.entries(data.statusBreakdown).map(([key, item]) => <div key={key}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{item.label}</span><span className="font-bold">{item.count.toLocaleString("vi-VN")}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary-600" style={{ width: Math.min(100, Math.max(0, item.percent)) + "%" }} /></div></div>)}</div>
        </section>
        <section className="rounded-2xl border bg-white p-5"><h2 className="mb-5 text-lg font-bold">Tuyến vận chuyển</h2>
          {data.topCorridors?.length ? <ul className="divide-y">{data.topCorridors.map((item, index) => <li key={index} className="flex justify-between gap-4 py-3 text-sm"><span>{item.route}</span><span className="shrink-0 font-bold">{item.count} đơn</span></li>)}</ul> : <p className="text-sm text-slate-500">Chưa có dữ liệu tuyến vận chuyển.</p>}
        </section>
      </div>
    </>}
  </div>;
}
