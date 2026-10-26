import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Route, Truck, MapPinned, ShieldCheck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import s from "./Auth.module.css";
export default function AuthShell({ mode, title, description, children, next }: {
 mode: "login" | "register"; title: string; description: string; children: ReactNode; next?: string | null;
}) {
 const suffix = next ? "?next=" + encodeURIComponent(next) : "";
 return <><Header /><main className={s.page}>
 <div className={s.topline}><Link href="/"><ArrowLeft size={16} />Trở về trang chủ</Link><span><ShieldCheck size={16} />Tài khoản TXE PRO</span></div>
 <div className={s.layout}>
  <aside className={s.aside}><span className={s.eyebrow}><Route size={17} />KẾT NỐI MỖI HÀNH TRÌNH</span>
   <h2>Một tài khoản.<br />Nhiều hành trình.</h2>
   <p>Tìm phương tiện phù hợp hoặc chủ động lịch xe của bạn. Bắt đầu từ một kết nối rõ ràng.</p>
   <div className={s.visual}><Image src="/images/news/chon-xe-phu-hop.webp" alt="Phương tiện trên hành trình vận chuyển" fill sizes="(max-width: 900px) 0px, 520px" priority /></div>
   <div className={s.benefits}><div><Truck size={20} /><span><strong>Chủ động lựa chọn</strong><small>Tìm xe hoặc đăng lịch xe trống.</small></span></div>
   <div><MapPinned size={20} /><span><strong>Thông tin trong tầm tay</strong><small>Quản lý đơn và theo dõi hành trình.</small></span></div></div>
   <div className={s.asideFoot}><span />Đồng hành cùng chủ hàng và tài xế</div>
  </aside>
  <section className={s.card} aria-labelledby="auth-title">
   <nav className={s.tabs} aria-label="Tài khoản"><Link href={"/login" + suffix} aria-current={mode === "login" ? "page" : undefined}>Đăng nhập</Link><Link href={"/register" + suffix} aria-current={mode === "register" ? "page" : undefined}>Tạo tài khoản</Link></nav>
   <div className={s.formHeader}><span className={s.formEyebrow}>CHÀO MỪNG ĐẾN VỚI TXE PRO</span><h1 id="auth-title">{title}</h1><p>{description}</p></div>
   {children}
   <p className={s.legal}>Tìm hiểu <Link href="/thong-tin/dieu-khoan-su-dung">Điều khoản sử dụng</Link> và <Link href="/thong-tin/chinh-sach-bao-mat">Chính sách bảo mật</Link> của TXE PRO.</p>
  </section>
 </div></main><Footer /></>;
}
