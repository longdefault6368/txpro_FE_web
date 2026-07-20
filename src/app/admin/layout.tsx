"use client";

import { useState, useEffect } from "react";
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
  type LucideIcon
} from "lucide-react";

interface UserSession {
  name: string;
  role: string;
  rawRole?: string;
}

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  children?: Array<{ href: string; label: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng Quan" },
  { href: "/admin/users", icon: Users, label: "Người Dùng" },
  {
    href: "/admin/orders",
    icon: Package,
    label: "Đơn Hàng",
    children: [
      { href: "/admin/orders", label: "Danh Sách Vận Đơn" },
      { href: "/admin/orders/drivers", label: "Tài xế" },
      { href: "/admin/orders/shippers", label: "Chủ hàng" },
    ],
  },
  { href: "/admin/analytics", icon: BarChart3, label: "Phân Tích" },
  { href: "/admin/support", icon: Headset, label: "Hỗ trợ" },
  { href: "/admin/logs", icon: TerminalSquare, label: "Log hệ thống" },
  { href: "/admin/settings", icon: Settings, label: "Cài Đặt" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    const saved = localStorage.getItem("txpro_user_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        if (parsed.rawRole === "admin" || parsed.role === "Admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("txpro_user_session");
    localStorage.removeItem("txpro_token");
    window.dispatchEvent(new Event("storage"));
    router.push("/admin/login");
  };

  // If it is the admin login page, bypass everything and just return children
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Access Denied
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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-slate-900 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-800 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="TXEPRO"
            width={36}
            height={36}
            className="rounded-full shadow-lg"
          />
          <div>
            <h1 className="text-white font-extrabold text-sm tracking-tight">TXEPRO</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
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

        {/* Bottom user info */}
        <div className="px-4 py-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
              {session?.name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{session?.name || "Admin"}</p>
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Quản Trị Viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {currentNavLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-slate-400 hover:text-primary-600 text-xs font-semibold transition-colors"
            >
              Về Trang Chủ
            </Link>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/50">
              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                {session?.name || "Admin"}
              </span>
              <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
