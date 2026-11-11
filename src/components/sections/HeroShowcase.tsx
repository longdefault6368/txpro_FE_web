"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, MapPin, Route, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import useAmbientMotion from "@/hooks/useAmbientMotion";
import styles from "./HeroShowcase.module.css";

export type HeroScene = {
  label: string;
  photo: string;
  photoAlt: string;
  photoPosition?: string;
  photoLabel: string;
  title: string;
  vehicles: { asset: string; label: string }[];
  fromLabel: string;
  from: string;
  toLabel: string;
  to: string;
  actionHref: string;
  action: string;
  foot: string;
  priority?: boolean;
};

/** Decorative product illustration, not a live trip. */
export default function HeroShowcase({ scene }: { scene?: HeroScene } = {}) {
  const showcaseRef = useRef<HTMLElement>(null);
  useAmbientMotion(showcaseRef, true);
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) =>
    language === "en" ? en : language === "zh" ? zh : vi;
  const content = scene ?? {
    label: c("Trải nghiệm TXE PRO", "The TXE PRO experience", "TXE PRO 体验"),
    photo: "/images/home/hero.webp",
    photoAlt: c("Xe tải TXE PRO", "TXE PRO truck", "TXE PRO 货车"),
    photoLabel: c("Kết nối những hành trình", "Connecting journeys", "连接每一段旅程"),
    title: c("Tìm xe ngay", "Find a vehicle", "立即找车"),
    vehicles: [
      { asset: "car", label: c("Ô tô", "Car", "汽车") },
      { asset: "truck", label: c("Xe tải", "Truck", "货车") },
      { asset: "motorcycle", label: c("Xe máy", "Motorcycle", "摩托车") },
    ],
    fromLabel: c("Điểm nhận", "Pickup", "起点"),
    from: "TP. Hồ Chí Minh",
    toLabel: c("Điểm đến", "Destination", "终点"),
    to: "Đồng Nai",
    actionHref: "/chu-hang/form-tao-don",
    action: c("Bắt đầu tìm xe", "Start your search", "开始找车"),
    foot: c("Lựa chọn theo nhu cầu", "Choose what suits you", "按需选择"),
    priority: true,
  };

  return (
    <figure ref={showcaseRef} className={styles.showcase} data-motion-running="false" aria-label={content.label}>
      <div className={styles.orbit} aria-hidden="true">
        <span className={styles.orbitGlow} />
        <span className={styles.orbitTrack}><span /></span>
        <span className={styles.orbitTrack + " " + styles.orbitTrackSecondary}><span /></span>
      </div>
      <div className={styles.photo}>
        <Image
          src={content.photo}
          alt={content.photoAlt}
          fill
          sizes="(max-width: 760px) 65vw, 350px"
          priority={content.priority}
          style={content.photoPosition ? { objectPosition: content.photoPosition } : undefined}
        />
        <span className={styles.photoLabel}><Route size={16} />{content.photoLabel}</span>
      </div>

      <div className={styles.phone}>
        <div className={styles.speaker} aria-hidden="true" />
        <div className={styles.screen}>
          <div className={styles.brand}><Image src="/logo-mark.webp" alt="" width={30} height={30} /><span>TXE PRO</span></div>
          <div className={styles.screenIntro}>
            <h2 className={styles.screenTitle}>{content.title}</h2>
          </div>
          <div className={styles.vehicleChoices}>
            {content.vehicles.map(item => (
              <div key={item.asset}>
                <Image src={"/images/vehicles/" + item.asset + ".webp"} alt="" width={90} height={65} sizes="75px" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.locations}>
            <div><MapPin size={17} /><span>{content.fromLabel}<strong>{content.from}</strong></span></div>
            <div><MapPin size={17} /><span>{content.toLabel}<strong>{content.to}</strong></span></div>
          </div>
          <Link className={styles.screenAction} href={content.actionHref}>
            {content.action}<ArrowUpRight size={18} />
          </Link>
          <div className={styles.screenFoot}><ShieldCheck size={15} />{content.foot}</div>
        </div>
      </div>

    </figure>
  );
}
