"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Plus, ChevronDown } from "lucide-react";
import ServicesDropdown from "./ServicesDropdown";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE } from "@/config/env";
import RoleSwitchButton from "@/components/account/RoleSwitchButton";
import { ROLE_CHANGED_KEY } from "@/utils/account-role-switch";
type Session = { name?: string; rawRole?: string };
export default function Header() {
  const { language, changeLanguage } = useLanguage();
  const router = useRouter(), pathname = usePathname();
  const [open, setOpen] = useState(false), [session, setSession] = useState<Session | null>(null), [loggingOut, setLoggingOut] = useState(false);
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  useEffect(() => {
    const load = () => { try { const raw = localStorage.getItem("txpro_user_session"); setSession(localStorage.getItem("txpro_token") && raw ? JSON.parse(raw) : null); } catch { setSession(null); } };
    const sync = (event: StorageEvent) => { load(); if (event.key === ROLE_CHANGED_KEY && event.newValue && localStorage.getItem("txpro_token")) window.location.replace("/user"); };
    load(); window.addEventListener("storage", sync); window.addEventListener("txpro_session_updated", load);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("txpro_session_updated", load); };
  }, [pathname]);
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) setOpen(false); }; document.addEventListener("keydown", escape); return () => document.removeEventListener("keydown", escape); }, []);
  async function logout() {
    if (loggingOut) return; setLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem("txpro_refresh_token"), deviceId = localStorage.getItem("txpro_device_id");
      if (refreshToken && deviceId) await fetch(API_BASE + "/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken, deviceId }), signal: AbortSignal.timeout(8000) });
    } catch { /* Always clear this browser's credentials, even if offline. */ }
    finally { for (const key of ["txpro_user_session", "txpro_token", "txpro_refresh_token"]) localStorage.removeItem(key); setSession(null); setOpen(false); setLoggingOut(false); window.dispatchEvent(new Event("txpro_session_updated")); router.push("/login"); }
  }
  const links = [
    { href: "/", name: c("Trang chủ", "Home", "首页") }, { href: "/#vehicles", name: c("Dịch vụ", "Services", "服务"), kind: "services" },
    { href: "/tin-tuc", name: c("Tin tức", "News", "资讯") },
    { href: "/tracking", name: c("Theo dõi đơn hàng", "Track an order", "订单追踪") },
    { href: "/tro-giup", name: c("Trợ giúp", "Help", "帮助") },
  ];
  const serviceItems = [
    { href: "/chu-hang/form-tao-don", label: c("Tìm xe", "Find a vehicle", "找车"), description: c("Chọn phương tiện cho hành trình của bạn", "Find a vehicle for your journey", "为行程选择合适车辆") },
    { href: "/tai-xe/dang-tin", label: c("Đăng xe trống", "Post an available vehicle", "发布空车"), description: c("Kết nối xe của bạn với nhu cầu phù hợp", "Connect your vehicle with matching requests", "连接车辆与合适需求") },
  ];
  const navClass = "whitespace-nowrap text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors py-2";
  const languageSelect = <select aria-label={c("Ngôn ngữ", "Language", "语言")} value={language} onChange={e => changeLanguage(e.target.value as "vi" | "en" | "zh")} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"><option value="vi">VI</option><option value="en">EN</option><option value="zh">中文</option></select>;
  return <><header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md"><nav aria-label={c("Điều hướng chính", "Main navigation", "主导航")} className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-5 lg:px-8"><Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}><Image src="/logo.png" alt="TXE PRO" width={42} height={42} priority className="rounded-full" /><span className="text-lg font-bold tracking-tight text-slate-900">TXE <span className="text-primary-600">PRO</span></span></Link><div className="hidden items-center gap-4 xl:flex">{links.map(item => item.kind === "services" ? <ServicesDropdown key={item.href} label={item.name} items={serviceItems} /> : <Link key={item.href} href={item.href} className={navClass}>{item.name}</Link>)}</div><div className="hidden items-center gap-4 xl:flex">{languageSelect}{session ? <details className="relative"><summary className="flex max-w-36 cursor-pointer list-none items-center gap-1 text-sm font-bold text-slate-700"><span className="truncate">{session.name || c("Tài khoản", "Account", "账户")}</span><ChevronDown size={14} /></summary><div className="absolute right-0 top-full mt-4 grid w-52 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><Link href="/don-cua-ban" className={navClass}>{c("Tin/đơn của tôi", "My listings & trips", "我的信息与订单")}</Link><Link href={session.rawRole === "admin" ? "/admin" : "/user"} className={navClass}>{c("Trang cá nhân", "My account", "个人中心")}</Link><span className="border-t border-slate-100 pt-2 text-xs font-semibold text-primary-700">{session.rawRole === "tai-xe" ? c("Tài xế", "Driver", "司机") : session.rawRole === "chu-hang" ? c("Chủ hàng", "Shipper", "货主") : "Admin"}</span><RoleSwitchButton currentRole={session.rawRole} variant="menu" disabled={loggingOut} /><button type="button" onClick={logout} disabled={loggingOut} className="py-2 text-left text-sm text-red-600">{loggingOut ? "..." : c("Đăng xuất", "Sign out", "退出")}</button></div></details> : <Link className={navClass} href="/login">{c("Đăng nhập", "Sign in", "登录")}</Link>}<Link href="/dang-tin" className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white"><Plus size={16} />{c("Đăng tin", "Post a listing", "发布信息")}</Link></div><button type="button" aria-label={c("Mở/đóng menu", "Toggle menu", "切换菜单")} aria-expanded={open} aria-controls="mobile-main-navigation" onClick={() => setOpen(!open)} className="rounded-xl border border-slate-200 p-3 text-slate-700 xl:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button></nav></header>{open && <div className="fixed inset-0 top-20 z-40 bg-slate-900/30 xl:hidden" onClick={() => setOpen(false)}><nav id="mobile-main-navigation" aria-label="Menu" onClick={e => e.stopPropagation()} className="grid max-h-[calc(100dvh-5rem)] gap-3 overflow-auto border-b border-slate-200 bg-white px-6 py-6 shadow-xl">{links.map(item => item.kind === "services" ? <ServicesDropdown key={item.href} label={item.name} items={serviceItems} mobile onNavigate={() => setOpen(false)} /> : <Link key={item.href} href={item.href} className={navClass} onClick={() => setOpen(false)}>{item.name}</Link>)}<Link href="/don-cua-ban" className={navClass} onClick={() => setOpen(false)}>{c("Tin/đơn của tôi", "My listings & trips", "我的信息与订单")}</Link>{session && <RoleSwitchButton currentRole={session.rawRole} variant="menu" disabled={loggingOut} />}<div className="flex items-center justify-between border-t border-slate-100 pt-3">{languageSelect}{session ? <><Link href="/user" onClick={() => setOpen(false)} className={navClass}>{c("Tài khoản", "Account", "账户")}</Link><button type="button" disabled={loggingOut} onClick={logout} className="text-sm text-red-600">{c("Đăng xuất", "Sign out", "退出")}</button></> : <Link href="/login" className={navClass} onClick={() => setOpen(false)}>{c("Đăng nhập", "Sign in", "登录")}</Link>}</div><Link href="/dang-tin" onClick={() => setOpen(false)} className="rounded-xl bg-primary-600 px-5 py-3 text-center font-bold text-white">{c("Đăng tin", "Post a listing", "发布信息")}</Link></nav></div>}</>;
}
