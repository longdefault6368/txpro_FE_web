"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, MapPin, Route, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import useAmbientMotion from "@/hooks/useAmbientMotion";
import styles from "./HeroShowcase.module.css";

/** Decorative product illustration, not a live trip. */
export default function HeroShowcase() {
  const showcaseRef = useRef<HTMLElement>(null);
  useAmbientMotion(showcaseRef, true);
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) =>
    language === "en" ? en : language === "zh" ? zh : vi;

  return (
    <figure ref={showcaseRef} className={styles.showcase} data-motion-running="false" aria-label={c("Trải nghiệm TXE PRO", "The TXE PRO experience", "TXE PRO 体验")}>
      <div className={styles.orbit} aria-hidden="true">
        <span className={styles.orbitGlow} />
        <span className={styles.orbitTrack}><span /></span>
        <span className={styles.orbitTrack + " " + styles.orbitTrackSecondary}><span /></span>
      </div>
      <div className={styles.photo}>
        <Image
          src="/splash1.png"
          alt={c("Xe tải TXE PRO", "TXE PRO truck", "TXE PRO 货车")}
          fill
          sizes="(max-width: 760px) 65vw, 350px"
          priority
        />
        <span className={styles.photoLabel}><Route size={16} />{c("Kết nối những hành trình", "Connecting journeys", "连接每一段旅程")}</span>
      </div>

      <div className={styles.phone}>
        <div className={styles.speaker} aria-hidden="true" />
        <div className={styles.screen}>
          <div className={styles.brand}><Image src="/logo.png" alt="" width={30} height={30} /><span>TXE PRO</span></div>
          <div className={styles.screenIntro}>
            <h2 className={styles.screenTitle}>{c("Tìm xe ngay", "Find a vehicle", "立即找车")}</h2>
          </div>
          <div className={styles.vehicleChoices}>
            {[
              { asset: "car", label: c("Ô tô", "Car", "汽车") },
              { asset: "truck", label: c("Xe tải", "Truck", "货车") },
              { asset: "motorcycle", label: c("Xe máy", "Motorcycle", "摩托车") },
            ].map(item => (
              <div key={item.asset}>
                <Image src={"/images/vehicles/" + item.asset + ".png"} alt="" width={90} height={65} sizes="75px" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.locations}>
            <div><MapPin size={17} /><span>{c("Điểm nhận", "Pickup", "起点")}<strong>TP. Hồ Chí Minh</strong></span></div>
            <div><MapPin size={17} /><span>{c("Điểm đến", "Destination", "终点")}<strong>Đồng Nai</strong></span></div>
          </div>
          <Link className={styles.screenAction} href="/chu-hang/form-tao-don">
            {c("Bắt đầu tìm xe", "Start your search", "开始找车")}<ArrowUpRight size={18} />
          </Link>
          <div className={styles.screenFoot}><ShieldCheck size={15} />{c("Lựa chọn theo nhu cầu", "Choose what suits you", "按需选择")}</div>
        </div>
      </div>

    </figure>
  );
}
