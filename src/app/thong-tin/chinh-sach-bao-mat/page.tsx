"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileCheck,
  AlertCircle,
  Clock,
  Printer,
  Search,
  ChevronRight,
  Calendar,
  Share2,
  Server,
  KeyRound,
  FileText
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";

interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon: any;
  content: string[];
  notes?: string;
}

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const [activeSection, setActiveSection] = useState<string>("sec-1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pageCopyMap: Record<string, {
    badge: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
    version: string;
    tocTitle: string;
    searchPlaceholder: string;
    printBtn: string;
    dpoTitle: string;
    dpoDesc: string;
    dpoEmail: string;
    sections: PolicySection[];
  }> = {
    vi: {
      badge: "Cam Kết Bảo Vệ Dữ Liệu Cá Nhân",
      title: "Chính Sách Bảo Mật TXEPRO",
      subtitle:
        "TXEPRO cam kết bảo vệ thông tin riêng tư và dữ liệu cá nhân của mọi Chủ hàng và Tài xế, tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP và các tiêu chuẩn bảo mật quốc tế.",
      lastUpdated: "Cập nhật lần cuối: 15/09/2026",
      version: "Phiên bản: 2.3.0 (Tuân thủ NĐ 13/2023/NĐ-CP)",
      tocTitle: "Nội dung chính sách",
      searchPlaceholder: "Tìm trong chính sách bảo mật...",
      printBtn: "In chính sách",
      dpoTitle: "Cán bộ phụ trách bảo vệ dữ liệu (DPO)",
      dpoDesc: "Liên hệ trực tiếp bộ phận An toàn thông tin TXEPRO khi cần tra cứu hoặc xóa dữ liệu.",
      dpoEmail: companyInfo.emailPrivacy || "",
      sections: [
        {
          id: "sec-1",
          number: "Mục 1",
          title: "Mục đích và Nguyên tắc xử lý dữ liệu",
          icon: ShieldCheck,
          content: [
            "Nguyên tắc hợp pháp & minh bạch: Mọi hoạt động thu thập và xử lý dữ liệu cá nhân chỉ được thực hiện khi có sự đồng thuận rõ ràng của người dùng hoặc theo quy định bắt buộc của pháp luật.",
            "Giới hạn mục đích: Thông tin chỉ được sử dụng để cung cấp dịch vụ kết nối vận chuyển, điều phối đơn hàng, hỗ trợ định vị GPS trực tiếp, xử lý thanh toán ký quỹ MB Bank và đảm bảo an toàn giao dịch.",
            "Tối thiểu hóa dữ liệu: TXEPRO chỉ thu thập đúng và đủ những dữ liệu cần thiết phục vụ cho việc vận hành chuyến đi và xác thực danh tính.",
          ],
        },
        {
          id: "sec-2",
          number: "Mục 2",
          title: "Các loại dữ liệu cá nhân thu thập",
          icon: Database,
          content: [
            "Dữ liệu định danh cơ bản: Họ và tên, số điện thoại, địa chỉ email, ảnh chân dung, ảnh chụp CCCD/Hộ chiếu gắn chip.",
            "Dữ liệu phương tiện & Giấy phép lái xe (đối với Tài xế): Giấy phép lái xe (hạng B2, C, D, E, FC), Đăng ký xe (Cà-vẹt), Đăng kiểm phương tiện, Biển số xe và loại xe.",
            "Dữ liệu vị trí địa lý & GPS thời gian thực: Tọa độ địa lý của phương tiện được truyền về máy chủ khi tài xế bắt đầu nhận chuyến và di chuyển, nhằm cung cấp tính năng bản đồ theo dõi trực tiếp cho chủ hàng.",
            "Dữ liệu thanh toán & ví điện tử: Số tài khoản ngân hàng, thông tin thụ hưởng thanh toán NAPAS 24/7, lịch sử nạp/rút tiền, mã giao dịch ký quỹ MB Bank và thông tin xuất hóa đơn GTGT.",
          ],
          notes: "TXEPRO không lưu trữ mật khẩu ngân hàng, mã CVV/CVC thẻ tín dụng hoặc mã PIN ví của người dùng.",
        },
        {
          id: "sec-3",
          number: "Mục 3",
          title: "Phương thức thu thập dữ liệu",
          icon: Server,
          content: [
            "Thu thập trực tiếp: Thông qua biểu mẫu đăng ký tài khoản, biểu mẫu xác thực eKYC, form gửi thông tin liên hệ trên website và ứng dụng.",
            "Thu thập tự động khi sử dụng dịch vụ: Thông qua cảm biến định vị GPS trên điện thoại của tài xế khi nhận đơn hàng; nhật ký hệ thống (log IP, loại thiết bị, hệ điều hành Android/iOS).",
            "Thu thập từ đối tác liên kết: Kết quả đối soát trạng thái chuyển tiền từ Ngân hàng Quân Đội (MB Bank) hoặc đơn vị cung cấp giải pháp xác minh danh tính quốc gia.",
          ],
        },
        {
          id: "sec-4",
          number: "Mục 4",
          title: "Mục đích sử dụng thông tin",
          icon: Eye,
          content: [
            "Kết nối đơn hàng: Ghép tuyến đường trống của tài xế với nhu cầu gửi hàng của chủ hàng một cách nhanh chóng, chính xác.",
            "Giám sát an toàn vận chuyển: Cung cấp bản đồ hành trình trực tuyến, kiểm tra lộ trình di chuyển và chứng cứ giao nhận hàng hóa (e-POD).",
            "Xử lý ký quỹ và thanh toán: Tạm giữ an toàn tiền cước qua MB Bank và giải tỏa tự động vào ví khi giao nhận thành công.",
            "Chăm sóc khách hàng & Xử lý sự cố: Hỗ trợ khẩn cấp trên đường, bồi thường bảo hiểm và giải quyết khiếu nại.",
            "Phòng chống gian lận & An ninh mạng: Phát hiện các hành vi gian lận tài khoản, giả mạo bằng lái hoặc cố tình vi phạm quy định sàn.",
          ],
        },
        {
          id: "sec-5",
          number: "Mục 5",
          title: "Chia sẻ dữ liệu với bên thứ ba",
          icon: Share2,
          content: [
            "Chia sẻ giữa các bên trong chuyến đi: Khi chuyến hàng được xác nhận, chủ hàng được nhìn thấy thông tin tài xế (Họ tên, SĐT, biển số xe, tọa độ GPS) và tài xế được nhìn thấy thông tin điểm nhận/giao của chủ hàng.",
            "Đối tác ngân hàng & Cổng thanh toán: Cung cấp mã giao dịch và số tiền cho Ngân hàng Quân Đội (MB Bank) nhằm thực hiện lệnh nạp, rút và phong tỏa/giải tỏa ký quỹ.",
            "Cơ quan quản lý nhà nước: Cung cấp thông tin hành trình vận chuyển hoặc hóa đơn thuế khi có yêu cầu bằng văn bản hợp pháp từ cơ quan công an hoặc cơ quan thuế theo quy định pháp luật.",
            "CAM KẾT TUYỆT ĐỐI: TXEPRO không bán, không cho thuê và không chia sẻ dữ liệu cá nhân cho bất kỳ công ty quảng cáo hoặc bên thứ ba nào vì mục đích thương mại.",
          ],
          notes: "Mọi đối tác kỹ thuật của TXEPRO đều phải ký thỏa thuận bảo mật dữ liệu (NDA) và tuân thủ các quy chuẩn bảo vệ dữ liệu theo luật định.",
        },
        {
          id: "sec-6",
          number: "Mục 6",
          title: "Lưu trữ và Bảo mật dữ liệu",
          icon: Lock,
          content: [
            "Hạ tầng máy chủ đặt tại Việt Nam, đáp ứng tiêu chuẩn an toàn thông tin ISO/IEC 27001 và quy chuẩn của Bộ Thông tin & Truyền thông.",
            "Toàn bộ dữ liệu truyền tải trên mạng được mã hóa bằng giao thức SSL/TLS tiêu chuẩn cao cấp.",
            "Dữ liệu nhạy cảm (mật khẩu, khóa bí mật) được bảo vệ bằng cơ chế băm và mã hóa chuyên dụng.",
            "Hệ thống giám sát bảo mật 24/7 ngăn chặn xâm nhập và truy cập trái phép.",
          ],
        },
        {
          id: "sec-7",
          number: "Mục 7",
          title: "Thời gian lưu trữ dữ liệu",
          icon: Clock,
          content: [
            "Dữ liệu tài khoản được lưu trữ trong suốt thời gian người dùng duy trì hoạt động trên nền tảng TXEPRO.",
            "Lịch sử vận đơn và chứng từ tài chính được lưu trữ tối thiểu 5 năm theo quy định của Luật Kế toán và Thuế.",
            "Dữ liệu GPS hành trình chi tiết được lưu trữ phục vụ đối soát trong vòng 90 ngày.",
          ],
        },
        {
          id: "sec-8",
          number: "Mục 8",
          title: "Quyền của Chủ thể dữ liệu (Người dùng)",
          icon: UserCheck,
          content: [
            "Quyền được biết: Bạn có quyền biết về hoạt động xử lý dữ liệu cá nhân của mình.",
            "Quyền truy cập & Chỉnh sửa: Bạn có thể đăng nhập vào ứng dụng bất kỳ lúc nào để xem và cập nhật thông tin cá nhân của mình.",
            `Quyền rút lại sự đồng ý & Yêu cầu xóa dữ liệu: Bạn có quyền yêu cầu tạm dừng xử lý hoặc xóa dữ liệu cá nhân của mình bằng cách ${companyInfo.emailPrivacy ? `gửi email về ${companyInfo.emailPrivacy}` : "gửi yêu cầu qua Trung tâm trợ giúp trên ứng dụng"}, trừ trường hợp dữ liệu phải lưu trữ theo luật thuế/kế toán.`,
            "Quyền khiếu nại: Bạn có quyền gửi phản ánh tới Bộ Công an (A05) hoặc cơ quan có thẩm quyền nếu phát hiện vi phạm bảo vệ dữ liệu cá nhân.",
          ],
        },
        {
          id: "sec-9",
          number: "Mục 9",
          title: "Chính sách Cookie & Lưu vết trình duyệt",
          icon: KeyRound,
          content: [
            "TXEPRO sử dụng Cookie thiết yếu để duy trì phiên đăng nhập và ghi nhớ tùy chọn ngôn ngữ (Tiếng Việt, English, 中文).",
            "Cookie phân tích hiệu năng giúp đội ngũ tối ưu tốc độ tải trang và trải nghiệm người dùng trên website.",
            "Bạn có thể tùy chỉnh hoặc tắt Cookie trong cài đặt trình duyệt của mình mà không ảnh hưởng đến các chức năng cơ bản của nền tảng.",
          ],
        },
        {
          id: "sec-10",
          number: "Mục 10",
          title: "Đơn vị Kiểm soát dữ liệu & Tiếp nhận khiếu nại",
          icon: FileCheck,
          content: [
            companyInfo.companyName ? `Đơn vị chủ quản: ${companyInfo.companyName}.` : "Đơn vị chủ quản: Ban quản trị nền tảng TXEPRO.",
            companyInfo.addressHcm ? `Địa chỉ liên hệ: ${companyInfo.addressHcm}.` : null,
            companyInfo.hotline ? `Đường dây nóng hỗ trợ khẩn cấp: ${companyInfo.hotline}.` : null,
            (companyInfo.emailPrivacy || companyInfo.emailSupport) ? `Email chuyên trách bảo vệ dữ liệu: ${[companyInfo.emailPrivacy, companyInfo.emailSupport].filter(Boolean).join(" / ")}.` : null,
            "Cơ quan có thẩm quyền: Cục An toàn thông tin - Bộ Thông tin & Truyền thông và Cục An ninh mạng (A05) - Bộ Công an.",
          ].filter(Boolean) as string[],
        },
      ],
    },
    en: {
      badge: "Personal Data Protection Commitment",
      title: "TXEPRO Privacy Policy",
      subtitle:
        "TXEPRO is dedicated to safeguarding the personal data of Shippers and Drivers, complying with Vietnamese Decree 13/2023/ND-CP and international privacy benchmarks.",
      lastUpdated: "Last updated: September 15, 2026",
      version: "Version: 2.3.0 (Compliant with Decree 13/2023/ND-CP)",
      tocTitle: "Policy Sections",
      searchPlaceholder: "Search privacy terms...",
      printBtn: "Print Policy",
      dpoTitle: "Data Protection Officer (DPO)",
      dpoDesc: "Reach our Information Security division directly for data subject inquiries or deletion requests.",
      dpoEmail: companyInfo.emailPrivacy || "",
      sections: [],
    },
    zh: {
      badge: "个人信息与数据安全承诺",
      title: "TXEPRO 平台隐私政策",
      subtitle: "TXEPRO 严格保护每位货主与司机的个人数据及隐私安全，全面遵守越南第 13/2023/ND-CP 号个人数据保护令及国际数据合规准则。",
      lastUpdated: "最后更新：2026 年 9 月 15 日",
      version: "版本：2.3.0",
      tocTitle: "目录导航",
      searchPlaceholder: "搜索隐私政策...",
      printBtn: "打印政策",
      dpoTitle: "数据保护合规官 (DPO)",
      dpoDesc: "如需查询、导出或删除个人数据，请直接联系我们。",
      dpoEmail: companyInfo.emailPrivacy || "",
      sections: [],
    },
  };
  const pageCopy = pageCopyMap[language as "vi" | "en" | "zh"] || pageCopyMap.vi;

  const sectionsList: PolicySection[] = (pageCopy.sections && pageCopy.sections.length > 0) ? pageCopy.sections : pageCopyMap.vi.sections;

  const filteredSections = sectionsList.filter((sec: PolicySection) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.content.some((c: string) => c.toLowerCase().includes(q))
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
            {/* STICKY TOC (4 cols) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 sticky top-28">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
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

                {/* Search */}
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

                {/* Nav items */}
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

                {/* DPO Contact Box - Only show if emailPrivacy is configured */}
                {companyInfo.emailPrivacy && (
                  <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                      {pageCopy.dpoTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pageCopy.dpoDesc}</p>
                    <a
                      href={`mailto:${companyInfo.emailPrivacy}`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary-600 hover:text-primary-700"
                    >
                      <span>{companyInfo.emailPrivacy}</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </aside>

            {/* POLICY ARTICLES (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {filteredSections.map((sec) => {
                const SecIcon = sec.icon || ShieldCheck;
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
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2.5" />
                          <p className="flex-1">{p}</p>
                        </div>
                      ))}

                      {sec.notes && (
                        <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
