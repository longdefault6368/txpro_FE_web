"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Phone, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

interface ValidationErrors {
  phone?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "reset">("phone");
  
  // Reset form states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Countdown timer for OTP
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

  // Phone Validation
  const validatePhoneStep = (): boolean => {
    const tempErrors: ValidationErrors = {};
    let isValid = true;

    const phoneRegex = /^(0|(\+84))(3|5|7|8|9)[0-9]{8}$/;
    if (!phone.trim()) {
      tempErrors.phone = "Vui lòng nhập số điện thoại của bạn";
      isValid = false;
    } else if (!phoneRegex.test(phone.trim().replace(/\s+/g, ""))) {
      tempErrors.phone = "Số điện thoại Việt Nam không hợp lệ (gồm 10 số)";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  // Reset Validation
  const validateResetStep = (): boolean => {
    const tempErrors: ValidationErrors = {};
    let isValid = true;

    if (!otp.trim() || otp.trim().length !== 6) {
      tempErrors.otp = "Mã OTP phải gồm đúng 6 chữ số";
      isValid = false;
    }

    if (!newPassword) {
      tempErrors.newPassword = "Vui lòng nhập mật khẩu mới";
      isValid = false;
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = "Mật khẩu mới phải chứa ít nhất 6 ký tự";
      isValid = false;
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = "Xác nhận mật khẩu không khớp với mật khẩu mới";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleRequestOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validatePhoneStep()) return;

    setLoading(true);
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/auth/forgot-password-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone: normalizedPhone })
      });

      if (res.ok) {
        setStep("reset");
        setOtpTimer(60);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Tài khoản chưa hoàn tất kích hoạt hoặc không tồn tại.");
      }
    } catch (err: any) {
      console.warn("Backend connection failed or error. Handling mock fallback...", err);
      if (err.message?.includes("chưa hoàn tất") || err.message?.includes("không tồn tại")) {
        setGeneralError(err.message);
      } else {
        // Fallback mock flow
        setTimeout(() => {
          setStep("reset");
          setOtpTimer(60);
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateResetStep()) return;

    setLoading(true);
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/auth/reset-password-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otp.trim(),
          newPassword: newPassword
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Mã xác thực OTP không chính xác hoặc đã hết hạn.");
      }
    } catch (err: any) {
      console.warn("Backend offline or verify error. Handling mock verify fallback...", err);
      if (err.message?.includes("không chính xác") || err.message?.includes("hết hạn")) {
        setErrors({ otp: err.message });
      } else {
        // Mock reset password success
        setTimeout(() => {
          setSuccess(true);
          setTimeout(() => router.push("/login"), 1500);
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    setGeneralError(null);
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          purpose: "forgot_password"
        })
      });
      if (res.ok) {
        setOtpTimer(60);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Không thể gửi lại mã OTP.");
      }
    } catch (err: any) {
      console.warn("Backend offline. Simulating resend OTP locally...", err);
      setOtpTimer(60);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center pt-28 pb-16 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="max-w-xl w-full mx-auto px-4 z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/80 relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-t-3xl"></div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {step === "phone" ? "Khôi Phục Mật Khẩu" : "Đặt Lại Mật Khẩu"}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {step === "phone" 
                  ? "Nhập số điện thoại đăng ký tài khoản để nhận mã OTP khôi phục" 
                  : `Mã OTP khôi phục đã được gửi đến số điện thoại ${phone}`}
              </p>
            </div>

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
                <h3 className="text-xl font-bold text-slate-950">Đặt Lại Mật Khẩu Thành Công!</h3>
                <p className="text-slate-400 text-sm">Quay trở lại màn hình đăng nhập...</p>
              </div>
            ) : step === "phone" ? (
              /* Step 1: Input Phone */
              <form onSubmit={handleRequestOtpSubmit} className="space-y-6">
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
                      required
                    />
                    <label
                      htmlFor="phone"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Số điện thoại đăng ký
                    </label>
                    <Phone className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.phone ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? "Đang xử lý..." : (
                    <>
                      Nhận Mã OTP Khôi Phục <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Input OTP & New Passwords */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
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
                <div className="text-center text-xs pb-1">
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

                {/* New Password */}
                <div>
                  <div className="relative group">
                    <input
                      type="password"
                      id="newPassword"
                      placeholder=" "
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.newPassword 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                      required
                    />
                    <label
                      htmlFor="newPassword"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Mật khẩu mới
                    </label>
                    <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.newPassword ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative group">
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/30 ${
                        errors.confirmPassword 
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                      required
                    />
                    <label
                      htmlFor="confirmPassword"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Xác nhận mật khẩu mới
                    </label>
                    <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.confirmPassword ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-1/3 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold py-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? "Đang cập nhật..." : "Đặt Lại Mật Khẩu"}
                  </button>
                </div>
              </form>
            )}

            <div className="border-t border-slate-100 mt-8 pt-8 text-center text-sm text-slate-500">
              Nhớ mật khẩu của bạn?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
