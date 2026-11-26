"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Gift,
  Handshake,
  Landmark,
  LogIn,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { API_BASE, fetchWithAuth } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";
import {
  affiliateMoney,
  type AffiliatePage,
  type Payout,
  type Reward,
} from "@/utils/affiliate";
import {
  ADMIN_PERMISSION_MODULES,
  type AdminRole,
} from "@/config/admin-roles";
import { readCurrentAdminAccessFromStorage } from "@/utils/admin-access";

export interface StaffDetailTarget {
  kind: "staff";
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  adminRole: string;
  roleLabel: string;
  roleColor?: string;
  roleBadgeClass?: string;
  adminPermissions: string[];
  baseSalaryVnd?: number;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  avatar?: string | null;
}

export interface PartnerDetailTarget {
  kind: "partner";
  partnerId: string;
  userId?: string | null;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  accountRole?: string | null;
  status: string;
  suspensionReason?: string;
  termsVersion?: string;
  acceptedAt?: string | null;
  attendanceEnabled: boolean;
  baseSalaryVnd: number;
  totalEarned: number;
  balance: number;
  reservedAmount: number;
  paidAmount: number;
  stats?: {
    registered: number;
    qualified: number;
    drivers: number;
    shippers: number;
    qualifiedDrivers: number;
    qualifiedShippers: number;
  };
}

export type MemberDetailTarget = StaffDetailTarget | PartnerDetailTarget;

interface AttendanceRecordItem {
  id: string;
  userId: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  note?: string;
  dailyReport?: string;
  dailyReportAt?: string | null;
  dailyReportCreatedAt?: string | null;
}

interface LeaveRequestItem {
  id: string;
  leaveDate: string;
  leaveType: "PAID" | "UNPAID";
  reason: string;
  reasonKey?: string;
  detail?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string;
  reviewedAt?: string | null;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface SalaryPayoutItem {
  id: string;
  month: string;
  amountVnd: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "PENDING" | "PAID" | "REJECTED";
  reviewNote?: string;
  reviewedAt?: string | null;
  createdAt?: string | null;
}

interface StaffAttendanceSnapshot {
  month: string;
  today: string;
  memberType: "staff" | "partner";
  hasAttendancePermission: boolean;
  baseSalaryVnd: number;
  records: AttendanceRecordItem[];
  leaves: LeaveRequestItem[];
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
  payoutWindow?: {
    month: string;
    open: boolean;
    opensOn: string;
    estimatedSalaryVnd: number;
  };
  partner?: {
    id: string;
    code: string;
    status: string;
    attendanceEnabled: boolean;
    baseSalaryVnd: number;
  } | null;
  staffMeta?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    adminRole: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string | null;
    avatar: string | null;
  };
}

interface AffiliatePartnerDetailResponse {
  partner: {
    _id: string;
    code: string;
    status: string;
    termsVersion: string;
    acceptedAt: string;
    suspensionReason?: string;
    attendanceEnabled?: boolean;
    baseSalaryVnd?: number;
    totalEarned: number;
    balance: number;
    reservedAmount: number;
    paidAmount: number;
    userId?: { name?: string; phone?: string; email?: string; role?: string } | null;
  };
  stats: {
    registered: number;
    qualified: number;
    pending: number;
    drivers: number;
    shippers: number;
    qualifiedDrivers: number;
    qualifiedShippers: number;
  };
  rewards: Array<{ kind: string; count: number; amount: number }>;
  monthlyRegistrations: Array<{ month: string; count: number }>;
  milestoneRewards: Array<{ threshold: number; amount: number; createdAt: string }>;
  payouts: Array<{ status: string; count: number; amount: number }>;
}

interface AffiliateReferralRow {
  _id: string;
  role: string;
  registeredAt: string;
  qualifiedAt?: string | null;
  rewardAmount: number;
  policyVersion?: string;
  userId?: { name?: string; phone?: string } | null;
}

interface TeamMemberDetailDrawerProps {
  target: MemberDetailTarget | null;
  onClose: () => void;
  onToast?: (success: boolean, message: string) => void;
  onEditStaffRole?: () => void;
  onConfigurePartnerAttendance?: () => void;
  canManagePartnerAttendance?: boolean;
  canOpenAffiliatesPage?: boolean;
  refreshToken?: number;
}

type DrawerTab = "overview" | "attendance" | "payroll" | "affiliate";
type AffiliateRecordSubTab = "referrals" | "rewards" | "payouts";

const PAYROLL_MANAGER_ROLES: AdminRole[] = ["super_admin", "operations", "accountant"];

const todayInVietnam = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const money = (value?: number | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const timeVn = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const dateLabel = (value?: string | null) => {
  const [year, month, day] = String(value || "").split("-");
  return year && month && day ? `${Number(day)}/${Number(month)}/${year}` : value || "—";
};

const dateTimeLabel = (value?: string | null) => {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const monthLabel = (value?: string) => {
  const [year, month] = String(value || "").split("-");
  return year && month ? `Tháng ${Number(month)}/${year}` : value || "";
};

const leaveText = (item: { reason?: string; detail?: string }) =>
  [item.reason, item.detail].filter(Boolean).join(" · ");

const PAYOUT_STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ chuyển", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Đã chuyển", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  pending: { label: "Chờ đối soát", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const LEAVE_STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const ACCOUNT_ROLE_LABELS: Record<string, string> = {
  "doi-tac": "Đối tác hệ thống",
  "tai-xe": "Tài xế",
  "chu-hang": "Chủ hàng",
};

function DrawerAvatar({ avatar, name }: { avatar?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  const rawUrl = avatar ? getServerMediaUrl(avatar) || avatar : null;
  const initials = useMemo(() => {
    const clean = (name || "").trim();
    if (!clean) return "TV";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [name]);

  if (rawUrl && !imgError) {
    return (
      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/15 ring-2 ring-white/25 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rawUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-white/15 ring-2 ring-white/25 text-white flex items-center justify-center font-bold text-base flex-shrink-0 select-none">
      {initials}
    </div>
  );
}

export default function TeamMemberDetailDrawer({
  target,
  onClose,
  onToast,
  onEditStaffRole,
  onConfigurePartnerAttendance,
  canManagePartnerAttendance = false,
  canOpenAffiliatesPage = false,
  refreshToken = 0,
}: TeamMemberDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [month, setMonth] = useState<string>(() => todayInVietnam().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [attendanceState, setAttendanceState] = useState<{
    key: string;
    data: StaffAttendanceSnapshot | null;
    error: string;
  }>({ key: "", data: null, error: "" });

  const [partnerDetailState, setPartnerDetailState] = useState<{
    key: string;
    data: AffiliatePartnerDetailResponse | null;
    error: string;
  }>({ key: "", data: null, error: "" });

  const [affiliateSubTab, setAffiliateSubTab] = useState<AffiliateRecordSubTab>("referrals");
  const [affiliatePage, setAffiliatePage] = useState(1);
  const [affiliateRecordsState, setAffiliateRecordsState] = useState<{
    key: string;
    data: AffiliatePage<AffiliateReferralRow | Reward | Payout> | null;
    error: string;
  }>({ key: "", data: null, error: "" });

  const canReviewPayroll = useMemo(() => {
    const access = readCurrentAdminAccessFromStorage();
    return PAYROLL_MANAGER_ROLES.includes((access.adminRole || "") as AdminRole);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!target) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target, onClose]);

  // Fetch per-member attendance snapshot
  const attendanceUserId = target?.userId || "";
  const attendanceRequestKey = attendanceUserId
    ? `${attendanceUserId}|${month}|${localRefresh}|${refreshToken}`
    : "";

  useEffect(() => {
    if (!attendanceRequestKey || !attendanceUserId) return;
    let active = true;

    const loadAttendance = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE}/admin/attendance/staff/${attendanceUserId}?month=${encodeURIComponent(month)}`
        );
        const json = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          throw new Error(json?.message || "Không tải được lịch chấm công của thành viên này.");
        }
        setAttendanceState({
          key: attendanceRequestKey,
          data: (json?.data as StaffAttendanceSnapshot) || null,
          error: "",
        });
      } catch (err: unknown) {
        if (!active) return;
        setAttendanceState({
          key: attendanceRequestKey,
          data: null,
          error: err instanceof Error ? err.message : "Không tải được dữ liệu chấm công.",
        });
      }
    };

    void loadAttendance();
    return () => {
      active = false;
    };
  }, [attendanceRequestKey, attendanceUserId, month]);

  // Fetch affiliate partner full stats
  const partnerId = target?.kind === "partner" ? target.partnerId : "";
  const partnerDetailKey = partnerId ? `${partnerId}|${localRefresh}|${refreshToken}` : "";

  useEffect(() => {
    if (!partnerDetailKey || !partnerId) return;
    let active = true;

    const loadPartnerDetail = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/admin/affiliates/partners/${partnerId}`);
        const json = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          throw new Error(json?.message || "Không tải được thống kê chi tiết đối tác.");
        }
        setPartnerDetailState({
          key: partnerDetailKey,
          data: (json?.data as AffiliatePartnerDetailResponse) || null,
          error: "",
        });
      } catch (err: unknown) {
        if (!active) return;
        setPartnerDetailState({
          key: partnerDetailKey,
          data: null,
          error: err instanceof Error ? err.message : "Lỗi tải chi tiết đối tác.",
        });
      }
    };

    void loadPartnerDetail();
    return () => {
      active = false;
    };
  }, [partnerDetailKey, partnerId]);

  // Fetch paginated affiliate records lazily when Affiliate tab is open
  const affiliateRecordsKey =
    partnerId && activeTab === "affiliate"
      ? `${partnerId}|${affiliateSubTab}|${affiliatePage}|${localRefresh}|${refreshToken}`
      : "";

  useEffect(() => {
    if (!affiliateRecordsKey || !partnerId) return;
    let active = true;

    const loadRecords = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE}/admin/affiliates/partners/${partnerId}/${affiliateSubTab}?page=${affiliatePage}&limit=10`
        );
        const json = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          throw new Error(json?.message || "Không tải được dữ liệu đối tác.");
        }
        setAffiliateRecordsState({
          key: affiliateRecordsKey,
          data: (json?.data as AffiliatePage<AffiliateReferralRow | Reward | Payout>) || null,
          error: "",
        });
      } catch (err: unknown) {
        if (!active) return;
        setAffiliateRecordsState({
          key: affiliateRecordsKey,
          data: null,
          error: err instanceof Error ? err.message : "Lỗi tải danh sách dữ liệu.",
        });
      }
    };

    void loadRecords();
    return () => {
      active = false;
    };
  }, [affiliateRecordsKey, partnerId, affiliateSubTab, affiliatePage]);

  const calendar = useMemo(() => {
    const [year, m] = month.split("-").map(Number);
    const days = new Date(year, m, 0).getDate();
    const offset = (new Date(year, m - 1, 1).getDay() + 6) % 7;
    return {
      offset,
      dates: Array.from(
        { length: days },
        (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`
      ),
    };
  }, [month]);

  if (!target) return null;

  const attendanceLoading = Boolean(attendanceRequestKey) && attendanceState.key !== attendanceRequestKey;
  const attendance = attendanceState.key === attendanceRequestKey ? attendanceState.data : null;
  const attendanceError = attendanceState.key === attendanceRequestKey ? attendanceState.error : "";

  const partnerDetailLoading = Boolean(partnerDetailKey) && partnerDetailState.key !== partnerDetailKey;
  const partnerDetail = partnerDetailState.key === partnerDetailKey ? partnerDetailState.data : null;
  const partnerDetailError = partnerDetailState.key === partnerDetailKey ? partnerDetailState.error : "";

  const affiliateRecordsLoading =
    Boolean(affiliateRecordsKey) && affiliateRecordsState.key !== affiliateRecordsKey;
  const affiliateRecords =
    affiliateRecordsState.key === affiliateRecordsKey ? affiliateRecordsState.data : null;
  const affiliateRecordsError =
    affiliateRecordsState.key === affiliateRecordsKey ? affiliateRecordsState.error : "";

  const recordMap = new Map((attendance?.records || []).map((r) => [r.workDate, r]));
  const leaveByDate = new Map(
    (attendance?.leaves || [])
      .filter((l) => l.status !== "REJECTED")
      .map((l) => [l.leaveDate, l])
  );
  const today = attendance?.today || todayInVietnam();
  const reportsList = (attendance?.records || []).filter((r) => Boolean(r.dailyReport));
  const pendingLeavesCount = (attendance?.leaves || []).filter((l) => l.status === "PENDING").length;
  const pendingPayoutsCount = (attendance?.payouts || []).filter((p) => p.status === "PENDING").length;

  const isStaff = target.kind === "staff";
  const effectiveAttendanceEnabled = isStaff
    ? true
    : attendance?.hasAttendancePermission ?? target.attendanceEnabled;
  const effectiveBaseSalary =
    attendance?.baseSalaryVnd ?? target.baseSalaryVnd ?? 0;

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onToast?.(true, `Đã sao chép ${label}`);
    } catch {
      onToast?.(false, "Không thể sao chép tự động.");
    }
  };

  const handleReviewLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setReviewingId(leaveId);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/attendance/leave-requests/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Không thể cập nhật đơn nghỉ phép.");
      onToast?.(true, status === "APPROVED" ? "Đã duyệt đơn nghỉ phép." : "Đã từ chối đơn nghỉ phép.");
      setLocalRefresh((v) => v + 1);
    } catch (err: unknown) {
      onToast?.(false, err instanceof Error ? err.message : "Lỗi xử lý đơn nghỉ phép.");
    } finally {
      setReviewingId(null);
    }
  };

  const handleReviewSalaryPayout = async (payoutId: string, status: "PAID" | "REJECTED") => {
    setReviewingId(payoutId);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/attendance/salary-payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Không thể cập nhật lệnh rút lương.");
      onToast?.(
        true,
        status === "PAID" ? "Đã xác nhận chuyển lương." : "Đã từ chối lệnh rút lương."
      );
      setLocalRefresh((v) => v + 1);
    } catch (err: unknown) {
      onToast?.(false, err instanceof Error ? err.message : "Lỗi xử lý lệnh rút lương.");
    } finally {
      setReviewingId(null);
    }
  };

  const drawerTabs: Array<{ id: DrawerTab; label: string; badge?: string | number }> = isStaff
    ? [
        { id: "overview", label: "Tổng quan & Quyền" },
        {
          id: "attendance",
          label: "Lịch chấm công",
          badge: attendance ? `${attendance.summary.attendedDays}/${attendance.summary.standardDays}` : undefined,
        },
        {
          id: "payroll",
          label: "Nghỉ phép & Lương",
          badge: pendingLeavesCount + pendingPayoutsCount > 0 ? pendingLeavesCount + pendingPayoutsCount : undefined,
        },
      ]
    : [
        { id: "overview", label: "Tổng quan đối tác" },
        {
          id: "attendance",
          label: "Lịch chấm công",
          badge: effectiveAttendanceEnabled
            ? attendance
              ? `${attendance.summary.attendedDays}/${attendance.summary.standardDays}`
              : "Bật"
            : "Tắt",
        },
        {
          id: "payroll",
          label: "Nghỉ phép & Lương cứng",
          badge: pendingLeavesCount + pendingPayoutsCount > 0 ? pendingLeavesCount + pendingPayoutsCount : undefined,
        },
        { id: "affiliate", label: "Thành viên & Hoa hồng" },
      ];

  const selectedDayRecord = selectedDay ? recordMap.get(selectedDay) || null : null;
  const selectedDayLeave = selectedDay ? leaveByDate.get(selectedDay) || null : null;

  const memberDisplayRole = isStaff
    ? target.adminRole === "super_admin"
      ? "Super Admin"
      : target.roleLabel
    : ACCOUNT_ROLE_LABELS[target.accountRole || ""] || "Đối tác Affiliate";

  const isMemberActive = isStaff ? target.isActive : target.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết ${target.name}`}
    >
      <div
        className="relative flex h-full w-full max-w-4xl flex-col bg-slate-50 shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-br from-[#0b1f3a] via-[#113163] to-[#136dec] text-white px-5 sm:px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <DrawerAvatar
                avatar={isStaff ? target.avatar : attendance?.staffMeta?.avatar}
                name={target.name}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white truncate">
                    {target.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {isStaff ? <ShieldCheck className="w-3 h-3" /> : <Handshake className="w-3 h-3" />}
                    {memberDisplayRole}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                      isMemberActive
                        ? "bg-emerald-500/20 text-emerald-100 border-emerald-300/30"
                        : "bg-rose-500/25 text-rose-100 border-rose-300/40"
                    }`}
                  >
                    {isMemberActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {isMemberActive ? "Hoạt động" : isStaff ? "Đã khóa" : "Tạm ngưng"}
                  </span>
                  {!isStaff && (
                    <button
                      type="button"
                      onClick={() => void handleCopy(target.code, `mã ${target.code}`)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-200/40 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-100 transition-colors cursor-pointer"
                      title="Sao chép mã giới thiệu"
                    >
                      <span>{target.code}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100/90 mt-1.5">
                  {target.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-200" />
                      {target.email}
                    </span>
                  )}
                  {target.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-200" />
                      {target.phone}
                    </span>
                  )}
                  {isStaff && target.lastLoginAt && (
                    <span className="inline-flex items-center gap-1.5 text-sky-200/90">
                      <Clock className="w-3.5 h-3.5" />
                      Đăng nhập cuối: {dateTimeLabel(target.lastLoginAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isStaff && onEditStaffRole && (
                <button
                  type="button"
                  onClick={onEditStaffRole}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Phân quyền &amp; lương</span>
                </button>
              )}
              {!isStaff && canManagePartnerAttendance && onConfigurePartnerAttendance && (
                <button
                  type="button"
                  onClick={onConfigurePartnerAttendance}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Chấm công / Lương</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Đóng cửa sổ chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-0.5">
            {drawerTabs.map((tabItem) => {
              const active = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-sky-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{tabItem.label}</span>
                  {tabItem.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-primary-100 text-primary-700"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {isStaff ? (
                <>
                  {/* Staff KPI Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Lương cứng / tháng</span>
                        <Banknote className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-900 mt-1.5 font-mono">
                        {money(effectiveBaseSalary)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Cấu hình riêng cho nhân sự</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Ngày công ({month.slice(5)}/{month.slice(0, 4)})</span>
                        <CalendarCheck className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-900 mt-1.5">
                        {attendanceLoading
                          ? "..."
                          : attendance
                            ? `${attendance.summary.attendedDays} / ${attendance.summary.standardDays} ngày`
                            : "—"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {attendance ? `${attendance.summary.paidLeaveDays} ngày phép có lương` : "Đang đồng bộ"}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Lương tạm tính</span>
                        <Wallet className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-lg font-bold text-emerald-700 mt-1.5 font-mono">
                        {attendanceLoading ? "..." : money(attendance?.summary.estimatedSalaryVnd || 0)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("attendance")}
                        className="text-[11px] font-bold text-primary-600 hover:underline mt-0.5 cursor-pointer"
                      >
                        Xem lịch chấm công →
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Tài khoản nhận lương</span>
                        <Landmark className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                        {attendance?.bank?.bankName || "Chưa cập nhật"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {attendance?.bank?.accountNumber || "Nhân sự tự lưu ở mục Chấm công"}
                      </p>
                    </div>
                  </div>

                  {/* Staff Profile Info */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Thông tin tài khoản nhân sự</h3>
                      {onEditStaffRole && (
                        <button
                          type="button"
                          onClick={onEditStaffRole}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa vai trò / lương
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Họ và tên</span>
                        <p className="font-bold text-slate-900 mt-0.5">{target.name}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Cấp bậc</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {target.adminRole === "super_admin" ? "Super Admin (Toàn quyền)" : `${target.roleLabel} (${target.adminRole})`}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Email nội bộ</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{target.email || "—"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Số điện thoại</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{target.phone || "—"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Ngày tham gia</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{dateTimeLabel(target.createdAt)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Đăng nhập gần nhất</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {target.lastLoginAt ? dateTimeLabel(target.lastLoginAt) : "Chưa đăng nhập"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Staff Permissions Matrix */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-primary-600" />
                          Phân hệ quản trị được cấp phép
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Các trang và nhóm chức năng nhân sự này được phép truy cập trên /admin.
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                        {target.adminRole === "super_admin" || target.adminPermissions.includes("*")
                          ? "Toàn quyền (*)"
                          : `${target.adminPermissions.length} phân hệ`}
                      </span>
                    </div>

                    {target.adminRole === "super_admin" || target.adminPermissions.includes("*") ? (
                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900">
                        Tài khoản Super Admin sở hữu toàn bộ quyền truy cập và cấu hình trên hệ thống TXE Pro.
                      </div>
                    ) : target.adminPermissions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Chưa được cấp phân hệ nào.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {target.adminPermissions.map((path) => {
                          const mod = ADMIN_PERMISSION_MODULES.find((m) => m.path === path);
                          return (
                            <div
                              key={path}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {mod?.name || path}
                                </p>
                                <code className="text-[10px] text-slate-400 font-mono">{path}</code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* PARTNER OVERVIEW */
                <>
                  {partnerDetailError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                      {partnerDetailError}
                    </div>
                  )}

                  {/* Partner KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Thành viên</span>
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-900 mt-1.5">
                        {(partnerDetail?.stats.registered ?? target.stats?.registered ?? 0).toLocaleString("vi-VN")}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {partnerDetail?.stats.drivers ?? target.stats?.drivers ?? 0} tài xế ·{" "}
                        {partnerDetail?.stats.shippers ?? target.stats?.shippers ?? 0} chủ hàng
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Đủ điều kiện</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-lg font-bold text-emerald-700 mt-1.5">
                        {(partnerDetail?.stats.qualified ?? target.stats?.qualified ?? 0).toLocaleString("vi-VN")}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {partnerDetail?.stats.pending ??
                          Math.max(
                            0,
                            (target.stats?.registered ?? 0) - (target.stats?.qualified ?? 0)
                          )}{" "}
                        đang chờ đủ điều kiện
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Tổng hoa hồng</span>
                        <Gift className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-lg font-bold text-slate-900 mt-1.5 font-mono">
                        {affiliateMoney(partnerDetail?.partner.totalEarned ?? target.totalEarned)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Đã trả: {affiliateMoney(partnerDetail?.partner.paidAmount ?? target.paidAmount)}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Số dư khả dụng</span>
                        <Wallet className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-amber-700 mt-1.5 font-mono">
                        {affiliateMoney(partnerDetail?.partner.balance ?? target.balance)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chờ chi: {affiliateMoney(partnerDetail?.partner.reservedAmount ?? target.reservedAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Partner Attendance & Fixed Salary Summary Banner */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          effectiveAttendanceEnabled
                            ? "bg-sky-50 text-sky-600 border border-sky-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        <CalendarClock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Chấm công &amp; Lương cứng
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              effectiveAttendanceEnabled
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {effectiveAttendanceEnabled ? "Đang bật trên /doi-tac" : "Chưa bật"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Lương cứng:{" "}
                          <strong className="font-mono text-slate-900">
                            {effectiveBaseSalary > 0
                              ? `${money(effectiveBaseSalary)} / tháng`
                              : "0 ₫ (Chỉ hoa hồng)"}
                          </strong>
                          {effectiveAttendanceEnabled && attendance && (
                            <>
                              {" "}
                              · Tháng này: <strong>{attendance.summary.attendedDays}</strong> ngày công · Tạm tính{" "}
                              <strong className="text-emerald-700 font-mono">
                                {money(attendance.summary.estimatedSalaryVnd)}
                              </strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab("attendance")}
                        className="px-3 py-1.5 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Xem lịch công
                      </button>
                      {canManagePartnerAttendance && onConfigurePartnerAttendance && (
                        <button
                          type="button"
                          onClick={onConfigurePartnerAttendance}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cấu hình
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Growth Chart + Reward Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-900">Tăng trưởng thành viên (6 tháng)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Số lượt đăng ký mới qua mã {target.code}
                      </p>
                      {partnerDetailLoading ? (
                        <div className="py-10 text-center text-xs text-slate-400">Đang tải biểu đồ...</div>
                      ) : partnerDetail?.monthlyRegistrations ? (
                        <div className="mt-4 flex items-end gap-2 h-36 pt-4">
                          {(() => {
                            const maxVal = Math.max(
                              1,
                              ...partnerDetail.monthlyRegistrations.map((r) => r.count)
                            );
                            return partnerDetail.monthlyRegistrations.map((row) => (
                              <div
                                key={row.month}
                                className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
                              >
                                <span className="text-[11px] font-bold text-slate-700">
                                  {row.count}
                                </span>
                                <div className="w-full max-w-[34px] flex-1 flex items-end">
                                  <div
                                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-sky-400 transition-all min-h-[4px]"
                                    style={{
                                      height: `${Math.max(6, Math.round((row.count / maxVal) * 100))}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {row.month.slice(5)}/{row.month.slice(2, 4)}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-xs text-slate-400">Không có dữ liệu biểu đồ.</p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Cơ cấu hoa hồng &amp; Hồ sơ</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Chính sách: <strong>{partnerDetail?.partner.termsVersion || target.termsVersion || "—"}</strong>
                          {partnerDetail?.partner.acceptedAt && (
                            <> · Tham gia {dateTimeLabel(partnerDetail.partner.acceptedAt)}</>
                          )}
                        </p>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {(partnerDetail?.rewards || []).map((row) => (
                          <div key={row.kind} className="py-2.5 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {row.kind === "driver"
                                  ? "Giới thiệu tài xế"
                                  : row.kind === "shipper"
                                    ? "Giới thiệu chủ hàng"
                                    : "Thưởng mốc thành viên"}
                              </p>
                              <p className="text-[11px] text-slate-400">{row.count} khoản thưởng</p>
                            </div>
                            <strong className="font-mono text-slate-900">{affiliateMoney(row.amount)}</strong>
                          </div>
                        ))}
                        {target.suspensionReason && target.status !== "active" && (
                          <div className="pt-2.5 text-rose-600 text-[11px] font-semibold">
                            Lý do tạm ngưng: {target.suspensionReason}
                          </div>
                        )}
                      </div>
                      {canOpenAffiliatesPage && (
                        <Link
                          href="/admin/affiliates"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline pt-1"
                        >
                          <span>Mở trang Quản lý Đối tác đầy đủ</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: ATTENDANCE CALENDAR & DAILY REPORTS */}
          {activeTab === "attendance" && (
            <>
              {/* Top Month Picker & Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    Lịch chấm công {monthLabel(month)}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Nhấp vào từng ngày có dữ liệu để xem chi tiết giờ vào/ra, ghi chú và báo cáo công việc.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value);
                      setSelectedDay(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalRefresh((v) => v + 1)}
                    disabled={attendanceLoading}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-50"
                    title="Làm mới dữ liệu chấm công"
                  >
                    <RefreshCw className={`w-4 h-4 ${attendanceLoading ? "animate-spin text-primary-600" : ""}`} />
                  </button>
                </div>
              </div>

              {!isStaff && !effectiveAttendanceEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Đối tác này hiện chưa bật quyền chấm công</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Bật quyền chấm công để đối tác có thể chấm công vào/ra và gửi báo cáo ngày tại trang /doi-tac. Các dữ liệu lịch sử (nếu từng có) vẫn được hiển thị bên dưới.
                      </p>
                    </div>
                  </div>
                  {canManagePartnerAttendance && onConfigurePartnerAttendance && (
                    <button
                      type="button"
                      onClick={onConfigurePartnerAttendance}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Bật chấm công &amp; lương
                    </button>
                  )}
                </div>
              )}

              {attendanceError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  {attendanceError}
                </div>
              ) : attendanceLoading && !attendance ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 py-14 text-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                  Đang tải lịch chấm công {monthLabel(month)}...
                </div>
              ) : attendance ? (
                <>
                  {/* 4 Attendance KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Ngày công</span>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {attendance.summary.attendedDays}
                        <span className="text-xs font-medium text-slate-400">
                          {" "}
                          / {attendance.summary.standardDays}
                        </span>
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Phép có lương</span>
                      <p className="text-lg font-bold text-violet-700 mt-1">
                        {attendance.summary.paidLeaveDays} ngày
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Lương cứng</span>
                      <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
                        {money(attendance.baseSalaryVnd)}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Lương tạm tính</span>
                      <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                        {money(attendance.summary.estimatedSalaryVnd)}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Calendar Grid */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Bảng lịch chấm công chi tiết
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">Hôm nay</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Đủ công</span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Chưa chấm ra</span>
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">Nghỉ phép</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Chủ nhật</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto p-3">
                      <div className="min-w-[660px]">
                        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                            <div key={day} className="py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {Array.from({ length: calendar.offset }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[96px] rounded-xl bg-slate-50/70" />
                          ))}
                          {calendar.dates.map((date) => {
                            const record = recordMap.get(date);
                            const leave = leaveByDate.get(date);
                            const sunday = new Date(`${date}T00:00:00`).getDay() === 0;
                            const isToday = date === today;
                            const complete = Boolean(record?.checkIn && record?.checkOut);
                            const working = Boolean(record?.checkIn && !record?.checkOut);
                            const hasDetails = Boolean(record || leave);
                            const isSelected = selectedDay === date;

                            const cellClass = sunday
                              ? "border-slate-200/70 bg-slate-50"
                              : isToday
                                ? "border-sky-300 bg-sky-50/90"
                                : complete
                                  ? "border-emerald-200 bg-emerald-50/70"
                                  : working
                                    ? "border-amber-200 bg-amber-50/80"
                                    : leave
                                      ? "border-violet-200 bg-violet-50/70"
                                      : "border-slate-200/80 bg-white";

                            return (
                              <button
                                key={date}
                                type="button"
                                disabled={!hasDetails}
                                onClick={() => setSelectedDay(isSelected ? null : date)}
                                className={`min-h-[96px] rounded-xl border p-2 text-left transition-all flex flex-col justify-between ${cellClass} ${
                                  hasDetails
                                    ? "cursor-pointer hover:shadow-xs hover:border-primary-300"
                                    : "cursor-default"
                                } ${isSelected ? "ring-2 ring-primary-500 border-primary-500" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span
                                    className={`text-xs font-bold ${
                                      isToday
                                        ? "text-sky-700"
                                        : sunday
                                          ? "text-slate-400"
                                          : "text-slate-800"
                                    }`}
                                  >
                                    {Number(date.slice(-2))}
                                  </span>
                                  {isToday && (
                                    <span className="rounded-full bg-sky-600 px-1.5 py-0.2 text-[8px] font-bold uppercase text-white">
                                      Nay
                                    </span>
                                  )}
                                  {sunday && (
                                    <span className="text-[9px] font-bold text-slate-400">Off</span>
                                  )}
                                  {leave && !sunday && (
                                    <span className="rounded bg-violet-100 px-1 text-[8px] font-bold uppercase text-violet-700">
                                      {leave.status === "APPROVED" ? "Phép" : "Chờ"}
                                    </span>
                                  )}
                                </div>

                                {sunday ? (
                                  <span className="text-[10px] text-slate-400 text-center pb-2">
                                    Nghỉ CN
                                  </span>
                                ) : record ? (
                                  <div className="space-y-1 mt-1">
                                    <div className="flex items-center justify-between text-[10px] bg-white/80 rounded px-1 py-0.5">
                                      <LogIn className="w-2.5 h-2.5 text-emerald-600" />
                                      <span className="font-mono font-bold text-emerald-700">
                                        {timeVn(record.checkIn)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] bg-white/80 rounded px-1 py-0.5">
                                      <LogOut className="w-2.5 h-2.5 text-slate-500" />
                                      <span
                                        className={`font-mono font-bold ${
                                          record.checkOut ? "text-slate-800" : "text-slate-300"
                                        }`}
                                      >
                                        {timeVn(record.checkOut)}
                                      </span>
                                    </div>
                                    {record.dailyReport && (
                                      <div className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 w-full justify-center">
                                        <FileText className="w-2.5 h-2.5" />
                                        <span>Báo cáo</span>
                                      </div>
                                    )}
                                  </div>
                                ) : leave ? (
                                  <div className="text-[10px] text-violet-700 font-semibold line-clamp-2 mt-1">
                                    {leave.reason}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-300 text-center pb-2">
                                    {date <= today ? "—" : ""}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Selected Day Expanded Detail Panel */}
                    {selectedDay && (selectedDayRecord || selectedDayLeave) && (
                      <div className="border-t border-slate-100 bg-primary-50/40 px-4 py-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Chi tiết ngày {dateLabel(selectedDay)}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setSelectedDay(null)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {selectedDayRecord && (
                          <div className="space-y-2 text-xs">
                            <div className="flex flex-wrap items-center gap-4 text-slate-700">
                              <span>
                                Giờ vào:{" "}
                                <strong className="font-mono text-emerald-700">
                                  {timeVn(selectedDayRecord.checkIn)}
                                </strong>
                              </span>
                              <span>
                                Giờ ra:{" "}
                                <strong className="font-mono text-slate-900">
                                  {timeVn(selectedDayRecord.checkOut)}
                                </strong>
                              </span>
                              {selectedDayRecord.dailyReportAt && (
                                <span>
                                  Gửi báo cáo:{" "}
                                  <strong className="font-mono text-indigo-700">
                                    {timeVn(selectedDayRecord.dailyReportAt)}
                                  </strong>
                                </span>
                              )}
                            </div>
                            {selectedDayRecord.note && (
                              <p className="text-slate-600">
                                <strong>Ghi chú chấm công:</strong> {selectedDayRecord.note}
                              </p>
                            )}
                            {selectedDayRecord.dailyReport ? (
                              <div className="rounded-xl bg-white border border-slate-200/80 p-3">
                                <p className="text-[10px] font-bold uppercase text-indigo-600 mb-1">
                                  Báo cáo công việc ngày {dateLabel(selectedDay)}
                                </p>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {selectedDayRecord.dailyReport}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">
                                Chưa gửi báo cáo công việc cho ngày này.
                              </p>
                            )}
                          </div>
                        )}
                        {selectedDayLeave && (
                          <div className="rounded-xl bg-white border border-violet-200 p-3 text-xs">
                            <p className="font-bold text-violet-800">
                              Đơn nghỉ phép ({selectedDayLeave.leaveType === "PAID" ? "Có lương" : "Không lương"}) ·{" "}
                              {LEAVE_STATUS_META[selectedDayLeave.status]?.label || selectedDayLeave.status}
                            </p>
                            <p className="text-slate-600 mt-0.5">{leaveText(selectedDayLeave)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Daily Reports List for Selected Month */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Báo cáo công việc trong {monthLabel(month).toLowerCase()} ({reportsList.length})
                    </h4>
                    {reportsList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">
                        Chưa có báo cáo công việc nào trong tháng này.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {reportsList.map((item) => (
                          <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <strong className="text-slate-900">{dateLabel(item.workDate)}</strong>
                              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                                <span>Vào {timeVn(item.checkIn)}</span>
                                <span>Ra {timeVn(item.checkOut)}</span>
                                <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                                  <Clock className="w-3 h-3" />
                                  {timeVn(item.dailyReportAt)}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                              {item.dailyReport}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* TAB 3: LEAVES, PAYROLL BANK & SALARY PAYOUTS */}
          {activeTab === "payroll" && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Nghỉ phép &amp; Thanh toán lương ({monthLabel(month)})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lương cứng:{" "}
                    <strong className="font-mono text-slate-800">{money(effectiveBaseSalary)}</strong>
                    {attendance && (
                      <>
                        {" "}
                        · Tạm tính tháng này:{" "}
                        <strong className="font-mono text-emerald-700">
                          {money(attendance.summary.estimatedSalaryVnd)}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalRefresh((v) => v + 1)}
                    disabled={attendanceLoading}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${attendanceLoading ? "animate-spin text-primary-600" : ""}`} />
                  </button>
                </div>
              </div>

              {attendanceError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  {attendanceError}
                </div>
              ) : attendanceLoading && !attendance ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 py-14 text-center text-xs text-slate-400">
                  Đang tải dữ liệu nghỉ phép &amp; lương...
                </div>
              ) : attendance ? (
                <>
                  {/* Bank Account Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      Tài khoản ngân hàng nhận lương
                    </h4>
                    {attendance.bank ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Ngân hàng</span>
                          <p className="font-bold text-slate-900 mt-0.5">{attendance.bank.bankName}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Số tài khoản</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">
                            {attendance.bank.accountNumber}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Chủ tài khoản</span>
                          <p className="font-bold uppercase text-slate-900 mt-0.5">
                            {attendance.bank.accountName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Thành viên này chưa lưu thông tin tài khoản ngân hàng nhận lương.
                      </p>
                    )}
                  </div>

                  {/* Leave Requests */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">
                      Đơn xin nghỉ phép trong {monthLabel(month).toLowerCase()} ({attendance.leaves.length})
                    </h4>
                    {attendance.leaves.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Không có đơn nghỉ phép nào trong tháng này.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {attendance.leaves.map((item) => {
                          const meta = LEAVE_STATUS_META[item.status] || LEAVE_STATUS_META.PENDING;
                          return (
                            <div
                              key={item.id}
                              className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <strong className="text-slate-900">{dateLabel(item.leaveDate)}</strong>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {item.leaveType === "PAID" ? "Có lương" : "Không lương"}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-slate-600 mt-1">{leaveText(item)}</p>
                              </div>
                              {item.status === "PENDING" && canReviewPayroll && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    disabled={reviewingId === item.id}
                                    onClick={() => void handleReviewLeave(item.id, "APPROVED")}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    disabled={reviewingId === item.id}
                                    onClick={() => void handleReviewLeave(item.id, "REJECTED")}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Salary Payout History */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">
                      Lịch sử lệnh rút lương tháng ({attendance.payouts.length})
                    </h4>
                    {attendance.payouts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Chưa có lệnh rút lương nào.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {attendance.payouts.map((item) => {
                          const meta = PAYOUT_STATUS_META[item.status] || PAYOUT_STATUS_META.PENDING;
                          return (
                            <div
                              key={item.id}
                              className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <strong className="text-slate-900">{monthLabel(item.month)}</strong>
                                  <span className="font-mono font-bold text-emerald-700">
                                    {money(item.amountVnd)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.bankName} · <span className="font-mono">{item.accountNumber}</span> ·{" "}
                                  {item.accountName}
                                </p>
                              </div>
                              {item.status === "PENDING" && canReviewPayroll && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    disabled={reviewingId === item.id}
                                    onClick={() => void handleReviewSalaryPayout(item.id, "PAID")}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    Đã chuyển
                                  </button>
                                  <button
                                    type="button"
                                    disabled={reviewingId === item.id}
                                    onClick={() => void handleReviewSalaryPayout(item.id, "REJECTED")}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* TAB 4: PARTNER REFERRALS, REWARDS & AFFILIATE PAYOUTS */}
          {activeTab === "affiliate" && !isStaff && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ["referrals", "Thành viên giới thiệu"],
                      ["rewards", "Lịch sử hoa hồng"],
                      ["payouts", "Lệnh rút hoa hồng"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setAffiliateSubTab(key);
                        setAffiliatePage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        affiliateSubTab === key
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {canOpenAffiliatesPage && (
                  <Link
                    href="/admin/affiliates"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                  >
                    <span>Duyệt thanh toán</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="p-4">
                {affiliateRecordsError ? (
                  <p className="text-xs font-semibold text-rose-600 py-4">{affiliateRecordsError}</p>
                ) : affiliateRecordsLoading && !affiliateRecords ? (
                  <div className="py-10 text-center text-xs text-slate-400">Đang tải dữ liệu...</div>
                ) : !affiliateRecords || affiliateRecords.items.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-400">
                    Chưa có dữ liệu trong mục này.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      {affiliateSubTab === "referrals" && (
                        <table className="w-full min-w-[540px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                              <th className="pb-2.5">Thành viên</th>
                              <th className="pb-2.5">Vai trò</th>
                              <th className="pb-2.5">Đăng ký</th>
                              <th className="pb-2.5">Trạng thái</th>
                              <th className="pb-2.5 text-right">Thưởng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(affiliateRecords.items as AffiliateReferralRow[]).map((row) => (
                              <tr key={row._id}>
                                <td className="py-2.5">
                                  <p className="font-bold text-slate-900">
                                    {row.userId?.name || "Tài khoản"}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{row.userId?.phone || "—"}</p>
                                </td>
                                <td className="py-2.5">
                                  {row.role === "tai-xe" ? "Tài xế" : "Chủ hàng"}
                                </td>
                                <td className="py-2.5 text-slate-500">
                                  {dateTimeLabel(row.registeredAt)}
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      row.qualifiedAt
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {row.qualifiedAt ? "Đủ điều kiện" : "Chờ điều kiện"}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                                  {affiliateMoney(row.rewardAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {affiliateSubTab === "rewards" && (
                        <table className="w-full min-w-[460px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                              <th className="pb-2.5">Thời gian</th>
                              <th className="pb-2.5">Nội dung</th>
                              <th className="pb-2.5 text-right">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(affiliateRecords.items as Reward[]).map((row) => (
                              <tr key={row._id}>
                                <td className="py-2.5 text-slate-500">
                                  {dateTimeLabel(row.createdAt)}
                                </td>
                                <td className="py-2.5 font-semibold text-slate-800">
                                  {row.kind === "milestone"
                                    ? `Thưởng mốc ${row.threshold} thành viên`
                                    : row.kind === "driver"
                                      ? "Giới thiệu tài xế"
                                      : "Giới thiệu chủ hàng"}
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                                  +{affiliateMoney(row.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {affiliateSubTab === "payouts" && (
                        <table className="w-full min-w-[520px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                              <th className="pb-2.5">Ngày tạo</th>
                              <th className="pb-2.5">Tài khoản nhận</th>
                              <th className="pb-2.5">Trạng thái</th>
                              <th className="pb-2.5 text-right">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(affiliateRecords.items as Payout[]).map((row) => {
                              const meta =
                                PAYOUT_STATUS_META[row.status] || PAYOUT_STATUS_META.pending;
                              return (
                                <tr key={row._id}>
                                  <td className="py-2.5 text-slate-500">
                                    {dateTimeLabel(row.createdAt)}
                                  </td>
                                  <td className="py-2.5">
                                    <p className="font-semibold text-slate-800">{row.bankName}</p>
                                    <p className="text-[11px] font-mono text-slate-400">
                                      {row.accountNumber} · {row.accountName}
                                    </p>
                                  </td>
                                  <td className="py-2.5">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls}`}
                                    >
                                      {meta.label}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                                    {affiliateMoney(row.amount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {affiliateRecords.pagination.total > 10 && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">
                          Trang <strong>{affiliatePage}</strong> · Tổng{" "}
                          <strong>{affiliateRecords.pagination.total}</strong> bản ghi
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={affiliatePage <= 1 || affiliateRecordsLoading}
                            onClick={() => setAffiliatePage((p) => Math.max(1, p - 1))}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Trước
                          </button>
                          <button
                            type="button"
                            disabled={!affiliateRecords.pagination.hasMore || affiliateRecordsLoading}
                            onClick={() => setAffiliatePage((p) => p + 1)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            Sau
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
