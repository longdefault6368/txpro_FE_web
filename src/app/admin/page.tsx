"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import {
  Users, Truck, Package, ShoppingCart, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Loader
} from "lucide-react";

interface OverviewMetrics {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  activeDrivers: number;
  totalOrders: number;
  totalViolations: number;
  pendingKyc: number;
}

interface RecentOrder {
  _id: string;
  orderCode: string;
  title: string;
  status: string;
  offerPrice?: number;
  budget?: number;
  createdAt: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  searching_driver: { label: "Tìm tài xế", color: "text-blue-600 bg-blue-50", icon: Loader },
  waiting_driver: { label: "Đang chờ tài xế", color: "text-amber-600 bg-amber-50", icon: Clock },
  waiting_driver_acceptance: { label: "Chờ tài xế nhận", color: "text-purple-600 bg-purple-50", icon: Clock },
  accepted: { label: "Đã nhận đơn", color: "text-indigo-600 bg-indigo-50", icon: CheckCircle },
  rejected: { label: "Đã từ chối", color: "text-rose-600 bg-rose-50", icon: XCircle },
  in_progress: { label: "Đang vận chuyển", color: "text-primary-600 bg-primary-50", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700 bg-emerald-100", icon: CheckCircle },
  cancelled: { label: "Đã hủy đơn", color: "text-red-600 bg-red-50", icon: XCircle },
};

// Mock data for offline
const MOCK_METRICS: OverviewMetrics = {
  totalUsers: 247,
  totalDrivers: 128,
  totalShippers: 112,
  activeDrivers: 89,
  totalOrders: 1543,
  totalViolations: 12,
  pendingKyc: 7
};

const MOCK_ORDERS: RecentOrder[] = [
  { _id: "o1", orderCode: "ORD-20260709-001", title: "Vận chuyển hàng điện tử", status: "in_progress", offerPrice: 2500000, createdAt: "2026-07-09T10:30:00Z" },
  { _id: "o2", orderCode: "ORD-20260709-002", title: "Chuyển đồ nội thất", status: "delivered", offerPrice: 4200000, createdAt: "2026-07-09T08:15:00Z" },
  { _id: "o3", orderCode: "ORD-20260708-005", title: "Giao hàng thực phẩm", status: "searching_driver", budget: 800000, createdAt: "2026-07-08T14:00:00Z" },
  { _id: "o4", orderCode: "ORD-20260708-004", title: "Vận chuyển vật liệu xây dựng", status: "accepted", offerPrice: 6800000, createdAt: "2026-07-08T09:45:00Z" },
  { _id: "o5", orderCode: "ORD-20260707-010", title: "Chuyển hàng may mặc", status: "cancelled", budget: 1200000, createdAt: "2026-07-07T16:20:00Z" },
];

function AdminDashboardContent() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);

      try {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/overview`);

        if (res.ok) {
          const data = await res.json();
          setMetrics(data.data.metrics);
          setRecentOrders(data.data.recentOrders || []);
          setIsOffline(false);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("API error:", errData.message || "Failed to fetch overview");
          setIsOffline(false);
        }
      } catch (err) {
        console.warn("Backend connection failed, using local mock fallback", err);
        setIsOffline(true);
        setMetrics(MOCK_METRICS);
        setRecentOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Tổng Người Dùng",
      value: metrics?.totalUsers || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50"
    },
    {
      label: "Tổng Tài Xế",
      value: metrics?.totalDrivers || 0,
      icon: Truck,
      trend: `${metrics?.activeDrivers || 0} đang hoạt động`,
      trendUp: true,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50"
    },
    {
      label: "Tổng Chủ Hàng",
      value: metrics?.totalShippers || 0,
      icon: ShoppingCart,
      trend: "+8%",
      trendUp: true,
      gradient: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50"
    },
    {
      label: "Tổng Đơn Hàng",
      value: metrics?.totalOrders || 0,
      icon: Package,
      trend: `${metrics?.totalViolations || 0} vi phạm`,
      trendUp: false,
      gradient: "from-orange-500 to-red-500",
      bgLight: "bg-orange-50"
    }
  ];

  // Calculate role distribution percentages for chart
  const total = (metrics?.totalDrivers || 0) + (metrics?.totalShippers || 0);
  const driverPct = total > 0 ? Math.round(((metrics?.totalDrivers || 0) / total) * 100) : 50;
  const shipperPct = 100 - driverPct;

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4" /> Không thể kết nối Backend. Dữ liệu hiển thị là dữ liệu mẫu.
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[60px] group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 ${card.bgLight} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 bg-gradient-to-br ${card.gradient} bg-clip-text`} style={{ color: "transparent", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
                <card.icon className={`w-5 h-5 absolute`} style={{ opacity: 0 }} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${card.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts & Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Role Distribution Chart (CSS-only donut) */}
        <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-6">Phân Bổ Vai Trò</h3>
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-36 h-36 rounded-full relative"
              style={{
                background: `conic-gradient(#10b981 0% ${driverPct}%, #8b5cf6 ${driverPct}% 100%)`
              }}
            >
              <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{total}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Thành viên</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-600">Tài Xế</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{metrics?.totalDrivers || 0} ({driverPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                <span className="text-xs font-semibold text-slate-600">Chủ Hàng</span>
              </div>
              <span className="text-xs font-bold text-slate-800">{metrics?.totalShippers || 0} ({shipperPct}%)</span>
            </div>
            {metrics?.pendingKyc ? (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">{metrics.pendingKyc} hồ sơ KYC đang chờ duyệt</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800">Đơn Hàng Gần Đây</h3>
            <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-xs font-bold transition-colors flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-6">Mã Đơn</th>
                  <th className="py-3 px-6">Tiêu Đề</th>
                  <th className="py-3 px-6">Trạng Thái</th>
                  <th className="py-3 px-6 text-right">Giá Trị</th>
                  <th className="py-3 px-6">Ngày Tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentOrders.length > 0 ? recentOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline">
                          {order.orderCode}
                        </Link>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-700 text-xs">{order.title || "---"}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-800 text-xs">
                        {((order.offerPrice || order.budget || 0) / 1000).toFixed(0)}K ₫
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-semibold">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-xs">Chưa có đơn hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tài Xế Đang Hoạt Động</p>
            <p className="text-xl font-bold text-slate-900">{metrics?.activeDrivers || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">KYC Chờ Duyệt</p>
            <p className="text-xl font-bold text-slate-900">{metrics?.pendingKyc || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Vi Phạm Hệ Thống</p>
            <p className="text-xl font-bold text-slate-900">{metrics?.totalViolations || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
