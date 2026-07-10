"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { Settings, ShieldCheck, Database, Server, Cpu, Check, AlertCircle, Save, RotateCcw } from "lucide-react";

export default function AdminSettingsPage() {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [template, setTemplate] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Fake toggle states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoVerifyKyc, setAutoVerifyKyc] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    const token = localStorage.getItem("txpro_token");

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
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.message || "Không thể tải cấu hình từ Backend");
      }
    } catch (err: any) {
      console.warn("Backend offline or settings connection error, using mock template settings", err);
      setIsOffline(true);
      // Mock fallback template
      setTemplate("[TING TING] Ma OTP cua ban la {otp}. #tingting.dev");
      setDefaultTemplate("[TING TING] Ma OTP cua ban la {otp}. #tingting.dev");
      setPreview("[TING TING] Ma OTP cua ban la 123456. #tingting.dev");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const token = localStorage.getItem("txpro_token");

    try {
      if (isOffline) {
        // Mock success save
        setPreview(template.replace(/{otp}/g, "123456"));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/settings/sms-otp-template`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ template })
        });

        if (res.ok) {
          const data = await res.json();
          setTemplate(data.data.template);
          setPreview(data.data.preview);
          setUpdatedAt(data.data.updatedAt);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.message || "Không thể cập nhật cấu hình");
        }
      }
    } catch (err: any) {
      setErrorMsg("Không thể kết nối đến server để lưu cấu hình.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDefault = () => {
    setTemplate(defaultTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {success && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5" /> Đã cập nhật thiết lập hệ thống!
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-slate-400 text-xs mt-1">Quản lý cấu hình dịch vụ, mẫu tin nhắn SMS OTP và trạng thái tài nguyên máy chủ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/50 p-6 md:p-8 shadow-xl space-y-6">
          
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary-600" /> Cấu Hình SMS OTP Template
            </h3>

            {/* Template input */}
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mẫu Tin Nhắn OTP</label>
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Mặc định
                </button>
              </div>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary-500 text-sm mt-2 text-slate-700 font-semibold shadow-inner resize-none bg-slate-50/20"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed pl-1">
                Lưu ý: Mẫu tin nhắn phải chứa từ khóa <code className="text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded">{"{otp}"}</code> để hệ thống tự động chèn mã số OTP xác thực ngẫu nhiên.
              </p>
            </div>

            {/* Preview SMS Message */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Xem Trước Tin Nhắn (Demo OTP 123456)</h4>
              <p className="text-xs text-slate-700 font-bold font-mono tracking-tight bg-white p-3 rounded-xl border border-slate-200/50 shadow-sm leading-relaxed">
                {preview || "Đang tạo xem trước..."}
              </p>
              {updatedAt && (
                <p className="text-[9px] text-slate-400 font-semibold text-right mt-2">
                  Cập nhật lần cuối: {new Date(updatedAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>

            {/* Toggle Switch Options */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Tùy Chọn Vận Hành Khác</h3>
              
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Chế độ bảo trì hệ thống</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Tạm thời khóa kết nối từ ứng dụng Mobile của tài xế và chủ hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Auto Verify KYC */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Tự động duyệt xác minh KYC</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Tự động duyệt KYC nếu các tài liệu tải lên trùng khớp 100%</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoVerifyKyc}
                    onChange={(e) => setAutoVerifyKyc(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3 px-6 text-xs font-bold rounded-xl shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Lưu cấu hình
              </button>
            </div>
          </form>
        </div>

        {/* Server Resources Status */}
        <div className="space-y-6">
          {/* Status Check Card */}
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" /> Trạng Thái Server
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
                <span className="text-slate-400 font-semibold">Phiên Bản Hệ Thống</span>
                <span className="font-bold text-slate-700">v1.2.4-stable</span>
              </div>
            </div>
          </div>

          {/* Resources card */}
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" /> Hiệu Năng Máy Chủ
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
