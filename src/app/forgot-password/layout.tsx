import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/forgot-password",
  title: "Đặt lại mật khẩu | TXE PRO",
  description: "Đặt lại mật khẩu tài khoản TXE PRO.",
  index: false,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
