"use client";

import { useState } from "react";

export type AccountClosure = {
  state?: "deactivated" | "deletion_requested" | "deleted";
  requestedAt?: string;
  expectedBy?: string;
  completedAt?: string;
  retentionSummary?: string;
};

export function AccountClosureActions({ closure, complete }: {
  closure?: AccountClosure;
  complete: (retentionSummary: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [notified, setNotified] = useState(false);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!closure?.state) return null;
  return <div className="mt-2 text-xs whitespace-normal max-w-64">
    <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">
      {closure.state === "deactivated" ? "Người dùng tự vô hiệu hóa" : closure.state === "deleted" ? "Đã xóa vĩnh viễn · không khôi phục" : "Chờ xử lý xóa vĩnh viễn"}
    </span>
    {closure.expectedBy && closure.state === "deletion_requested" && <p className="mt-2 text-red-700">Hạn xử lý: {new Date(closure.expectedBy).toLocaleString("vi-VN")}</p>}
    {closure.state === "deactivated" && <p className="mt-2 text-slate-500">Bật trạng thái để khôi phục; tin xe vẫn tạm dừng.</p>}
    {closure.state === "deletion_requested" && <button type="button" className="mt-2 text-red-700 underline" onClick={() => setOpen(true)}>Xử lý yêu cầu xóa</button>}
    {open && <div role="dialog" aria-modal="true" aria-label="Hoàn tất yêu cầu xóa" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 text-sm shadow-xl space-y-4">
        <h2 className="text-lg font-bold">Hoàn tất yêu cầu xóa vĩnh viễn</h2>
        <p>Đây là bước xác nhận sau khi đã xử lý dữ liệu. Không bấm hoàn tất chỉ để khóa tài khoản. Thực hiện quy trình trong tài liệu account-closure.md trước.</p>
        <label className="flex gap-2"><input type="checkbox" checked={checked} disabled={busy} onChange={e => setChecked(e.target.checked)} />Đã xóa dữ liệu cá nhân/KYC, tệp ảnh trên storage, nội dung người dùng và bản sao ở nhà cung cấp; đã rà soát dữ liệu giao dịch cần giữ.</label>
        <label className="flex gap-2"><input type="checkbox" checked={notified} disabled={busy} onChange={e => setNotified(e.target.checked)} />Đã gửi xác nhận hoàn tất tới thông tin liên hệ đã đăng ký.</label>
        <textarea className="w-full rounded-lg border p-3" maxLength={1000} disabled={busy} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Dữ liệu được giữ, căn cứ và thời hạn lưu (không ghi thông tin cá nhân). Nếu không giữ, ghi rõ Không giữ." />
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={() => setOpen(false)}>Quay lại</button>
          <button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-40" disabled={busy || !checked || !notified || !summary.trim()} onClick={async () => {
            setBusy(true); setError("");
            try { await complete(summary.trim()); setOpen(false); }
            catch (e) { setError(e instanceof Error ? e.message : "Chưa hoàn tất được."); }
            finally { setBusy(false); }
          }}>{busy ? "Đang xử lý…" : "Xác nhận và ẩn danh tài khoản"}</button>
        </div>
      </div>
    </div>}
  </div>;
}
