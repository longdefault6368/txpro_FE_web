import { publicPageMetadata } from "@/lib/site-seo";

const pages: Record<string, { title: string; description: string }> = {
  "gioi-thieu": {
    title: "Giới thiệu TXE PRO",
    description: "TXE PRO kết nối khách hàng có nhu cầu tìm xe với tài xế có xe trống theo tuyến và lịch chạy.",
  },
  "quy-che-hoat-dong": {
    title: "Quy chế hoạt động | TXE PRO",
    description: "Quy trình đăng nhu cầu tìm xe, nhận chuyến, xác nhận trạng thái và xử lý hủy đơn trên TXE PRO.",
  },
  "huong-dan-chu-hang": {
    title: "Hướng dẫn đăng nhu cầu tìm xe | TXE PRO",
    description: "Các bước để khách hàng đăng nhu cầu, theo dõi hành trình và hoàn tất chuyến đi trên TXE PRO.",
  },
  "huong-dan-tai-xe": {
    title: "Hướng dẫn tài xế nhận chuyến | TXE PRO",
    description: "Tài xế hoàn thiện hồ sơ, đăng xe trống theo tuyến và thực hiện các chuyến đã nhận trên TXE PRO.",
  },
  "thanh-toan-ky-quy": {
    title: "Ví, voucher và ký quỹ | TXE PRO",
    description: "Thông tin về số dư, voucher và khoản ký quỹ khi khách hàng hoặc tài xế giao dịch trên TXE PRO.",
  },
  "khieu-nai-boi-thuong": {
    title: "Sự cố và hỗ trợ xử lý | TXE PRO",
    description: "Cách báo cáo sự cố chuyến đi và theo dõi hồ sơ hỗ trợ trên TXE PRO.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug] || pages["gioi-thieu"];
  return publicPageMetadata({ path: "/thong-tin/" + slug, ...page });
}

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
