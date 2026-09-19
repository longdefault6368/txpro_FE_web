"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import { 
  Search, Filter, Truck, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Eye, Loader, SlidersHorizontal,
  Calendar, RotateCcw, Package, ArrowUpRight, Banknote, Download
} from "lucide-react";

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

interface Order {
  _id: string;
  orderCode: string;
  title: string;
  status:
    | "pending"
    | "searching_driver"
    | "waiting_driver"
    | "waiting_driver_acceptance"
    | "matched"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "in_transit"
    | "delivered"
    | "completed"
    | "cancelled"
    | string;
  offerPrice?: number;
  budget?: number;
  pickup?: { address: string };
  dropoff?: { address: string };
  shipperId?: UserInfo;
  driverId?: UserInfo;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  cancelledByRole?: string | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  timeoutAt?: string | null;
  createdAt: string;
}

type SortKey = "orderCode" | "title" | "cost" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const STATUS_SORT_ORDER: Record<string, number> = {
  pending: 1,
  searching_driver: 2,
  waiting_driver: 3,
  waiting_driver_acceptance: 4,
  matched: 5,
  accepted: 6,
  in_progress: 7,
  in_transit: 8,
  delivered: 9,
  completed: 10,
  rejected: 11,
  cancelled: 12,
};

const getOrderCost = (order: Order) => order.offerPrice || order.budget || 0;

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

const CANCEL_REASON_LABELS: Record<string, string> = {
  accident: "Xe hư hỏng / tai nạn",
  dispute: "Tranh chấp cước",
  blocked: "Đoạn đường không đi được",
  no_need: "Không còn nhu cầu vận chuyển",
  change_driver: "Muốn chọn tài xế khác",
  edit_order: "Thông tin đơn hàng cần chỉnh sửa",
  wait_too_long: "Thời gian chờ tài xế quá lâu",
  driver_rejected: "Tài xế từ chối nhận đơn",
  driver_timeout: "Tài xế không phản hồi trong thời gian quy định",
  changed_mind: "Người gửi thay đổi nhu cầu vận chuyển",
  wrong_info: "Thông tin đơn hàng chưa chính xác",
  found_other_driver: "Chủ hàng đã tìm được phương án vận chuyển khác",
  driver_unavailable: "Tài xế không thể tiếp tục thực hiện chuyến",
  vehicle_issue: "Phương tiện gặp sự cố",
  price_not_agreed: "Hai bên chưa thống nhất được giá cước",
  no_contact: "Không liên hệ được với bên còn lại",
  cannot_contact: "Không liên hệ được với bên còn lại",
  no_show: "Không có mặt tại điểm hẹn",
  weather: "Thời tiết không đảm bảo an toàn",
  emergency: "Có việc khẩn cấp",
  other: "Lý do khác",
  timeout: "Quá thời gian xác nhận đơn",
};

function getCancelledByDisplay(order: Order) {
  const roleLabel =
    order.cancelledByRole === "driver" ? "Tài xế" :
    order.cancelledByRole === "shipper" ? "Chủ hàng" :
    order.cancelledByRole === "system" ? "Hệ thống" :
    "";

  if (roleLabel && order.cancelledByName) return `${roleLabel} - ${order.cancelledByName}`;
  return order.cancelledByName || roleLabel;
}

function getCancelReasonText(order: Order) {
  const reason = order.cancellationReason || order.rejectionReason;
  if (!reason && order.timeoutAt) return "Quá thời gian xác nhận đơn";
  if (!reason) return "";

  const normalizedReason = reason.trim().toLowerCase();
  const translatedReason = CANCEL_REASON_LABELS[normalizedReason] || reason;
  const note = order.cancellationReason && order.rejectionReason && order.rejectionReason !== order.cancellationReason
    ? order.rejectionReason.trim()
    : "";

  return note ? `${translatedReason}. Ghi chú: ${note}` : translatedReason;
}


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

function AdminOrdersContent() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [overviewTotalOrders, setOverviewTotalOrders] = useState<number | null>(null);
 
  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch overview metrics on mount if available
  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/users/overview`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.metrics?.totalOrders) {
          setOverviewTotalOrders(data.data.metrics.totalOrders);
        }
      })
      .catch(() => null);
  }, []);

  // Computed KPI Metrics
  const totalOrdersCount = overviewTotalOrders || pagination.total || orders.length;

  const inTransitOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "in_progress" ||
        o.status === "in_transit" ||
        (o.status as any) === "accepted" ||
        o.status === "matched"
    ).length;
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "searching_driver" ||
        (o.status as any) === "waiting_driver" ||
        (o.status as any) === "waiting_driver_acceptance" ||
        o.status === "pending"
    ).length;
  }, [orders]);

  const totalGmvAmount = useMemo(() => {
    return orders.reduce((sum, o) => sum + getOrderCost(o), 0);
  }, [orders]);

  const formatVND = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ ₫`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} tr ₫`;
    return `${val.toLocaleString("vi-VN")} ₫`;
  };

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
      ...(endDate ? { endDate } : {})
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
        setIsOffline(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("API error:", errData.message || "Failed to fetch orders");
        setOrders([]);
        setPagination({ page: 1, limit, total: 0, pages: 1 });
        setIsOffline(false);
      }
    } catch (err: unknown) {
      console.warn("Backend connection error:", err);
      setOrders([]);
      setPagination({ page: 1, limit, total: 0, pages: 1 });
      setIsOffline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, statusFilter, startDate, endDate, limit]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;

      if (sortConfig.key === "cost") {
        comparison = getOrderCost(a) - getOrderCost(b);
      } else if (sortConfig.key === "createdAt") {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortConfig.key === "status") {
        const aStatus = STATUS_SORT_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER;
        const bStatus = STATUS_SORT_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER;
        comparison = aStatus - bStatus || String(a.status).localeCompare(String(b.status), "vi");
      } else {
        comparison = String(a[sortConfig.key] || "").localeCompare(String(b[sortConfig.key] || ""), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [orders, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleExportCSV = () => {
    if (sortedOrders.length === 0) {
      toast.warning("Không có dữ liệu vận đơn nào phù hợp để xuất báo cáo!", {
        title: "Xuất dữ liệu Excel/CSV",
      });
      return;
    }

    // CSV Headers
    const headers = [
      "STT",
      "Mã Vận Đơn",
      "Tên Hàng Hóa",
      "Trạng Thái",
      "Chi Phí (VNĐ)",
      "Điểm Bốc Hàng",
      "Điểm Giao Hàng",
      "Chủ Hàng",
      "SĐT Chủ Hàng",
      "Email Chủ Hàng",
      "Tài Xế",
      "SĐT Tài Xế",
      "Email Tài Xế",
      "Ngày Tạo",
      "Lý Do Hủy",
      "Bên Hủy"
    ];

    // Helper to safely format CSV cells
    const formatCell = (val?: string | number | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedOrders.map((order, idx) => {
      const statusLabel = STATUS_MAP[order.status]?.label || order.status;
      const cost = getOrderCost(order);
      const cancelReason = order.status === "cancelled" ? getCancelReasonText(order) : "";
      const cancelledBy = order.status === "cancelled" ? getCancelledByDisplay(order) : "";

      return [
        idx + 1,
        formatCell(order.orderCode),
        formatCell(order.title),
        formatCell(statusLabel),
        cost,
        formatCell(order.pickup?.address),
        formatCell(order.dropoff?.address),
        formatCell(order.shipperId?.name),
        formatCell(order.shipperId?.phone),
        formatCell(order.shipperId?.email),
        formatCell(order.driverId?.name),
        formatCell(order.driverId?.phone),
        formatCell(order.driverId?.email),
        formatCell(formatDateTime(order.createdAt)),
        formatCell(cancelReason),
        formatCell(cancelledBy),
      ].join(",");
    });

    // Add UTF-8 BOM (\uFEFF) so Excel opens UTF-8 Vietnamese perfectly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_van_don_txepro_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất thành công ${sortedOrders.length} vận đơn sang tệp Excel/CSV!`, {
      title: "Xuất dữ liệu thành công",
    });
  };

  const renderSortableHeader = (sortKey: SortKey, label: string) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 -ml-1 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors cursor-pointer"
        title={`Sắp xếp ${label} ${direction === "asc" ? "giảm dần" : "tăng dần"}`}
      >
        <span>{label}</span>
        <span className="flex flex-col -space-y-1">
          <ChevronUp className={`h-3 w-3 ${isActive && direction === "asc" ? "text-primary-600" : "text-slate-300"}`} />
          <ChevronDown className={`h-3 w-3 ${isActive && direction === "desc" ? "text-primary-600" : "text-slate-300"}`} />
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Hệ thống đang ở chế độ Offline. Dữ liệu hiển thị bên dưới là dữ liệu giả lập.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Vận Đơn</h1>
          <p className="text-slate-400 text-xs mt-1">Giám sát trạng thái di chuyển, lộ trình vận tải và giá trị các đơn đặt xe.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex-shrink-0"
            title="Tải bảng kê vận đơn định dạng Excel / CSV (chuẩn UTF-8 tiếng Việt)"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV</span>
            <span className="bg-emerald-700/60 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
              {sortedOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Order KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {[
          {
            id: "all",
            label: "Tổng Vận Đơn",
            value: totalOrdersCount.toLocaleString(),
            subValue: "Toàn sàn hệ thống",
            badge: "Tất cả",
            trendUp: true,
            icon: Package,
            gradient: "from-blue-500 to-indigo-600",
            bgLight: "bg-blue-50",
            iconColor: "text-blue-600",
            isActive: statusFilter === "",
            hint: "Xem tất cả",
            onClick: () => {
              setStatusFilter("");
              setCurrentPage(1);
            },
          },
          {
            id: "in_progress",
            label: "Đang Vận Chuyển",
            value: inTransitOrdersCount.toLocaleString(),
            subValue: "Giám sát GPS trực tiếp",
            badge: "Đang lăn bánh",
            trendUp: true,
            icon: Truck,
            gradient: "from-emerald-500 to-teal-600",
            bgLight: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isActive: statusFilter === "in_progress" || statusFilter === "in_transit",
            hint: "Lọc xe đang chạy",
            onClick: () => {
              setStatusFilter(statusFilter === "in_progress" ? "" : "in_progress");
              setCurrentPage(1);
            },
          },
          {
            id: "searching_driver",
            label: "Đang Chờ Tài Xế",
            value: pendingOrdersCount.toLocaleString(),
            subValue: "Cần điều phối nhận chuyến",
            badge: "Chờ nhận chuyến",
            trendUp: false,
            icon: Clock,
            gradient: "from-amber-500 to-orange-600",
            bgLight: "bg-amber-50",
            iconColor: "text-amber-600",
            isActive: statusFilter === "searching_driver" || statusFilter === "waiting_driver",
            hint: "Lọc đơn chờ xe",
            onClick: () => {
              setStatusFilter(statusFilter === "searching_driver" ? "" : "searching_driver");
              setCurrentPage(1);
            },
          },
          {
            id: "gmv",
            label: "Tổng Cước Phí (GMV)",
            value: formatVND(totalGmvAmount),
            subValue: "Bảo chứng ký quỹ MB Bank",
            badge: "Doanh số",
            trendUp: true,
            icon: Banknote,
            gradient: "from-violet-500 to-purple-600",
            bgLight: "bg-violet-50",
            iconColor: "text-violet-600",
            isActive: sortConfig?.key === "cost",
            hint: "Xếp theo cước",
            onClick: () => {
              handleSort("cost");
            },
          },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className={`text-left bg-white rounded-2xl border p-4 sm:p-5 lg:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group min-w-0 cursor-pointer ${
              card.isActive
                ? "border-primary-500 ring-2 ring-primary-500/20 shadow-primary-500/5 bg-primary-50/10"
                : "border-slate-200/60 hover:border-slate-300"
            }`}
          >
            <div
              className={`absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[60px] group-hover:opacity-10 transition-opacity pointer-events-none`}
            />
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 ${card.bgLight} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}
              >
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                  card.isActive
                    ? "bg-primary-600 text-white"
                    : card.trendUp
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-amber-700 bg-amber-50"
                }`}
              >
                {card.isActive && <span>✓ Đang chọn</span>}
                {!card.isActive && card.trendUp && (
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                )}
                {!card.isActive && <span>{card.badge}</span>}
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
              {card.value}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-semibold text-slate-500 truncate">{card.label}</p>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary-600 transition-colors">
                {card.hint} →
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              {card.subValue}
            </p>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã vận đơn, tên hàng, địa điểm giao nhận..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filters */}
          <div className="relative w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="searching_driver">Tìm tài xế</option>
              <option value="waiting_driver">Đang chờ tài xế</option>
              <option value="waiting_driver_acceptance">Chờ tài xế nhận</option>
              <option value="accepted">Đã nhận đơn</option>
              <option value="rejected">Đã từ chối</option>
              <option value="in_progress">Đang vận chuyển</option>
              <option value="delivered">Đã giao hàng</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy đơn</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Page Size Select */}
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
              <option value={100}>100 dòng / trang</option>
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Xóa lọc theo ngày"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách đơn đặt xe...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Search className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs">Thử điều chỉnh lại từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách đơn hàng</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-[120px]">
                      {renderSortableHeader("orderCode", "Mã Đơn")}
                    </th>
                    <th className="py-4 px-6 min-w-[160px]">
                      {renderSortableHeader("title", "Tên Hàng Hóa")}
                    </th>
                    <th className="py-4 px-6 min-w-[220px]">Lộ Trình (Điểm Đi / Điểm Đến)</th>
                    <th className="py-4 px-6 min-w-[180px]">Chủ Hàng / Tài Xế</th>
                    <th className="py-4 px-6 min-w-[110px]">
                      {renderSortableHeader("cost", "Chi Phí")}
                    </th>
                    <th className="py-4 px-6 min-w-[140px]">
                      {renderSortableHeader("createdAt", "Ngày Tạo")}
                    </th>
                    <th className="py-4 px-6 min-w-[150px]">
                      {renderSortableHeader("status", "Trạng Thái")}
                    </th>
                    <th className="py-4 px-6 text-right w-[80px]">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {sortedOrders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    const cancelReason = order.status === "cancelled" ? getCancelReasonText(order) : "";
                    const cancelledBy = order.status === "cancelled" ? getCancelledByDisplay(order) : "";
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Code */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline cursor-pointer">
                            {order.orderCode}
                          </Link>
                        </td>

                        {/* Title */}
                        <td className="py-4.5 px-6 min-w-[160px] max-w-xs">
                          <span className="font-bold text-slate-800 line-clamp-2">{order.title}</span>
                        </td>

                        {/* Route */}
                        <td className="py-4.5 px-6 min-w-[220px] max-w-xs">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-semibold text-slate-700 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">TỪ:</span>{order.pickup?.address || "---"}</p>
                            <p className="font-semibold text-slate-600 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">ĐẾN:</span>{order.dropoff?.address || "---"}</p>
                          </div>
                        </td>

                        {/* Parties */}
                        <td className="py-4.5 px-6 min-w-[180px] text-xs font-semibold">
                          <div className="space-y-0.5">
                            <p className="text-slate-700 truncate"><span className="text-blue-500 font-bold text-[9px] uppercase mr-1">Shipper:</span>{order.shipperId?.name || "---"}</p>
                            <p className="text-slate-600 truncate"><span className="text-emerald-500 font-bold text-[9px] uppercase mr-1">Driver:</span>{order.driverId?.name || "---"}</p>
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="py-4.5 px-6 font-bold text-slate-800 text-xs whitespace-nowrap">
                          {(getOrderCost(order) / 1000).toLocaleString()}K ₫
                        </td>

                        {/* Created At */}
                        <td className="py-4.5 px-6 text-xs font-bold text-slate-600 whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                            </span>
                            {cancelReason && (
                              <p className="max-w-48 text-[11px] font-semibold leading-5 text-red-600 whitespace-normal">
                                Lý do: {cancelReason}
                              </p>
                            )}
                            {cancelledBy && (
                              <p className="max-w-48 text-[10px] font-bold uppercase tracking-wide text-slate-400 whitespace-normal">
                                Bên hủy: {cancelledBy}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="p-2 inline-block text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                            title="Xem chi tiết vận đơn"
                          >
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

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} vận đơn)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- ORDER DETAIL MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              Chi Tiết Vận Đơn: <span className="text-primary-600 font-bold">{selectedOrder.orderCode}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Route Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Mặt Hàng</h4>
                  <p className="text-slate-800 font-bold mt-1 text-sm">{selectedOrder.title}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Bốc Hàng</h4>
                  <p className="text-slate-700 font-semibold text-xs mt-1">{selectedOrder.pickup?.address || "---"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Hạ Hàng</h4>
                  <p className="text-slate-700 font-semibold text-xs mt-1">{selectedOrder.dropoff?.address || "---"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi phí vận chuyển</h4>
                  <p className="text-primary-600 font-bold mt-1 text-base">
                    {(selectedOrder.offerPrice || selectedOrder.budget || 0).toLocaleString()} ₫
                  </p>
                </div>
              </div>

              {/* Parties Details */}
              <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                {/* Shipper */}
                <div>
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Chủ Hàng (Shipper)</h4>
                  <div className="mt-1 text-xs space-y-0.5">
                    <p className="font-bold text-slate-800">{selectedOrder.shipperId?.name || "---"}</p>
                    <p className="font-semibold text-slate-500">SĐT: {selectedOrder.shipperId?.phone || "---"}</p>
                    <p className="text-slate-400">Email: {selectedOrder.shipperId?.email || "---"}</p>
                  </div>
                </div>

                {/* Driver */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tài Xế (Driver)</h4>
                  {selectedOrder.driverId ? (
                    <div className="mt-1 text-xs space-y-0.5">
                      <p className="font-bold text-slate-800">{selectedOrder.driverId.name}</p>
                      <p className="font-semibold text-slate-500">SĐT: {selectedOrder.driverId.phone}</p>
                      <p className="text-slate-400">Email: {selectedOrder.driverId.email}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-semibold text-xs mt-1">Đơn đặt xe chưa có tài xế nhận chuyến.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary py-3 px-6 text-xs font-bold rounded-xl"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
