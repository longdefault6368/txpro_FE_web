"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, Check, Navigation,
  Package, ShieldCheck, Radio, MessageCircle,
  CalendarDays, Smartphone, CircleHelp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./LandingExperience.module.css";
import HeroBanner from "./HeroBanner";
import NewsFeed from "@/components/news/NewsFeed";
import useLandingMotion from "@/hooks/useLandingMotion";
import HomePostingForm from "./HomePostingForm";
import AppStoreLinks from "@/components/common/AppStoreLinks";
import CommunityShowcase from "./CommunityShowcase";
import HomeQuickActions from "./HomeQuickActions";
import AppFeaturePreview from "./AppFeaturePreview";
import ReviewsCarousel from "./ReviewsCarousel";

export default function LandingExperience() {
  const landingRef = useRef<HTMLElement>(null);
  useLandingMotion(landingRef);
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [feature, setFeature] = useState(0);
  const features = [
    { icon: Radio, title: c("Tìm xe phù hợp", "Find your match", "查找合适车辆"), text: c("Chọn loại phương tiện, điểm nhận và điểm trả. Xem các tin xe phù hợp với nhu cầu của bạn.", "Select a vehicle type and route, then explore matching vehicle listings.", "选择车型和路线，浏览符合需求的车辆信息。") },
    { icon: Navigation, title: c("Theo dõi hành trình", "Follow the journey", "跟踪行程"), text: c("Xem vị trí xe và trạng thái chuyến đi trên bản đồ, kèm thời điểm GPS được cập nhật.", "See the vehicle location and trip status on the map, with GPS update timestamps.", "在地图上查看车辆位置、行程状态及GPS更新时间。") },
    { icon: MessageCircle, title: c("Kết nối thuận tiện", "Stay connected", "便捷联系"), text: c("Nhắn tin, gửi hình ảnh và liên hệ với đối tác ngay trong hành trình.", "Message, share images and contact your trip partner along the way.", "行程中可发送消息、分享图片并联系对方。") },
  ];
  return (
    <main ref={landingRef} className={styles.landing}>
      <HeroBanner />
      <HomePostingForm />
      <CommunityShowcase />
      <HomeQuickActions />
      <section id="vehicles" className={styles.vehicles}>
        <div className={styles.sectionIntro}><span className={styles.kicker}>{c("Đa dạng phương tiện", "Vehicles for your plans", "多样车型")}</span><h2>{c("Mỗi nhu cầu, một lựa chọn.", "A vehicle for every need.", "满足不同需求的选择。")}</h2></div>
        <div className={styles.vehicleRow} data-reveal="stagger">{[
          {asset:"motorcycle", label:c("Xe máy","Motorcycle","摩托车")}, {asset:"car",label:c("Ô tô","Car","汽车")}, {asset:"truck",label:c("Xe tải","Truck","货车")}, {asset:"refrigerated",label:c("Xe đông lạnh","Refrigerated","冷藏车")}, {asset:"container",label:"Container"}, {asset:"crane",label:c("Xe chuyên dụng","Specialist vehicles","专用车")},
        ].map(item => <Link href="/chu-hang/form-tao-don" key={item.label}><div className={styles.vehicleImage}><Image src={"/images/vehicles/" + item.asset + ".webp"} alt={item.label} width={280} height={190} sizes="(max-width: 760px) 40vw, 180px" /></div><span>{item.label}</span></Link>)}</div>
      </section>
      <section data-reveal id="features" className={styles.experience}>
        <div className={styles.experienceCopy}><span className={styles.kicker}>{c("Trải nghiệm TXE PRO", "The TXE PRO experience", "TXE PRO 体验")}</span>
          <h2>{c("Không chỉ tìm xe.", "More than a match.", "不止于找车。")}<br />{c("Đồng hành cả chuyến đi.", "Connected all the way.", "一路相伴。")}</h2>
          <div className={styles.featureList} style={{ "--feature-index": feature } as CSSProperties}>{features.map((item, index) => <button type="button" key={item.title} aria-pressed={feature === index} aria-controls="experience-illustration"
            onClick={() => setFeature(index)} className={feature === index ? styles.selectedFeature : ""}>
            <item.icon size={22} /><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowUpRight size={19} />
          </button>)}</div>
        </div>
        <div id="experience-illustration"><AppFeaturePreview feature={feature} title={features[feature].title} description={features[feature].text} /></div>
      </section>
      <section data-reveal id="pricing" className={styles.trust}><div><ShieldCheck size={33} /><h2>{c("Rõ ràng để an tâm.", "Clarity builds confidence.", "清晰，才能安心。")}</h2><p>{c("Xem thông tin phương tiện và chi phí trước khi xác nhận. Quyền lợi, voucher và ký quỹ được áp dụng theo loại phương tiện và điều kiện của từng chuyến.", "Review vehicle details and costs before confirming. Voucher and deposit terms depend on the vehicle and trip conditions.", "确认前查看车辆信息及费用。优惠券和保证金规则依车型及行程条件而定。")}</p></div><Link href="/thong-tin/dieu-khoan-su-dung">{c("Tìm hiểu điều khoản", "Explore the terms", "了解条款")}<ArrowUpRight size={19} /></Link></section>
      <section data-reveal id="for-you" className={styles.guides}><div className={styles.audienceHeading}><div><span className={styles.kicker}>{c("Cẩm nang sử dụng", "Make the most of TXE PRO", "使用指南")}</span><h2>{c("Bắt đầu thật tự tin.", "Start with confidence.", "安心开始。")}</h2></div><Link href="/tro-giup">{c("Trung tâm trợ giúp", "Help center", "帮助中心")}<ArrowUpRight size={18} /></Link></div><div className={styles.guideGrid}>{[
        {icon:Package,title:c("Tìm chuyến xe đầu tiên","Find your first vehicle","首次找车"),text:c("Những bước cần biết khi tìm và chọn tài xế.","What to know before choosing a driver.","选择司机前需要了解的事项。")},
        {icon:CalendarDays,title:c("Chủ động lịch xe trống","Plan your availability","安排空车时间"),text:c("Tìm hiểu đăng tin và lịch đăng tin tự động.","Learn about listings and automatic schedules.","了解发布信息及自动发布安排。")},
        {icon:CircleHelp,title:c("Cần hỗ trợ trên hành trình?","Need help on your trip?","行程中需要帮助？"),text:c("Tìm hướng dẫn và kênh liên hệ phù hợp.","Find guidance and the right support channel.","寻找使用指南及合适的支持渠道。")},
      ].map(item => <Link href="/tro-giup" key={item.title}><item.icon size={26} /><h3>{item.title}</h3><p>{item.text}</p><span>{c("Xem hướng dẫn", "Read the guide", "查看指南")}<ArrowRight size={17} /></span></Link>)}</div></section>
      <NewsFeed compact />
      <ReviewsCarousel />
      <section data-reveal id="download" className={styles.appDownload} aria-labelledby="app-download-heading">
        <div className={styles.appDownloadCopy}><span className={styles.downloadEyebrow}><Smartphone size={16} />{c("TXE PRO trên điện thoại", "TXE PRO on your phone", "手机上的 TXE PRO")}</span>
          <h2 id="app-download-heading">{c("Tải ứng dụng TXE PRO", "Get the TXE PRO app", "下载 TXE PRO 应用")}</h2>
          <p>{c("Tìm xe, đăng xe và theo dõi hành trình ngay trên điện thoại. Một tài khoản dành cho cả khách hàng và tài xế.", "Find vehicles, post availability and follow journeys on your phone. One account for customers and drivers.", "在手机上找车、发布空车并跟踪行程。一个账户，适用于客户与司机。")}</p>
          <AppStoreLinks />
          <div className={styles.appPerks}><span><Check size={15} />{c("Cùng tài khoản với website", "Same account as the website", "与网站共用账户")}</span>
            <span><Check size={15} />{c("Dành cho Android và iOS", "For Android and iOS", "适用于 Android 和 iOS")}</span></div>
        </div>
      </section>
    </main>
  );
}
