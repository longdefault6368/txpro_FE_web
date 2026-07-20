"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const footerCopy = {
  vi: {
    desc: "Nền tảng kết nối chủ hàng và tài xế theo thời gian thực, hỗ trợ đăng đơn, nhận chuyến, theo dõi GPS, ví điện tử và thanh toán ký quỹ an toàn.",
    company: "TXEPRO",
    guide: "Hướng dẫn",
    policy: "Chính sách",
    support: "Hỗ trợ",
    rights: "Tất cả quyền được bảo lưu.",
    links: {
      about: "Giới thiệu dự án",
      operation: "Quy chế hoạt động",
      shipperGuide: "Hướng dẫn chủ hàng",
      driverGuide: "Hướng dẫn tài xế",
      trackingGuide: "Tra cứu vận đơn",
      terms: "Điều khoản sử dụng",
      privacy: "Chính sách bảo mật",
      payment: "Thanh toán & ký quỹ",
      complaints: "Khiếu nại & bồi thường",
      help: "Trung tâm hỗ trợ",
      contact: "Liên hệ TXEPRO",
    },
  },
  en: {
    desc: "A real-time logistics platform connecting shippers and drivers with order posting, trip matching, GPS tracking, wallet flows, and secure escrow payments.",
    company: "TXEPRO",
    guide: "Guides",
    policy: "Policies",
    support: "Support",
    rights: "All rights reserved.",
    links: {
      about: "About the project",
      operation: "Operating rules",
      shipperGuide: "Shipper guide",
      driverGuide: "Driver guide",
      trackingGuide: "Track an order",
      terms: "Terms of use",
      privacy: "Privacy policy",
      payment: "Payment & escrow",
      complaints: "Claims & compensation",
      help: "Help center",
      contact: "Contact TXEPRO",
    },
  },
  zh: {
    desc: "TXEPRO 是连接货主与司机的实时物流平台，支持发布运单、接单匹配、GPS 追踪、钱包流程以及安全担保支付。",
    company: "TXEPRO",
    guide: "使用指南",
    policy: "政策条款",
    support: "支持服务",
    rights: "保留所有权利。",
    links: {
      about: "项目介绍",
      operation: "运营规则",
      shipperGuide: "货主指南",
      driverGuide: "司机指南",
      trackingGuide: "运单查询",
      terms: "使用条款",
      privacy: "隐私政策",
      payment: "支付与担保",
      complaints: "投诉与赔付",
      help: "帮助中心",
      contact: "联系 TXEPRO",
    },
  },
} as const;

const linkGroups = [
  {
    titleKey: "company",
    links: [
      ["about", "/thong-tin/gioi-thieu"],
      ["operation", "/thong-tin/quy-che-hoat-dong"],
      ["contact", "/thong-tin/lien-he"],
    ],
  },
  {
    titleKey: "guide",
    links: [
      ["shipperGuide", "/thong-tin/huong-dan-chu-hang"],
      ["driverGuide", "/thong-tin/huong-dan-tai-xe"],
      ["trackingGuide", "/tracking"],
      ["help", "/thong-tin/trung-tam-ho-tro"],
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
  const copy = footerCopy[language] || footerCopy.vi;

  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr] mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="TXEPRO Logo"
                width={48}
                height={48}
                className="rounded-full object-cover shadow-lg"
              />
              <span className="text-xl font-bold text-slate-950">TXEPRO</span>
            </Link>
            <p className="text-slate-600 max-w-md text-sm leading-7 mt-5">
              {copy.desc}
            </p>
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

        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between gap-4 text-slate-500 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} TXEPRO Technologies. {copy.rights}</p>
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
