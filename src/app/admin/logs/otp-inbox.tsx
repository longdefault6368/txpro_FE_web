"use client";

import { useEffect, useState } from "react";
import { API_BASE, fetchWithAuth } from "@/utils/api";

type Message = {
  id: string; channel: "sms" | "email"; mode: "live" | "mock";
  maskedRecipient: string; purpose: string; otpCode: string;
  createdAt: string; expiresAt: string;
};
const purposes: Record<string, string> = {
  register: "Đăng ký", forgot_password: "Quên mật khẩu",
  device_verification: "Xác minh thiết bị", biometric_device_binding: "Liên kết thiết bị",
  password_change: "Đổi mật khẩu", phone_update_current: "Xác minh số hiện tại",
  phone_update_new: "Đổi số điện thoại", name_update: "Đổi tên", email_update: "Xác minh email",
};

export default function OtpInbox() {
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!opened) return;
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (busy || document.hidden) return;
      busy = true;
      setLoading(true);
      try {
        const response = await fetchWithAuth(`${API_BASE}/admin/settings/otp-inbox?limit=20`, {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("unavailable");
        const payload = await response.json();
        if (controller.signal.aborted) return;
        setMessages(Array.isArray(payload.data?.messages) ? payload.data.messages : []);
        setError("");
        setNow(Date.now());
      } catch {
        if (!controller.signal.aborted) {
          setMessages([]);
          setError("Không tải được OTP. Kiểm tra quyền admin và phiên bản backend.");
        }
      } finally {
        busy = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    const poll = window.setInterval(() => void load(), 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const visibility = () => {
      if (document.hidden) { setMessages([]); setOpened(false); }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller.abort();
      window.clearInterval(poll);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [opened, version]);

  const visible = messages.filter(item => Date.parse(item.expiresAt) > now);
  return <section className="space-y-4 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-bold text-slate-950">Mã OTP SMS & email</h2>
        <p className="mt-1 text-sm text-slate-500">Chỉ admin. Mỗi lần xem được ghi nhận; không chia sẻ mã cho người khác.</p>
      </div>
      <div className="flex gap-2">
        {opened && <button disabled={loading} onClick={() => setVersion(v => v + 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50">Làm mới</button>}
        <button onClick={() => { setMessages([]); setError(""); setOpened(v => !v); }}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {opened ? "Ẩn mã OTP" : "Xem mã OTP"}
        </button>
      </div>
    </div>
    {opened && <>
      <p className="text-xs text-amber-700">Mã mới từ lúc cập nhật backend mới được ghi nhận. “Gửi thật” là nhà cung cấp đã tiếp nhận, không bảo đảm điện thoại đã nhận. Mã hết hạn/đã dùng sẽ bị loại khi làm mới.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500"><tr>
            {['Thời gian', 'Người nhận', 'Mục đích', 'Kênh', 'Chế độ', 'Mã OTP', 'Còn lại'].map(label => <th key={label} className="whitespace-nowrap px-3 py-3">{label}</th>)}
          </tr></thead>
          <tbody>{visible.map(item => <tr key={item.id} className="border-b border-slate-100">
            <td className="whitespace-nowrap px-3 py-3">{new Date(item.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
            <td className="px-3 py-3">{item.maskedRecipient}</td>
            <td className="px-3 py-3">{purposes[item.purpose] || item.purpose}</td>
            <td className="px-3 py-3 uppercase">{item.channel}</td>
            <td className="px-3 py-3">{item.mode === 'live' ? 'Gửi thật' : 'Giả lập'}</td>
            <td className="px-3 py-3 font-mono text-lg font-bold tracking-widest text-slate-950">{item.otpCode}</td>
            <td className="px-3 py-3 tabular-nums">{Math.max(0, Math.ceil((Date.parse(item.expiresAt) - now) / 1000))} giây</td>
          </tr>)}</tbody>
        </table>
        {visible.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{loading ? 'Đang tải OTP...' : 'Không có mã OTP hiện hành.'}</p>}
      </div>
    </>}
  </section>;
}
