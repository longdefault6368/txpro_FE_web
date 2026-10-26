"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, Phone, ShieldCheck, User, ArrowRight, KeyRound, AlertCircle, Package, Truck, LoaderCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";
import s from "@/components/auth/Auth.module.css";
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
  const [returnPath, setReturnPath] = useState<string | null>(null);
  useEffect(() => {
    const next = safePostingReturn(new URLSearchParams(window.location.search).get('next'));
    setReturnPath(next);
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [otpTimer]);
  const validateForm = () => {
    const next: ValidationErrors = {};
    if (fullName.trim().length < 2) next.fullName = "Vui lòng nhập họ và tên ít nhất 2 ký tự";
    const normalized = phone.trim().replace(/\s+/g, "");
    if (!/^\+?[0-9]{8,15}$/.test(normalized)) next.phone = "Vui lòng nhập số điện thoại hợp lệ";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Địa chỉ email không hợp lệ";
    if (password.length < 6) next.password = "Mật khẩu cần ít nhất 6 ký tự";
    setErrors(next); return Object.keys(next).length === 0;
  };
  const handleRegisterOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestLock.current || !validateForm()) return;
    requestLock.current = true; setLoading(true); setGeneralError(null);
    try {
      await registrationRequest("/auth/register-otp", { name: fullName.trim(), phone: phone.trim().replace(/\s+/g, ""), email: email.trim() || undefined, password, role });
      setStep("otp"); setOtpTimer(60);
    } catch (error) { setGeneralError(error instanceof Error ? error.message : "Không gửi được OTP đăng ký."); }
    finally { requestLock.current = false; setLoading(false); }
  };
  const handleVerifyOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestLock.current) return;
    if (!/^\d{6}$/.test(otp.trim())) { setErrors({ otp: "Mã OTP phải gồm đúng 6 chữ số" }); return; }
    requestLock.current = true; setLoading(true); setErrors({}); setGeneralError(null);
    try {
      const expectedSession = localStorage.getItem("txpro_user_session");
      let deviceId = localStorage.getItem("txpro_device_id");
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem("txpro_device_id", deviceId); }
      const data = await registrationRequest<Parameters<typeof commitRegistrationSession>[1]>("/auth/verify-otp", { phone: phone.trim().replace(/\s+/g, ""), otp: otp.trim(), deviceId });
      const destination = commitRegistrationSession(localStorage, data, expectedSession);
      setSuccess(true); window.dispatchEvent(new Event("txpro_session_updated"));
      const next = safePostingReturn(new URLSearchParams(window.location.search).get("next"));
      router.replace(next || destination);
    } catch (error) { setGeneralError(error instanceof Error ? error.message : "Chưa xác thực được tài khoản."); }
    finally { requestLock.current = false; setLoading(false); }
  };
  const handleResendOtp = async () => {
    if (otpTimer > 0 || requestLock.current) return;
    requestLock.current = true; setLoading(true); setGeneralError(null);
    try {
      await registrationRequest("/auth/resend-otp", { phone: phone.trim().replace(/\s+/g, ""), purpose: "register" });
      setOtpTimer(60); setOtp("");
    } catch (error) { setGeneralError(error instanceof Error ? error.message : "Không gửi lại được mã OTP."); }
    finally { requestLock.current = false; setLoading(false); }
  };
  return <AuthShell mode="register" title={success ? "Tài khoản đã sẵn sàng" : step === "otp" ? "Xác minh số điện thoại" : "Bắt đầu cùng TXE PRO"}
    description={success ? "Bạn có thể tiếp tục thiết lập và sử dụng tài khoản." : step === "otp" ? "Chỉ còn một bước để hoàn tất đăng ký." : "Tạo tài khoản để tìm xe hoặc đăng lịch xe trống."} next={returnPath}>
    {!success && <div className={s.steps} aria-label="Tiến trình đăng ký"><span data-active={step === "form"}>01 · Thông tin tài khoản</span><span data-active={step === "otp"}>02 · Xác minh OTP</span></div>}
    {generalError && <div className={s.error} role="alert"><AlertCircle size={18} /><p>{generalError}</p></div>}
    {success ? <div className={s.success} role="status"><ShieldCheck /><p>Đang chuyển đến bước tiếp theo…</p></div> : step === "form" ?
      <form onSubmit={handleRegisterOtpSubmit} className={s.form} noValidate><fieldset disabled={loading}>
        <AuthField id="fullName" name="name" label="Họ và tên" icon={<User />} value={fullName} onChange={event => { setFullName(event.target.value); if (errors.fullName) setErrors({ ...errors, fullName: undefined }); }} autoComplete="name" placeholder="Nhập họ và tên" error={errors.fullName} required />
        <AuthField id="phone" name="tel" label="Số điện thoại" icon={<Phone />} type="tel" inputMode="tel" value={phone} onChange={event => { setPhone(event.target.value); if (errors.phone) setErrors({ ...errors, phone: undefined }); }} autoComplete="tel" placeholder="Nhập số điện thoại của bạn" error={errors.phone} required />
        <AuthField id="email" name="email" label="Email (không bắt buộc)" icon={<Mail />} type="email" value={email} onChange={event => { setEmail(event.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} autoComplete="email" placeholder="Nhập địa chỉ email" error={errors.email} />
        <AuthField id="password" name="new-password" label="Mật khẩu" icon={<Lock />} type="password" value={password} onChange={event => { setPassword(event.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }} autoComplete="new-password" placeholder="Tạo mật khẩu" hint="Sử dụng ít nhất 6 ký tự." error={errors.password} required />
        <div><span className={s.roleLabel} id="role-label">Bạn muốn bắt đầu với vai trò nào?</span><div className={s.roles} role="group" aria-labelledby="role-label">
          <button type="button" aria-pressed={role === "chu-hang"} onClick={() => setRole("chu-hang")}><Package size={19} />Chủ hàng</button>
          <button type="button" aria-pressed={role === "tai-xe"} onClick={() => setRole("tai-xe")}><Truck size={19} />Tài xế</button>
        </div></div>
        <button type="submit" className={s.primary} disabled={loading}>{loading ? <><LoaderCircle size={18} className={s.spinner} />Đang gửi mã…</> : <>Tiếp tục xác minh<ArrowRight size={18} /></>}</button>
      </fieldset></form> :
      <><div className={s.notice}><Phone size={18} /><p>Nhập mã OTP đã gửi đến <strong>{phone}</strong> để xác minh tài khoản.</p></div>
      <form onSubmit={handleVerifyOtpSubmit} className={s.form} noValidate><fieldset disabled={loading}>
        <AuthField id="otp" label="Mã xác minh 6 số" icon={<KeyRound />} type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="000000" value={otp}
          onChange={event => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); if (errors.otp) setErrors({ ...errors, otp: undefined }); }} error={errors.otp} required />
        <div className={s.resend}>{otpTimer > 0 ? <span>Gửi lại mã sau <strong>{otpTimer}s</strong></span> : <button type="button" onClick={handleResendOtp} disabled={loading}>Gửi lại mã xác minh</button>}</div>
        <div className={s.actions}><button type="button" className={s.secondary} onClick={() => setStep("form")}><ArrowLeft size={16} />Quay lại</button>
          <button type="submit" className={s.primary} disabled={loading}>{loading ? <><LoaderCircle size={18} className={s.spinner} />Đang xác minh…</> : <>Hoàn tất đăng ký<ArrowRight size={18} /></>}</button></div>
      </fieldset></form></>}
    {!success && <p className={s.bottom}>Đã có tài khoản? <Link href={returnPath ? "/login?next=" + encodeURIComponent(returnPath) : "/login"}>Đăng nhập</Link></p>}
  </AuthShell>;
}
