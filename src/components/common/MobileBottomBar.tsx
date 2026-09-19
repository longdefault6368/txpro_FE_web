"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Search,
  Download,
  PhoneCall,
  Headset,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

export default function MobileBottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Do not render on Admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const hotline = companyInfo.hotline || companyInfo.phoneSupport || "0987654321";

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      const downloadEl = document.getElementById("download");
      if (downloadEl) {
        downloadEl.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    setShowDownloadModal(true);
  };

  const navItems = [
    {
      name: "Trang chủ",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      name: "Tra cứu",
      href: "/tracking",
      icon: Search,
      isActive: pathname === "/tracking",
    },
    {
      name: "Tải App",
      action: handleDownloadClick,
      icon: Download,
      isActive: false,
    },
    {
      name: "Hotline",
      href: `tel:${hotline.replace(/\s+/g, "")}`,
      isExternal: true,
      icon: PhoneCall,
      highlightIcon: true,
      isActive: false,
    },
    {
      name: "Hỗ trợ",
      href: "/tro-giup",
      icon: Headset,
      isActive: pathname === "/tro-giup" || pathname?.startsWith("/thong-tin"),
    },
  ];

  return (
    <>
      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 px-2"
      >
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;

            const content = (
              <div
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 w-full ${
                  item.isActive
                    ? "text-primary-600 font-bold"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      item.isActive ? "scale-110 text-primary-600" : ""
                    } ${item.highlightIcon ? "text-emerald-600" : ""}`}
                  />
                  {item.highlightIcon && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[58px]">
                  {item.name}
                </span>
              </div>
            );

            if (item.action) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={item.action}
                  className="w-full flex justify-center cursor-pointer"
                  title={item.name}
                >
                  {content}
                </button>
              );
            }

            if (item.isExternal) {
              return (
                <a key={idx} href={item.href} className="w-full flex justify-center">
                  {content}
                </a>
              );
            }

            return (
              <Link key={idx} href={item.href!} className="w-full flex justify-center">
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Download App Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tải Ứng Dụng TXEPRO</h3>
                  <p className="text-xs text-slate-500">Kết nối chủ hàng & tài xế tức thì</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick value tags */}
            <div className="bg-primary-50/70 border border-primary-100 p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>100% Miễn phí kết nối – Không cắt chiết khấu %</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>Định vị lộ trình xe chạy thời gian thực trên bản đồ</span>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href="#download"
                onClick={() => {
                  setShowDownloadModal(false);
                  router.push("/#download");
                }}
                className="bg-slate-900 hover:bg-black text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all shadow-md active:scale-95"
              >
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dành cho iPhone</span>
                <span className="text-sm font-bold mt-0.5">App Store</span>
              </a>

              <a
                href="#download"
                onClick={() => {
                  setShowDownloadModal(false);
                  router.push("/#download");
                }}
                className="bg-slate-900 hover:bg-black text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all shadow-md active:scale-95"
              >
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dành cho Android</span>
                <span className="text-sm font-bold mt-0.5">Google Play</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
