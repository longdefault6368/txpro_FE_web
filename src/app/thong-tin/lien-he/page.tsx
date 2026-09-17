"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Truck,
  Package,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import { executeFetch, API_BASE } from "@/utils/api";

export default function ContactPage() {
  const { language } = useLanguage();
  const { companyInfo, isLoaded } = useCompanyInfo();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    category: "shipper",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pageCopy = {
    vi: {
      badge: "Kênh Liên Hệ Chính Thức TXEPRO",
      title: "Liên hệ với chúng tôi",
      subtitle:
        "TXEPRO luôn sẵn sàng lắng nghe, tư vấn giải pháp vận tải công nghệ và đồng hành cùng quý đối tác, chủ hàng và tài xế trên mọi hành trình.",
      formTitle: "Gửi thông tin liên hệ",
      formSubtitle: "Vui lòng điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 2 giờ làm việc.",
      fullName: "Họ và tên *",
      fullNamePlaceholder: "Nguyễn Văn A",
      phone: "Số điện thoại liên hệ *",
      phonePlaceholder: "0912 345 678",
      email: "Địa chỉ Email *",
      emailPlaceholder: "example@gmail.com",
      category: "Bạn là / Mục đích liên hệ *",
      categories: {
        shipper: "Chủ hàng có nhu cầu vận chuyển",
        driver: "Tài xế / Chủ xe muốn hợp tác",
        enterprise: "Doanh nghiệp hợp tác chiến lược",
        payment: "Hỗ trợ thanh toán & ký quỹ MB Bank",
        other: "Góp ý & Thắc mắc khác",
      },
      subject: "Tiêu đề liên hệ *",
      subjectPlaceholder: "Ví dụ: Cần báo giá tuyến xe 5 tấn cố định",
      message: "Nội dung chi tiết *",
      messagePlaceholder: "Vui lòng mô tả chi tiết loại hàng, tuyến đường hoặc nhu cầu cần hỗ trợ...",
      btnSubmit: "Gửi yêu cầu ngay",
      btnSubmitting: "Đang gửi thông tin...",
      successTitle: "Gửi liên hệ thành công!",
      successDesc:
        "Cảm ơn bạn đã liên hệ với TXEPRO. Yêu cầu của bạn đã được chuyển đến bộ phận hỗ trợ khách hàng và chúng tôi sẽ liên hệ lại sớm nhất.",
      btnSendAnother: "Gửi thêm yêu cầu khác",
      channelsTitle: "Thông tin hỗ trợ trực tiếp",
      hotlineTitle: "Tổng đài 24/7",
      hotlineDesc: "Hỗ trợ khẩn cấp, tra cứu đơn & cứu hộ giao thông",
      hotlineNumber: companyInfo.hotline || "",
      emailTitle: "Hòm thư điện tử",
      emailAddress: companyInfo.emailGeneral || "",
      emailSupport: companyInfo.emailSupport || "",
      workingHoursTitle: "Thời gian làm việc",
      workingHoursDesc: companyInfo.workingHours || "",
      hcmOfficeTitle: "Trụ sở TP. Hồ Chí Minh",
      hcmOfficeAddress: companyInfo.addressHcm || "",
      hnOfficeTitle: "Văn phòng Hà Nội",
      hnOfficeAddress: companyInfo.addressHn || "",
      quickHelpTitle: "Bạn cần giải đáp câu hỏi thường gặp?",
      quickHelpDesc: "Truy cập Trung tâm trợ giúp để xem hướng dẫn đăng đơn, ký quỹ MB Bank và tài xế.",
      btnQuickHelp: "Đến Trung tâm Trợ giúp",
    },
    en: {
      badge: "TXEPRO Official Contact",
      title: "Contact Us",
      subtitle:
        "TXEPRO is always ready to listen, consult freight solutions, and partner with shippers and drivers across Vietnam.",
      formTitle: "Send Us a Message",
      formSubtitle: "Fill in the form below and our team will respond within 2 business hours.",
      fullName: "Full Name *",
      fullNamePlaceholder: "John Doe",
      phone: "Phone Number *",
      phonePlaceholder: "0912 345 678",
      email: "Email Address *",
      emailPlaceholder: "example@gmail.com",
      category: "I am a / Purpose *",
      categories: {
        shipper: "Shipper needing cargo transport",
        driver: "Driver / Fleet owner joining as partner",
        enterprise: "B2B Strategic Partnership",
        payment: "MB Bank Escrow & Wallet Support",
        other: "Other Inquiries & Feedback",
      },
      subject: "Subject *",
      subjectPlaceholder: "e.g., Cargo quotation for 5-ton truck route",
      message: "Detailed Message *",
      messagePlaceholder: "Please describe your cargo, route, or specific support needs in detail...",
      btnSubmit: "Submit Message",
      btnSubmitting: "Submitting...",
      successTitle: "Message Sent Successfully!",
      successDesc:
        "Thank you for contacting TXEPRO. Your inquiry has been forwarded to our support team and we will reach out shortly.",
      btnSendAnother: "Send another message",
      channelsTitle: "Direct Contact Channels",
      hotlineTitle: "24/7 Hotline",
      hotlineDesc: "Emergency assistance, shipment tracking & on-road support",
      hotlineNumber: companyInfo.hotline || "",
      emailTitle: "Official Email",
      emailAddress: companyInfo.emailGeneral || "",
      emailSupport: companyInfo.emailSupport || "",
      workingHoursTitle: "Business Hours",
      workingHoursDesc: companyInfo.workingHours || "",
      hcmOfficeTitle: "HCMC Headquarters",
      hcmOfficeAddress: companyInfo.addressHcm || "",
      hnOfficeTitle: "Hanoi Representative Office",
      hnOfficeAddress: companyInfo.addressHn || "",
      quickHelpTitle: "Looking for Instant Answers?",
      quickHelpDesc: "Visit our Help Center for FAQs, MB Bank escrow workflows, and trip tutorials.",
      btnQuickHelp: "Visit Help Center",
    },
    zh: {
      badge: "TXEPRO 官方联系通道",
      title: "联系我们",
      subtitle: "TXEPRO 随时倾听您的需求，为您提供数字化智慧物流方案，携手广大货主与司机共创高效运输。",
      formTitle: "在线留言咨询",
      formSubtitle: "请填写以下信息，我们的专业客服将在 2 个工作小时内与您联系。",
      fullName: "姓名 / 企业名称 *",
      fullNamePlaceholder: "张先生 / 某某物流",
      phone: "联系电话 *",
      phonePlaceholder: "0912 345 678",
      email: "电子邮箱 *",
      emailPlaceholder: "example@gmail.com",
      category: "身份类别 / 咨询目的 *",
      categories: {
        shipper: "货主 / 寻求公路货运服务",
        driver: "司机 / 车队申请入驻合作",
        enterprise: "大宗 B2B 企业战略合作",
        payment: "MB Bank 担保结算与钱包支持",
        other: "其他建议与商务咨询",
      },
      subject: "咨询主题 *",
      subjectPlaceholder: "例如：5吨货车河内至岘港运价咨询",
      message: "详细留言内容 *",
      messagePlaceholder: "请详细说明货物类型、运输路线或您需要支持的问题...",
      btnSubmit: "立即提交留言",
      btnSubmitting: "正在提交...",
      successTitle: "留言提交成功！",
      successDesc: "感谢您联系 TXEPRO。我们已收到您的留言，客服专员将尽快与您取得联系。",
      btnSendAnother: "再次发送留言",
      channelsTitle: "直接联络方式",
      hotlineTitle: "24/7 服务热线",
      hotlineDesc: "紧急求助、运单追踪及在途应急调度",
      hotlineNumber: companyInfo.hotline || "",
      emailTitle: "官方邮箱",
      emailAddress: companyInfo.emailGeneral || "",
      emailSupport: companyInfo.emailSupport || "",
      workingHoursTitle: "工作时间",
      workingHoursDesc: companyInfo.workingHours || "",
      hcmOfficeTitle: "胡志明市总部",
      hcmOfficeAddress: companyInfo.addressHcm || "",
      hnOfficeTitle: "河内办事处",
      hnOfficeAddress: companyInfo.addressHn || "",
      quickHelpTitle: "需要查找常见问题解答？",
      quickHelpDesc: "访问帮助中心查阅发布运单、MB Bank 担保及司机操作指南。",
      btnQuickHelp: "前往帮助中心",
    },
  }[language] || {
    badge: "Kênh Liên Hệ Chính Thức TXEPRO",
    title: "Liên hệ với chúng tôi",
    subtitle: "TXEPRO luôn sẵn sàng lắng nghe và hỗ trợ bạn.",
    formTitle: "Gửi thông tin liên hệ",
    formSubtitle: "Chúng tôi sẽ phản hồi sớm nhất.",
    fullName: "Họ và tên *",
    fullNamePlaceholder: "Nguyễn Văn A",
    phone: "Số điện thoại liên hệ *",
    phonePlaceholder: "0912 345 678",
    email: "Địa chỉ Email *",
    emailPlaceholder: "example@gmail.com",
    category: "Mục đích liên hệ *",
    categories: {
      shipper: "Chủ hàng",
      driver: "Tài xế",
      enterprise: "Doanh nghiệp",
      payment: "Thanh toán",
      other: "Khác",
    },
    subject: "Tiêu đề *",
    subjectPlaceholder: "Tiêu đề",
    message: "Nội dung *",
    messagePlaceholder: "Nội dung...",
    btnSubmit: "Gửi",
    btnSubmitting: "Đang gửi...",
    successTitle: "Thành công!",
    successDesc: "Cảm ơn bạn đã gửi tin nhắn.",
    btnSendAnother: "Gửi lại",
    channelsTitle: "Kênh hỗ trợ",
    hotlineTitle: "Hotline",
    hotlineDesc: "24/7",
    hotlineNumber: companyInfo.hotline || "",
    emailTitle: "Email",
    emailAddress: companyInfo.emailGeneral || "",
    emailSupport: companyInfo.emailSupport || "",
    workingHoursTitle: "Giờ làm việc",
    workingHoursDesc: "08:00 - 18:00",
    hcmOfficeTitle: "TP. Hồ Chí Minh",
    hcmOfficeAddress: "Quận 1, TP. HCM",
    hnOfficeTitle: "Hà Nội",
    hnOfficeAddress: "Cầu Giấy, Hà Nội",
    quickHelpTitle: "Trung tâm trợ giúp",
    quickHelpDesc: "Xem câu hỏi thường gặp",
    btnQuickHelp: "Trợ giúp",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ các trường thông tin có đánh dấu *");
      return;
    }

    setSubmitting(true);
    try {
      const res = await executeFetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        setSubmitSuccess(true);
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          category: "shipper",
          subject: "",
          message: "",
        });
      } else {
        setErrorMessage(data.message || "Không thể gửi tin nhắn. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      console.error("Contact submit error:", err);
      // Fallback message
      setErrorMessage(
        companyInfo.hotline
          ? `Không thể kết nối đến máy chủ. Vui lòng gọi hotline ${companyInfo.hotline}.`
          : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau."
      );
    } finally {
      setSubmitting(false);
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
        />

        {/* MAIN 2-COLUMN SECTION: Form + Contact Info */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {pageCopy.formTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {pageCopy.formSubtitle}
                </p>
              </div>

              {submitSuccess ? (
                <div className="py-12 px-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{pageCopy.successTitle}</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {pageCopy.successDesc}
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-600/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{pageCopy.btnSendAnother}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {pageCopy.fullName}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={pageCopy.fullNamePlaceholder}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {pageCopy.phone}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={pageCopy.phonePlaceholder}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {pageCopy.email}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={pageCopy.emailPlaceholder}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {pageCopy.category}
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all"
                      >
                        <option value="shipper">{pageCopy.categories.shipper}</option>
                        <option value="driver">{pageCopy.categories.driver}</option>
                        <option value="enterprise">{pageCopy.categories.enterprise}</option>
                        <option value="payment">{pageCopy.categories.payment}</option>
                        <option value="other">{pageCopy.categories.other}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {pageCopy.subject}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={pageCopy.subjectPlaceholder}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {pageCopy.message}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={pageCopy.messagePlaceholder}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-slate-900 font-medium transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-600/25 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{pageCopy.btnSubmitting}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{pageCopy.btnSubmit}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT: Direct Channels & Offices (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {!isLoaded ? (
                <div className="space-y-4">
                  <div className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60" />
                  <div className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60" />
                  <div className="h-36 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60" />
                </div>
              ) : (
                <>
                  {/* Hotline Card - Only show if hotline is configured */}
                  {companyInfo.hotline && (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200/80 hover:border-primary-300 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <Phone className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                            {pageCopy.hotlineTitle}
                          </span>
                          <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                            <a
                              href={`tel:${companyInfo.hotline.replace(/\s/g, "")}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {companyInfo.hotline}
                            </a>
                          </h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            {pageCopy.hotlineDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email & Support Card - Only show if an email is configured */}
                  {(companyInfo.emailGeneral || companyInfo.emailSupport) && (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200/80 hover:border-primary-300 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                            {pageCopy.emailTitle}
                          </span>
                          <div className="mt-1 space-y-1">
                            {companyInfo.emailGeneral && (
                              <div>
                                <span className="text-xs text-slate-400">Liên hệ chung: </span>
                                <a
                                  href={`mailto:${companyInfo.emailGeneral}`}
                                  className="text-sm font-bold text-slate-900 hover:text-primary-600"
                                >
                                  {companyInfo.emailGeneral}
                                </a>
                              </div>
                            )}
                            {companyInfo.emailSupport && (
                              <div>
                                <span className="text-xs text-slate-400">Hỗ trợ kỹ thuật & ví: </span>
                                <a
                                  href={`mailto:${companyInfo.emailSupport}`}
                                  className="text-sm font-bold text-slate-900 hover:text-primary-600"
                                >
                                  {companyInfo.emailSupport}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Working Hours & Offices - Only show if configured */}
                  {(companyInfo.workingHours || companyInfo.addressHcm || companyInfo.addressHn) && (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200/80 space-y-4">
                      {companyInfo.workingHours && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              {pageCopy.workingHoursTitle}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {companyInfo.workingHours}
                            </p>
                          </div>
                        </div>
                      )}

                      {(companyInfo.addressHcm || companyInfo.addressHn) && (
                        <div className={`${companyInfo.workingHours ? "border-t border-slate-100 pt-4" : ""} space-y-3`}>
                          {companyInfo.addressHcm && (
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  {pageCopy.hcmOfficeTitle}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  {companyInfo.addressHcm}
                                </p>
                              </div>
                            </div>
                          )}

                          {companyInfo.addressHn && (
                            <div className="flex items-start gap-3">
                              <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  {pageCopy.hnOfficeTitle}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  {companyInfo.addressHn}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Link to Help Center Banner */}
              <div className="bg-gradient-to-br from-primary-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="flex items-start gap-3 relative z-10">
                  <HelpCircle className="w-6 h-6 text-primary-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {pageCopy.quickHelpTitle}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {pageCopy.quickHelpDesc}
                    </p>
                    <Link
                      href="/tro-giup"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary-300 hover:text-white transition-colors"
                    >
                      <span>{pageCopy.btnQuickHelp}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
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
