"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/utils/translations";

type InfoPage = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    items: string[];
  }>;
};

const content: Record<string, Record<Language, InfoPage>> = {
  "gioi-thieu": {
    vi: {
      title: "Giới thiệu TXEPRO",
      intro: "TXEPRO là nền tảng vận tải số giúp chủ hàng và tài xế kết nối nhanh, minh bạch và an toàn hơn trong toàn bộ vòng đời vận đơn.",
      sections: [
        {
          heading: "TXEPRO giải quyết vấn đề gì?",
          items: [
            "Giảm xe chạy rỗng bằng cách gợi ý đơn phù hợp với tuyến tài xế đã đăng.",
            "Giúp chủ hàng theo dõi lộ trình, trạng thái vận đơn và bằng chứng giao nhận tập trung.",
            "Tăng tính minh bạch bằng hồ sơ xác minh, đánh giá sau chuyến và lịch sử giao dịch.",
          ],
        },
        {
          heading: "Thành phần chính",
          items: [
            "Ứng dụng chủ hàng để đăng đơn, chọn tài xế, theo dõi và xác nhận giao hàng.",
            "Ứng dụng tài xế để đăng tuyến, nhận đơn, cập nhật GPS và hoàn tất chuyến.",
            "Cổng quản trị để vận hành người dùng, vận đơn, KYC, hỗ trợ và khiếu nại.",
          ],
        },
      ],
    },
    en: {
      title: "About TXEPRO",
      intro: "TXEPRO is a digital logistics platform that helps shippers and drivers connect faster, more transparently, and more safely.",
      sections: [
        {
          heading: "What TXEPRO solves",
          items: [
            "Reduce empty truck routes by matching cargo with drivers' posted routes.",
            "Let shippers track route progress, order status, and delivery evidence in one place.",
            "Improve transparency with verification, post-trip reviews, and transaction history.",
          ],
        },
        {
          heading: "Core products",
          items: [
            "Shipper app for posting orders, selecting drivers, tracking trips, and confirming delivery.",
            "Driver app for posting routes, accepting orders, updating GPS, and completing trips.",
            "Admin portal for users, orders, KYC, support, and dispute operations.",
          ],
        },
      ],
    },
    zh: {
      title: "TXEPRO 项目介绍",
      intro: "TXEPRO 是一个数字化货运平台，帮助货主与司机更快速、更透明、更安全地完成运单协作。",
      sections: [
        {
          heading: "TXEPRO 解决的问题",
          items: [
            "通过司机发布的线路匹配合适货源，减少空车行驶。",
            "让货主集中查看路线、运单状态和交付凭证。",
            "通过认证、评价和交易记录提升平台透明度。",
          ],
        },
        {
          heading: "核心产品",
          items: [
            "货主端用于发布运单、选择司机、跟踪运输和确认交付。",
            "司机端用于发布线路、接单、更新 GPS 和完成运输。",
            "管理后台用于用户、运单、KYC、支持和纠纷处理。",
          ],
        },
      ],
    },
  },
  "quy-che-hoat-dong": {
    vi: {
      title: "Quy chế hoạt động",
      intro: "Quy chế này mô tả cách TXEPRO vận hành kết nối vận tải, xử lý đơn hàng, xác minh người dùng và hỗ trợ giao dịch.",
      sections: [
        {
          heading: "Nguyên tắc vận hành",
          items: [
            "Người dùng cần cung cấp thông tin chính xác khi đăng ký, xác minh và tạo vận đơn.",
            "Chủ hàng chịu trách nhiệm mô tả đúng hàng hóa, điểm nhận, điểm trả, thời gian và ngân sách.",
            "Tài xế chịu trách nhiệm cập nhật tuyến, phương tiện, định vị và bằng chứng giao nhận trung thực.",
          ],
        },
        {
          heading: "Vai trò của TXEPRO",
          items: [
            "Cung cấp công cụ kết nối, theo dõi, hỗ trợ và lưu vết giao dịch.",
            "Kiểm tra hồ sơ, xử lý báo cáo vi phạm và hỗ trợ giải quyết tranh chấp.",
            "Không trực tiếp sở hữu hàng hóa hoặc phương tiện của các bên tham gia.",
          ],
        },
      ],
    },
    en: {
      title: "Operating Rules",
      intro: "These rules describe how TXEPRO operates transport matching, order handling, user verification, and transaction support.",
      sections: [
        {
          heading: "Operating principles",
          items: [
            "Users must provide accurate information during registration, verification, and order creation.",
            "Shippers are responsible for accurate cargo, pickup, dropoff, schedule, and budget details.",
            "Drivers are responsible for truthful route, vehicle, GPS, and delivery evidence updates.",
          ],
        },
        {
          heading: "TXEPRO's role",
          items: [
            "Provide matching, tracking, support, and transaction record tools.",
            "Review profiles, handle violation reports, and support dispute resolution.",
            "TXEPRO does not directly own users' cargo or vehicles.",
          ],
        },
      ],
    },
    zh: {
      title: "运营规则",
      intro: "本规则说明 TXEPRO 如何进行运力匹配、运单处理、用户认证和交易支持。",
      sections: [
        {
          heading: "运营原则",
          items: [
            "用户在注册、认证和创建运单时必须提供真实信息。",
            "货主应准确填写货物、装货点、卸货点、时间和预算。",
            "司机应如实更新线路、车辆、GPS 和交付凭证。",
          ],
        },
        {
          heading: "TXEPRO 的角色",
          items: [
            "提供匹配、跟踪、支持和交易记录工具。",
            "审核资料、处理违规报告并协助纠纷解决。",
            "TXEPRO 不直接拥有用户的货物或车辆。",
          ],
        },
      ],
    },
  },
  "huong-dan-chu-hang": {
    vi: {
      title: "Hướng dẫn dành cho chủ hàng",
      intro: "Quy trình cơ bản để chủ hàng đăng đơn, chọn tài xế, theo dõi vận chuyển và xác nhận hoàn tất trên TXEPRO.",
      sections: [
        {
          heading: "Các bước sử dụng",
          items: [
            "Đăng ký tài khoản, hoàn tất xác minh cần thiết và cập nhật thông tin liên hệ.",
            "Tạo vận đơn với tên hàng, loại hàng, trọng lượng, điểm nhận, điểm trả và ngân sách.",
            "Theo dõi tài xế, tuyến đường, trạng thái vận chuyển và xác nhận giao hàng sau khi hoàn tất.",
          ],
        },
        {
          heading: "Khuyến nghị an toàn",
          items: [
            "Không giao hàng cấm, hàng sai mô tả hoặc hàng không đủ giấy tờ theo quy định.",
            "Kiểm tra thông tin tài xế, phương tiện và bằng chứng nhận/trả hàng trong ứng dụng.",
            "Liên hệ hỗ trợ khi phát sinh sai lệch hàng hóa, chậm giao hoặc tranh chấp thanh toán.",
          ],
        },
      ],
    },
    en: {
      title: "Shipper Guide",
      intro: "Basic workflow for shippers to post orders, select drivers, track shipments, and confirm completion on TXEPRO.",
      sections: [
        {
          heading: "How to use",
          items: [
            "Create an account, complete required verification, and update contact details.",
            "Post an order with cargo name, category, weight, pickup, dropoff, and budget.",
            "Track driver location, route, shipping status, and confirm delivery after completion.",
          ],
        },
        {
          heading: "Safety recommendations",
          items: [
            "Do not ship prohibited, misdeclared, or undocumented goods.",
            "Check driver, vehicle, and pickup/dropoff proof inside the app.",
            "Contact support for cargo discrepancies, delays, or payment disputes.",
          ],
        },
      ],
    },
    zh: {
      title: "货主使用指南",
      intro: "货主可在 TXEPRO 发布运单、选择司机、跟踪运输并确认完成。",
      sections: [
        {
          heading: "使用步骤",
          items: [
            "注册账户，完成必要认证并更新联系方式。",
            "填写货物名称、类型、重量、装货点、卸货点和预算。",
            "查看司机位置、运输路线、订单状态，并在完成后确认交付。",
          ],
        },
        {
          heading: "安全建议",
          items: [
            "不得托运禁运品、虚假申报货物或缺少证明的货物。",
            "在应用内核对司机、车辆和装卸货凭证。",
            "如发生货差、延误或付款争议，请联系平台支持。",
          ],
        },
      ],
    },
  },
  "huong-dan-tai-xe": {
    vi: {
      title: "Hướng dẫn dành cho tài xế",
      intro: "Tài xế có thể đăng tuyến, nhận đơn phù hợp, cập nhật GPS và hoàn tất giao nhận để nhận cước qua ví TXEPRO.",
      sections: [
        {
          heading: "Các bước sử dụng",
          items: [
            "Đăng ký tài khoản tài xế, hoàn tất KYC và cập nhật phương tiện đang hoạt động.",
            "Đăng tuyến xe, bán kính nhận/trả và thời gian khả dụng để hệ thống gợi ý đơn phù hợp.",
            "Nhận đơn, cập nhật trạng thái, GPS, bằng chứng nhận/trả hàng và hoàn tất chuyến.",
          ],
        },
        {
          heading: "Trách nhiệm tài xế",
          items: [
            "Sử dụng đúng phương tiện đã khai báo và giữ liên lạc với chủ hàng trong quá trình vận chuyển.",
            "Không tự ý đổi tuyến, đổi tài xế hoặc giao lại hàng nếu chưa được chấp thuận.",
            "Cập nhật sự cố ngay khi phát sinh để TXEPRO hỗ trợ kịp thời.",
          ],
        },
      ],
    },
    en: {
      title: "Driver Guide",
      intro: "Drivers can post routes, accept matching orders, update GPS, and complete deliveries to receive fare through TXEPRO wallet.",
      sections: [
        {
          heading: "How to use",
          items: [
            "Register as a driver, complete KYC, and update active vehicle information.",
            "Post routes, pickup/dropoff radius, and available time for matching.",
            "Accept orders, update status, GPS, pickup/dropoff proof, and complete trips.",
          ],
        },
        {
          heading: "Driver responsibilities",
          items: [
            "Use the declared vehicle and keep communication with the shipper during transport.",
            "Do not change route, driver, or hand over cargo without approval.",
            "Report incidents immediately so TXEPRO can assist.",
          ],
        },
      ],
    },
    zh: {
      title: "司机使用指南",
      intro: "司机可发布线路、接收匹配运单、更新 GPS，并完成交付后通过 TXEPRO 钱包收款。",
      sections: [
        {
          heading: "使用步骤",
          items: [
            "注册司机账户，完成 KYC 并更新可用车辆信息。",
            "发布线路、装卸货半径和可用时间以便系统匹配。",
            "接单后更新状态、GPS、装卸货凭证并完成运输。",
          ],
        },
        {
          heading: "司机责任",
          items: [
            "使用已申报车辆，并在运输过程中与货主保持沟通。",
            "未经同意不得擅自改线、换司机或转交货物。",
            "发生异常应立即报告，以便 TXEPRO 及时支持。",
          ],
        },
      ],
    },
  },
  "dieu-khoan-su-dung": {
    vi: {
      title: "Điều khoản sử dụng",
      intro: "Khi sử dụng TXEPRO, người dùng đồng ý tuân thủ các điều khoản về tài khoản, giao dịch, vận chuyển và hành vi trên nền tảng.",
      sections: [
        {
          heading: "Tài khoản và truy cập",
          items: [
            "Người dùng chịu trách nhiệm bảo mật tài khoản, mật khẩu và thiết bị đăng nhập.",
            "TXEPRO có thể tạm khóa tài khoản khi phát hiện gian lận, thông tin sai lệch hoặc vi phạm nghiêm trọng.",
            "Mỗi giao dịch, vận đơn và trao đổi trên nền tảng có thể được lưu lại để phục vụ vận hành và giải quyết tranh chấp.",
          ],
        },
        {
          heading: "Hành vi bị cấm",
          items: [
            "Đăng hàng cấm, hàng nguy hiểm không khai báo hoặc hàng trái quy định pháp luật.",
            "Gian lận thanh toán, đánh giá, định vị hoặc bằng chứng giao nhận.",
            "Lạm dụng kênh hỗ trợ, đe dọa, xúc phạm hoặc gây thiệt hại cho người dùng khác.",
          ],
        },
      ],
    },
    en: {
      title: "Terms of Use",
      intro: "By using TXEPRO, users agree to follow rules regarding accounts, transactions, transportation, and platform behavior.",
      sections: [
        {
          heading: "Accounts and access",
          items: [
            "Users are responsible for securing accounts, passwords, and login devices.",
            "TXEPRO may suspend accounts for fraud, false information, or serious violations.",
            "Orders, transactions, and conversations may be stored for operations and dispute resolution.",
          ],
        },
        {
          heading: "Prohibited behavior",
          items: [
            "Posting prohibited, undeclared dangerous, or illegal goods.",
            "Fraudulent payment, reviews, GPS, or delivery evidence.",
            "Abusing support channels, threatening, insulting, or harming other users.",
          ],
        },
      ],
    },
    zh: {
      title: "使用条款",
      intro: "使用 TXEPRO 即表示用户同意遵守账户、交易、运输及平台行为相关规则。",
      sections: [
        {
          heading: "账户与访问",
          items: [
            "用户应负责保护账户、密码和登录设备安全。",
            "如发现欺诈、虚假信息或严重违规，TXEPRO 可暂停账户。",
            "平台可保存运单、交易和沟通记录，用于运营和纠纷处理。",
          ],
        },
        {
          heading: "禁止行为",
          items: [
            "发布禁运品、未申报危险品或违法货物。",
            "伪造付款、评价、GPS 或交付凭证。",
            "滥用支持渠道、威胁、侮辱或损害其他用户。",
          ],
        },
      ],
    },
  },
  "chinh-sach-bao-mat": {
    vi: {
      title: "Chính sách bảo mật",
      intro: "TXEPRO thu thập và xử lý dữ liệu cần thiết để xác minh người dùng, vận hành vận đơn, thanh toán, hỗ trợ và cải thiện dịch vụ.",
      sections: [
        {
          heading: "Dữ liệu có thể được xử lý",
          items: [
            "Thông tin tài khoản: tên, số điện thoại, email, vai trò và trạng thái xác minh.",
            "Dữ liệu vận hành: vận đơn, GPS, tuyến đường, bằng chứng giao nhận, đánh giá và ticket hỗ trợ.",
            "Dữ liệu giao dịch: ví, ký quỹ, thanh toán, hoàn tiền và lịch sử xử lý khiếu nại.",
          ],
        },
        {
          heading: "Cam kết bảo vệ",
          items: [
            "Chỉ sử dụng dữ liệu cho mục đích vận hành, bảo mật, hỗ trợ và tuân thủ pháp luật.",
            "Áp dụng phân quyền truy cập và kiểm soát nội bộ đối với dữ liệu nhạy cảm.",
            "Người dùng có thể liên hệ TXEPRO để yêu cầu hỗ trợ liên quan đến dữ liệu cá nhân.",
          ],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      intro: "TXEPRO processes necessary data for verification, order operations, payments, support, and service improvement.",
      sections: [
        {
          heading: "Data we may process",
          items: [
            "Account data: name, phone, email, role, and verification status.",
            "Operational data: orders, GPS, routes, delivery evidence, reviews, and support tickets.",
            "Transaction data: wallet, escrow, payments, refunds, and claim history.",
          ],
        },
        {
          heading: "Protection commitment",
          items: [
            "Use data only for operations, security, support, and legal compliance.",
            "Apply access controls and internal governance for sensitive data.",
            "Users may contact TXEPRO for support regarding personal data.",
          ],
        },
      ],
    },
    zh: {
      title: "隐私政策",
      intro: "TXEPRO 为用户认证、运单运营、支付、支持和服务改进处理必要数据。",
      sections: [
        {
          heading: "可能处理的数据",
          items: [
            "账户数据：姓名、电话、邮箱、角色和认证状态。",
            "运营数据：运单、GPS、路线、交付凭证、评价和支持工单。",
            "交易数据：钱包、担保、支付、退款和投诉记录。",
          ],
        },
        {
          heading: "保护承诺",
          items: [
            "仅为运营、安全、支持和法律合规目的使用数据。",
            "对敏感数据实施访问权限和内部管理控制。",
            "用户可联系 TXEPRO 获取个人数据相关支持。",
          ],
        },
      ],
    },
  },
  "thanh-toan-ky-quy": {
    vi: {
      title: "Chính sách thanh toán & ký quỹ",
      intro: "TXEPRO định hướng sử dụng ví và cơ chế ký quỹ để bảo vệ quyền lợi của chủ hàng và tài xế trong giao dịch vận tải.",
      sections: [
        {
          heading: "Nguyên tắc thanh toán",
          items: [
            "Cước phí, phụ phí và hoàn tiền được hiển thị minh bạch theo từng vận đơn khi hệ thống hỗ trợ.",
            "Khoản ký quỹ có thể được giữ tạm thời để bảo đảm cam kết giao nhận.",
            "Việc giải ngân cho tài xế được thực hiện khi vận đơn hoàn tất và đủ điều kiện xác nhận.",
          ],
        },
        {
          heading: "Trường hợp cần rà soát",
          items: [
            "Vận đơn bị hủy sau khi đã nhận chuyến hoặc đang vận chuyển.",
            "Có tranh chấp về hàng hóa, bằng chứng giao nhận, thời gian giao hoặc chi phí phát sinh.",
            "Có dấu hiệu gian lận thanh toán, định vị hoặc đánh giá.",
          ],
        },
      ],
    },
    en: {
      title: "Payment & Escrow Policy",
      intro: "TXEPRO uses wallet and escrow-oriented flows to protect both shippers and drivers in logistics transactions.",
      sections: [
        {
          heading: "Payment principles",
          items: [
            "Fare, fees, and refunds are displayed transparently per order when supported by the system.",
            "Escrow may be temporarily held to secure delivery commitments.",
            "Driver payouts are released when orders are completed and confirmation requirements are met.",
          ],
        },
        {
          heading: "Cases requiring review",
          items: [
            "Orders cancelled after acceptance or during transport.",
            "Disputes over cargo, delivery evidence, timing, or additional charges.",
            "Suspected payment, GPS, or review fraud.",
          ],
        },
      ],
    },
    zh: {
      title: "支付与担保政策",
      intro: "TXEPRO 采用钱包和担保机制，保护货主与司机在货运交易中的权益。",
      sections: [
        {
          heading: "支付原则",
          items: [
            "运费、费用和退款将在系统支持时按运单透明显示。",
            "担保金额可被临时冻结，以保障交付承诺。",
            "司机款项在运单完成并满足确认条件后释放。",
          ],
        },
        {
          heading: "需审核的情况",
          items: [
            "接单后或运输中取消运单。",
            "关于货物、交付凭证、时间或附加费用的争议。",
            "疑似支付、GPS 或评价欺诈。",
          ],
        },
      ],
    },
  },
  "khieu-nai-boi-thuong": {
    vi: {
      title: "Quy trình khiếu nại & bồi thường",
      intro: "Khi phát sinh sự cố, TXEPRO khuyến nghị người dùng gửi yêu cầu hỗ trợ kèm bằng chứng để được xử lý theo quy trình.",
      sections: [
        {
          heading: "Cách gửi khiếu nại",
          items: [
            "Cung cấp mã vận đơn, mô tả sự cố, thời gian phát sinh và thông tin liên hệ.",
            "Đính kèm hình ảnh, bằng chứng giao nhận, tin nhắn hoặc tài liệu liên quan nếu có.",
            "Theo dõi phản hồi qua kênh hỗ trợ, live chat hoặc ticket trong hệ thống.",
          ],
        },
        {
          heading: "Nguyên tắc xử lý",
          items: [
            "TXEPRO xem xét dữ liệu vận đơn, GPS, bằng chứng và lịch sử trao đổi giữa các bên.",
            "Các khoản hoàn tiền, giữ tiền hoặc bồi thường phụ thuộc vào kết quả xác minh và chính sách áp dụng.",
            "Trường hợp nghiêm trọng có thể bị tạm khóa tài khoản hoặc chuyển cơ quan có thẩm quyền theo quy định.",
          ],
        },
      ],
    },
    en: {
      title: "Claims & Compensation Process",
      intro: "When an incident occurs, TXEPRO recommends submitting a support request with evidence for proper review.",
      sections: [
        {
          heading: "How to file a claim",
          items: [
            "Provide order code, incident description, time, and contact information.",
            "Attach photos, delivery evidence, messages, or related documents if available.",
            "Track responses through support channels, live chat, or system tickets.",
          ],
        },
        {
          heading: "Review principles",
          items: [
            "TXEPRO reviews order data, GPS, evidence, and conversation history.",
            "Refunds, holds, or compensation depend on verification results and applicable policies.",
            "Severe cases may lead to account suspension or escalation to authorities.",
          ],
        },
      ],
    },
    zh: {
      title: "投诉与赔付流程",
      intro: "发生异常时，TXEPRO 建议用户提交包含证据的支持请求，以便按流程审核。",
      sections: [
        {
          heading: "如何提交投诉",
          items: [
            "提供运单号、事件描述、发生时间和联系方式。",
            "如有照片、交付凭证、聊天记录或相关文件，请一并提交。",
            "通过支持渠道、在线聊天或系统工单跟进处理结果。",
          ],
        },
        {
          heading: "处理原则",
          items: [
            "TXEPRO 将查看运单数据、GPS、证据和双方沟通记录。",
            "退款、冻结或赔付取决于核实结果和适用政策。",
            "严重情况可能导致账户暂停或移交有关部门处理。",
          ],
        },
      ],
    },
  },
  "trung-tam-ho-tro": {
    vi: {
      title: "Trung tâm hỗ trợ",
      intro: "TXEPRO hỗ trợ người dùng qua live chat, ticket, kênh liên hệ và quy trình xử lý sự cố vận tải.",
      sections: [
        {
          heading: "Các nhóm hỗ trợ",
          items: [
            "Hỗ trợ tài khoản, đăng nhập, xác minh KYC và cập nhật thông tin.",
            "Hỗ trợ vận đơn, định vị GPS, bằng chứng giao nhận và trạng thái chuyến.",
            "Hỗ trợ ví, thanh toán, ký quỹ, hoàn tiền và khiếu nại.",
          ],
        },
        {
          heading: "Thông tin cần chuẩn bị",
          items: [
            "Mã vận đơn hoặc số điện thoại tài khoản để đội ngũ hỗ trợ tra cứu nhanh.",
            "Ảnh chụp màn hình, ảnh hàng hóa hoặc tài liệu liên quan đến sự cố.",
            "Mô tả ngắn gọn vấn đề và mong muốn xử lý.",
          ],
        },
      ],
    },
    en: {
      title: "Help Center",
      intro: "TXEPRO supports users through live chat, tickets, contact channels, and transport incident workflows.",
      sections: [
        {
          heading: "Support categories",
          items: [
            "Account, login, KYC verification, and profile updates.",
            "Orders, GPS tracking, delivery evidence, and trip status.",
            "Wallet, payment, escrow, refunds, and claims.",
          ],
        },
        {
          heading: "What to prepare",
          items: [
            "Order code or account phone number for faster lookup.",
            "Screenshots, cargo photos, or documents related to the issue.",
            "A short description of the issue and preferred resolution.",
          ],
        },
      ],
    },
    zh: {
      title: "帮助中心",
      intro: "TXEPRO 通过在线聊天、工单、联系方式和运输异常流程为用户提供支持。",
      sections: [
        {
          heading: "支持类型",
          items: [
            "账户、登录、KYC 认证和资料更新。",
            "运单、GPS 跟踪、交付凭证和运输状态。",
            "钱包、支付、担保、退款和投诉。",
          ],
        },
        {
          heading: "需要准备的信息",
          items: [
            "运单号或账户手机号，便于快速查询。",
            "截图、货物照片或与问题相关的文件。",
            "问题简述以及期望的处理方式。",
          ],
        },
      ],
    },
  },
  "lien-he": {
    vi: {
      title: "Liên hệ TXEPRO",
      intro: "Bạn có thể liên hệ TXEPRO để được tư vấn hợp tác, hỗ trợ tài khoản, xử lý vận đơn hoặc phản ánh sự cố.",
      sections: [
        {
          heading: "Kênh liên hệ đề xuất",
          items: [
            "Sử dụng live chat trên website để được hướng dẫn nhanh.",
            "Gửi ticket hỗ trợ trong tài khoản khi vấn đề liên quan đến vận đơn hoặc giao dịch.",
            "Chuẩn bị mã vận đơn, số điện thoại và bằng chứng liên quan trước khi liên hệ.",
          ],
        },
      ],
    },
    en: {
      title: "Contact TXEPRO",
      intro: "Contact TXEPRO for partnership, account support, order handling, or incident reports.",
      sections: [
        {
          heading: "Recommended channels",
          items: [
            "Use website live chat for quick guidance.",
            "Submit a support ticket for order or transaction issues.",
            "Prepare order code, phone number, and related evidence before contacting support.",
          ],
        },
      ],
    },
    zh: {
      title: "联系 TXEPRO",
      intro: "您可以联系 TXEPRO 获取合作咨询、账户支持、运单处理或异常反馈。",
      sections: [
        {
          heading: "推荐联系渠道",
          items: [
            "使用网站在线聊天获取快速指引。",
            "如涉及运单或交易问题，请在账户内提交支持工单。",
            "联系前请准备运单号、手机号和相关证据。",
          ],
        },
      ],
    },
  },
};

const fallbackSlug = "gioi-thieu";

export default function InfoPage() {
  const params = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const slug = params.slug || fallbackSlug;
  const page = content[slug]?.[language] || content[slug]?.vi || content[fallbackSlug][language] || content[fallbackSlug].vi;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> TXEPRO
          </Link>

          <section className="mt-8 bg-white border border-slate-200 rounded-lg p-6 md:p-10 shadow-sm">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">{page.title}</h1>
                <p className="mt-3 text-slate-600 leading-7 font-medium">{page.intro}</p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-lg font-bold text-slate-950">{section.heading}</h2>
                  <ul className="mt-4 space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7 text-slate-600 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
