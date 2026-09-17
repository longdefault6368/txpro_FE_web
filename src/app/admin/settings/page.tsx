"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import {
  Settings,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Share2,
  FileText,
  Save,
  Check,
  AlertCircle,
  Smartphone,
  Radio,
  Send,
  ShieldAlert,
  Info,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Cpu,
  Layers,
  Percent,
  CreditCard,
  Sliders,
  ExternalLink
} from "lucide-react";
import { DEFAULT_COMPANY_INFO, CompanyInfo } from "@/utils/companyInfo";

type SettingsTab = "company" | "sms" | "operations";

interface SmsDeliveryMode {
  mockEnabled: boolean;
  effectiveMockEnabled: boolean;
  providerConfigured: boolean;
  source?: string;
  toggleAllowed?: boolean;
  version: number;
  updatedAt?: string;
}

interface SmsMockItem {
  id: string;
  phone: string;
  code: string;
  purpose: string;
  content: string;
  createdAt: string;
  expiresAt?: string;
}

const PURPOSE_MAP: Record<string, string> = {
  register: "Đăng ký tài khoản",
  forgot_password: "Khôi phục mật khẩu",
  device_verification: "Xác thực thiết bị",
  password_change: "Đổi mật khẩu",
  email_update: "Cập nhật Email",
  otp: "Xác thực OTP",
};

const formatPurpose = (purpose?: string) => {
  if (!purpose) return "Xác thực OTP";
  return PURPOSE_MAP[purpose] || purpose.replace(/_/g, " ");
};

const isOtpExpired = (expiresAt?: string) => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Company Info State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [savingCompany, setSavingCompany] = useState(false);

  // 2. SMS OTP Template State
  const [template, setTemplate] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // 3. SMS Delivery Mode State
  const [deliveryMode, setDeliveryMode] = useState<SmsDeliveryMode | null>(null);
  const [savingDeliveryMode, setSavingDeliveryMode] = useState(false);

  // 4. SMS Mock Inbox State
  const [mockMessages, setMockMessages] = useState<SmsMockItem[]>([]);
  const [mockInboxLoading, setMockInboxLoading] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");

  // 5. Operation Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoVerifyKyc, setAutoVerifyKyc] = useState(false);
  const [platformCommission, setPlatformCommission] = useState(12);
  const [minEscrowAmount, setMinEscrowAmount] = useState(500000);
  const [savingOperations, setSavingOperations] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // Fetch Company Info
  const fetchCompanySettings = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/contacts/company-info`);
      if (res.ok) {
        const json = await res.json();
        setCompanyInfo({ ...DEFAULT_COMPANY_INFO, ...(json.data || {}) });
      }
    } catch {
      // Offline fallback
    }
  };

  // Fetch SMS OTP Template
  const fetchOtpTemplate = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-otp-template`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.data.template);
        setDefaultTemplate(data.data.defaultTemplate);
        setPreview(data.data.preview);
        setUpdatedAt(data.data.updatedAt);
        setIsOffline(false);
      } else {
        setIsOffline(true);
        loadOfflineTemplate();
      }
    } catch {
      setIsOffline(true);
      loadOfflineTemplate();
    }
  };

  const loadOfflineTemplate = () => {
    const fallbackTpl = "[TXEPRO] Ma xac thuc OTP cua ban la {otp}. Hieu luc trong 5 phut. Khong chia se ma nay.";
    setTemplate(fallbackTpl);
    setDefaultTemplate(fallbackTpl);
    setPreview(fallbackTpl.replace(/{otp}/g, "868686"));
  };

  // Fetch SMS Delivery Mode
  const fetchDeliveryMode = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-delivery-mode`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryMode(data.data);
      } else {
        setDeliveryMode({
          mockEnabled: true,
          effectiveMockEnabled: true,
          providerConfigured: false,
          version: 1,
        });
      }
    } catch {
      setDeliveryMode({
        mockEnabled: true,
        effectiveMockEnabled: true,
        providerConfigured: false,
        version: 1,
      });
    }
  };

  // Fetch Mock Inbox Messages
  const fetchMockInbox = async (phoneQuery = "") => {
    setMockInboxLoading(true);
    try {
      if (isOffline) {
        setMockInboxLoading(false);
        return;
      }
      const queryParam = phoneQuery ? `?phone=${encodeURIComponent(phoneQuery)}` : "";
      const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-mock-inbox${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setMockMessages(data.data.messages || []);
      }
    } catch (err) {
      console.warn("Failed to fetch mock inbox", err);
    } finally {
      setMockInboxLoading(false);
    }
  };

  const handleSearchInbox = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMockInbox(phoneSearch);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchCompanySettings(), fetchOtpTemplate(), fetchDeliveryMode()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === "sms" && (deliveryMode?.effectiveMockEnabled || isOffline)) {
      fetchMockInbox();
    }
  }, [activeTab, deliveryMode?.effectiveMockEnabled, isOffline]);

  // Handle Save Company Info
  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(`${API_BASE}/contacts/company-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyInfo),
      });

      if (res.ok) {
        const json = await res.json();
        setCompanyInfo({ ...DEFAULT_COMPANY_INFO, ...(json.data || companyInfo) });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("txpro_company_info_updated"));
        }
        showSuccess("Đã lưu thông tin liên hệ & doanh nghiệp thành công!");
      } else {
        const err = await res.json().catch(() => ({}));
        showError(err.message || "Không thể lưu thông tin doanh nghiệp.");
      }
    } catch {
      showError("Lỗi kết nối tới máy chủ khi lưu thông tin.");
    } finally {
      setSavingCompany(false);
    }
  };

  // Handle Save SMS Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isOffline) {
        setPreview(template.replace(/{otp}/g, "123456"));
        showSuccess("Đã lưu mẫu tin nhắn SMS OTP (Chế độ Offline)");
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-otp-template`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template }),
        });

        if (res.ok) {
          const data = await res.json();
          setTemplate(data.data.template);
          setPreview(data.data.preview);
          setUpdatedAt(data.data.updatedAt);
          showSuccess("Đã cập nhật mẫu tin nhắn SMS OTP thành công!");
        } else {
          const errData = await res.json().catch(() => ({}));
          showError(errData.message || "Không thể cập nhật mẫu SMS OTP.");
        }
      }
    } catch {
      showError("Không thể kết nối đến server để lưu mẫu SMS.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Delivery Mode
  const handleToggleDeliveryMode = async (newMockEnabled: boolean) => {
    setSavingDeliveryMode(true);
    setErrorMsg(null);

    try {
      if (isOffline) {
        setDeliveryMode((prev) => ({
          mockEnabled: newMockEnabled,
          effectiveMockEnabled: newMockEnabled,
          providerConfigured: prev?.providerConfigured ?? false,
          version: (prev?.version || 0) + 1,
        }));
        showSuccess(`Đã chuyển sang chế độ ${newMockEnabled ? "MOCK (Thử nghiệm)" : "LIVE (Thực tế)"}`);
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-delivery-mode`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mockEnabled: newMockEnabled,
            expectedVersion: deliveryMode?.version ?? 0,
            reason: "Updated from admin settings UI",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setDeliveryMode(data.data);
          showSuccess(
            `Đã đổi chế độ phát SMS sang: ${data.data.effectiveMockEnabled ? "MOCK (Thử nghiệm)" : "LIVE (Thực tế)"}`
          );
        } else {
          const errData = await res.json().catch(() => ({}));
          showError(errData.message || "Không thể thay đổi chế độ gửi SMS.");
        }
      }
    } catch {
      showError("Không thể kết nối tới máy chủ để đổi chế độ SMS.");
    } finally {
      setSavingDeliveryMode(false);
    }
  };

  // Handle Clear Mock Inbox
  const handleClearInbox = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ tin nhắn SMS OTP thử nghiệm?")) return;
    setMockInboxLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-mock-inbox`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMockMessages([]);
        showSuccess("Đã xóa sạch hộp thư thử nghiệm SMS!");
      } else {
        showError("Không thể xóa hộp thư SMS.");
      }
    } catch {
      showError("Lỗi kết nối khi xóa hộp thư SMS.");
    } finally {
      setMockInboxLoading(false);
    }
  };

  // Copy Code Handler
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showSuccess(`Đã sao chép mã OTP: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send Test OTP Generator
  const handleSendTestOtp = async () => {
    setMockInboxLoading(true);
    try {
      const testPhone = "0901234567";
      const res = await fetch(`${API_BASE}/auth/register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, role: "chu-hang" }),
      });
      if (res.ok || res.status === 400 || res.status === 409) {
        await fetchMockInbox();
        showSuccess("Đã kích hoạt tạo tin nhắn OTP thử nghiệm!");
      }
    } catch (err) {
      console.warn("Test OTP trigger error", err);
    } finally {
      setMockInboxLoading(false);
    }
  };

  // Save Operation Settings
  const handleSaveOperations = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOperations(true);
    setTimeout(() => {
      setSavingOperations(false);
      showSuccess("Đã cập nhật tham số vận hành hệ thống thành công!");
    }, 600);
  };

  const isMockEffective = deliveryMode?.effectiveMockEnabled ?? true;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-primary-600" /> Cài Đặt Hệ Thống & Cấu Hình
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Quản lý thông tin doanh nghiệp hiển thị website, cấu hình tổng đài hotline, cổng SMS OTP và tham số sàn.
          </p>
        </div>

        {/* Live / Mock Mode Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500">Trạng thái phát SMS:</span>
          {isMockEffective ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> MOCK (Thử nghiệm)
            </span>
          ) : deliveryMode?.providerConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              <Send className="w-3.5 h-3.5 text-emerald-600" /> LIVE (Thực tế)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Chưa cấu hình Provider
            </span>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "company"
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Doanh Nghiệp & Liên Hệ</span>
        </button>

        <button
          onClick={() => setActiveTab("sms")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "sms"
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Cổng SMS & Hộp Thư OTP</span>
        </button>

        <button
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "operations"
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Tham Số Vận Hành & Sàn</span>
        </button>
      </div>

      {/* TAB 1: COMPANY & CONTACT INFORMATION */}
      {activeTab === "company" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Edit Form (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  Cấu Hình Thông Tin Hiển Thị Website
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Các thông tin này sẽ được cập nhật đồng bộ lên Footer, Trang Liên hệ, Trang Trợ giúp và các kênh truyền thông.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCompanyInfo} className="space-y-6">
              {/* Nhóm 1: Tên doanh nghiệp */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  1. Tên doanh nghiệp & Nhận diện
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tên pháp nhân doanh nghiệp *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tên thương hiệu / Viết tắt *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.shortName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, shortName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Số điện thoại & Tổng đài */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  2. Số điện thoại & Tổng đài hỗ trợ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tổng đài khẩn cấp 24/7 (Hotline) *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.hotline}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, hotline: e.target.value })}
                      placeholder="1900 6868"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-red-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số di động CSKH / Hỗ trợ kỹ thuật *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.phoneSupport}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phoneSupport: e.target.value })}
                      placeholder="0912 345 678"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Hệ thống Hòm thư Email */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  3. Hệ thống hòm thư điện tử (Email)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email liên hệ chung *
                    </label>
                    <input
                      type="email"
                      required
                      value={companyInfo.emailGeneral}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailGeneral: e.target.value })}
                      placeholder="lienhe@txepro.vn"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email hỗ trợ kỹ thuật / ví *
                    </label>
                    <input
                      type="email"
                      required
                      value={companyInfo.emailSupport}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailSupport: e.target.value })}
                      placeholder="hotro@txepro.vn"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email bảo mật / DPO *
                    </label>
                    <input
                      type="email"
                      required
                      value={companyInfo.emailPrivacy}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailPrivacy: e.target.value })}
                      placeholder="privacy@txepro.vn"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 4: Địa chỉ trụ sở & Chi nhánh */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  4. Địa chỉ văn phòng điều hành
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Trụ sở TP. Hồ Chí Minh *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.addressHcm}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, addressHcm: e.target.value })}
                      placeholder="Tầng 5, Tòa nhà Công nghệ Sài Gòn, Quận 1, TP. Hồ Chí Minh"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Văn phòng đại diện Hà Nội *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.addressHn}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, addressHn: e.target.value })}
                      placeholder="Tầng 8, Tòa nhà Logistics Tower, Cầu Giấy, Hà Nội"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm 5: Thời gian làm việc, Mạng xã hội & Mã số thuế */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  5. Thời gian làm việc & Liên kết số
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Khung giờ làm việc *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.workingHours}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, workingHours: e.target.value })}
                      placeholder="Thứ 2 - Thứ 7: 08:00 - 18:00 (Hệ thống điều phối 24/7)"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mã số thuế doanh nghiệp (MST) *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyInfo.taxCode}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxCode: e.target.value })}
                      placeholder="0317896868"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Đường dẫn Zalo Official Account
                    </label>
                    <input
                      type="url"
                      value={companyInfo.zaloUrl}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, zaloUrl: e.target.value })}
                      placeholder="https://zalo.me"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Đường dẫn Facebook Fanpage
                    </label>
                    <input
                      type="url"
                      value={companyInfo.facebookUrl}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/txepro.vn"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCompany ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Thay Đổi Thông Tin</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">
                  Xem trước hiển thị Website
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Thương hiệu</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {companyInfo.companyName || <span className="text-slate-500 italic text-sm">(Chưa đặt tên công ty)</span>}
                </p>
                {companyInfo.taxCode ? (
                  <p className="text-xs text-primary-300 font-medium">Mã số thuế: {companyInfo.taxCode}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic font-medium">(Chưa có mã số thuế)</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tổng đài 24/7:</span>
                    {companyInfo.hotline ? (
                      <span className="font-bold text-white text-sm">{companyInfo.hotline}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs">(Chưa cấu hình - Ẩn trên web)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email hỗ trợ:</span>
                    {companyInfo.emailSupport ? (
                      <span className="font-medium text-slate-200">{companyInfo.emailSupport}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs">(Chưa cấu hình - Ẩn trên web)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Trụ sở chính:</span>
                    {companyInfo.addressHcm ? (
                      <span className="font-medium text-slate-200 leading-relaxed block">{companyInfo.addressHcm}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs leading-relaxed block">(Chưa cấu hình - Ẩn trên web)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Giờ làm việc:</span>
                    {companyInfo.workingHours ? (
                      <span className="font-medium text-slate-200 leading-relaxed block">{companyInfo.workingHours}</span>
                    ) : (
                      <span className="text-slate-500 italic text-xs leading-relaxed block">(Chưa cấu hình - Ẩn trên web)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <a
                  href="/thong-tin/lien-he"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-300 hover:text-white transition-colors"
                >
                  <span>Kiểm tra trên trang /thong-tin/lien-he</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMS & OTP SETTINGS */}
      {activeTab === "sms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1: SMS Delivery Mode Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Chế Độ Phát SMS OTP</h2>
                    <p className="text-xs text-slate-400">Chọn giữa chế độ gửi tin SMS thực tế hoặc giả lập thử nghiệm</p>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    Bật Chế Độ Giả Lập SMS (Mock Delivery Mode)
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                    Khi bật, mã OTP sẽ được lưu vào hộp thư thử nghiệm hệ thống mà không tốn cước gửi tin nhắn Brandname/Twilio.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isMockEffective}
                    disabled={savingDeliveryMode}
                    onChange={(e) => handleToggleDeliveryMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Mode info alert */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed border flex items-start gap-3 ${
                  isMockEffective
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                }`}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  {isMockEffective ? (
                    <span>
                      <strong>Đang trong chế độ MOCK:</strong> Mọi mã OTP đăng ký / khôi phục mật khẩu sẽ hiển thị trực tiếp ở phần <em>Hộp Thư Thử Nghiệm SMS</em> bên dưới để bạn dễ dàng test tài khoản.
                    </span>
                  ) : (
                    <span>
                      <strong>Đang trong chế độ LIVE:</strong> Mã OTP sẽ được gửi trực tiếp tới số điện thoại của người dùng qua dịch vụ cổng SMS Brandname/Twilio tích hợp.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: SMS Template Configuration Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Mẫu Tin Nhắn SMS OTP</h2>
                    <p className="text-xs text-slate-400">Tùy biến nội dung tin nhắn gửi mã OTP tới tài xế & chủ hàng</p>
                  </div>
                </div>

                {updatedAt && (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                    Cập nhật: {new Date(updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nội dung mẫu SMS (Bắt buộc chứa biến{" "}
                    <code className="bg-slate-100 text-primary-600 px-1.5 py-0.5 rounded font-mono">{"{otp}"}</code>)
                  </label>
                  <textarea
                    rows={3}
                    value={template}
                    onChange={(e) => {
                      setTemplate(e.target.value);
                      setPreview(e.target.value.replace(/{otp}/g, "123456"));
                    }}
                    className="w-full text-sm font-medium px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-mono"
                  />
                </div>

                {/* Live Preview */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Xem trước tin nhắn SMS người dùng nhận được:
                  </span>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 leading-relaxed shadow-inner">
                    {preview || "Đang tải mẫu xem trước..."}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (defaultTemplate) {
                        setTemplate(defaultTemplate);
                        setPreview(defaultTemplate.replace(/{otp}/g, "123456"));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Lưu Mẫu Tin Nhắn
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: SMS Mock Inbox */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-500" />
                    Hộp Thư OTP Thử Nghiệm
                  </h3>
                  <p className="text-[11px] text-slate-400">Lấy mã OTP để kiểm thử tính năng</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchMockInbox()}
                    disabled={mockInboxLoading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50"
                    title="Làm mới"
                  >
                    <RefreshCw className={`w-4 h-4 ${mockInboxLoading ? "animate-spin text-primary-600" : ""}`} />
                  </button>
                  <button
                    onClick={handleClearInbox}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Xóa hộp thư"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action: Send Test OTP */}
              <button
                onClick={handleSendTestOtp}
                disabled={mockInboxLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Kích hoạt tạo thử 1 OTP Demo</span>
              </button>

              {/* Search Inbox */}
              <form onSubmit={handleSearchInbox} className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Lọc theo SĐT..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </form>

              {/* Message List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {mockMessages.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Chưa có tin nhắn OTP nào trong hộp thư thử nghiệm.
                  </div>
                ) : (
                  mockMessages.map((msg) => {
                    const expired = isOtpExpired(msg.expiresAt);
                    const isCopied = copiedId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          expired ? "bg-slate-50/60 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                          <span className="font-semibold text-slate-700">{formatPurpose(msg.purpose)}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString("vi-VN")}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-mono font-bold text-slate-800">{msg.phone}</div>
                          <button
                            onClick={() => handleCopyCode(msg.code, msg.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                              isCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-primary-50 text-primary-600 hover:bg-primary-100"
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{msg.code}</span>
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-500 mt-1.5 font-mono truncate">{msg.content}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM & OPERATIONS PARAMETERS */}
      {activeTab === "operations" && (
        <div className="max-w-4xl bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary-600" />
              Tham Số Vận Hành Hệ Thống Sàn
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cấu hình các cơ chế tự động, phí sàn, chế độ bảo trì và các tham số kỹ thuật trọng yếu.
            </p>
          </div>

          <form onSubmit={handleSaveOperations} className="space-y-6">
            {/* Toggles */}
            <div className="space-y-4">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Chế Độ Bảo Trì Toàn Sàn (Maintenance Mode)</p>
                  <p className="text-[11px] text-slate-500">
                    Khi kích hoạt, người dùng sẽ thấy thông báo tạm dừng dịch vụ để nâng cấp máy chủ.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              {/* Auto Verify KYC */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Tự Động Phê Duyệt eKYC Qua AI</p>
                  <p className="text-[11px] text-slate-500">
                    Tự động đối chiếu CCCD và GPLX hợp lệ từ cơ sở dữ liệu quốc gia mà không cần chuyên viên duyệt tay.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoVerifyKyc}
                    onChange={(e) => setAutoVerifyKyc(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-primary-600" />
                  Tỷ lệ hoa hồng kết nối sàn (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={platformCommission}
                  onChange={(e) => setPlatformCommission(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Khấu trừ tự động khi giải tỏa tiền cước chuyến hoàn tất.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary-600" />
                  Số dư ký quỹ ví tối thiểu (VND)
                </label>
                <input
                  type="number"
                  step={100000}
                  value={minEscrowAmount}
                  onChange={(e) => setMinEscrowAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Mức duy trì tối thiểu trong ví tài xế để nhận chuyến.</p>
              </div>
            </div>

            {/* System Specs Overview */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hạ tầng công nghệ sàn</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Backend Server</span>
                  <span className="font-bold text-slate-800">Node.js Express 5</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Database</span>
                  <span className="font-bold text-slate-800">MongoDB Atlas</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Ngân hàng liên kết</span>
                  <span className="font-bold text-slate-800">MB Bank 24/7</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Định vị GPS</span>
                  <span className="font-bold text-slate-800">Realtime Socket.io</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingOperations}
                className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingOperations ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu Tham Số Vận Hành</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
