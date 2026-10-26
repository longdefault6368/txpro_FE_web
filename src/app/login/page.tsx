"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Smartphone, KeyRound, Check, LoaderCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";
import s from "@/components/auth/Auth.module.css";
import { API_BASE } from "@/utils/api";
import { safePostingReturn } from "@/utils/posting-contract";

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
  const [returnPath, setReturnPath] = useState<string | null>(null);
  useEffect(() => { setReturnPath(safePostingReturn(new URLSearchParams(window.location.search).get('next'))); }, []);
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
      const res = await fetch(`${API_BASE}/auth/login`, {
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
          id: userProfile.id || userProfile._id || "",
          sessionStartedAt: new Date().toISOString(),
          name: userName,
          role: userRole === "admin" ? "Admin" : userRole === "tai-xe" ? "Tài Xế" : "Chủ Hàng",
          rawRole: userRole
        }));
        setSuccess(true);
        const next = safePostingReturn(new URLSearchParams(window.location.search).get("next"));
        const targetRoute = userRole === "admin" ? "/admin" : next || "/user";
        window.dispatchEvent(new Event("txpro_session_updated"));
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
      const res = await fetch(`${API_BASE}/auth/verify-device`, {
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

  return <AuthShell mode="login" title={success ? "Đăng nhập thành công" : verificationRequired ? "Xác minh thiết bị" : "Chào mừng trở lại"}
    description={success ? "Tài khoản của bạn đã sẵn sàng." : verificationRequired ? "Nhập mã OTP để tiếp tục trên thiết bị này." : "Đăng nhập để tiếp tục hành trình cùng TXE PRO."} next={returnPath}>
    {error && <div className={s.error} role="alert"><AlertCircle size={18} /><p>{error}</p></div>}
    {success ? <div className={s.success} role="status"><ShieldCheck /><p>Đang đưa bạn đến khu vực tài khoản…</p></div> :
    verificationRequired ? <>
      <div className={s.notice}><Smartphone size={19} /><p>Mã xác minh đã được gửi đến <strong>{maskPhone(verifyData?.phone || "")}</strong>. Vui lòng kiểm tra tin nhắn của bạn.</p></div>
      <form onSubmit={handleVerifyDevice} className={s.form} noValidate><fieldset disabled={verifying || loading}>
        <AuthField id="otp" label="Mã xác minh 6 số" icon={<KeyRound />} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required autoFocus />
        <div className={s.actions}><button type="button" className={s.secondary} onClick={() => { setVerificationRequired(false); setOtp(""); setError(null); }}>Quay lại</button>
          <button type="submit" className={s.primary} disabled={verifying || loading}>{verifying || loading ? <><LoaderCircle size={18} className={s.spinner} />Đang xác minh…</> : <>Xác nhận<Check size={17} /></>}</button></div>
      </fieldset></form>
    </> :
    <form onSubmit={handleSubmit} className={s.form} noValidate><fieldset disabled={loading}>
      <AuthField id="identifier" name="username" label="Số điện thoại hoặc email" icon={<Mail />} type="text" value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" placeholder="Nhập số điện thoại hoặc email" required />
      <div><AuthField id="password" name="password" label="Mật khẩu" icon={<Lock />} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required />
        <Link className={s.forgot} href="/forgot-password">Quên mật khẩu?</Link></div>
      <button type="submit" className={s.primary} disabled={loading}>{loading ? <><LoaderCircle size={18} className={s.spinner} />Đang đăng nhập…</> : <>Đăng nhập<ArrowRight size={18} /></>}</button>
    </fieldset></form>}
    {!success && <p className={s.bottom}>Chưa có tài khoản? <Link href={returnPath ? "/register?next=" + encodeURIComponent(returnPath) : "/register"}>Tạo tài khoản mới</Link></p>}
  </AuthShell>;
}
