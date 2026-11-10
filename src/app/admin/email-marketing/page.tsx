"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Megaphone, Send, Trash2 } from "lucide-react";
import { APPLICANT_PURPOSES, CUSTOMER_PURPOSES, applicantMail, customerMail, type MailAudience } from "@/lib/admin-mail";
import { API_BASE, fetchWithAuth } from "@/utils/api";

type Campaign = { _id: string; name: string; subject: string; body: string; audience?: MailAudience };
type Audience = { _id: string; name: string; count: number; recipients: { name: string; email: string }[]; audience?: MailAudience };

const parseRecipients = (value: string) => value.split(/\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
  const named = line.match(/^(.*?)[,;]\s*([^\s,;]+@[^\s,;]+)$/);
  if (named) return { name: named[1].trim(), email: named[2].trim() };
  return { name: "", email: line };
});

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE}${path}`, options);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Không thực hiện được.");
  return (json?.data ?? json) as T;
}

const draftFor = (audience: MailAudience, purposeId: string) => (
  audience === "applicant" ? applicantMail(purposeId, "", "") : customerMail(purposeId, "", "")
);

export default function EmailMarketingPage() {
  const opening = customerMail("reply", "", "");
  const [audienceKind, setAudienceKind] = useState<MailAudience>("customer");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<Audience[]>([]);
  const [campaignId, setCampaignId] = useState("manual");
  const [purposeId, setPurposeId] = useState("reply");
  const [listId, setListId] = useState("");
  const [audience, setAudience] = useState<"person" | "list">("person");
  const [subject, setSubject] = useState(opening.subject);
  const [body, setBody] = useState(opening.body);
  const [people, setPeople] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [listName, setListName] = useState("");
  const [listText, setListText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"send" | "campaigns" | "lists">("send");
  const purposes = audienceKind === "applicant" ? APPLICANT_PURPOSES : CUSTOMER_PURPOSES;
  const audienceLabel = audienceKind === "applicant" ? "người ứng tuyển" : "khách hàng";

  const load = useCallback(async () => {
    const [nextCampaigns, nextLists] = await Promise.all([
      api<Campaign[]>(`/admin/email-marketing/campaigns?audience=${audienceKind}`),
      api<Audience[]>(`/admin/email-marketing/lists?audience=${audienceKind}`),
    ]);
    setCampaigns(nextCampaigns || []);
    setLists(nextLists || []);
  }, [audienceKind]);

  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Chưa tải được dữ liệu.")); }, [load]);

  function applyPurpose(nextAudience: MailAudience, id: string) {
    if (id === "saved") return;
    const draft = draftFor(nextAudience, id);
    setPurposeId(id);
    setCampaignId("manual");
    setSubject(draft.subject);
    setBody(draft.body);
  }

  function switchAudience(next: MailAudience) {
    const nextPurpose = next === "applicant" ? "received" : "reply";
    setAudienceKind(next);
    setListId("");
    setNotice("");
    setError("");
    applyPurpose(next, nextPurpose);
  }

  function chooseCampaign(id: string, openSend = false) {
    setCampaignId(id);
    if (id === "manual") {
      const nextPurpose = purposeId === "saved" ? (audienceKind === "applicant" ? "received" : "reply") : purposeId;
      applyPurpose(audienceKind, nextPurpose);
    } else {
      const campaign = campaigns.find((item) => item._id === id);
      if (campaign) {
        setPurposeId("saved");
        setSubject(campaign.subject);
        setBody(campaign.body);
        setCampaignName(campaign.name);
      }
    }
    if (openSend) setTab("send");
  }

  async function saveCampaign(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/email-marketing/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: campaignName, audience: audienceKind, subject, body }) });
      setNotice(`Đã lưu chiến dịch cho ${audienceLabel}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa lưu được chiến dịch.");
    } finally {
      setBusy(false);
    }
  }

  async function saveList(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/email-marketing/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: listName, audience: audienceKind, recipients: parseRecipients(listText) }) });
      setListName("");
      setListText("");
      setNotice(`Đã lưu danh sách ${audienceLabel}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa lưu được danh sách.");
    } finally {
      setBusy(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = audience === "list"
        ? { subject, body, listId }
        : { subject, body, recipients: parseRecipients(people) };
      const result = await api<{ sent: number; failed: number }>("/admin/email-marketing/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setNotice(`Đã gửi ${result.sent} email cho ${audienceLabel}${result.failed ? `, ${result.failed} địa chỉ chưa gửi được` : ""}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa gửi được email.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(path: string) {
    if (!window.confirm("Xóa mục này?")) return;
    setError("");
    try {
      await api(path, { method: "DELETE" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa xóa được.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Megaphone className="text-primary-600" size={24} />Email marketing</h1>
        <p className="mt-1 text-sm text-slate-500">Khách hàng và người ứng tuyển được tách riêng. Tiêu đề email đổi theo mục đích đang chọn. Dùng {"{{name}}"} để chèn tên người nhận.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Đối tượng nhận email">
        <button type="button" role="tab" aria-selected={audienceKind === "customer"} onClick={() => switchAudience("customer")} className={`rounded-2xl border px-4 py-3 text-left ${audienceKind === "customer" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white"}`}>
          <span className="block text-sm font-bold text-slate-900">Khách hàng</span>
          <span className="mt-1 block text-xs text-slate-500">Phản hồi liên hệ, hỗ trợ và thông báo dịch vụ.</span>
        </button>
        <button type="button" role="tab" aria-selected={audienceKind === "applicant"} onClick={() => switchAudience("applicant")} className={`rounded-2xl border px-4 py-3 text-left ${audienceKind === "applicant" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white"}`}>
          <span className="block text-sm font-bold text-slate-900">Người ứng tuyển</span>
          <span className="mt-1 block text-xs text-slate-500">Nhận hồ sơ, mời phỏng vấn, trúng tuyển hoặc từ chối.</span>
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Email marketing">
        {([
          ["send", "Gửi"],
          ["campaigns", `Chiến dịch (${campaigns.length})`],
          ["lists", `Danh sách (${lists.length})`],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-primary-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{label}</button>
        ))}
      </div>
      {tab === "send" && <form onSubmit={send} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Gửi cho {audienceLabel}</h2>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Mục đích
          <select value={purposeId} onChange={(event) => applyPurpose(audienceKind, event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
            {campaignId !== "manual" && <option value="saved">Theo chiến dịch đã lưu</option>}
            {purposes.map((purpose) => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Chiến dịch đã lưu cho {audienceLabel}
          <select value={campaignId} onChange={(event) => chooseCampaign(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
            <option value="manual">Dùng tiêu đề theo mục đích</option>
            {campaigns.map((campaign) => <option key={campaign._id} value={campaign._id}>{campaign.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Tiêu đề
          <input required value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">Nội dung
          <textarea required rows={7} value={body} onChange={(event) => setBody(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
        </label>
        <div className="flex gap-4 text-sm font-semibold text-slate-700">
          <label className="inline-flex items-center gap-2"><input type="radio" checked={audience === "person"} onChange={() => setAudience("person")} />Cá nhân</label>
          <label className="inline-flex items-center gap-2"><input type="radio" checked={audience === "list"} onChange={() => setAudience("list")} />Danh sách</label>
        </div>
        {audience === "person" ? (
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Người nhận, mỗi dòng một email hoặc &quot;Tên, email&quot;
            <textarea required rows={4} value={people} onChange={(event) => setPeople(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
          </label>
        ) : (
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Danh sách {audienceLabel}
            <select required value={listId} onChange={(event) => setListId(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
              <option value="">Chọn danh sách</option>
              {lists.map((list) => <option key={list._id} value={list._id}>{list.name} ({list.count})</option>)}
            </select>
          </label>
        )}
        <button type="submit" disabled={busy} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Send size={16} />{busy ? "Đang gửi..." : "Gửi"}</button>
      </form>}
      {tab === "campaigns" && <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Chiến dịch cho {audienceLabel}</h2>
        <form onSubmit={saveCampaign} className="grid gap-3">
          <input required value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Tên chiến dịch" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <select value={purposeId === "saved" ? "manual" : purposeId} onChange={(event) => applyPurpose(audienceKind, event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
            {purposes.map((purpose) => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
          </select>
          <input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Tiêu đề email" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <textarea required rows={6} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nội dung. Dùng {{name}} để chèn tên." className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <button type="submit" disabled={busy} className="w-fit rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Lưu chiến dịch</button>
        </form>
        <div className="grid gap-3">
          {campaigns.length === 0 && <p className="text-sm text-slate-500">Chưa có chiến dịch cho {audienceLabel}.</p>}
          {campaigns.map((campaign) => (
            <article key={campaign._id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
              <div>
                <p className="font-bold text-slate-900">{campaign.name}</p>
                <p className="mt-1 text-sm text-slate-500">{campaign.subject}</p>
                <button type="button" onClick={() => chooseCampaign(campaign._id, true)} className="mt-2 text-sm font-bold text-primary-700">Dùng để gửi</button>
              </div>
              <button type="button" aria-label="Xóa chiến dịch" onClick={() => void remove(`/admin/email-marketing/campaigns/${campaign._id}`)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
      </section>}
      {tab === "lists" && <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Danh sách {audienceLabel}</h2>
          <form onSubmit={saveList} className="mt-4 grid gap-3">
            <input required value={listName} onChange={(event) => setListName(event.target.value)} placeholder="Tên danh sách" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <textarea required rows={5} value={listText} onChange={(event) => setListText(event.target.value)} placeholder={"Nguyễn Văn A, a@example.com\nb@example.com"} className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <button type="submit" disabled={busy} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Lưu danh sách</button>
          </form>
          <div className="mt-4 grid gap-3">
            {lists.length === 0 && <p className="text-sm text-slate-500">Chưa có danh sách cho {audienceLabel}.</p>}
            {lists.map((list) => (
              <article key={list._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <p className="font-bold text-slate-900">{list.name}<span className="ml-2 text-sm font-normal text-slate-500">{list.count} email</span></p>
                <button type="button" aria-label="Xóa danh sách" onClick={() => void remove(`/admin/email-marketing/lists/${list._id}`)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        </section>}
    </div>
  );
}
