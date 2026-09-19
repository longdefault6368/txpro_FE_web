"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, Shield, Camera, Save, ArrowLeft,
  KeyRound, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle,
  Smartphone, X, RefreshCw, Lock, Sparkles,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";
import { ADMIN_ROLE_CONFIG, type AdminRole } from "@/app/admin/layout";

interface AdminProfile {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  adminRole?: AdminRole;
  adminPermissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
  isActive?: boolean;
}

import { useToast } from "@/context/ToastContext";

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change Password State
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwOtp, setPwOtp] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwOtpSending, setPwOtpSending] = useState(false);
  const [pwOtpTimer, setPwOtpTimer] = useState(0);
  const [pwDevOtp, setPwDevOtp] = useState<string | null>(null);

  // Change Phone State & Modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"current_otp" | "new_phone" | "new_otp">("current_otp");
  const [currentPhoneOtp, setCurrentPhoneOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneOtp, setNewPhoneOtp] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneDevOtp, setPhoneDevOtp] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // Password OTP Countdown
  useEffect(() => {
    if (pwOtpTimer <= 0) return;
    const timer = setInterval(() => setPwOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [pwOtpTimer]);

  // Phone OTP Countdown
  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const timer = setInterval(() => setPhoneOtpTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneOtpTimer]);

  useEffect(() => {
    const saved = localStorage.getItem("txpro_user_session");
    if (!saved) {
      router.push("/admin/login");
      return;
    }
    try {
      const session = JSON.parse(saved);
      if (!session?.id) {
        router.push("/admin/login");
        return;
      }
      loadProfile(session.id);
    } catch {
      router.push("/admin/login");
    }
  }, []);

  const loadProfile = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}`);
      if (!res.ok) throw new Error("Không thể tải thông tin quản trị viên");
      const data = await res.json();
      const user: AdminProfile = data.data?.user || data.user || data;
      setProfile(user);
      setName(user.name || "");
      if (user.avatar) setAvatarPreview(getServerMediaUrl(user.avatar) || user.avatar);
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Vui lòng chọn tệp định dạng hình ảnh hợp lệ (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Kích thước ảnh đại diện phải nhỏ hơn 5MB");
      return;
    }

    // Set preview immediately for responsive UX
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

      const primaryUrl = isLocalhost
        ? "http://localhost:5000/api/v1/auth/profile/avatar"
        : `${API_BASE}/auth/profile/avatar`;

      let res = await fetchWithAuth(primaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok && isLocalhost) {
        try {
          const fallbackRes = await fetchWithAuth(`${API_BASE}/auth/profile/avatar`, {
            method: "POST",
            body: formData,
          });
          if (fallbackRes.ok) res = fallbackRes;
        } catch {}
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Tải ảnh đại diện thất bại");
      }

      const data = await res.json();
      const uploadedUrl = data.data?.url || data.url;

      if (uploadedUrl) {
        // Also update via admin user endpoint to guarantee consistency in MongoDB
        if (profile?._id) {
          await fetchWithAuth(`${API_BASE}/admin/users/${profile._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: uploadedUrl }),
          }).catch(() => {});
        }

        const fullDisplayUrl = getServerMediaUrl(uploadedUrl) || uploadedUrl;
        setAvatarPreview(fullDisplayUrl);
        setProfile((prev) => (prev ? { ...prev, avatar: uploadedUrl } : prev));

        // Update local session so header avatar updates instantly
        const saved = localStorage.getItem("txpro_user_session");
        if (saved) {
          const session = JSON.parse(saved);
          session.avatar = uploadedUrl;
          localStorage.setItem("txpro_user_session", JSON.stringify(session));
          window.dispatchEvent(new Event("storage"));
        }

        showToast("success", "Cập nhật ảnh đại diện thành công!");
      }
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi cập nhật ảnh đại diện");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?._id) return;
    if (!name.trim()) {
      showToast("error", "Vui lòng nhập họ và tên hiển thị");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: name.trim() };
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${profile._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Lưu thông tin thất bại");
      }
      const data = await res.json();
      const updated: AdminProfile = data.data?.user || data.user || data;

      const saved = localStorage.getItem("txpro_user_session");
      if (saved) {
        const session = JSON.parse(saved);
        session.name = updated.name || name.trim();
        localStorage.setItem("txpro_user_session", JSON.stringify(session));
        window.dispatchEvent(new Event("storage"));
      }

      setProfile((p) => (p ? { ...p, name: updated.name || name.trim() } : p));
      showToast("success", "Cập nhật thông tin thành công!");
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  // --- Password Change Flow with OTP ---
  const handleRequestPasswordOtp = async () => {
    if (!profile?.phone) {
      showToast("error", "Tài khoản chưa có số điện thoại. Vui lòng cập nhật số điện thoại trước khi đổi mật khẩu.");
      return;
    }
    if (pwOtpTimer > 0) return;
    setPwOtpSending(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể gửi mã OTP đổi mật khẩu");
      }
      setPwOtpTimer(60);
      if (data.data?.devOtp) {
        setPwDevOtp(data.data.devOtp);
      }
      showToast("success", `Mã OTP đã được gửi đến số ${profile.phone}`);
    } catch (err: any) {
      showToast("error", err.message || "Không thể gửi mã OTP");
    } finally {
      setPwOtpSending(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!profile?._id) return;
    if (!currentPw) {
      showToast("error", "Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPw) {
      showToast("error", "Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPw.length < 6) {
      showToast("error", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("error", "Xác nhận mật khẩu mới không khớp");
      return;
    }
    if (!pwOtp.trim() || pwOtp.trim().length !== 6) {
      showToast("error", "Vui lòng nhập mã OTP gồm đúng 6 chữ số");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/password-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          otp: pwOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwOtp("");
      setPwDevOtp(null);
      setShowPwSection(false);
      showToast("success", "Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng.");
    } catch (err: any) {
      showToast("error", err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwSaving(false);
    }
  };

  // --- Phone Change Flow with OTP ---
  const openPhoneModal = async () => {
    setCurrentPhoneOtp("");
    setNewPhone("");
    setNewPhoneOtp("");
    setPhoneVerificationToken("");
    setPhoneDevOtp(null);
    setShowPhoneModal(true);

    if (profile?.phone) {
      setPhoneStep("current_otp");
      // Send OTP to current phone automatically
      sendCurrentPhoneOtp();
    } else {
      // User has no phone yet, directly prompt for new phone
      setPhoneStep("new_phone");
      // Request initial verification token from backend
      try {
        const res = await fetchWithAuth(`${API_BASE}/auth/profile/phone-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "current" }),
        });
        const data = await res.json();
        if (data.data?.verificationToken) {
          setPhoneVerificationToken(data.data.verificationToken);
        }
      } catch {
        // Fallback
      }
    }
  };

  const sendCurrentPhoneOtp = async () => {
    if (phoneOtpTimer > 0) return;
    setPhoneLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "current" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể gửi mã OTP đến số điện thoại hiện tại");
      setPhoneOtpTimer(60);
      if (data.data?.devOtp) {
        setPhoneDevOtp(data.data.devOtp);
      }
      if (data.data?.verificationToken && data.data?.noExistingPhone) {
        setPhoneVerificationToken(data.data.verificationToken);
        setPhoneStep("new_phone");
      }
      showToast("success", `Mã OTP đã gửi đến ${profile?.phone}`);
    } catch (err: any) {
      showToast("error", err.message || "Gửi OTP thất bại");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyCurrentPhoneOtp = async () => {
    if (!currentPhoneOtp.trim() || currentPhoneOtp.trim().length !== 6) {
      showToast("error", "Vui lòng nhập mã OTP 6 số xác thực số hiện tại");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/phone-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "current", otp: currentPhoneOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Mã OTP không chính xác");
      setPhoneVerificationToken(data.data?.verificationToken || "");
      setPhoneStep("new_phone");
      setPhoneOtpTimer(0);
      setPhoneDevOtp(null);
      showToast("success", "Xác thực số hiện tại thành công. Vui lòng nhập số điện thoại mới!");
    } catch (err: any) {
      showToast("error", err.message || "Xác thực OTP thất bại");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendNewPhoneOtp = async () => {
    const cleanedPhone = newPhone.trim();
    if (!cleanedPhone || cleanedPhone.length < 9) {
      showToast("error", "Vui lòng nhập số điện thoại mới hợp lệ");
      return;
    }
    if (profile?.phone && cleanedPhone === profile.phone) {
      showToast("error", "Số điện thoại mới phải khác số điện thoại hiện tại");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "new",
          phone: cleanedPhone,
          verificationToken: phoneVerificationToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể gửi OTP đến số mới");
      setPhoneOtpTimer(60);
      if (data.data?.devOtp) {
        setPhoneDevOtp(data.data.devOtp);
      }
      setPhoneStep("new_otp");
      showToast("success", `Mã OTP đã được gửi đến số mới ${cleanedPhone}`);
    } catch (err: any) {
      showToast("error", err.message || "Gửi OTP đến số mới thất bại");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyNewPhoneOtp = async () => {
    if (!newPhoneOtp.trim() || newPhoneOtp.trim().length !== 6) {
      showToast("error", "Vui lòng nhập mã OTP 6 số gửi đến số mới");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/profile/phone-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "new",
          phone: newPhone.trim(),
          otp: newPhoneOtp.trim(),
          verificationToken: phoneVerificationToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xác thực số điện thoại mới thất bại");

      const updatedUser = data.data?.user || {};
      const newPhoneVal = updatedUser.phone || newPhone.trim();

      // Update local storage session
      const saved = localStorage.getItem("txpro_user_session");
      if (saved) {
        const session = JSON.parse(saved);
        session.phone = newPhoneVal;
        localStorage.setItem("txpro_user_session", JSON.stringify(session));
      }

      // Update tokens if provided
      if (data.data?.accessToken) {
        localStorage.setItem("txpro_access_token", data.data.accessToken);
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("txpro_refresh_token", data.data.refreshToken);
      }

      setProfile((p) => (p ? { ...p, phone: newPhoneVal } : p));
      setShowPhoneModal(false);
      showToast("success", "Cập nhật số điện thoại mới thành công!");
    } catch (err: any) {
      showToast("error", err.message || "Xác thực số mới thất bại");
    } finally {
      setPhoneLoading(false);
    }
  };

  const roleCfg = ADMIN_ROLE_CONFIG[(profile?.adminRole || "super_admin") as AdminRole] || ADMIN_ROLE_CONFIG.super_admin;
  const initials = (name || profile?.name || "AD").split(" ").pop()?.substring(0, 2).toUpperCase() || "AD";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Thông Tin Tài Khoản</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật họ tên, ảnh đại diện, số điện thoại và bảo mật tài khoản quản trị
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #6366f1 0%, transparent 60%)" }}
          />
        </div>
        <div className="px-6 pb-6 -mt-12">
          {/* Avatar Section */}
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-primary-600 flex items-center justify-center text-white font-bold text-2xl relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Ảnh đại diện" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-600 text-white border-2 border-white flex items-center justify-center shadow-md hover:bg-primary-700 disabled:opacity-75 transition-colors cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Role Badge */}
          <div className="mb-5">
            <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border " + roleCfg.badgeClass}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleCfg.color }} />
              {roleCfg.label}
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên hiển thị <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email || "-"}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 text-sm text-slate-500 bg-slate-50 cursor-not-allowed font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Email định danh tài khoản quản trị viên</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Số điện thoại</label>
                <button
                  type="button"
                  onClick={openPhoneModal}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {profile?.phone ? "Đổi số điện thoại (OTP)" : "Thêm số điện thoại"}
                </button>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={profile?.phone || "Chưa thiết lập"}
                  readOnly
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-100 text-sm text-slate-700 bg-slate-50 font-medium"
                />
                <button
                  type="button"
                  onClick={openPhoneModal}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors cursor-pointer"
                >
                  Thay đổi
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                Số điện thoại dùng để nhận mã xác thực OTP khi đăng nhập và đổi mật khẩu
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowPwSection(!showPwSection)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary-600" />
            Đổi Mật Khẩu Tài Khoản
          </span>
          <span
            className={
              "text-[10px] font-bold px-2 py-0.5 rounded-full border " +
              (showPwSection
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-slate-100 text-slate-500 border-slate-200")
            }
          >
            {showPwSection ? "Thu gọn" : "Mở rộng"}
          </span>
        </button>

        {showPwSection && (
          <div className="px-6 pb-6 border-t border-slate-100 space-y-4 pt-4">
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bảo mật 2 lớp qua mã OTP</p>
                <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                  Để đảm bảo an toàn tối đa cho tài khoản quản trị, thao tác đổi mật khẩu yêu cầu xác thực bằng mã OTP gửi về số điện thoại của bạn ({profile?.phone || "Chưa có SĐT"}).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className={
                      "w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 " +
                      (confirmPw && confirmPw !== newPw ? "border-red-300 bg-red-50" : "border-slate-200")
                    }
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-[11px] text-red-500 mt-1 ml-1">Mật khẩu xác nhận không khớp</p>
                )}
              </div>
            </div>

            {/* OTP Input for Password Change */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Mã xác thực OTP <span className="text-red-500">*</span>
                </label>
                {pwDevOtp && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                    Mã thử nghiệm: {pwDevOtp}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={pwOtp}
                    onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-wider font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="Nhập 6 chữ số OTP"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestPasswordOtp}
                  disabled={pwOtpSending || pwOtpTimer > 0 || !profile?.phone}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  {pwOtpSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  ) : (
                    <RefreshCw className={`w-3.5 h-3.5 ${pwOtpTimer > 0 ? "animate-spin text-slate-400" : "text-primary-600"}`} />
                  )}
                  {pwOtpTimer > 0 ? `Gửi lại sau (${pwOtpTimer}s)` : "Nhận mã OTP"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                {profile?.phone
                  ? `Nhấn "Nhận mã OTP" để gửi mã xác thực 6 số đến ${profile.phone}`
                  : "Vui lòng cập nhật số điện thoại ở trên trước khi yêu cầu OTP"}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={pwSaving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw || pwOtp.length !== 6}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {pwSaving ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Change Phone Number */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {profile?.phone ? "Thay Đổi Số Điện Thoại" : "Cập Nhật Số Điện Thoại"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Xác thực 2 bước an toàn bằng mã OTP</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            {profile?.phone && (
              <div className="flex items-center justify-between px-2 text-xs">
                <div className={`flex items-center gap-1.5 font-bold ${phoneStep === "current_otp" ? "text-primary-600" : "text-emerald-600"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${phoneStep === "current_otp" ? "bg-primary-100 text-primary-700" : "bg-emerald-100 text-emerald-700"}`}>
                    1
                  </span>
                  <span>Xác thực số cũ</span>
                </div>
                <div className="h-0.5 w-8 bg-slate-200" />
                <div className={`flex items-center gap-1.5 font-bold ${phoneStep === "new_phone" || phoneStep === "new_otp" ? "text-primary-600" : "text-slate-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${phoneStep === "new_phone" || phoneStep === "new_otp" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-400"}`}>
                    2
                  </span>
                  <span>Xác thực số mới</span>
                </div>
              </div>
            )}

            {/* Step 1: Verify Current Phone */}
            {phoneStep === "current_otp" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mã OTP xác thực đã được gửi đến số điện thoại hiện tại của bạn:{" "}
                  <strong className="text-slate-900">{profile?.phone}</strong>. Vui lòng nhập mã để tiếp tục.
                </p>

                {phoneDevOtp && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span className="font-semibold">Mã OTP thử nghiệm:</span>
                    <span className="font-mono font-bold">{phoneDevOtp}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nhập mã OTP (6 số)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={currentPhoneOtp}
                    onChange={(e) => setCurrentPhoneOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-bold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="• • • • • •"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={sendCurrentPhoneOtp}
                    disabled={phoneOtpTimer > 0 || phoneLoading}
                    className="text-primary-600 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    {phoneOtpTimer > 0 ? `Gửi lại mã (${phoneOtpTimer}s)` : "Gửi lại mã OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyCurrentPhoneOtp}
                    disabled={phoneLoading || currentPhoneOtp.length !== 6}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    {phoneLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Tiếp tục
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Input New Phone */}
            {phoneStep === "new_phone" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhập số điện thoại mới bạn muốn liên kết với tài khoản quản trị. Hệ thống sẽ gửi một mã OTP đến số này để xác thực.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/[^\d+]/g, ""))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      placeholder="Ví dụ: 0912345678"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNewPhoneOtp}
                    disabled={phoneLoading || newPhone.trim().length < 9}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {phoneLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Gửi mã OTP đến số mới
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Verify OTP on New Phone */}
            {phoneStep === "new_otp" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mã OTP xác thực đã được gửi đến số mới: <strong className="text-slate-900">{newPhone}</strong>. Vui lòng nhập mã để hoàn tất cập nhật.
                </p>

                {phoneDevOtp && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span className="font-semibold">Mã OTP thử nghiệm:</span>
                    <span className="font-mono font-bold">{phoneDevOtp}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nhập mã OTP (6 số)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newPhoneOtp}
                    onChange={(e) => setNewPhoneOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-bold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="• • • • • •"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleSendNewPhoneOtp}
                    disabled={phoneOtpTimer > 0 || phoneLoading}
                    className="text-primary-600 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    {phoneOtpTimer > 0 ? `Gửi lại mã (${phoneOtpTimer}s)` : "Gửi lại mã OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyNewPhoneOtp}
                    disabled={phoneLoading || newPhoneOtp.length !== 6}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    {phoneLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Xác nhận & Cập nhật
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}