"use client";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, CircleHelp, Copy, FileCheck2, Globe, Loader2, LockKeyhole, LogOut, Mail, Phone, RefreshCw, ShieldCheck, Ticket, Truck, UserRound, Wallet } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import RoleSwitchButton from "./RoleSwitchButton";
import AccountChangeDialog from "./AccountChangeDialog";
import { PickerDialog } from "@/components/posting/CatalogPicker";
import { useLanguage } from "@/context/LanguageContext";
import { postingRequest } from "@/utils/posting-api";
import { getServerMediaUrl } from "@/utils/media";
import { accountDate, accountKycLabel, accountMoney, type AccountAction, type AccountProfile, type AccountWallet } from "@/utils/account-profile";
import s from "./Account.module.css";
type Tab = "profile" | "benefits" | "security";
type Grant = { id: string; status: string; expiresAt?: string; campaign?: { name?: string; description?: string }; effects?: string[] };
type Vouchers = { items: Grant[]; summary: { active?: number; reserved?: number; total?: number }; pagination?: { hasMore: boolean } };
const grantLabel = (status: string) => ({ active: "Đang hiệu lực", reserved: "Đang giữ", redeemed: "Đã sử dụng", expired: "Hết hạn", revoked: "Đã thu hồi" }[status] || "Đang cập nhật");
function InfoRow({ icon, title, value, verified, children }: { icon: ReactNode; title: string; value?: string; verified?: boolean; children?: ReactNode }) {
 return <div className={s.infoRow}><span className={s.rowIcon}>{icon}</span><div className={s.rowValue}><span>{title}</span><strong>{value || "Chưa bổ sung"}</strong>{verified !== undefined && <small data-verified={verified}>{verified ? <><BadgeCheck size={13} />Đã xác minh</> : "Chưa xác minh"}</small>}</div>{children}</div>;
}
function AvatarPhoto({ src, name }: { src: string; name: string }) {
 const [failed, setFailed] = useState(false);
 return failed ? <UserRound size={38} /> : <Image src={src} alt={name} width={88} height={88} unoptimized onError={() => setFailed(true)} />;
}
export default function AccountWorkspace() {
 const { language, changeLanguage } = useLanguage();
 const [profile, setProfile] = useState<AccountProfile | null>(null), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState("");
 const [retry, setRetry] = useState(0), [tab, setTab] = useState<Tab>("profile"), [action, setAction] = useState<AccountAction | null>(null);
 const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [logoutOpen, setLogoutOpen] = useState(false);
 const [wallet, setWallet] = useState<AccountWallet | null>(null), [walletError, setWalletError] = useState("");
 const [vouchers, setVouchers] = useState<Vouchers | null>(null), [voucherError, setVoucherError] = useState("");
 const [financeRetry, setFinanceRetry] = useState(0), [voucherPage, setVoucherPage] = useState(1), [voucherBusy, setVoucherBusy] = useState(false);
 const lock = useRef(false), alive = useRef(true);
 const normalizedRole = profile?.role || "", isOffline = !profile || Boolean(loadError);
 const driver = normalizedRole === "tai-xe", admin = normalizedRole === "admin";
 useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
 useEffect(() => {
  const session = localStorage.getItem("txpro_user_session");
  const changed = (event: StorageEvent) => { if (event.key === "txpro_user_session" && event.newValue !== session) window.location.replace("/user"); };
  window.addEventListener("storage", changed); return () => window.removeEventListener("storage", changed);
 }, []);
 useEffect(() => {
  const controller = new AbortController(), session = localStorage.getItem("txpro_user_session");
  void postingRequest<{ user: AccountProfile }>("/auth/profile", { signal: controller.signal }).then(data => {
   if (controller.signal.aborted || session !== localStorage.getItem("txpro_user_session")) return;
   if (!data?.user || !["tai-xe", "chu-hang", "admin"].includes(data.user.role)) throw new Error("Hồ sơ tài khoản chưa hợp lệ.");
   setProfile(data.user); setLoadError("");
  }).catch(e => { if (!controller.signal.aborted) { setProfile(null); setLoadError(e instanceof Error ? e.message : "Chưa tải được tài khoản."); } })
   .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [retry]);
 useEffect(() => {
  if (tab !== "benefits" || !profile || admin) return;
  const controller = new AbortController(), session = localStorage.getItem("txpro_user_session");
  const valid = () => !controller.signal.aborted && session === localStorage.getItem("txpro_user_session");
  void postingRequest<AccountWallet>("/common/wallet/balance", { signal: controller.signal }).then(value => { if (valid()) { setWallet(value); setWalletError(""); } }).catch(e => { if (valid()) setWalletError(e instanceof Error ? e.message : "Chưa tải được ví."); });
  void postingRequest<Vouchers>("/common/vouchers?role=" + encodeURIComponent(profile.role) + "&page=1&limit=10", { signal: controller.signal }).then(value => {
   if (!Array.isArray(value?.items) || !value.summary) throw new Error("Dữ liệu voucher chưa hợp lệ.");
   if (valid()) { setVouchers(value); setVoucherPage(1); setVoucherError(""); }
  }).catch(e => { if (valid()) setVoucherError(e instanceof Error ? e.message : "Chưa tải được voucher."); });
  return () => controller.abort();
 }, [tab, profile, admin, financeRetry]);
 function syncProfile(user: AccountProfile) {
  setProfile(previous => ({ ...previous, ...user }));
  try {
   const saved = JSON.parse(localStorage.getItem("txpro_user_session") || "{}");
   localStorage.setItem("txpro_user_session", JSON.stringify({ ...saved, id: user.id || user._id || saved.id, name: user.name || user.fullName || saved.name, phone: user.phone, email: user.email }));
   window.dispatchEvent(new Event("txpro_session_updated")); window.dispatchEvent(new Event("storage"));
  } catch { /* The live profile remains the source of truth. */ }
 }
 async function mutate(operation: () => Promise<void>) {
  if (lock.current) return; lock.current = true; setBusy(true); setMessage("");
  try { await operation(); }
  catch (e) { if (alive.current) setMessage(e instanceof Error ? e.message : "Chưa thực hiện được. Vui lòng thử lại."); }
  finally { lock.current = false; if (alive.current) setBusy(false); }
 }
 async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage("Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB."); return; }
  await mutate(async () => {
   const session = localStorage.getItem("txpro_user_session"), body = new FormData(); body.append("image", file);
   const result = await postingRequest<{ url?: string }>("/auth/profile/avatar", { method: "POST", body });
   if (!alive.current || session !== localStorage.getItem("txpro_user_session")) return;
   if (!result?.url || !profile) throw new Error("Chưa nhận đường dẫn ảnh đã cập nhật. Vui lòng tải lại hồ sơ.");
   syncProfile({ ...profile, avatar: result.url }); setMessage("Đã cập nhật ảnh đại diện.");
  });
 }
 async function saveLanguage(value: "vi" | "en" | "zh") {
  await mutate(async () => {
   const session = localStorage.getItem("txpro_user_session");
   const result = await postingRequest<{ user: AccountProfile }>("/auth/profile", { method: "PATCH", body: JSON.stringify({ language: value }) });
   if (!alive.current || session !== localStorage.getItem("txpro_user_session")) return;
   if (!result?.user) throw new Error("Chưa nhận được hồ sơ cập nhật.");
   syncProfile(result.user); changeLanguage(value); setMessage("Đã lưu ngôn ngữ tài khoản.");
  });
 }
 async function moreVouchers() {
  if (lock.current || !vouchers?.pagination?.hasMore || !profile) return;
  lock.current = true; setVoucherBusy(true);
  const session = localStorage.getItem("txpro_user_session");
  try {
   const result = await postingRequest<Vouchers>("/common/vouchers?role=" + encodeURIComponent(profile.role) + "&page=" + (voucherPage + 1) + "&limit=10");
   if (!alive.current || session !== localStorage.getItem("txpro_user_session")) return;
   if (!Array.isArray(result?.items)) throw new Error("Dữ liệu voucher chưa hợp lệ.");
   setVouchers(previous => ({ ...result, items: [...new Map([...(previous?.items || []), ...result.items].map(item => [item.id, item])).values()] })); setVoucherPage(page => page + 1); setVoucherError("");
  } catch (e) { if (alive.current) setVoucherError(e instanceof Error ? e.message : "Chưa tải được voucher."); }
  finally { lock.current = false; if (alive.current) setVoucherBusy(false); }
 }
 async function copyReferral() {
  try { await navigator.clipboard.writeText(profile?.referralCode || ""); setMessage("Đã sao chép mã giới thiệu."); }
  catch { setMessage("Bạn có thể chọn và sao chép mã giới thiệu trực tiếp."); }
 }
 async function logout() {
  if (lock.current) return; lock.current = true; setBusy(true);
  const session = localStorage.getItem("txpro_user_session");
  try {
   const refreshToken = localStorage.getItem("txpro_refresh_token"), deviceId = localStorage.getItem("txpro_device_id");
   if (refreshToken && deviceId) await postingRequest("/auth/logout", { method: "POST", signal: AbortSignal.timeout(8000), body: JSON.stringify({ refreshToken, deviceId }) }, false);
  } catch { /* Local sign-out still removes this browser's credentials. */ }
  finally {
   if (localStorage.getItem("txpro_user_session") === session) {
    localStorage.removeItem("txpro_token"); localStorage.removeItem("txpro_refresh_token"); localStorage.removeItem("txpro_user_session");
    window.dispatchEvent(new Event("txpro_session_updated")); window.dispatchEvent(new Event("storage")); window.location.replace("/login");
   } else window.location.replace("/user");
  }
 }
 const name = profile?.name || profile?.fullName || "Tài khoản TXE PRO", avatar = getServerMediaUrl(profile?.avatar);
 return <><Header /><main className={s.page}>
  <div className={s.topline}><Link href="/"><ArrowLeft size={16} />Trang chủ</Link><Link href="/don-cua-ban">Đơn của bạn<ArrowRight size={16} /></Link></div>
  {loading ? <div className={s.skeleton} role="status" aria-label="Đang tải tài khoản"><div /><div /><div /></div> : !profile ? <section className={s.card}><ShieldCheck size={34} /><h1>Tài khoản của bạn</h1><p className={s.error} role="alert">{loadError}</p><div className={s.buttonRow}><button className={s.secondary} onClick={() => { setLoading(true); setRetry(value => value + 1); }}><RefreshCw size={16} />Thử lại</button><Link className={s.primary} href="/login?next=%2Fuser">Đăng nhập</Link></div></section> : <>
  <section className={s.hero}><div className={s.identity}>
   <div className={s.avatar}>{avatar ? <AvatarPhoto key={avatar} src={avatar} name={name} /> : <UserRound size={38} />}
    <label className={s.camera} title="Đổi ảnh đại diện">{busy ? <Loader2 size={16} className={s.spin} /> : <Camera size={16} />}<input aria-label="Đổi ảnh đại diện" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || Boolean(action)} onChange={event => void uploadAvatar(event)} /></label>
   </div><div><span className={s.eyebrow}>TÀI KHOẢN TXE PRO</span><h1>{name}</h1><div className={s.badges}><span>{driver ? "Tài xế" : admin ? "Quản trị viên" : "Chủ hàng"}</span><span data-active={profile.isActive === true}>{profile.isActive === true ? "Đang hoạt động" : profile.isActive === false ? "Đang bị hạn chế" : "Chưa có trạng thái"}</span></div></div>
  </div><div className={s.heroActions}><RoleSwitchButton currentRole={normalizedRole} disabled={isOffline || busy || Boolean(action)} /><button type="button" className={s.logout} disabled={busy || voucherBusy || Boolean(action)} onClick={() => setLogoutOpen(true)}><LogOut size={17} />Đăng xuất</button></div></section>
  {message && <div className={s.notice} role="status">{message}</div>}
  {profile.accountRestriction?.status === "active" && <div className={s.notice} role="status">Tài khoản đang bị hạn chế giao dịch.{profile.accountRestriction.permanent ? " Vui lòng liên hệ hỗ trợ để biết thêm thông tin." : profile.accountRestriction.restrictedUntil ? " Thời hạn: " + accountDate(profile.accountRestriction.restrictedUntil) + "." : ""} <Link href="/tro-giup">Liên hệ hỗ trợ</Link></div>}
  <div className={s.layout}><aside className={s.sidebar}>
   <nav className={s.navigation} aria-label="Mục tài khoản">{([{ id: "profile", title: "Thông tin tài khoản", icon: <UserRound size={18} /> }, ...(!admin ? [{ id: "benefits", title: "Ví & quyền lợi", icon: <Wallet size={18} /> }] : []), { id: "security", title: "Bảo mật", icon: <LockKeyhole size={18} /> }] as const).map(item => <button type="button" key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => { setTab(item.id as Tab); setMessage(""); }}>{item.icon}{item.title}<ArrowRight size={15} /></button>)}</nav>
   <div className={s.shortcuts}><span className={s.sectionLabel}>LỐI TẮT</span><Link href={admin ? "/admin" : "/don-cua-ban"}><Truck size={18} />{admin ? "Trang quản trị" : "Đơn của bạn"}<ArrowRight size={15} /></Link>{driver && <Link href="/tai-xe/phuong-tien"><Truck size={18} />Quản lý phương tiện<ArrowRight size={15} /></Link>}{!admin && <Link href={driver ? "/tai-xe/dang-tin" : "/chu-hang/form-tao-don"}><Truck size={18} />{driver ? "Đăng xe trống" : "Tìm xe ngay"}<ArrowRight size={15} /></Link>}<Link href="/tro-giup"><CircleHelp size={18} />Trợ giúp & hỗ trợ<ArrowRight size={15} /></Link></div>
  </aside><div className={s.content}>
  {tab === "profile" && <>
   <section className={s.card}><div className={s.heading}><div><h2>Thông tin tài khoản</h2><p>Thông tin liên hệ và định danh của bạn.</p></div><UserRound size={22} /></div>
    <InfoRow icon={<UserRound size={19} />} title="Họ và tên" value={name}><button className={s.textButton} disabled={busy} onClick={() => setAction("name")}>Chỉnh sửa</button></InfoRow>
    <InfoRow icon={<Phone size={19} />} title="Số điện thoại" value={profile.phone} verified={profile.isPhoneVerified === true}><button className={s.textButton} disabled={busy} onClick={() => setAction("phone")}>Thay đổi</button></InfoRow>
    <InfoRow icon={<Mail size={19} />} title="Email" value={profile.email} verified={profile.isEmailVerified === true}><button className={s.textButton} disabled={busy} onClick={() => setAction("email")}>{!profile.email ? "Bổ sung" : profile.isEmailVerified ? "Thay đổi" : "Xác minh"}</button></InfoRow>
    <InfoRow icon={<Globe size={19} />} title="Ngôn ngữ" value={profile.language === "en" ? "English" : profile.language === "zh" ? "中文" : "Tiếng Việt"}><select aria-label="Ngôn ngữ tài khoản" disabled={busy} value={profile.language || language} onChange={event => void saveLanguage(event.target.value as "vi" | "en" | "zh")}><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">中文</option></select></InfoRow>
   </section>
   {!admin && <section className={s.card}><div className={s.heading}><div><h2>Xác minh danh tính</h2><p>Hồ sơ xác minh dùng chung với ứng dụng.</p></div><ShieldCheck size={23} /></div><div className={s.verification}><div><span className={s.rowIcon}><FileCheck2 size={22} /></span><div><strong>{accountKycLabel(profile.kycStatus)}</strong><p>Giấy tờ và kết quả xét duyệt được cập nhật từ hệ thống.</p></div></div><Link className={s.secondary} href="/user/ekyc">{profile.kycStatus === "verified" ? "Xem hồ sơ" : "Hoàn thiện hồ sơ"}<ArrowRight size={16} /></Link></div></section>}
   <section className={s.card}><div className={s.details}><div><span>Ngày tham gia</span><strong>{accountDate(profile.createdAt)}</strong></div>{profile.referralCode && <div><span>Mã giới thiệu</span><strong>{profile.referralCode}<button type="button" aria-label="Sao chép mã giới thiệu" onClick={() => void copyReferral()}><Copy size={15} /></button></strong></div>}</div></section>
  </>}
  {tab === "benefits" && !admin && <>
   <section className={s.card}><div className={s.heading}><div><h2>Ví TXE PRO</h2><p>Số dư và các khoản bảo đảm của tài khoản.</p></div><button className={s.textButton} disabled={voucherBusy} onClick={() => setFinanceRetry(value => value + 1)}><RefreshCw size={16} />Cập nhật</button></div>
    {walletError ? <p className={s.error} role="alert">{walletError}</p> : !wallet ? <div className={s.miniSkeleton} role="status" aria-label="Đang tải ví" /> : <><div className={s.balance}><span>Số dư tiền khả dụng</span><strong>{accountMoney(wallet.availableBalance)}</strong><small>Tiền bảo đảm có thể dùng: {accountMoney(wallet.guaranteeAvailableBalance)}</small></div><div className={s.moneyGrid}><div><span>Đang khóa ký quỹ</span><strong>{accountMoney(wallet.lockedBalance)}</strong></div><div><span>Quyền lợi có thể rút</span><strong>{accountMoney(wallet.promoAvailableBalance)}</strong></div><div><span>Quyền lợi chờ đủ điều kiện</span><strong>{accountMoney(wallet.promoPendingBalance)}</strong></div></div>{typeof wallet.promoReleaseDays === "number" && <p className={s.inset}>Khoản quyền lợi chờ đủ điều kiện áp dụng thời hạn {wallet.promoReleaseDays} ngày.{wallet.promoNextReleaseAt ? " Mốc tiếp theo: " + accountDate(wallet.promoNextReleaseAt) + "." : ""} Số tiền dùng ký quỹ và số tiền rút được có thể khác nhau.</p>}</>}
    <p className={s.muted}>Nạp/rút tiền và lịch sử giao dịch hiện được quản lý trong ứng dụng TXE PRO.</p>
   </section>
   <section className={s.card}><div className={s.heading}><div><h2>Voucher của bạn</h2><p>Quyền lợi theo vai trò hiện tại.</p></div><Ticket size={22} /></div>
    {vouchers && <div className={s.voucherSummary}><span>Đang hiệu lực <strong>{vouchers.summary.active ?? "—"}</strong></span><span>Đang giữ <strong>{vouchers.summary.reserved ?? "—"}</strong></span></div>}
    {voucherError && <p className={s.error} role="alert">{voucherError}</p>}
    {!vouchers && !voucherError ? <div className={s.miniSkeleton} role="status" aria-label="Đang tải voucher" /> : vouchers?.items.length === 0 ? <p className={s.muted}>Chưa có voucher trong vai trò này.</p> : vouchers?.items.map(item => <article className={s.voucher} key={item.id}><span className={s.rowIcon}><Ticket size={20} /></span><div><strong>{item.campaign?.name || "Voucher TXE PRO"}</strong>{item.campaign?.description && <p>{item.campaign.description}</p>}<small>{item.expiresAt ? "Hết hạn: " + accountDate(item.expiresAt) : "Không có ngày hết hạn được ghi nhận"}</small></div><span className={s.tag}>{grantLabel(item.status)}</span></article>)}
    {vouchers?.pagination?.hasMore && <button type="button" className={s.secondary} disabled={voucherBusy} onClick={() => void moreVouchers()}>{voucherBusy ? "Đang tải…" : "Xem thêm voucher"}</button>}
   </section>
  </>}
  {tab === "security" && <section className={s.card}><div className={s.heading}><div><h2>Bảo mật tài khoản</h2><p>Xác minh trước khi cập nhật thông tin quan trọng.</p></div><LockKeyhole size={22} /></div><InfoRow icon={<LockKeyhole size={19} />} title="Mật khẩu" value="Đổi bằng mật khẩu hiện tại và OTP"><button className={s.textButton} disabled={busy} onClick={() => setAction("password")}>Đổi mật khẩu</button></InfoRow><InfoRow icon={<Phone size={19} />} title="Điện thoại nhận mã" value={profile.phone} verified={profile.isPhoneVerified === true} /><p className={s.inset}><ShieldCheck size={18} />Không chia sẻ mã OTP hoặc mật khẩu với người khác.</p><div className={s.legal}><Link href="/thong-tin/dieu-khoan-su-dung">Điều khoản sử dụng</Link><Link href="/thong-tin/chinh-sach-bao-mat">Chính sách bảo mật</Link></div></section>}
  </div></div>
  {action && <AccountChangeDialog key={action} action={action} profile={profile} onClose={() => { setAction(null); setRetry(value => value + 1); }} onSaved={user => { if (user) syncProfile(user); setAction(null); setMessage("Đã cập nhật thông tin tài khoản."); }} />}
  {logoutOpen && <PickerDialog title="Đăng xuất tài khoản?" icon={<LogOut size={22} />} dismissible={!busy} onClose={() => setLogoutOpen(false)}><p className={s.muted}>Bạn có thể đăng nhập lại để tiếp tục sử dụng TXE PRO.</p><div className={s.buttonRow}><button className={s.secondary} disabled={busy} onClick={() => setLogoutOpen(false)}>Ở lại</button><button className={s.danger} disabled={busy} onClick={() => void logout()}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button></div></PickerDialog>}
  </>}
 </main><Footer /></>;
}
