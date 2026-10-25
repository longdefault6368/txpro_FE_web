"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Globe, Loader2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { postingRequest, PostingError } from "@/utils/posting-api";
type Preferences = { enabled: boolean; displayName: string; region: string; introduction: string; consentVersion: string };
export default function PublicCommunitySettings({ role, offline = false }: { role: string; offline?: boolean }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [data, setData] = useState<Preferences | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [saved, setSaved] = useState(false), [retry, setRetry] = useState(0);
  const lock = useRef(false);
  const sessionSnapshot = useRef<string | null>(null);
  useEffect(() => {
    if (!["chu-hang", "tai-xe"].includes(role)) return;
    let active = true;
    const session = localStorage.getItem("txpro_user_session");
    sessionSnapshot.current = session;
    setLoading(true); setError(""); setSaved(false);
    postingRequest<Preferences>("/community/profile").then(result => {
      if (!active) return;
      if (localStorage.getItem("txpro_user_session") !== session) throw new Error("SESSION_CHANGED");
      setData(result);
    })
      .catch(() => { if (active) { setData(null); setError(c("Chưa tải được tùy chọn cộng đồng. Vui lòng thử lại.", "Unable to load community preferences. Please retry.", "无法加载社区设置，请重试。")); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Copy is refreshed when a read is retried, without making language selection a network dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, retry]);
  if (!["chu-hang", "tai-xe"].includes(role)) return null;
  function field<K extends keyof Preferences>(key: K, value: Preferences[K]) { setData(old => old ? { ...old, [key]: value } : old); setSaved(false); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!data || lock.current || offline) return;
    if (localStorage.getItem("txpro_user_session") !== sessionSnapshot.current) {
      setData(null); setError(c("Tài khoản đã thay đổi. Tải lại tùy chọn trước khi đồng ý công khai.", "The account has changed. Reload preferences before giving consent.", "账户已更改，请重新加载设置后再同意公开。"));
      return;
    }
    lock.current = true; setBusy(true); setError(""); setSaved(false);
    try {
      const result = await postingRequest<Preferences>("/community/profile", { method: "PUT", body: JSON.stringify(data.enabled ? data : { enabled: false }) });
      if (localStorage.getItem("txpro_user_session") !== sessionSnapshot.current) {
        setData(null); setError(c("Tài khoản đã thay đổi. Tải lại tùy chọn để kiểm tra.", "The account changed. Reload preferences to check.", "账户已更改，请重新加载设置进行核实。"));
        return;
      }
      setData(result); setSaved(true);
    } catch (e) {
      if (e instanceof PostingError && !e.uncertain) {
        setError(c("Chưa lưu được. Kiểm tra tên hiển thị (2–60 ký tự) và không nhập thông tin liên hệ hoặc liên kết. Nếu phiên đã hết hạn, vui lòng đăng nhập lại.", "Unable to save. Check the display name (2–60 characters) and remove contact information or links. Sign in again if your session expired.", "无法保存。请检查显示名称（2–60个字符），移除联系方式及链接。会话过期时请重新登录。"));
        return;
      }
      // A failed/ambiguous save is re-read, not automatically replayed.
      setData(null); setError(c("Chưa xác nhận được kết quả lưu. Bấm tải lại để kiểm tra trạng thái trước khi lưu tiếp.", "The save result could not be confirmed. Reload preferences before saving again.", "无法确认保存结果，请重新加载并核实状态后再保存。"));
    } finally { lock.current = false; setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-offset-2 focus:outline-primary-600";
  return <section id="public-community" className="mt-7 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="community-settings-heading" aria-busy={loading || busy}>
    <div className="flex items-start gap-3"><Globe size={24} className="shrink-0 text-primary-600" /><div><h2 id="community-settings-heading" className="text-lg font-bold text-slate-900">{c("Giới thiệu trên trang chủ", "Your homepage introduction", "首页个人介绍")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{c("Tự nguyện xuất hiện trong cộng đồng TXE PRO. Mặc định hồ sơ không công khai; bạn có thể ẩn bất cứ lúc nào.", "Choose to appear in the TXE PRO community. Profiles are private by default and can be hidden at any time.", "自愿展示于 TXE PRO 社区。默认不公开，您可随时隐藏。")}</p></div></div>
    {loading ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-600"><Loader2 size={18} className="animate-spin motion-reduce:animate-none" />{c("Đang tải tùy chọn…", "Loading preferences…", "正在加载设置…")}</p>
      : data && <form onSubmit={event => { void submit(event); }} className="mt-5">
        <fieldset disabled={busy || offline} className="min-w-0 disabled:opacity-60">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900"><input type="checkbox" checked={data.enabled} onChange={event => field("enabled", event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" />
            {c("Tôi đồng ý công khai tên hiển thị, khu vực và lời giới thiệu bên dưới trên website, cho cả người chưa đăng nhập xem.", "I agree to show the display name, region and introduction below publicly on the website, including to visitors who are not signed in.", "我同意在网站公开以下显示名称、区域及介绍，包括向未登录访客展示。")}</label>
          {data.enabled && <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">{c("Tên hiển thị công khai", "Public display name", "公开显示名称")}<input required minLength={2} maxLength={60} value={data.displayName} onChange={e => field("displayName", e.target.value)} className={inputClass} /></label>
            <label className="text-sm font-semibold text-slate-700">{c("Tỉnh/thành phố (không bắt buộc)", "City or province (optional)", "省市（选填）")}<input maxLength={60} value={data.region} onChange={e => field("region", e.target.value)} className={inputClass} /></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">{c("Giới thiệu ngắn (không bắt buộc)", "Short introduction (optional)", "简短介绍（选填）")}<textarea rows={3} maxLength={180} value={data.introduction} onChange={e => field("introduction", e.target.value)} className={inputClass} /></label>
          </div>}
          <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-600"><ShieldCheck size={16} className="mt-1 shrink-0 text-emerald-700" />{c("Chỉ nhập thông tin bạn muốn công khai. Không nhập số điện thoại, email, liên kết, địa chỉ chi tiết hoặc giấy tờ. Hồ sơ không đồng nghĩa xe đang trống hay đã xác minh; không thay đổi phí hoặc quyền tài khoản.", "Only enter information you want public. Do not include phone numbers, email, links, precise addresses or identity details. This does not indicate vehicle availability or verification and does not affect fees or permissions.", "仅填写愿意公开的信息，不要填写电话、邮箱、链接、详细地址或证件。资料不代表空车或已认证，不影响费用或账户权限。")}</p>
          <button type="submit" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white">{busy && <Loader2 size={17} className="animate-spin motion-reduce:animate-none" />}{busy ? c("Đang lưu…", "Saving…", "保存中…") : c("Lưu tùy chọn", "Save preferences", "保存设置")}</button>
        </fieldset>
      </form>}
    {error && <div className="mt-4 text-sm text-red-700" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} disabled={offline || busy} className="mt-2 min-h-11 underline underline-offset-4">{c("Tải lại tùy chọn", "Reload preferences", "重新加载设置")}</button></div>}
    {saved && <p className="mt-4 text-sm text-emerald-800" role="status">{data?.enabled ? c("Đã công khai hồ sơ theo thông tin bạn đồng ý.", "Your approved introduction is now public.", "已按您的同意公开资料。") : c("Đã ẩn hồ sơ khỏi danh sách công khai.", "Your profile is hidden from the public directory.", "已从公开列表中隐藏资料。")}</p>}
    <Link href="/#community" className="mt-4 inline-block text-sm font-semibold text-primary-700 underline underline-offset-4">{c("Xem khu vực cộng đồng", "View the community", "查看社区")}</Link>
  </section>;
}
