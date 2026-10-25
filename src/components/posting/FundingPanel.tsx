"use client";
import { useEffect, useRef, useState } from "react";
import { postingRequest } from "@/utils/posting-api";
import s from "./Posting.module.css";
type Intent = { transactionId: string; qrImage: string; amount: number; netAmount: number; virtualAccount: string; content: string; expiresAt: string };
export default function FundingPanel({ missingAmount, onPaid }: { missingAmount: number; onPaid: () => void }) {
  const [intent, setIntent] = useState<Intent | null>(null), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""), [done, setDone] = useState(false), [uncertain, setUncertain] = useState(false);
  const lock = useRef(false), callback = useRef(onPaid);
  useEffect(() => { callback.current = onPaid; }, [onPaid]);
  useEffect(() => {
    if (!intent || done) return;
    let stopped = false, timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (stopped) return;
      if (Date.now() > new Date(intent.expiresAt).getTime()) { setMessage("QR đã hết hạn. Kiểm tra ví trước khi tạo mã mới."); return; }
      try {
        const data = await postingRequest<Array<{ id?: string; _id?: string; status: string }> | { items?: Array<{ id?: string; _id?: string; status: string }> }>("/common/wallet/transactions?limit=50&page=1");
        const rows = Array.isArray(data) ? data : data.items || [];
        const tx = rows.find(item => (item.id || item._id) === intent.transactionId);
        if (stopped) return;
        if (tx?.status === "success") { setDone(true); setMessage("Đã nhận tiền. Vui lòng kiểm tra lại điều kiện và xác nhận thao tác."); callback.current(); return; }
        if (["failed", "cancelled", "expired"].includes(tx?.status || "")) { setMessage("Giao dịch chưa thành công. Vui lòng kiểm tra ví."); return; }
        setMessage("Đang chờ ngân hàng xác nhận giao dịch...");
      } catch { if (!stopped) setMessage("Chưa kiểm tra được giao dịch. Sẽ tự thử lại."); }
      if (!stopped) timer = setTimeout(poll, 4000);
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [intent, done]);
  async function create() {
    if (lock.current || intent || uncertain) return; lock.current = true; setBusy(true); setMessage("");
    try {
      const data = await postingRequest<Intent>("/common/wallet/topup", { method: "POST", body: JSON.stringify({ amount: missingAmount, method: "bank_transfer" }) });
      if (!data.transactionId || !data.qrImage || !Number.isFinite(data.amount) || !Number.isFinite(new Date(data.expiresAt).getTime())) {
        setUncertain(true); throw new Error("Chưa nhận đủ dữ liệu QR. Vui lòng kiểm tra ví, không tạo lại giao dịch ngay.");
      }
      setIntent(data);
    }
    catch (e) { setMessage(e instanceof Error ? e.message : "Không tạo được QR."); if ((e as { uncertain?: boolean }).uncertain) setUncertain(true); }
    finally { lock.current = false; setBusy(false); }
  }
  const qr = intent?.qrImage || "";
  const src = /^https:\/\//.test(qr) || qr.startsWith("data:image/") ? qr : qr ? "data:image/png;base64," + qr : "";
  return <aside className={s.funding} aria-live="polite"><h3>Ví chưa đủ tiền ký quỹ</h3><p>Cần nạp thêm <strong>{missingAmount.toLocaleString("vi-VN")} đ</strong> theo kết quả máy chủ. QR và phí nạp (nếu có) do backend cung cấp.</p>{!intent && <button className={s.primary} type="button" disabled={busy || uncertain} onClick={create}>{busy ? "Đang tạo QR..." : "Tạo QR nạp tiền MB"}</button>}{intent && <><img className={s.qr} src={src} alt="Mã QR nạp ví MB" /><dl><dt>Số tiền chuyển</dt><dd>{intent.amount.toLocaleString("vi-VN")} đ</dd><dt>Tài khoản MB</dt><dd>{intent.virtualAccount}</dd><dt>Nội dung chuyển khoản</dt><dd>{intent.content}</dd></dl><p>Không sửa số tiền hoặc nội dung chuyển khoản. Tạo/đóng QR không có nghĩa là thanh toán thành công.</p></>}{message && <p role="status">{message}</p>}<a href="/don-cua-ban">Kiểm tra tin/đơn của tôi</a></aside>;
}
