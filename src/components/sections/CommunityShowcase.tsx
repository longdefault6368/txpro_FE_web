"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, LogIn, MapPin, Package, Truck, UserPlus, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { PickerDialog } from "@/components/posting/CatalogPicker";
import { getCommunityExamples, type CommunityCardProfile, type CommunityDemoRole } from "@/lib/community-examples";
import { communitySlideMetrics, communitySlidePage, communitySlideTarget, type SlideMetrics } from "@/utils/community-slider";
import s from "./CommunityShowcase.module.css";

export default function CommunityShowcase() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [role, setRole] = useState<CommunityDemoRole>("chu-hang");
  const [selected, setSelected] = useState<CommunityCardProfile | null>(null);
  const [page, setPage] = useState(0), [pages, setPages] = useState(2);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]), track = useRef<HTMLDivElement>(null);
  const metrics = useRef<SlideMetrics>({ stride: 1, visible: 3, pages: 2, maxScroll: 0 });
  const roles = ["chu-hang", "tai-xe"] as const;
  const driver = role === "tai-xe";
  const cards = getCommunityExamples(role, language);
  const roleName = driver ? c("Tài xế", "Driver", "司机") : c("Chủ hàng", "Shipper", "货主");
  const nextPath = driver ? "/chu-hang/form-tao-don" : "/tai-xe/dang-tin";
  const loginPath = "/login?next=" + encodeURIComponent(nextPath);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const first = element.children[0] as HTMLElement | undefined, second = element.children[1] as HTMLElement | undefined;
      if (!first) return;
      metrics.current = communitySlideMetrics(element.clientWidth, element.scrollWidth, second ? second.offsetLeft - first.offsetLeft : first.offsetWidth, cards.length);
      setPages(metrics.current.pages); setPage(communitySlidePage(element.scrollLeft, metrics.current));
    };
    element.scrollTo({ left: 0, behavior: "instant" }); setPage(0); measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(element); window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [role, language, cards.length]);
  function move(to: number) {
    const element = track.current; if (!element) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: communitySlideTarget(to, metrics.current), behavior: reduced ? "instant" : "smooth" });
  }
  function changeRole(next: CommunityDemoRole) { if (next !== role) { setSelected(null); setPage(0); setRole(next); } }
  return <section id="community" data-reveal className={s.section} aria-labelledby="community-heading">
    <div className={s.heading}>
      <div><span className={s.eyebrow}><Users size={17} />{c("Kết nối cùng TXE PRO", "Connect with TXE PRO", "与 TXE PRO 连接")}</span>
        <h2 id="community-heading">{c("Có nhu cầu. Có người đồng hành.", "Your next connection starts here.", "需求与同行，在这里相遇。")}</h2>
        <p>{c("Từ nhu cầu vận chuyển đến những tuyến xe đa dạng. Khám phá các tình huống kết nối trên TXE PRO.", "From transport needs to a variety of routes. Explore ways to connect on TXE PRO.", "从运输需求到多样路线，了解 TXE PRO 的连接场景。")}</p>
      </div>
      <Link href="/register" className={s.join}>{c("Tham gia ngay", "Join TXE PRO", "立即加入")}<ArrowUpRight size={18} /></Link>
    </div>
    <div className={s.board}>
    <div className={s.toolbar}>
      <div className={s.tabs} role="tablist" aria-label={c("Chủ hàng và tài xế", "Shippers and drivers", "货主与司机")}>
        {roles.map((value, index) => <button key={value} ref={node => { tabs.current[index] = node; }} id={"community-tab-" + value} type="button" role="tab"
          aria-selected={role === value} aria-controls="community-panel" tabIndex={role === value ? 0 : -1} onClick={() => changeRole(value)}
          onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
            changeRole(roles[next]); tabs.current[next]?.focus();
          }}>
          {value === "chu-hang" ? <Package size={19} /> : <Truck size={19} />}{value === "chu-hang" ? c("Chủ hàng", "Shippers", "货主") : c("Tài xế", "Drivers", "司机")}
        </button>)}
      </div>
      <div className={s.controls}>
        <button type="button" onClick={() => move(page - 1)} disabled={page === 0} aria-label={c("Slide trước", "Previous slide", "上一页")} aria-controls="community-slides"><ChevronLeft size={21} /></button>
        <button type="button" onClick={() => move(page + 1)} disabled={page >= pages - 1} aria-label={c("Slide tiếp theo", "Next slide", "下一页")} aria-controls="community-slides"><ChevronRight size={21} /></button>
      </div>
    </div>
    <div id="community-panel" role="tabpanel" aria-labelledby={"community-tab-" + role} className={s.panel}>
      <div id="community-slides" ref={track} className={s.track} role="region" aria-roledescription="carousel" aria-label={c("Kết nối chủ hàng và tài xế", "Shipper and driver connections", "货主与司机连接")}
        onScroll={() => { if (track.current) setPage(communitySlidePage(track.current.scrollLeft, metrics.current)); }}>
        {cards.map((item, index) => <article key={item.id} className={s.card} role="group" aria-roledescription="slide" aria-label={(index + 1) + " / " + cards.length}>
          <div className={s.visual}><span className={s.roleLabel}>{driver ? <Truck size={12} /> : <Package size={12} />}{roleName}</span>
            <Image src={item.image} alt="" width={300} height={170} sizes="(max-width: 650px) 82vw, (max-width: 1000px) 45vw, 365px" />
            <span className={s.specialty}>{item.specialty}</span></div>
          <div className={s.content}>
            <div className={s.identity}><span className={s.avatar} aria-hidden="true">{driver ? item.displayName.split(" ").slice(-2).map(word => word[0]).join("") : item.displayName.split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><h3 className={s.title}>{item.displayName}</h3><span>{roleName}</span></div></div>
            <div className={s.route}><span><MapPin size={15} />{item.region}</span><ArrowRight size={15} /><span>{item.destination}</span></div>
            <p className={s.intro}>{item.introduction}</p>
            <button type="button" className={s.cardAction} onClick={() => setSelected(item)} aria-label={c("Kết nối với ", "Connect with ", "联系 ") + item.displayName}>
              <span>{c("Khám phá kết nối", "Explore connections", "了解连接")}</span><ArrowUpRight size={17} />
            </button>
          </div>
        </article>)}
      </div>
      <div className={s.pagination} aria-label={c("Chọn trang slide", "Select a slide page", "选择展示页")}>{Array.from({ length: pages }, (_, index) => <button key={index} type="button" aria-label={c("Trang ", "Page ", "第 ") + (index + 1)} aria-current={index === page ? "true" : undefined} onClick={() => move(index)}><span /></button>)}</div>
    </div>
    <div className={s.footer}><p>{c("Tìm xe hoặc đăng xe trống theo nhu cầu của riêng bạn.", "Find a vehicle or post availability for your own needs.", "按您的需求找车或发布空车。")}</p><Link href={loginPath}>{c("Bắt đầu kết nối", "Start connecting", "开始连接")}<ArrowRight size={17} /></Link></div>
    </div>
    {selected && <PickerDialog title={c("Bắt đầu cùng TXE PRO", "Get started with TXE PRO", "开始使用 TXE PRO")} onClose={() => setSelected(null)} icon={<Users size={23} />}>
      <p className={s.authIntro}>{c("Đăng nhập hoặc tạo tài khoản để tìm xe, đăng xe trống và kết nối theo nhu cầu của bạn.", "Sign in or create an account to find vehicles, post availability and connect for your own needs.", "登录或创建账户，即可找车、发布空车并建立连接。")}</p>
      <div className={s.authActions}><Link href={loginPath} className={s.login}><LogIn size={19} />{c("Đăng nhập", "Sign in", "登录")}</Link><Link href="/register" className={s.register}><UserPlus size={19} />{c("Tạo tài khoản", "Create account", "创建账户")}</Link></div>
      <p className={s.demoNote}>{c("Nội dung giới thiệu, không phải tài khoản hay tin xe đang mở. Hãy đăng nhập để tìm xe hoặc đăng tin theo nhu cầu thực tế.", "Introductory content, not a real account or an open listing. Sign in to search or post for your actual needs.", "此为服务介绍，并非真实账户或空车信息。请登录后按实际需求找车或发布信息。")}</p>
    </PickerDialog>}
  </section>;
}
