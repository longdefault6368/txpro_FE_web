"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from '@/context/CompanyInfoContext';
import { appDownloadLink, type AppPlatform } from "@/utils/app-downloads";
import s from "./AppStoreLinks.module.css";

function StoreIcon({ platform }: { platform: AppPlatform }) {
  return platform === "android" ? <svg width="31" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 2 13 12 3 22Z" fill="#5BC5F5" /><path d="M3 2 16 9 13 12Z" fill="#55D08A" />
    <path d="m13 12 3-3 6 3-6 3Z" fill="#FFD268" /><path d="m3 22 10-10 3 3Z" fill="#FF6C79" />
  </svg> : <svg width="31" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.3 1.1c.2 1.6-.4 3-1.3 4-1 1-2.3 1.6-3.6 1.5-.2-1.5.5-3 1.4-4 1-1 2.4-1.5 3.5-1.5ZM19.7 18c-.6 1.4-.9 2-1.7 3.2-1.1 1.6-2.5 3.5-4.2 3.5-1.4 0-1.8-.9-3.7-.9s-2.4.9-3.8.9c-1.7 0-3-1.7-4.1-3.3C-.8 17-.8 12 1.1 9c1.3-2.1 3.4-3.3 5.5-3.3 1.6 0 2.7.9 4 .9 1.2 0 2.1-.9 4-.9 1.6 0 3.4.9 4.7 2.5-4.1 2.3-3.4 8.2.4 9.8Z" transform="translate(2 1) scale(.82)" />
  </svg>;
}
export default function AppStoreLinks() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const stores = [{ platform: "android" as const, raw: companyInfo.googlePlayUrl || '', name: "Google Play" },
    { platform: "ios" as const, raw: companyInfo.appStoreUrl || '', name: "App Store" }];
  const configured = stores.every(store => appDownloadLink(store.raw, store.platform).available);
  return <div className={s.wrapper}>
    <div className={s.links} aria-label={c("Tải ứng dụng TXE PRO", "Download the TXE PRO app", "下载 TXE PRO 应用")}>
      {stores.map(store => {
        const link = appDownloadLink(store.raw, store.platform);
        const hint = link.available ? c("Tải ứng dụng từ", "Download on", "前往下载") : c("Nhận hướng dẫn tải", "Get download help", "获取下载指南");
        return <a key={store.platform} href={link.href} target={link.available ? "_blank" : undefined}
          rel={link.available ? "noopener noreferrer" : undefined} className={s.store}
          aria-label={hint + " " + store.name + (link.available ? c(" (mở tab mới)", " (opens a new tab)", "（新标签页）") : "")}>
          <StoreIcon platform={store.platform} /><span><small>{hint}</small><strong>{store.name}</strong></span>
          <span className={s.platform}>{store.platform === "android" ? "Android" : "iOS"}</span>
        </a>;
      })}
    </div>
    {!configured && <p className={s.hint}>{c("Cần link cài đặt? Chọn hệ điều hành để liên hệ TXE PRO nhận hướng dẫn.", "Need an installation link? Choose your platform to contact TXE PRO for help.", "需要安装链接？选择系统并联系 TXE PRO 获取指南。")}</p>}
  </div>;
}
