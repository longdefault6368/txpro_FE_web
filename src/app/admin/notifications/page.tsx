"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  Filter,
  Headset,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  Package,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

type NotificationCategory = "all" | "users" | "kyc" | "orders" | "support";

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

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/notifications/feed`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.notifications || []);
      }
    } catch (e) {
      console.warn("Failed to fetch admin notifications feed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/users/notifications/read-all`, { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (e) {
      console.warn("Failed to mark all notifications read", e);
    }
  };

  const handleItemClick = async (item: AdminNotificationItem) => {
    if (!item.read && item.id) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => null);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category filter
      if (category === "users" && item.type !== "user_registered") return false;
      if (category === "kyc" && item.type !== "kyc_pending") return false;
      if (category === "orders" && item.type !== "order_cancelled") return false;
      if (category === "support" && item.type !== "support_ticket" && item.type !== "chat") return false;

      // Read status filter
      if (readFilter === "unread" && item.read) return false;
      if (readFilter === "read" && !item.read) return false;

      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchMsg = item.message.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg) return false;
      }

      return true;
    });
  }, [notifications, category, readFilter, search]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-primary-600" />
            Trung Tâm Thông Báo Quản Trị
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Tổng hợp thông báo về người dùng, đơn hàng, eKYC và các yêu cầu live chat hỗ trợ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            Đã đọc tất cả
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tất cả</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chưa đọc</p>
          <p className="text-2xl font-black text-red-500 mt-1">{stats.unread}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành viên mới</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.users}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt eKYC</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.kyc}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn hàng bị hủy</p>
          <p className="text-2xl font-black text-red-600 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hỗ trợ & Chat</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.support}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { key: "all", label: "Tất cả" },
            { key: "users", label: "Người dùng" },
            { key: "kyc", label: "Xác minh eKYC" },
            { key: "orders", label: "Đơn hàng" },
            { key: "support", label: "Hỗ trợ / Chat" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key as NotificationCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                category === tab.key
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thông báo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-3" />
            <p className="text-xs font-bold">Đang tải thông báo hệ thống...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không có thông báo nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Hiện không có thông báo nào phù hợp với bộ lọc bạn đã chọn.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => {
              const isOrder = notif.type === "order_cancelled";
              const isKyc = notif.type === "kyc_pending";
              const isSupport = notif.type === "support_ticket" || notif.type === "chat";
              const isUser = notif.type === "user_registered";

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 sm:p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start gap-4 ${
                    !notif.read ? "bg-primary-50/20" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
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
                      <AlertTriangle className="w-5 h-5" />
                    ) : isKyc ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : isSupport ? (
                      <Headset className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isOrder
                            ? "bg-red-100 text-red-700"
                            : isKyc
                            ? "bg-amber-100 text-amber-700"
                            : isSupport
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isOrder
                          ? "Hủy Đơn"
                          : isKyc
                          ? "eKYC"
                          : isSupport
                          ? "Hỗ Trợ"
                          : "Người Dùng"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {!notif.read && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Mới
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm ${
                        !notif.read
                          ? "font-extrabold text-slate-900"
                          : "font-bold text-slate-700"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Link Icon */}
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-primary-600 transition-colors flex-shrink-0 self-center">
                    <span className="text-xs font-bold text-primary-600 hidden sm:inline">
                      Xem chi tiết
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
