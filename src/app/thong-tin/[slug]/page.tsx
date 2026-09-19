"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Shield,
  ShieldCheck,
  Truck,
  Package,
  MapPin,
  Clock,
  Wallet,
  UserCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Sparkles,
  Layers,
  Scale,
  RefreshCw,
  Search,
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import type { Language } from "@/utils/translations";

interface CalloutBox {
  title: string;
  content: string;
  type?: "info" | "warning" | "success";
}

interface InfoSection {
  heading: string;
  badge?: string;
  description?: string;
  items: string[];
  callout?: CalloutBox;
}

interface QuickStat {
  label: string;
  value: string;
}

interface InfoPage {
  badge: string;
  title: string;
  intro: string;
  quickStats?: QuickStat[];
  sections: InfoSection[];
}

const content: Record<string, Record<Language, InfoPage>> = {
  "gioi-thieu": {
    vi: {
      badge: "Hệ Sinh Thái Vận Tải Số Hóa TXEPRO",
      title: "Giới Thiệu Dự Án TXEPRO",
      intro:
        "TXEPRO là nền tảng công nghệ logistics tiên phong tại Việt Nam, kết nối trực tiếp Chủ hàng và Đối tác Tài xế theo thời gian thực nhằm tối ưu hóa các chuyến xe chạy rỗng chiều về, giảm thiểu lãng phí và nâng cao hiệu quả vận tải toàn diện.",
      quickStats: [
        { label: "Tiết kiệm chi phí cước", value: "Tới 35%" },
        { label: "Tăng thu nhập tài xế", value: "Tới 40%" },
        { label: "Bảo chứng thanh toán", value: "MB Bank 100%" },
        { label: "Định vị vệ tinh", value: "GPS 24/7" },
      ],
      sections: [
        {
          heading: "Bối cảnh thị trường & Vấn đề TXEPRO giải quyết",
          badge: "Thực Trạng Ngành",
          description:
            "Ngành vận tải đường bộ Việt Nam đang đối mặt với nhiều bất cập lớn ảnh hưởng trực tiếp đến chi phí của doanh nghiệp và thu nhập của tài xế.",
          items: [
            "Hơn 60% xe tải lưu thông liên tỉnh chạy rỗng chiều về sau khi trả hàng, gây thất thoát hàng chục nghìn tỷ đồng chi phí logistics mỗi năm và làm gia tăng phát thải khí nhà kính.",
            "Chủ hàng cá nhân và doanh nghiệp vừa & nhỏ (SME) gặp nhiều rào cản khi tìm kiếm xe uy tín, khó đàm phán cước phí minh bạch và hoàn toàn thiếu công cụ theo dõi vị trí hàng hóa trực tiếp.",
            "Rủi ro thất thoát hàng hóa, phát sinh phụ phí bến bãi không kiểm soát và không có cơ chế trung gian bảo đảm dòng tiền cước vận chuyển giữa hai bên.",
          ],
          callout: {
            title: "Mục tiêu trọng tâm",
            content:
              "TXEPRO ra đời với sứ mệnh xóa bỏ tình trạng xe chạy rỗng, biến mỗi cung đường thành cơ hội gia tăng giá trị kinh tế cho cả chủ hàng và đối tác vận tải.",
            type: "info",
          },
        },
        {
          heading: "Sứ mệnh, Tầm nhìn & Giá trị cốt lõi",
          badge: "Định Hướng Chiến Lược",
          items: [
            "Sứ mệnh: Số hóa toàn diện mạng lưới logistics đường bộ Việt Nam, xây dựng môi trường vận chuyển thông minh, minh bạch và an toàn nhất thông qua sức mạnh công nghệ số.",
            "Tầm nhìn: Trở thành sàn thương mại điện tử dịch vụ vận tải hàng hóa đa phương thức hàng đầu Việt Nam và vươn tầm khu vực Đông Nam Á trong vòng 5 năm tới.",
            "Minh bạch cước phí: Mọi chi phí, phụ phí và chiết khấu sàn được niêm yết rõ ràng trước chuyến đi, không có chi phí ẩn.",
            "An toàn tuyệt đối: 100% tài xế được thẩm định hồ sơ pháp lý qua eKYC và dòng tiền cước được bảo vệ bằng cơ chế ký quỹ MB Bank.",
          ],
        },
        {
          heading: "Các trụ cột công nghệ & Tính năng đột phá",
          badge: "Công Nghệ Tiên Phong",
          description:
            "Hệ sinh thái TXEPRO được xây dựng trên nền tảng kiến trúc hiện đại, tích hợp trí tuệ nhân tạo và dịch vụ định vị chuẩn xác.",
          items: [
            "Thuật toán ghép chuyến rỗng (Empty Return Route Engine): Tự động phân tích tọa độ và lịch trình chiều về của tài xế, gợi ý đơn hàng tiện chuyến phù hợp với mức giá ưu đãi nhất.",
            "Bản đồ định vị GPS trực tiếp 24/7: Cung cấp góc nhìn thời gian thực cho chủ hàng, dự báo chính xác thời gian xe đến (ETA) và lưu vết toàn bộ lộ trình di chuyển.",
            "Ký quỹ bảo chứng giao dịch (Escrow) cùng MB Bank: Tiền cước được phong tỏa tại ngân hàng và chỉ tự động giải tỏa vào ví tài xế sau khi người nhận đã nghiệm thu hàng hóa.",
            "Quy chuẩn định danh điện tử eKYC đa tầng: Kiểm soát chặt chẽ Căn cước công dân gắn chip, Giấy phép lái xe, Đăng ký xe, Đăng kiểm và Bảo hiểm TNDS bắt buộc.",
            "Biên bản giao nhận điện tử (e-POD): Hỗ trợ chụp ảnh hàng hóa tại điểm nhận và điểm trả, ký nhận trực tiếp trên màn hình cảm ứng để lưu trữ hồ sơ số vĩnh viễn.",
          ],
        },
        {
          heading: "Hệ sinh thái phương tiện đa dạng",
          badge: "Đội Xe Toàn Diện",
          items: [
            "Xe tải thùng kín & thùng mui bạt: Đa dạng tải trọng từ 500kg, 1.5 tấn, 3.5 tấn, 5 tấn, 8 tấn đến 15 - 30 tấn chở hàng tiêu dùng, bách hóa và vật liệu xây dựng.",
            "Xe tải đông lạnh chuyên dụng: Duy trì dải nhiệt độ chuẩn từ -18°C đến 5°C, chuyên chở thủy hải sản, nông sản tươi sống và dược phẩm y tế.",
            "Xe Container & Đầu kéo: Phục vụ vận chuyển khối lượng lớn liên tỉnh Bắc - Nam và kết nối hàng hóa xuất nhập khẩu tại các cụm cảng công nghiệp.",
            "Xe bán tải & Ô tô khách: Đáp ứng nhu cầu chuyển phát bưu kiện hỏa tốc, gửi đồ đạc gọn nhẹ hoặc xe hợp đồng vận chuyển kết hợp theo lộ trình.",
          ],
        },
      ],
    },
    en: {
      badge: "TXEPRO Digital Freight Ecosystem",
      title: "About TXEPRO Project",
      intro:
        "TXEPRO is Vietnam's leading digital freight and logistics matching platform, connecting shippers and transport drivers in real-time to optimize empty return hauls, minimize waste, and elevate shipping efficiency.",
      quickStats: [
        { label: "Freight cost savings", value: "Up to 35%" },
        { label: "Driver earnings boost", value: "Up to 40%" },
        { label: "Payment escrow", value: "MB Bank 100%" },
        { label: "Live tracking", value: "24/7 Satellite GPS" },
      ],
      sections: [
        {
          heading: "Market Landscape & Problems We Solve",
          badge: "Industry Realities",
          items: [
            "Over 60% of long-haul trucks in Vietnam run empty on their return trips, causing massive logistics inefficiencies and heavy carbon emissions.",
            "SMEs and individual shippers struggle to find reliable carriers with transparent pricing, lacking real-time visibility over cargo in transit.",
            "Cargo loss risks, unexpected road fees, and absence of secure payment escrow mechanisms between transacting parties.",
          ],
        },
        {
          heading: "Mission, Vision & Core Values",
          badge: "Strategic Direction",
          items: [
            "Mission: Digitize Vietnam's road logistics ecosystem into the smartest, most transparent, and secure freight network.",
            "Vision: Become the premier multimodal logistics marketplace in Southeast Asia within the next 5 years.",
            "Transparent pricing: Clear rates and fees before booking with zero hidden charges.",
            "Absolute security: Rigorous eKYC credential screening and bank-backed escrow payment custody.",
          ],
        },
      ],
    },
    zh: {
      badge: "TXEPRO 数字化货运生态系统",
      title: "TXEPRO 项目介绍",
      intro:
        "TXEPRO 是越南领先的数字化公路货运匹配平台，通过实时连接货主与司机，重点盘活返程空车运力，降低物流浪费，全面提升货运周转效率。",
      quickStats: [
        { label: "货主运费节省", value: "最高达 35%" },
        { label: "司机收入提升", value: "最高达 40%" },
        { label: "资金安全托管", value: "MB Bank 100%" },
        { label: "卫星在途追踪", value: "24/7 实时 GPS" },
      ],
      sections: [
        {
          heading: "行业现状与解决痛点",
          badge: "市场背景",
          items: [
            "越南长途货运卡车超过 60% 回程处于空驶状态，造成巨大的物流资源浪费及过量碳排放。",
            "中小企业与货主传统找车周期长、运费缺乏透明度，缺乏实时货物在途轨迹监控。",
            "货物损坏丢失风险高、附加费用不确定，且交易双方缺乏可靠的第三方资金担保机制。",
          ],
        },
        {
          heading: "使命、愿景与核心价值",
          badge: "战略定位",
          items: [
            "使命：通过数字化技术全面赋能越南公路货运，打造最智能、透明、安全的货运协作生态圈。",
            "愿景：在未来 5 年内成为越南及东南亚领先的多式联运数字物流交易平台。",
            "透明计费：运单费用预先清晰公示，杜绝一切隐形加价。",
            "严格合规：司机全员经 eKYC 实名及营运资质认证，交易资金全程托管。",
          ],
        },
      ],
    },
  },

  "quy-che-hoat-dong": {
    vi: {
      badge: "Quy Chuẩn Vận Hành & Khung Pháp Lý",
      title: "Quy Chế Hoạt Động Sàn Vận Tải TXEPRO",
      intro:
        "Quy chế này quy định toàn bộ nguyên tắc hoạt động, quyền hạn, nghĩa vụ và trách nhiệm pháp lý của Chủ hàng, Đối tác Tài xế và Ban điều hành nền tảng TXEPRO trong việc tham gia kết nối và giao dịch vận tải điện tử.",
      quickStats: [
        { label: "Khung pháp lý TMĐT", value: "Nghị định 52/2013" },
        { label: "Bảo vệ dữ liệu", value: "Nghị định 13/2023" },
        { label: "Thẩm định đối tác", value: "eKYC 100%" },
        { label: "Xử lý vi phạm", value: "Minh bạch 24/7" },
      ],
      sections: [
        {
          heading: "Nguyên tắc chung & Tư cách thành viên",
          badge: "Điều Kiện Tham Gia",
          items: [
            "TXEPRO vận hành theo mô hình sàn giao dịch thương mại điện tử kết nối dịch vụ vận chuyển hàng hóa, tuân thủ Luật Giao thông Đường bộ và quy định thương mại điện tử hiện hành.",
            "Mọi cá nhân từ đủ 18 tuổi hoặc doanh nghiệp có tư cách pháp nhân hợp lệ đều có quyền đăng ký tài khoản tham gia hệ thống.",
            "Thành viên có nghĩa vụ tự bảo mật thông tin đăng nhập, mật khẩu và mã OTP xác thực, đồng thời chịu trách nhiệm hoàn toàn về các giao dịch phát sinh dưới tài khoản của mình.",
          ],
        },
        {
          heading: "Quy định dành riêng cho Chủ hàng",
          badge: "Trách Nhiệm Chủ Hàng",
          items: [
            "Khai báo trung thực và chính xác thông tin hàng hóa bao gồm: Tên hàng, trọng tải (kg/tấn), thể tích (m³), quy cách đóng gói, điểm lấy hàng, điểm giao hàng và thông tin người nhận.",
            "Tuyệt đối nghiêm cấm đăng tải hoặc vận chuyển các mặt hàng cấm: Vũ khí, chất nổ, ma túy, động vật hoang dã nguy cấp, văn hóa phẩm đồi trụy, hàng giả hoặc hàng lậu trốn thuế.",
            "Có nghĩa vụ ký quỹ đầy đủ tiền cước trước khi tài xế khởi hành và thực hiện nghiệm thu hàng hóa kịp thời khi xe đến điểm giao.",
          ],
          callout: {
            title: "Lưu ý hàng cấm",
            content:
              "TXEPRO có quyền phối hợp cùng cơ quan công an xử lý hình sự đối với bất kỳ tài khoản nào cố tình gửi hàng cấm qua sàn.",
            type: "warning",
          },
        },
        {
          heading: "Quy định dành riêng cho Đối tác Tài xế",
          badge: "Tiêu Chuẩn Tài Xế",
          items: [
            "Bắt buộc hoàn tất quy trình xác minh điện tử eKYC: CCCD gắn chip, Giấy phép lái xe phù hợp phân hạng phương tiện, Giấy đăng ký xe (Cà-vẹt), Đăng kiểm an toàn kỹ thuật và Bảo hiểm TNDS còn hạn.",
            "Sử dụng đúng phương tiện và biển số xe đã đăng ký trên hệ thống; không được tự ý sang nhượng đơn hàng hoặc thay đổi tài xế nếu chưa được chủ hàng chấp thuận bằng văn bản.",
            "Bật định vị GPS trong suốt chuyến đi và tải lên bằng chứng giao nhận điện tử e-POD có chữ ký của người nhận khi hoàn tất đơn hàng.",
          ],
        },
        {
          heading: "Cơ chế tài chính, Ký quỹ & Biểu phí nền tảng",
          badge: "Minh Bạch Tài Chính",
          items: [
            "Toàn bộ tiền cước được tạm phong tỏa an toàn trong tài khoản ký quỹ liên kết Ngân hàng Quân Đội (MB Bank) khi tài xế nhận đơn.",
            "Tiền cước chỉ được giải ngân vào Ví điện tử của tài xế sau khi chủ hàng xác nhận e-POD hoặc sau 24 giờ kể từ thời điểm giao hàng hợp lệ mà không phát sinh khiếu nại.",
            "Mức phí dịch vụ nền tảng (Platform fee) được công bố rõ ràng và trừ tự động theo từng cuốc xe thành công, không phát sinh chi phí phụ ngầm.",
          ],
        },
        {
          heading: "Chế tài xử lý vi phạm & Kiểm soát an toàn",
          badge: "Kỷ Luật Sàn",
          items: [
            "Cảnh cáo và hạ điểm tín nhiệm đối với hành vi trễ hẹn lấy hàng hoặc hủy chuyến không có lý do chính đáng.",
            "Khóa tài khoản tạm thời từ 7 đến 30 ngày đối với hành vi thỏa thuận ép giá ngoài ứng dụng, gian lận định vị GPS hoặc cư xử thiếu chuẩn mực.",
            "Khóa tài khoản vĩnh viễn và chuyển hồ sơ sang cơ quan điều tra đối với các hành vi chiếm đoạt hàng hóa, giả mạo bằng lái hoặc cố tình vi phạm pháp luật.",
          ],
        },
      ],
    },
    en: {
      badge: "Operational Norms & Legal Framework",
      title: "TXEPRO Operating Rules",
      intro:
        "These rules govern the principles, rights, obligations, and legal liabilities of Shippers, Carrier Drivers, and the TXEPRO Platform Administration in electronic freight matching transactions.",
      quickStats: [
        { label: "E-Commerce Law", value: "Decree 52/2013" },
        { label: "Privacy Protection", value: "Decree 13/2023" },
        { label: "Driver Screening", value: "100% eKYC" },
        { label: "Dispute Support", value: "24/7 Verified" },
      ],
      sections: [
        {
          heading: "General Principles & Membership Eligibility",
          badge: "Eligibility",
          items: [
            "TXEPRO operates in full compliance with Vietnamese road transport laws and e-commerce marketplace regulations.",
            "Individuals aged 18+ and legally registered business entities are eligible to open accounts.",
            "Users must secure login credentials and remain responsible for transactions performed under their accounts.",
          ],
        },
        {
          heading: "Carrier Driver Regulations",
          badge: "Driver Obligations",
          items: [
            "Mandatory eKYC verification: National ID, valid driving license, vehicle registration, and safety inspection.",
            "Must operate the declared vehicle and plate number; subcontracting without consent is strictly prohibited.",
            "Keep GPS tracking active during transport and capture electronic proof of delivery (e-POD).",
          ],
        },
      ],
    },
    zh: {
      badge: "运营规范与法律合规准则",
      title: "TXEPRO 平台运营规则",
      intro:
        "本规则详尽阐明货主、司机及 TXEPRO 平台管理方在公路货运撮合与交易流转过程中的各项原则、权利、法定义务与违约责任。",
      quickStats: [
        { label: "电商运营合规", value: "第 52/2013 号令" },
        { label: "数据隐私保护", value: "第 13/2023 号令" },
        { label: "实名资质认证", value: "100% eKYC" },
        { label: "争议仲裁机制", value: "全天候 24/7" },
      ],
      sections: [
        {
          heading: "总则与会员资格",
          badge: "准入资格",
          items: [
            "TXEPRO 严格遵守越南公路运输法律法规及电子商务平台规范。",
            "年满 18 周岁的自然人或合法注册的企业法人均可注册平台账户。",
            "会员应妥善保管登录密码及 OTP 验证码，并对该账户下的一切交易行为负全责。",
          ],
        },
        {
          heading: "承运司机管理规范",
          badge: "司机准则",
          items: [
            "必须完成强制性 eKYC 实名及资质核验（公民身份证、对应准驾车型驾驶证、车辆行驶证及年检证）。",
            "必须使用已报备的车辆及号牌营运，严禁未经货主同意私自转包或更换司机。",
            "运输途中必须全程开启 GPS 轨迹定位，并在送达后拍摄并上传电子签收凭单（e-POD）。",
          ],
        },
      ],
    },
  },

  "huong-dan-chu-hang": {
    vi: {
      badge: "Cẩm Nang Thao Tác Cho Chủ Hàng",
      title: "Hướng Dẫn Dành Cho Chủ Hàng",
      intro:
        "Hướng dẫn chi tiết từng bước giúp cá nhân và doanh nghiệp dễ dàng đăng đơn vận chuyển, tìm xe ghép rỗng chiều về giá tốt, giám sát hành trình vệ tinh GPS và nghiệm thu giao nhận an toàn trên TXEPRO.",
      quickStats: [
        { label: "Thời gian đăng đơn", value: "Dưới 60 giây" },
        { label: "Tỷ lệ tìm thấy xe", value: "Trên 98%" },
        { label: "Theo dõi hành trình", value: "GPS thời gian thực" },
        { label: "Bảo đảm cước phí", value: "Escrow MB Bank" },
      ],
      sections: [
        {
          heading: "Bước 1: Đăng ký & Kích hoạt tài khoản",
          badge: "Khởi Đầu",
          items: [
            "Tải ứng dụng TXEPRO Shipper trên App Store hoặc Google Play, hoặc truy cập website chính thức txeppro.vn.",
            "Nhập số điện thoại chính chủ và điền mã OTP xác thực tức thời qua SMS hoặc Zalo.",
            "Cập nhật thông tin cá nhân hoặc thông tin doanh nghiệp (địa chỉ, mã số thuế) để nhận hóa đơn điện tử GTGT tự động sau mỗi chuyến hàng.",
          ],
        },
        {
          heading: "Bước 2: Tạo đơn vận chuyển thông minh",
          badge: "Đăng Đơn",
          items: [
            "Nhập địa chỉ lấy hàng và địa chỉ trả hàng (hệ thống tự động đồng bộ bản đồ Google Maps và tính khoảng cách chính xác).",
            "Mô tả thông số hàng hóa: Tên hàng, trọng lượng (kg/tấn), thể tích (m³), tính chất hàng (hàng khô, hàng cồng kềnh, hàng lạnh, hàng dễ vỡ).",
            "Chọn loại xe yêu cầu: Xe tải thùng kín, thùng bạt, xe đông lạnh, xe container hoặc ô tô chở khách.",
            "Đưa ra mức giá đề xuất (Budget) hoặc chọn chế độ 'Thương lượng' để các bác tài chạy chiều về gửi báo giá cạnh tranh nhất.",
          ],
          callout: {
            title: "Mẹo tối ưu cước phí",
            content:
              "Đăng đơn trước từ 12 - 24 giờ giúp thuật toán ưu tiên ghép vào các chuyến xe chạy rỗng chiều về, tiết kiệm đến 35% chi phí so với gọi xe thông thường.",
            type: "success",
          },
        },
        {
          heading: "Bước 3: Chọn tài xế & Ký quỹ an toàn",
          badge: "Khớp Lệnh & Ký Quỹ",
          items: [
            "Xem danh sách tài xế báo giá: Kiểm tra đánh giá sao, số chuyến đã chạy, loại xe, biển số và ảnh thực tế phương tiện.",
            "Nhấn 'Chấp nhận tài xế' và tiến hành ký quỹ bảo đảm cước phí qua Ví TXEPRO hoặc chuyển khoản nhanh VietQR MB Bank.",
            "Tiền cước được khóa an toàn trong tài khoản trung gian của MB Bank; tài xế hoàn toàn không thể rút tiền trước khi bạn nhận đủ hàng.",
          ],
        },
        {
          heading: "Bước 4: Theo dõi GPS trực tiếp & Nghiệm thu",
          badge: "Giám Sát & Bàn Giao",
          items: [
            "Mở màn hình 'Tra cứu vận đơn' để theo dõi xe di chuyển từng phút trên bản đồ vệ tinh.",
            "Nhận thông báo khi tài xế đến lấy hàng, kiểm tra ảnh chụp hiện trạng hàng hóa do tài xế tải lên.",
            "Khi hàng tới nơi, người nhận kiểm tra số lượng, hiện trạng và ký vào biên bản giao nhận điện tử e-POD trên điện thoại tài xế.",
            "Chủ hàng kiểm tra ảnh chụp e-POD và bấm 'Xác nhận hoàn thành' để giải tỏa tiền cước cho tài xế, sau đó để lại đánh giá sao.",
          ],
        },
      ],
    },
    en: {
      badge: "Shipper Operational Handbook",
      title: "Shipper Guide",
      intro:
        "Step-by-step guidance for individual and business shippers to post freight orders, match with empty return trucks, track live satellite GPS, and complete safe escrow deliveries on TXEPRO.",
      quickStats: [
        { label: "Posting time", value: "Under 60 seconds" },
        { label: "Matching success", value: "Over 98%" },
        { label: "Cargo visibility", value: "Real-Time GPS" },
        { label: "Payment security", value: "MB Bank Escrow" },
      ],
      sections: [
        {
          heading: "Step 1: Account Setup & Activation",
          badge: "Getting Started",
          items: [
            "Download TXEPRO Shipper app or access txeppro.vn directly.",
            "Register quickly with your phone number and verify with instant OTP.",
            "Add business details and tax code for automated VAT e-invoicing.",
          ],
        },
        {
          heading: "Step 2: Smart Order Creation",
          badge: "Order Creation",
          items: [
            "Specify pickup and dropoff points with Google Maps geocoding.",
            "Input cargo specifications: category, weight (kg/tons), volume (m³), and handling requirements.",
            "Select matching vehicle types: dry van, tarpaulin truck, reefer, container, or passenger vehicle.",
            "Set target budget or choose 'Negotiable' for competitive return-haul driver offers.",
          ],
        },
      ],
    },
    zh: {
      badge: "货主实用操作手册",
      title: "货主使用指南",
      intro:
        "为个人及企业货主提供详尽的分步指引，轻松发布货运需求、优选返程空车运力、实时跟踪 GPS 轨迹，并通过银行担保安全交付。",
      quickStats: [
        { label: "发布耗时", value: "60 秒内完成" },
        { label: "匹配成功率", value: "高达 98% 以上" },
        { label: "在途监控", value: "全程实时卫星 GPS" },
        { label: "资金安全", value: "MB Bank 托管" },
      ],
      sections: [
        {
          heading: "步骤一：账户注册与激活",
          badge: "初始准备",
          items: [
            "下载 TXEPRO Shipper 客户端或访问官方网站 txeppro.vn。",
            "输入手机号码并通过短信/Zalo OTP 快速完成验证。",
            "完善个人或企业税号信息，以便自动开具电子增值税发票。",
          ],
        },
        {
          heading: "步骤二：智能发布运单",
          badge: "需求发布",
          items: [
            "输入装卸货详细地址（系统联动地图自动计算距离与最优路线）。",
            "录入货物信息：品名、重量、立方体积及特殊温控/易碎要求。",
            "选择所需车型（箱式货车、高栏车、冷藏车或集装箱卡车）。",
            "输入意向预算或选择“议价模式”接收沿线返程司机的竞争性报价。",
          ],
        },
      ],
    },
  },

  "huong-dan-tai-xe": {
    vi: {
      badge: "Cẩm Nang Thao Tác Cho Bác Tài",
      title: "Hướng Dẫn Dành Cho Đối Tác Tài Xế",
      intro:
        "Hướng dẫn toàn diện giúp các bác tài hoàn tất hồ sơ eKYC nhanh chóng, đăng tin chuyến xe rỗng chiều về, tiếp nhận đơn hàng giá tốt và rút tiền cước về tài khoản ngân hàng 24/7.",
      quickStats: [
        { label: "Xét duyệt hồ sơ", value: "15 - 30 phút" },
        { label: "Tăng thêm thu nhập", value: "Tới 40% / tháng" },
        { label: "Giải ngân tiền cước", value: "Tức thì sau giao" },
        { label: "Rút tiền ngân hàng", value: "NAPAS 24/7" },
      ],
      sections: [
        {
          heading: "Bước 1: Chuẩn bị hồ sơ & Xác thực eKYC",
          badge: "Thẩm Định eKYC",
          items: [
            "Tải ứng dụng TXEPRO Driver trên App Store hoặc Google Play và đăng ký bằng số điện thoại.",
            "Chụp ảnh rõ nét hai mặt Căn cước công dân (CCCD) gắn chip còn hạn.",
            "Chụp Giấy phép lái xe hợp lệ phù hợp với phân hạng phương tiện (hạng B2, C, D, E, FC).",
            "Tải lên Giấy đăng ký xe (Cà-vẹt), Giấy chứng nhận kiểm định an toàn kỹ thuật (Đăng kiểm) và Bảo hiểm trách nhiệm dân sự bắt buộc.",
            "Hệ thống AI đối soát tự động kết hợp đội ngũ thẩm định phê duyệt tài khoản trong vòng 15 - 30 phút.",
          ],
        },
        {
          heading: "Bước 2: Đăng tin tuyến xe rỗng để nhận đơn",
          badge: "Đăng Chuyến Rỗng",
          items: [
            "Sau khi hoàn thành giao hàng chiều đi, mở ứng dụng và chọn 'Đăng tin chuyến xe rỗng chiều về'.",
            "Nhập điểm xuất phát chiều về, điểm đến và khung giờ dự kiến xe bắt đầu khởi hành.",
            "Chọn tải trọng còn trống và thiết lập bán kính sẵn sàng ghé lấy hàng (từ 5km đến 30km quanh tuyến).",
            "Bật chế độ 'Nhận đơn tự động': Ứng dụng sẽ ưu tiên thông báo đơn hàng của các chủ hàng nằm ngay trên cung đường bạn chạy.",
          ],
          callout: {
            title: "Lợi ích chuyến xe rỗng",
            content:
              "Tận dụng xe chạy rỗng chiều về giúp bác tài bù đắp toàn bộ chi phí xăng dầu, vé cầu đường và gia tăng thu nhập ròng từ 10 - 25 triệu đồng mỗi tháng.",
            type: "success",
          },
        },
        {
          heading: "Bước 3: Nhận đơn hàng & Vận hành an toàn",
          badge: "Vận Chuyển An Toàn",
          items: [
            "Kiểm tra thông số đơn hàng: Điểm nhận, điểm trả, loại hàng, khối lượng và trạng thái 'Đã ký quỹ 100%' qua MB Bank.",
            "Nhấn 'Nhận chuyến' và chủ động gọi điện cho chủ hàng để thống nhất giờ giấc bốc xếp.",
            "Khi đến điểm lấy hàng: Chụp ảnh hiện trạng kiện hàng khi đã xếp lên xe để bảo vệ quyền lợi cá nhân nếu phát sinh tranh chấp.",
            "Giữ ứng dụng chạy ngầm và duy trì GPS trong suốt quá trình lưu thông để hệ thống cập nhật tọa độ liên tục.",
          ],
        },
        {
          heading: "Bước 4: Bàn giao hàng & Rút tiền cước 24/7",
          badge: "Nghiệm Thu & Nhận Cước",
          items: [
            "Khi đến nơi, cùng người nhận kiểm tra kiện hàng còn nguyên vẹn.",
            "Mở tính năng 'Ký nhận e-POD' trên ứng dụng, đưa người nhận ký tên và chụp ảnh người nhận cùng kiện hàng đã bàn giao.",
            "Nhấn 'Xác nhận hoàn thành giao hàng'. Tiền cước được giải ngân ngay lập tức vào Ví điện tử TXEPRO của bạn.",
            "Rút tiền miễn phí về bất kỳ tài khoản ngân hàng nào tại Việt Nam qua cổng NAPAS 24/7, tiền về tài khoản chỉ trong 30 giây.",
          ],
        },
      ],
    },
    en: {
      badge: "Driver Operational Handbook",
      title: "Driver Guide",
      intro:
        "Comprehensive operational handbook for drivers: complete eKYC credentials, post empty return routes, claim high-paying orders, and withdraw earnings to bank accounts 24/7.",
      quickStats: [
        { label: "Credential review", value: "15 - 30 minutes" },
        { label: "Earnings boost", value: "Up to 40% / month" },
        { label: "Payout release", value: "Instant on delivery" },
        { label: "Bank withdrawal", value: "NAPAS 24/7" },
      ],
      sections: [
        {
          heading: "Step 1: Credential Prep & eKYC Verification",
          badge: "eKYC Screening",
          items: [
            "Download TXEPRO Driver app on iOS or Android.",
            "Submit clear photos of chip-based National ID and valid Driving License (B2, C, D, E, FC).",
            "Upload vehicle registration, safety inspection, and compulsory civil liability insurance.",
            "AI automated verification combined with human audit approves profiles within 15 - 30 minutes.",
          ],
        },
        {
          heading: "Step 2: Post Empty Return Hauls",
          badge: "Empty Haul Posting",
          items: [
            "After unloading cargo, open the app and post your empty return leg.",
            "Specify departure, destination, and anticipated start window.",
            "Define pickup radius (5km - 30km) along your route.",
            "Enable auto-matching to receive push notifications for fitting orders on your path.",
          ],
        },
      ],
    },
    zh: {
      badge: "司机实操进阶指南",
      title: "司机使用指南",
      intro:
        "为车主及承运司机提供全面实操指南：快速完成 eKYC 认证审核、一键发布返程空车、接收高收益顺风货源，并实现运费 24/7 极速提现。",
      quickStats: [
        { label: "资质审核耗时", value: "15 - 30 分钟" },
        { label: "月度增收潜力", value: "最高提升 40%" },
        { label: "运费到账时效", value: "交付即时解冻" },
        { label: "银行卡提现", value: "NAPAS 24/7 秒级" },
      ],
      sections: [
        {
          heading: "步骤一：资料筹备与 eKYC 资质核验",
          badge: "资质核验",
          items: [
            "在应用商店下载并安装 TXEPRO Driver 客户端。",
            "上传真实有效的公民身份证、对应准驾级别驾驶证照片。",
            "提交车辆行驶证、安全技术检验合格标志及强制交强险保单。",
            "系统 AI 自动识别并结合人工客服在 15 - 30 分钟内完成快速审核。",
          ],
        },
        {
          heading: "步骤二：发布返程空车路由",
          badge: "空车发布",
          items: [
            "完成去程卸货后，进入应用点击“发布返程空车”。",
            "设定返程出发地、目的地及期望发车时间窗口。",
            "设置沿线顺路揽货半径（支持 5 公里至 30 公里灵活配置）。",
            "开启实时接单推送，系统将优先向您推荐匹配度最高的沿线货源。",
          ],
        },
      ],
    },
  },

  "thanh-toan-ky-quy": {
    vi: {
      badge: "Hợp Tác Chiến Lược Escrow Cùng MB Bank",
      title: "Chính Sách Thanh Toán & Ký Quỹ Bảo Chứng",
      intro:
        "Cơ chế ký quỹ bảo đảm dòng tiền (Escrow Payment) độc quyền của TXEPRO giúp loại bỏ hoàn toàn nỗi lo bùng cước, chây ì thanh toán hay giao nhận không đúng cam kết, đem lại sự an tâm tuyệt đối cho cả Chủ hàng và Tài xế.",
      quickStats: [
        { label: "Ngân hàng bảo chứng", value: "MB Bank" },
        { label: "Giải ngân tiền cước", value: "Tự động sau e-POD" },
        { label: "Nạp tiền tức thời", value: "VietQR 24/7" },
        { label: "Bảo đảm an toàn", value: "100% Giao dịch" },
      ],
      sections: [
        {
          heading: "Cơ chế Ký quỹ Escrow vận hành như thế nào?",
          badge: "Cơ Chế Escrow",
          description:
            "Ký quỹ là giải pháp tài chính trung gian được TXEPRO phối hợp vận hành cùng Ngân hàng Quân Đội (MB Bank).",
          items: [
            "Khi chủ hàng chấp nhận tài xế, toàn bộ số tiền cước vận chuyển được chuyển vào tài khoản trung gian ký quỹ được ngân hàng MB Bank phong tỏa an toàn.",
            "Tài xế nhìn thấy trạng thái 'Đã ký quỹ 100%' trên ứng dụng và hoàn toàn an tâm khởi hành vì tiền cước đã được khóa bảo chứng.",
            "Tiền cước KHÔNG được chuyển cho tài xế ngay lập tức, mà chỉ được giải phóng sau khi người nhận đã kiểm tra hàng hóa và xác nhận biên bản giao nhận e-POD.",
          ],
          callout: {
            title: "Cam kết bảo vệ vốn",
            content:
              "Nếu tài xế tự ý bỏ chuyến hoặc không đến lấy hàng, số tiền ký quỹ được hoàn trả 100% về tài khoản chủ hàng ngay lập tức.",
            type: "info",
          },
        },
        {
          heading: "Lợi ích kép cho cả Chủ hàng và Tài xế",
          badge: "Giá Trị Thực Tiễn",
          items: [
            "Đối với Chủ hàng: Tuyệt đối không lo bị chiếm dụng vốn hoặc mất tiền oan khi chất lượng vận chuyển không đạt thỏa thuận.",
            "Đối với Tài xế: Xóa bỏ hoàn toàn nỗi lo chạy xe đường dài vất vả nhưng bị nợ cước, bùng tiền hoặc bị ép bớt giá vô lý khi giao hàng.",
            "Đối với Doanh nghiệp: Tự động hóa chứng từ đối soát, minh bạch dòng tiền kế toán và hỗ trợ xuất hóa đơn điện tử GTGT hợp lệ.",
          ],
        },
        {
          heading: "Các phương thức thanh toán & Nạp ví hỗ trợ",
          badge: "Cổng Thanh Toán",
          items: [
            "Chuyển khoản liên ngân hàng 24/7 qua mã VietQR liên kết MB Bank (khớp lệnh tự động trong 5 giây không cần duyệt thủ công).",
            "Thanh toán trực tiếp bằng số dư Ví điện tử TXEPRO tích hợp sẵn trong ứng dụng.",
            "Thẻ ghi nợ nội địa NAPAS và thẻ thanh toán quốc tế (Visa, MasterCard, JCB).",
          ],
        },
        {
          heading: "Quy trình giải ngân cước & Rút tiền về ngân hàng",
          badge: "Quy Trình Rút Tiền",
          items: [
            "Giải ngân tự động: Diễn ra ngay sau khi chủ hàng nhấn nút 'Xác nhận giao hàng thành công'.",
            "Giải ngân mặc định sau 24 giờ: Nếu tài xế đã tải lên ảnh e-POD đầy đủ và chủ hàng không có phản hồi khiếu nại trong vòng 24 giờ kể từ thời điểm giao hàng.",
            "Rút tiền về tài khoản ngân hàng: Tài xế được rút tiền 24/7/365, không giới hạn số lần và không bị giữ vốn lưu động.",
          ],
        },
        {
          heading: "Chính sách xử lý sự cố & Đóng băng tài khoản",
          badge: "Xử Lý Tranh Chấp",
          items: [
            "Hủy chuyến hợp lệ trước giờ lấy hàng: Hoàn trả 100% tiền ký quỹ về ví chủ hàng trong vòng 5 phút.",
            "Khi có khiếu nại về hư hỏng hay thất lạc hàng hóa: Khoản tiền ký quỹ lập tức bị đóng băng (Freeze) để Ban điều hành đối soát và bồi thường minh bạch.",
          ],
        },
      ],
    },
    en: {
      badge: "MB Bank Strategic Escrow Alliance",
      title: "Payment & Escrow Custody Policy",
      intro:
        "TXEPRO's proprietary bank-backed escrow custody eliminates fare default, unpaid freight, and delivery breaches, providing ironclad trust for both Shippers and Carrier Drivers.",
      quickStats: [
        { label: "Custody partner", value: "MB Bank" },
        { label: "Payout release", value: "Automated on e-POD" },
        { label: "Deposit speed", value: "VietQR 24/7" },
        { label: "Capital protection", value: "100% Covered" },
      ],
      sections: [
        {
          heading: "How Escrow Custody Works",
          badge: "Escrow Mechanics",
          items: [
            "Shipper funds are held securely in a quarantined MB Bank custody account upon driver acceptance.",
            "Drivers see verified '100% Escrow Funded' status before rolling out wheels.",
            "Funds are only released once the recipient inspects cargo and signs the digital e-POD.",
          ],
        },
        {
          heading: "Payout & Withdrawal Rules",
          badge: "Withdrawal Operations",
          items: [
            "Instant release upon shipper confirmation or automated 24-hour settlement with clean e-POD.",
            "Zero-fee 24/7 bank withdrawals via NAPAS network within 30 seconds.",
          ],
        },
      ],
    },
    zh: {
      badge: "MB Bank 战略资金托管合作",
      title: "支付与担保资金政策",
      intro:
        "TXEPRO 联合商业银行重磅打造的专属第三方资金担保结算机制，彻底破除赖账、拖欠运费及运单违约隐患，为货主与承运司机筑牢资金安全防火墙。",
      quickStats: [
        { label: "资金存管银行", value: "MB Bank" },
        { label: "运费解冻时效", value: "e-POD 签收即解" },
        { label: "充值入账速度", value: "VietQR 24/7 秒级" },
        { label: "安全保障覆盖", value: "100% 全单覆盖" },
      ],
      sections: [
        {
          heading: "资金托管运作原理",
          badge: "托管机制",
          items: [
            "货主确认接单司机后，全额运费即刻划转至 MB Bank 独立监管账户进行冻结保管。",
            "司机端清晰显示“100% 运费已担保”，安心发车起运。",
            "仅当收货人完成现场核货并签署电子签收单（e-POD）后，款项方可解冻拨付。",
          ],
        },
        {
          heading: "结算打款与提现规则",
          badge: "提现结算",
          items: [
            "货主手动确认或合规上传 e-POD 满 24 小时无异议后自动解冻结算。",
            "司机享有全天候 24/7 免手续费提现服务，款项 30 秒内直达任意绑定的银行账户。",
          ],
        },
      ],
    },
  },

  "khieu-nai-boi-thuong": {
    vi: {
      badge: "Công Tâm - Minh Bạch - Bảo Vệ Quyền Lợi",
      title: "Quy Trình Khiếu Nại & Bồi Thường",
      intro:
        "TXEPRO cam kết tiếp nhận và xử lý mọi khiếu nại phát sinh một cách khách quan, công bằng và nhanh chóng dựa trên dữ liệu hành trình vệ tinh GPS, biên bản giao nhận e-POD và thỏa thuận vận chuyển ban đầu.",
      quickStats: [
        { label: "Thời hạn tiếp nhận", value: "Trong 48 giờ" },
        { label: "Đóng băng tranh chấp", value: "Trong 2 giờ" },
        { label: "Thời gian phân xử", value: "24h - 72h" },
        { label: "Đền bù tổn thất", value: "Tới 100% giá trị" },
      ],
      sections: [
        {
          heading: "Các trường hợp tiếp nhận giải quyết khiếu nại",
          badge: "Phạm Vi Thụ Lý",
          items: [
            "Hàng hóa bị thất thoát, mất mát một phần hoặc toàn bộ số lượng trong quá trình tài xế vận chuyển.",
            "Hàng hóa bị móp méo, vỡ nát, ướt hoặc biến chất do tài xế không chằng buộc cẩn thận hoặc không duy trì nhiệt độ bảo quản đúng cam kết.",
            "Tài xế trễ hẹn lấy hàng hoặc giao hàng quá 2 giờ so với thời gian cam kết mà không có lý do chính đáng hoặc không thông báo trước.",
            "Chủ hàng đơn phương hủy đơn hàng vô cớ sau khi tài xế đã di chuyển xe đến điểm lấy hàng.",
            "Tranh chấp về các khoản phụ phí phát sinh (vé bến bãi, phí bốc dỡ hàng, tiền xe chờ lưu đêm) không đúng thỏa thuận ban đầu.",
          ],
        },
        {
          heading: "Quy trình xử lý khiếu nại 4 bước chuẩn",
          badge: "Quy Trình 4 Bước",
          description:
            "Quy trình xử lý khoa học bảo đảm tính khách quan tuyệt đối cho mọi thành viên.",
          items: [
            "Bước 1 - Gửi yêu cầu khiếu nại: Trong vòng 48 giờ kể từ thời điểm giao hàng, thành viên mở app chọn 'Khiếu nại vận đơn' hoặc gọi Hotline 24/7, cung cấp mã vận đơn và hình ảnh/video chứng cứ.",
            "Bước 2 - Đóng băng giao dịch (trong 2 giờ): Ban quản trị lập tức tạm khóa lệnh giải ngân số tiền cước ký quỹ để bảo toàn nguồn tiền phục vụ bồi thường.",
            "Bước 3 - Thẩm định & Đối soát chứng cứ (trong 24 giờ): Đội ngũ thanh tra trích xuất nhật trình di chuyển GPS, thời gian bốc/dỡ, ảnh chụp kiện hàng lúc nhận và biên bản e-POD lúc giao.",
            "Bước 4 - Ban hành phán quyết & Chi trả bồi hoàn (trong 48h - 72h): Quyết định mức bồi thường cụ thể. Tiền bồi thường được khấu trừ trực tiếp từ ví bên có lỗi hoặc bảo hiểm hàng hóa để chuyển cho bên bị thiệt hại.",
          ],
          callout: {
            title: "Nguyên tắc bằng chứng",
            content:
              "Mọi phán quyết của TXEPRO đều dựa trên dữ liệu nhật ký vệ tinh GPS và ảnh chụp e-POD đối chiếu hai đầu, loại bỏ hoàn toàn yếu tố cảm tính.",
            type: "info",
          },
        },
        {
          heading: "Nguyên tắc & Định mức bồi thường thiệt hại",
          badge: "Định Mức Đền Bù",
          items: [
            "Đối với hàng hóa có mua bảo hiểm vận chuyển: Bồi thường 100% giá trị tổn thất thực tế căn cứ theo hóa đơn GTGT hoặc chứng từ chứng minh nguồn gốc hợp pháp.",
            "Đối với hàng hóa thông thường không có hóa đơn: Bồi thường theo thỏa thuận hòa giải của hai bên hoặc mức bồi hoàn tối đa bằng 04 lần tiền cước chuyến đi đó.",
            "Trường hợp sự cố bất khả kháng (tai nạn giao thông do bên thứ ba gây ra, thiên tai, sạt lở có xác nhận của CSGT/chính quyền địa phương): Các bên cùng chia sẻ rủi ro theo quy định của Bộ luật Dân sự.",
          ],
        },
        {
          heading: "Kênh tiếp nhận hỗ trợ khẩn cấp 24/7",
          badge: "Đường Dây Nóng",
          items: [
            "Tổng đài hỗ trợ khẩn cấp 24/7 luôn có chuyên viên tiếp nhận cuộc gọi.",
            "Tính năng Live Chat trực tuyến ngay trong ứng dụng di động TXEPRO Shipper và TXEPRO Driver.",
            "Hòm thư chuyên trách tiếp nhận hồ sơ pháp lý và khiếu nại bồi thường: info@txepro.vn.",
          ],
        },
      ],
    },
    en: {
      badge: "Objective - Fair - Member Protection",
      title: "Claims & Compensation Process",
      intro:
        "TXEPRO is dedicated to adjudicating disputes and claims objectively, equitably, and swiftly based on GPS telemetry, verified e-POD proofs, and recorded terms.",
      quickStats: [
        { label: "Filing window", value: "Within 48 hours" },
        { label: "Fund freeze", value: "Within 2 hours" },
        { label: "Resolution timeline", value: "24h - 72h" },
        { label: "Loss indemnification", value: "Up to 100%" },
      ],
      sections: [
        {
          heading: "Eligible Claim Categories",
          badge: "Claim Scope",
          items: [
            "Total or partial cargo loss or disappearance during transit.",
            "Physical cargo damage, moisture, or spoilage resulting from improper strapping or failure to maintain cold chain temperature.",
            "Severe unnotified pickup or delivery delays exceeding 2 hours.",
            "Unjustified shipper order cancellations after truck arrival at pickup location.",
            "Disputed auxiliary expenses (tolls, parking, demurrage) conflicting with agreed terms.",
          ],
        },
        {
          heading: "Standard 4-Step Claims Procedure",
          badge: "4-Step Workflow",
          items: [
            "Step 1 - File Ticket: Submit order code, photos, and video proof within 48 hours.",
            "Step 2 - Escrow Freeze: Associated fare payout is frozen within 2 hours.",
            "Step 3 - Forensic Audit: Cross-examine GPS coordinates, stop durations, and pickup vs dropoff photos.",
            "Step 4 - Binding Ruling: Issue ruling and execute compensation directly via wallet or cargo insurance.",
          ],
        },
      ],
    },
    zh: {
      badge: "客观公正 · 快速响应 · 保障权益",
      title: "货运纠纷投诉与赔付流程",
      intro:
        "TXEPRO 坚持以事实为依据、以数据为准绳，依托卫星 GPS 运行轨迹、e-POD 电子交付凭证及系统交互记录，为会员提供客观、公平、高效的纠纷仲裁与赔付服务。",
      quickStats: [
        { label: "受理工单时效", value: "发生后 48 小时内" },
        { label: "运费紧急冻结", value: "2 小时内执行" },
        { label: "仲裁定案周期", value: "24h - 72h" },
        { label: "货损赔偿比例", value: "最高达 100%" },
      ],
      sections: [
        {
          heading: "投诉受理情形",
          badge: "受理范围",
          items: [
            "运输途中发生部分或全部货物遗失、盗抢或短少。",
            "因司机捆扎不当或冷链未达温控标准导致的货物破损、受潮或变质。",
            "司机无正当理由且未提前报备造成的提卸货严重延误逾 2 小时以上。",
            "车辆到达指定装货地点后，货主单方面无理取消运单。",
            "装卸费、过桥过路费、压夜压车费等附加费争议。",
          ],
        },
        {
          heading: "标准四步仲裁处置流程",
          badge: "处理流程",
          items: [
            "步骤一：提交申请（48 小时内上传运单号、现场照片及损失凭证）。",
            "步骤二：资金冻结（2 小时内核查并冻结涉案运单托管资金）。",
            "步骤三：多维对核（24 小时内调取 GPS 行驶轨迹、驻留时间及装卸货影像对比）。",
            "步骤四：仲裁执行（24-72 小时内出具定责裁定，并通过钱包或货运保险完成扣赔）。",
          ],
        },
      ],
    },
  },

  "dieu-khoan-su-dung": {
    vi: {
      badge: "Văn Bản Pháp Lý Nền Tảng",
      title: "Điều Khoản Sử Dụng TXEPRO",
      intro:
        "Khi tham gia sàn giao dịch TXEPRO, người dùng cam kết tuân thủ đầy đủ các điều khoản về tài khoản, giao dịch, vận tải và hành vi ứng xử văn minh trên nền tảng.",
      sections: [
        {
          heading: "Tài khoản và điều kiện truy cập",
          items: [
            "Người dùng tự chịu trách nhiệm quản lý, bảo mật số điện thoại và thông tin đăng nhập.",
            "TXEPRO có quyền đình chỉ quyền sử dụng đối với tài khoản cung cấp thông tin giả mạo hoặc có dấu hiệu lừa đảo.",
            "Dữ liệu vận đơn và trao đổi được lưu trữ an toàn nhằm phục vụ đối soát và hỗ trợ pháp lý khi cần.",
          ],
        },
      ],
    },
    en: {
      badge: "Platform Legal Terms",
      title: "Terms of Use",
      intro: "By using TXEPRO, users agree to abide by all platform rules and operational guidelines.",
      sections: [],
    },
    zh: {
      badge: "平台法务条款",
      title: "使用条款",
      intro: "使用 TXEPRO 即表示用户同意遵守平台各项使用规则与规范。",
      sections: [],
    },
  },

  "chinh-sach-bao-mat": {
    vi: {
      badge: "Bảo Vệ Dữ Liệu Khách Hàng",
      title: "Chính Sách Bảo Mật Thông Tin",
      intro:
        "TXEPRO cam kết bảo vệ dữ liệu cá nhân của mọi thành viên, tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP và tiêu chuẩn an toàn thông tin quốc gia.",
      sections: [
        {
          heading: "Nguyên tắc bảo vệ dữ liệu",
          items: [
            "Chỉ thu thập thông tin cần thiết phục vụ cho việc kết nối đơn hàng, định vị GPS và thanh toán ký quỹ.",
            "Không chia sẻ hoặc bán dữ liệu người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại trái phép.",
            "Áp dụng mã hóa SSL/TLS 256-bit trong toàn bộ quá trình truyền tải và lưu trữ dữ liệu.",
          ],
        },
      ],
    },
    en: {
      badge: "Data Privacy Standards",
      title: "Privacy Policy",
      intro: "TXEPRO commits to protecting personal data under Decree 13/2023/ND-CP guidelines.",
      sections: [],
    },
    zh: {
      badge: "隐私与数据安全",
      title: "隐私政策",
      intro: "TXEPRO 严格按照越南第 13/2023/ND-CP 号令规范保护用户个人数据。",
      sections: [],
    },
  },

  "lien-he": {
    vi: {
      badge: "Hỗ Trợ & Đồng Hành 24/7",
      title: "Liên Hệ Nền Tảng TXEPRO",
      intro:
        "Chúng tôi luôn sẵn sàng lắng nghe, hỗ trợ xử lý vận đơn và tư vấn giải pháp vận tải tối ưu cho quý khách hàng trên toàn quốc.",
      sections: [
        {
          heading: "Các kênh liên hệ chính thức",
          items: [
            "Tổng đài hỗ trợ 24/7 trực tiếp giải đáp mọi thắc mắc và tiếp nhận sự cố.",
            "Hệ thống Live Chat tích hợp trực tiếp trên ứng dụng di động và website.",
            "Hòm thư điện tử tiếp nhận hợp tác doanh nghiệp và hồ sơ kỹ thuật.",
          ],
        },
      ],
    },
    en: {
      badge: "24/7 Support & Partnership",
      title: "Contact TXEPRO",
      intro: "Reach out to TXEPRO for business partnership, operations, and customer support.",
      sections: [],
    },
    zh: {
      badge: "全天候专席服务",
      title: "联系 TXEPRO",
      intro: "欢迎联系 TXEPRO 获取企业物流合作方案、运单支持或技术咨询。",
      sections: [],
    },
  },
};

const fallbackSlug = "gioi-thieu";

export default function InfoPage() {
  const params = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const slug = params?.slug || fallbackSlug;

  const currentLang = (language as Language) || "vi";
  const slugContent = content[slug] || content[fallbackSlug];

  // Pick page by language with vi fallback
  const page: InfoPage =
    slugContent[currentLang] && slugContent[currentLang].sections.length > 0
      ? slugContent[currentLang]
      : slugContent.vi || content[fallbackSlug].vi;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      <Header />
      <main className="flex-1">
        {/* HERO BANNER WITH CINEMATIC TRUCK IMAGE & BACKDROP */}
        <SubpageHeroBanner
          title={page.title}
          subtitle={page.intro}
          badge={page.badge}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-20">
          {/* TOP QUICK HIGHLIGHT STATS BAR (IF PRESENT) */}
          {page.quickStats && page.quickStats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {page.quickStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-md text-center hover:border-primary-300 transition-all"
                >
                  <p className="text-xl sm:text-2xl font-bold text-primary-600 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* MAIN CONTENT CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl space-y-10">
            {/* Header row */}
            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2.5 py-0.5 rounded-full mb-1.5">
                  {page.badge}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {page.title}
                </h1>
                <p className="mt-2 text-slate-600 leading-relaxed font-normal text-sm sm:text-base">
                  {page.intro}
                </p>
              </div>
            </div>

            {/* Structured Sections */}
            <div className="space-y-10">
              {page.sections.map((section, idx) => (
                <section
                  key={idx}
                  className="bg-slate-50/60 rounded-3xl p-6 sm:p-8 border border-slate-200/70 space-y-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <span>{section.heading}</span>
                    </h2>
                    {section.badge && (
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        {section.badge}
                      </span>
                    )}
                  </div>

                  {section.description && (
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {section.description}
                    </p>
                  )}

                  {/* Bullet Checklist */}
                  <ul className="space-y-3 pt-1">
                    {section.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 font-normal"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Optional Callout Card */}
                  {section.callout && (
                    <div
                      className={`mt-4 rounded-2xl p-4 border flex items-start gap-3 text-xs leading-relaxed ${
                        section.callout.type === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : section.callout.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-blue-50 border-blue-200 text-blue-900"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider mb-0.5">
                          {section.callout.title}
                        </h3>
                        <p>{section.callout.content}</p>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* QUICK LINK HUB TO RELEVANT TXEPRO PAGES */}
            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Tiện Ích & Kênh Liên Kết Nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Link
                  href="/tracking"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-primary-600 transition-colors">
                      Tra Cứu Vận Đơn
                    </h4>
                    <p className="text-[11px] text-slate-400">Theo dõi GPS trực tiếp</p>
                  </div>
                </Link>

                <Link
                  href="/tro-giup"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-primary-600 transition-colors">
                      Hỏi Đáp & FAQ
                    </h4>
                    <p className="text-[11px] text-slate-400">Giải đáp thắc mắc 24/7</p>
                  </div>
                </Link>

                <Link
                  href="/thong-tin/lien-he"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-primary-600 transition-colors">
                      Liên Hệ Hỗ Trợ
                    </h4>
                    <p className="text-[11px] text-slate-400">Tư vấn & Báo giá sàn</p>
                  </div>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-primary-600 transition-colors">
                      Đăng Ký Tài Khoản
                    </h4>
                    <p className="text-[11px] text-slate-400">Chủ hàng & Bác tài</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SHARED SUBPAGE CTA BANNER */}
        <SubpageCtaBanner />
      </main>
      <Footer />
    </div>
  );
}
