import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChartNoAxesCombined, Gift, Handshake, Link2, ShieldCheck } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import s from './Auth.module.css';

export default function AffiliateAuthShell({ mode, title, description, children }: {
  mode: 'login' | 'register'; title: string; description: string; children: ReactNode;
}) {
  return <><Header /><main className={s.page}>
    <div className={s.topline}><Link href='/'><ArrowLeft size={16} />Về trang chủ</Link><span><ShieldCheck size={16} />TXE PRO Affiliate</span></div>
    <div className={s.layout}>
      <aside className={s.aside}>
        <span className={s.eyebrow}><Handshake size={19} />CHƯƠNG TRÌNH ĐỐI TÁC</span>
        <h2>Mở rộng kết nối.<br />Theo dõi giá trị.</h2>
        <p>Khu vực dành cho đối tác giới thiệu TXE PRO. Quản lý link, xem kết quả và gửi yêu cầu thanh toán trên cùng một trang.</p>
        <div className={s.benefits} style={{ marginTop: 30 }}>
          <div><Link2 size={23} /><span><strong>Link và mã giới thiệu riêng</strong><small>Chia sẻ để người mới biết đến TXE PRO.</small></span></div>
          <div><ChartNoAxesCombined size={23} /><span><strong>Kết quả rõ ràng</strong><small>Theo dõi lượt đăng ký và người đủ điều kiện.</small></span></div>
          <div><Gift size={23} /><span><strong>Quyền lợi theo chính sách</strong><small>Kiểm tra thưởng và trạng thái thanh toán.</small></span></div>
        </div>
        <div className={s.asideFoot}><span />Đăng ký, xác minh và đọc chính sách trước khi tham gia.</div>
      </aside>
      <section className={s.card} aria-labelledby='auth-title'>
        <nav className={s.tabs} aria-label='Tài khoản đối tác'>
          <Link href='/doi-tac/dang-nhap' aria-current={mode === 'login' ? 'page' : undefined}>Đăng nhập đối tác</Link>
          <Link href='/doi-tac/dang-ky' aria-current={mode === 'register' ? 'page' : undefined}>Đăng ký đối tác</Link>
        </nav>
        <div className={s.formHeader}><span className={s.formEyebrow}>TXE PRO AFFILIATE</span><h1 id='auth-title'>{title}</h1><p>{description}</p></div>
        {children}
        <p className={s.legal}>Sau khi xác thực tài khoản, bạn sẽ đọc và đồng ý chính sách tại trang đối tác. Tiền thưởng chỉ được ghi nhận khi người được giới thiệu đủ điều kiện.</p>
      </section>
    </div>
  </main><Footer /></>;
}
