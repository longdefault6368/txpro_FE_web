"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

const footerCopy = {
  vi: {
    desc: "Nền tảng kết nối chủ hàng và tài xế theo thời gian thực, hỗ trợ đăng đơn, nhận chuyến, theo dõi GPS, ví điện tử và thanh toán ký quỹ an toàn.",
    company: "TXEPRO",
    guide: "Hướng dẫn",
    policy: "Chính sách",
    support: "Hỗ trợ",
    rights: "Tất cả quyền được bảo lưu.",
    hotlineLabel: "Tổng đài hỗ trợ 24/7:",
    emailLabel: "Hòm thư tiếp nhận:",
    taxLabel: "Mã số thuế:",
    links: {
      about: "Giới thiệu dự án",
      operation: "Quy chế hoạt động",
      help: "Trợ giúp & FAQ",
      contact: "Liên hệ TXEPRO",
      shipperGuide: "Hướng dẫn chủ hàng",
      driverGuide: "Hướng dẫn tài xế",
      trackingGuide: "Tra cứu vận đơn",
      faq: "Câu hỏi thường gặp",
      terms: "Điều khoản sử dụng",
      privacy: "Chính sách bảo mật",
      payment: "Thanh toán & ký quỹ",
      complaints: "Khiếu nại & bồi thường",
    },
  },
  en: {
    desc: "A real-time logistics platform connecting shippers and drivers with order posting, trip matching, GPS tracking, wallet flows, and secure escrow payments.",
    company: "TXEPRO",
    guide: "Guides",
    policy: "Policies",
    support: "Support",
    rights: "All rights reserved.",
    hotlineLabel: "24/7 Support Hotline:",
    emailLabel: "Official Email:",
    taxLabel: "Tax Code:",
    links: {
      about: "About the project",
      operation: "Operating rules",
      help: "Help & Support",
      contact: "Contact TXEPRO",
      shipperGuide: "Shipper guide",
      driverGuide: "Driver guide",
      trackingGuide: "Track an order",
      faq: "Frequently Asked Questions",
      terms: "Terms of use",
      privacy: "Privacy policy",
      payment: "Payment & escrow",
      complaints: "Claims & compensation",
    },
  },
  zh: {
    desc: "TXEPRO 是连接货主与司机的实时物流平台，支持发布运单、接单匹配、GPS 追踪、钱包流程以及安全担保支付。",
    company: "TXEPRO",
    guide: "使用指南",
    policy: "政策条款",
    support: "支持服务",
    rights: "保留所有权利。",
    hotlineLabel: "24/7 服务热线:",
    emailLabel: "官方服务邮箱:",
    taxLabel: "税号:",
    links: {
      about: "项目介绍",
      operation: "运营规则",
      help: "帮助与支持",
      contact: "联系 TXEPRO",
      shipperGuide: "货主指南",
      driverGuide: "司机指南",
      trackingGuide: "运单查询",
      faq: "常见问题",
      terms: "使用条款",
      privacy: "隐私政策",
      payment: "支付与担保",
      complaints: "投诉与赔付",
    },
  },
} as const;

const linkGroups = [
  {
    titleKey: "company",
    links: [
      ["about", "/thong-tin/gioi-thieu"],
      ["operation", "/thong-tin/quy-che-hoat-dong"],
      ["help", "/tro-giup"],
      ["contact", "/thong-tin/lien-he"],
    ],
  },
  {
    titleKey: "guide",
    links: [
      ["shipperGuide", "/thong-tin/huong-dan-chu-hang"],
      ["driverGuide", "/thong-tin/huong-dan-tai-xe"],
      ["trackingGuide", "/tracking"],
      ["faq", "/tro-giup"],
    ],
  },
  {
    titleKey: "policy",
    links: [
      ["terms", "/thong-tin/dieu-khoan-su-dung"],
      ["privacy", "/thong-tin/chinh-sach-bao-mat"],
      ["payment", "/thong-tin/thanh-toan-ky-quy"],
      ["complaints", "/thong-tin/khieu-nai-boi-thuong"],
    ],
  },
] as const;

export default function Footer() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const copy = footerCopy[language] || footerCopy.vi;

  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.45fr_2fr] mb-12">
          <div>
            <Link href="/" className="inline-flex items-center group" title="TXEPRO">
              <Image
                src="/logo.png"
                alt="TXEPRO Logo"
                width={52}
                height={52}
                className="rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform"
              />
            </Link>
            <p className="text-slate-600 max-w-md text-sm leading-7 mt-4">
              {copy.desc}
            </p>

            {/* Direct Company Contact Info - Only render items configured by admin */}
            {(companyInfo.hotline || companyInfo.emailSupport || companyInfo.emailGeneral || companyInfo.addressHcm) && (
              <div className="mt-5 space-y-2.5 text-xs text-slate-600 max-w-md">
                {companyInfo.hotline && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span className="text-slate-500">{copy.hotlineLabel}</span>
                    <a
                      href={`tel:${companyInfo.hotline.replace(/\s/g, "")}`}
                      className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                    >
                      {companyInfo.hotline}
                    </a>
                  </div>
                )}

                {(companyInfo.emailSupport || companyInfo.emailGeneral) && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span className="text-slate-500">{copy.emailLabel}</span>
                    <a
                      href={`mailto:${companyInfo.emailSupport || companyInfo.emailGeneral}`}
                      className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                    >
                      {companyInfo.emailSupport || companyInfo.emailGeneral}
                    </a>
                  </div>
                )}

                {companyInfo.addressHcm && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-relaxed">
                      {companyInfo.addressHcm}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {linkGroups.map((group) => (
              <div key={group.titleKey}>
                <h4 className="text-slate-950 font-bold mb-4 text-sm uppercase tracking-wide">
                  {copy[group.titleKey]}
                </h4>
                <ul className="space-y-3 text-slate-600 text-sm font-semibold">
                  {group.links.map(([labelKey, href]) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-primary-600 transition-colors">
                        {copy.links[labelKey]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs sm:text-sm font-medium">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} {companyInfo.companyName || "TXEPRO Technologies"}. {copy.rights}</p>
            {companyInfo.taxCode && (
              <span className="text-slate-400 font-normal">
                {copy.taxLabel} {companyInfo.taxCode}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/thong-tin/dieu-khoan-su-dung" className="hover:text-primary-600 transition-colors">
              {copy.links.terms}
            </Link>
            <Link href="/thong-tin/chinh-sach-bao-mat" className="hover:text-primary-600 transition-colors">
              {copy.links.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
