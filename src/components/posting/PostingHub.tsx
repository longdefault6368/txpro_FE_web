"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, MapPin, Package, Route, Smartphone, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import s from "./PostingHub.module.css";

export default function PostingHub() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const choices = [
    {
      href: "/chu-hang/form-tao-don", theme: s.shipper, Icon: Package,
      audience: c("Dành cho chủ hàng", "For shippers", "货主服务"),
      title: c("Tôi cần tìm xe", "I need a vehicle", "我需要找车"),
      text: c("Một chuyến đi phù hợp, từ nhu cầu của bạn.", "The right journey starts with what you need.", "从您的需求出发，找到合适的行程。"),
      steps: [c("Chọn điểm nhận, điểm trả và thời gian", "Choose pickup, destination and time", "选择起点、终点及时间"), c("Tìm xe phù hợp và xác nhận đặt xe", "Find a match and confirm your booking", "查找合适车辆并确认预订")],
      action: c("Bắt đầu tìm xe", "Start searching", "开始找车"),
      primaryImage: "/images/catalog/vehicle_picker_small_truck.webp",
      secondaryImage: "/images/catalog/cargo_picker_general.webp",
      visualLabel: c("Chọn xe theo nhu cầu", "A vehicle for your needs", "按需选择车辆"), VisualIcon: Route,
    },
    {
      href: "/tai-xe/dang-tin", theme: s.driver, Icon: Truck,
      audience: c("Dành cho tài xế", "For drivers", "司机服务"),
      title: c("Tôi có xe trống", "My vehicle is available", "我有空车"),
      text: c("Chủ động lịch xe. Kết nối thêm hành trình.", "Set your availability. Connect with your next trip.", "自主安排空车时间，连接下一段行程。"),
      steps: [c("Chọn phương tiện đã đăng ký", "Choose your registered vehicle", "选择已登记的车辆"), c("Đặt lịch xe trống, tuyến đường và giá", "Set availability, route and trip price", "设置空车时间、路线及报价")],
      action: c("Đăng xe trống", "Post availability", "发布空车"),
      primaryImage: "/images/catalog/vehicle_picker_heavy_truck.webp",
      secondaryImage: "/images/catalog/vehicle_picker_car.webp",
      visualLabel: c("Lịch xe do bạn chủ động", "Your availability, your choice", "自主安排车辆时间"), VisualIcon: CalendarDays,
    },
  ];

  return <main className={s.page}>
    <section className={s.hero} aria-labelledby="posting-title">
      <div className={s.heroInner}>
        <nav className={s.breadcrumb} aria-label={c("Đường dẫn trang", "Breadcrumb", "页面路径")}><Link href="/">{c("Trang chủ", "Home", "首页")}</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{c("Đăng tin", "Post a listing", "发布信息")}</span></nav>
        <div className={s.heroGrid}>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}><span />{c("Kết nối hành trình cùng TXE PRO", "Connect your journey with TXE PRO", "与 TXE PRO 连接行程")}</span>
            <h1 id="posting-title">{c("Chuyến đi tiếp theo,", "Your next journey,", "下一段行程，")}<span>{c("bắt đầu từ đây.", "starts right here.", "从这里开始。")}</span></h1>
            <p>{c("Bạn cần tìm xe hay đang có xe trống? Chọn nhu cầu của bạn để bắt đầu ngay trên website.", "Need a vehicle or have one available? Choose what you need to get started on the web.", "需要找车，还是有空车？选择您的需求，即可在网站开始操作。")}</p>
          </div>
          <div className={s.journey} aria-hidden="true">
            <div className={s.orbit} /><div className={s.orbitSmall} />
            <div className={s.journeyTop}><span><Package size={16} />{c("Nhu cầu của bạn", "Your needs", "您的需求")}</span><span>TXE PRO</span></div>
            <div className={s.journeyRoute}><span className={s.endpoint}><MapPin size={24} /></span><span className={s.routeLine} /><span className={s.routeTruck}><Truck size={29} /></span><span className={s.routeLine} /><span className={s.endpoint}><MapPin size={24} /></span></div>
            <div className={s.journeyBottom}><span>{c("Điểm khởi hành", "Departure", "出发点")}</span><span>{c("Hành trình mới", "A new journey", "全新行程")}</span></div>
            <div className={s.journeyCaption}><Route size={16} />{c("Đúng nhu cầu. Đúng hành trình.", "Your needs. Your journey.", "匹配需求，连接行程。")}</div>
          </div>
        </div>
      </div>
    </section>

    <div className={s.content}>
      <section className={s.choices} aria-label={c("Chọn nhu cầu đăng tin", "Choose your listing type", "选择发布类型")}>
        {choices.map(item => <Link key={item.href} href={item.href} className={s.choice + " " + item.theme}>
          <div className={s.choiceTop}><span className={s.roleIcon}><item.Icon size={22} aria-hidden="true" /></span><span>{item.audience}</span><ArrowUpRight size={20} className={s.topArrow} aria-hidden="true" /></div>
          <div className={s.choiceIntro}><h2>{item.title}</h2><p>{item.text}</p></div>
          <div className={s.artwork} aria-hidden="true"><div className={s.artCircle} /><div className={s.road} />
            <Image className={s.secondaryImage} src={item.secondaryImage} alt="" width={180} height={130} sizes="(max-width: 600px) 28vw, 150px" />
            <Image className={s.primaryImage} src={item.primaryImage} alt="" width={320} height={200} sizes="(max-width: 600px) 65vw, (max-width: 900px) 35vw, 310px" />
            <span className={s.visualLabel}><item.VisualIcon size={15} />{item.visualLabel}</span>
          </div>
          <ul className={s.checklist}>{item.steps.map(step => <li key={step}><Check size={15} aria-hidden="true" />{step}</li>)}</ul>
          <div className={s.choiceAction}><span>{item.action}</span><span className={s.actionArrow}><ArrowRight size={20} aria-hidden="true" /></span></div>
        </Link>)}
      </section>

      <div className={s.accountNote}><span><Smartphone size={18} aria-hidden="true" /></span><p>{c("Dùng tài khoản TXE PRO của bạn.", "Use your TXE PRO account.", "使用您的 TXE PRO 账户。")} <span>{c("Tin đăng và đơn hàng đồng bộ với ứng dụng.", "Listings and trips stay in sync with the app.", "发布信息与订单会与应用同步。")}</span></p></div>

      <section className={s.continueSection} aria-labelledby="continue-title">
        <div className={s.continueHeading}><span className={s.sectionLabel}>{c("Tiếp tục hành trình", "Pick up where you left off", "继续您的行程")}</span><h2 id="continue-title">{c("Đã có tin hoặc đơn?", "Already have a listing or trip?", "已有发布信息或订单？")}</h2><p>{c("Xem lại tin đã đăng hoặc tìm hỗ trợ khi bạn cần.", "Revisit your listings or find help when you need it.", "查看已发布的信息，或在需要时获取帮助。")}</p></div>
        <div className={s.utilities}>
          <Link href="/don-cua-ban" className={s.utility}><span className={s.utilityIcon}><ClipboardList size={23} aria-hidden="true" /></span><div><h3>{c("Tin/đơn của tôi", "My listings & trips", "我的信息与订单")}</h3><p>{c("Quản lý tin đăng và cập nhật hành trình", "Manage listings and check your trips", "管理发布信息及查看行程")}</p></div><ArrowUpRight size={19} aria-hidden="true" /></Link>
          <Link href="/tro-giup" className={s.utility}><span className={s.utilityIcon}><CircleHelp size={23} aria-hidden="true" /></span><div><h3>{c("Bạn cần hỗ trợ?", "Need a hand?", "需要帮助？")}</h3><p>{c("Hướng dẫn sử dụng và liên hệ hỗ trợ", "Guides and contact with support", "使用指南及联系支持")}</p></div><ArrowUpRight size={19} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  </main>;
}
