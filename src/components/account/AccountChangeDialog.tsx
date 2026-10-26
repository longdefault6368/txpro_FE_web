"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { PickerDialog } from "@/components/posting/CatalogPicker";
import { postingRequest, PostingError } from "@/utils/posting-api";
import { accountActionRequest, accountActionVerification, type AccountAction, type AccountChallenge, type AccountProfile } from "@/utils/account-profile";
import s from "./Account.module.css";
const titles = { name: "Đổi họ tên", email: "Xác minh email", phone: "Đổi số điện thoại", password: "Đổi mật khẩu" };
export default function AccountChangeDialog({ action, profile, onClose, onSaved }: {
 action: AccountAction; profile: AccountProfile; onClose: () => void; onSaved: (user?: AccountProfile) => void;
}) {
 const [value, setValue] = useState(action === "name" ? profile.name || profile.fullName || "" : action === "email" ? profile.email || "" : "");
 const [challenge, setChallenge] = useState<AccountChallenge | null>(null), [phoneToken, setPhoneToken] = useState("");
 const [otp, setOtp] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
 const [cooldown, setCooldown] = useState(0), [uncertain, setUncertain] = useState(false);
 const [currentPassword, setCurrent] = useState(""), [newPassword, setNew] = useState(""), [confirmPassword, setConfirm] = useState("");
 const lock = useRef(false);
 useEffect(() => { const timer = setInterval(() => setCooldown(previous => Math.max(0, previous - 1)), 1000); return () => clearInterval(timer); }, []);
 async function send() {
  if (lock.current || uncertain || cooldown > 0) return;
  lock.current = true; setBusy(true); setError("");
  const session = localStorage.getItem("txpro_user_session");
  try {
   const request = accountActionRequest(action, value, phoneToken || undefined);
   const data = await postingRequest<AccountChallenge>(request.path, { method: "POST", body: JSON.stringify(request.body) });
   if (session !== localStorage.getItem("txpro_user_session")) throw new Error("Phiên tài khoản đã thay đổi. Vui lòng tải lại trang.");
   if (action === "email" && (!data?.challengeId || data.destination?.toLowerCase() !== value.trim().toLowerCase())) throw new Error("Chưa nhận đủ thông tin xác minh email.");
   if (action === "phone" && !phoneToken && data.verificationToken) { setPhoneToken(data.verificationToken); setChallenge(null); return; }
   setChallenge({ ...data, ...(phoneToken ? { verificationToken: phoneToken } : {}) }); setOtp("");
   setCooldown(Math.max(60, Number(data?.resendAfterSeconds) || 0));
  } catch (e) { setError(e instanceof Error ? e.message : "Chưa gửi được mã."); }
  finally { lock.current = false; setBusy(false); }
 }
 async function verify(event: FormEvent) {
  event.preventDefault(); if (lock.current || !challenge || uncertain) return;
  lock.current = true; setBusy(true); setError("");
  const session = localStorage.getItem("txpro_user_session");
  try {
   const request = accountActionVerification(action, value, otp, challenge, { currentPassword, newPassword, confirmPassword });
   const data = await postingRequest<{ user?: AccountProfile; verificationToken?: string; accessToken?: string; refreshToken?: string } | null>(request.path, { method: "POST", body: JSON.stringify(request.body) });
   if (session !== localStorage.getItem("txpro_user_session")) throw new Error("Phiên tài khoản đã thay đổi. Vui lòng tải lại trang.");
   if (action === "phone" && !challenge.verificationToken) {
    if (!data?.verificationToken) throw new Error("Chưa xác minh được số hiện tại.");
    setPhoneToken(data.verificationToken); setChallenge(null); setOtp(""); setCooldown(0); return;
   }
   if (action !== "password" && !data?.user) throw new PostingError("Chưa nhận được hồ sơ đã cập nhật. Vui lòng tải lại trang để kiểm tra.", "INVALID_RESPONSE", {}, true);
   if (action === "phone") {
    if (!data?.accessToken || !data.refreshToken) throw new PostingError("Số điện thoại có thể đã thay đổi. Vui lòng đăng nhập lại để đồng bộ phiên.", "INVALID_RESPONSE", {}, true);
    localStorage.setItem("txpro_token", data.accessToken); localStorage.setItem("txpro_refresh_token", data.refreshToken);
   }
   onSaved(data?.user);
  } catch (e) { setError(e instanceof Error ? e.message : "Chưa cập nhật được."); if ((e as { uncertain?: boolean }).uncertain) setUncertain(true); }
  finally { lock.current = false; setBusy(false); }
 }
 const inputRequired = action === "name" || action === "email" || action === "phone" && Boolean(phoneToken);
 return <PickerDialog title={titles[action]} icon={<ShieldCheck size={23} />} onClose={onClose} dismissible={!busy}>
 <div className={s.changeForm}>
  <p>{action === "phone" ? phoneToken ? "Nhập số điện thoại mới, sau đó xác minh mã gửi đến số mới." : "Xác minh số điện thoại hiện tại trước khi chuyển sang số mới." : action === "password" ? "Mã xác minh được gửi tới số điện thoại của tài khoản." : "Thông tin chỉ được cập nhật sau khi bạn xác minh OTP."}</p>
  <form onSubmit={challenge ? verify : event => { event.preventDefault(); void send(); }}>
   <fieldset disabled={busy || uncertain}>
   {inputRequired && <label>{action === "name" ? "Họ và tên mới" : action === "email" ? "Email" : "Số điện thoại mới"}<input autoFocus required type={action === "email" ? "email" : action === "phone" ? "tel" : "text"} maxLength={action === "name" ? 100 : 254} value={value} disabled={Boolean(challenge)} onChange={event => setValue(event.target.value)} autoComplete={action === "email" ? "email" : action === "phone" ? "tel" : "name"} /></label>}
   {challenge && <><p className={s.inset}>Nhập mã gửi đến {challenge.destination || profile.phone || "thông tin liên hệ của tài khoản"}.</p>
    <label>Mã OTP<input autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
    {action === "password" && <><label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrent(event.target.value)} /></label><label>Mật khẩu mới<input type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={newPassword} onChange={event => setNew(event.target.value)} /></label><label>Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirm(event.target.value)} /></label></>}
   </>}
   </fieldset>
   {error && <p className={s.error} role="alert">{error}</p>}
   {uncertain && <p role="status">Kết quả chưa xác định. Đóng cửa sổ và tải lại tài khoản để kiểm tra trước khi thao tác tiếp.</p>}
   <div className={s.buttonRow}><button className={s.primary} type="submit" disabled={busy || uncertain || !challenge && cooldown > 0}>{busy && <Loader2 size={16} className={s.spin} />}{challenge ? "Xác nhận" : "Gửi mã xác minh"}</button>
    {challenge && <button type="button" className={s.secondary} disabled={busy || uncertain || cooldown > 0} onClick={() => void send()}>{cooldown > 0 ? "Gửi lại sau " + cooldown + "s" : "Gửi lại mã"}</button>}
   </div>
  </form>
 </div></PickerDialog>;
}
