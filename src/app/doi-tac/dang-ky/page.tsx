import RegisterPage from '@/app/register/page';
import { AffiliateAuthProvider } from '@/components/auth/AuthAudienceContext';
export const metadata = { title: 'Đăng ký đối tác | TXE PRO Affiliate', robots: { index: false, follow: false } };
export default function Page() {
  return <AffiliateAuthProvider><RegisterPage /></AffiliateAuthProvider>;
}
