"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, Navigation, Package, Truck, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import s from "./HomeQuickActions.module.css";

export default function HomeQuickActions() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const mainActions = [
    { href: "/chu-hang/form-tao-don", icon: Package, audience: c("Dành cho chủ hàng", "For shippers", "货主服务"), title: c("Đăng tìm xe", "Find a vehicle", "发布找车需求"),
      text: c("Chọn lộ trình, thời gian và phương tiện phù hợp cho chuyến đi của bạn.", "Choose a route, time and suitable vehicle for your journey.", "为您的行程选择路线、时间及合适车型。"),
      action: c("Bắt đầu tìm xe", "Start searching", "开始找车"), image: "/images/catalog/vehicle_picker_small_truck.webp", theme: s.shipper },
    { href: "/tai-xe/dang-tin", icon: Truck, audience: c("Dành cho tài xế", "For drivers", "司机服务"), title: c("Đăng xe trống", "Post availability", "发布空车"),
      text: c("Chủ động lịch xe, tuyến đường và giá chuyến đi theo phương tiện của bạn.", "Set your vehicle availability, route and proposed trip price.", "根据您的车辆设置空车时间、路线及行程报价。"),
      action: c("Đăng lịch xe của tôi", "Post my availability", "发布我的空车"), image: "/images/catalog/vehicle_picker_heavy_truck.webp", theme: s.driver },
  ];
  const tools = [
    { href: "/don-cua-ban", icon: CalendarDays, title: c("Tin/đơn của tôi", "My listings & trips", "我的信息与订单"), text: c("Xem tin đã đăng và cập nhật trạng thái các chuyến đi.", "View your listings and check the latest trip status.", "查看已发布信息及最新行程状态。") },
    { href: "/tracking", icon: Navigation, title: c("Tra cứu hành trình", "Track a journey", "查询行程"), text: c("Mở công cụ tra cứu hành trình trên bản đồ TXE PRO.", "Open the TXE PRO journey tracking tool.", "打开 TXE PRO 地图行程查询工具。") },
  ];
  return <section id="quick-actions" data-reveal className={s.section} aria-labelledby="quick-actions-heading">
    <div className={s.heading}><div><span className={s.eyebrow}><Zap size={16} />{c("TXE PRO trên trình duyệt", "TXE PRO in your browser", "浏览器上的 TXE PRO")}</span>
      <h2 id="quick-actions-heading">{c("Bạn muốn làm gì hôm nay?", "What’s your next move?", "今天想做什么？")}</h2>
      <p>{c("Cùng tài khoản với ứng dụng. Chọn tác vụ để bắt đầu ngay trên website.", "Use your existing app account. Choose an action to get started on the web.", "使用现有应用账户，选择任务即可在网站开始操作。")}</p></div>
      <span className={s.headingMark} aria-hidden="true"><Package size={25} /><span /><Truck size={25} /></span>
    </div>
    <div className={s.grid}>{mainActions.map(item => <Link key={item.href} href={item.href} className={s.mainCard + " " + item.theme}>
      <div className={s.topline}><span className={s.icon}><item.icon size={23} /></span><span className={s.audience}>{item.audience}</span></div>
      <div className={s.mainBody}><div className={s.copy}><h3>{item.title}</h3><p>{item.text}</p></div>
        <div className={s.art} aria-hidden="true"><Image src={item.image} alt="" width={250} height={165} sizes="(max-width: 650px) 35vw, 210px" /></div></div>
      <div className={s.cardFooter}><span>{item.action}</span><ArrowUpRight size={19} /></div>
    </Link>)}</div>
    <div className={s.tools}>{tools.map(item => <Link key={item.href} href={item.href} className={s.toolCard}>
      <span className={s.toolIcon}><item.icon size={24} /></span><div className={s.toolCopy}><h3>{item.title}</h3><p>{item.text}</p></div><span className={s.toolArrow}><ArrowUpRight size={18} /></span>
    </Link>)}</div>
  </section>;
}
