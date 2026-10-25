"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Info, Loader2, PackageCheck, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { PickerDialog } from "@/components/posting/CatalogPicker";
import { postingRequest, PostingError } from "@/utils/posting-api";
import { createRoleSwitcher, isAccountRole, recoverRoleSession, roleDestination, RoleSwitchError, type AccountRole, type RoleProfile } from "@/utils/account-role-switch";
import s from "./RoleSwitchButton.module.css";

// Shared lock across all entry points in this browser tab.
const switchRole = createRoleSwitcher(postingRequest, {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key),
});
export default function RoleSwitchButton({ currentRole, targetRole, variant = "button", disabled = false, returnTo }: {
  currentRole?: string; targetRole?: AccountRole; variant?: "button" | "menu"; disabled?: boolean; returnTo?: '/tai-xe/phuong-tien';
}) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const label = (role: string) => role === "tai-xe" ? c("Tài xế", "Driver", "司机") : c("Chủ hàng", "Shipper", "货主");
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<RoleProfile | null>(null), [selected, setSelected] = useState<AccountRole>("chu-hang");
  const [error, setError] = useState(""), [recovery, setRecovery] = useState(false);
  const lock = useRef(false);
  const recoverySession = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let active = true;
    void postingRequest<{ user: RoleProfile }>("/auth/me").then(({ user }) => {
      if (!active) return;
      if (!isAccountRole(user?.role) || !(user.id || user._id)) throw new RoleSwitchError("FORBIDDEN");
      setProfile(user); setSelected(targetRole || (user.role === "tai-xe" ? "chu-hang" : "tai-xe"));
    }).catch(e => {
      if (!active) return;
      setError(e instanceof RoleSwitchError ? c("Tài khoản này không thể chuyển vai trò.", "This account cannot switch roles.", "此账户无法切换角色。")
        : c("Không tải được vai trò hiện tại. Vui lòng đóng và thử lại hoặc đăng nhập lại.", "Unable to load your current role. Close and retry, or sign in again.", "无法获取当前角色，请关闭重试或重新登录。"));
      setRecovery(e instanceof PostingError && e.code === "LOGIN_REQUIRED");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Load authoritative account data each time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetRole]);
  if (!isAccountRole(currentRole)) return null;
  function show() {
    recoverySession.current = localStorage.getItem("txpro_user_session");
    setLoading(true); setError(""); setProfile(null); setRecovery(false); setOpen(true);
  }
  function close() { if (!lock.current) setOpen(false); }
  async function confirm() {
    if (lock.current || !profile || recovery) return;
    recoverySession.current = localStorage.getItem("txpro_user_session");
    lock.current = true; setBusy(true); setError("");
    try {
      await switchRole(selected, profile);
      // Hard navigation intentionally discards old role-specific React state and requests.
      window.dispatchEvent(new Event("txpro_session_updated"));
      window.location.replace(selected === 'tai-xe' && returnTo === '/tai-xe/phuong-tien' ? returnTo : roleDestination(selected, Boolean(targetRole)));
    } catch (e) {
      const needsRecovery = e instanceof RoleSwitchError ? e.recovery : e instanceof PostingError && (e.uncertain || e.code === "LOGIN_REQUIRED");
      setRecovery(needsRecovery);
      setError(needsRecovery
        ? c("Chưa thể xác nhận phiên chuyển vai trò. Vui lòng đăng nhập lại để đồng bộ; không cần bấm chuyển lần nữa.", "Your updated session could not be confirmed. Sign in again to sync; do not submit another switch.", "无法确认切换后的会话。请重新登录同步，无需重复切换。")
        : e instanceof RoleSwitchError ? c("Chưa thể chuyển vai trò. Vui lòng đóng và thử lại.", "Unable to switch roles. Close and try again.", "暂时无法切换，请关闭后重试。")
          : e instanceof Error ? e.message : c("Không thể chuyển vai trò.", "Unable to switch roles.", "无法切换角色。"));
      lock.current = false; setBusy(false);
    }
  }
  function signIn() {
    const destination = recoverRoleSession(localStorage, recoverySession.current, roleDestination(selected, Boolean(targetRole)));
    window.dispatchEvent(new Event("txpro_session_updated"));
    window.location.replace(destination);
  }
  return <>
    <button type="button" className={[s.trigger, variant === "menu" ? s.menu : ""].join(" ")} disabled={disabled}
      aria-haspopup="dialog" onClick={show}><ArrowLeftRight size={17} />
      {targetRole ? c("Chuyển sang ", "Switch to ", "切换为") + label(targetRole) : c("Chuyển vai trò", "Switch role", "切换角色")}
    </button>
    {open && <PickerDialog title={c("Chuyển vai trò", "Switch role", "切换角色")} icon={<ArrowLeftRight size={23} />} onClose={close} dismissible={!busy}>
      {loading ? <div className={s.loading} role="status"><Loader2 className={s.spin} size={22} />{c("Đang kiểm tra tài khoản…", "Checking your account…", "正在检查账户…")}</div> : <>
        {profile && <>
          <p className={s.intro}>{c("Chọn cách bạn muốn sử dụng TXEPRO trên cùng tài khoản.", "Choose how you want to use TXEPRO with the same account.", "使用同一账户，选择您希望使用的服务身份。")}</p>
          <div className={s.roles} aria-label={c("Vai trò tài khoản", "Account role", "账户角色")}>
            {(["chu-hang", "tai-xe"] as const).map(role => <button key={role} type="button" className={s.role} aria-pressed={selected === role}
              disabled={busy || recovery || role === profile.role || Boolean(targetRole && role !== targetRole)} onClick={() => setSelected(role)}>
              {role === "tai-xe" ? <Truck size={30} /> : <PackageCheck size={30} />}<strong>{label(role)}</strong>
              <small>{role === "tai-xe" ? c("Đăng xe, tìm chuyến phù hợp và quản lý hành trình.", "Post vehicles, find suitable trips and manage journeys.", "发布车辆、查找合适订单并管理行程。")
                : c("Tìm xe, đặt chuyến và theo dõi đơn của bạn.", "Find vehicles, book trips and track your orders.", "查找车辆、预约行程并跟踪订单。")}</small>
              <span className={s.badge}>{role === profile.role ? c("Đang sử dụng", "Current role", "当前角色") : selected === role ? <><CheckCircle2 size={15} />{c("Đã chọn", "Selected", "已选择")}</> : c("Chọn vai trò", "Select role", "选择角色")}</span>
            </button>)}
          </div>
          <div className={s.notice}><Info size={17} /><span>{c("Website sẽ tải lại theo vai trò mới. Các điều kiện xác minh và quyền lợi áp dụng theo hệ thống, giống ứng dụng. Thông tin chưa gửi ở trang hiện tại có thể cần nhập lại.", "The website will reload for your new role. Verification and benefits follow the same system rules as the app. Unsaved entries on this page may need to be entered again.", "网站将按新角色重新加载，认证与权益遵循应用中的系统规则。当前页面未提交的内容可能需要重新填写。")}</span></div>
        </>}
        {error && <div className={s.error} role="alert">{error}</div>}
        <div className={s.actions}>
          <button type="button" className={s.trigger} disabled={busy} onClick={close}>{c("Để sau", "Not now", "稍后")}</button>
          {recovery ? <button type="button" className={s.confirm} onClick={signIn}>{c("Đăng nhập lại", "Sign in again", "重新登录")}</button>
            : profile && <button type="button" className={s.confirm} disabled={busy} onClick={() => { void confirm(); }}>
              {busy ? <Loader2 className={s.spin} size={18} /> : <ArrowLeftRight size={17} />}
              {busy ? c("Đang chuyển…", "Switching…", "正在切换…") : profile.role === selected ? c("Tiếp tục", "Continue", "继续") : c("Xác nhận chuyển", "Confirm switch", "确认切换")}
            </button>}
        </div>
        {busy && <p className={s.intro} role="status" aria-live="polite">{c("Đang cập nhật phiên đăng nhập, vui lòng chờ.", "Updating your session. Please wait.", "正在更新登录会话，请稍候。")}</p>}
      </>}
    </PickerDialog>}
  </>;
}
