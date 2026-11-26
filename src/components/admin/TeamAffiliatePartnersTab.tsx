"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Gift,
  Handshake,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Unlock,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { API_BASE, fetchWithAuth } from "@/utils/api";
import { affiliateMoney, type AffiliatePage, type Partner } from "@/utils/affiliate";
import { canAccessAdminPath, readCurrentAdminAccessFromStorage } from "@/utils/admin-access";
import TeamMemberDetailDrawer, {
  type PartnerDetailTarget,
} from "@/components/admin/TeamMemberDetailDrawer";

interface AffiliateOverviewStats {
  partners: {
    total: number;
    active: number;
    suspended: number;
    totalEarned: number;
    balance: number;
    reservedAmount: number;
    paidAmount: number;
  };
  members: {
    registered: number;
    qualified: number;
    drivers: number;
    shippers: number;
    qualifiedDrivers: number;
    qualifiedShippers: number;
  };
  payouts: {
    pending: { count: number; amount: number };
    paid: { count: number; amount: number };
    rejected: { count: number; amount: number };
  };
}

interface TeamAffiliatePartnersTabProps {
  onCountChange?: (total: number) => void;
  onToast?: (success: boolean, message: string) => void;
}

export default function TeamAffiliatePartnersTab({
  onCountChange,
  onToast,
}: TeamAffiliatePartnersTabProps) {
  const [overview, setOverview] = useState<AffiliateOverviewStats | null>(null);
  const [partnersPage, setPartnersPage] = useState<AffiliatePage<Partner> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [queryInput, setQueryInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "suspended">("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [attendancePartner, setAttendancePartner] = useState<Partner | null>(null);
  const [attendanceEnabledDraft, setAttendanceEnabledDraft] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState(0);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [detailPartnerSnapshot, setDetailPartnerSnapshot] = useState<Partner | null>(null);
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);

  const [adminAccess, setAdminAccess] = useState<{ adminRole: string; permissions: string[] }>({
    adminRole: "",
    permissions: [],
  });

  const canManageStatus = adminAccess.adminRole === "super_admin";
  const canOpenAffiliatesPage = canAccessAdminPath(
    "/admin/affiliates",
    adminAccess.adminRole,
    adminAccess.permissions
  );

  useEffect(() => {
    let active = true;
    const fetchPartners = async () => {
      const access = readCurrentAdminAccessFromStorage();
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (searchQuery) params.set("q", searchQuery);
        if (statusFilter) params.set("status", statusFilter);

        const [overviewRes, partnersRes] = await Promise.all([
          fetchWithAuth(`${API_BASE}/admin/affiliates/overview`),
          fetchWithAuth(`${API_BASE}/admin/affiliates/partners?${params.toString()}`),
        ]);

        if (!active) return;
        setAdminAccess(access);

        if (!partnersRes.ok) {
          const errBody = await partnersRes.json().catch(() => null);
          throw new Error(
            errBody?.message ||
            (partnersRes.status === 403
              ? "Tài khoản hiện tại không có quyền xem danh sách đối tác Affiliate."
              : "Không thể tải danh sách đối tác Affiliate.")
          );
        }

        const partnersJson = await partnersRes.json();
        if (!active) return;
        const pageData: AffiliatePage<Partner> = partnersJson.data || {
          items: [],
          pagination: { page: 1, total: 0, hasMore: false },
        };
        setPartnersPage(pageData);
        setError("");

        if (overviewRes.ok) {
          const overviewJson = await overviewRes.json();
          if (!active) return;
          const ovData: AffiliateOverviewStats | null = overviewJson.data || null;
          setOverview(ovData);
          if (ovData?.partners && typeof ovData.partners.total === "number") {
            onCountChange?.(ovData.partners.total);
          }
        } else if (!searchQuery && !statusFilter) {
          onCountChange?.(pageData.pagination.total);
        }
      } catch (err: unknown) {
        if (!active) return;
        setAdminAccess(access);
        setError(err instanceof Error ? err.message : "Không thể tải danh sách đối tác.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPartners();
    return () => {
      active = false;
    };
  }, [page, searchQuery, statusFilter, refreshKey, onCountChange]);

  const triggerReload = () => {
    setLoading(true);
    setError("");
    setRefreshKey((k) => k + 1);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      onToast?.(true, `Đã sao chép mã giới thiệu ${code}`);
    } catch {
      onToast?.(false, "Không thể sao chép tự động, vui lòng chọn mã để sao chép.");
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendancePartner) return;
    const cleanSalary = Math.max(0, Math.round(Number(salaryDraft) || 0));
    setSavingAttendance(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE}/admin/affiliates/partners/${attendancePartner._id}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceEnabled: attendanceEnabledDraft,
            baseSalaryVnd: cleanSalary,
          }),
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Không thể cập nhật chấm công & lương cứng.");
      }
      onToast?.(
        true,
        attendanceEnabledDraft
          ? `Đã bật chấm công cho ${attendancePartner.code}${cleanSalary > 0 ? ` (lương cứng ${affiliateMoney(cleanSalary)}/tháng)` : ""}`
          : `Đã tắt quyền chấm công cho ${attendancePartner.code}`
      );
      setAttendancePartner(null);
      setDetailRefreshToken((v) => v + 1);
      triggerReload();
    } catch (err: unknown) {
      onToast?.(false, err instanceof Error ? err.message : "Lỗi cập nhật chấm công đối tác.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleConfirmToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    const reason = statusReason.trim();
    if (reason.length < 3) {
      onToast?.(false, "Vui lòng nhập lý do tối thiểu 3 ký tự.");
      return;
    }

    const nextStatus = editingPartner.status === "active" ? "suspended" : "active";
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/affiliates/partners/${editingPartner._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Không thể cập nhật trạng thái đối tác.");
      }
      onToast?.(
        true,
        nextStatus === "suspended"
          ? `Đã tạm ngưng đối tác ${editingPartner.code}`
          : `Đã khôi phục đối tác ${editingPartner.code}`
      );
      setEditingPartner(null);
      setStatusReason("");
      setDetailRefreshToken((v) => v + 1);
      triggerReload();
    } catch (err: unknown) {
      onToast?.(false, err instanceof Error ? err.message : "Lỗi cập nhật trạng thái đối tác.");
    } finally {
      setSubmitting(false);
    }
  };

  const items = partnersPage?.items || [];
  const total = partnersPage?.pagination.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-5">
      {/* Separation notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Handshake className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">
              Đối tác Affiliate độc lập với Ban Quản Trị nội bộ
            </p>
            <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
              Super Admin có thể bật quyền chấm công và thiết lập lương cứng riêng cho từng đối tác tại đây (khi bật sẽ tự hiển thị menu Chấm công trên trang /doi-tac), vẫn tách biệt hoàn toàn với quyền quản trị /admin.
            </p>
          </div>
        </div>
        {canOpenAffiliatesPage && (
          <Link
            href="/admin/affiliates"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            <span>Duyệt thanh toán & Chính sách</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng đối tác</span>
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1.5">
              {overview.partners.total.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview.partners.active} hoạt động · {overview.partners.suspended} tạm ngưng
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thành viên giới thiệu</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1.5">
              {overview.members.registered.toLocaleString("vi-VN")}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {overview.members.qualified.toLocaleString("vi-VN")} người đủ điều kiện nhận thưởng
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiền thưởng</span>
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1.5">
              {affiliateMoney(overview.partners.totalEarned)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Đã thanh toán: {affiliateMoney(overview.partners.paidAmount)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ đối soát chi</span>
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1.5">
              {affiliateMoney(overview.payouts.pending.amount)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview.payouts.pending.count} yêu cầu đang chờ duyệt
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setPage(1);
          setSearchQuery(queryInput.trim());
          setRefreshKey((k) => k + 1);
        }}
        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
      >
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Tìm đối tác theo tên, SĐT, email hoặc mã giới thiệu..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setLoading(true);
              setStatusFilter(e.target.value as "" | "active" | "suspended");
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm ngưng</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm kiếm</span>
          </button>

          <button
            type="button"
            onClick={triggerReload}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách đối tác"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Partners Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Danh sách đối tác Affiliate</span>
          <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
        </div>

        <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[1140px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <th className="py-4 px-6 min-w-[220px]">Đối Tác</th>
                <th className="py-4 px-4 min-w-[150px]">Mã Giới Thiệu</th>
                <th className="py-4 px-4 min-w-[165px]">Thành Viên Giới Thiệu</th>
                <th className="py-4 px-4 min-w-[175px]">Thưởng &amp; Số Dư</th>
                <th className="py-4 px-4 min-w-[160px]">Chấm Công &amp; Lương Cứng</th>
                <th className="py-4 px-4 min-w-[125px]">Trạng Thái</th>
                <th className="py-4 px-6 text-right min-w-[180px]">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                    Đang tải danh sách đối tác Affiliate...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Handshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Chưa có đối tác phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tài xế và Chủ hàng có thể đăng ký làm đối tác trên app TXE PRO hoặc tại /doi-tac.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((partner) => {
                  const account = partner.userId;
                  const displayName = account?.name || "Tài khoản đối tác";
                  const initials = displayName
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "DT";
                  const roleLabel =
                    account?.role === "doi-tac"
                      ? "Đối tác hệ thống"
                      : account?.role === "tai-xe"
                        ? "Tài xế"
                        : account?.role === "chu-hang"
                          ? "Chủ hàng"
                          : account?.role || "Thành viên";
                  const isActive = partner.status === "active";
                  const stats = partner.stats;

                  return (
                    <tr key={partner._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setDetailPartnerSnapshot(partner)}
                          className="flex items-center gap-3 text-left group cursor-pointer w-full"
                          title="Bấm để xem chi tiết đối tác và lịch chấm công"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                                {displayName}
                              </p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                                {roleLabel}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                              {account?.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {account.phone}
                                </span>
                              )}
                              {account?.email && (
                                <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {account.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-lg">
                            {partner.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopyCode(partner.code)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                            title="Sao chép mã giới thiệu"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Chính sách: <span className="font-semibold text-slate-600">{partner.termsVersion}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">
                          {(stats?.qualified ?? 0).toLocaleString("vi-VN")}{" "}
                          <span className="font-medium text-slate-400">
                            / {(stats?.registered ?? 0).toLocaleString("vi-VN")} người
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tài xế: {stats?.qualifiedDrivers ?? 0}/{stats?.drivers ?? 0} · Chủ hàng:{" "}
                          {stats?.qualifiedShippers ?? 0}/{stats?.shippers ?? 0}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">
                          Tổng: {affiliateMoney(partner.totalEarned)}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          Khả dụng: {affiliateMoney(partner.balance)}
                        </p>
                        {(partner.reservedAmount > 0 || partner.paidAmount > 0) && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Chờ chi: {affiliateMoney(partner.reservedAmount)} · Đã trả:{" "}
                            {affiliateMoney(partner.paidAmount)}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${partner.attendanceEnabled
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                        >
                          <CalendarClock className="w-3 h-3" />
                          <span>{partner.attendanceEnabled ? "Có chấm công" : "Chưa bật"}</span>
                        </span>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1">
                          {(partner.baseSalaryVnd ?? 0) > 0
                            ? `Lương cứng: ${affiliateMoney(partner.baseSalaryVnd || 0)}`
                            : "Chỉ hoa hồng"}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{isActive ? "Hoạt động" : "Tạm ngưng"}</span>
                        </span>
                        {!isActive && partner.suspensionReason && (
                          <p
                            className="text-[10px] text-red-500 mt-1 line-clamp-2 max-w-[160px]"
                            title={partner.suspensionReason}
                          >
                            {partner.suspensionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageStatus && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttendancePartner(partner);
                                  setAttendanceEnabledDraft(Boolean(partner.attendanceEnabled));
                                  setSalaryDraft(Number(partner.baseSalaryVnd) || 0);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${partner.attendanceEnabled
                                  ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                title="Cài đặt quyền chấm công & lương cứng cho đối tác"
                              >
                                <CalendarClock className="w-3.5 h-3.5" />
                                <span>Chấm công / Lương</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPartner(partner);
                                  setStatusReason("");
                                }}
                                className={`p-2 border rounded-xl transition-colors cursor-pointer ${isActive
                                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                title={isActive ? "Tạm ngưng đối tác" : "Khôi phục đối tác"}
                              >
                                {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailPartnerSnapshot(partner)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-primary-200 bg-primary-50/70 hover:bg-primary-100/80 rounded-xl text-[11px] font-bold text-primary-700 transition-colors cursor-pointer"
                            title="Xem chi tiết đối tác, thống kê & lịch chấm công"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500 font-medium">
              Tổng cộng <strong className="text-slate-800">{total.toLocaleString("vi-VN")}</strong> đối tác · Trang{" "}
              <strong className="text-slate-800">{page}</strong> / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                disabled={!partnersPage?.pagination.hasMore || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p + 1);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Partner Attendance & Fixed Salary */}
      {attendancePartner && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary-600" />
                  <span>Chấm công &amp; Lương cứng đối tác</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {attendancePartner.userId?.name || attendancePartner.code} ·{" "}
                  <span className="font-mono font-bold text-primary-600">{attendancePartner.code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttendancePartner(null)}
                disabled={savingAttendance}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendanceEnabledDraft}
                  onChange={(e) => setAttendanceEnabledDraft(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Bật quyền chấm công trên trang /doi-tac</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Khi bật, menu bên trái trên trang Đối tác sẽ hiển thị mục <strong>Chấm công &amp; lương</strong> (chấm vào/ra, báo cáo ngày, nghỉ phép, rút lương) và đồng bộ về bảng công Admin.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mức lương cứng hàng tháng (₫)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000000000}
                  step={100000}
                  value={salaryDraft}
                  onChange={(e) => setSalaryDraft(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[0, 2000000, 3000000, 5000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSalaryDraft(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${salaryDraft === preset
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {preset === 0 ? "0 ₫ (Chỉ chấm công)" : affiliateMoney(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAttendancePartner(null)}
                  disabled={savingAttendance}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAttendance}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingAttendance ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suspend / Restore Partner */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPartner.status === "active" ? "Tạm ngưng đối tác" : "Khôi phục đối tác"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingPartner.userId?.name || editingPartner.code} ·{" "}
                  <span className="font-mono font-bold text-primary-600">{editingPartner.code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                disabled={submitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmToggleStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do {editingPartner.status === "active" ? "tạm ngưng" : "khôi phục"} *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={1000}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể (tối thiểu 3 ký tự)..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || statusReason.trim().length < 3}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 ${editingPartner.status === "active"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                >
                  {submitting ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Drawer: Chi tiết đối tác & lịch chấm công */}
      {(() => {
        if (!detailPartnerSnapshot) return null;
        const livePartner =
          items.find((p) => p._id === detailPartnerSnapshot._id) || detailPartnerSnapshot;
        const partnerTarget: PartnerDetailTarget = {
          kind: "partner",
          partnerId: livePartner._id,
          userId: livePartner.userId?._id ? String(livePartner.userId._id) : null,
          code: livePartner.code,
          name: livePartner.userId?.name || livePartner.code,
          email: livePartner.userId?.email,
          phone: livePartner.userId?.phone,
          accountRole: livePartner.userId?.role,
          status: livePartner.status,
          suspensionReason: livePartner.suspensionReason,
          termsVersion: livePartner.termsVersion,
          acceptedAt: livePartner.acceptedAt,
          attendanceEnabled: Boolean(livePartner.attendanceEnabled),
          baseSalaryVnd: Number(livePartner.baseSalaryVnd) || 0,
          totalEarned: livePartner.totalEarned,
          balance: livePartner.balance,
          reservedAmount: livePartner.reservedAmount,
          paidAmount: livePartner.paidAmount,
          stats: livePartner.stats,
        };
        return (
          <TeamMemberDetailDrawer
            key={livePartner._id}
            target={partnerTarget}
            onClose={() => setDetailPartnerSnapshot(null)}
            onToast={onToast}
            refreshToken={detailRefreshToken}
            canManagePartnerAttendance={canManageStatus}
            canOpenAffiliatesPage={canOpenAffiliatesPage}
            onConfigurePartnerAttendance={() => {
              setAttendancePartner(livePartner);
              setAttendanceEnabledDraft(Boolean(livePartner.attendanceEnabled));
              setSalaryDraft(Number(livePartner.baseSalaryVnd) || 0);
            }}
          />
        );
      })()}
    </div>
  );
}
