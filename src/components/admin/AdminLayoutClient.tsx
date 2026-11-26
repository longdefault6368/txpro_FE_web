"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Headset,
  Circle,
  TerminalSquare,
  Bell,
  UserPlus,
  AlertTriangle,
  MessageCircle,
  UserCheck,
  User,
  ChevronDown,
  Mail,
  Newspaper,
  Briefcase,
  Megaphone,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";
import { type AdminRole } from "@/config/admin-roles";
import {
  canAccessAdminPath,
  filterAdminNotifications,
  hasFullAdminAccess,
  normalizeAdminPermissions,
  resolveAdminHomeRoute,
  resolveAdminNotificationLink,
  resolveAdminRoleDisplay,
  resolveEffectiveAdminPermissions,
} from "@/utils/admin-access";

interface UserSession {
  id?: string;
  email?: string;
  name: string;
  role: string;
  rawRole?: string;
  adminRole?: string;
  adminPermissions?: string[];
  avatar?: string | null;
}

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles?: AdminRole[];
  children?: Array<{ href: string; label: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng Quan", roles: ["super_admin", "operations", "dispatcher"] },
  { href: "/admin/notifications", icon: Bell, label: "Thông Báo" },
  { href: "/admin/team", icon: UserCheck, label: "Ban Quản Trị", roles: ["super_admin"] },
  { href: "/admin/attendance", icon: CalendarClock, label: "Chấm Công" },
  { href: "/admin/users", icon: Users, label: "Người Dùng", roles: ["super_admin", "operations", "kyc_officer"] },
  {
    href: "/admin/orders",
    icon: Package,
    label: "Đơn Hàng",
    roles: ["super_admin", "operations", "dispatcher", "accountant"],
    children: [
      { href: "/admin/orders", label: "Danh Sách Vận Đơn" },
      { href: "/admin/orders/drivers", label: "Tài xế" },
      { href: "/admin/orders/shippers", label: "Chủ hàng" },
    ],
  },
  { href: "/admin/incidents", icon: ShieldAlert, label: "Xử Lý Tranh Chấp", roles: ["super_admin", "operations", "dispatcher", "cskh"] },
  { href: "/admin/analytics", icon: BarChart3, label: "Phân Tích", roles: ["super_admin", "operations", "accountant"] },
  { href: "/admin/affiliates", icon: Users, label: "Đối Tác & Giới Thiệu", roles: ["super_admin", "operations", "accountant"] },
  { href: "/admin/support", icon: Headset, label: "Hỗ trợ & Live Chat", roles: ["super_admin", "operations", "dispatcher", "cskh"] },
  { href: "/admin/contacts", icon: Mail, label: "Liên Hệ Website", roles: ["super_admin", "operations", "cskh"] },
  { href: "/admin/tuyen-dung", icon: Briefcase, label: "Tuyển dụng", roles: ["super_admin", "operations", "cskh"] },
  { href: "/admin/email-marketing", icon: Megaphone, label: "Email marketing", roles: ["super_admin", "operations", "cskh"] },
  { href: "/admin/news", icon: Newspaper, label: "Tin Tức & Ưu Đãi", roles: ["super_admin", "operations"] },
  { href: "/admin/logs", icon: TerminalSquare, label: "Log hệ thống", roles: ["super_admin"] },
  { href: "/admin/settings", icon: Settings, label: "Cài Đặt", roles: ["super_admin"] },
];

interface AdminNotification {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  link?: string;
  chatId?: string;
  senderId?: string;
  createdAt: string;
  meta?: {
    chatId?: string;
    senderId?: string;
    ticketId?: string;
  };
}

function AdminAvatar({
  avatar,
  name,
  className = "w-8 h-8 text-xs",
}: {
  avatar?: string | null;
  name?: string | null;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const rawUrl = avatar ? getServerMediaUrl(avatar) || avatar : null;
  const hasValidAvatar = !!rawUrl && failedUrl !== rawUrl;

  const initials = useMemo(() => {
    if (!name || !name.trim()) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }, [name]);

  if (hasValidAvatar) {
    return (
      <div className={`${className} rounded-full overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner ring-1 ring-white/10 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rawUrl}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(rawUrl)}
        />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full bg-primary-600 text-white font-bold flex items-center justify-center flex-shrink-0 shadow-inner ring-1 ring-white/10 select-none`}>
      <span>{initials}</span>
    </div>
  );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);

  const isLoginPage = pathname === "/admin/login";

  const currentAdminRole = useMemo<string>(() => {
    if (session?.adminRole && session.adminRole.trim()) {
      return session.adminRole.trim();
    }
    if (typeof window !== "undefined") {
      const cached =
        (session?.id ? localStorage.getItem(`txpro_admin_role_${session.id}`) : null) ||
        (session?.email ? localStorage.getItem(`txpro_admin_role_${session.email.toLowerCase()}`) : null);
      if (cached && cached.trim()) return cached.trim();
    }
    return "";
  }, [session]);
  const currentRoleConfig = resolveAdminRoleDisplay(currentAdminRole);

  const effectivePermissions = useMemo<string[]>(() => {
    let cachedUserPermissions: unknown = undefined;
    let cachedRolePermissions: Record<string, unknown> | null = null;
    if (typeof window !== "undefined") {
      try {
        const cached = session?.id ? localStorage.getItem(`txpro_admin_perms_${session.id}`) : null;
        if (cached) cachedUserPermissions = JSON.parse(cached);
      } catch {}

      try {
        const rolePermsCache = localStorage.getItem("txpro_role_permissions");
        if (rolePermsCache) cachedRolePermissions = JSON.parse(rolePermsCache);
      } catch {}
    }
    return resolveEffectiveAdminPermissions({
      adminRole: currentAdminRole,
      sessionPermissions: session?.adminPermissions,
      cachedUserPermissions,
      cachedRolePermissions,
    });
  }, [currentAdminRole, session]);

  const canAccessNotifications = useMemo(
    () => canAccessAdminPath("/admin/notifications", currentAdminRole, effectivePermissions),
    [currentAdminRole, effectivePermissions]
  );

  const canAccessSettings = useMemo(
    () => canAccessAdminPath("/admin/settings", currentAdminRole, effectivePermissions),
    [currentAdminRole, effectivePermissions]
  );

  const visibleNotifications = useMemo(
    () => filterAdminNotifications(adminNotifications, currentAdminRole, effectivePermissions),
    [adminNotifications, currentAdminRole, effectivePermissions]
  );

  const visibleUnreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.read).length,
    [visibleNotifications]
  );

  useEffect(() => {
    if (!isAdmin || !canAccessNotifications) return;
    let active = true;
    const loadNotifications = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/notifications/feed`);
        if (res.ok && active) {
          const data = await res.json();
          setAdminNotifications(data.data?.notifications || []);
        }
      } catch {
        // Best-effort
      }
    };
    void loadNotifications();
    const timer = setInterval(() => {
      void loadNotifications();
    }, 10000);
    const onFocus = () => {
      void loadNotifications();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, canAccessNotifications]);

  const handleMarkAllRead = async () => {
    if (!canAccessNotifications) return;
    const visibleUnread = visibleNotifications.filter((n) => !n.read);
    if (visibleUnread.length === 0) return;
    const visibleIds = new Set(visibleUnread.map((n) => n.id).filter(Boolean));
    try {
      if (hasFullAdminAccess(currentAdminRole, effectivePermissions)) {
        await fetchWithAuth(`${API_BASE}/admin/users/notifications/read-all`, { method: "PATCH" });
      } else {
        await Promise.allSettled(
          visibleUnread
            .filter((n): n is AdminNotification & { id: string } => Boolean(n.id))
            .map((n) =>
              fetchWithAuth(`${API_BASE}/admin/users/notifications/${n.id}/read`, { method: "PATCH" })
            )
        );
      }
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id && visibleIds.has(n.id) ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.warn("Failed to mark all read", e);
    }
  };

  const handleNotifClick = async (notif: AdminNotification) => {
    setNotifDropdownOpen(false);
    if (!notif.read && notif.id) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${notif.id}/read`, { method: "PATCH" }).catch(() => null);
      setAdminNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }

    const targetLink = resolveAdminNotificationLink(notif);
    if (targetLink && canAccessAdminPath(targetLink, currentAdminRole, effectivePermissions)) {
      router.push(targetLink);
    }
  };

  useEffect(() => {
    if (isLoginPage) return;

    const fetchLatestProfile = async (userId: string, currentSession: UserSession) => {
      try {
        let res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}`);
        if (!res.ok) {
          res = await fetchWithAuth(`${API_BASE}/users/profile`);
        }
        if (res.ok) {
          const data = await res.json();
          const user = data.data?.user || data.data?.userProfile || data.user || data.data || data;
          if (user && typeof user === "object") {
            const newAvatar = user.avatar || user.portraitImage || null;
            const newName = user.name || user.fullName || currentSession.name;
            const newRole = typeof user.adminRole === "string" && user.adminRole.trim()
              ? user.adminRole.trim()
              : currentSession.adminRole;
            const hasPermsField = Array.isArray(user.adminPermissions);
            const newPerms = hasPermsField
              ? normalizeAdminPermissions(user.adminPermissions)
              : currentSession.adminPermissions;
            const permsChanged =
              JSON.stringify(newPerms || []) !== JSON.stringify(currentSession.adminPermissions || []);

            if (
              newAvatar !== currentSession.avatar ||
              newName !== currentSession.name ||
              newRole !== currentSession.adminRole ||
              permsChanged
            ) {
              const updatedSession: UserSession = {
                ...currentSession,
                name: newName,
                avatar: newAvatar,
                adminRole: newRole,
                adminPermissions: newPerms,
              };
              setSession(updatedSession);
              localStorage.setItem("txpro_user_session", JSON.stringify(updatedSession));
              window.dispatchEvent(new Event("txpro-admin-session-updated"));
            }
          }
        }
      } catch {
        // Best-effort profile sync
      }
    };

    const syncSession = () => {
      const saved = localStorage.getItem("txpro_user_session");
      if (saved) {
        try {
          const parsed: UserSession = JSON.parse(saved);
          setSession(parsed);
          if (parsed.rawRole === "admin" || parsed.role === "Admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          if (parsed.id) {
            fetchLatestProfile(parsed.id, parsed);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, [isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("txpro_user_session");
    localStorage.removeItem("txpro_token");
    localStorage.removeItem("txpro_refresh_token");
    window.dispatchEvent(new Event("storage"));
    router.push("/admin/login");
  };

  const homeAdminRoute = useMemo(
    () => resolveAdminHomeRoute(currentAdminRole, effectivePermissions),
    [currentAdminRole, effectivePermissions]
  );

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) =>
      canAccessAdminPath(item.href, currentAdminRole, effectivePermissions)
    );
  }, [currentAdminRole, effectivePermissions]);

  const isCurrentRouteAllowed = useMemo(() => {
    if (isLoginPage || !isAdmin) return true;
    return canAccessAdminPath(pathname, currentAdminRole, effectivePermissions);
  }, [pathname, currentAdminRole, effectivePermissions, isLoginPage, isAdmin]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6 border border-slate-100 relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 rounded-t-3xl"></div>
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100 animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Truy Cập Bị Từ Chối</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Bạn không có quyền quản trị để truy cập khu vực này. Vui lòng đăng nhập bằng tài khoản Admin.
          </p>
          <div className="flex gap-4">
            <button onClick={() => router.push("/")} className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <button onClick={() => router.push("/admin/login")} className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Đăng Nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isExactActive = (href: string) => pathname === href;

  const currentNavLabel =
    NAV_ITEMS.flatMap((item) => item.children || [item]).find((item) => isExactActive(item.href))?.label ||
    NAV_ITEMS.find((item) => isActive(item.href))?.label ||
    "Quản Trị";

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-slate-900 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-800 flex-shrink-0">
          <Image src="/logo.png" alt="TXEPRO" width={36} height={36} className="rounded-full shadow-lg" />
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight">TXEPRO</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    active
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-500 group-hover:text-primary-400"}`} />
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
                {item.children && active && (
                  <div className="ml-5 pl-3 border-l border-slate-800 space-y-1">
                    {item.children.map((child) => {
                      const childActive = isExactActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            childActive
                              ? "text-white bg-slate-800"
                              : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/70"
                          }`}
                        >
                          <Circle className={`w-2 h-2 ${childActive ? "fill-primary-400 text-primary-400" : "text-slate-600"}`} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800 flex-shrink-0">
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/80 transition-colors group cursor-pointer"
            title="Xem thông tin tài khoản"
          >
            <AdminAvatar avatar={session?.avatar} name={session?.name} className="w-9 h-9 text-xs" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate group-hover:text-primary-400 transition-colors">
                {session?.name || "Admin"}
              </p>
              <p className="text-slate-400 text-[10px] font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentRoleConfig.color }} />
                <span className="truncate">{currentRoleConfig.shortLabel}</span>
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Đăng Xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen min-w-0 max-w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-3.5 sm:px-6 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-2.5 sm:mr-4 p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">{currentNavLabel}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {canAccessNotifications && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    notifDropdownOpen
                      ? "bg-primary-50 text-primary-600 ring-2 ring-primary-100"
                      : "text-slate-500 hover:text-primary-600 hover:bg-slate-100"
                  }`}
                  title="Thông báo hệ thống"
                >
                  <Bell className="w-5 h-5" />
                  {visibleUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {visibleUnreadCount > 99 ? "99+" : visibleUnreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">Thông báo mới</span>
                          {visibleUnreadCount > 0 && (
                            <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {visibleUnreadCount} mới
                            </span>
                          )}
                        </div>
                        {visibleUnreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold cursor-pointer"
                          >
                            Đã đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {visibleNotifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">Chưa có thông báo nào</div>
                        ) : (
                          visibleNotifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start ${
                                !notif.read ? "bg-primary-50/30" : ""
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  notif.type === "order_cancelled"
                                    ? "bg-red-50 text-red-500"
                                    : notif.type === "kyc_pending"
                                    ? "bg-amber-50 text-amber-600"
                                    : notif.type === "support_ticket"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : notif.type === "chat"
                                    ? "bg-purple-50 text-purple-600"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {notif.type === "order_cancelled" ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : notif.type === "kyc_pending" ? (
                                  <ShieldAlert className="w-4 h-4" />
                                ) : notif.type === "support_ticket" ? (
                                  <Headset className="w-4 h-4" />
                                ) : notif.type === "chat" ? (
                                  <MessageCircle className="w-4 h-4" />
                                ) : (
                                  <UserPlus className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs ${!notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-700"} truncate`}>
                                  {notif.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                  {new Date(notif.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                                  {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-2" />}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                        <Link
                          href="/admin/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-xs font-bold text-primary-600 hover:text-primary-700 py-1 block cursor-pointer"
                        >
                          Xem tất cả thông báo →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className={`flex items-center gap-2 pl-1 pr-1.5 sm:pr-3 py-1 rounded-full border transition-all cursor-pointer ${
                  userDropdownOpen
                    ? "bg-primary-50 border-primary-200 ring-2 ring-primary-100"
                    : "bg-slate-50 border-slate-200/70 hover:border-primary-300 hover:bg-primary-50/40"
                }`}
                title="Tài khoản của tôi"
              >
                <AdminAvatar avatar={session?.avatar} name={session?.name} className="w-7 h-7 text-[11px]" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[100px] hidden sm:block">
                  {session?.name || "Admin"}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border hidden sm:inline-block ${currentRoleConfig.badgeClass}`}>
                  {currentRoleConfig.shortLabel}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800">
                      <div className="flex items-center gap-3">
                        <AdminAvatar avatar={session?.avatar} name={session?.name} className="w-10 h-10 text-sm" />
                        <div className="min-w-0">
                          <p className="text-white text-xs font-bold truncate">{session?.name || "Admin"}</p>
                          <p className="text-slate-400 text-[10px] truncate mt-0.5">{session?.email || ""}</p>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${currentRoleConfig.badgeClass}`}>
                            {currentRoleConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      <Link
                        href="/admin/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Thông tin tài khoản
                      </Link>
                      {canAccessSettings && (
                        <Link
                          href="/admin/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Cài đặt hệ thống
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 py-1.5">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 min-w-0 max-w-full overflow-x-hidden">
          {isCurrentRouteAllowed ? (
            children
          ) : (
            <div className="max-w-xl mx-auto my-16 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Giới Hạn Quyền Truy Cập</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
                  Tài khoản của bạn hiện thuộc cấp bậc <span className="font-bold text-slate-800">{currentRoleConfig.label}</span> và chưa được phân quyền truy cập chức năng này.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => router.push(homeAdminRoute)}
                  className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Quay Về Trang Phân Công Của Bạn
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
