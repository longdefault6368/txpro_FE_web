"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, ExternalLink, Inbox, Mail, Phone, RefreshCw, Trash2 } from "lucide-react";
import { APPLICANT_PURPOSES, applicantMail, defaultApplicantPurpose } from "@/lib/admin-mail";
import { API_BASE, API_BASE_URL, fetchWithAuth } from "@/utils/api";

type Application = {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: "new" | "in_progress" | "accepted" | "rejected" | "unsuitable" | "resolved" | "spam";
  adminNotes?: string;
  createdAt: string;
};

type Counts = { new: number; inProgress: number; resolved: number; total: number };

const STATUS_OPTIONS: { value: Application["status"]; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "in_progress", label: "Đang xem" },
  { value: "accepted", label: "Đã nhận" },
  { value: "rejected", label: "Từ chối" },
  { value: "unsuitable", label: "Không phù hợp" },
  { value: "resolved", label: "Đã xử lý" },
];
const STATUS_LABEL: Record<Application["status"], string> = {
  ...Object.fromEntries(STATUS_OPTIONS.map((item) => [item.value, item.label])),
  spam: "Không phù hợp",
} as Record<Application["status"], string>;

type Campaign = { _id: string; name: string; subject: string; body: string };

const roleName = (subject: string) => subject.replace(/^Tuyển dụng:\s*/, "") || subject;

export default function AdminCareersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<Counts>({ new: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [modalStatus, setModalStatus] = useState<Application["status"]>("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [composer, setComposer] = useState<{ application: Application; purposeId: string; campaignId: string; toEmail: string; subject: string; body: string; sending: boolean; error: string; notice: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", kind: "career" });
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      const res = await fetchWithAuth(`${API_BASE}/contacts/admin?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
      setApplications(data.contacts || []);
      if (data.counts) setCounts(data.counts);
      if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { void load(); }, [load]);

  async function openMail(application: Application) {
    const purposeId = defaultApplicantPurpose(application.status);
    const draft = applicantMail(purposeId, application.fullName, application.subject);
    setComposer({
      application,
      purposeId,
      campaignId: "manual",
      toEmail: application.email,
      subject: draft.subject,
      body: draft.body,
      sending: false,
      error: "",
      notice: "",
    });
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/email-marketing/campaigns?audience=applicant`);
      const json = await res.json().catch(() => null);
      if (res.ok) setCampaigns(json?.data || []);
    } catch {
      setCampaigns([]);
    }
  }

  function choosePurpose(purposeId: string) {
    if (purposeId === "saved") return;
    setComposer((current) => {
      if (!current) return current;
      const draft = applicantMail(purposeId, current.application.fullName, current.application.subject);
      return { ...current, purposeId, campaignId: "manual", subject: draft.subject, body: draft.body };
    });
  }

  function chooseCampaign(id: string) {
    const campaign = campaigns.find((item) => item._id === id);
    setComposer((current) => {
      if (!current) return current;
      if (!campaign) return { ...current, campaignId: "manual" };
      const role = roleName(current.application.subject);
      return {
        ...current,
        purposeId: "saved",
        campaignId: id,
        subject: campaign.subject.split("{{role}}").join(role),
        body: campaign.body.split("{{role}}").join(role).split("{{name}}").join(current.application.fullName).split("{{ten}}").join(current.application.fullName),
      };
    });
  }

  async function sendMail() {
    if (!composer) return;
    setComposer({ ...composer, sending: true, error: "", notice: "" });
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/email-marketing/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: composer.subject,
          body: composer.body,
          recipients: [{ name: composer.application.fullName, email: composer.toEmail }],
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Chưa gửi được email.");
      setComposer({ ...composer, sending: false, notice: "Đã gửi email." });
    } catch (reason) {
      setComposer({ ...composer, sending: false, error: reason instanceof Error ? reason.message : "Chưa gửi được email." });
    }
  }

  function open(application: Application) {
    setSelected(application);
    setModalStatus(application.status);
    setNotes(application.adminNotes || "");
    setNotice("");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setNotice("");
    try {
      const res = await fetchWithAuth(`${API_BASE}/contacts/admin/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: modalStatus, adminNotes: notes }),
      });
      if (res.ok) {
        setNotice("Đã lưu.");
        setSelected({ ...selected, status: modalStatus, adminNotes: notes });
        void load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Xóa hồ sơ ứng tuyển này?")) return;
    const res = await fetchWithAuth(`${API_BASE}/contacts/admin/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (selected?._id === id) setSelected(null);
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Briefcase className="text-primary-600" size={24} />Tuyển dụng</h1>
          <p className="mt-1 text-sm text-slate-500">Hồ sơ gửi từ trang tuyển dụng trên website.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Làm mới</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Tổng hồ sơ", counts.total],
          ["Mới", counts.new],
          ["Đang xem", counts.inProgress],
          ["Đã xử lý", counts.resolved],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm tên, số điện thoại, email hoặc vị trí" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="all">Mọi trạng thái</option>
          {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? <p className="px-5 py-16 text-center text-sm text-slate-500">Đang tải hồ sơ...</p> : applications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Inbox className="mx-auto text-slate-300" size={40} />
            <p className="mt-3 font-bold text-slate-700">Chưa có hồ sơ ứng tuyển</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ứng viên</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">CV</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <tr key={application._id} onClick={() => open(application)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{application.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{application.phone} · {application.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{roleName(application.subject)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{application.attachmentName || "Chưa có file"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(application.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{STATUS_LABEL[application.status]}</td>
                    <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void openMail(application)} title="Gửi email" aria-label={`Gửi email cho ${application.fullName}`} className="inline-flex rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"><Mail size={16} /></button>
                      <button type="button" onClick={() => open(application)} className="ml-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">Chi tiết</button>
                      <button type="button" onClick={() => void remove(application._id)} className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Xóa hồ sơ"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-50">Trước</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelected(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="career-admin-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Hồ sơ ứng tuyển</p>
                <h2 id="career-admin-title" className="mt-1 text-xl font-bold text-slate-900">{roleName(selected.subject)}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Đóng</button>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <p><span className="block text-xs text-slate-400">Ứng viên</span><strong>{selected.fullName}</strong></p>
              <p><span className="block text-xs text-slate-400">Điện thoại</span><a className="inline-flex items-center gap-1 font-bold" href={`tel:${selected.phone}`}><Phone size={14} />{selected.phone}</a></p>
              <p><span className="block text-xs text-slate-400">Email</span><span className="mt-0.5 flex items-center gap-2"><span className="truncate font-bold">{selected.email}</span><button type="button" onClick={() => void openMail(selected)} title="Gửi email" aria-label={`Gửi email cho ${selected.fullName}`} className="rounded-md bg-blue-50 p-1 text-blue-600 hover:bg-blue-100"><Mail size={14} /></button></span></p>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.message}</p>
            {selected.attachmentUrl && (
              <a href={`${API_BASE_URL}${selected.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-700">
                <ExternalLink size={16} />{selected.attachmentName || "Mở CV"}
              </a>
            )}
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Trạng thái
                <select value={modalStatus} onChange={(event) => setModalStatus(event.target.value as Application["status"])} className="rounded-xl border border-slate-200 px-3 py-2 font-normal">
                  {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Ghi chú nội bộ
                <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 font-normal" />
              </label>
              {notice && <p className="text-sm font-semibold text-emerald-700">{notice}</p>}
              <button type="button" disabled={saving} onClick={() => void save()} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </section>
        </div>
      )}
      {composer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setComposer(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="career-mail-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="career-mail-title" className="text-xl font-bold text-slate-900">Gửi email cho {composer.application.fullName}</h2>
              <button type="button" onClick={() => setComposer(null)} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Đóng</button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Email này gửi cho người ứng tuyển {roleName(composer.application.subject)}. Tiêu đề đổi theo mục đích bên dưới.</p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Mục đích gửi
                <select value={composer.purposeId} onChange={(event) => choosePurpose(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
                  {composer.campaignId !== "manual" && <option value="saved">Theo chiến dịch đã lưu</option>}
                  {APPLICANT_PURPOSES.map((purpose) => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Chiến dịch đã lưu cho người ứng tuyển
                <select value={composer.campaignId} onChange={(event) => chooseCampaign(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
                  <option value="manual">Dùng tiêu đề theo mục đích</option>
                  {campaigns.map((campaign) => <option key={campaign._id} value={campaign._id}>{campaign.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Email người nhận
                <input required type="email" value={composer.toEmail} onChange={(event) => setComposer({ ...composer, toEmail: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Tiêu đề
                <input required value={composer.subject} onChange={(event) => setComposer({ ...composer, subject: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Nội dung
                <textarea required rows={7} value={composer.body} onChange={(event) => setComposer({ ...composer, body: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              {composer.error && <p className="text-sm text-red-600">{composer.error}</p>}
              {composer.notice && <p className="text-sm font-semibold text-emerald-700">{composer.notice}</p>}
              <button type="button" disabled={composer.sending} onClick={() => void sendMail()} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{composer.sending ? "Đang gửi..." : "Gửi email"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
