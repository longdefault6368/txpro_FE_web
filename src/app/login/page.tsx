"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Smartphone, KeyRound, Check } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

// Helper to retrieve or generate deviceId consistent with backend validator
const getDeviceId = () => {
  if (typeof window === "undefined") return "web-client";
  let id = localStorage.getItem("txpro_device_id");
  if (!id) {
    id = "web-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("txpro_device_id", id);
  }
  return id;
};

// Mask phone number for security
const maskPhone = (phone: string | null) => {
  if (!phone) return "******";
  const cleaned = phone.trim();
  if (cleaned.length < 4) return cleaned;
  return cleaned.substring(0, cleaned.length - 4) + "****";
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verification flow for new device
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verifyData, setVerifyData] = useState<{ userId: string; phone: string | null; expiredIn: number } | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    // Strict client-side validation
    if (!identifier.trim()) {
      setError("Vui lòng nhập số điện thoại hoặc email đăng nhập");
      setLoading(false);
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }

    const isEmail = identifier.includes("@");
    if (isEmail) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(identifier.trim())) {
        setError("Định dạng email đăng nhập không hợp lệ");
        setLoading(false);
        return;
      }
    } else {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(identifier.trim().replace(/\s+/g, ""))) {
        setError("Số điện thoại đăng nhập không hợp lệ");
        setLoading(false);
        return;
      }
    }

    // Align exactly with backend Joi schema validation
    const payload = {
      phoneOrEmail: identifier.trim(),
      password: password,
      deviceId: getDeviceId(),
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.setItem("txpro_token", data.data.accessToken || "");
        localStorage.setItem("txpro_refresh_token", data.data.refreshToken || "");
        
        const userProfile = data.data.userProfile || data.data.user || {};
        const userRole = userProfile.role || data.data.role || "chu-hang";
        const userName = userProfile.fullName || userProfile.name || "Người dùng TXEPRO";

        localStorage.setItem("txpro_user_session", JSON.stringify({
          name: userName,
          role: userRole === "admin" ? "Admin" : userRole === "tai-xe" ? "Tài Xế" : "Chủ Hàng",
          rawRole: userRole
        }));
        setSuccess(true);
        const targetRoute = userRole === "admin" ? "/admin" : "/user";
        setTimeout(() => router.push(targetRoute), 1200);
      } else {
        // If server indicates new device validation is required
        if (data.errorCode === "NEW_DEVICE_VERIFICATION_REQUIRED") {
          setVerifyData(data.data);
          setVerificationRequired(true);
        } else {
          setError(data.message || "Tài khoản hoặc mật khẩu không chính xác");
        }
      }
    } catch (err: any) {
      console.error("Login connection error:", err);
      setError("Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền hoặc khởi động Backend!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyData) return;
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Mã OTP phải có độ dài đúng 6 số");
      return;
    }

    setVerifying(true);
    setError(null);

    const payload = {
      userId: verifyData.userId,
      otp: otp.trim(),
      deviceId: getDeviceId()
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/auth/verify-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Device is verified! Reset verification states and resubmit login
        setVerificationRequired(false);
        setOtp("");
        // Automatically resubmit the login request to obtain authorization token
        handleSubmit();
      } else {
        setError(data.message || "Mã xác nhận OTP không chính xác hoặc đã hết hạn");
      }
    } catch (err) {
      setError("Không thể kết nối để xác thực thiết bị. Vui lòng kiểm tra lại đường truyền.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center pt-28 pb-16 relative overflow-hidden">
        {/* Modern decorative floating orbs in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="max-w-xl w-full mx-auto px-4 z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/80 relative">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-t-3xl"></div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {verificationRequired ? "Xác Minh Thiết Bị Mới" : "Chào Mừng Trở Lại"}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {verificationRequired 
                  ? "Vui lòng nhập mã OTP để tiếp tục đăng nhập trên thiết bị này" 
                  : "Đăng nhập để kết nối với hệ sinh thái vận tải TXEPRO"}
              </p>
            </div>

            {/* Display error warning alert */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xl shadow-emerald-50 animate-bounce">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Đăng Nhập Thành Công</h3>
                <p className="text-slate-400 text-sm">Đang chuyển hướng bạn...</p>
              </div>
            ) : verificationRequired ? (
              /* Step 2: New device verification view */
              <form onSubmit={handleVerifyDevice} className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold leading-relaxed">
                  <Smartphone className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5 animate-pulse" />
                  <p>
                    Để đảm bảo an toàn bảo mật, hệ thống phát hiện đây là thiết bị truy cập mới. Chúng tôi đã gửi một tin nhắn SMS chứa mã OTP xác thực đến số điện thoại đăng ký <strong className="text-blue-900">{maskPhone(verifyData?.phone || "")}</strong>.
                  </p>
                </div>

                {/* OTP Input */}
                <div className="relative group">
                  <input
                    type="text"
                    id="otp"
                    placeholder=" "
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-bold tracking-widest transition-all shadow-inner bg-slate-50/30"
                    required
                  />
                  <label
                    htmlFor="otp"
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                  >
                    Nhập mã OTP (6 số)
                  </label>
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 peer-focus:text-primary-500 transition-colors duration-200" />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationRequired(false);
                      setOtp("");
                      setError(null);
                    }}
                    className="w-1/3 border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl text-xs transition-colors cursor-pointer text-center hover:bg-slate-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 btn-primary py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {verifying ? "Đang xác minh..." : (
                      <>
                        Xác Nhận Thiết Bị <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 1: Input email/phone and password */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input SĐT/Email */}
                <div className="relative group">
                  <input
                    type="text"
                    id="identifier"
                    placeholder=" "
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30"
                    required
                  />
                  <label
                    htmlFor="identifier"
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                  >
                    Số điện thoại hoặc Email
                  </label>
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 peer-focus:text-primary-500 transition-colors duration-200" />
                </div>

                {/* Input Mật Khẩu */}
                <div className="space-y-2">
                  <div className="relative group">
                    <input
                      type="password"
                      id="password"
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30"
                      required
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Mật khẩu
                    </label>
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 peer-focus:text-primary-500 transition-colors duration-200" />
                  </div>
                  <div className="text-right pr-2">
                    <Link href="/forgot-password" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? "Đang xử lý..." : (
                    <>
                      Đăng Nhập Ngay <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="border-t border-slate-100 mt-8 pt-8 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Đăng ký thành viên
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
