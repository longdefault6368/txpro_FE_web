import LoginPage from '@/app/login/page';
import { AffiliateAuthProvider } from '@/components/auth/AuthAudienceContext';
export const metadata = { title: 'Đăng nhập đối tác | TXE PRO Affiliate', robots: { index: false, follow: false } };
export default function Page() {
  return <AffiliateAuthProvider><LoginPage /></AffiliateAuthProvider>;
}
