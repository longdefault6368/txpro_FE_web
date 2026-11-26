export const INFO_PAGE_SLUGS = [
  "gioi-thieu",
  "quy-che-hoat-dong",
  "huong-dan-chu-hang",
  "huong-dan-tai-xe",
  "thanh-toan-ky-quy",
  "khieu-nai-boi-thuong",
] as const;

export type InfoPageSlug = (typeof INFO_PAGE_SLUGS)[number];

export interface InfoPageMeta {
  title: string;
  breadcrumbLabel: string;
  description: string;
}

export const INFO_PAGES: Record<InfoPageSlug, InfoPageMeta> = {
  "gioi-thieu": {
    title: "Giới thiệu TXE PRO",
    breadcrumbLabel: "Giới thiệu TXE PRO",
    description: "TXE PRO kết nối khách hàng có nhu cầu tìm xe với tài xế có xe trống theo tuyến và lịch chạy.",
  },
  "quy-che-hoat-dong": {
    title: "Quy chế hoạt động | TXE PRO",
    breadcrumbLabel: "Quy chế hoạt động",
    description: "Quy trình đăng nhu cầu tìm xe, nhận chuyến, xác nhận trạng thái và xử lý hủy đơn trên TXE PRO.",
  },
  "huong-dan-chu-hang": {
    title: "Hướng dẫn đăng nhu cầu tìm xe | TXE PRO",
    breadcrumbLabel: "Hướng dẫn đăng nhu cầu tìm xe",
    description: "Các bước để khách hàng đăng nhu cầu, theo dõi hành trình và hoàn tất chuyến đi trên TXE PRO.",
  },
  "huong-dan-tai-xe": {
    title: "Hướng dẫn tài xế nhận chuyến | TXE PRO",
    breadcrumbLabel: "Hướng dẫn tài xế",
    description: "Tài xế hoàn thiện hồ sơ, đăng xe trống theo tuyến và thực hiện các chuyến đã nhận trên TXE PRO.",
  },
  "thanh-toan-ky-quy": {
    title: "Ví, voucher và ký quỹ | TXE PRO",
    breadcrumbLabel: "Ví, voucher và ký quỹ",
    description: "Thông tin về số dư, voucher và khoản ký quỹ khi khách hàng hoặc tài xế giao dịch trên TXE PRO.",
  },
  "khieu-nai-boi-thuong": {
    title: "Sự cố và hỗ trợ xử lý | TXE PRO",
    breadcrumbLabel: "Sự cố và hỗ trợ xử lý",
    description: "Cách báo cáo sự cố chuyến đi và theo dõi hồ sơ hỗ trợ trên TXE PRO.",
  },
};

export function isInfoPageSlug(slug: string): slug is InfoPageSlug {
  return Object.prototype.hasOwnProperty.call(INFO_PAGES, slug);
}
