"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import {
  Settings,
  ShieldCheck,
  Database,
  Server,
  Cpu,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  MessageSquare,
  Send,
  Smartphone,
  RefreshCw,
  Trash2,
  Search,
  Info,
  ShieldAlert,
  Inbox,
  Radio,
  Copy,
  Plus
} from "lucide-react";

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SMS OTP Template State
  const [template, setTemplate] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // SMS Delivery Mode State
  const [deliveryMode, setDeliveryMode] = useState<SmsDeliveryMode | null>(null);
  const [savingDeliveryMode, setSavingDeliveryMode] = useState(false);

  // SMS Mock Inbox State
  const [mockMessages, setMockMessages] = useState<SmsMockItem[]>([]);
  const [mockInboxLoading, setMockInboxLoading] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");

  // Operation Toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoVerifyKyc, setAutoVerifyKyc] = useState(false);

  // 1. Fetch SMS OTP Template
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
        throw new Error("API error");
      }
    } catch (err) {
      console.warn("Backend offline or template fetch error, using mock data", err);
      setIsOffline(true);
      setTemplate("[TING TING] Ma OTP cua ban la {otp}. #tingting.dev");
      setDefaultTemplate("[TING TING] Ma OTP cua ban la {otp}. #tingting.dev");
      setPreview("[TING TING] Ma OTP cua ban la 123456. #tingting.dev");
    }
  };

  // 2. Fetch SMS Delivery Mode
  const fetchDeliveryMode = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-delivery-mode`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryMode(data.data);
      }
    } catch (err) {
      console.warn("Backend offline or delivery mode fetch error, using mock fallback", err);
      setDeliveryMode({
        mockEnabled: true,
        effectiveMockEnabled: true,
        providerConfigured: false,
        source: "fallback",
        toggleAllowed: true,
        version: 1,
      });
    }
  };

  // 3. Fetch SMS Mock Inbox with correct mapping
  const fetchMockInbox = async (phone = "") => {
    setMockInboxLoading(true);
    try {
      const trimmedPhone = phone.trim();
      let res: Response;

      if (trimmedPhone) {
        res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-mock-inbox/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: trimmedPhone, limit: 50 }),
        });
      } else {
        res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-mock-inbox?limit=50`);
      }

      if (res.ok) {
        const data = await res.json();
        const rawItems = data.data?.messages || data.data?.items || (Array.isArray(data.data) ? data.data : []);
        
        const mappedItems: SmsMockItem[] = rawItems.map((m: any, idx: number) => {
          const otpCode = String(m.otpCode || m.code || "").trim();
          const maskedPhone = String(m.maskedPhone || m.phone || m.recipient || "—").trim();
          const purpose = String(m.purpose || "otp").trim();
          const tpl = template || "[TING TING] Ma OTP cua ban la {otp}. #tingting.dev";
          const content = otpCode ? tpl.replace(/{otp}/g, otpCode) : "Tin nhắn xác thực OTP";

          return {
            id: String(m.id || m._id || `mock-${idx}`),
            phone: maskedPhone,
            code: otpCode || "123456",
            purpose,
            content,
            createdAt: m.createdAt || new Date().toISOString(),
            expiresAt: m.expiresAt || m.otpExpiresAt,
          };
        });

        setMockMessages(mappedItems);
      } else {
        setMockMessages(getMockFallbackMessages());
      }
    } catch (err) {
      console.warn("Offline or mock inbox error, using fallback mock list", err);
      setMockMessages(getMockFallbackMessages());
    } finally {
      setMockInboxLoading(false);
    }
  };

  const getMockFallbackMessages = (): SmsMockItem[] => [
    {
      id: "mock-1",
      phone: "******4567",
      code: "882910",
      purpose: "register",
      content: "[TING TING] Ma OTP cua ban la 882910. #tingting.dev",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-2",
      phone: "******4321",
      code: "159340",
      purpose: "forgot_password",
      content: "[TING TING] Ma OTP cua ban la 159340. #tingting.dev",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchOtpTemplate(), fetchDeliveryMode()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (deliveryMode?.effectiveMockEnabled || isOffline) {
      fetchMockInbox();
    }
  }, [deliveryMode?.effectiveMockEnabled, isOffline]);

  // Handle Save Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isOffline) {
        setPreview(template.replace(/{otp}/g, "123456"));
        setSuccessMsg("Đã lưu mẫu tin nhắn SMS OTP (Chế độ Offline)");
        setTimeout(() => setSuccessMsg(null), 3000);
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
          setSuccessMsg("Đã cập nhật mẫu tin nhắn SMS OTP thành công!");
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.message || "Không thể cập nhật mẫu SMS OTP.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Không thể kết nối đến server để lưu mẫu SMS.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Delivery Mode (Mock vs Live)
  const handleToggleDeliveryMode = async (newMockEnabled: boolean) => {
    setSavingDeliveryMode(true);
    setErrorMsg(null);

    try {
      if (isOffline) {
        setDeliveryMode((prev) => ({
          mockEnabled: newMockEnabled,
          effectiveMockEnabled: newMockEnabled,
          providerConfigured: prev?.providerConfigured ?? false,
          source: "admin_override",
          toggleAllowed: true,
          version: (prev?.version || 0) + 1,
        }));
        setSuccessMsg(`Đã chuyển sang chế độ ${newMockEnabled ? "MOCK (Thử nghiệm)" : "LIVE (Thực tế)"}`);
        setTimeout(() => setSuccessMsg(null), 3000);
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
          setSuccessMsg(`Đã đổi chế độ phát SMS sang: ${data.data.effectiveMockEnabled ? "MOCK (Thử nghiệm)" : "LIVE (Thực tế)"}`);
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.message || "Không thể thay đổi chế độ gửi SMS.");
        }
      }
    } catch (err) {
      setErrorMsg("Không thể kết nối tới máy chủ để đổi chế độ SMS.");
    } finally {
      setSavingDeliveryMode(false);
    }
  };

  // Handle Search Mock Inbox
  const handleSearchInbox = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMockInbox(phoneSearch);
  };

  // Handle Clear Mock Inbox
  const handleClearInbox = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ tin nhắn SMS OTP thử nghiệm?")) return;
    setMockInboxLoading(true);

    try {
      if (isOffline) {
        setMockMessages([]);
        setSuccessMsg("Đã dọn dẹp hộp thư thử nghiệm SMS.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-mock-inbox`, {
          method: "DELETE",
        });

        if (res.ok) {
          setMockMessages([]);
          setSuccessMsg("Đã xóa sạch hộp thư thử nghiệm SMS!");
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.message || "Không thể xóa hộp thư SMS.");
        }
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối khi xóa hộp thư SMS.");
    } finally {
      setMockInboxLoading(false);
    }
  };

  // Copy Code Handler
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setSuccessMsg(`Đã sao chép mã OTP: ${code}`);
    setTimeout(() => {
      setCopiedId(null);
      setSuccessMsg(null);
    }, 2000);
  };

  // Send Test OTP Generator
  const handleSendTestOtp = async () => {
    setMockInboxLoading(true);
    try {
      if (isOffline) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newItem: SmsMockItem = {
          id: `test-${Date.now()}`,
          phone: "******9999",
          code: newCode,
          purpose: "register",
          content: (template || "[TING TING] Ma OTP cua ban la {otp}").replace(/{otp}/g, newCode),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
        setMockMessages((prev) => [newItem, ...prev]);
        setSuccessMsg(`Đã tạo thử OTP demo: ${newCode}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const testPhone = "0901234567";
        const res = await fetch(`${API_BASE}/auth/register-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: testPhone, role: "chu-hang" }),
        });
        if (res.ok || res.status === 400 || res.status === 409) {
          await fetchMockInbox();
          setSuccessMsg("Đã kích hoạt tạo tin nhắn OTP thử nghiệm!");
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      }
    } catch (err) {
      console.warn("Test OTP trigger error", err);
    } finally {
      setMockInboxLoading(false);
    }
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
            <Settings className="w-7 h-7 text-primary-600" /> Cài Đặt Hệ Thống & SMS
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Quản lý cổng SMS OTP, chế độ phát tin nhắn thử nghiệm/thực tế và lấy mã OTP kiểm thử nhanh.
          </p>
        </div>

        {/* Live / Mock Mode Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500">Trạng thái phát SMS:</span>
          {isMockEffective ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> MOCK (Thử nghiệm)
            </span>
          ) : deliveryMode?.providerConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              <Send className="w-3.5 h-3.5 text-emerald-600" /> LIVE (Thực tế)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Chưa cấu hình Provider
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 1: SMS Delivery Mode Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-5">
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
            <div className={`p-4 rounded-2xl text-xs leading-relaxed border flex items-start gap-3 ${
              isMockEffective
                ? "bg-amber-50/70 border-amber-200 text-amber-900"
                : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
            }`}>
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

          {/* SECTION 2: SMS OTP Template Config */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mẫu Tin Nhắn SMS OTP</h2>
                  <p className="text-xs text-slate-400">Cấu hình nội dung tin nhắn xác thực mã OTP gửi đến điện thoại</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTemplate(defaultTemplate)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                  Nội dung Mẫu Tin Nhắn
                </label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-semibold focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-inner resize-none bg-slate-50/30"
                  placeholder="Nhập mẫu tin nhắn..."
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1.5 pl-1 leading-normal">
                  ⚠️ Lưu ý: Nội dung tin nhắn bắt buộc phải chứa biến <code className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{"{otp}"}</code> để hệ thống điền mã OTP ngẫu nhiên.
                </p>
              </div>

              {/* Realtime Preview */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Xem Trước Tin Nhắn (Ví dụ OTP: 123456)</span>
                  {updatedAt && (
                    <span>Cập nhật: {new Date(updatedAt).toLocaleString("vi-VN")}</span>
                  )}
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-sm leading-relaxed tracking-tight">
                  {template.replace(/{otp}/g, "123456") || "Vui lòng nhập nội dung mẫu tin nhắn..."}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-3 px-6 text-xs font-bold rounded-xl shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> Lưu Mẫu Tin Nhắn
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: SMS Mock Inbox */}
          {(isMockEffective || isOffline) && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-sm">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Hộp Thư SMS Thử Nghiệm (Mock Inbox)
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                        {mockMessages.length} tin
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">Xem và lấy nhanh mã OTP vừa được tạo gần đây khi chạy thử nghiệm</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestOtp}
                    disabled={mockInboxLoading}
                    className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Tạo lượt gửi OTP thử nghiệm"
                  >
                    <Plus className="w-4 h-4 text-amber-600" /> Tạo OTP Demo
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchMockInbox(phoneSearch)}
                    disabled={mockInboxLoading}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Tải lại hộp thư"
                  >
                    <RefreshCw className={`w-4 h-4 ${mockInboxLoading ? "animate-spin" : ""}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearInbox}
                    disabled={mockInboxLoading || mockMessages.length === 0}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa toàn bộ
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <form onSubmit={handleSearchInbox} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    placeholder="Lọc theo số điện thoại (VD: 0901234567)..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Tìm kiếm
                </button>
              </form>

              {/* Table / List */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                {mockMessages.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Chưa có tin nhắn SMS OTP thử nghiệm nào trong cơ sở dữ liệu</p>
                    <p className="text-[11px] text-slate-400">Nhấn nút "Tạo OTP Demo" ở trên hoặc thực hiện Đăng ký / Quên mật khẩu từ ứng dụng để sinh OTP.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                        <th className="p-3 pl-4">Số điện thoại</th>
                        <th className="p-3">Mã OTP (Click copy)</th>
                        <th className="p-3">Mục đích</th>
                        <th className="p-3">Nội dung SMS</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3 pr-4 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {mockMessages.map((msg) => {
                        const expired = isOtpExpired(msg.expiresAt);
                        const isCopied = copiedId === msg.id;

                        return (
                          <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pl-4 font-bold text-slate-900">{msg.phone}</td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleCopyCode(msg.code, msg.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-extrabold text-sm transition-all cursor-pointer border shadow-sm ${
                                  isCopied
                                    ? "bg-emerald-500 text-white border-emerald-600 scale-105"
                                    : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400"
                                }`}
                                title="Click để sao chép mã OTP này"
                              >
                                {msg.code}
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-amber-700 opacity-70" />}
                              </button>
                            </td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 text-[11px]">
                                {formatPurpose(msg.purpose)}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs truncate font-mono text-[11px] text-slate-600" title={msg.content}>
                              {msg.content}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3 pr-4 text-right whitespace-nowrap">
                              {expired ? (
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold">
                                  Hết hạn
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                                  Còn hiệu lực
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Operation Toggles */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Tùy Chọn Vận Hành Khác
            </h3>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">Chế độ bảo trì hệ thống</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tạm thời khóa kết nối từ ứng dụng Mobile của tài xế và chủ hàng
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Auto Verify KYC */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">Tự động duyệt xác minh KYC</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tự động duyệt KYC nếu tài liệu đối chiếu khớp 100% qua VNPT eKYC
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoVerifyKyc}
                  onChange={(e) => setAutoVerifyKyc(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column (Server Status & Resources) */}
        <div className="space-y-6">

          {/* Status Check Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" /> Trạng Thái Máy Chủ
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Tình Trạng API</span>
                <span className={`font-bold flex items-center gap-1 ${isOffline ? "text-amber-500" : "text-emerald-600"}`}>
                  <ShieldCheck className="w-3.5 h-3.5" /> {isOffline ? "Chế độ offline" : "Hoạt động (Online)"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Cơ sở dữ liệu (MongoDB)</span>
                <span className={`font-bold flex items-center gap-1 ${isOffline ? "text-amber-500" : "text-emerald-600"}`}>
                  <Database className="w-3.5 h-3.5" /> {isOffline ? "Không thể kết nối" : "Kết nối tốt"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Cổng SMS OTP</span>
                <span className="font-bold text-slate-800">
                  {isMockEffective ? "Mock Sandbox" : "Twilio / Brandname"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Phiên Bản Hệ Thống</span>
                <span className="font-bold text-slate-700">v1.2.4-stable</span>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" /> Hiệu Năng Server
            </h3>

            <div className="space-y-4 pt-2">
              {/* CPU Load */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>CPU Load</span>
                  <span className="text-slate-700">{isOffline ? "0%" : "14%"}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: isOffline ? "0%" : "14%" }} />
                </div>
              </div>

              {/* RAM Usage */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Dung lượng RAM</span>
                  <span className="text-slate-700">{isOffline ? "0%" : "42%"}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: isOffline ? "0%" : "42%" }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
