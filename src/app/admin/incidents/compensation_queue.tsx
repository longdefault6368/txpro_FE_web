"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { incidentRoleLabel } from "@/utils/incident-review";

type Fund = { balance: number; totalAllocated: number; totalPaid: number };
type Claim = { id: string; orderId: string; orderCode?: string; amount: number;
  recipientRole: string; payerRole: string; fundingSource?: string; holdReason?: string };
const money = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;

/** Automatic cancellations may have no dispute case. Never strand their held payouts. */
export function PendingCancellationCompensations() {
  const [items, setItems] = useState<Claim[]>([]);
  const [fund, setFund] = useState<Fund | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [budgetReason, setBudgetReason] = useState("");
  const [attested, setAttested] = useState(false);
  const lock = useRef(false);
  const revision = useRef(0);
  const invalidateRequests = useCallback(() => { revision.current++; }, []);
  const load = useCallback(async () => {
    const id = ++revision.current;
    try {
      const responses = await Promise.all([
        fetchWithAuth(`${API_BASE}/admin/compensations?status=held&source=late_cancellation&page=${page}&limit=20`),
        fetchWithAuth(`${API_BASE}/admin/compensations/fund`),
      ]);
      const [claims, budget] = await Promise.all(responses.map(res => res.json()));
      if (id !== revision.current) return;
      if (!responses.every(res => res.ok)) throw new Error("Chưa tải được khoản bồi thường hoặc quỹ. Vui lòng thử lại.");
      setItems(claims.data?.items || []); setHasMore(claims.data?.pagination?.hasMore === true);
      setFund(budget.data?.fund || null);
      if (page > 1 && !(claims.data?.items?.length)) setPage(page - 1);
    } catch (error) {
      if (id === revision.current) setMessage(error instanceof Error ? error.message : "Lỗi kết nối máy chủ");
    }
  }, [page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => { clearTimeout(timer); invalidateRequests(); };
  }, [load, invalidateRequests]);

  const post = async (path: string, payload: object, confirmation: string) => {
    if (lock.current || !window.confirm(confirmation)) return false;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const res = await fetchWithAuth(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Không thể xử lý khoản bồi thường");
      setMessage("Đã xử lý. Kết quả và số dư quỹ đã được cập nhật.");
      await load(); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Lỗi kết nối máy chủ"); return false; }
    finally { lock.current = false; setBusy(false); }
  };
  const decide = async (claim: Claim, action: "approve" | "dismiss") => {
    if (reason.trim().length < 3 || reason.trim().length > 1000) { setMessage("Nhập căn cứ xử lý từ 3 đến 1.000 ký tự."); return; }
    const summary = action === "approve"
      ? `Duyệt ${money(claim.amount)} cho ${incidentRoleLabel(claim.recipientRole)} vào Ví khuyến mãi, giải ngân sau 30 ngày kể từ lúc ghi có?`
      : claim.fundingSource === "platform_fund" ? "Bác khoản chi TXE PRO? Không hoàn ký quỹ giả cho bên dùng voucher. Vi phạm và voucher đã thu hồi vẫn giữ nguyên."
        : "Bác bồi thường và hoàn khoản ký quỹ đang giữ cho bên nộp?";
    await post(`${API_BASE}/admin/compensations/${claim.id}/${action}`, { reason: reason.trim() }, summary);
  };
  const allocate = async () => {
    const value = Number(amount);
    if (!attested || !Number.isSafeInteger(value) || value < 1 || value > 1000000000 ||
        !/^[a-zA-Z0-9_-]{8,120}$/.test(reference.trim()) || budgetReason.trim().length < 10 || budgetReason.trim().length > 1000) {
      setMessage("Nhập số tiền 1–1 tỷ VND, mã đối soát 8–120 ký tự (chữ/số/_/-), căn cứ 10–1.000 ký tự và xác nhận nguồn đã được cấp."); return;
    }
    if (await post(`${API_BASE}/admin/compensations/fund/allocate`, { amount: value, reference: reference.trim(), reason: budgetReason.trim() },
      `Ghi nhận ${money(value)} ngân sách đã cấp nguồn, mã ${reference.trim()}? Đây không phải lệnh chuyển tiền ngân hàng.`)) {
      setAmount(""); setReference(""); setBudgetReason(""); setAttested(false);
    }
  };

  return <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <summary className="cursor-pointer font-semibold text-slate-900">Bồi thường do hủy sau 5 phút đang chờ xử lý • Quỹ TXE PRO: {fund ? money(fund.balance) : "Chưa tải"}</summary>
    <div className="mt-4 space-y-4 text-sm">
      <p className="text-slate-600">Khoản dưới đây chưa cộng vào ví người nhận. Quỹ chỉ dùng cho nhánh voucher; nhánh tiền ký quỹ sử dụng đúng tiền đã khóa, không thu thêm. Phán quyết tranh chấp được xử lý tại từng hồ sơ bên dưới.</p>
      <button type="button" disabled={busy} onClick={() => void load()} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 disabled:opacity-50">Làm mới quỹ và khoản chờ</button>
      {message && <p role="status" className="rounded-lg bg-slate-100 p-3 text-slate-800">{message}</p>}
      {items.length > 0 ? <>
        <label className="block text-slate-700">Căn cứ duyệt/bác khoản chi<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {items.map(claim => <div key={claim.id} className="rounded-xl border border-slate-200 p-3">
            <Link href={`/admin/orders/${claim.orderId}`} className="font-semibold text-sky-700">{claim.orderCode || claim.orderId}</Link>
            <p className="mt-1 font-semibold text-slate-900">{money(claim.amount)} → {incidentRoleLabel(claim.recipientRole)}</p>
            <p className="text-xs text-slate-600">Nguồn: {claim.fundingSource === "platform_fund" ? "Quỹ TXE PRO" : `Ký quỹ ${incidentRoleLabel(claim.payerRole)}`} • {claim.holdReason === "platform_fund_insufficient" ? "Chờ cấp nguồn" : "Chờ đối soát"}</p>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => void decide(claim, "dismiss")} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 disabled:opacity-50">Bác khoản chi</button>
              <button type="button" disabled={busy || (claim.fundingSource === "platform_fund" && (fund?.balance ?? 0) < claim.amount)} onClick={() => void decide(claim, "approve")} className="rounded-lg bg-emerald-600 px-3 py-2 text-white disabled:opacity-50">Duyệt bồi thường</button>
            </div>
          </div>)}
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" disabled={busy || page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Trước</button><span>Trang {page}</span>
          <button type="button" disabled={busy || !hasMore} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Sau</button>
        </div>
      </> : <p className="text-slate-600">Không có khoản hủy đơn đang chờ xử lý trên trang này.</p>}
      <details className="rounded-xl bg-slate-50 p-3">
        <summary className="cursor-pointer font-semibold text-slate-800">Ghi nhận nguồn quỹ TXE PRO đã đối soát</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-600">Đã cấp nguồn: {money(fund?.totalAllocated ?? 0)} • Đã chi: {money(fund?.totalPaid ?? 0)}. Không dùng tiền nạp hoặc ký quỹ của người dùng. Đây là sổ ngân sách nội bộ, không tạo giao dịch ngân hàng.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>Số tiền (VND)<input type="number" min="1" max="1000000000" step="1" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>Mã đối soát<input value={reference} onChange={e => setReference(e.target.value)} maxLength={120} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          </div>
          <label className="block">Căn cứ cấp nguồn<textarea value={budgetReason} onChange={e => setBudgetReason(e.target.value)} maxLength={1000} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="flex items-start gap-2"><input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)} disabled={busy} className="mt-1" />Tôi xác nhận ngân sách đã được cấp và có chứng từ đối soát.</label>
          <button type="button" disabled={busy || !attested} onClick={() => void allocate()} className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Ghi nhận nguồn quỹ</button>
        </div>
      </details>
    </div>
  </details>;
}
