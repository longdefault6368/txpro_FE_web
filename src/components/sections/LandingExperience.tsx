"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, ArrowRight, Check, MapPin, Navigation,
  Truck, Package, Car, Snowflake, Container, ShieldCheck, Radio, MessageCircle,
  CalendarDays, Smartphone, Route, CircleHelp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./LandingExperience.module.css";
import HeroShowcase from "./HeroShowcase";
import NewsFeed from "@/components/news/NewsFeed";
import useLandingMotion from "@/hooks/useLandingMotion";
import HomePostingForm from "./HomePostingForm";
import AppStoreLinks from "@/components/common/AppStoreLinks";
import CommunityShowcase from "./CommunityShowcase";
import HomeQuickActions from "./HomeQuickActions";
import AppFeaturePreview from "./AppFeaturePreview";

export default function LandingExperience() {
  const landingRef = useRef<HTMLElement>(null);
  useLandingMotion(landingRef);
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [role, setRole] = useState<"shipper" | "driver">("shipper");
  const [feature, setFeature] = useState(0);
  const shipper = role === "shipper";
  const benefits = shipper ? [
    c("Chọn xe theo nhu cầu của bạn", "Choose the right vehicle", "选择合适的车辆"),
    c("Xem giá trước khi đặt xe", "Review prices before booking", "预订前查看价格"),
    c("Theo dõi hành trình trên bản đồ", "Follow the journey on the map", "在地图上跟踪行程"),
  ] : [
    c("Đăng xe trống theo lịch của bạn", "Post availability on your schedule", "按您的时间发布空车信息"),
    c("Nhận gợi ý đơn phù hợp", "Discover matching requests", "获取匹配订单推荐"),
    c("Quản lý phương tiện cùng một nơi", "Manage vehicles in one place", "集中管理车辆"),
  ];
  const features = [
    { icon: Radio, title: c("Tìm xe phù hợp", "Find your match", "查找合适车辆"), text: c("Chọn loại phương tiện, điểm nhận và điểm trả. Xem các tin xe phù hợp với nhu cầu của bạn.", "Select a vehicle type and route, then explore matching vehicle listings.", "选择车型和路线，浏览符合需求的车辆信息。") },
    { icon: Navigation, title: c("Theo dõi hành trình", "Follow the journey", "跟踪行程"), text: c("Xem vị trí xe và trạng thái chuyến đi trên bản đồ, kèm thời điểm GPS được cập nhật.", "See the vehicle location and trip status on the map, with GPS update timestamps.", "在地图上查看车辆位置、行程状态及GPS更新时间。") },
    { icon: MessageCircle, title: c("Kết nối thuận tiện", "Stay connected", "便捷联系"), text: c("Nhắn tin, gửi hình ảnh và liên hệ với đối tác ngay trong hành trình.", "Message, share images and contact your trip partner along the way.", "行程中可发送消息、分享图片并联系对方。") },
  ];
  return (
    <main ref={landingRef} className={styles.landing}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span />{c("Kết nối mọi hành trình", "Every journey, connected", "连接每一段旅程")}</div>
            <h1>{c("Đúng xe.", "Right vehicle.", "合适的车。")}<br />{c("Đúng hành trình.", "Right journey.", "合适的旅程。")}<br /><em>{c("Cùng TXE PRO.", "With TXE PRO.", "尽在 TXE PRO。")}</em></h1>
            <p>{c("Từ chuyến đi cá nhân đến vận chuyển hàng hóa. Kết nối chủ hàng và tài xế, chủ động lựa chọn và an tâm trên từng chặng đường.", "From personal journeys to moving goods. Connect with drivers, choose what works for you and stay informed along the way.", "从个人出行到货物运输。连接货主与司机，自主选择，随时了解行程。")}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/chu-hang/form-tao-don">{c("Tôi cần tìm xe", "Find a vehicle", "我要找车")}<ArrowUpRight size={19} /></Link>
              <Link className={styles.secondary} href="/tai-xe/dang-tin">{c("Đăng xe trống", "Post availability", "发布空车")}<ArrowRight size={18} /></Link>
            </div>
            <div className={styles.heroFoot}><ShieldCheck size={18} />{c("Thông tin rõ ràng", "Clear information", "信息清晰")}<i /><Route size={18} />{c("Hành trình chủ động", "Your journey, your choice", "自主安排行程")}</div>
          </div>
          <HeroShowcase />
        </div>
        <div className={styles.heroStrip}><a href="#vehicles">{c("Khám phá TXE PRO", "Explore TXE PRO", "探索 TXE PRO")}<ArrowDown size={17} /></a></div>
      </section>
      <HomePostingForm />
      <CommunityShowcase />
      <HomeQuickActions />
      <section data-reveal id="vehicles" className={styles.vehicles}>
        <div className={styles.sectionIntro}><span className={styles.kicker}>{c("Đa dạng phương tiện", "Vehicles for your plans", "多样车型")}</span><h2>{c("Mỗi nhu cầu, một lựa chọn.", "A vehicle for every need.", "满足不同需求的选择。")}</h2></div>
        <div className={styles.vehicleRow}>{[
          {asset:"motorcycle", label:c("Xe máy","Motorcycle","摩托车")}, {asset:"car",label:c("Ô tô","Car","汽车")}, {asset:"truck",label:c("Xe tải","Truck","货车")}, {asset:"refrigerated",label:c("Xe đông lạnh","Refrigerated","冷藏车")}, {asset:"container",label:"Container"}, {asset:"crane",label:c("Xe chuyên dụng","Specialist vehicles","专用车")},
        ].map(item => <Link href="/chu-hang/form-tao-don" key={item.label}><div className={styles.vehicleImage}><Image src={"/images/vehicles/" + item.asset + ".png"} alt={item.label} width={280} height={190} sizes="(max-width: 760px) 40vw, 180px" /></div><span>{item.label}</span></Link>)}</div>
      </section>
      <section data-reveal id="for-you" className={styles.audience}>
        <div className={styles.audienceHeading}><div><span className={styles.kicker}>{c("Dành riêng cho bạn", "Built around you", "为您而设计")}</span><h2>{c("Hai vai trò.", "Two roles.", "两种角色。")}<br />{c("Một kết nối tốt hơn.", "One better connection.", "更好的连接。")}</h2></div><p>{c("Bạn đang tìm một chiếc xe phù hợp, hay một hành trình tiếp theo? Bắt đầu theo cách của bạn.", "Looking for the right vehicle or your next trip? Start on your terms.", "您在寻找合适车辆还是下一段行程？从您的需求出发。")}</p></div>
        <div className={styles.roleTabs} role="group" aria-label={c("Chọn vai trò", "Choose role", "选择角色")}><button aria-pressed={shipper} onClick={() => setRole("shipper")} className={shipper ? styles.activeRole : ""}><Package size={20} />{c("Dành cho chủ hàng", "For shippers", "货主")}</button><button aria-pressed={!shipper} onClick={() => setRole("driver")} className={!shipper ? styles.activeRole : ""}><Truck size={20} />{c("Dành cho tài xế", "For drivers", "司机")}</button></div>
        <div className={styles.audienceBody}><div className={styles.roleVisual + " " + (shipper ? styles.shipperVisual : styles.driverVisual)}><Image key={role} src={shipper ? "/images/home/shipper-cargo.png" : "/splash1.png"} alt={shipper ? c("Kiện hàng sẵn sàng vận chuyển", "Goods ready for transport", "待运输货物") : c("Xe tải TXE PRO", "TXE PRO truck", "TXE PRO 货车")} fill sizes="(max-width: 760px) 100vw, 50vw" className={styles.brandArt} /><div className={styles.roleVisualCaption}><span>TXE PRO / {shipper ? "SHIPPER" : "DRIVER"}</span><strong>{shipper ? c("Bạn chọn hành trình.", "Your journey.", "您的旅程。") : c("Bạn làm chủ lịch xe.", "Your schedule.", "您的时间安排。")}<br />{c("Chúng tôi kết nối.", "We make the connection.", "我们来连接。")}</strong></div></div><div className={styles.roleContent}><span className={styles.kicker}>{shipper ? c("Tìm xe dễ dàng hơn", "Make finding a vehicle easier", "更轻松地找车") : c("Chủ động từng chuyến xe", "Take charge of your next trip", "自主安排每段行程")}</span><h3>{shipper ? c("Từ nhu cầu đến hành trình, rõ ràng từng bước.", "From request to journey, clarity at every step.", "从需求到行程，每一步都清晰。") : c("Xe sẵn sàng. Cơ hội mới đang chờ.", "Vehicle ready. Discover your next opportunity.", "车辆就绪，探索新机会。")}</h3><ul>{benefits.map(text => <li key={text}><span><Check size={16} /></span>{text}</li>)}</ul><Link className={styles.primary} href={shipper ? "/chu-hang/form-tao-don" : "/tai-xe/dang-tin"}>{c("Bắt đầu với TXE PRO", "Get started", "立即开始")}<ArrowUpRight size={19} /></Link></div></div>
      </section>
      <section data-reveal id="features" className={styles.experience}>
        <div className={styles.experienceCopy}><span className={styles.kicker}>{c("Trải nghiệm TXE PRO", "The TXE PRO experience", "TXE PRO 体验")}</span>
          <h2>{c("Không chỉ tìm xe.", "More than a match.", "不止于找车。")}<br />{c("Đồng hành cả chuyến đi.", "Connected all the way.", "一路相伴。")}</h2>
          <div className={styles.featureList}>{features.map((item, index) => <button type="button" key={item.title} aria-pressed={feature === index} aria-controls="experience-illustration"
            onClick={() => setFeature(index)} className={feature === index ? styles.selectedFeature : ""}>
            <item.icon size={22} /><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowUpRight size={19} />
          </button>)}</div>
        </div>
        <div id="experience-illustration"><AppFeaturePreview feature={feature} title={features[feature].title} description={features[feature].text} /></div>
      </section>
      <section data-reveal id="pricing" className={styles.trust}><div><ShieldCheck size={33} /><h2>{c("Rõ ràng để an tâm.", "Clarity builds confidence.", "清晰，才能安心。")}</h2><p>{c("Xem thông tin phương tiện và chi phí trước khi xác nhận. Quyền lợi, voucher và ký quỹ được áp dụng theo loại phương tiện và điều kiện của từng chuyến.", "Review vehicle details and costs before confirming. Voucher and deposit terms depend on the vehicle and trip conditions.", "确认前查看车辆信息及费用。优惠券和保证金规则依车型及行程条件而定。")}</p></div><Link href="/thong-tin/dieu-khoan-su-dung">{c("Tìm hiểu điều khoản", "Explore the terms", "了解条款")}<ArrowUpRight size={19} /></Link></section>
      <section data-reveal className={styles.guides}><div className={styles.audienceHeading}><div><span className={styles.kicker}>{c("Cẩm nang sử dụng", "Make the most of TXE PRO", "使用指南")}</span><h2>{c("Bắt đầu thật tự tin.", "Start with confidence.", "安心开始。")}</h2></div><Link href="/tro-giup">{c("Trung tâm trợ giúp", "Help center", "帮助中心")}<ArrowUpRight size={18} /></Link></div><div className={styles.guideGrid}>{[
        {icon:Package,title:c("Tìm chuyến xe đầu tiên","Find your first vehicle","首次找车"),text:c("Những bước cần biết khi tìm và chọn tài xế.","What to know before choosing a driver.","选择司机前需要了解的事项。")},
        {icon:CalendarDays,title:c("Chủ động lịch xe trống","Plan your availability","安排空车时间"),text:c("Tìm hiểu đăng tin và lịch đăng tin tự động.","Learn about listings and automatic schedules.","了解发布信息及自动发布安排。")},
        {icon:CircleHelp,title:c("Cần hỗ trợ trên hành trình?","Need help on your trip?","行程中需要帮助？"),text:c("Tìm hướng dẫn và kênh liên hệ phù hợp.","Find guidance and the right support channel.","寻找使用指南及合适的支持渠道。")},
      ].map(item => <Link href="/tro-giup" key={item.title}><item.icon size={26} /><h3>{item.title}</h3><p>{item.text}</p><span>{c("Xem hướng dẫn", "Read the guide", "查看指南")}<ArrowRight size={17} /></span></Link>)}</div></section>
      <NewsFeed compact />
      <section data-reveal id="download" className={styles.appDownload} aria-labelledby="app-download-heading">
        <div className={styles.appDownloadCopy}><span className={styles.downloadEyebrow}><Smartphone size={16} />{c("TXE PRO trên điện thoại", "TXE PRO on your phone", "手机上的 TXE PRO")}</span>
          <h2 id="app-download-heading">{c("Tải ứng dụng TXE PRO", "Get the TXE PRO app", "下载 TXE PRO 应用")}</h2>
          <p>{c("Tìm xe, đăng xe và theo dõi hành trình ngay trên điện thoại. Một tài khoản dành cho cả chủ hàng và tài xế.", "Find vehicles, post availability and follow journeys on your phone. One account for shippers and drivers.", "在手机上找车、发布空车并跟踪行程。一个账户，适用于货主与司机。")}</p>
          <AppStoreLinks />
          <div className={styles.appPerks}><span><Check size={15} />{c("Cùng tài khoản với website", "Same account as the website", "与网站共用账户")}</span>
            <span><Check size={15} />{c("Dành cho Android và iOS", "For Android and iOS", "适用于 Android 和 iOS")}</span></div>
        </div>
        <div className={styles.appDownloadArt} aria-hidden="true">
          <div className={styles.appPhone}><div className={styles.phoneCamera} /><Image src="/logo.png" width={66} height={66} alt="" /><strong>TXE PRO</strong>
            <div className={styles.phoneMap}><MapArtwork /></div>
            <div className={styles.phoneServices}><span><Package size={18} /></span><span><Truck size={18} /></span><span><Navigation size={18} /></span></div>
          </div>
          <div className={styles.appArtTag}><span /><Smartphone size={16} />{c("Mọi hành trình, trong tầm tay", "Every journey, at hand", "每段行程，尽在掌握")}</div>
        </div>
      </section>
    </main>
  );
}
function MapArtwork() {
  return <svg className={styles.mapArtwork} viewBox="0 0 600 500" fill="none" aria-hidden="true"><rect width="600" height="500" fill="#e9eff0" /><path d="M0 75L160 0H290L190 150L25 210Z M365 250L520 165L600 190V410L480 500H340Z" fill="#d5e6db" /><path d="M370 -20C270 90 450 140 337 245S280 400 410 520" stroke="#b5d9e9" strokeWidth="38" /><g stroke="#fff" strokeWidth="13"><path d="M-20 130L620 350M-20 350L620 115M100 -20L250 520M470 -20L125 520M-20 440L620 430M0 40L600 50" /><path d="M-20 240L620 245M300 -20L580 520" strokeWidth="7" /></g><path d="M135 360L196 276L290 245L352 167L465 200" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /><path d="M135 360L196 276L290 245L352 167L465 200" stroke="#136dec" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="135" cy="360" r="10" fill="#136dec" stroke="#fff" strokeWidth="5" /><circle cx="465" cy="200" r="10" fill="#16a36d" stroke="#fff" strokeWidth="5" /></svg>;
}
