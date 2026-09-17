"use client";

import Link from "next/link";
import {
  Smartphone,
  Apple,
  Play,
  Phone,
  Package,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

export default function SubpageCtaBanner() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();

  const copy = {
    vi: {
      badge: "Nền Tảng Vận Tải Thông Minh",
      title: "Sẵn sàng kết nối vận tải an toàn & tối ưu chi phí?",
      desc: "Gia nhập ngay mạng lưới logistics hàng đầu Việt Nam. Ghép chuyến thông minh, ký quỹ an toàn cùng MB Bank và hỗ trợ liên tục 24/7.",
      appStore: "Tải trên App Store",
      googlePlay: "Tải trên Google Play",
      hotline: companyInfo.hotline ? `Tổng đài: ${companyInfo.hotline}` : "",
      trackOrder: "Tra cứu vận đơn",
      feature1: "Ký quỹ bảo chứng MB Bank",
      feature2: "Định vị GPS thời gian thực",
      feature3: "Tối ưu chuyến xe rỗng",
    },
    en: {
      badge: "Smart Logistics Platform",
      title: "Ready to optimize your freight costs safely?",
      desc: "Join Vietnam's leading freight network today. Smart empty-haul matching, bank-backed escrow with MB Bank, and 24/7 support.",
      appStore: "Get it on App Store",
      googlePlay: "Get it on Google Play",
      hotline: companyInfo.hotline ? `Hotline: ${companyInfo.hotline}` : "",
      trackOrder: "Track Waybill",
      feature1: "MB Bank Escrow Custody",
      feature2: "Live Real-Time GPS Tracking",
      feature3: "Empty Return Route Matching",
    },
    zh: {
      badge: "智慧数字化货运平台",
      title: "准备好开启安全、高效、低成本的运输了吗？",
      desc: "立即加入越南领先的数字化公路货运生态圈。智能返程匹配、MB Bank 担保结算与全天候 24/7 专席客服。",
      appStore: "前往 App Store 下载",
      googlePlay: "前往 Google Play 下载",
      hotline: companyInfo.hotline ? `服务热线: ${companyInfo.hotline}` : "",
      trackOrder: "运单轨迹查询",
      feature1: "MB Bank 联合资金担保",
      feature2: "GPS 全程实时在途跟踪",
      feature3: "返程空车智能配货",
    },
  }[language] || {
    badge: "Nền Tảng Vận Tải Thông Minh",
    title: "Sẵn sàng kết nối vận tải an toàn & tối ưu chi phí?",
    desc: "Gia nhập ngay mạng lưới logistics hàng đầu Việt Nam.",
    appStore: "App Store",
    googlePlay: "Google Play",
    hotline: companyInfo.hotline ? `Tổng đài: ${companyInfo.hotline}` : "",
    trackOrder: "Tra cứu vận đơn",
    feature1: "Ký quỹ MB Bank",
    feature2: "Định vị GPS",
    feature3: "Chuyến xe rỗng",
  };

  return (
    <section className="py-12 lg:py-16 bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-slate-950 p-8 sm:p-12 lg:p-14 text-white shadow-2xl">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/15 blur-[90px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-primary-200 tracking-wide uppercase">
                <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                <span>{copy.badge}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                {copy.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
                {copy.desc}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-semibold text-primary-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {copy.feature1}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {copy.feature2}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {copy.feature3}
                </span>
              </div>
            </div>

            {/* Right Column (5 cols): Download buttons & quick actions */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.02] shadow-sm group"
                >
                  <Apple className="w-7 h-7 fill-white shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="text-left truncate">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">Download for iOS</div>
                    <div className="text-xs sm:text-sm font-bold truncate">App Store</div>
                  </div>
                </a>

                <a
                  href="#"
                  className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.02] shadow-sm group"
                >
                  <Play className="w-7 h-7 fill-white shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="text-left truncate">
                    <div className="text-[10px] text-slate-300 font-medium uppercase">Download for Android</div>
                    <div className="text-xs sm:text-sm font-bold truncate">Google Play</div>
                  </div>
                </a>
              </div>

              <div className={`grid ${companyInfo.hotline ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3 pt-2`}>
                {companyInfo.hotline && (
                  <a
                    href={`tel:${companyInfo.hotline.replace(/\s/g, "")}`}
                    className="px-4 py-3 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{copy.hotline}</span>
                  </a>
                )}

                <Link
                  href="/tracking"
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Package className="w-4 h-4 shrink-0 text-primary-600" />
                  <span>{copy.trackOrder}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
