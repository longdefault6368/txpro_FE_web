"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Eye, Filter, Loader, PackageOpen, RotateCcw, Search, SlidersHorizontal, Truck, XCircle } from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

interface UserInfo {
  name?: string;
  phone?: string;
  email?: string;
}

interface MoneyRange {
  min?: number | null;
  max?: number | null;
}

interface Order {
  _id: string;
  orderCode: string;
  title?: string | null;
  cargoType?: string | null;
  vehicleType?: string | null;
  weight?: number | null;
  volume?: number | null;
  status: string;
  offerPrice?: number | null;
  budget?: number | MoneyRange | null;
  pickup?: { address?: string | null };
  dropoff?: { address?: string | null };
  shipperId?: UserInfo;
  driverId?: UserInfo | null;
  paymentMethod?: string | null;
  pickupTimeType?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
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

const MOCK_SHIPPER_ORDERS: Order[] = [
  {
    _id: "so-mock-1",
    orderCode: "ORD-20260709-001",
    title: "Vận chuyển 20 tấn hạt nhựa PP",
    cargoType: "Hạt nhựa",
    vehicleType: "Xe tải 20 tấn",
    weight: 20000,
    status: "in_progress",
    offerPrice: 4500000,
    pickup: { address: "KCN Cát Lái, TP.HCM" },
    dropoff: { address: "KCN Sóng Thần, Bình Dương" },
    shipperId: { name: "Trần Thị Hằng", phone: "0912345678", email: "hang@gmail.com" },
    driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
    paymentMethod: "cash",
    pickupTimeType: "scheduled",
    pickupTime: "2026-07-10T02:00:00Z",
    notes: "Bốc hàng bằng xe nâng.",
    createdAt: "2026-07-09T08:30:00Z",
  },
  {
    _id: "so-mock-2",
    orderCode: "ORD-20260708-005",
    title: "Giao 50 thùng hoa quả tươi",
    cargoType: "Thực phẩm",
    vehicleType: "Xe lạnh",
    weight: 900,
    status: "searching_driver",
    budget: { min: 800000, max: 1200000 },
    pickup: { address: "Chợ đầu mối Thủ Đức, TP.HCM" },
    dropoff: { address: "Quận 1, TP.HCM" },
    shipperId: { name: "Nguyễn Minh Thu", phone: "0933444555", email: "thu.nguyen@gmail.com" },
    paymentMethod: "wallet",
    pickupTimeType: "now",
    createdAt: "2026-07-08T14:00:00Z",
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  searching_driver: { label: "Tìm tài xế", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Loader },
  waiting_driver: { label: "Đang chờ tài xế", color: "text-amber-600 bg-amber-50 border-amber-100", icon: Clock },
  waiting_driver_acceptance: { label: "Chờ tài xế nhận", color: "text-purple-600 bg-purple-50 border-purple-100", icon: Clock },
  accepted: { label: "Đã nhận đơn", color: "text-indigo-600 bg-indigo-50 border-indigo-100", icon: CheckCircle },
  rejected: { label: "Đã từ chối", color: "text-rose-600 bg-rose-50 border-rose-100", icon: XCircle },
  in_progress: { label: "Đang vận chuyển", color: "text-primary-600 bg-primary-50 border-primary-100", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700 bg-emerald-100 border-emerald-200", icon: CheckCircle },
  cancelled: { label: "Đã hủy đơn", color: "text-red-600 bg-red-50 border-red-100", icon: XCircle },
};

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");

const formatBudget = (order: Order) => {
  if (order.offerPrice) return formatMoney(order.offerPrice);
  if (typeof order.budget === "number") return formatMoney(order.budget);
  if (order.budget && typeof order.budget === "object") {
    return `${formatMoney(order.budget.min)} - ${formatMoney(order.budget.max)}`;
  }
  return "---";
};

export default function AdminShipperOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    setCurrentPage(1);

    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      const formatted = formatDate(today);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "yesterday") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const formatted = formatDate(yest);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      return;
    }
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch shipper orders");
      const data = await res.json();
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
      setIsOffline(false);
    } catch (err) {
      console.warn("Orders API offline, using mock data", err);
      setIsOffline(true);
      const query = search.toLowerCase();
      let filtered = [...MOCK_SHIPPER_ORDERS];
      if (query) {
        filtered = filtered.filter((order) =>
          order.orderCode.toLowerCase().includes(query) ||
          order.title?.toLowerCase().includes(query) ||
          order.shipperId?.name?.toLowerCase().includes(query) ||
          order.pickup?.address?.toLowerCase().includes(query) ||
          order.dropoff?.address?.toLowerCase().includes(query)
        );
      }
      if (statusFilter) filtered = filtered.filter((order) => order.status === statusFilter);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter((order) => new Date(order.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((order) => new Date(order.createdAt) <= end);
      }
      const total = filtered.length;
      const pages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
      setOrders(paginated);
      setPagination({ page: currentPage, limit, total, pages });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, statusFilter, startDate, endDate, limit]);

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Backend đang offline, dữ liệu bên dưới là dữ liệu mẫu.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Chủ Hàng Đăng</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi đầy đủ vận đơn do chủ hàng tạo, thông tin hàng hóa, tuyến, chi phí và tài xế nhận đơn.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã đơn, chủ hàng, tên hàng, điểm đi, điểm đến..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <div className="relative w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([value, item]) => (
                <option key={value} value={value}>{item.label}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative w-full md:w-44">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <span className="text-slate-500 font-bold flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>Khoảng ngày:</span>
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay" },
              { id: "yesterday", label: "Hôm qua" },
              { id: "7days", label: "7 ngày qua" },
              { id: "30days", label: "30 ngày qua" },
              { id: "this_month", label: "Tháng này" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  datePreset === p.id && (p.id === "all" || (startDate && endDate))
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>
            <span className="text-slate-400 font-bold hidden sm:inline">-</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors font-bold text-xs cursor-pointer ml-auto sm:ml-0"
                title="Xóa bộ lọc ngày"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách chủ hàng đăng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <PackageOpen className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy vận đơn chủ hàng</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách vận đơn chủ hàng</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1150px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-56">Mã / Hàng hóa</th>
                    <th className="py-4 px-6 min-w-52">Chủ hàng</th>
                    <th className="py-4 px-6 min-w-52">Tài xế nhận</th>
                    <th className="py-4 px-6 min-w-72">Lộ trình</th>
                    <th className="py-4 px-6 min-w-44">Thông tin hàng</th>
                    <th className="py-4 px-6 min-w-44">Chi phí</th>
                    <th className="py-4 px-6 min-w-44">Lịch / thanh toán</th>
                    <th className="py-4 px-6 min-w-32">Trạng thái</th>
                    <th className="py-4 px-6 text-right w-[80px]">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {orders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="py-4.5 px-6 min-w-56">
                          <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline whitespace-nowrap">{order.orderCode}</Link>
                          <p className="font-bold text-slate-800 mt-1">{order.title || "---"}</p>
                          {order.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{order.notes}</p>}
                        </td>
                        <td className="py-4.5 px-6 min-w-52">
                          <p className="font-bold text-slate-800">{order.shipperId?.name || "---"}</p>
                          <p className="text-xs font-semibold text-slate-500">{order.shipperId?.phone || "---"}</p>
                          <p className="text-xs text-slate-400">{order.shipperId?.email || "---"}</p>
                        </td>
                        <td className="py-4.5 px-6 min-w-52">
                          <p className="font-bold text-slate-800">{order.driverId?.name || "Chưa có tài xế"}</p>
                          <p className="text-xs font-semibold text-slate-500">{order.driverId?.phone || "---"}</p>
                          <p className="text-xs text-slate-400">{order.driverId?.email || "---"}</p>
                        </td>
                        <td className="py-4.5 px-6 min-w-72">
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold text-slate-700"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Từ:</span>{order.pickup?.address || "---"}</p>
                            <p className="font-semibold text-slate-700"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Đến:</span>{order.dropoff?.address || "---"}</p>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-xs min-w-44">
                          <p>Loại: <span className="font-bold text-slate-800">{order.cargoType || "---"}</span></p>
                          <p>Xe: <span className="font-bold text-slate-800">{order.vehicleType || "---"}</span></p>
                          <p>Nặng: <span className="font-bold text-slate-800">{order.weight ? `${order.weight.toLocaleString("vi-VN")} kg` : "---"}</span></p>
                          <p>Khối: <span className="font-bold text-slate-800">{order.volume ? `${order.volume} m³` : "---"}</span></p>
                        </td>
                        <td className="py-4.5 px-6 font-bold text-slate-800 text-xs min-w-44 whitespace-nowrap">{formatBudget(order)}</td>
                        <td className="py-4.5 px-6 text-xs min-w-44">
                          <p className="font-bold text-slate-700">{order.pickupTimeType === "scheduled" ? "Đặt lịch" : "Lấy ngay"}</p>
                          <p className="text-slate-500">{order.pickupTime ? new Date(order.pickupTime).toLocaleString("vi-VN") : "---"}</p>
                          <p className="text-slate-400 mt-1">{order.paymentMethod === "wallet" ? "Ví TXEPRO" : "Tiền mặt"}</p>
                          <p className="text-slate-400">Tạo: {formatDateTime(order.createdAt)}</p>
                        </td>
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          <Link href={`/admin/orders/${order._id}`} className="p-2 inline-block text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer" title="Xem chi tiết vận đơn">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} vận đơn)
            </span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={currentPage === pagination.pages} onClick={() => setCurrentPage((prev) => prev + 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
