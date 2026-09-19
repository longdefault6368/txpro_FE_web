"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Search,
  Download,
  Printer,
  Calendar,
  Layers,
  Truck,
  CreditCard,
  UserCheck,
  Scale
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

interface Section {
  id: string;
  number: string;
  title: string;
  icon: any;
  content: string[];
  notes?: string;
}

export default function TermsOfServicePage() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const [activeSection, setActiveSection] = useState<string>("section-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pageCopyMap = {
    vi: {
      badge: "Văn Bản Pháp Lý Chính Thức",
      title: "Điều Khoản Sử Dụng Nền Tảng TXEPRO",
      subtitle:
        "Quy định chi tiết về quyền, nghĩa vụ và trách nhiệm pháp lý giữa TXEPRO, Chủ hàng và Tài xế trong toàn bộ quá trình kết nối và vận chuyển hàng hóa.",
      lastUpdated: "Cập nhật lần cuối: 15/09/2026",
      version: "Phiên bản: 2.4.0 (Áp dụng toàn quốc)",
      tocTitle: "Mục lục điều khoản",
      searchPlaceholder: "Tìm kiếm nội dung điều khoản...",
      printBtn: "In văn bản",
      contactSupport: "Bạn có thắc mắc về điều khoản?",
      contactDesc: "Đội ngũ pháp chế và hỗ trợ khách hàng của TXEPRO luôn sẵn sàng giải đáp 24/7.",
      btnContact: "Liên hệ pháp chế",
      sections: [
        {
          id: "section-1",
          number: "Điều 1",
          title: "Định nghĩa & Phạm vi áp dụng",
          icon: Layers,
          content: [
            "Nền tảng TXEPRO: Là hệ sinh thái giải pháp vận tải số bao gồm website txeppro.vn, ứng dụng di động TXEPRO Shipper, TXEPRO Driver và hệ thống quản trị vận hành trung tâm.",
            "Chủ hàng (Shipper): Là cá nhân hoặc pháp nhân có nhu cầu thuê dịch vụ vận chuyển hàng hóa và đăng tải thông tin đơn hàng trên nền tảng.",
            "Tài xế / Đối tác vận tải (Driver/Carrier): Là cá nhân có đầy đủ bằng lái hợp lệ hoặc doanh nghiệp vận tải sở hữu phương tiện, trực tiếp nhận và thực hiện việc chuyên chở.",
            "Vận đơn số (e-Waybill): Bản ghi điện tử thể hiện đầy đủ điểm đi, điểm đến, lộ trình, loại hàng hóa, tải trọng, cước phí và bằng chứng giao nhận (e-POD).",
            "Cơ chế ký quỹ (Escrow): Giải pháp đảm bảo thanh toán hợp tác cùng Ngân hàng Quân Đội (MB Bank), trong đó tiền cước được tạm phong tỏa an toàn khi nhận chuyến và chỉ giải tỏa cho tài xế sau khi hàng đã được nghiệm thu.",
          ],
          notes: "Mọi người dùng khi đăng ký tài khoản hoặc sử dụng dịch vụ trên TXEPRO đều mặc nhiên chấp thuận và chịu sự ràng buộc của Điều khoản này.",
        },
        {
          id: "section-2",
          number: "Điều 2",
          title: "Điều kiện tham gia & Xác thực định danh (eKYC)",
          icon: UserCheck,
          content: [
            "Người dùng phải từ đủ 18 tuổi trở lên, có đầy đủ năng lực hành vi dân sự theo quy định pháp luật Việt Nam.",
            "Quy định đối với Tài xế: Bắt buộc hoàn tất xác thực điện tử eKYC bao gồm CCCD/Hộ chiếu gắn chip, Giấy phép lái xe còn thời hạn phù hợp với loại phương tiện (B2, C, D, E, FC), Cà-vẹt xe (Đăng ký xe) và Giấy chứng nhận đăng kiểm an toàn kỹ thuật phương tiện.",
            "Bảo mật tài khoản: Người dùng có trách nhiệm tự bảo mật số điện thoại đăng nhập, mật khẩu và mã OTP xác thực được gửi qua Zalo/SMS. Không chia sẻ thông tin đăng nhập cho bất kỳ bên thứ ba nào.",
            "TXEPRO có quyền từ chối phê duyệt hoặc khóa vĩnh viễn tài khoản nếu phát hiện dấu hiệu giả mạo giấy tờ, sử dụng thông tin sai sự thật hoặc vi phạm pháp luật.",
          ],
        },
        {
          id: "section-3",
          number: "Điều 3",
          title: "Quy chế đăng đơn & Ghép chuyến thông minh",
          icon: Truck,
          content: [
            "Mô tả hàng hóa trung thực: Chủ hàng có nghĩa vụ khai báo chính xác quy cách hàng, trọng tải, thể tích, nhiệt độ bảo quản (nếu có) và tính chất đặc thù của hàng hóa.",
            "Phân loại phương tiện rõ ràng: Chọn đúng phương tiện (Ô tô chở khách chỉ có số ghế; Container / Xe đầu kéo; Xe tải thùng kín / thùng bạt có trọng tải và loại hàng hóa).",
            "Nghiêm cấm vận chuyển: Hàng cấm theo luật pháp Việt Nam (chất nổ, vũ khí, ma túy, động vật hoang dã nguy cấp, văn hóa phẩm độc hại, hàng lậu trốn thuế).",
            "Tính năng chuyến xe rỗng: Tài xế cập nhật lộ trình rỗng chiều về để hệ thống ghép nối đơn hàng tối ưu, giảm thiểu xe chạy rỗng và bảo vệ môi trường.",
          ],
        },
        {
          id: "section-4",
          number: "Điều 4",
          title: "Cơ chế Thanh toán, Ký quỹ & Phí nền tảng",
          icon: CreditCard,
          content: [
            "Ký quỹ bảo đảm: Khi chủ hàng xác nhận đơn, số tiền cước sẽ được ký quỹ qua cổng thanh toán MB Bank. Số tiền này không thể tự ý rút lại trừ khi đơn hàng bị hủy hợp lệ.",
            "Giải tỏa tiền cước: Ngay khi tài xế tải lên biên bản giao nhận có chữ ký (e-POD) và chủ hàng nhấn 'Xác nhận hoàn tất', hệ thống sẽ tự động giải tỏa 100% tiền cước vào ví tài xế.",
            "Biểu phí sàn TXEPRO: Nền tảng áp dụng mức phí dịch vụ kết nối công khai, minh bạch theo từng loại chuyến và sẽ được khấu trừ tự động tại thời điểm giải tỏa.",
            "Hóa đơn GTGT điện tử: TXEPRO hỗ trợ xuất hóa đơn điện tử hợp pháp cho mọi giao dịch cước vận tải theo đúng quy định của Tổng cục Thuế.",
          ],
          notes: "Tiền nạp vào ví tài xế có thể rút về tài khoản ngân hàng liên kết 24/7 qua chuẩn NAPAS nhanh chóng chỉ sau 1 - 5 phút.",
        },
        {
          id: "section-5",
          number: "Điều 5",
          title: "Quyền và Trách nhiệm của Chủ hàng",
          icon: Shield,
          content: [
            "Cung cấp đầy đủ hóa đơn, chứng từ hợp pháp của lô hàng khi lưu thông trên đường.",
            "Đóng gói, bao bọc hàng hóa chắc chắn, chịu lực tốt, phù hợp với tính chất vận chuyển đường dài.",
            "Bố trí nhân sự bốc xếp tại điểm nhận và điểm trả đúng khung giờ đã thỏa thuận trên ứng dụng.",
            "Có quyền theo dõi tọa độ GPS trực tiếp của xe trong suốt hành trình từ lúc lấy hàng đến khi trả hàng.",
          ],
        },
        {
          id: "section-6",
          number: "Điều 6",
          title: "Quyền và Trách nhiệm của Tài xế",
          icon: CheckCircle2,
          content: [
            "Bật định vị GPS liên tục trong suốt hành trình để hệ thống và chủ hàng theo dõi lộ trình thời gian thực.",
            "Kiểm tra tình trạng niêm phong, bao bì trước khi xếp hàng lên xe; từ chối chở nếu phát hiện hàng cấm hoặc không đúng khai báo.",
            "Bảo quản hàng hóa nguyên đai nguyên kiện, đúng thời gian và điểm trả đã cam kết.",
            "Thực hiện giao tiếp lịch sự, chuyên nghiệp, tuân thủ nghiêm ngặt Luật Giao thông đường bộ.",
          ],
        },
        {
          id: "section-7",
          number: "Điều 7",
          title: "Quy định Hủy đơn & Phạt vi phạm",
          icon: AlertCircle,
          content: [
            "Hủy đơn miễn phí: Trước khi tài xế bấm xuất phát đến điểm lấy hàng ít nhất 60 phút.",
            "Hủy đơn cận giờ do lỗi chủ hàng: Nếu tài xế đã di chuyển đến điểm lấy hàng mà chủ hàng hủy đơn không có lý do chính đáng, chủ hàng chịu phí bồi hoàn nhiên liệu theo quy định sàn.",
            "Hủy đơn do lỗi tài xế: Tài xế tự ý hủy chuyến sau khi nhận sẽ bị trừ điểm uy tín, hạn chế nhận chuyến hoặc tạm khóa tài khoản theo quy chế kỷ luật của nền tảng.",
          ],
        },
        {
          id: "section-8",
          number: "Điều 8",
          title: "Giải quyết Tranh chấp, Khiếu nại & Bảo hiểm",
          icon: Scale,
          content: [
            `Thời hạn khiếu nại: Mọi khiếu nại về hư hỏng, thất thoát hàng hóa phải được gửi qua ứng dụng ${companyInfo.hotline ? `hoặc hotline ${companyInfo.hotline}` : "hoặc tính năng báo cáo sự cố trên ứng dụng"} trong vòng 24 giờ kể từ thời điểm giao nhận.`,
            "Giữ nguyên hiện trường: Các bên có trách nhiệm chụp ảnh, quay video rõ nét và lập biên bản bàn giao có chữ ký xác nhận của hai bên.",
            "Hòa giải và Bồi thường: Đội ngũ thanh tra TXEPRO cùng đối tác bảo hiểm sẽ chủ trì đối soát, xác định lỗi và chi trả bồi thường theo đúng giá trị kê khai của vận đơn.",
            "Trường hợp không đạt thỏa thuận, vụ việc sẽ được đưa ra Trung tâm Trọng tài Thương mại hoặc Tòa án nhân dân có thẩm quyền tại Việt Nam.",
          ],
        },
        {
          id: "section-9",
          number: "Điều 9",
          title: "Miễn trừ trách nhiệm & Sự kiện Bất khả kháng",
          icon: FileText,
          content: [
            "TXEPRO được miễn trừ trách nhiệm bồi thường trong các trường hợp sự kiện bất khả kháng: Thiên tai, bão lũ, động đất, dịch bệnh, lệnh phong tỏa của cơ quan nhà nước có thẩm quyền hoặc sự cố mạng viễn thông diện rộng.",
            "Hao hụt tự nhiên của hàng hóa hoặc hư hỏng do đặc tính tự nhiên của sản phẩm mà chủ hàng không có cảnh báo hoặc bảo quản chuyên dụng trước đó.",
          ],
        },
        {
          id: "section-10",
          number: "Điều 10",
          title: "Hiệu lực thi hành & Điều chỉnh quy định",
          icon: Shield,
          content: [
            "TXEPRO có quyền cập nhật, bổ sung các điều khoản này theo yêu cầu phát triển dịch vụ hoặc thay đổi của luật pháp. Bản cập nhật sẽ được thông báo công khai trên website và ứng dụng trước khi có hiệu lực.",
            "Nếu người dùng tiếp tục sử dụng dịch vụ sau ngày bản cập nhật có hiệu lực, điều đó đồng nghĩa với việc người dùng hoàn toàn đồng ý với các điều chỉnh mới.",
          ],
        },
      ],
    },
    en: {
      badge: "Official Legal Agreement",
      title: "TXEPRO Platform Terms of Service",
      subtitle:
        "Detailed terms, rights, and legal obligations governing Shippers, Drivers, and TXEPRO throughout digital freight transport operations.",
      lastUpdated: "Last updated: September 15, 2026",
      version: "Version: 2.4.0 (Nationwide applicability)",
      tocTitle: "Table of Contents",
      searchPlaceholder: "Search terms...",
      printBtn: "Print Terms",
      contactSupport: "Have legal questions?",
      contactDesc: "TXEPRO legal and customer support team is available 24/7.",
      btnContact: "Contact Legal Team",
      sections: [
        {
          id: "section-1",
          number: "Article 1",
          title: "Definitions & Scope",
          icon: Layers,
          content: [
            "TXEPRO Platform: Digital transport ecosystem including website txepro.vn, TXEPRO Shipper app, TXEPRO Driver app, and centralized operations portal.",
            "Shipper: Individuals or corporate entities posting transport demands and freight orders on the platform.",
            "Driver / Carrier: Verified individuals or fleet enterprises providing physical road haulage.",
            "Electronic Waybill (e-Waybill): Digital freight record stating route, cargo type, vehicle payload, escrow tariff, and electronic proof of delivery (e-POD).",
            "Escrow Mechanism: Bank-backed payment custody partnered with MB Bank, locking freight funds safely and releasing only upon verified cargo delivery.",
          ],
          notes: "By signing up or using TXEPRO, you unconditionally accept and agree to be bound by these terms.",
        },
        {
          id: "section-2",
          number: "Article 2",
          title: "Eligibility & eKYC Verification",
          icon: UserCheck,
          content: [
            "Users must be at least 18 years of age with full legal capacity under Vietnamese law.",
            "Driver Requirements: Mandatory electronic KYC verification including national ID, valid driving license (B2/C/D/E/FC), vehicle registration certificate, and valid safety inspection certificate.",
            "Account Security: Users are solely responsible for safeguarding credentials and OTP codes sent via Zalo/SMS.",
            "TXEPRO reserves the right to suspend or terminate accounts providing fraudulent identity documents.",
          ],
        },
        {
          id: "section-3",
          number: "Article 3",
          title: "Order Posting & Smart Route Matching",
          icon: Truck,
          content: [
            "Accurate Cargo Representation: Shippers must accurately declare cargo dimensions, weight, special handling, and volume.",
            "Proper Vehicle Classification: Choose the correct vehicle class (Passenger Car seat count; Container / Tractor; Cargo Truck payload).",
            "Prohibited Cargo: Strictly forbids dangerous, flammable, explosive, or illicit goods under Vietnamese law.",
            "Empty Return Feature: Drivers update empty return corridors so TXEPRO can match intermediate cargo, minimizing empty mileage.",
          ],
        },
        {
          id: "section-4",
          number: "Article 4",
          title: "Payment, Escrow & Platform Fees",
          icon: CreditCard,
          content: [
            "Guaranteed Escrow: Full freight cost is safely locked via MB Bank payment gateway upon trip confirmation.",
            "Automated Payout: Released to the driver wallet upon verified signed proof of delivery (e-POD).",
            "Platform Fee: Transparent service commission deducted automatically at the moment of payout.",
            "Official VAT Invoices: Electronic tax invoices provided for corporate shippers upon request.",
          ],
          notes: "Wallet funds can be withdrawn 24/7 to any Vietnamese bank account via NAPAS in 1 - 5 minutes.",
        },
        {
          id: "section-5",
          number: "Article 5",
          title: "Rights and Obligations of Shippers",
          icon: Shield,
          content: [
            "Provide all required commercial documents and invoices for transport on road.",
            "Ensure cargo is securely packed for long-distance transport.",
            "Arrange prompt loading and unloading at agreed schedule.",
            "Track real-time vehicle GPS coordinates throughout the transport corridor.",
          ],
        },
        {
          id: "section-6",
          number: "Article 6",
          title: "Rights and Obligations of Drivers",
          icon: CheckCircle2,
          content: [
            "Keep GPS location services enabled continuously during the delivery trip.",
            "Inspect cargo packaging and condition before loading onto the truck.",
            "Safeguard cargo integrity and adhere strictly to road safety regulations.",
            "Maintain professional communication with shippers and consignees.",
          ],
        },
        {
          id: "section-7",
          number: "Article 7",
          title: "Cancellation Policy & Penalties",
          icon: AlertCircle,
          content: [
            "Free Cancellation: Allowed up to 60 minutes before driver departure.",
            "Late Shipper Cancellation: Fuel compensation charged if driver has already arrived at pickup.",
            "Driver Fault Cancellation: Reputation score penalty and temporary dispatch freeze applied.",
          ],
        },
        {
          id: "section-8",
          number: "Article 8",
          title: "Dispute Resolution & Cargo Insurance",
          icon: Scale,
          content: [
            `Claim Window: Notice must be submitted via app ${companyInfo.hotline ? `or hotline ${companyInfo.hotline}` : "or incident report in app"} within 24 hours of delivery.`,
            "Evidence Preservation: Photos, videos, and signed damage notes required.",
            "Insurance Settlement: TXEPRO inspectors and insurance partners assess claims according to declared value.",
            "Jurisdiction: Commercial Arbitration or competent courts in Vietnam.",
          ],
        },
        {
          id: "section-9",
          number: "Article 9",
          title: "Disclaimers & Force Majeure",
          icon: FileText,
          content: [
            "TXEPRO is exempt from liability for natural disasters, severe floods, epidemics, or state road blockades.",
            "Inherent product spoilage where shipper failed to provide required cold storage packaging.",
          ],
        },
        {
          id: "section-10",
          number: "Article 10",
          title: "Amendments & Term Enforcement",
          icon: Shield,
          content: [
            "TXEPRO may revise these terms to reflect service updates or regulatory mandates.",
            "Continued use of the platform constitutes full acceptance of updated terms.",
          ],
        },
      ],
    },
    zh: {
      badge: "官方法律协议",
      title: "TXEPRO 平台服务使用条款",
      subtitle: "详述货主、司机与 TXEPRO 平台在数字化公路货运全生命周期中的权利、法定义务与责任准则。",
      lastUpdated: "最后更新：2026 年 9 月 15 日",
      version: "版本：2.4.0 (全国适用)",
      tocTitle: "条款目录导航",
      searchPlaceholder: "搜索条款内容...",
      printBtn: "打印条款",
      contactSupport: "对条款有疑问？",
      contactDesc: "TXEPRO 法务及客服团队随时为您提供 24/7 权威解答。",
      btnContact: "联系法务专员",
      sections: [],
    },
  };
  const pageCopy = pageCopyMap[language as "vi" | "en" | "zh"] || pageCopyMap.vi;

  const sectionsList = (pageCopy.sections && pageCopy.sections.length > 0) ? pageCopy.sections : pageCopyMap.vi.sections;

  const filteredSections = sectionsList.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.content.some((c) => c.toLowerCase().includes(q))
    );
  });

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      <Header />

      <main className="flex-1">
        {/* SHARED SUBPAGE HERO BANNER */}
        <SubpageHeroBanner
          title={pageCopy.title}
          subtitle={pageCopy.subtitle}
          badge={pageCopy.badge}
          metaInfo={
            <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-400" />
                {pageCopy.lastUpdated}
              </span>
              <span>•</span>
              <span className="text-slate-300">{pageCopy.version}</span>
            </div>
          }
        />

        {/* CONTENT WITH STICKY TOC */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* STICKY TOC SIDEBAR (4 cols) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 sticky top-28">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    {pageCopy.tocTitle}
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors"
                    title={pageCopy.printBtn}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick search input */}
                <div className="relative my-4">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={pageCopy.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                  />
                </div>

                {/* Nav Links */}
                <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                  {sectionsList.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => handleScrollTo(sec.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeSection === sec.id
                          ? "bg-primary-50 text-primary-600 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">
                        <span className="text-slate-400 mr-2">{sec.number}:</span>
                        {sec.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    </button>
                  ))}
                </nav>

                {/* Support Box */}
                <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-900">{pageCopy.contactSupport}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pageCopy.contactDesc}</p>
                  <Link
                    href="/thong-tin/lien-he"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    <span>{pageCopy.btnContact}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* ARTICLES CONTENT (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {filteredSections.map((sec) => {
                const SecIcon = sec.icon || FileText;
                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="bg-white rounded-3xl p-6 sm:p-9 shadow-md border border-slate-200/80 scroll-mt-28"
                  >
                    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <SecIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                          {sec.number}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                          {sec.title}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                      {sec.content.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-2.5" />
                          <p className="flex-1">{p}</p>
                        </div>
                      ))}

                      {sec.notes && (
                        <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs sm:text-sm font-medium flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{sec.notes}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
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
