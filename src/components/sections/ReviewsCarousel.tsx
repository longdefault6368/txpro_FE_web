"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareQuote, Package, Truck, Quote, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getHomeReviewExamples } from "@/lib/home-review-examples";
import { communitySlideMetrics, communitySlidePage, communitySlideTarget, type SlideMetrics } from "@/utils/community-slider";
import s from "./ReviewsCarousel.module.css";
export default function ReviewsCarousel() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const cards = getHomeReviewExamples(language);
  const track = useRef<HTMLDivElement>(null);
  const metrics = useRef<SlideMetrics>({ stride: 1, visible: 3, pages: 2, maxScroll: 0 });
  const [page, setPage] = useState(0), [pages, setPages] = useState(2);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const first = element.children[0] as HTMLElement | undefined;
      const second = element.children[1] as HTMLElement | undefined;
      const stride = first && second ? second.offsetLeft - first.offsetLeft : element.clientWidth;
      metrics.current = communitySlideMetrics(element.clientWidth, element.scrollWidth, stride, cards.length);
      setPages(metrics.current.pages);
      setPage(communitySlidePage(element.scrollLeft, metrics.current));
    };
    const onScroll = () => setPage(communitySlidePage(element.scrollLeft, metrics.current));
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    element.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); element.removeEventListener("scroll", onScroll); window.removeEventListener("resize", measure); };
  }, [cards.length]);
  function go(next: number) {
    track.current?.scrollTo({ left: communitySlideTarget(next, metrics.current),
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth" });
  }
  return <section id="reviews" data-reveal className={s.section} aria-labelledby="reviews-heading">
    <div className={s.heading}>
      <div><span className={s.eyebrow}><MessageSquareQuote size={18} aria-hidden="true" />{c("Review & đánh giá", "Reviews & perspectives", "评价与体验")}</span>
        <h2 id="reviews-heading">{c("Góc nhìn từ mỗi hành trình.", "A perspective for every journey.", "每段行程，不同视角。")}</h2>
        <p>{c("Từ tìm xe đến giao nhận, những chi tiết làm nên một trải nghiệm rõ ràng hơn.", "From finding a vehicle to the handover, the details that make a journey clearer.", "从找车到交接，让行程更清楚的细节。")}</p>
        <span className={s.sampleLabel}>{c("Nội dung tham khảo", "Illustrative examples", "参考内容")}</span>
      </div>
      <div className={s.controls}>
        <button type="button" onClick={() => go(page - 1)} disabled={page === 0} aria-label={c("Xem đánh giá trước", "Previous reviews", "上一组")}><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => go(page + 1)} disabled={page >= pages - 1} aria-label={c("Xem đánh giá tiếp", "Next reviews", "下一组")}><ChevronRight size={20} /></button>
      </div>
    </div>
    <div ref={track} className={s.track} tabIndex={0} role="region" aria-roledescription="carousel"
      aria-label={c("Các nhận xét tham khảo", "Illustrative review examples", "参考评价")}
      onKeyDown={event => {
        const target = event.key === "ArrowRight" ? page + 1 : event.key === "ArrowLeft" ? page - 1 : event.key === "Home" ? 0 : event.key === "End" ? pages - 1 : null;
        if (target !== null) { event.preventDefault(); go(target); }
      }}>
      {cards.map((card, index) => { const Icon = card.role === "driver" ? Truck : Package;
        return <article key={card.id} className={s.card} aria-label={c("Nhận xét mẫu ", "Example ", "示例 ") + (index + 1)}>
          <div className={s.cardTop}><div className={s.stars} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} fill="currentColor" />)}</div><Quote size={26} className={s.quoteIcon} aria-hidden="true" /></div>
          <blockquote>{card.quote}</blockquote>
          <div className={s.author}><span className={s.avatar}><Icon size={22} aria-hidden="true" /></span><div><strong>{card.role === "driver" ? c("Tài xế", "Driver", "司机") : c("Chủ hàng", "Shipper", "货主")}</strong><span>{card.context}</span></div></div>
        </article>;
      })}
    </div>
    <div className={s.dots} aria-label={c("Chọn trang đánh giá", "Choose review page", "选择评价页")}>{Array.from({ length: pages }, (_, index) =>
      <button type="button" key={index} aria-current={page === index ? "true" : undefined} aria-label={c("Trang ", "Page ", "第 ") + (index + 1)} onClick={() => go(index)} />)}</div>
  </section>;
}
