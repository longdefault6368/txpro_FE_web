export type AdminRole = "super_admin" | "operations" | "dispatcher" | "kyc_officer" | "cskh" | "accountant";

export const ADMIN_ROLE_CONFIG: Record<AdminRole, {
  label: string;
  shortLabel: string;
  badgeClass: string;
  color: string;
  allowedPaths: string[];
}> = {
  super_admin: {
    label: "Super Admin (Chủ sở hữu)",
    shortLabel: "Super Admin",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    color: "#9333ea",
    allowedPaths: ["*"],
  },
  operations: {
    label: "Quản Lý Vận Hành",
    shortLabel: "Vận Hành",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    color: "#2563eb",
    allowedPaths: ["/admin", "/admin/notifications", "/admin/attendance", "/admin/users", "/admin/orders", "/admin/incidents", "/admin/analytics", "/admin/support", "/admin/contacts", "/admin/tuyen-dung", "/admin/email-marketing", "/admin/news"],
  },
  dispatcher: {
    label: "Điều Phối Viên",
    shortLabel: "Điều Phối",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    color: "#d97706",
    allowedPaths: ["/admin", "/admin/attendance", "/admin/orders", "/admin/incidents", "/admin/notifications", "/admin/support"],
  },
  kyc_officer: {
    label: "Chuyên Viên eKYC",
    shortLabel: "Thẩm Định eKYC",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    color: "#0d9488",
    allowedPaths: ["/admin/users", "/admin/notifications", "/admin/attendance"],
  },
  cskh: {
    label: "Chăm Sóc Khách Hàng",
    shortLabel: "CSKH",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    color: "#16a34a",
    allowedPaths: ["/admin/support", "/admin/incidents", "/admin/notifications", "/admin/contacts", "/admin/tuyen-dung", "/admin/email-marketing", "/admin/attendance"],
  },
  accountant: {
    label: "Kế Toán & Đối Soát",
    shortLabel: "Kế Toán",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    color: "#4f46e5",
    allowedPaths: ["/admin/analytics", "/admin/orders", "/admin/notifications", "/admin/attendance"],
  },
};

export interface AdminPermissionModule {
  id: string;
  name: string;
  description: string;
  path: string;
  category: "core" | "operations" | "support" | "finance" | "system";
}

export const ADMIN_PERMISSION_MODULES: AdminPermissionModule[] = [
  {
    id: "dashboard",
    name: "Tổng Quan & Chỉ Số",
    description: "Xem KPI, biểu đồ và doanh số vận hành nhanh",
    path: "/admin",
    category: "core",
  },
  {
    id: "notifications",
    name: "Thông Báo & Cảnh Báo",
    description: "Nhận và xử lý chuông thông báo hệ thống",
    path: "/admin/notifications",
    category: "core",
  },
  {
    id: "attendance",
    name: "Chấm Công & Bảng Lương",
    description: "Chấm công nhân sự nội bộ, nghỉ phép và lương tạm tính theo tháng",
    path: "/admin/attendance",
    category: "core",
  },
  {
    id: "users",
    name: "Người Dùng",
    description: "Quản lý hồ sơ xác thực, duyệt CCCD, bằng lái & phương tiện",
    path: "/admin/users",
    category: "operations",
  },
  {
    id: "orders",
    name: "Quản Lý Vận Đơn & Chuyến",
    description: "Theo dõi đơn hàng, vị trí xe, hợp đồng & giao nhận",
    path: "/admin/orders",
    category: "operations",
  },
  {
    id: "incidents",
    name: "Xử Lý Tranh Chấp & Sự Cố",
    description: "Giải quyết tranh chấp hợp đồng, sự cố giao nhận hàng & đối soát xử lý cọc 3%",
    path: "/admin/incidents",
    category: "operations",
  },
  {
    id: "analytics",
    name: "Phân Tích & Doanh Thu",
    description: "Biểu đồ tài chính, tăng trưởng cước phí và đối soát",
    path: "/admin/analytics",
    category: "finance",
  },
  { id: "affiliates", name: "Đối Tác & Giới Thiệu", description: "Chính sách, tiền thưởng và thanh toán đối tác", path: "/admin/affiliates", category: "finance" },
  {
    id: "support",
    name: "Hỗ Trợ & Live Chat",
    description: "Trực tiếp hỗ trợ tài xế/chủ hàng, xử lý khiếu nại & ticket",
    path: "/admin/support",
    category: "support",
  },
  {
    id: "contacts",
    name: "Liên Hệ Website",
    description: "Xem và xử lý danh sách khách hàng gửi yêu cầu liên hệ từ website",
    path: "/admin/contacts",
    category: "support",
  },
  {
    id: "careers",
    name: "Tuyển Dụng",
    description: "Xem hồ sơ ứng viên gửi từ trang tuyển dụng",
    path: "/admin/tuyen-dung",
    category: "support",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    description: "Soạn chiến dịch và gửi cho một người hoặc một danh sách",
    path: "/admin/email-marketing",
    category: "support",
  },
  {
    id: "news",
    name: "Tin Tức & Ưu Đãi",
    description: "Đăng tin tức, hướng dẫn và ưu đãi hiển thị trên app tài xế và chủ hàng",
    path: "/admin/news",
    category: "operations",
  },
  {
    id: "logs",
    name: "Nhật Ký Hệ Thống",
    description: "Tra cứu log truy cập, audit trail và sự kiện máy chủ",
    path: "/admin/logs",
    category: "system",
  },
  {
    id: "settings",
    name: "Cài Đặt Sàn & Hệ Thống",
    description: "Cấu hình hoa hồng sàn, OTP, thông báo và tham số",
    path: "/admin/settings",
    category: "system",
  },
  {
    id: "team",
    name: "Ban Quản Trị",
    description: "Quản lý nhân sự nội bộ và cấu hình phân quyền vai trò",
    path: "/admin/team",
    category: "system",
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  operations: ["/admin", "/admin/notifications", "/admin/attendance", "/admin/users", "/admin/orders", "/admin/incidents", "/admin/analytics", "/admin/support", "/admin/contacts", "/admin/tuyen-dung", "/admin/email-marketing", "/admin/news", "/admin/affiliates"],
  dispatcher: ["/admin", "/admin/notifications", "/admin/attendance", "/admin/orders", "/admin/incidents", "/admin/support"],
  kyc_officer: ["/admin/notifications", "/admin/attendance", "/admin/users"],
  cskh: ["/admin/notifications", "/admin/attendance", "/admin/incidents", "/admin/support", "/admin/contacts", "/admin/tuyen-dung", "/admin/email-marketing"],
  accountant: ["/admin/notifications", "/admin/attendance", "/admin/orders", "/admin/analytics", "/admin/affiliates"],
};
