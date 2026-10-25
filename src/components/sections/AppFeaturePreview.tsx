"use client";

import Image from "next/image";
import { ArrowLeft, ArrowUpRight, BatteryFull, CalendarDays, CheckCheck, ChevronRight, Home, MapPin, MessageCircle, Mic, Navigation, Phone, Plus, Send, Signal, Truck, UserRound, Wifi } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import s from "./AppFeaturePreview.module.css";

/** Code-native product view, not a live account, map or conversation. */
export default function AppFeaturePreview({ feature, title, description }: { feature: number; title: string; description: string }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  return <div className={s.panel}>
    <div className={s.topline}><Image src="/logo.png" width={29} height={29} alt="" /><strong>TXE PRO</strong><span>{feature === 0 ? <Truck size={18} /> : feature === 1 ? <Navigation size={18} /> : <MessageCircle size={18} />}</span></div>
    <div className={s.stage}>
      <div className={s.phone} role="group" aria-label={c("Giao diện ứng dụng: ", "App interface: ", "应用界面：") + title}>
        <div className={s.screen} key={feature}>
          <div className={s.status} aria-hidden="true"><span>9:41</span><span className={s.camera} /><span><Signal size={12} /><Wifi size={12} /><BatteryFull size={15} /></span></div>
          <div className={s.appHeader}><ArrowLeft size={17} /><strong>{feature === 0 ? c("Tìm xe ngay", "Find a vehicle", "立即找车") : feature === 1 ? c("Hành trình của bạn", "Your journey", "您的行程") : c("Tin nhắn", "Messages", "消息")}</strong><span>{feature === 0 ? <Truck size={17} /> : feature === 1 ? <Navigation size={17} /> : <Phone size={17} />}</span></div>
          {feature === 0 ? <div className={s.search}>
            <div className={s.locationCard}><div><i /><span><small>{c("Vị trí nhận", "Pickup", "起点")}</small><strong>TP. Hồ Chí Minh</strong></span><ChevronRight size={14} /></div><div><MapPin size={14} /><span><small>{c("Vị trí trả", "Destination", "终点")}</small><strong>Đồng Nai</strong></span><ChevronRight size={14} /></div></div>
            <div className={s.time}><CalendarDays size={15} /><span>{c("Ngay bây giờ", "Now", "现在")}</span><ChevronRight size={14} /></div>
            <p className={s.sectionLabel}>{c("Loại phương tiện", "Vehicle type", "车辆类型")}</p>
            <div className={s.vehicles}>{[
              ["car", c("Ô tô", "Car", "汽车")], ["truck", c("Xe tải", "Truck", "货车")], ["motorcycle", c("Xe máy", "Motorcycle", "摩托车")],
            ].map(([asset, label]) => <div key={asset} className={asset === "truck" ? s.chosen : ""}><Image src={"/images/catalog/vehicle_picker_" + asset + ".webp"} alt="" width={74} height={52} /><span>{label}</span>{asset === "truck" && <CheckCheck size={11} />}</div>)}</div>
            <div className={s.cargo}><Image src="/images/catalog/cargo_picker_general.webp" alt="" width={34} height={34} /><span>{c("Hàng tiêu dùng", "Consumer goods", "消费品")}</span><ChevronRight size={14} /></div>
            <div className={s.primary}>{c("Tìm xe phù hợp", "Find a match", "查找合适车辆")}<ArrowUpRight size={15} /></div>
          </div> : feature === 1 ? <div className={s.tracking}>
            <div className={s.map}><JourneyMap /><div className={s.mapInstruction}><Navigation size={17} /><span>{c("Đang đến điểm nhận", "Heading to pickup", "正前往起点")}</span></div>
              <span className={s.truckPin}><Truck size={19} /></span><div className={s.mapControl}><Plus size={17} /><Navigation size={16} /></div></div>
            <div className={s.tripCard}><span className={s.handle} /><div className={s.tripStatus}><span />{c("Theo dõi hành trình", "Follow the journey", "跟踪行程")}</div>
              <div className={s.partner}><span className={s.partnerAvatar}><UserRound size={21} /></span><div><strong>{c("Tài xế của bạn", "Your driver", "您的司机")}</strong><small>{c("Xe tải · Thông tin chuyến đi", "Truck · Trip details", "货车 · 行程资料")}</small></div><span className={s.contact}><Phone size={15} /></span><span className={s.contact}><MessageCircle size={15} /></span></div>
              <div className={s.route}><MapPin size={13} /><span>TP. Hồ Chí Minh</span><ChevronRight size={13} /><span>Đồng Nai</span></div>
            </div>
          </div> : <div className={s.chat}>
            <div className={s.chatPartner}><span className={s.partnerAvatar}><UserRound size={20} /></span><div><strong>{c("Tài xế của bạn", "Your driver", "您的司机")}</strong><small>{c("Trao đổi về hành trình", "Trip conversation", "行程沟通")}</small></div></div>
            <span className={s.chatDay}>{c("Hôm nay", "Today", "今天")}</span>
            <div className={s.received}>{c("Chào bạn, mình sẽ đến điểm nhận theo lịch đã hẹn nhé.", "Hello, I’ll arrive at the agreed pickup time.", "您好，我会按约定时间到达起点。")}<small>09:40</small></div>
            <div className={s.sent}>{c("Cảm ơn anh. Tôi gửi vị trí cổng vào để dễ tìm nhé.", "Thank you. I’ll share the entrance location.", "谢谢，我会发送入口位置方便您找到。")}<small>09:41 <CheckCheck size={12} /></small></div>
            <div className={s.messageLocation}><div><JourneyMap /><MapPin size={22} /></div><span><MapPin size={13} />{c("Vị trí nhận hàng", "Pickup location", "取货位置")}</span></div>
            <div className={s.composer}><Plus size={16} /><span>{c("Nhập tin nhắn…", "Type a message…", "输入消息…")}</span><Mic size={15} /><Send size={16} /></div>
          </div>}
          {feature === 0 && <div className={s.nav} aria-hidden="true"><Home size={17} /><span className={s.navActive}><Truck size={17} /></span><MessageCircle size={17} /><UserRound size={17} /></div>}
          <span className={s.homeIndicator} aria-hidden="true" />
        </div>
      </div>
    </div>
    <div className={s.caption} key={"caption-" + feature} aria-live="polite" aria-atomic="true"><span className={s.captionIcon}>{feature === 0 ? <Truck size={20} /> : feature === 1 ? <Navigation size={20} /> : <MessageCircle size={20} />}</span><div><h3>{title}</h3><p>{description}</p></div></div>
  </div>;
}

function JourneyMap() {
  return <svg viewBox="0 0 300 330" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="330" fill="#eaf0ef" /><path d="M0 20H90L140 85L70 155H0ZM210 180L300 150V330H170Z" fill="#d5e6d9" /><path d="M225 -10C80 90 290 130 170 210S120 310 180 350" stroke="#bddce9" strokeWidth="26" /><g stroke="white" strokeWidth="10"><path d="M-10 55L310 175M-20 225L310 100M35 -10L160 350M270 -10L75 350M-10 285L320 280M-10 140H320" /></g><path d="M65 250L110 185L173 160L205 100L255 118" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" /><path d="M65 250L110 185L173 160L205 100L255 118" stroke="#136dec" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="65" cy="250" r="7" fill="#136dec" stroke="white" strokeWidth="3" /><circle cx="255" cy="118" r="7" fill="#16845f" stroke="white" strokeWidth="3" /></svg>;
}
