"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Headset,
  MessageSquare,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";

type NotificationCategory = "all" | "users" | "kyc" | "orders" | "support" | "system";

type SortField = "createdAt" | "title" | "read" | "type";
type SortOrder = "asc" | "desc";

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

const INITIAL_MOCK_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: "notif-mock-1",
    type: "kyc_pending",
    title: "Hồ sơ eKYC chờ duyệt: Lê Hoàng Nam",
    message: "Tài xế Lê Hoàng Nam (0912345678) vừa nộp hồ sơ eKYC căn cước công dân và bằng lái hạng FC cần kiểm tra đối soát.",
    link: "/admin/users",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    meta: { role: "tai-xe", phone: "0912345678" },
  },
  {
    id: "notif-mock-2",
    type: "chat",
    title: "Tin nhắn hỗ trợ từ Chủ hàng: Trần Mai Anh",
    message: "Cho mình hỏi đơn hàng ORD-20260709-001 tài xế đã nhận hàng chưa và định vị xe đang ở đâu vậy hệ thống?",
    link: "/admin/support?tab=chats",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    meta: { senderRole: "chu-hang", phone: "0988776655" },
  },
  {
    id: "notif-mock-3",
    type: "order_cancelled",
    title: "Đơn hàng đã bị hủy: ORD-20260708-004",
    message: "Vận chuyển sắt thép công trình xây dựng bị hủy do tài xế gặp sự cố kỹ thuật dọc đường.",
    link: "/admin/orders",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    meta: { orderCode: "ORD-20260708-004" },
  },
  {
    id: "notif-mock-4",
    type: "user_registered",
    title: "Thành viên mới: Đỗ Tuấn Kiệt",
    message: "Tài xế xe tải trọng tải 15 tấn Đỗ Tuấn Kiệt (0971234888) vừa hoàn tất đăng ký tài khoản.",
    link: "/admin/users",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    meta: { role: "tai-xe", phone: "0971234888" },
  },
  {
    id: "notif-mock-5",
    type: "support_ticket",
    title: "Yêu cầu hỗ trợ #TK-9821: Đối soát tiền cước",
    message: "Từ Công ty TNHH Vận Tải An Phát: Cần đối soát khoản tiền cước vận chuyển hạt nhựa chuyến Sài Gòn - Đà Nẵng.",
    link: "/admin/support?tab=tickets",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    meta: { ticketId: "TK-9821" },
  },
  {
    id: "notif-mock-6",
    type: "kyc_pending",
    title: "Hồ sơ eKYC chờ duyệt: Vũ Đình Trọng",
    message: "Chủ hàng Vũ Đình Trọng vừa nộp giấy phép đăng ký kinh doanh công ty để nâng hạn mức giao dịch.",
    link: "/admin/users",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    meta: { role: "chu-hang", phone: "0909112233" },
  },
  {
    id: "notif-mock-7",
    type: "user_registered",
    title: "Thành viên mới: Nguyễn Phương Thảo",
    message: "Chủ hàng doanh nghiệp nông sản sạch (0933221100) vừa tham gia hệ thống sàn vận tải.",
    link: "/admin/users",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    meta: { role: "chu-hang", phone: "0933221100" },
  },
  {
    id: "notif-mock-8",
    type: "chat",
    title: "Tin nhắn từ Tài xế: Phạm Văn Bách",
    message: "Tôi đã gửi hồ sơ xe container bổ sung, nhờ admin phê duyệt giúp để tôi nhận chuyến sớm.",
    link: "/admin/support?tab=chats",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    meta: { senderRole: "tai-xe", phone: "0945678901" },
  },
  {
    id: "notif-mock-9",
    type: "order_cancelled",
    title: "Đơn hàng đã bị hủy: ORD-20260707-009",
    message: "Lý do: Chủ hàng thay đổi kế hoạch xuất kho và không kịp đóng kiện hàng đúng hẹn.",
    link: "/admin/orders",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    meta: { orderCode: "ORD-20260707-009" },
  },
  {
    id: "notif-mock-10",
    type: "support_ticket",
    title: "Yêu cầu hỗ trợ #TK-9819: Hướng dẫn nạp ví",
    message: "Chủ hàng cần hỗ trợ liên kết tài khoản ngân hàng doanh nghiệp để nạp ví tự động.",
    link: "/admin/support?tab=tickets",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    meta: { ticketId: "TK-9819" },
  },
  {
    id: "notif-mock-11",
    type: "system",
    title: "Bảo trì định kỳ hệ thống Gateway",
    message: "Cổng thanh toán và dịch vụ Webhook ngân hàng đã hoàn tất nâng cấp bảo mật định kỳ.",
    link: "/admin/settings",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "notif-mock-12",
    type: "user_registered",
    title: "Thành viên mới: Hoàng Nhật Minh",
    message: "Tài xế xe tải van 1.5 tấn (0918765432) khu vực TP.HCM vừa đăng ký tham gia đội xe.",
    link: "/admin/users",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

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

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case "user_registered":
      return {
        label: "Thành viên mới",
        icon: UserPlus,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
        iconClass: "bg-blue-100 text-blue-600",
      };
    case "kyc_pending":
      return {
        label: "Chờ duyệt eKYC",
        icon: ShieldAlert,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
        iconClass: "bg-amber-100 text-amber-600",
      };
    case "order_cancelled":
      return {
        label: "Hủy đơn hàng",
        icon: AlertTriangle,
        badgeClass: "bg-red-50 text-red-700 border-red-200/80",
        iconClass: "bg-red-100 text-red-600",
      };
    case "support_ticket":
      return {
        label: "Ticket hỗ trợ",
        icon: Headset,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        iconClass: "bg-emerald-100 text-emerald-600",
      };
    case "chat":
      return {
        label: "Tin nhắn chat",
        icon: MessageSquare,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
        iconClass: "bg-purple-100 text-purple-600",
      };
    default:
      return {
        label: "Hệ thống",
        icon: Bell,
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200/80",
        iconClass: "bg-slate-100 text-slate-600",
      };
  }
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selection & Modal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<AdminNotificationItem | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/notifications/feed`);
      if (res.ok) {
        const data = await res.json();
        const items = data.data?.notifications || [];
        if (items.length > 0) {
          setNotifications(items);
          setIsOffline(false);
        } else {
          setNotifications(INITIAL_MOCK_NOTIFICATIONS);
          setIsOffline(false);
        }
      } else {
        setNotifications(INITIAL_MOCK_NOTIFICATIONS);
        setIsOffline(true);
      }
    } catch (e) {
      console.warn("Failed to fetch admin notifications feed, using fallback", e);
      setNotifications(INITIAL_MOCK_NOTIFICATIONS);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/users/notifications/read-all`, { method: "PATCH" });
    } catch (e) {
      console.warn("Failed to mark all notifications read on backend", e);
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setSelectedIds([]);
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc", {
      title: "Cập nhật thông báo",
    });
  };

  const handleToggleRead = async (item: AdminNotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newReadState = !item.read;

    if (newReadState && item.id) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => null);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: newReadState } : n))
    );

    if (detailItem && detailItem.id === item.id) {
      setDetailItem({ ...detailItem, read: newReadState });
    }
  };

  const handleBatchMarkRead = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    for (const id of selectedIds) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${id}/read`, { method: "PATCH" }).catch(() => null);
    }
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.includes(n.id) ? { ...n, read: true } : n))
    );
    setSelectedIds([]);
    toast.success(`Đã đánh dấu ${count} thông báo đã chọn là đã đọc`);
  };

  const handleItemNavigate = (item: AdminNotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!item.read) {
      handleToggleRead(item);
    }

    let targetLink = item.link;
    if (!targetLink || targetLink === "/admin/support") {
      if (item.type === "chat" || item.meta?.chatId) {
        const chatId = item.meta?.chatId || (item as any).chatId;
        const senderId = item.meta?.senderId || (item as any).senderId;
        targetLink = chatId
          ? `/admin/support?tab=chats&chatId=${chatId}${senderId ? `&userId=${senderId}` : ""}`
          : (senderId ? `/admin/support?tab=chats&userId=${senderId}` : `/admin/support?tab=chats`);
      } else if (item.type === "support_ticket" && item.meta?.ticketId) {
        targetLink = `/admin/support?tab=tickets&ticketId=${item.meta.ticketId}`;
      }
    }

    if (targetLink) {
      router.push(targetLink);
    }
  };

  // Filtered & Sorted notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications.filter((item) => {
      // Category filter
      if (category === "users" && item.type !== "user_registered") return false;
      if (category === "kyc" && item.type !== "kyc_pending") return false;
      if (category === "orders" && item.type !== "order_cancelled") return false;
      if (category === "support" && item.type !== "support_ticket" && item.type !== "chat") return false;
      if (category === "system" && item.type !== "system") return false;

      // Read status filter
      if (readFilter === "unread" && item.read) return false;
      if (readFilter === "read" && !item.read) return false;

      // Date Range filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(item.createdAt) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(item.createdAt) > end) return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchMsg = item.message.toLowerCase().includes(query);
        const matchType = item.type.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg && !matchType) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === "read") {
        comparison = (a.read === b.read ? 0 : a.read ? 1 : -1);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [notifications, category, readFilter, startDate, endDate, search, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * limit;
    return filteredNotifications.slice(startIndex, startIndex + limit);
  }, [filteredNotifications, validCurrentPage, limit]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      users: notifications.filter((n) => n.type === "user_registered").length,
      kyc: notifications.filter((n) => n.type === "kyc_pending").length,
      orders: notifications.filter((n) => n.type === "order_cancelled").length,
      support: notifications.filter((n) => n.type === "support_ticket" || n.type === "chat").length,
    };
  }, [notifications]);

  // Selection handlers
  const handleSelectAllCurrentPage = () => {
    const currentPageIds = paginatedNotifications.map((n) => n.id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllCurrentPageSelected =
    paginatedNotifications.length > 0 &&
    paginatedNotifications.every((n) => selectedIds.includes(n.id));

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Hệ thống đang hoạt động với dữ liệu mẫu đồng bộ. Các thao tác lọc, xem chi tiết và phân trang đều được xử lý trực tiếp.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-primary-600" />
            Trung Tâm Thông Báo Quản Trị
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Theo dõi, lọc theo khoảng ngày, phân trang và xử lý thông báo thành viên mới, eKYC, hủy chuyến và hỗ trợ khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Đã đọc tất cả ({stats.unread})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => { setCategory("all"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-primary-400 ${
            category === "all" ? "border-primary-500 ring-2 ring-primary-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tất cả</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div
          onClick={() => { setReadFilter("unread"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-red-400 ${
            readFilter === "unread" ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chưa đọc</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.unread}</p>
        </div>
        <div
          onClick={() => { setCategory("users"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-blue-400 ${
            category === "users" ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành viên mới</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.users}</p>
        </div>
        <div
          onClick={() => { setCategory("kyc"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-amber-400 ${
            category === "kyc" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt eKYC</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{stats.kyc}</p>
        </div>
        <div
          onClick={() => { setCategory("orders"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-red-400 ${
            category === "orders" ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn bị hủy</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.orders}</p>
        </div>
        <div
          onClick={() => { setCategory("support"); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-emerald-400 ${
            category === "support" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hỗ trợ & Chat</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.support}</p>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tiêu đề, nội dung thông báo, số điện thoại..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative w-full sm:w-56">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as NotificationCategory);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="users">Thành viên mới</option>
              <option value="kyc">Chờ duyệt eKYC</option>
              <option value="orders">Đơn hàng bị hủy</option>
              <option value="support">Hỗ trợ & Chat</option>
              <option value="system">Hệ thống</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Read Status Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unread">Chỉ chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
            <CheckCheck className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Page Limit Select */}
          <div className="relative w-full sm:w-44">
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

        {/* Date Range Filter Row */}
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

      {/* Batch Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-primary-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="bg-primary-600 text-white px-2 py-0.5 rounded-md text-[11px]">
              {selectedIds.length}
            </span>
            <span>thông báo đang được chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchMarkRead}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Đánh dấu đã đọc</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-primary-200 hover:bg-primary-100 text-primary-800 rounded-xl transition-colors cursor-pointer"
            >
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách thông báo quản trị...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Bell className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy thông báo nào</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm, bộ lọc phân loại hoặc xóa bộ lọc khoảng ngày để hiển thị thông báo.
            </p>
            {(search || category !== "all" || readFilter !== "all" || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setReadFilter("all");
                  clearDateFilter();
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-bold text-xs hover:bg-primary-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa tất cả bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Horizontal Scroll Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Bảng danh sách thông báo</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>

            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1050px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    {/* Checkbox column */}
                    <th className="py-4 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={handleSelectAllCurrentPage}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        title="Chọn tất cả trên trang này"
                      />
                    </th>

                    {/* Read Status Column */}
                    <th className="py-4 px-3 w-28 cursor-pointer hover:text-slate-600 select-none" onClick={() => handleSort("read")}>
                      <div className="flex items-center gap-1.5">
                        <span>Trạng thái</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </th>

                    {/* Category Column */}
                    <th className="py-4 px-4 w-40 cursor-pointer hover:text-slate-600 select-none" onClick={() => handleSort("type")}>
                      <div className="flex items-center gap-1.5">
                        <span>Phân loại</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </th>

                    {/* Title & Message Column */}
                    <th className="py-4 px-4 cursor-pointer hover:text-slate-600 select-none" onClick={() => handleSort("title")}>
                      <div className="flex items-center gap-1.5">
                        <span>Tiêu đề & Nội dung</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </th>

                    {/* Navigation Link Column */}
                    <th className="py-4 px-4 w-44">Đối tượng xử lý</th>

                    {/* CreatedAt Column */}
                    <th className="py-4 px-4 w-44 cursor-pointer hover:text-slate-600 select-none" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center gap-1.5">
                        <span>Thời gian</span>
                        {sortField === "createdAt" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                    </th>

                    {/* Actions Column */}
                    <th className="py-4 px-4 w-28 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {paginatedNotifications.map((notif) => {
                    const typeCfg = getTypeConfig(notif.type);
                    const TypeIcon = typeCfg.icon;
                    const isSelected = selectedIds.includes(notif.id);

                    return (
                      <tr
                        key={notif.id}
                        onClick={() => setDetailItem(notif)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                          !notif.read ? "bg-primary-50/15 font-medium" : ""
                        } ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelectRow(notif.id, e as any)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(notif, e)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              !notif.read
                                ? "bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/80"
                            }`}
                            title={!notif.read ? "Nhấn để đánh dấu đã đọc" : "Nhấn để đánh dấu chưa đọc"}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                !notif.read ? "bg-red-500 animate-pulse" : "bg-slate-400"
                              }`}
                            />
                            <span>{!notif.read ? "Chưa đọc" : "Đã đọc"}</span>
                          </button>
                        </td>

                        {/* Category Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${typeCfg.badgeClass}`}
                          >
                            <TypeIcon className="w-3.5 h-3.5" />
                            <span>{typeCfg.label}</span>
                          </span>
                        </td>

                        {/* Title and Message preview */}
                        <td className="py-4 px-4 max-w-md">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-xs ${
                                  !notif.read ? "font-bold text-slate-900" : "font-bold text-slate-700"
                                } truncate group-hover:text-primary-600 transition-colors`}
                              >
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                                  Mới
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </td>

                        {/* Navigation link / object */}
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          {notif.link ? (
                            <button
                              type="button"
                              onClick={(e) => handleItemNavigate(notif, e)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-primary-50 text-slate-600 hover:text-primary-700 text-[11px] font-bold transition-all border border-slate-200/60 hover:border-primary-200 cursor-pointer"
                            >
                              <span>Đi đến mục</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">---</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-slate-700">
                              {formatRelativeTime(notif.createdAt)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span>{formatDateTime(notif.createdAt)}</span>
                            </p>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailItem(notif)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết thông báo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(notif, e)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title={notif.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                            >
                              {notif.read ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-slate-500 font-medium text-center sm:text-left">
                Hiển thị{" "}
                <span className="font-bold text-slate-800">
                  {totalItems === 0 ? 0 : (validCurrentPage - 1) * limit + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(validCurrentPage * limit, totalItems)}
                </span>{" "}
                trong tổng số <span className="font-bold text-slate-800">{totalItems}</span> thông báo
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {prevP && p - prevP > 1 && (
                          <span className="px-1 text-slate-400 font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[34px] h-[34px] rounded-xl font-bold transition-all cursor-pointer ${
                            validCurrentPage === p
                              ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    getTypeConfig(detailItem.type).iconClass
                  }`}
                >
                  {(() => {
                    const IconComponent = getTypeConfig(detailItem.type).icon;
                    return <IconComponent className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                        getTypeConfig(detailItem.type).badgeClass
                      }`}
                    >
                      {getTypeConfig(detailItem.type).label}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        !detailItem.read ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {!detailItem.read ? "Chưa đọc" : "Đã đọc"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {formatDateTime(detailItem.createdAt)} ({formatRelativeTime(detailItem.createdAt)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {detailItem.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {detailItem.message}
              </p>

              {detailItem.meta && Object.keys(detailItem.meta).length > 0 && (
                <div className="pt-3 border-t border-slate-200/60 mt-2 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Thông tin bổ sung:</p>
                  {detailItem.meta.phone && <p>• SĐT liên hệ: <span className="font-semibold text-slate-800">{detailItem.meta.phone}</span></p>}
                  {detailItem.meta.role && <p>• Vai trò: <span className="font-semibold text-slate-800">{detailItem.meta.role === "tai-xe" ? "Tài xế" : "Chủ hàng"}</span></p>}
                  {detailItem.meta.orderCode && <p>• Mã đơn: <span className="font-semibold text-slate-800">{detailItem.meta.orderCode}</span></p>}
                  {detailItem.meta.ticketId && <p>• Mã ticket: <span className="font-semibold text-slate-800">{detailItem.meta.ticketId}</span></p>}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleToggleRead(detailItem)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                {detailItem.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
              </button>

              <div className="flex items-center gap-2">
                {detailItem.link && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      handleItemNavigate(item);
                    }}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Đi đến trang xử lý</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
