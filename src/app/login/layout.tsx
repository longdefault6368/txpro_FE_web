import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/login",
  title: "Đăng nhập | TXE PRO",
  description: "Đăng nhập tài khoản TXE PRO để đăng nhu cầu tìm xe, đăng xe trống và theo dõi chuyến đi.",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
