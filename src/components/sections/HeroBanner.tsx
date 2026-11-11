"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, ShieldCheck, Route } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import HeroShowcase, { type HeroScene } from "./HeroShowcase";
import styles from "./LandingExperience.module.css";

const SLIDE_MS = 6400;

export default function HeroBanner() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const slides = [
    {
      key: "connect",
      eyebrow: c("Kết nối mọi hành trình", "Every journey, connected", "连接每一段旅程"),
      title: [c("Đúng xe.", "Right vehicle.", "合适的车。"), c("Đúng hành trình.", "Right journey.", "合适的旅程。"), c("Cùng TXE PRO.", "With TXE PRO.", "尽在 TXE PRO。")],
      text: c("Từ chuyến đi cá nhân đến vận chuyển hàng hóa. Kết nối khách hàng và tài xế, chủ động lựa chọn và an tâm trên từng chặng đường.", "From personal journeys to moving goods. Connect customers and drivers, choose what works for you and stay informed along the way.", "从个人出行到货物运输。连接客户与司机，自主选择，随时了解行程。"),
      primary: { href: "/chu-hang/form-tao-don", label: c("Tôi cần tìm xe", "Find a vehicle", "我要找车") },
      secondary: { href: "/tai-xe/dang-tin", label: c("Đăng xe trống", "Post availability", "发布空车") },
      foot: [c("Thông tin rõ ràng", "Clear information", "信息清晰"), c("Hành trình chủ động", "Your journey, your choice", "自主安排行程")],
    },
    {
      key: "track",
      eyebrow: c("Theo dõi từng chặng", "Follow every leg", "跟踪每一段"),
      title: [c("Thấy xe.", "See the vehicle.", "看见车辆。"), c("Thấy chặng đường.", "See the route.", "看见路线。"), c("Giao nhận an tâm.", "Hand over with confidence.", "安心交接。")],
      text: c("Xem vị trí và trạng thái chuyến đi trên bản đồ, kèm thời điểm cập nhật, để chủ động báo người nhận.", "See the vehicle location and trip status on the map, with update times, so you can keep the receiver informed.", "在地图上查看车辆位置、行程状态和更新时间，方便及时通知收货人。"),
      primary: { href: "/tracking", label: c("Theo dõi hành trình", "Track a journey", "跟踪行程") },
      secondary: { href: "/chu-hang/form-tao-don", label: c("Tôi cần tìm xe", "Find a vehicle", "我要找车") },
      foot: [c("Vị trí theo thời điểm GPS", "Location with a GPS timestamp", "带 GPS 时间的位置"), c("Trạng thái rõ từng bước", "A status for every step", "每一步状态清楚")],
      scene: {
        label: c("Theo dõi hành trình trên TXE PRO", "Follow a journey on TXE PRO", "在 TXE PRO 上跟踪行程"),
        photo: "/images/news/gps-hanh-trinh.webp",
        photoAlt: c("Tài xế xem lộ trình trên điện thoại", "A driver following the route on a phone", "司机在手机上查看路线"),
        photoPosition: "32% center",
        photoLabel: c("Thấy xe trên bản đồ", "See the vehicle on the map", "在地图上看到车辆"),
        title: c("Theo dõi chuyến", "Follow the trip", "跟踪行程"),
        vehicles: [
          { asset: "truck", label: c("Đang chạy", "En route", "行驶中") },
          { asset: "refrigerated", label: c("Giữ lạnh", "Chilled", "冷藏中") },
          { asset: "container", label: c("Trên đường", "On the road", "在途中") },
        ],
        fromLabel: c("Điểm nhận", "Pickup", "起点"),
        from: "TP. Hồ Chí Minh",
        toLabel: c("Cập nhật mới", "Latest update", "最新位置"),
        to: c("Thủ Đức", "Thu Duc", "守德"),
        actionHref: "/tracking",
        action: c("Xem hành trình", "View the journey", "查看行程"),
        foot: c("Kèm thời điểm GPS", "With a GPS timestamp", "附带 GPS 时间"),
      } satisfies HeroScene,
    },
    {
      key: "drive",
      eyebrow: c("Xe sẵn sàng", "A vehicle, ready", "车辆已就绪"),
      title: [c("Đăng lịch xe.", "Post your schedule.", "发布出车时间。"), c("Chọn tuyến đi.", "Choose your route.", "选择路线。"), c("Chủ động giá.", "Set your price.", "自主定价。")],
      text: c("Tài xế đăng xe trống theo lịch và tuyến của mình. Khách hàng chọn chuyến phù hợp, không cần chờ xếp hộ.", "Drivers post availability for their own schedule and route. Customers choose a suitable trip directly.", "司机按自己的时间和路线发布空车。客户直接选择合适行程。"),
      primary: { href: "/tai-xe/dang-tin", label: c("Đăng xe trống", "Post availability", "发布空车") },
      secondary: { href: "/chu-hang/form-tao-don", label: c("Tôi cần tìm xe", "Find a vehicle", "我要找车") },
      foot: [c("Lịch do bạn quyết định", "Your schedule, your choice", "时间由您决定"), c("Giá đề xuất rõ ràng", "A clear proposed price", "报价清楚")],
      scene: {
        label: c("Đăng xe trống trên TXE PRO", "Post availability on TXE PRO", "在 TXE PRO 上发布空车"),
        photo: "/images/news/dang-xe-trong.webp",
        photoAlt: c("Tài xế chuẩn bị đăng xe trống", "A driver preparing to post availability", "司机准备发布空车"),
        photoPosition: "58% center",
        photoLabel: c("Xe sẵn sàng theo lịch", "A vehicle, ready on schedule", "车辆按计划就绪"),
        title: c("Đăng xe trống", "Post availability", "发布空车"),
        vehicles: [
          { asset: "truck", label: c("Xe tải", "Truck", "货车") },
          { asset: "container", label: "Container" },
          { asset: "car", label: c("Ô tô", "Car", "汽车") },
        ],
        fromLabel: c("Tuyến đi", "Route", "路线"),
        from: c("HCM → Đồng Nai", "HCMC → Dong Nai", "胡志明市 → 同奈"),
        toLabel: c("Lịch chạy", "Schedule", "出车时间"),
        to: c("Sáng mai", "Tomorrow morning", "明天上午"),
        actionHref: "/tai-xe/dang-tin",
        action: c("Đăng tin xe", "Post the listing", "发布车辆"),
        foot: c("Giá do bạn đề xuất", "You propose the price", "价格由您提出"),
      } satisfies HeroScene,
    },
  ];
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (hold || media?.matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slides.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [hold, index, slides.length]);
  return <section className={styles.hero} aria-roledescription="carousel" aria-label={c("Banner TXE PRO", "TXE PRO banner", "TXE PRO 横幅")}
    onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
    onFocus={() => setHold(true)} onBlur={event => { const next = event.relatedTarget; if (!(next instanceof Node) || !event.currentTarget.contains(next)) setHold(false); }}>
    <div className={styles.heroViewport}>
      <div className={styles.heroTrack} style={{ transform: `translate3d(${index * -100}%,0,0)` }}>
        {slides.map((slide, slideIndex) => <div className={styles.heroGrid} key={slide.key} aria-hidden={slideIndex !== index} inert={slideIndex !== index}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span />{slide.eyebrow}</div>
            {slideIndex === 0
              ? <h1>{slide.title[0]}<br />{slide.title[1]}<br /><em>{slide.title[2]}</em></h1>
              : <p className={styles.heroTitle}>{slide.title[0]}<br />{slide.title[1]}<br /><em>{slide.title[2]}</em></p>}
            <p>{slide.text}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={slide.primary.href}>{slide.primary.label}<ArrowUpRight size={19} /></Link>
              <Link className={styles.secondary} href={slide.secondary.href}>{slide.secondary.label}<ArrowRight size={18} /></Link>
            </div>
            <div className={styles.heroFoot}><ShieldCheck size={18} />{slide.foot[0]}<i /><Route size={18} />{slide.foot[1]}</div>
          </div>
          {"scene" in slide ? <HeroShowcase scene={slide.scene} /> : <HeroShowcase />}
        </div>)}
      </div>
    </div>
    <div className={styles.heroDots} aria-label={c("Chọn banner", "Choose a banner", "选择横幅")}>
      {slides.map((slide, slideIndex) => <button key={slide.key} type="button" aria-current={slideIndex === index ? "true" : undefined} aria-label={c("Banner ", "Banner ", "横幅 ") + (slideIndex + 1)} onClick={() => setIndex(slideIndex)} />)}
    </div>
    <div className={styles.heroStrip}><a href="#vehicles">{c("Khám phá TXE PRO", "Explore TXE PRO", "探索 TXE PRO")}<ArrowDown size={17} /></a></div>
  </section>;
}
