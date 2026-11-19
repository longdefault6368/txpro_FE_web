import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/chu-hang/form-tao-don",
  title: "Đăng nhu cầu tìm xe | TXE PRO",
  description: "Nhập điểm nhận, điểm trả, thời gian và loại xe. Xem các xe phù hợp và trao đổi với tài xế trên TXE PRO.",
});

export default function FindVehicleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
