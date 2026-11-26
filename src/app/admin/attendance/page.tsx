"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Landmark,
  LogIn,
  LogOut,
  Pencil,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { ADMIN_ROLE_CONFIG, type AdminRole } from "@/config/admin-roles";

const todayInVietnam = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const money = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

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

const roleLabel = (role?: string) => {
  if (role === "affiliate_partner") return "Đối tác";
  return ADMIN_ROLE_CONFIG[role as AdminRole]?.shortLabel || (role ? "Nhân sự" : "Admin");
};

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "VietinBank", "BIDV", "Agribank",
  "VPBank", "ACB", "TPBank", "Sacombank", "VIB", "HDBank", "SeABank", "OCB",
  "Eximbank", "MSB", "SHB", "LPBank", "Nam A Bank", "Bac A Bank",
];

type Tab = "attendance" | "leave" | "account";
const TABS: { id: Tab; label: string }[] = [
  { id: "attendance", label: "Chấm công" },
  { id: "leave", label: "Nghỉ phép" },
  { id: "account", label: "Tài khoản" },
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

const monthLabel = (value?: string) => {
  const [year, month] = String(value || "").split("-");
  return year && month ? `${Number(month)}/${year}` : value || "";
};

const leaveText = (item: { reason?: string; detail?: string }) =>
  [item.reason, item.detail].filter(Boolean).join(" · ");

type AttendanceRecord = {
  id: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  dailyReport?: string;
  dailyReportAt?: string | null;
  dailyReportCreatedAt?: string | null;
  user?: { id?: string; name: string; email: string; adminRole?: string };
};
type LeaveItem = {
  id: string; leaveDate: string; leaveType: "PAID" | "UNPAID"; reason: string; reasonKey?: string; detail?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user?: { id: string; name: string; email: string; adminRole?: string };
};
type BankInfo = { bankName: string; accountNumber: string; accountName: string };
type PayoutItem = {
  id: string; month: string; amountVnd: number; bankName: string; accountNumber: string;
  accountName: string; status: "PENDING" | "PAID" | "REJECTED"; reviewNote?: string;
  user?: { name: string; email: string };
};
type MyAttendance = {
  month: string; today: string; records: AttendanceRecord[]; leaves: LeaveItem[];
  policy: { baseSalaryVnd: number; paidLeaveDaysPerMonth: number };
  summary: { standardDays: number; attendedDays: number; paidLeaveDays: number; payableDays: number; estimatedSalaryVnd: number };
  bank: BankInfo | null; payouts: PayoutItem[];
  payoutWindow?: { month: string; open: boolean; opensOn: string; estimatedSalaryVnd: number };
  profile: { name: string; email: string; phone: string; adminRole: string };
};
type PayrollRow = {
  id: string; name: string; email: string; adminRole: string; attendedDays: number;
  paidLeaveDays: number; standardDays: number; payableDays: number; salaryVnd: number;
  bank: BankInfo | null; payoutStatus: string | null;
};

const PAYROLL_ROLES: AdminRole[] = ["super_admin", "operations", "accountant"];
const payoutLabel: Record<string, string> = { PENDING: "Chờ chuyển", PAID: "Đã chuyển", REJECTED: "Từ chối" };

export default function AdminAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (TABS.some((item) => item.id === searchParams.get("tab")) ? searchParams.get("tab") : "attendance") as Tab;
  const [month, setMonth] = useState(todayInVietnam().slice(0, 7));
  const [mine, setMine] = useState<MyAttendance | null>(null);
  const [payroll, setPayroll] = useState<{ policy: { baseSalaryVnd: number }; payroll: PayrollRow[]; reports?: AttendanceRecord[]; leaves: LeaveItem[]; payouts: PayoutItem[]; salaryPayouts?: PayoutItem[]; payoutWindow?: { month: string; open: boolean; opensOn: string } } | null>(null);
  const [salary, setSalary] = useState(2000000);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReasonKey, setLeaveReasonKey] = useState<(typeof LEAVE_REASONS)[number]["id"]>("family");
  const [leaveCustomReason, setLeaveCustomReason] = useState("");
  const [leaveDetail, setLeaveDetail] = useState("");
  const [bank, setBank] = useState<BankInfo>({ bankName: "Vietcombank", accountNumber: "", accountName: "" });
  const [editingBank, setEditingBank] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("txpro_user_session");
      const session = raw ? JSON.parse(raw) : null;
      setCanManage(PAYROLL_ROLES.includes((session?.adminRole || "super_admin") as AdminRole));
    } catch {
      setCanManage(false);
    }
  }, []);

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "attendance") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/admin/attendance?${query}` : "/admin/attendance", { scroll: false });
  };

  const show = (ok: string, fail = "") => { setNotice(ok); setError(fail); };
  const readError = async (res: Response) => {
    const json = await res.json().catch(() => null);
    return json?.message || "Không thể xử lý yêu cầu.";
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetchWithAuth(`${API_BASE}/admin/attendance/me?month=${month}`);
      if (!meRes.ok) throw new Error(await readError(meRes));
      const meJson = await meRes.json();
      setMine(meJson.data);
      if (meJson.data?.bank) setBank(meJson.data.bank);
      else if (meJson.data?.profile?.name) {
        setBank((prev) => ({ ...prev, accountName: prev.accountName || String(meJson.data.profile.name).toUpperCase() }));
      }
      if (canManage) {
        const adminRes = await fetchWithAuth(`${API_BASE}/admin/attendance/admin?month=${month}`);
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          setPayroll(adminJson.data);
          setSalary(adminJson.data?.policy?.baseSalaryVnd ?? 2000000);
        } else setPayroll(null);
      }
      setError("");
    } catch (e: any) {
      setError(e.message || "Không tải được dữ liệu chấm công.");
    } finally {
      setLoading(false);
    }
  }, [month, canManage]);

  useEffect(() => { void load(); }, [load]);

  const calendar = useMemo(() => {
    const [year, value] = month.split("-").map(Number);
    const days = new Date(year, value, 0).getDate();
    const offset = (new Date(year, value - 1, 1).getDay() + 6) % 7;
    return { offset, dates: Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`) };
  }, [month]);

  const recordMap = new Map((mine?.records || []).map((record) => [record.workDate, record]));
  const today = mine?.today || todayInVietnam();
  const todayRecord = recordMap.get(today);
  const checkedToday = Boolean(todayRecord);
  const checkedOutToday = Boolean(todayRecord?.checkOut);
  const pendingLeaves = ((canManage ? payroll?.leaves : mine?.leaves) || []).filter((item) => item.status === "PENDING").length;
  const payoutWindow = mine?.payoutWindow;
  const payoutMonth = payoutWindow?.month || "";
  const monthPayout = (mine?.payouts || []).find((item) => item.month === payoutMonth);
  const reviewPayouts = payroll?.salaryPayouts || payroll?.payouts || [];

  const act = async (path: string, method: string, body?: object, okMessage?: string) => {
    setChecking(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/attendance${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(await readError(res));
      show(okMessage || "");
      await load();
      return true;
    } catch (e: any) {
      show("", e.message || "Thao tác không thành công.");
      return false;
    } finally {
      setChecking(false);
    }
  };

  const submitLeave = async () => {
    const reason = leaveReasonKey === "other" ? leaveCustomReason.trim() : LEAVE_REASONS.find((item) => item.id === leaveReasonKey)?.label || "";
    if (!leaveDate || reason.length < 2) {
      show("", leaveReasonKey === "other" ? "Chọn ngày nghỉ và nhập lý do khác." : "Chọn ngày nghỉ và lý do.");
      return;
    }
    await act("/leave-requests", "POST", {
      leaveDate,
      reasonKey: leaveReasonKey,
      reason,
      detail: leaveDetail.trim(),
    }, "Đã gửi đơn nghỉ phép.");
    setLeaveCustomReason("");
    setLeaveDetail("");
  };

  const saveBank = async () => {
    if (bank.bankName.length < 2 || !/^[0-9]{6,20}$/.test(bank.accountNumber) || bank.accountName.trim().length < 2) {
      show("", "Nhập ngân hàng, số tài khoản 6-20 số và tên chủ tài khoản.");
      return;
    }
    await act("/bank", "PUT", {
      bankName: bank.bankName,
      accountNumber: bank.accountNumber.replace(/\s+/g, ""),
      accountName: bank.accountName.trim().toUpperCase(),
    }, "Đã lưu tài khoản ngân hàng nhận lương.");
    setEditingBank(false);
  };

  const startEditBank = () => {
    if (mine?.bank) setBank(mine.bank);
    setEditingBank(true);
  };

  const cancelEditBank = () => {
    if (mine?.bank) setBank(mine.bank);
    setEditingBank(false);
  };

  const openReport = (date: string) => {
    const record = recordMap.get(date);
    setReportDate(date);
    setReportText(record?.dailyReport || "");
    setReportOpen(true);
  };

  const saveReport = async () => {
    if (reportDate !== today) {
      show("", "Chỉ được báo cáo trong ngày hôm nay.");
      return;
    }
    if (reportText.trim().length < 2) {
      show("", "Nhập nội dung báo cáo trong ngày.");
      return;
    }
    const ok = await act("/report", "POST", { content: reportText.trim() }, "Đã lưu báo cáo trong ngày.");
    if (ok) setReportOpen(false);
  };

  const inputClass = "mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800";

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-amber-600">
            <CalendarClock className="h-4 w-4" /> CHẤM CÔNG NHÂN SỰ
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Chấm công & lương</h1>
        </div>
        <label className="text-xs font-bold text-slate-500">
          Tháng
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Chấm công">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap ${tab === item.id ? "bg-primary-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            {item.label}
            {item.id === "leave" && pendingLeaves > 0 ? ` (${pendingLeaves})` : ""}
          </button>
        ))}
      </div>

      {(notice || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || notice}
        </div>
      )}

      {tab === "attendance" && (
        <>
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 sm:p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Lịch chấm công</h2>
              <p className="mt-1 text-xs text-slate-400">Mỗi ngày chấm vào một lần. Chấm ra khi kết thúc ca.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={checking || checkedToday}
                onClick={() => void act("/check-in", "POST", {}, "Đã chấm công vào.")}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:bg-emerald-800 disabled:opacity-70"
              >
                {checkedToday ? <CheckCircle2 className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {checkedToday ? "Đã bắt đầu hôm nay" : checking ? "Đang ghi nhận..." : "Bắt đầu làm việc"}
              </button>
              <button
                disabled={checking || !checkedToday || checkedOutToday}
                onClick={() => void act("/check-out", "POST", undefined, "Đã chấm công ra.")}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                {checkedOutToday ? "Đã chấm ra" : "Chấm công ra"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Ngày công", mine?.summary.attendedDays ?? "—"],
              ["Phép có lương", mine?.summary.paidLeaveDays ?? "—"],
              ["Chuẩn tháng", mine?.summary.standardDays ?? "—"],
              ["Lương tạm tính", money(mine?.summary.estimatedSalaryVnd || 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <CalendarCheck className="h-5 w-5 text-emerald-600" /> Lịch công {monthLabel(month)}
                </h2>
                <p className="mt-1 text-xs text-slate-500">Mỗi ô hiển thị giờ vào, giờ ra và báo cáo công việc trong ngày.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">Hôm nay</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Đủ công</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Đang làm</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">Chủ nhật</span>
              </div>
            </div>
            {loading ? (
              <div className="py-16 text-center text-sm text-slate-500">Đang tải lịch...</div>
            ) : (
              <div className="overflow-x-auto p-3 sm:p-4">
                <div className="min-w-[860px]">
                  <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((day) => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: calendar.offset }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[148px] rounded-2xl bg-slate-50/80" />
                    ))}
                    {calendar.dates.map((date) => {
                      const record = recordMap.get(date);
                      const sunday = new Date(`${date}T00:00:00`).getDay() === 0;
                      const isToday = date === today;
                      const isFuture = date > today;
                      const complete = Boolean(record?.checkIn && record?.checkOut);
                      const working = Boolean(record?.checkIn && !record?.checkOut);
                      const leave = (mine?.leaves || []).find((item) => item.leaveDate === date && item.status !== "REJECTED");
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
                        <div key={date} className={`min-h-[148px] rounded-2xl border p-2.5 ${cellClass}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-sm font-bold ${isToday ? "text-sky-700" : sunday ? "text-slate-400" : "text-slate-800"}`}>
                              {Number(date.slice(-2))}
                            </span>
                            {isToday && <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Hôm nay</span>}
                            {sunday && <span className="text-[9px] font-bold uppercase text-slate-400">Off</span>}
                            {leave && !sunday && <span className="text-[9px] font-bold uppercase text-violet-600">{leave.status === "APPROVED" ? "Phép" : "Chờ phép"}</span>}
                          </div>
                          {sunday ? (
                            <div className="mt-6 text-center text-[11px] font-semibold text-slate-400">Nghỉ cố định</div>
                          ) : (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center justify-between rounded-lg bg-white/80 px-1.5 py-1 text-[11px]">
                                <span className="flex items-center gap-1 font-semibold text-slate-400"><LogIn className="h-3 w-3" /> Vào</span>
                                <span className={`font-mono font-bold ${record?.checkIn ? "text-emerald-700" : "text-slate-300"}`}>{timeVn(record?.checkIn)}</span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg bg-white/80 px-1.5 py-1 text-[11px]">
                                <span className="flex items-center gap-1 font-semibold text-slate-400"><LogOut className="h-3 w-3" /> Ra</span>
                                <span className={`font-mono font-bold ${record?.checkOut ? "text-slate-800" : "text-slate-300"}`}>{timeVn(record?.checkOut)}</span>
                              </div>
                              {record?.dailyReport ? (
                                <button
                                  type="button"
                                  onClick={() => openReport(date)}
                                  className="w-full rounded-lg bg-white/90 px-1.5 py-1.5 text-left"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Báo cáo</span>
                                    <span className="font-mono">{timeVn(record.dailyReportAt)}</span>
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-600">{record.dailyReport}</p>
                                </button>
                              ) : isToday ? (
                                <button
                                  type="button"
                                  onClick={() => openReport(date)}
                                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-indigo-200 bg-white/70 px-1.5 py-1.5 text-[10px] font-bold text-indigo-600"
                                >
                                  <ClipboardList className="h-3 w-3" /> Báo cáo ngày
                                </button>
                              ) : isFuture ? null : (
                                <div className="px-1 pt-1 text-center text-[10px] text-slate-400">
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

          {canManage && (
            <>
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="text-xs font-bold text-slate-500">
                  Lương cơ bản toàn hệ thống
                  <input type="number" min={0} value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm" />
                </label>
                <button onClick={() => void act("/policy", "PUT", { baseSalaryVnd: Number(salary) }, "Đã lưu lương cơ bản.")} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                  <Save className="h-4 w-4" /> Lưu chính sách
                </button>
                <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                  <RefreshCw className="h-4 w-4" /> Làm mới
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 font-bold text-slate-900">Bảng công và lương tháng</h2>
                {loading ? <p className="text-sm text-slate-400">Đang tải...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-xs">
                      <thead>
                        <tr className="border-b text-[10px] uppercase text-slate-500">
                          <th className="pb-3">Nhân sự</th>
                          <th className="pb-3">Tài khoản nhận</th>
                          <th className="pb-3 text-right">Ngày công</th>
                          <th className="pb-3 text-right">Phép có lương</th>
                          <th className="pb-3 text-right">Lương tạm tính</th>
                          <th className="pb-3">Rút lương</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(payroll?.payroll || []).map((row) => (
                          <tr key={row.id}>
                            <td className="py-3">
                              <b>{row.name}</b>
                              <div className="text-[10px] text-slate-400">{roleLabel(row.adminRole)} · {row.email}</div>
                            </td>
                            <td className="py-3 text-slate-600">
                              {row.bank ? <>{row.bank.bankName}<div className="font-mono text-[10px]">{row.bank.accountNumber} · {row.bank.accountName}</div></> : <span className="text-slate-400">Chưa thêm</span>}
                            </td>
                            <td className="text-right font-mono">{row.attendedDays}</td>
                            <td className="text-right font-mono">{row.paidLeaveDays}</td>
                            <td className="text-right font-mono font-bold text-emerald-600">{money(row.salaryVnd)}</td>
                            <td>{row.payoutStatus ? payoutLabel[row.payoutStatus] || row.payoutStatus : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-indigo-600" /> Báo cáo công việc tháng
                </h2>
                {(payroll?.reports || []).length === 0 ? (
                  <p className="py-3 text-sm text-slate-400">Chưa có báo cáo ngày trong tháng này.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {payroll?.reports?.map((item) => (
                      <div key={item.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div>
                            <b>{item.user?.name || "Nhân sự"}</b>
                            <span className="ml-2 text-slate-500">{dateLabel(item.workDate)}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                            <span>Vào {timeVn(item.checkIn)}</span>
                            <span>Ra {timeVn(item.checkOut)}</span>
                            <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                              <Clock className="h-3 w-3" /> {timeVn(item.dailyReportAt)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.dailyReport}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === "leave" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="mb-4 font-bold text-slate-900">Xin nghỉ phép</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-500">Ngày nghỉ
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className={inputClass} />
              </label>
              <label className="text-xs font-bold text-slate-500">Lý do
                <select value={leaveReasonKey} onChange={(e) => setLeaveReasonKey(e.target.value as typeof leaveReasonKey)} className={inputClass}>
                  {LEAVE_REASONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              {leaveReasonKey === "other" && (
                <label className="sm:col-span-2 text-xs font-bold text-slate-500">Lý do khác
                  <input value={leaveCustomReason} onChange={(e) => setLeaveCustomReason(e.target.value)} placeholder="Nhập lý do" className={inputClass} />
                </label>
              )}
              <label className="sm:col-span-2 text-xs font-bold text-slate-500">Chi tiết
                <textarea value={leaveDetail} onChange={(e) => setLeaveDetail(e.target.value)} rows={3} placeholder="Ghi chú thêm nếu cần" className={inputClass} />
              </label>
            </div>
            <button disabled={checking} onClick={() => void submitLeave()} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Gửi đơn</button>
            <div className="mt-4 divide-y divide-slate-100">
              {(mine?.leaves || []).length === 0 ? (
                <p className="py-3 text-sm text-slate-400">Chưa có đơn nghỉ trong tháng này.</p>
              ) : mine?.leaves.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <b>{item.leaveDate}</b>
                    <span className="ml-2 text-slate-500">{item.leaveType === "PAID" ? "Có lương" : "Không lương"} · {leaveText(item)}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.status === "APPROVED" ? "text-emerald-600" : item.status === "REJECTED" ? "text-rose-600" : "text-amber-600"}`}>
                    {item.status === "APPROVED" ? "Đã duyệt" : item.status === "REJECTED" ? "Từ chối" : "Chờ duyệt"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {canManage && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold text-slate-900">Duyệt đơn nghỉ phép</h2>
              <div className="divide-y">
                {(payroll?.leaves || []).length === 0 ? (
                  <p className="py-3 text-sm text-slate-400">Không có đơn nghỉ trong tháng này.</p>
                ) : payroll?.leaves.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <b>{item.user?.name || "Nhân sự"}</b> · {item.leaveDate} · {item.leaveType === "PAID" ? "Có lương" : "Không lương"}
                      <div className="text-slate-500">{leaveText(item)}</div>
                    </div>
                    {item.status === "PENDING" ? (
                      <span className="flex gap-2">
                        <button onClick={() => void act(`/leave-requests/${item.id}`, "PATCH", { status: "APPROVED" }, "Đã duyệt đơn.")} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white">Duyệt</button>
                        <button onClick={() => void act(`/leave-requests/${item.id}`, "PATCH", { status: "REJECTED" }, "Đã từ chối đơn.")} className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white">Từ chối</button>
                      </span>
                    ) : (
                      <b className={item.status === "APPROVED" ? "text-emerald-600" : "text-rose-600"}>
                        {item.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                      </b>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "account" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Tài khoản nhận lương</h2>
                <p className="text-xs text-slate-500">Lưu ngân hàng để kế toán chuyển lương hàng tháng.</p>
              </div>
            </div>
            {mine?.bank && !editingBank ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-4">Ngân hàng</th>
                      <th className="pb-2 pr-4">Số tài khoản</th>
                      <th className="pb-2 pr-4">Chủ tài khoản</th>
                      <th className="pb-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="py-3 pr-4 font-semibold text-slate-900">{mine.bank.bankName}</td>
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-800">{mine.bank.accountNumber}</td>
                      <td className="py-3 pr-4 font-semibold uppercase text-slate-800">{mine.bank.accountName}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={startEditBank}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-primary-300 hover:text-primary-700"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-500">Ngân hàng
                    <select value={bank.bankName} onChange={(e) => setBank((prev) => ({ ...prev, bankName: e.target.value }))} className={inputClass}>
                      {BANKS.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-500">Số tài khoản
                    <input value={bank.accountNumber} onChange={(e) => setBank((prev) => ({ ...prev, accountNumber: e.target.value.replace(/[^\d]/g, "").slice(0, 20) }))} placeholder="1012938475" className={`${inputClass} font-mono`} />
                  </label>
                  <label className="sm:col-span-2 text-xs font-bold text-slate-500">Tên chủ tài khoản (in hoa, không dấu)
                    <input value={bank.accountName} onChange={(e) => setBank((prev) => ({ ...prev, accountName: e.target.value.toUpperCase() }))} placeholder="NGUYEN VAN A" className={`${inputClass} uppercase`} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={checking} onClick={() => void saveBank()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">
                    <Save className="h-4 w-4" /> {mine?.bank ? "Cập nhật tài khoản" : "Lưu tài khoản ngân hàng"}
                  </button>
                  {mine?.bank && (
                    <button type="button" onClick={cancelEditBank} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700">
                      <X className="h-4 w-4" /> Hủy
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Rút lương tháng {monthLabel(payoutMonth)}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Lương tháng trước <b>{money(payoutWindow?.estimatedSalaryVnd || 0)}</b>
                  {mine?.bank ? ` · ${mine.bank.bankName} ${mine.bank.accountNumber}` : " · chưa có tài khoản ngân hàng"}
                  {payoutWindow?.open ? "" : ` · mở từ ngày 5`}
                </p>
              </div>
              <button
                disabled={checking || !payoutWindow?.open || !mine?.bank || !payoutWindow?.estimatedSalaryVnd || monthPayout?.status === "PENDING" || monthPayout?.status === "PAID"}
                onClick={() => void act("/salary-payouts", "POST", { month: payoutMonth }, "Đã gửi yêu cầu rút lương tháng trước.")}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {monthPayout?.status === "PAID" ? "Đã chuyển lương" : monthPayout?.status === "PENDING" ? "Đang chờ chuyển" : payoutWindow?.open ? "Gửi yêu cầu rút lương" : "Mở từ ngày 5"}
              </button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {(mine?.payouts || []).length === 0 ? (
                <p className="py-3 text-sm text-slate-400">Chưa có lệnh rút lương.</p>
              ) : mine?.payouts.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <b>{item.month}</b>
                    <span className="ml-2 text-slate-500">{money(item.amountVnd)} · {item.bankName} {item.accountNumber}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.status === "PAID" ? "text-emerald-600" : item.status === "REJECTED" ? "text-rose-600" : "text-amber-600"}`}>
                    {payoutLabel[item.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {canManage && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Building2 className="h-5 w-5 text-emerald-600" /> Lệnh rút lương cần xử lý
              </h2>
              <div className="divide-y">
                {reviewPayouts.length === 0 ? (
                  <p className="py-3 text-sm text-slate-400">Không có lệnh rút lương tháng {monthLabel(payoutMonth)}.</p>
                ) : reviewPayouts.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <b>{item.user?.name || "Nhân sự"}</b> · {item.month} · {money(item.amountVnd)}
                      <div className="text-slate-500">{item.bankName} · {item.accountNumber} · {item.accountName}</div>
                    </div>
                    {item.status === "PENDING" ? (
                      <span className="flex gap-2">
                        <button onClick={() => void act(`/salary-payouts/${item.id}`, "PATCH", { status: "PAID" }, "Đã xác nhận chuyển lương.")} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white">Đã chuyển</button>
                        <button onClick={() => void act(`/salary-payouts/${item.id}`, "PATCH", { status: "REJECTED" }, "Đã từ chối lệnh rút lương.")} className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white">Từ chối</button>
                      </span>
                    ) : (
                      <b className={item.status === "PAID" ? "text-emerald-600" : "text-rose-600"}>{payoutLabel[item.status]}</b>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setReportOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Báo cáo ngày {dateLabel(reportDate)}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {reportDate === today
                    ? "Chỉ được gửi và sửa báo cáo trong ngày hôm nay. Giờ gửi được lưu để quản trị viên kiểm soát."
                    : "Ngày này đã qua, không thể gửi hoặc sửa báo cáo."}
                </p>
              </div>
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {recordMap.get(reportDate)?.dailyReportAt && (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Gửi lúc <b className="font-mono text-slate-800">{timeVn(recordMap.get(reportDate)?.dailyReportAt)}</b>
                {recordMap.get(reportDate)?.dailyReportCreatedAt && recordMap.get(reportDate)?.dailyReportCreatedAt !== recordMap.get(reportDate)?.dailyReportAt
                  ? <> · lần đầu {timeVn(recordMap.get(reportDate)?.dailyReportCreatedAt)}</>
                  : null}
              </div>
            )}
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={6}
              maxLength={2000}
              disabled={reportDate !== today}
              placeholder={checkedToday ? "Công việc đã làm trong ngày..." : "Chấm công vào trước khi gửi báo cáo."}
              className={`${inputClass} min-h-[140px] disabled:bg-slate-50 disabled:text-slate-600`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">Đóng</button>
              {reportDate === today && (
                <button
                  type="button"
                  disabled={checking || !checkedToday || reportText.trim().length < 2}
                  onClick={() => void saveReport()}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {recordMap.get(reportDate)?.dailyReport ? "Cập nhật báo cáo" : "Gửi báo cáo"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
