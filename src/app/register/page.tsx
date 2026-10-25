"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, Phone, ShieldCheck, User, ArrowRight, KeyRound, AlertCircle } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { API_BASE } from "@/utils/api";
import { createRegistrationClient, commitRegistrationSession } from '@/utils/web-registration';
import { safePostingReturn } from '@/utils/posting-contract';
const registrationRequest = createRegistrationClient(API_BASE);

interface ValidationErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("chu-hang");
  useEffect(() => {
    const next = safePostingReturn(new URLSearchParams(window.location.search).get('next'));
    if (next?.startsWith('/tai-xe/') || next?.startsWith('/user/ekyc')) setRole('tai-xe');
  }, []);
  
  // OTP flow state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestLock = useRef(false);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manage timer countdown for OTP Resend
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [otpTimer]);

  // Client-side Validation Rules
  const validateForm = (): boolean => {
    const tempErrors: ValidationErrors = {};
    let isValid = true;

    // Full name check
    if (!fullName.trim()) {
      tempErrors.fullName = "Vui lòng nhập họ và tên của bạn";
      isValid = false;
    } else if (fullName.trim().length < 2) {
      tempErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
      isValid = false;
    }

    // Vietnamese Phone format check
    const phoneRegex = /^(0|(\+84))(3|5|7|8|9)[0-9]{8}$/;
    if (!phone.trim()) {
      tempErrors.phone = "Vui lòng nhập số điện thoại liên hệ";
      isValid = false;
    } else if (!phoneRegex.test(phone.trim().replace(/\s+/g, ""))) {
      tempErrors.phone = "Số điện thoại Việt Nam không hợp lệ (gồm 10 số)";
      isValid = false;
    }

    // Email check (optional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      tempErrors.email = "Định dạng địa chỉ email không hợp lệ";
      isValid = false;
    }

    // Password criteria check
    if (!password) {
      tempErrors.password = "Vui lòng nhập mật khẩu tài khoản";
      isValid = false;
    } else if (password.length < 6) {
      tempErrors.password = "Mật khẩu phải chứa ít nhất 6 ký tự";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleRegisterOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestLock.current || !validateForm()) return;
    requestLock.current = true; setLoading(true); setGeneralError(null);
    try {
      await registrationRequest('/auth/register-otp', { name: fullName.trim(), phone: phone.trim().replace(/\s+/g, ''), email: email.trim() || undefined, password, role });
      setStep('otp'); setOtpTimer(60);
    } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Không gửi được OTP đăng ký.'); }
    finally { requestLock.current = false; setLoading(false); }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestLock.current) return;
    if (!/^\d{6}$/.test(otp.trim())) { setErrors({ otp: 'Mã OTP phải gồm đúng 6 chữ số' }); return; }
    requestLock.current = true; setLoading(true); setErrors({}); setGeneralError(null);
    const expectedSession = localStorage.getItem('txpro_user_session');
    try {
      let deviceId = localStorage.getItem('txpro_device_id');
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('txpro_device_id', deviceId); }
      const data = await registrationRequest<Parameters<typeof commitRegistrationSession>[1]>('/auth/verify-otp', { phone: phone.trim().replace(/\s+/g, ''), otp: otp.trim(), deviceId });
      const destination = commitRegistrationSession(localStorage, data, expectedSession);
      setSuccess(true); window.dispatchEvent(new Event('txpro_session_updated'));
      const next = safePostingReturn(new URLSearchParams(window.location.search).get('next'));
      router.replace(next || destination);
    } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Chưa xác thực được tài khoản.'); }
    finally { requestLock.current = false; setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || requestLock.current) return;
    requestLock.current = true; setLoading(true); setGeneralError(null);
    try {
      await registrationRequest('/auth/resend-otp', { phone: phone.trim().replace(/\s+/g, ''), purpose: 'register' });
      setOtpTimer(60);
    } catch (err) { setGeneralError(err instanceof Error ? err.message : 'Chưa gửi lại được OTP.'); }
    finally { requestLock.current = false; setLoading(false); }
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
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {step === "form" ? "Tạo Tài Khoản Mới" : "Xác Thực Số Điện Thoại"}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {step === "form" 
                  ? "Gia nhập mạng lưới kết nối vận tải thông minh TXEPRO" 
                  : `Mã OTP đã được gửi đến số điện thoại ${phone}`}
              </p>
            </div>

            {/* General Error Notification */}
            {generalError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{generalError}</p>
              </div>
            )}

            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xl shadow-emerald-50 animate-bounce">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Đăng Ký Thành Công!</h3>
                <p className="text-slate-400 text-sm">Đang chuyển đến bước tiếp theo...</p>
              </div>
            ) : step === "form" ? (
              /* Step 1: Registration form */
              <form onSubmit={handleRegisterOtpSubmit}><fieldset disabled={loading} className="space-y-5">
                {/* Full name */}
                <div>
                  <div className="relative group">
                    <input
                      type="text"
                      id="fullName"
                      placeholder=" "
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.fullName 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                    />
                    <label
                      htmlFor="fullName"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Họ và Tên
                    </label>
                    <User className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.fullName ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="relative group">
                    <input
                      type="tel"
                      id="phone"
                      placeholder=" "
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.phone 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                    />
                    <label
                      htmlFor="phone"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Số điện thoại
                    </label>
                    <Phone className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.phone ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      placeholder=" "
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.email 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Địa chỉ Email (Tùy chọn)
                    </label>
                    <Mail className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.email ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="relative group">
                    <input
                      type="password"
                      id="password"
                      placeholder=" "
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.password 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Mật khẩu
                    </label>
                    <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.password ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.password}</p>
                  )}
                </div>

                {/* Role selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Đăng ký vai trò</label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setRole("chu-hang")}
                      className={`py-3 rounded-xl text-xs font-bold ${
                        role === "chu-hang" ? "bg-white text-primary-600 shadow-md" : "text-slate-500"
                      }`}
                    >
                      Chủ Hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("tai-xe")}
                      className={`py-3 rounded-xl text-xs font-bold ${
                        role === "tai-xe" ? "bg-white text-primary-600 shadow-md" : "text-slate-500"
                      }`}
                    >
                      Tài Xế
                    </button>
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
                      Nhận Mã Xác Thực OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </fieldset></form>
            ) : (
              /* Step 2: OTP Verification form */
              <form onSubmit={handleVerifyOtpSubmit}><fieldset disabled={loading} className="space-y-6">
                {/* OTP code input */}
                <div>
                  <div className="relative group">
                    <input
                      type="text"
                      id="otp"
                      placeholder=" "
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (errors.otp) setErrors({ ...errors, otp: undefined });
                      }}
                      maxLength={6}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-bold text-center tracking-[0.4em] transition-all shadow-inner bg-slate-50/30 ${
                        errors.otp 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                      required
                    />
                    <label
                      htmlFor="otp"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Nhập mã xác thực OTP
                    </label>
                    <KeyRound className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.otp ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.otp && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1 justify-center"><AlertCircle className="w-3.5 h-3.5" /> {errors.otp}</p>
                  )}
                </div>

                {/* Resend button / countdown timer */}
                <div className="text-center text-xs">
                  {otpTimer > 0 ? (
                    <span className="text-slate-400">
                      Gửi lại mã OTP sau <span className="font-bold text-slate-600">{otpTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-primary-600 hover:text-primary-700 font-bold transition-colors cursor-pointer"
                    >
                      Gửi lại mã xác thực OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="w-1/3 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? "Đang xác thực..." : "Kích Hoạt Tài Khoản"}
                  </button>
                </div>
              </fieldset></form>
            )}

            <div className="border-t border-slate-100 mt-8 pt-8 text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Đăng nhập ngay
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
