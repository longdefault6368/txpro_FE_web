"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SubpageHeroBannerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  metaInfo?: React.ReactNode;
}

const SUBPAGE_NAV_ITEMS = [
  { href: "/thong-tin/gioi-thieu", label: { vi: "Giới thiệu", en: "About", zh: "项目介绍" } },
  { href: "/thong-tin/quy-che-hoat-dong", label: { vi: "Quy chế", en: "Operating Rules", zh: "运营规则" } },
  { href: "/thong-tin/huong-dan-chu-hang", label: { vi: "HD Chủ hàng", en: "Shipper Guide", zh: "货主指南" } },
  { href: "/thong-tin/huong-dan-tai-xe", label: { vi: "HD Tài xế", en: "Driver Guide", zh: "司机指南" } },
  { href: "/tro-giup", label: { vi: "Trợ giúp & FAQ", en: "Help & FAQ", zh: "帮助与 FAQ" } },
  { href: "/thong-tin/lien-he", label: { vi: "Liên hệ", en: "Contact Us", zh: "联系我们" } },
  { href: "/thong-tin/dieu-khoan-su-dung", label: { vi: "Điều khoản", en: "Terms of Service", zh: "使用条款" } },
  { href: "/thong-tin/chinh-sach-bao-mat", label: { vi: "Bảo mật", en: "Privacy Policy", zh: "隐私政策" } },
  { href: "/thong-tin/thanh-toan-ky-quy", label: { vi: "Ký quỹ & Ví", en: "Payment & Escrow", zh: "担保支付" } },
  { href: "/thong-tin/khieu-nai-boi-thuong", label: { vi: "Khiếu nại", en: "Claims", zh: "投诉赔付" } },
];

export default function SubpageHeroBanner({
  title,
  subtitle,
  badge = "Hệ Sinh Thái Vận Tải Số TXEPRO",
  breadcrumbs,
  metaInfo,
}: SubpageHeroBannerProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const langKey = (language as "vi" | "en" | "zh") || "vi";

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: langKey === "en" ? "Home" : langKey === "zh" ? "首页" : "Trang chủ", href: "/" },
    { label: langKey === "en" ? "Information" : langKey === "zh" ? "平台信息" : "Thông tin", href: "/thong-tin/gioi-thieu" },
    { label: title },
  ];

  const crumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-14 sm:pt-28 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/splash1.png"
          alt="TXEPRO Transport Truck Banner"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 filter brightness-90 contrast-105 transition-transform duration-1000"
        />
      </div>

      {/* 2. MULTI-LAYER STYLISH OVERLAYS FOR DEPTH & READABILITY */}
      {/* Primary dark gradient to ensure text contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/85 via-slate-950/80 to-slate-950/95" />

      {/* Subtle brand blue radial aura glow from top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-primary-600/25 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Edge vignette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />

      {/* High-tech grid texture accent */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* 3. BANNER CONTENT (Z-10) */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Breadcrumb Bar */}
        <nav className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/15 text-xs text-slate-200 mb-5 max-w-full overflow-x-auto shadow-lg shadow-black/20">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1 shrink-0">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {crumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-primary-300 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-primary-300 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Badge */}
        {badge && (
          <div className="block mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-600/30 backdrop-blur-md border border-primary-400/30 text-xs font-bold text-primary-200 tracking-wider uppercase shadow-md shadow-primary-950/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              {badge}
            </span>
          </div>
        )}

        {/* Title & Subtitle */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight drop-shadow-md">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-3xl mx-auto leading-relaxed font-normal drop-shadow">
            {subtitle}
          </p>
        )}

        {metaInfo && <div className="mt-4">{metaInfo}</div>}

        {/* Shared Quick Navigation Pills for all subpages */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
            {SUBPAGE_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const label = item.label[langKey] || item.label.vi;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all backdrop-blur-md ${
                    isActive
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/40 border border-primary-400/50 font-bold scale-[1.03]"
                      : "bg-slate-900/60 text-slate-200 hover:bg-slate-800/80 hover:text-white border border-white/10 shadow-sm"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
