import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/register",
  title: "Đăng ký | TXE PRO",
  description: "Tạo tài khoản TXE PRO để đăng nhu cầu tìm xe hoặc đăng xe trống theo tuyến.",
  index: false,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
