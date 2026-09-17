"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  ShieldCheck,
  Package,
  Truck,
  Wallet,
  UserCheck,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Send,
  Sparkles,
  LifeBuoy
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

interface FAQItem {
  id: string;
  category: "shipper" | "driver" | "wallet" | "safety" | "account";
  question: {
    vi: string;
    en: string;
    zh: string;
  };
  answer: {
    vi: string[];
    en: string[];
    zh: string[];
  };
  highlight?: boolean;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: "shipper-1",
    category: "shipper",
    question: {
      vi: "Làm thế nào để đăng đơn hàng tìm tài xế vận chuyển?",
      en: "How do I post a cargo order to find transport drivers?",
      zh: "如何发布货运单寻找运输司机？",
    },
    answer: {
      vi: [
        "Đăng nhập tài khoản Chủ hàng trên website hoặc ứng dụng TXEPRO.",
        "Chọn 'Đăng đơn mới' và điền chi tiết điểm lấy hàng, điểm giao hàng, thời gian mong muốn.",
        "Chọn đúng loại phương tiện vận chuyển (Xe tải có thùng, Container / Đầu kéo, hoặc Ô tô chở khách) và nhập trọng tải / số chỗ phù hợp.",
        "Nhập giá cước mong muốn và nhấn 'Đăng đơn'. Hệ thống sẽ tự động thông báo đến các tài xế có chuyến rỗng phù hợp nhất.",
      ],
      en: [
        "Log in to your Shipper account on the TXEPRO website or mobile app.",
        "Select 'Post New Order' and enter pickup point, delivery point, and desired delivery schedule.",
        "Choose the matching vehicle category (Cargo Truck, Container/Tractor, or Passenger Car) with correct payload or seat capacity.",
        "Enter your budget offer and submit. TXEPRO will instantly notify verified drivers running matching routes.",
      ],
      zh: [
        "在 TXEPRO 网站或 App 登录您的货主账号。",
        "点击“发布新运单”，填写取货地点、送达地点及期望时间。",
        "选择匹配的车型（货车、集装箱/牵引车或客车），并输入对应载重或座位数。",
        "输入预算报价并发布，系统会自动将运单推送给沿线最匹配的司机。",
      ],
    },
    highlight: true,
  },
  {
    id: "shipper-2",
    category: "shipper",
    question: {
      vi: "Tôi có thể theo dõi vị trí xe và hàng hóa theo thời gian thực không?",
      en: "Can I track the vehicle and cargo location in real time?",
      zh: "我可以实时追踪车辆和货物的位置吗？",
    },
    answer: {
      vi: [
        "Có. Ngay khi tài xế nhận đơn và bắt đầu di chuyển, hệ thống GPS của TXEPRO sẽ cập nhật liên tục vị trí phương tiện trên bản đồ trực quan.",
        "Bạn có thể vào mục 'Tra cứu vận đơn' hoặc truy cập đường link `/tracking` nhập mã đơn hàng để theo dõi chi tiết.",
        "Ngoài ra, hệ thống tự động thông báo khi xe sắp đến điểm lấy hàng và điểm giao hàng.",
      ],
      en: [
        "Yes. As soon as a driver accepts your trip and starts driving, TXEPRO's GPS system streams vehicle coordinates in real time.",
        "You can open 'Track Order' or go to `/tracking` with your order code to monitor on the live map.",
        "The system also sends automatic push notifications when the vehicle arrives near pickup and dropoff points.",
      ],
      zh: [
        "可以。当司机接单并启程后，TXEPRO 的 GPS 系统会在电子地图上实时更新车辆位置。",
        "您可进入“运单查询”或访问 `/tracking` 页面输入运单号进行全流程追踪。",
        "系统还会在车辆即将抵达装货点和卸货点时推送即时提醒。",
      ],
    },
    highlight: true,
  },
  {
    id: "shipper-3",
    category: "shipper",
    question: {
      vi: "Quy trình xác nhận hoàn tất giao hàng và nghiệm thu như thế nào?",
      en: "What is the delivery confirmation and acceptance process?",
      zh: "货物交付确认与验收流程是怎样的？",
    },
    answer: {
      vi: [
        "Khi giao hàng đến nơi, tài xế sẽ chụp ảnh bằng chứng giao nhận (biên bản ký nhận, ảnh chụp hiện trường hàng hóa) và gửi lên hệ thống.",
        "Chủ hàng kiểm tra thông tin và nhấn 'Xác nhận giao hàng thành công' trên ứng dụng.",
        "Sau khi xác nhận thành công, tiền cọc/ký quỹ sẽ được giải tỏa an toàn chuyển về ví tài xế.",
      ],
      en: [
        "Upon delivery, the driver captures proof of delivery (signed POD, delivery photos) directly in the app.",
        "The shipper inspects the cargo and taps 'Confirm Delivery' in the app.",
        "Once verified, escrowed funds are instantly released to the driver's wallet.",
      ],
      zh: [
        "货物送达时，司机会拍摄交付凭证（签收单、货物现场照片）并上传至系统。",
        "货主在 App 上核实货物无误后点击“确认收货”。",
        "确认完成后，平台担保的运费款项将安全解冻划拨至司机钱包。",
      ],
    },
  },
  {
    id: "driver-1",
    category: "driver",
    question: {
      vi: "Làm thế nào để trở thành đối tác tài xế TXEPRO?",
      en: "How do I become a TXEPRO driver partner?",
      zh: "如何注册成为 TXEPRO 合作司机？",
    },
    answer: {
      vi: [
        "Tải ứng dụng TXEPRO Driver trên Android hoặc iOS.",
        "Đăng ký tài khoản bằng số điện thoại chính chủ và xác thực mã OTP.",
        "Cung cấp ảnh chụp CCCD/CMND, Giấy phép lái xe (bằng B2, C, D, E, FC tùy loại phương tiện) và Đăng ký xe (Cà-vẹt), Đăng kiểm còn hạn.",
        "Đội ngũ vận hành TXEPRO sẽ xác minh hồ sơ KYC trong vòng 2 - 4 giờ làm việc. Sau khi kích hoạt, bạn có thể đăng tuyến xe rỗng và nhận đơn ngay lập tức.",
      ],
      en: [
        "Download TXEPRO Driver app from Google Play Store or Apple App Store.",
        "Sign up with your verified phone number and enter the OTP code.",
        "Upload national ID, valid driving license (B2, C, D, E, FC), vehicle registration certificate, and valid inspection inspection sticker.",
        "TXEPRO ops team will review and approve KYC within 2 - 4 business hours. Once verified, you can immediately post empty routes and accept cargo trips.",
      ],
      zh: [
        "在各大应用市场下载 TXEPRO 司机端 App。",
        "使用本人实名手机号注册并验证 OTP 验证码。",
        "上传身份证件、驾驶证（B2/C/D/E/FC）、车辆行驶证及有效期内的年检合格标志。",
        "TXEPRO 运营团队将在 2 - 4 个工作小时内完成实名审核。通过后即可发布返程空车并接单赚钱。",
      ],
    },
    highlight: true,
  },
  {
    id: "driver-2",
    category: "driver",
    question: {
      vi: "Tính năng đăng 'Chuyến xe rỗng' hoạt động thế nào?",
      en: "How does the 'Empty Return Trip' feature work?",
      zh: "“返程空车”发布功能如何运作？",
    },
    answer: {
      vi: [
        "Sau khi giao hàng xong ở chiều đi, tài xế có thể đăng tuyến rỗng (điểm đi, điểm đến, ngày giờ xuất phát dự kiến).",
        "Hệ thống thông minh TXEPRO sẽ tự động quét và gợi ý các đơn hàng của chủ hàng nằm dọc tuyến đường xe chạy.",
        "Tính năng này giúp tài xế tối ưu doanh thu chiều về, giảm thiểu tình trạng xe chạy rỗng lãng phí xăng dầu.",
      ],
      en: [
        "After dropping cargo on the forward leg, drivers can post their return itinerary (origin, destination, estimated departure time).",
        "TXEPRO's matching engine automatically pairs your return route with available cargo along the corridor.",
        "This maximizes your earnings on return trips and avoids empty haul mileage.",
      ],
      zh: [
        "去程送货完成后，司机可发布返程空车路线（出发地、目的地及预计发车时间）。",
        "TXEPRO 智能引擎会自动匹配该线路上货主的货运需求并推荐给您。",
        "有效帮助司机提升返程收益，告别放空回程，减少燃油损耗。",
      ],
    },
  },
  {
    id: "driver-3",
    category: "driver",
    question: {
      vi: "Tài xế rút tiền từ ví TXEPRO về tài khoản ngân hàng mất bao lâu?",
      en: "How long does it take for drivers to withdraw money to their bank account?",
      zh: "司机从 TXEPRO 钱包提现到银行账户需要多久？",
    },
    answer: {
      vi: [
        "TXEPRO liên kết trực tiếp với cổng thanh toán ngân hàng MB Bank qua chuẩn NAPAS 24/7.",
        "Lệnh rút tiền được xử lý tự động và tiền về tài khoản ngân hàng của bạn chỉ sau 1 - 5 phút.",
        "Hệ thống hỗ trợ rút tiền 24/7, kể cả ngày cuối tuần và ngày lễ Tết.",
      ],
      en: [
        "TXEPRO is directly integrated with MB Bank gateway via NAPAS 24/7 real-time transfer standard.",
        "Withdrawal requests are processed automatically and arrive in your bank account within 1 - 5 minutes.",
        "Withdrawals operate 24/7, including weekends and public holidays.",
      ],
      zh: [
        "TXEPRO 与 MB Bank 及 NAPAS 24/7 快速转账网络深度对接。",
        "提现指令全自动秒级处理，资金通常在 1 - 5 分钟内即可到达您的个人银行账户。",
        "全天候 24/7 支持提现，周末与法定节假日不打烊。",
      ],
    },
  },
  {
    id: "wallet-1",
    category: "wallet",
    question: {
      vi: "Cơ chế thanh toán ký quỹ (Escrow) của TXEPRO đảm bảo an toàn ra sao?",
      en: "How does TXEPRO's Escrow payment mechanism ensure security?",
      zh: "TXEPRO 的担保支付（Escrow）机制如何保障双方权益？",
    },
    answer: {
      vi: [
        "Khi chủ hàng chấp nhận đơn, tiền cước được tạm giữ an toàn trong tài khoản ký quỹ trung gian của TXEPRO (hợp tác bảo chứng cùng MB Bank).",
        "Tài xế hoàn toàn an tâm khởi hành vì tiền cước đã được xác thực có sẵn 100%.",
        "Chủ hàng được bảo vệ vì tiền chỉ được giải tỏa khi hàng hóa đã được vận chuyển đến nơi và nghiệm thu đầy đủ.",
        "Nếu có tranh chấp hoặc sự cố, bộ phận hòa giải TXEPRO sẽ can thiệp để bảo vệ quyền lợi hợp pháp của cả hai bên.",
      ],
      en: [
        "When an order is confirmed, shipment payment is securely locked in TXEPRO's escrow custody (backed by MB Bank).",
        "Drivers drive with peace of mind knowing the funds are 100% verified and guaranteed.",
        "Shippers stay protected because money is only transferred once delivery is confirmed and goods are verified.",
        "In case of any claim or dispute, TXEPRO mediation steps in to protect both parties fairly.",
      ],
      zh: [
        "货主确认运单后，运费款项将安全冻结在 TXEPRO 与 MB Bank 联合监管的第三方担保账户中。",
        "司机无需担心赖账或拖欠运费，可安心运送。",
        "货主亦受全面保护，只有在货物完好送达并验收签收后，资金方可解冻付给司机。",
        "若出现纠纷或异常，TXEPRO 官方仲裁介入，公正保障合法权益。",
      ],
    },
    highlight: true,
  },
  {
    id: "wallet-2",
    category: "wallet",
    question: {
      vi: "Tôi có thể xuất hóa đơn giá trị gia tăng (VAT) cho chuyến đi không?",
      en: "Can I request a Value Added Tax (VAT) invoice for my shipments?",
      zh: "我可以为运输订单开具增值税发票（VAT）吗？",
    },
    answer: {
      vi: [
        "Có. TXEPRO hỗ trợ xuất hóa đơn điện tử GTGT hợp pháp cho doanh nghiệp và cá nhân có nhu cầu.",
        "Bạn chỉ cần cập nhật thông tin xuất hóa đơn (Tên công ty, Mã số thuế, Địa chỉ, Email nhận HĐ) trong mục 'Thông tin cá nhân / Doanh nghiệp'.",
        "Hóa đơn sẽ được gửi tự động qua email định kỳ hoặc sau khi chuyến hàng hoàn thành.",
      ],
      en: [
        "Yes. TXEPRO provides official electronic VAT invoices for businesses and individual shippers upon request.",
        "Simply register your company billing info (Company name, Tax ID, Address, Invoice email) in your Profile settings.",
        "Electronic invoices are emailed automatically per trip or bundled monthly.",
      ],
      zh: [
        "支持。TXEPRO 支持为企业和个人货主开具正规电子增值税发票。",
        "只需在“个人资料 / 企业设置”中录入开票信息（抬头、税号、注册地址、收票邮箱）。",
        "完成运输后，电子发票将自动发送至您的指定邮箱。",
      ],
    },
  },
  {
    id: "safety-1",
    category: "safety",
    question: {
      vi: "Nếu hàng hóa bị hư hỏng hoặc thất thoát trong quá trình vận chuyển thì xử lý thế nào?",
      en: "What happens if cargo is damaged or lost during transit?",
      zh: "如果货物在运输途中发生损坏或丢失，如何处理？",
    },
    answer: {
      vi: [
        "Bước 1: Giữ nguyên hiện trường và chụp ảnh, quay video chi tiết tình trạng hàng hóa cùng biên bản ký nhận ghi rõ tình trạng.",
        "Bước 2: Nhấn nút 'Báo cáo sự cố' trên ứng dụng TXEPRO trong vòng 24 giờ kể từ thời điểm giao nhận.",
        "Bước 3: Đội ngũ giám định TXEPRO cùng công ty bảo hiểm sẽ tiếp nhận hồ sơ, đối chiếu giá trị khai báo và tiến hành bồi thường theo đúng Quy chế bồi thường của nền tảng.",
      ],
      en: [
        "Step 1: Keep cargo intact at delivery site, capture photos/videos and record details on the handover note signed by both sides.",
        "Step 2: Tap 'Report Incident' in the TXEPRO app within 24 hours of delivery.",
        "Step 3: TXEPRO dispute team and insurance partners will review the claim, verify declared value, and process compensation under the platform policy.",
      ],
      zh: [
        "第一步：保持现场原样，拍摄受损货物照片及视频，并在交接单上明确备注受损情况双方签字确认。",
        "第二步：在交接后 24 小时内点击 TXEPRO App 中的“异常申诉”。",
        "第三步：TXEPRO 专席理赔团队及保险专员介入核验货物申报价值，并按平台赔付标准快速办理理赔。",
      ],
    },
  },
  {
    id: "account-1",
    category: "account",
    question: {
      vi: "Làm thế nào khi tôi quên mật khẩu hoặc muốn thay đổi số điện thoại?",
      en: "How do I reset my password or change my phone number?",
      zh: "忘记密码或更换注册手机号时该如何操作？",
    },
    answer: {
      vi: [
        "Quên mật khẩu: Nhấp vào 'Quên mật khẩu' ở màn hình đăng nhập, nhập số điện thoại và nhập mã OTP gửi qua Zalo/SMS để đặt lại mật khẩu mới ngay lập tức.",
        "Đổi số điện thoại: Vào phần Cài đặt tài khoản -> Thông tin cá nhân -> Chỉnh sửa số điện thoại. Hệ thống sẽ gửi mã OTP xác nhận về cả số cũ và số mới để bảo mật tuyệt đối.",
        "Nếu số cũ đã mất hoặc không thể nhận OTP, vui lòng liên hệ bộ phận hỗ trợ khách hàng kèm giấy tờ tùy thân để được chuyên viên hỗ trợ xác minh thủ công.",
      ],
      en: [
        "Forgot Password: Tap 'Forgot Password' on the login screen, enter your phone number, and verify the OTP code sent via Zalo/SMS to reset your password.",
        "Change Phone: Go to Profile Settings -> Personal Info -> Edit Phone Number. An OTP code will be sent to authenticate both numbers securely.",
        "If your old phone number is lost, contact customer support team with your ID documents for manual verification.",
      ],
      zh: [
        "找回密码：在登录界面点击“忘记密码”，输入手机号并通过 Zalo/SMS 接收的 OTP 验证码重置密码。",
        "更换手机号：进入个人设置 -> 账户资料 -> 修改手机号，系统将发送 OTP 验证以确保账户安全。",
        "若原手机号已注销无法接收验证码，请持身份证件联系客服专员协助人工核验。",
      ],
    },
  },
];

export default function HelpCenterPage() {
  const { language } = useLanguage();
  const { companyInfo, isLoaded } = useCompanyInfo();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("shipper-1");

  // Contact modal state
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const pageCopy = {
    vi: {
      badge: "Trung tâm trợ giúp & Chăm sóc khách hàng",
      title: "Bạn cần TXEPRO hỗ trợ điều gì hôm nay?",
      subtitle:
        "Tra cứu nhanh câu hỏi thường gặp, hướng dẫn quy trình vận chuyển, hỗ trợ thanh toán ký quỹ MB Bank và liên hệ đội ngũ chuyên viên 24/7.",
      searchPlaceholder: "Tìm kiếm: đăng đơn, ký quỹ, rút tiền, GPS, sự cố...",
      quickKeywords: ["Đăng đơn hàng", "Ký quỹ MB Bank", "Rút tiền ví", "Định vị GPS", "Bồi thường hàng"],
      categories: {
        all: "Tất cả chủ đề",
        shipper: "Chủ hàng",
        driver: "Tài xế & Đối tác",
        wallet: "Thanh toán & Ví",
        safety: "Sự cố & Khiếu nại",
        account: "Tài khoản & Ứng dụng",
      },
      faqTitle: "Câu hỏi thường gặp",
      faqSubtitle: "Tổng hợp các giải đáp chi tiết nhất cho quy trình vận hành trên TXEPRO",
      noResults: "Không tìm thấy câu hỏi phù hợp với từ khóa",
      clearSearch: "Xóa tìm kiếm",
      emergencyContact: "Kênh hỗ trợ trực tiếp",
      hotlineTitle: "Tổng đài hỗ trợ 24/7",
      hotlineDesc: "Hỗ trợ khẩn cấp, xử lý sự cố trên đường",
      hotlineNumber: companyInfo.hotline || "",
      liveChatTitle: "Hỗ trợ trực tuyến",
      liveChatDesc: "Chat ngay với tư vấn viên TXEPRO",
      emailTitle: "Hòm thư hỗ trợ",
      emailDesc: "Phản hồi chính thức trong 2 giờ làm việc",
      emailAddress: companyInfo.emailSupport || "",
      officeTitle: "Văn phòng điều hành",
      officeDesc: "TP. Hồ Chí Minh & Hà Nội (8:00 - 18:00)",
      needMoreHelp: "Vẫn chưa tìm thấy câu trả lời bạn cần?",
      needMoreHelpDesc: "Hãy để lại thông tin và nội dung cần hỗ trợ, chuyên viên TXEPRO sẽ liên hệ lại ngay với bạn.",
      btnSubmit: "Gửi yêu cầu hỗ trợ",
      btnSubmitted: "Đã gửi thành công!",
      successMsg: "Cảm ơn bạn! Đội ngũ hỗ trợ khách hàng TXEPRO sẽ liên hệ lại trong ít phút.",
      quickToolsTitle: "Tiện ích tự phục vụ nhanh",
      trackOrderTitle: "Tra cứu vận đơn",
      trackOrderDesc: "Kiểm tra trạng thái lộ trình trực tiếp của đơn hàng",
      registerTitle: "Đăng ký đối tác",
      registerDesc: "Gia nhập mạng lưới vận chuyển toàn quốc",
      rulesTitle: "Quy chế hoạt động",
      rulesDesc: "Xem chi tiết quy chế pháp lý và quyền lợi",
    },
    en: {
      badge: "Help Center & Customer Care",
      title: "How can TXEPRO help you today?",
      subtitle:
        "Quickly look up FAQs, learn trip workflows, find MB Bank escrow guidance, or connect with our 24/7 customer support team.",
      searchPlaceholder: "Search: post order, escrow, payout, GPS, claims...",
      quickKeywords: ["Post order", "MB Escrow", "Wallet withdrawal", "Live GPS", "Cargo claims"],
      categories: {
        all: "All topics",
        shipper: "Shipper",
        driver: "Driver & Partner",
        wallet: "Payment & Wallet",
        safety: "Disputes & Safety",
        account: "Account & App",
      },
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Detailed answers for every step of your TXEPRO journey",
      noResults: "No matching questions found for",
      clearSearch: "Clear search",
      emergencyContact: "Direct Support Channels",
      hotlineTitle: "24/7 Support Hotline",
      hotlineDesc: "Emergency on-road assistance & incident handling",
      hotlineNumber: companyInfo.hotline || "",
      liveChatTitle: "Live Chat Support",
      liveChatDesc: "Chat directly with TXEPRO specialists",
      emailTitle: "Support Email",
      emailDesc: "Official response within 2 business hours",
      emailAddress: companyInfo.emailSupport || "",
      officeTitle: "Operations Office",
      officeDesc: "HCMC & Hanoi headquarters (8:00 - 18:00)",
      needMoreHelp: "Still haven't found what you're looking for?",
      needMoreHelpDesc: "Leave your question below and our specialists will contact you shortly.",
      btnSubmit: "Submit request",
      btnSubmitted: "Submitted successfully!",
      successMsg: "Thank you! TXEPRO support team will contact you within a few minutes.",
      quickToolsTitle: "Quick Self-Service Tools",
      trackOrderTitle: "Track Order",
      trackOrderDesc: "Check real-time order status and route progress",
      registerTitle: "Join as Partner",
      registerDesc: "Join Vietnam's growing digital freight network",
      rulesTitle: "Operating Rules",
      rulesDesc: "Read legal terms and member protections",
    },
    zh: {
      badge: "帮助中心与客户支持",
      title: "今天 TXEPRO 能为您提供什么帮助？",
      subtitle:
        "快速查询常见问题解答、运单操作流程、MB Bank 担保结算指引，并随时联系全天候 24/7 客服专员。",
      searchPlaceholder: "搜索：发布运单、担保支付、提现、GPS 定位、理赔...",
      quickKeywords: ["发布运单", "MB 担保", "钱包提现", "GPS 定位", "货损理赔"],
      categories: {
        all: "所有主题",
        shipper: "货主指南",
        driver: "司机与伙伴",
        wallet: "支付与钱包",
        safety: "安全与纠纷",
        account: "账户与应用",
      },
      faqTitle: "常见问题解答",
      faqSubtitle: "TXEPRO 平台全流程操作详解与权威答疑",
      noResults: "未找到与该关键词相关的常见问题",
      clearSearch: "清除搜索",
      emergencyContact: "直接服务通道",
      hotlineTitle: "24/7 客服热线",
      hotlineDesc: "运输在途紧急救援与异常调处",
      hotlineNumber: companyInfo.hotline || "",
      liveChatTitle: "在线人工客服",
      liveChatDesc: "与 TXEPRO 客服专员即时在线交流",
      emailTitle: "官方支持邮箱",
      emailDesc: "工作时间内 2 小时快速书面答复",
      emailAddress: companyInfo.emailSupport || "",
      officeTitle: "运营办事处",
      officeDesc: "胡志明市与河内总部中心 (8:00 - 18:00)",
      needMoreHelp: "仍未找到您需要的解答？",
      needMoreHelpDesc: "请留下您的联系方式与疑问，TXEPRO 专员将第一时间与您联系。",
      btnSubmit: "提交支持工单",
      btnSubmitted: "提交成功！",
      successMsg: "感谢您的反馈！TXEPRO 客服人员将在短时间内与您取得联系。",
      quickToolsTitle: "快速自助工具",
      trackOrderTitle: "运单轨迹查询",
      trackOrderDesc: "实时查看运单状态及地图在途位置",
      registerTitle: "司机车主加盟",
      registerDesc: "加入全国数字化公路货运网络",
      rulesTitle: "平台运营规则",
      rulesDesc: "查看法律条款及双向权益保障",
    },
  }[language] || {
    badge: "Trung tâm trợ giúp & Chăm sóc khách hàng",
    title: "Bạn cần TXEPRO hỗ trợ điều gì hôm nay?",
    subtitle: "Tra cứu nhanh câu hỏi thường gặp, hướng dẫn quy trình vận chuyển.",
    searchPlaceholder: "Tìm kiếm...",
    quickKeywords: [],
    categories: { all: "Tất cả", shipper: "Chủ hàng", driver: "Tài xế", wallet: "Ví", safety: "An toàn", account: "Tài khoản" },
    faqTitle: "Câu hỏi thường gặp",
    faqSubtitle: "Chi tiết",
    noResults: "Không tìm thấy kết quả",
    clearSearch: "Xóa",
    emergencyContact: "Kênh hỗ trợ",
    hotlineTitle: "Tổng đài 24/7",
    hotlineDesc: "Khẩn cấp",
    hotlineNumber: companyInfo.hotline || "",
    liveChatTitle: "Live Chat",
    liveChatDesc: "Tư vấn viên",
    emailTitle: "Email",
    emailDesc: "Phản hồi 2h",
    emailAddress: companyInfo.emailSupport || "",
    officeTitle: "Văn phòng",
    officeDesc: "8:00 - 18:00",
    needMoreHelp: "Cần thêm hỗ trợ?",
    needMoreHelpDesc: "Để lại tin nhắn",
    btnSubmit: "Gửi",
    btnSubmitted: "Đã gửi",
    successMsg: "Đã gửi",
    quickToolsTitle: "Tiện ích nhanh",
    trackOrderTitle: "Tra cứu vận đơn",
    trackOrderDesc: "Kiểm tra trạng thái",
    registerTitle: "Đăng ký",
    registerDesc: "Gia nhập ngay",
    rulesTitle: "Quy chế",
    rulesDesc: "Chi tiết quy chế",
  };

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((item) => {
      // Category filter
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const currentLang = (language as "vi" | "en" | "zh") || "vi";
        const qText = item.question[currentLang]?.toLowerCase() || "";
        const aText = (item.answer[currentLang] || []).join(" ").toLowerCase();
        return qText.includes(query) || aText.includes(query);
      }
      return true;
    });
  }, [activeCategory, searchQuery, language]);

  const handleToggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setContactName("");
      setContactPhone("");
      setContactMessage("");
      setFeedbackSent(false);
    }, 4500);
  };

  const currentLang = (language as "vi" | "en" | "zh") || "vi";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      <Header />

      {/* Main Content Container */}
      <main className="flex-1 pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-slate-950 text-white py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
          {/* Background image & overlays */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/splash1.png"
              alt="TXEPRO Transport Help Center"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center scale-105 filter brightness-90 contrast-105"
            />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/85 via-slate-950/80 to-slate-950/95" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-primary-600/25 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/15 text-xs font-bold text-primary-200 tracking-wide uppercase mb-6 shadow-md shadow-black/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {pageCopy.badge}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-md">
              {pageCopy.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
              {pageCopy.subtitle}
            </p>

            {/* Search Input Box */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 focus-within:ring-4 focus-within:ring-primary-500/30 transition-all duration-300">
                <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={pageCopy.searchPlaceholder}
                  className="w-full px-4 py-3 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none text-base sm:text-lg bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mr-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    {pageCopy.clearSearch}
                  </button>
                )}
              </div>

              {/* Quick Keywords */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
                <span className="text-slate-400 font-medium">Gợi ý:</span>
                {pageCopy.quickKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setSearchQuery(kw)}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4 DIRECT CONTACT CHANNELS - Only render channels configured by admin */}
        {!isLoaded ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="h-36 rounded-2xl bg-white/90 animate-pulse border border-slate-200/70 shadow-sm" />
              <div className="h-36 rounded-2xl bg-white/90 animate-pulse border border-slate-200/70 shadow-sm" />
            </div>
          </section>
        ) : (companyInfo.hotline || companyInfo.zaloUrl || companyInfo.emailSupport || companyInfo.addressHcm || companyInfo.addressHn) ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Hotline */}
              {companyInfo.hotline && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{pageCopy.hotlineTitle}</h3>
                    <p className="text-xs text-slate-500 mb-3">{pageCopy.hotlineDesc}</p>
                  </div>
                  <a
                    href={`tel:${companyInfo.hotline.replace(/\s/g, "")}`}
                    className="inline-flex items-center justify-between text-primary-600 font-bold text-lg hover:text-primary-700 pt-2 border-t border-slate-100"
                  >
                    <span>{companyInfo.hotline}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )}

              {/* Live Chat */}
              {companyInfo.zaloUrl && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{pageCopy.liveChatTitle}</h3>
                    <p className="text-xs text-slate-500 mb-3">{pageCopy.liveChatDesc}</p>
                  </div>
                  <a
                    href={companyInfo.zaloUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between text-primary-600 font-bold text-sm hover:text-primary-700 pt-2 border-t border-slate-100"
                  >
                    <span>Chat qua Zalo OA</span>
                    <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              )}

              {/* Email */}
              {companyInfo.emailSupport && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{pageCopy.emailTitle}</h3>
                    <p className="text-xs text-slate-500 mb-3">{pageCopy.emailDesc}</p>
                  </div>
                  <a
                    href={`mailto:${companyInfo.emailSupport}`}
                    className="inline-flex items-center justify-between text-primary-600 font-bold text-sm hover:text-primary-700 pt-2 border-t border-slate-100"
                  >
                    <span className="truncate">{companyInfo.emailSupport}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )}

              {/* Office */}
              {(companyInfo.addressHcm || companyInfo.addressHn) && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{pageCopy.officeTitle}</h3>
                    <p className="text-xs text-slate-500 mb-3">{pageCopy.officeDesc}</p>
                  </div>
                  <Link
                    href="/thong-tin/lien-he"
                    className="inline-flex items-center justify-between text-primary-600 font-bold text-sm hover:text-primary-700 pt-2 border-t border-slate-100"
                  >
                    <span>Xem địa chỉ văn phòng</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* QUICK SELF-SERVICE TOOLS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            {pageCopy.quickToolsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/tracking"
              className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-lg transition-all group"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                  {pageCopy.trackOrderTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {pageCopy.trackOrderDesc}
                </p>
              </div>
            </Link>

            <Link
              href="/register"
              className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-lg transition-all group"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                  {pageCopy.registerTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {pageCopy.registerDesc}
                </p>
              </div>
            </Link>

            <Link
              href="/thong-tin/quy-che-hoat-dong"
              className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-lg transition-all group"
            >
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                  {pageCopy.rulesTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {pageCopy.rulesDesc}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              {pageCopy.faqTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {pageCopy.faqSubtitle}
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { key: "all", label: pageCopy.categories.all },
                { key: "shipper", label: pageCopy.categories.shipper },
                { key: "driver", label: pageCopy.categories.driver },
                { key: "wallet", label: pageCopy.categories.wallet },
                { key: "safety", label: pageCopy.categories.safety },
                { key: "account", label: pageCopy.categories.account },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    activeCategory === cat.key
                      ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-base font-medium text-slate-600">
                  {pageCopy.noResults} &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 font-semibold text-xs transition-colors"
                >
                  {pageCopy.clearSearch}
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-primary-500 shadow-md ring-2 ring-primary-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleFaq(faq.id)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                    >
                      <span className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-3">
                        {faq.highlight && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                        )}
                        {faq.question[currentLang] || faq.question.vi}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-primary-600" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 text-slate-600 text-sm sm:text-base border-t border-slate-100 bg-slate-50/50">
                        <ul className="space-y-3">
                          {(faq.answer[currentLang] || faq.answer.vi).map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* FEEDBACK & SUPPORT TICKET FORM */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16">
          <div className="bg-gradient-to-br from-primary-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 blur-[90px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-primary-200 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>TXEPRO Care</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold mb-3">{pageCopy.needMoreHelp}</h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
                {pageCopy.needMoreHelpDesc}
              </p>

              {feedbackSent ? (
                <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-white flex items-center gap-4 animate-fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-base">{pageCopy.btnSubmitted}</h5>
                    <p className="text-xs text-emerald-200 mt-1">{pageCopy.successMsg}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Họ và tên / Tên doanh nghiệp *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0987 654 321"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Nội dung hoặc mã đơn hàng cần hỗ trợ *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Mô tả cụ thể vấn đề hoặc mã đơn hàng bạn đang cần giải đáp..."
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/30 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{pageCopy.btnSubmit}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* SHARED SUBPAGE CTA BANNER */}
        <SubpageCtaBanner />
      </main>

      <Footer />
    </div>
  );
}
