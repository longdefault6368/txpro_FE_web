"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Banknote, Briefcase, CheckCircle2, ChevronDown, MapPin, Send, Upload, X } from "lucide-react";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import { CAREER_JOBS, type CareerLang } from "@/lib/careers-data";
import { postingRequest } from "@/utils/posting-api";

const jobs = CAREER_JOBS;
const emptyForm = { fullName: "", phone: "", email: "", roleId: jobs[0].id, message: "" };
const resumeLimit = 8 * 1024 * 1024;
const resumePattern = /\.(pdf|docx|doc)$/i;

export default function CareersPage() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const lang: CareerLang = language === "en" || language === "zh" ? language : "vi";
  const t = (copy: Record<CareerLang, string>) => copy[lang];
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const resumeInput = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const copy = {
    badge: { vi: "Cơ hội nghề nghiệp", en: "Careers", zh: "招聘" },
    title: { vi: "Tuyển dụng tại TXE PRO", en: "Careers at TXE PRO", zh: "加入 TXE PRO" },
    subtitle: {
      vi: "Chúng tôi đang tìm người muốn làm sản phẩm vận tải thực tế: kết nối chủ hàng, tài xế và chuyến đi mỗi ngày.",
      en: "We are looking for people who want to build a working transport product used by shippers and drivers every day.",
      zh: "我们正在寻找愿意打造真实运输产品的伙伴，每天连接货主、司机和行程。",
    },
    rolesTitle: { vi: "Vị trí đang mở", en: "Open roles", zh: "在招职位" },
    apply: { vi: "Ứng tuyển", en: "Apply", zh: "申请" },
    details: { vi: "Chi tiết", en: "Details", zh: "详情" },
    fullDescription: { vi: "Xem mô tả chi tiết, yêu cầu và quyền lợi", en: "View full description, requirements and benefits", zh: "查看详细岗位说明、要求与待遇" },
    close: { vi: "Đóng", en: "Close", zh: "关闭" },
    salary: { vi: "Mức lương", en: "Salary", zh: "薪资" },
    workType: { vi: "Hình thức", en: "Type", zh: "类型" },
    place: { vi: "Địa điểm", en: "Location", zh: "地点" },
    overview: { vi: "Mô tả công việc", en: "Role", zh: "岗位说明" },
    duties: { vi: "Công việc chính", en: "Main work", zh: "主要工作" },
    requirements: { vi: "Yêu cầu", en: "Requirements", zh: "要求" },
    benefits: { vi: "Quyền lợi", en: "What you get", zh: "待遇" },
    formTitle: { vi: "Gửi hồ sơ", en: "Send your application", zh: "提交申请" },
    formHint: {
      vi: "Điền form bên dưới. Hồ sơ được chuyển tới bộ phận tuyển dụng qua kênh liên hệ của website.",
      en: "Use the form below. Applications go to the hiring team through the website contact inbox.",
      zh: "请填写下方表格。申请会通过网站联系渠道发给招聘团队。",
    },
    name: { vi: "Họ và tên", en: "Full name", zh: "姓名" },
    phone: { vi: "Số điện thoại", en: "Phone", zh: "电话" },
    email: { vi: "Email", en: "Email", zh: "邮箱" },
    role: { vi: "Vị trí", en: "Role", zh: "职位" },
    profile: { vi: "Tải CV hoặc portfolio", en: "Upload a CV or portfolio", zh: "上传简历或作品" },
    profileOptional: { vi: "Tải CV hoặc portfolio (không bắt buộc)", en: "Upload a CV or portfolio (optional)", zh: "上传简历或作品（选填）" },
    profileHint: { vi: "PDF, DOC hoặc DOCX, tối đa 8 MB", en: "PDF, DOC or DOCX, up to 8 MB", zh: "PDF、DOC 或 DOCX，最大 8 MB" },
    chooseFile: { vi: "Chọn file", en: "Choose file", zh: "选择文件" },
    noFile: { vi: "Chưa chọn file", en: "No file selected", zh: "尚未选择文件" },
    note: { vi: "Giới thiệu ngắn", en: "Short introduction", zh: "简短介绍" },
    send: { vi: "Gửi hồ sơ", en: "Submit application", zh: "提交申请" },
    sending: { vi: "Đang gửi...", en: "Sending...", zh: "正在发送..." },
    success: {
      vi: "Đã nhận hồ sơ. TXE PRO sẽ liên hệ nếu vị trí phù hợp.",
      en: "Application received. TXE PRO will contact you if the role is a fit.",
      zh: "已收到申请。如果职位合适，TXE PRO 会与你联系。",
    },
    required: {
      vi: "Vui lòng điền họ tên, số điện thoại, email, giới thiệu ngắn và tải CV.",
      en: "Please enter your name, phone, email, a short introduction and upload a CV.",
      zh: "请填写姓名、电话、邮箱、简短介绍并上传简历。",
    },
    requiredNoCv: {
      vi: "Vui lòng điền họ tên, số điện thoại, email và giới thiệu ngắn.",
      en: "Please enter your name, phone, email and a short introduction.",
      zh: "请填写姓名、电话、邮箱和简短介绍。",
    },
    resumeType: {
      vi: "Chỉ nhận file PDF, DOC hoặc DOCX, tối đa 8 MB.",
      en: "Only PDF, DOC or DOCX files up to 8 MB are accepted.",
      zh: "仅接受 8 MB 以内的 PDF、DOC 或 DOCX 文件。",
    },
    failed: {
      vi: "Chưa gửi được hồ sơ. Vui lòng thử lại hoặc liên hệ trực tiếp.",
      en: "The application could not be sent. Please try again or contact us directly.",
      zh: "申请未能发送。请重试或直接联系我们。",
    },
    another: { vi: "Gửi hồ sơ khác", en: "Send another application", zh: "再提交一份" },
  };

  const detailJob = jobs.find((job) => job.id === detailId) ?? null;
  const selectedRole = jobs.find((job) => job.id === form.roleId) ?? jobs[0];
  const isResumeOptional = Boolean(selectedRole?.resumeOptional);

  useEffect(() => {
    if (!detailJob) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detailJob]);

  function chooseRole(id: string) {
    setDetailId(null);
    setDone(false);
    setForm((current) => ({ ...current, roleId: id }));
    window.setTimeout(() => document.getElementById("career-apply")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.message.trim() || (!resume && !isResumeOptional)) {
      setError(t(isResumeOptional ? copy.requiredNoCv : copy.required));
      return;
    }
    if (resume && (!resumePattern.test(resume.name) || resume.size > resumeLimit)) {
      setError(t(copy.resumeType));
      return;
    }
    const role = jobs.find((job) => job.id === form.roleId) ?? jobs[0];
    const body = new FormData();
    body.append("fullName", form.fullName.trim());
    body.append("phone", form.phone.trim());
    body.append("email", form.email.trim());
    body.append("subject", `Tuyển dụng: ${role.title.vi}`);
    body.append("message", `Vị trí: ${role.title.vi}\n${form.message.trim()}`);
    if (role.resumeOptional) body.append("resumeOptional", "true");
    if (resume) body.append("resume", resume);
    setSubmitting(true);
    try {
      await postingRequest("/contacts/applications", { method: "POST", body }, false);
      setDone(true);
      setForm({ ...emptyForm, roleId: role.id });
      setResume(null);
      if (resumeInput.current) resumeInput.current.value = "";
    } catch {
      setError(companyInfo.emailGeneral ? `${t(copy.failed)} ${companyInfo.emailGeneral}` : t(copy.failed));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <SubpageHeroBanner
        badge={t(copy.badge)}
        title={t(copy.title)}
        subtitle={t(copy.subtitle)}
        breadcrumbs={[
          { label: lang === "en" ? "Home" : lang === "zh" ? "首页" : "Trang chủ", href: "/" },
          { label: t(copy.title) },
        ]}
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-bold text-slate-950">{t(copy.rolesTitle)}</h2>
        <div className="mt-6 grid gap-4">
          {jobs.map((job) => (
            <article key={job.id} id={`job-${job.id}`} className="rounded-3xl border border-slate-200 bg-white p-6 scroll-mt-28">
              <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-600">{t(job.team)}</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">{t(job.title)}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{t(job.summary)}</p>
                  <p className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1"><Briefcase size={14} aria-hidden="true" />{t(job.type)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{t(job.location)}</span>
                    <span className="inline-flex items-center gap-1"><Banknote size={14} aria-hidden="true" />{t(copy.salary)}: {t(job.salary)}</span>
                  </p>
                </div>
                <div className="mt-5 flex shrink-0 gap-2 sm:mt-0">
                  <button type="button" onClick={() => setDetailId(job.id)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">{t(copy.details)}</button>
                  <button type="button" onClick={() => chooseRole(job.id)} className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors cursor-pointer">{t(copy.apply)}</button>
                </div>
              </div>

              <details className="group mt-5 border-t border-slate-100 pt-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-primary-700 hover:text-primary-800 [&::-webkit-details-marker]:hidden">
                  <ChevronDown size={15} className="transition-transform group-open:rotate-180" aria-hidden="true" />
                  <span>{t(copy.fullDescription)}</span>
                </summary>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">{t(copy.overview)}</h4>
                    <p className="mt-1.5">{t(job.overview)}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">{t(copy.duties)}</h4>
                    <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
                      {job.duties[lang].map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">{t(copy.requirements)}</h4>
                    <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
                      {job.requirements[lang].map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">{t(copy.benefits)}</h4>
                    <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
                      {job.benefits[lang].map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
      <section id="career-apply" className="mx-auto max-w-3xl scroll-mt-28 px-5 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-950">{t(copy.formTitle)}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{t(copy.formHint)}</p>
          {done ? (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800">
              <p className="flex items-start gap-2 font-semibold"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{t(copy.success)}</p>
              <button type="button" onClick={() => setDone(false)} className="mt-4 font-bold text-primary-700">{t(copy.another)}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.name)}
                <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.phone)}
                  <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.email)}
                  <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.role)}
                <select value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
                  {jobs.map((job) => <option key={job.id} value={job.id}>{t(job.title)}</option>)}
                </select>
              </label>
              <div className="grid gap-1 text-sm font-semibold text-slate-700">
                <span>{t(isResumeOptional ? copy.profileOptional : copy.profile)}</span>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 font-normal">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800"><Upload size={16} />{t(copy.chooseFile)}</span>
                  <span className="min-w-0 truncate text-slate-500">{resume ? resume.name : t(copy.noFile)}</span>
                  <input ref={resumeInput} required={!isResumeOptional} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && (!resumePattern.test(file.name) || file.size > resumeLimit)) {
                      setResume(null);
                      event.target.value = "";
                      setError(t(copy.resumeType));
                      return;
                    }
                    setError("");
                    setResume(file);
                  }} />
                </label>
                <span className="font-normal text-xs text-slate-500">{t(copy.profileHint)}</span>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.note)}
                <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                <Send size={16} />{submitting ? t(copy.sending) : t(copy.send)}
              </button>
            </form>
          )}
        </div>
      </section>
      {detailJob && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDetailId(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="career-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-600">{t(detailJob.team)}</p>
                <h2 id="career-detail-title" className="mt-2 text-2xl font-bold text-slate-950">{t(detailJob.title)}</h2>
              </div>
              <button type="button" aria-label={t(copy.close)} onClick={() => setDetailId(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.salary)}</dt><dd className="mt-1 font-bold text-slate-900">{t(detailJob.salary)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.workType)}</dt><dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900"><Briefcase size={14} />{t(detailJob.type)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.place)}</dt><dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900"><MapPin size={14} />{t(detailJob.location)}</dd></div>
            </dl>
            <h3 className="mt-6 text-sm font-bold text-slate-950">{t(copy.overview)}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t(detailJob.overview)}</p>
            <h3 className="mt-6 text-sm font-bold text-slate-950">{t(copy.duties)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.duties[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="mt-5 text-sm font-bold text-slate-950">{t(copy.requirements)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.requirements[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="mt-5 text-sm font-bold text-slate-950">{t(copy.benefits)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.benefits[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDetailId(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">{t(copy.close)}</button>
              <button type="button" onClick={() => chooseRole(detailJob.id)} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white">{t(copy.apply)}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
