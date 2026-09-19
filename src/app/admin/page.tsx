"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import {
  Users, Truck, Package, ShoppingCart, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Loader,
  Bell, ShieldAlert, AlertTriangle, Headset, UserPlus, CheckCheck,
  BarChart3, Activity, Route, Compass, Calendar, Layers
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

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, any>;
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

const formatTimeAgo = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
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

const MOCK_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: "notif-1",
    type: "kyc_pending",
    title: "Hồ sơ eKYC mới cần duyệt",
    message: "Tài xế Nguyễn Văn A vừa gửi hồ sơ xác minh CCCD & GPLX",
    link: "/admin/users?kycStatus=pending",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-2",
    type: "chat",
    title: "Tin nhắn hỗ trợ trực tuyến",
    message: "Chủ hàng Trần Thị B gửi tin nhắn yêu cầu hỗ trợ đơn hàng",
    link: "/admin/support",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "notif-3",
    type: "order_cancelled",
    title: "Đơn hàng bị hủy",
    message: "Đơn ORD-20260707-010 đã bị hủy bởi chủ hàng",
    link: "/admin/orders",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "notif-4",
    type: "user_registered",
    title: "Tài xế mới đăng ký",
    message: "Tài xế Hoàng Văn C vừa tạo tài khoản và hoàn tất thông tin cơ bản",
    link: "/admin/users",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  }
];

interface TrendDataPoint {
  label: string;
  fullDate: string;
  orders: number;
  revenue: number;
  completed: number;
}

const TREND_DATA_7DAYS: TrendDataPoint[] = [
  { label: "13/09", fullDate: "Thứ Bảy, 13/09", orders: 124, revenue: 385000000, completed: 118 },
  { label: "14/09", fullDate: "Chủ Nhật, 14/09", orders: 98, revenue: 295000000, completed: 94 },
  { label: "15/09", fullDate: "Thứ Hai, 15/09", orders: 165, revenue: 520000000, completed: 156 },
  { label: "16/09", fullDate: "Thứ Ba, 16/09", orders: 182, revenue: 580000000, completed: 174 },
  { label: "17/09", fullDate: "Thứ Tư, 17/09", orders: 210, revenue: 670000000, completed: 198 },
  { label: "18/09", fullDate: "Thứ Năm, 18/09", orders: 245, revenue: 780000000, completed: 232 },
  { label: "19/09", fullDate: "Hôm nay, 19/09", orders: 268, revenue: 845000000, completed: 254 },
];

const TREND_DATA_30DAYS: TrendDataPoint[] = [
  { label: "Tuần 1", fullDate: "21/08 - 27/08", orders: 820, revenue: 2450000000, completed: 780 },
  { label: "Tuần 2", fullDate: "28/08 - 03/09", orders: 960, revenue: 2980000000, completed: 915 },
  { label: "Tuần 3", fullDate: "04/09 - 10/09", orders: 1140, revenue: 3560000000, completed: 1085 },
  { label: "Tuần 4", fullDate: "11/09 - 19/09", orders: 1420, revenue: 4420000000, completed: 1350 },
];

const TREND_DATA_MONTHS: TrendDataPoint[] = [
  { label: "Tháng 4", fullDate: "Tháng 04/2026", orders: 2400, revenue: 7200000000, completed: 2280 },
  { label: "Tháng 5", fullDate: "Tháng 05/2026", orders: 3100, revenue: 9450000000, completed: 2950 },
  { label: "Tháng 6", fullDate: "Tháng 06/2026", orders: 3850, revenue: 11800000000, completed: 3680 },
  { label: "Tháng 7", fullDate: "Tháng 07/2026", orders: 4600, revenue: 14200000000, completed: 4390 },
  { label: "Tháng 8", fullDate: "Tháng 08/2026", orders: 5350, revenue: 16800000000, completed: 5120 },
  { label: "Tháng 9", fullDate: "Tháng 09/2026", orders: 6200, revenue: 19500000000, completed: 5920 },
];

const TOP_CORRIDORS = [
  { route: "Hà Nội ⇄ Hải Phòng", percent: 35, count: 540, color: "bg-blue-500", text: "text-blue-700 bg-blue-50" },
  { route: "TP.HCM ⇄ Bình Dương / Đồng Nai", percent: 28, count: 432, color: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  { route: "Đà Lạt ⇄ TP.HCM (Hàng lạnh)", percent: 18, count: 278, color: "bg-purple-500", text: "text-purple-700 bg-purple-50" },
  { route: "Cần Thơ ⇄ TP.HCM (Nông sản)", percent: 12, count: 185, color: "bg-amber-500", text: "text-amber-700 bg-amber-50" },
  { route: "Tuyến Bắc ⇄ Nam xuyên Việt", percent: 7, count: 108, color: "bg-indigo-500", text: "text-indigo-700 bg-indigo-50" },
];

const formatVND = (val: number) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ ₫`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(0)} tr ₫`;
  return `${val.toLocaleString("vi-VN")} ₫`;
};

function AdminDashboardContent() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Interactive Visual Charts State
  const [trendTimeframe, setTrendTimeframe] = useState<"7days" | "30days" | "months">("7days");
  const [trendMetric, setTrendMetric] = useState<"orders" | "revenue">("orders");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<"status" | "roles">("status");

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);

      try {
        const [overviewRes, notifRes] = await Promise.allSettled([
          fetchWithAuth(`${API_BASE}/admin/users/overview`),
          fetchWithAuth(`${API_BASE}/admin/users/notifications/feed`)
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
          const data = await overviewRes.value.json();
          setMetrics(data.data.metrics);
          setRecentOrders(data.data.recentOrders || []);
          setIsOffline(false);
        } else {
          setIsOffline(true);
          setMetrics(MOCK_METRICS);
          setRecentOrders(MOCK_ORDERS);
        }

        if (notifRes.status === "fulfilled" && notifRes.value.ok) {
          const nData = await notifRes.value.json();
          const list: AdminNotificationItem[] = nData.data?.notifications || [];
          setNotifications(list);
          setUnreadCount(nData.data?.unreadCount ?? list.filter(n => !n.read).length);
        } else {
          setNotifications(MOCK_NOTIFICATIONS);
          setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.read).length);
        }
      } catch (err) {
        console.warn("Backend connection failed, using local mock fallback", err);
        setIsOffline(true);
        setMetrics(MOCK_METRICS);
        setRecentOrders(MOCK_ORDERS);
        setNotifications(MOCK_NOTIFICATIONS);
        setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.read).length);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/users/notifications/read-all`, { method: "PATCH" });
    } catch (e) {
      // Best-effort
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc", {
      title: "Thông báo hệ thống",
    });
  };

  const getNotificationLink = (notif: AdminNotificationItem) => {
    let link = notif.link;
    if (!link || link === "/admin/support") {
      if (notif.type === "chat" || notif.meta?.chatId) {
        const chatId = notif.meta?.chatId || (notif as any).chatId;
        const senderId = notif.meta?.senderId || (notif as any).senderId;
        link = chatId
          ? `/admin/support?tab=chats&chatId=${chatId}${senderId ? `&userId=${senderId}` : ""}`
          : (senderId ? `/admin/support?tab=chats&userId=${senderId}` : `/admin/support?tab=chats`);
      } else if (notif.type === "support_ticket" && notif.meta?.ticketId) {
        link = `/admin/support?tab=tickets&ticketId=${notif.meta.ticketId}`;
      }
    }
    return link || "/admin/notifications";
  };

  const handleNotificationClick = async (notif: AdminNotificationItem) => {
    if (!notif.read && notif.id) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${notif.id}/read`, { method: "PATCH" }).catch(() => null);
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

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
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      label: "Tổng Tài Xế",
      value: metrics?.totalDrivers || 0,
      icon: Truck,
      trend: `${metrics?.activeDrivers || 0} hoạt động`,
      trendUp: true,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      label: "Tổng Chủ Hàng",
      value: metrics?.totalShippers || 0,
      icon: ShoppingCart,
      trend: "+8%",
      trendUp: true,
      gradient: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50",
      iconColor: "text-violet-600"
    },
    {
      label: "Tổng Đơn Hàng",
      value: metrics?.totalOrders || 0,
      icon: Package,
      trend: `${metrics?.totalViolations || 0} vi phạm`,
      trendUp: false,
      gradient: "from-orange-500 to-red-500",
      bgLight: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  // Calculate role distribution percentages for chart
  const total = (metrics?.totalDrivers || 0) + (metrics?.totalShippers || 0);
  const driverPct = total > 0 ? Math.round(((metrics?.totalDrivers || 0) / total) * 100) : 50;
  const shipperPct = 100 - driverPct;

  // Visual Charts Trend Calculations
  const currentTrendData =
    trendTimeframe === "7days"
      ? TREND_DATA_7DAYS
      : trendTimeframe === "30days"
      ? TREND_DATA_30DAYS
      : TREND_DATA_MONTHS;

  const totalPeriodOrders = currentTrendData.reduce((acc, cur) => acc + cur.orders, 0);
  const totalPeriodRevenue = currentTrendData.reduce((acc, cur) => acc + cur.revenue, 0);
  const avgPeriodOrders = Math.round(totalPeriodOrders / Math.max(1, currentTrendData.length));
  const totalCompleted = currentTrendData.reduce((acc, cur) => acc + cur.completed, 0);
  const completionRate = totalPeriodOrders > 0 ? ((totalCompleted / totalPeriodOrders) * 100).toFixed(1) : "95.0";

  const maxVal = Math.max(
    ...currentTrendData.map((d) => (trendMetric === "orders" ? d.orders : d.revenue))
  );

  const svgWidth = 640;
  const svgHeight = 210;
  const padL = 45;
  const padR = 25;
  const padT = 25;
  const padB = 35;
  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const points = currentTrendData.map((d, i) => {
    const val = trendMetric === "orders" ? d.orders : d.revenue;
    const x = padL + (i / Math.max(1, currentTrendData.length - 1)) * chartW;
    const y = padT + chartH - (maxVal > 0 ? (val / maxVal) * chartH : 0);
    return { ...d, val, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4" /> Không thể kết nối Backend. Dữ liệu hiển thị là dữ liệu mẫu.
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group min-w-0"
          >
            <div className={`absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[60px] group-hover:opacity-10 transition-opacity pointer-events-none`} />
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 ${card.bgLight} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${card.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3 flex-shrink-0" /> : <ArrowDownRight className="w-3 h-3 flex-shrink-0" />}
                <span>{card.trend}</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">{card.value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1 truncate">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts & Tables & Activity Feed Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main Column (2 cols on xl): Recent Orders & Quick Stats */}
        <div className="xl:col-span-2 space-y-6 min-w-0 max-w-full">
          {/* Visual Interactive Trend Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-5 sm:p-6 space-y-5">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Xu Hướng Vận Đơn & Cước Phí
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Biến động lưu lượng đơn hàng và giá trị vận chuyển toàn sàn
                  </p>
                </div>
              </div>

              {/* Controls: Metric Switcher & Timeframe */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Metric Selector (Orders / Revenue) */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTrendMetric("orders")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      trendMetric === "orders"
                        ? "bg-white text-primary-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Số đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric("revenue")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      trendMetric === "revenue"
                        ? "bg-white text-emerald-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Doanh số (GMV)
                  </button>
                </div>

                {/* Timeframe Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {[
                    { key: "7days", label: "7 ngày" },
                    { key: "30days", label: "30 ngày" },
                    { key: "months", label: "6 tháng" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTrendTimeframe(t.key as any);
                        setHoveredTrendIdx(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTimeframe === t.key
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tổng kỳ này</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {trendMetric === "orders"
                    ? `${totalPeriodOrders.toLocaleString()} đơn`
                    : formatVND(totalPeriodRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Trung bình</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {trendMetric === "orders"
                    ? `${avgPeriodOrders} đơn/ngày`
                    : formatVND(Math.round(totalPeriodRevenue / currentTrendData.length))}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tỷ lệ hoàn thành</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {completionRate}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tăng trưởng</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" /> +14.8%
                </p>
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="relative pt-2">
              {/* Tooltip Card (when hovered) */}
              {hoveredTrendIdx !== null && points[hoveredTrendIdx] && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[140px]"
                  style={{
                    left: `${(points[hoveredTrendIdx].x / svgWidth) * 100}%`,
                    top: `${(points[hoveredTrendIdx].y / svgHeight) * 100}%`,
                  }}
                >
                  <p className="font-bold text-slate-200 text-[11px]">
                    {points[hoveredTrendIdx].fullDate}
                  </p>
                  <p className="text-sm font-bold text-white mt-1">
                    {trendMetric === "orders"
                      ? `${points[hoveredTrendIdx].orders} đơn đặt xe`
                      : formatVND(points[hoveredTrendIdx].revenue)}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                    Đã hoàn tất: {points[hoveredTrendIdx].completed} đơn
                  </p>
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-48 sm:h-56 overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padT + chartH * (1 - ratio);
                  const labelVal = maxVal * ratio;
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={padL + chartW}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padL - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-semibold"
                      >
                        {trendMetric === "orders"
                          ? Math.round(labelVal)
                          : formatVND(labelVal).replace(" ₫", "")}
                      </text>
                    </g>
                  );
                })}

                {/* Area Polygon */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={trendMetric === "orders" ? "url(#orderGrad)" : "url(#revenueGrad)"}
                  />
                )}

                {/* Bars beneath for subtle texture */}
                {points.map((p, i) => {
                  const barWidth = Math.min(28, (chartW / points.length) * 0.45);
                  const isHovered = hoveredTrendIdx === i;
                  return (
                    <rect
                      key={i}
                      x={p.x - barWidth / 2}
                      y={p.y}
                      width={barWidth}
                      height={padT + chartH - p.y}
                      rx={4}
                      className={`transition-colors cursor-pointer ${
                        isHovered
                          ? trendMetric === "orders" ? "fill-primary-200" : "fill-emerald-200"
                          : "fill-slate-100/70 hover:fill-slate-200"
                      }`}
                      onMouseEnter={() => setHoveredTrendIdx(i)}
                      onMouseLeave={() => setHoveredTrendIdx(null)}
                    />
                  );
                })}

                {/* Main Trend Stroke Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={trendMetric === "orders" ? "#2563eb" : "#10b981"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, i) => {
                  const isHovered = hoveredTrendIdx === i;
                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTrendIdx(i)}
                      onMouseLeave={() => setHoveredTrendIdx(null)}
                    >
                      {/* Interactive Touch Target */}
                      <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                      {/* Visual Dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 4}
                        fill="#ffffff"
                        stroke={trendMetric === "orders" ? "#2563eb" : "#10b981"}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {points.map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={`text-[10px] transition-colors ${
                      hoveredTrendIdx === i
                        ? "fill-primary-600 font-bold"
                        : "fill-slate-400 font-semibold"
                    }`}
                  >
                    {p.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">Đơn Hàng Gần Đây</h3>
              <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0">
                Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Đơn hàng gần đây</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[620px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">
                    <th className="py-3 px-4 sm:px-6">Mã Đơn</th>
                    <th className="py-3 px-4 sm:px-6">Tiêu Đề</th>
                    <th className="py-3 px-4 sm:px-6">Trạng Thái</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Giá Trị</th>
                    <th className="py-3 px-4 sm:px-6">Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentOrders.length > 0 ? recentOrders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline">
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-700 text-xs max-w-[200px] truncate">{order.title || "---"}</td>
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 flex-shrink-0" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                          {((order.offerPrice || order.budget || 0) / 1000).toFixed(0)}K ₫
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-400 font-semibold whitespace-nowrap">
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

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">Tài Xế Đang Hoạt Động</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.activeDrivers || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">KYC Chờ Duyệt</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.pendingKyc || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">Vi Phạm Hệ Thống</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.totalViolations || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column (1 col on xl): Role Distribution & Notifications */}
        <div className="space-y-6 min-w-0 max-w-full">
          {/* Interactive Donut & Status Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 p-5 sm:p-6 shadow-sm space-y-5">
            {/* Card Header & Tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {breakdownTab === "status" ? "Trạng Thái Vận Đơn" : "Cơ Cấu Thành Viên"}
                </h3>
              </div>

              {/* Tab Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBreakdownTab("status")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownTab === "status"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Đơn hàng
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("roles")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownTab === "roles"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Vai trò
                </button>
              </div>
            </div>

            {/* Donut Visualization */}
            <div className="flex items-center justify-center my-3">
              <div
                className="w-36 h-36 rounded-full relative shadow-xs transition-all duration-300"
                style={{
                  background:
                    breakdownTab === "status"
                      ? "conic-gradient(#10b981 0% 62%, #3b82f6 62% 84%, #f59e0b 84% 95%, #ef4444 95% 100%)"
                      : `conic-gradient(#10b981 0% ${driverPct}%, #8b5cf6 ${driverPct}% 100%)`,
                }}
              >
                <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {breakdownTab === "status"
                        ? (metrics?.totalOrders || 1543).toLocaleString()
                        : total.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {breakdownTab === "status" ? "Tổng đơn" : "Thành viên"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend & Details */}
            {breakdownTab === "status" ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đã hoàn thành</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">62%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({Math.round((metrics?.totalOrders || 1543) * 0.62).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đang vận chuyển</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">22%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({Math.round((metrics?.totalOrders || 1543) * 0.22).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đang tìm tài xế</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">11%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({Math.round((metrics?.totalOrders || 1543) * 0.11).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đã hủy đơn</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">5%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({Math.round((metrics?.totalOrders || 1543) * 0.05).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span className="font-semibold text-slate-600">Tài Xế</span>
                  </div>
                  <span className="font-bold text-slate-800">{metrics?.totalDrivers || 0} ({driverPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full flex-shrink-0"></div>
                    <span className="font-semibold text-slate-600">Chủ Hàng</span>
                  </div>
                  <span className="font-bold text-slate-800">{metrics?.totalShippers || 0} ({shipperPct}%)</span>
                </div>
                {metrics?.pendingKyc ? (
                  <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-amber-700">{metrics.pendingKyc} hồ sơ KYC đang chờ duyệt</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Top Corridors / Logistics Routes Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tuyến Vận Tải Nhộn Nhịp</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Top hành lang vận chuyển có lưu lượng cao nhất</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {TOP_CORRIDORS.map((corridor, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {corridor.route}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{corridor.count} chuyến</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${corridor.text}`}>
                        {corridor.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${corridor.color}`}
                      style={{ width: `${corridor.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 truncate">Hoạt Động Mới Nhất</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Cập nhật tức thì sự kiện hệ thống
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotifsRead}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[10px] hidden xs:inline">Đã đọc</span>
                  </button>
                )}
                <Link
                  href="/admin/notifications"
                  className="text-primary-600 hover:text-primary-700 text-[11px] font-bold transition-colors flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary-50"
                  title="Xem tất cả thông báo"
                >
                  <span>Xem</span> <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600">Không có thông báo mới</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống đang hoạt động ổn định.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {notifications.slice(0, 5).map((notif) => {
                  const isOrder = notif.type === "order_cancelled";
                  const isKyc = notif.type === "kyc_pending";
                  const isSupport = notif.type === "support_ticket" || notif.type === "chat";

                  return (
                    <Link
                      key={notif.id}
                      href={getNotificationLink(notif)}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50/80 group ${
                        !notif.read ? "bg-primary-50/25" : ""
                      }`}
                    >
                      {/* Category Icon */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 ${
                          isOrder
                            ? "bg-red-50 text-red-500 border border-red-100"
                            : isKyc
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : isSupport
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {isOrder ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : isKyc ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : isSupport ? (
                          <Headset className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span
                            className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isOrder
                                ? "bg-red-100/70 text-red-700"
                                : isKyc
                                ? "bg-amber-100/70 text-amber-700"
                                : isSupport
                                ? "bg-emerald-100/70 text-emerald-700"
                                : "bg-blue-100/70 text-blue-700"
                            }`}
                          >
                            {isOrder
                              ? "Đơn Hàng"
                              : isKyc
                              ? "eKYC"
                              : isSupport
                              ? "Hỗ Trợ"
                              : "Người Dùng"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          )}
                        </div>

                        <h4
                          className={`text-xs leading-snug group-hover:text-primary-600 transition-colors line-clamp-1 ${
                            !notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action Link Arrow */}
                      <div className="flex items-center text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 self-center">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
