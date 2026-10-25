"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, FileText, Headphones, LayoutGrid, LifeBuoy, Mail, Package, Phone, Search, ShieldAlert, Smartphone, Truck, UserRound, Wallet, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import { getHelpArticles, searchHelpArticles, type HelpCategory } from "@/lib/help-content";
import s from "./HelpCenter.module.css";

export default function HelpCenter() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const articles = useMemo(() => getHelpArticles(language), [language]);
  const results = useMemo(() => searchHelpArticles(articles, query, category), [articles, query, category]);
  const categories = [
    { id: "all", label: c("Tất cả chủ đề", "All topics", "全部主题"), Icon: LayoutGrid },
    { id: "shipper", label: c("Dành cho chủ hàng", "For shippers", "货主指南"), Icon: Package },
    { id: "driver", label: c("Dành cho tài xế", "For drivers", "司机指南"), Icon: Truck },
    { id: "wallet", label: c("Ví & voucher", "Wallet & vouchers", "钱包与优惠券"), Icon: Wallet },
    { id: "incident", label: c("Sự cố & hủy đơn", "Incidents & cancellation", "事件与取消"), Icon: ShieldAlert },
    { id: "account", label: c("Tài khoản", "Account", "账户"), Icon: UserRound },
  ] as const;
  const quickActions = [
    { href: "/chu-hang/form-tao-don", Icon: Package, title: c("Tôi cần tìm xe", "I need a vehicle", "我需要找车"), text: c("Chọn lộ trình và đặt xe phù hợp", "Choose a route and find a match", "选择路线并寻找合适车辆") },
    { href: "/tai-xe/dang-tin", Icon: Truck, title: c("Tôi muốn đăng xe", "I want to post a vehicle", "我想发布空车"), text: c("Đăng lịch xe trống của bạn", "Post your vehicle availability", "发布您的空车时间") },
    { href: "/don-cua-ban", Icon: ClipboardList, title: c("Xem tin/đơn của tôi", "My listings & trips", "我的信息与订单"), text: c("Kiểm tra tin đăng và trạng thái chuyến", "Check listings and trip status", "查看发布信息和行程状态") },
  ];
  const phone = (companyInfo.phoneSupport || companyInfo.hotline || "").trim();
  const email = (companyInfo.emailSupport || companyInfo.emailGeneral || "").trim();
  const phoneHref = /^\+?[\d\s().-]+$/.test(phone) ? "tel:" + phone.replace(/[^+\d]/g, "") : "";
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "mailto:" + email : "";
  const clearFilters = () => { setQuery(""); setCategory("all"); };

  return <main className={s.page}>
    <section className={s.hero} aria-labelledby="help-title"><div className={s.heroInner}>
      <nav className={s.breadcrumb} aria-label={c("Đường dẫn trang", "Breadcrumb", "页面路径")}><Link href="/">{c("Trang chủ", "Home", "首页")}</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{c("Trợ giúp", "Help", "帮助")}</span></nav>
      <div className={s.heroGrid}><div className={s.heroCopy}><span className={s.eyebrow}><LifeBuoy size={16} aria-hidden="true" />{c("Trung tâm trợ giúp TXE PRO", "TXE PRO help center", "TXE PRO 帮助中心")}</span>
        <h1 id="help-title">{c("Mỗi câu hỏi,", "Every question,", "每一个疑问，")}<span>{c("một hướng giải quyết.", "a way forward.", "都有解决方向。")}</span></h1>
        <p>{c("Từ tìm xe, đăng tin đến hoàn tất hành trình. Tìm hướng dẫn phù hợp hoặc gửi yêu cầu để được hỗ trợ.", "From finding a vehicle to finishing a trip. Find the right guide or send a request for support.", "从找车、发布信息到完成行程，查找合适指南或发送支持请求。")}</p>
        <div className={s.searchBox}><Search size={21} aria-hidden="true" /><label htmlFor="help-search" className={s.srOnly}>{c("Tìm trong câu hỏi và hướng dẫn", "Search questions and guides", "搜索问题和指南")}</label><input id="help-search" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={120} autoComplete="off" placeholder={c("Bạn cần tìm hiểu điều gì?", "What do you need help with?", "您需要什么帮助？")} aria-controls="help-results" />{query && <button type="button" onClick={() => setQuery("")} aria-label={c("Xóa từ khóa", "Clear search", "清除关键词")}><X size={18} /></button>}</div>
        <div className={s.keywords}><span>{c("Tìm nhanh:", "Try:", "快速搜索：")}</span>{[c("Ký quỹ", "Deposit", "保证金"), "GPS", c("Sự cố", "Incident", "事件")].map(word => <button key={word} type="button" onClick={() => { setCategory("all"); setQuery(word); }}>{word}<ArrowUpRight size={12} aria-hidden="true" /></button>)}</div>
      </div><div className={s.helpArt} aria-hidden="true"><span className={s.ring} /><span className={s.ringSmall} /><span className={s.buoy}><LifeBuoy size={74} strokeWidth={1.25} /></span><span className={s.artTop}><Package size={17} />{c("Chủ hàng", "Shippers", "货主")}</span><span className={s.artBottom}><Truck size={18} />{c("Tài xế", "Drivers", "司机")}</span><span className={s.artCaption}><Check size={14} />{c("Hướng dẫn cho hành trình của bạn", "Guidance for your journey", "为您的行程提供指引")}</span></div></div>
    </div></section>

    <div className={s.content}>
      <nav className={s.quickActions} aria-label={c("Thao tác nhanh", "Quick actions", "快捷操作")}>{quickActions.map(item => <Link key={item.href} href={item.href} className={s.quickAction}><span className={s.quickIcon}><item.Icon size={23} aria-hidden="true" /></span><div><h2>{item.title}</h2><p>{item.text}</p></div><ArrowUpRight size={18} aria-hidden="true" /></Link>)}</nav>

      <section className={s.faqSection} aria-labelledby="faq-title"><div className={s.sectionHeading}><div><span className={s.sectionLabel}>{c("Hướng dẫn theo chủ đề", "Find your answer", "按主题查找答案")}</span><h2 id="faq-title">{c("Bạn đang cần hỗ trợ gì?", "How can we help?", "您需要哪方面帮助？")}</h2></div><p>{c("Chọn chủ đề hoặc nhập từ khóa để tra cứu.", "Choose a topic or search by keyword.", "选择主题或输入关键词查询。")}</p></div>
        <div className={s.faqLayout}><aside className={s.sidebar}><div className={s.categoryList} role="group" aria-label={c("Lọc theo chủ đề", "Filter by topic", "按主题筛选")}>{categories.map(item => <button key={item.id} type="button" aria-pressed={category === item.id} aria-controls="help-results" onClick={() => setCategory(item.id)} className={category === item.id ? s.categoryActive : ""}><item.Icon size={18} aria-hidden="true" /><span>{item.label}</span><small>{item.id === "all" ? articles.length : articles.filter(article => article.category === item.id).length}</small></button>)}</div><div className={s.sidebarNote}><SmartphoneNote /><p>{c("Thêm xe và đăng tin có trên website. Lịch đăng tự động, vận hành chuyến và phản hồi sự cố tiếp tục dùng ứng dụng.", "Vehicle registration and posting are available on the web. Automatic schedules, trip operations and incident responses remain in the app.", "网站支持车辆登记与发布信息。自动计划、行程操作及事件回复请在应用内完成。")}</p></div></aside>
          <div id="help-results" className={s.results}><div className={s.resultHeading}><h3>{categories.find(item => item.id === category)?.label}</h3><span role="status" aria-live="polite" aria-atomic="true">{results.length} {c("câu hỏi", "questions", "个问题")}</span></div>
            {results.length ? <div className={s.accordion} key={category + ":" + query + ":" + language}>{results.map(article => <details key={article.id} className={s.faq}><summary><span>{article.question}</span><ChevronDown size={18} aria-hidden="true" /></summary><div className={s.answer}>{article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{article.href && <Link href={article.href}>{article.action}<ArrowRight size={15} aria-hidden="true" /></Link>}</div></details>)}</div> : <div className={s.empty}><span><Search size={30} aria-hidden="true" /></span><h3>{c("Chưa tìm thấy câu hỏi phù hợp", "No matching questions yet", "未找到匹配问题")}</h3><p>{c("Thử từ khóa ngắn hơn hoặc xem tất cả chủ đề. Bạn cũng có thể gửi yêu cầu cho bộ phận hỗ trợ.", "Try a shorter keyword or browse all topics. You can also send a support request.", "请尝试更短关键词或查看全部主题，也可发送支持请求。")}</p><button type="button" onClick={clearFilters}>{c("Xem tất cả câu hỏi", "Show all questions", "查看全部问题")}<ArrowRight size={16} aria-hidden="true" /></button></div>}
            {(query || category !== "all") && results.length > 0 && <button type="button" onClick={clearFilters} className={s.clearFilters}><X size={14} aria-hidden="true" />{c("Xóa bộ lọc và từ khóa", "Clear filters and search", "清除筛选和关键词")}</button>}
          </div>
        </div>
      </section>

      <section className={s.support} aria-labelledby="support-title"><div className={s.supportMain}><span className={s.supportIcon}><Headphones size={27} aria-hidden="true" /></span><span className={s.supportLabel}>{c("Kết nối hỗ trợ", "Connect with support", "联系支持")}</span><h2 id="support-title">{c("Vẫn cần chúng tôi hỗ trợ?", "Still need a hand?", "仍需要我们帮助？")}</h2><p>{c("Gửi nội dung qua trang liên hệ để hệ thống ghi nhận yêu cầu. Thông tin đầy đủ giúp đội ngũ hỗ trợ đối chiếu đúng tài khoản và chuyến đi.", "Use the contact page to submit a recorded request. Complete details help support identify the right account and trip.", "请通过联系页面提交请求，系统将记录。完整信息有助于支持团队核对正确账户与行程。")}</p><Link href="/thong-tin/lien-he" className={s.contactAction}>{c("Gửi yêu cầu hỗ trợ", "Send a support request", "发送支持请求")}<ArrowUpRight size={18} aria-hidden="true" /></Link>
        {(phoneHref || emailHref || companyInfo.workingHours) && <div className={s.channels}>{phoneHref && <a href={phoneHref}><Phone size={15} aria-hidden="true" /><span>{phone}</span></a>}{emailHref && <a href={emailHref}><Mail size={15} aria-hidden="true" /><span>{email}</span></a>}{companyInfo.workingHours && <span><Clock3 size={15} aria-hidden="true" />{companyInfo.workingHours}</span>}</div>}
      </div><div className={s.prepare}><div className={s.prepareTitle}><FileText size={21} aria-hidden="true" /><h3>{c("Chuẩn bị trước khi liên hệ", "Before contacting us", "联系前请准备")}</h3></div><ul>{[c("Mã đơn hoặc mã tin, nếu có", "Order or listing reference, if available", "订单号或发布编号（如有）"), c("Thời điểm và nội dung gặp lỗi", "When it happened and what went wrong", "发生时间与具体问题"), c("Ảnh màn hình hoặc bằng chứng liên quan", "Screenshots or relevant evidence", "相关截图或证据")].map(text => <li key={text}><Check size={15} aria-hidden="true" />{text}</li>)}</ul><div className={s.tripNote}><CircleHelp size={18} aria-hidden="true" /><p>{c("Đang có chuyến cần hỗ trợ? Mở đúng đơn trong ứng dụng để xem trạng thái và các thao tác đang được phép.", "Need help with a trip? Open the correct order in the app to see its current state and available actions.", "行程需要帮助？请在应用打开对应订单，查看当前状态及可用操作。")}</p></div></div></section>
    </div>
  </main>;
}

function SmartphoneNote() { return <Smartphone size={20} aria-hidden="true" />; }
