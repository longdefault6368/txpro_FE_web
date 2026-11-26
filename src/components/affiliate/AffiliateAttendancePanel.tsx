"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Landmark,
  LogIn,
  LogOut,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { postingRequest } from "@/utils/posting-api";
import type { Partner } from "@/utils/affiliate";

const todayInVietnam = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatMoney = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const timeVn = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const dateLabel = (value?: string) => {
  const [year, month, day] = String(value || "").split("-");
  return year && month && day ? `${Number(day)}/${Number(month)}/${year}` : value || "";
};

const monthLabel = (value?: string) => {
  const [year, month] = String(value || "").split("-");
  return year && month ? `${Number(month)}/${year}` : value || "";
};

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "VietinBank", "BIDV", "Agribank",
  "VPBank", "ACB", "TPBank", "Sacombank", "VIB", "HDBank", "SeABank", "OCB",
  "Eximbank", "MSB", "SHB", "LPBank", "Nam A Bank", "Bac A Bank",
];

const LEAVE_REASONS = [
  { id: "family", label: "Việc gia đình" },
  { id: "medical", label: "Khám bệnh / điều trị" },
  { id: "personal", label: "Việc cá nhân" },
  { id: "annual", label: "Nghỉ phép năm" },
  { id: "ceremony", label: "Hiếu hỷ" },
  { id: "work", label: "Công tác" },
  { id: "other", label: "Khác" },
] as const;

type SubTab = "attendance" | "leave" | "salary";

type AttendanceRecord = {
  id: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  dailyReport?: string;
  dailyReportAt?: string | null;
};

type LeaveItem = {
  id: string;
  leaveDate: string;
  leaveType: "PAID" | "UNPAID";
  reason: string;
  detail?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string;
};

type BankInfo = { bankName: string; accountNumber: string; accountName: string };

type SalaryPayoutItem = {
  id: string;
  month: string;
  amountVnd: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "PENDING" | "PAID" | "REJECTED";
  reviewNote?: string;
};

type PartnerAttendanceData = {
  month: string;
  today: string;
  baseSalaryVnd?: number;
  records: AttendanceRecord[];
  leaves: LeaveItem[];
  policy: { baseSalaryVnd: number; paidLeaveDaysPerMonth: number };
  summary: {
    standardDays: number;
    attendedDays: number;
    paidLeaveDays: number;
    payableDays: number;
    baseSalaryVnd?: number;
    estimatedSalaryVnd: number;
  };
  bank: BankInfo | null;
  payouts: SalaryPayoutItem[];
  payoutWindow?: { month: string; open: boolean; opensOn: string; estimatedSalaryVnd: number };
  profile: { name: string; email: string; phone: string };
};

const payoutStatusLabel: Record<string, string> = {
  PENDING: "Chờ chuyển",
  PAID: "Đã chuyển",
  REJECTED: "Từ chối",
};

const leaveStatusLabel: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export default function AffiliateAttendancePanel({ partner }: { partner: Partner }) {
  const [subTab, setSubTab] = useState<SubTab>("attendance");
  const [month, setMonth] = useState(() => todayInVietnam().slice(0, 7));
  const [data, setData] = useState<PartnerAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Leave form
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReasonKey, setLeaveReasonKey] = useState<(typeof LEAVE_REASONS)[number]["id"]>("family");
  const [leaveCustomReason, setLeaveCustomReason] = useState("");
  const [leaveDetail, setLeaveDetail] = useState("");

  // Bank form
  const [bank, setBank] = useState<BankInfo>({ bankName: "Vietcombank", accountNumber: "", accountName: "" });
  const [editingBank, setEditingBank] = useState(false);

  // Daily report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await postingRequest<PartnerAttendanceData>(
          `/affiliate/attendance/me?month=${encodeURIComponent(month)}`
        );
        if (!active) return;
        setData(res);
        setError("");
        if (res.bank) {
          setBank(res.bank);
        } else if (res.profile?.name) {
          setBank((prev) => ({
            ...prev,
            accountName: prev.accountName || res.profile.name.toUpperCase(),
          }));
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu chấm công.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [month, refreshKey]);

  const reload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const act = async (path: string, method: "POST" | "PUT", body?: object, okMessage?: string) => {
    if (busy) return false;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await postingRequest(`/affiliate/attendance${path}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (okMessage) setNotice(okMessage);
      reload();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const calendar = useMemo(() => {
    const [year, value] = month.split("-").map(Number);
    const days = new Date(year, value, 0).getDate();
    const offset = (new Date(year, value - 1, 1).getDay() + 6) % 7;
    return {
      offset,
      dates: Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
    };
  }, [month]);

  const recordMap = useMemo(
    () => new Map((data?.records || []).map((record) => [record.workDate, record])),
    [data]
  );

  const today = data?.today || todayInVietnam();
  const todayRecord = recordMap.get(today);
  const checkedToday = Boolean(todayRecord);
  const checkedOutToday = Boolean(todayRecord?.checkOut);
  const fixedSalary = data?.baseSalaryVnd ?? partner.baseSalaryVnd ?? 0;
  const pendingLeaves = (data?.leaves || []).filter((item) => item.status === "PENDING").length;
  const payoutWindow = data?.payoutWindow;
  const payoutMonth = payoutWindow?.month || "";
  const monthPayout = (data?.payouts || []).find((item) => item.month === payoutMonth);

  const openReport = (date: string) => {
    const record = recordMap.get(date);
    setReportDate(date);
    setReportText(record?.dailyReport || "");
    setReportOpen(true);
  };

  const saveReport = async () => {
    if (reportDate !== today) {
      setError("Chỉ được gửi hoặc chỉnh sửa báo cáo trong ngày hôm nay.");
      return;
    }
    if (reportText.trim().length < 2) {
      setError("Vui lòng nhập nội dung báo cáo trong ngày.");
      return;
    }
    const ok = await act("/report", "POST", { content: reportText.trim() }, "Đã lưu báo cáo trong ngày.");
    if (ok) setReportOpen(false);
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason =
      leaveReasonKey === "other"
        ? leaveCustomReason.trim()
        : LEAVE_REASONS.find((item) => item.id === leaveReasonKey)?.label || "";
    if (!leaveDate || reason.length < 2) {
      setError(leaveReasonKey === "other" ? "Chọn ngày nghỉ và nhập lý do khác." : "Chọn ngày nghỉ và lý do.");
      return;
    }
    const ok = await act(
      "/leave-requests",
      "POST",
      {
        leaveDate,
        reasonKey: leaveReasonKey,
        reason,
        detail: leaveDetail.trim(),
      },
      "Đã gửi đơn nghỉ phép."
    );
    if (ok) {
      setLeaveDate("");
      setLeaveCustomReason("");
      setLeaveDetail("");
    }
  };

  const saveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = bank.accountNumber.replace(/\s+/g, "");
    if (bank.bankName.length < 2 || !/^[0-9]{6,20}$/.test(cleanAccount) || bank.accountName.trim().length < 2) {
      setError("Nhập ngân hàng, số tài khoản 6-20 số và tên chủ tài khoản.");
      return;
    }
    const ok = await act(
      "/bank",
      "PUT",
      {
        bankName: bank.bankName,
        accountNumber: cleanAccount,
        accountName: bank.accountName.trim().toUpperCase(),
      },
      "Đã lưu tài khoản ngân hàng nhận lương."
    );
    if (ok) setEditingBank(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between bg-white rounded-[20px] border border-[#e2ebf5] p-6 shadow-[0_10px_30px_-22px_rgba(15,39,68,0.16)]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary-600">
            <CalendarClock className="h-4 w-4" />
            <span>CHẤM CÔNG ĐỐI TÁC</span>
          </div>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">Chấm công &amp; Lương cứng</h2>
          <p className="mt-1 text-xs text-slate-500">
            {fixedSalary > 0
              ? `Mức lương cứng hiện tại: ${formatMoney(fixedSalary)}/tháng (tách biệt với hoa hồng giới thiệu).`
              : "Chế độ chấm công theo dõi ngày làm việc & báo cáo ngày (chưa áp dụng lương cứng)."}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <label className="text-xs font-bold text-slate-500">
            Tháng
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setLoading(true);
                setMonth(e.target.value);
              }}
              className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            />
          </label>
          <button
            type="button"
            onClick={reload}
            disabled={loading || busy}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Mục chấm công đối tác">
        {[
          { id: "attendance" as const, label: "Chấm công" },
          { id: "leave" as const, label: `Nghỉ phép${pendingLeaves > 0 ? ` (${pendingLeaves})` : ""}` },
          { id: "salary" as const, label: "Lương & ngân hàng" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={subTab === item.id}
            onClick={() => setSubTab(item.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              subTab === item.id
                ? "bg-primary-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(notice || error) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      {subTab === "attendance" && (
        <div className="space-y-5">
          {/* Check-in / Check-out Banner */}
          <div className="flex flex-col gap-4 rounded-[22px] bg-gradient-to-br from-[#0b1f3a] via-[#113569] to-[#136dec] p-5 sm:p-6 text-white sm:flex-row sm:items-center sm:justify-between shadow-[0_20px_40px_-24px_rgba(11,31,58,0.6)]">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Chấm công hôm nay ({dateLabel(today)})</h3>
              <p className="mt-1 text-xs text-blue-100/90">
                Mỗi ngày chấm vào một lần (Chủ nhật nghỉ cố định). Chấm ra khi kết thúc ca và gửi báo cáo công việc.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || checkedToday}
                onClick={() => void act("/check-in", "POST", {}, "Đã chấm công vào.")}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer disabled:bg-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {checkedToday ? <CheckCircle2 className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                <span>{checkedToday ? "Đã chấm vào hôm nay" : busy ? "Đang ghi nhận..." : "Bắt đầu làm việc"}</span>
              </button>
              <button
                type="button"
                disabled={busy || !checkedToday || checkedOutToday}
                onClick={() => void act("/check-out", "POST", undefined, "Đã chấm công ra.")}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                <span>{checkedOutToday ? "Đã chấm ra" : "Chấm công ra"}</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Ngày công", data?.summary.attendedDays ?? "—"],
              ["Phép có lương", data?.summary.paidLeaveDays ?? "—"],
              ["Chuẩn tháng", data?.summary.standardDays ?? "—"],
              [
                fixedSalary > 0 ? "Lương tạm tính" : "Lương cứng",
                fixedSalary > 0 ? formatMoney(data?.summary.estimatedSalaryVnd || 0) : "0 ₫",
              ],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Monthly Calendar */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  <span>Lịch công tháng {monthLabel(month)}</span>
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Hiển thị giờ vào, giờ ra và báo cáo công việc trong ngày.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">Hôm nay</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Đủ công</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Đang làm</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">Chủ nhật</span>
              </div>
            </div>

            {loading && !data ? (
              <div className="py-14 text-center text-xs text-slate-500">Đang tải lịch chấm công...</div>
            ) : (
              <div className="overflow-x-auto p-3 sm:p-4">
                <div className="min-w-[760px]">
                  <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((day) => (
                      <div key={day} className="py-1.5">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: calendar.offset }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[132px] rounded-xl bg-slate-50/80" />
                    ))}
                    {calendar.dates.map((date) => {
                      const record = recordMap.get(date);
                      const sunday = new Date(`${date}T00:00:00`).getDay() === 0;
                      const isToday = date === today;
                      const isFuture = date > today;
                      const complete = Boolean(record?.checkIn && record?.checkOut);
                      const working = Boolean(record?.checkIn && !record?.checkOut);
                      const leave = (data?.leaves || []).find(
                        (item) => item.leaveDate === date && item.status !== "REJECTED"
                      );

                      const cellClass = sunday
                        ? "border-slate-200 bg-slate-50"
                        : isToday
                        ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                        : complete
                        ? "border-emerald-200 bg-emerald-50/70"
                        : working
                        ? "border-amber-200 bg-amber-50/80"
                        : leave
                        ? "border-violet-200 bg-violet-50/70"
                        : "border-slate-200 bg-white";

                      return (
                        <div key={date} className={`min-h-[132px] rounded-xl border p-2 ${cellClass}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className={`text-xs font-bold ${
                                isToday ? "text-sky-700" : sunday ? "text-slate-400" : "text-slate-800"
                              }`}
                            >
                              {Number(date.slice(-2))}
                            </span>
                            {isToday && (
                              <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                Hôm nay
                              </span>
                            )}
                            {sunday && <span className="text-[9px] font-bold uppercase text-slate-400">Off</span>}
                            {leave && !sunday && (
                              <span className="text-[9px] font-bold uppercase text-violet-600">
                                {leave.status === "APPROVED" ? "Phép" : "Chờ phép"}
                              </span>
                            )}
                          </div>

                          {sunday ? (
                            <div className="mt-5 text-center text-[10px] font-semibold text-slate-400">
                              Nghỉ cố định
                            </div>
                          ) : (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between rounded-lg bg-white/80 px-1.5 py-0.5 text-[10px]">
                                <span className="text-slate-400 font-semibold">Vào</span>
                                <span className={`font-mono font-bold ${record?.checkIn ? "text-emerald-700" : "text-slate-300"}`}>
                                  {timeVn(record?.checkIn)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg bg-white/80 px-1.5 py-0.5 text-[10px]">
                                <span className="text-slate-400 font-semibold">Ra</span>
                                <span className={`font-mono font-bold ${record?.checkOut ? "text-slate-800" : "text-slate-300"}`}>
                                  {timeVn(record?.checkOut)}
                                </span>
                              </div>

                              {record?.dailyReport ? (
                                <button
                                  type="button"
                                  onClick={() => openReport(date)}
                                  className="w-full rounded-lg bg-white/90 px-1.5 py-1 text-left cursor-pointer"
                                >
                                  <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600">
                                    <span className="flex items-center gap-0.5">
                                      <FileText className="h-2.5 w-2.5" /> Báo cáo
                                    </span>
                                    <span className="font-mono">{timeVn(record.dailyReportAt)}</span>
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-slate-600">
                                    {record.dailyReport}
                                  </p>
                                </button>
                              ) : isToday ? (
                                <button
                                  type="button"
                                  onClick={() => openReport(date)}
                                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-indigo-200 bg-white/70 px-1.5 py-1 text-[10px] font-bold text-indigo-600 cursor-pointer"
                                >
                                  <ClipboardList className="h-3 w-3" /> Báo cáo ngày
                                </button>
                              ) : isFuture ? null : (
                                <div className="pt-1 text-center text-[10px] text-slate-400">
                                  {record ? "Không báo cáo" : "Chưa chấm"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "leave" && (
        <div className="space-y-5">
          <form onSubmit={submitLeave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gửi đơn xin nghỉ phép</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi tháng có tối đa {data?.policy.paidLeaveDaysPerMonth ?? 1} ngày nghỉ phép có lương (cần Admin duyệt).
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">
                Ngày nghỉ *
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Lý do *
                <select
                  value={leaveReasonKey}
                  onChange={(e) => setLeaveReasonKey(e.target.value as (typeof LEAVE_REASONS)[number]["id"])}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
                >
                  {LEAVE_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {leaveReasonKey === "other" && (
              <label className="block text-xs font-bold text-slate-600">
                Nhập lý do khác *
                <input
                  type="text"
                  required
                  value={leaveCustomReason}
                  onChange={(e) => setLeaveCustomReason(e.target.value)}
                  placeholder="Ví dụ: Đi công chứng giấy tờ"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800"
                />
              </label>
            )}

            <label className="block text-xs font-bold text-slate-600">
              Ghi chú chi tiết (không bắt buộc)
              <textarea
                rows={2}
                value={leaveDetail}
                onChange={(e) => setLeaveDetail(e.target.value)}
                placeholder="Thông tin thêm cho quản lý..."
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
            >
              {busy ? "Đang gửi..." : "Gửi đơn nghỉ phép"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Đơn nghỉ phép tháng {monthLabel(month)}</h3>
            {!data?.leaves.length ? (
              <p className="text-xs text-slate-400">Chưa có đơn nghỉ phép nào trong tháng này.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.leaves.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        {dateLabel(item.leaveDate)} ·{" "}
                        <span className="text-primary-600">{item.leaveType === "PAID" ? "Có lương" : "Không lương"}</span>
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        {[item.reason, item.detail].filter(Boolean).join(" · ")}
                      </p>
                      {item.reviewNote && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Ghi chú duyệt: {item.reviewNote}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        item.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {leaveStatusLabel[item.status] || item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "salary" && (
        <div className="space-y-5">
          {/* Salary withdrawal card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lương cứng &amp; Rút lương tháng</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lương cứng hiện tại: <strong className="text-slate-900">{formatMoney(fixedSalary)}/tháng</strong>. Mở rút lương tháng trước từ ngày 5 hàng tháng.
                </p>
              </div>
              {fixedSalary > 0 && payoutWindow && (
                <button
                  type="button"
                  disabled={
                    busy ||
                    !payoutWindow.open ||
                    !data?.bank?.accountNumber ||
                    !payoutWindow.estimatedSalaryVnd ||
                    Boolean(monthPayout && monthPayout.status !== "REJECTED")
                  }
                  onClick={() =>
                    void act(
                      "/salary-payouts",
                      "POST",
                      { month: payoutWindow.month },
                      `Đã gửi lệnh rút lương tháng ${monthLabel(payoutWindow.month)}.`
                    )
                  }
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {monthPayout && monthPayout.status !== "REJECTED"
                    ? `Tháng ${monthLabel(payoutMonth)}: ${payoutStatusLabel[monthPayout.status] || monthPayout.status}`
                    : `Rút lương tháng ${monthLabel(payoutMonth)} (${formatMoney(payoutWindow.estimatedSalaryVnd)})`}
                </button>
              )}
            </div>
            {fixedSalary === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Tài khoản đối tác hiện đang ở chế độ chấm công theo dõi (lương cứng 0 ₫). Khi Quản trị viên cấu hình mức lương cứng, nút rút lương tháng sẽ tự động mở từ ngày 5.
              </p>
            )}
          </div>

          {/* Payroll bank card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary-600" />
                <span>Tài khoản ngân hàng nhận lương cứng</span>
              </h3>
              {data?.bank && !editingBank && (
                <button
                  type="button"
                  onClick={() => setEditingBank(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                </button>
              )}
            </div>

            {data?.bank && !editingBank ? (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" /> {data.bank.bankName}
                </p>
                <p className="font-mono font-bold text-slate-700">{data.bank.accountNumber}</p>
                <p className="text-slate-500 uppercase font-semibold">{data.bank.accountName}</p>
              </div>
            ) : (
              <form onSubmit={saveBank} className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="text-xs font-bold text-slate-600">
                    Ngân hàng *
                    <select
                      value={bank.bankName}
                      onChange={(e) => setBank((prev) => ({ ...prev, bankName: e.target.value }))}
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
                    >
                      {BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Số tài khoản *
                    <input
                      type="text"
                      required
                      value={bank.accountNumber}
                      onChange={(e) => setBank((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="6-20 chữ số"
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-medium text-slate-800"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Tên chủ tài khoản *
                    <input
                      type="text"
                      required
                      value={bank.accountName}
                      onChange={(e) => setBank((prev) => ({ ...prev, accountName: e.target.value }))}
                      placeholder="NGUYEN VAN A"
                      className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase font-medium text-slate-800"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "Đang lưu..." : "Lưu tài khoản ngân hàng"}
                  </button>
                  {editingBank && (
                    <button
                      type="button"
                      onClick={() => {
                        if (data?.bank) setBank(data.bank);
                        setEditingBank(false);
                      }}
                      className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Salary payouts history */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Lịch sử nhận lương cứng</h3>
            {!data?.payouts.length ? (
              <p className="text-xs text-slate-400">Chưa có lệnh rút lương nào.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.payouts.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        Tháng {monthLabel(item.month)} · {formatMoney(item.amountVnd)}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {item.bankName} · {item.accountNumber} · {item.accountName}
                      </p>
                      {item.reviewNote && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Ghi chú: {item.reviewNote}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        item.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {payoutStatusLabel[item.status] || item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily report modal */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo ngày {dateLabel(reportDate)}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reportDate === today
                    ? "Ghi nhận kết quả công việc trong ngày hôm nay."
                    : "Nội dung báo cáo của ngày đã qua (chỉ xem)."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={5}
              readOnly={reportDate !== today}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Ví dụ: Liên hệ 15 tài xế mới, hướng dẫn 5 tài xế hoàn tất eKYC..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-primary-500"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
              {reportDate === today && (
                <button
                  type="button"
                  disabled={busy || reportText.trim().length < 2}
                  onClick={() => void saveReport()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {busy ? "Đang lưu..." : "Lưu báo cáo"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
