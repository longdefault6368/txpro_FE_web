'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Gift } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useCompanyInfo } from '@/context/CompanyInfoContext';
import { appDownloadLink } from '@/utils/app-downloads';
import { googlePlayReferralUrl, referralClipboardPayload, saveReferralCode, validReferralCode } from '@/utils/affiliate';
import { postingRequest } from '@/utils/posting-api';
import s from './Affiliate.module.css';

export default function AffiliateInvite({ code: raw }: { code: string }) {
  const code = validReferralCode(raw), { companyInfo } = useCompanyInfo();
  const [valid, setValid] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    if (!code) return;
    void postingRequest<{ code: string }>('/public/affiliate/codes/' + encodeURIComponent(code), {}, false).then(result => {
      if (!active) return;
      setValid(true);
      try { saveReferralCode(localStorage, result.code); } catch { /* The explicit URL still carries the referral. */ }
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không kiểm tra được mã giới thiệu.'); });
    return () => { active = false; };
  }, [code]);
  const android = googlePlayReferralUrl(companyInfo.googlePlayUrl, code), ios = appDownloadLink(companyInfo.appStoreUrl, 'ios');
  async function downloadIos(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!ios.available) { window.location.assign(ios.href); return; }
    try { await navigator.clipboard.writeText(referralClipboardPayload(code)); }
    catch { /* Installation still works; the page also exposes code and registration. */ }
    window.location.assign(ios.href);
  }
  return <><Header /><main className={s.page}><header className={s.hero}><div><span className={s.eyebrow}>LỜI MỜI TỪ ĐỐI TÁC TXE PRO</span><h1>Chuyến đi mới.<br />Bắt đầu cùng TXE PRO.</h1><p>Đăng ký tài xế hoặc chủ hàng bằng mã giới thiệu đã được điền sẵn.</p></div><Gift size={64} /></header>
    {error && <div className={s.error} role='alert'>{error}</div>}{notice && <div className={s.notice} role='status'>{notice}</div>}
    <section className={s.panel}><h2>Mã giới thiệu</h2><div className={s.code}>{code || 'Mã không hợp lệ'}</div>{code && !valid && !error && <p>Đang kiểm tra lời mời…</p>}
      {valid && <><div className={s.buttons}><Link className={s.primary} href={'/register?ref=' + encodeURIComponent(code)}>Đăng ký với mã này<ArrowRight size={17} /></Link><button className={s.secondary} onClick={() => void navigator.clipboard.writeText(code).then(() => setNotice('Đã sao chép mã giới thiệu.')).catch(() => setNotice('Chọn mã hiển thị ở trên để sao chép.'))}><Copy size={16} />Sao chép mã</button></div>
      <p>Đã cài TXE PRO? Mở ứng dụng để đăng ký với mã giới thiệu.</p><a className={s.secondary} href={'txepro://invite/' + encodeURIComponent(code)}>Mở ứng dụng TXE PRO</a>
      <h2 style={{ marginTop: 28 }}>Tải ứng dụng</h2><p>Với iPhone, nút tải sẽ sao chép mã TXE PRO để app điền khi đăng ký. Hãy cho phép dán mã khi iOS hỏi; không cần tài khoản dịch vụ bên ngoài.</p><div className={s.buttons}><a className={s.primary} href={android || '/thong-tin/lien-he?topic=tai-ung-dung&platform=android'}>Tải từ Google Play</a><a className={s.primary} href={ios.href} onClick={event => void downloadIos(event)}>Tải từ App Store và giữ mã</a></div>
      <p>Android nhận mã qua Google Play. iPhone cần cho phép sao chép/dán và giữ nguyên mã trong clipboard đến lúc đăng ký. Nếu không nhận được mã, bạn có thể nhập tay hoặc đăng ký trên website rồi dùng cùng tài khoản trong app.</p></>}
    </section><p>Đã có tài khoản? <Link href='/login'>Đăng nhập TXE PRO</Link></p></main><Footer /></>;
}
