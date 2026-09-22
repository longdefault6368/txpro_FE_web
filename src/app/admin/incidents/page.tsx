"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  MapPin,
  PhoneOff,
  PhoneCall,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Scale,
  Gavel,
  DollarSign,
  User,
  Truck,
  Info,
  ExternalLink,
  Eye,
  X,
  FileText,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Check,
  AlertCircle
} from "lucide-react";

// Types
interface IncidentUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
}

interface IncidentEvidenceItem {
  id: string;
  type: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number | null;
  gps?: { lat: number; lng: number } | null;
  capturedAt?: string;
  createdAt?: string;
}

interface IncidentEventItem {
  id: string;
  type: string;
  actorRole: string;
  actorId?: string;
  reason?: string;
  faultSide?: string;
  createdAt: string;
}

interface ContactAttempt {
  attemptedAt?: string;
  note?: string;
  success?: boolean;
}

interface IncidentItem {
  id: string;
  orderId: string | null;
  orderCode: string | null;
  orderStatus: string | null;
  type: string;
  status: string;
  reporterRole: string;
  reporter: IncidentUser | null;
  reportedUser: IncidentUser | null;
  description: string | null;
  contactAttempts: ContactAttempt[];
  reporterLocation?: { lat?: number; lng?: number; address?: string } | null;
  settlementStatus: string;
  faultSide: string | null;
  suggestedFaultSide: string | null;
  latestReview?: {
    actorId?: string;
    actorRole?: string;
    reason?: string;
    reviewedAt?: string;
    faultSide?: string;
  } | null;
  submittedAt?: string;
  pendingReviewAt?: string;
  confirmedAt?: string;
  dismissedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  availableActions: string[];
  evidence?: IncidentEvidenceItem[];
  events?: IncidentEventItem[];
}

interface SettlementAction {
  escrowOwner: string;
  action: string;
  amount: number;
}

interface SettlementPreview {
  advisoryOnly: boolean;
  executesOnReview: boolean;
  executableBy: string | null;
  faultSide: string;
  currency: string;
  actions: SettlementAction[];
  note: string;
}

// Meta dictionaries
const INCIDENT_TYPE_META: Record<string, { label: string; desc: string; icon: any; color: string; badge: string }> = {
  cargo_mismatch: {
    label: "Sai Lệch Hàng Hóa / Tải Trọng",
    desc: "Khối lượng thực tế vượt tải, sai quy cách hoặc sai nhóm hàng đã đăng",
    icon: AlertTriangle,
    color: "text-amber-700",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  inaccessible_pickup: {
    label: "Địa Điểm Không Thể Tiếp Cận",
    desc: "Đường cấm tải, cầu giới hạn trọng tải, ngõ hẹp xe không vào được",
    icon: MapPin,
    color: "text-rose-700",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
  unreachable_shipper: {
    label: "Không Liên Hệ Được Chủ Hàng",
    desc: "Tài xế đã đến điểm hẹn và gọi điện tối thiểu 3 lần không phản hồi",
    icon: PhoneOff,
    color: "text-orange-700",
    badge: "bg-orange-50 text-orange-800 border-orange-200",
  },
  force_majeure: {
    label: "Sự Kiện Bất Khả Kháng",
    desc: "Thiên tai bão lũ, thời tiết nguy hiểm, sạt lở hoặc lệnh phong tỏa nhà nước",
    icon: ShieldAlert,
    color: "text-indigo-700",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  refused_delivery: {
    label: "Từ Chối Nhận Hàng",
    desc: "Người nhận từ chối nhận hàng không có lý do chính đáng tại điểm giao",
    icon: XCircle,
    color: "text-purple-700",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
  },
  unsafe_pickup: {
    label: "Điểm Bốc Xếp Không An Toàn",
    desc: "Khu vực nguy hiểm, không có phương tiện nâng hạ theo thỏa thuận",
    icon: AlertTriangle,
    color: "text-rose-700",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
  other: {
    label: "Sự Cố Khác",
    desc: "Tranh chấp hoặc phát sinh nghiệp vụ khác ngoài các nhóm trên",
    icon: Info,
    color: "text-slate-700",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

const INCIDENT_STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  open: {
    label: "Chờ Tiếp Nhận",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  pending_review: {
    label: "Đang Thẩm Tra",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Đã Xác Định Lỗi",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
  },
  dismissed: {
    label: "Đã Bác Bỏ",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  resolved: {
    label: "Đã Tất Toán & Đóng",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã Hủy",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

const FAULT_SIDE_META: Record<string, { label: string; badge: string; actionDesc: string }> = {
  shipper: {
    label: "Lỗi Chủ Hàng",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    actionDesc: "Khấu trừ 3% cọc của Chủ hàng đền bù chi phí cho Tài xế",
  },
  driver: {
    label: "Lỗi Tài Xế",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    actionDesc: "Khấu trừ 3% cọc của Tài xế bồi hoàn cho Chủ hàng",
  },
  none: {
    label: "Bất Khả Kháng / Miễn Trách",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    actionDesc: "Giải tỏa ký quỹ, hoàn trả 100% tiền cọc cho cả hai bên",
  },
  system: {
    label: "Lỗi Sàn Vận Hành",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    actionDesc: "Sàn chịu trách nhiệm chi trả đền bù theo chính sách",
  },
};

const SETTLEMENT_STATUS_META: Record<string, { label: string; badge: string }> = {
  held: {
    label: "Đang Giữ Cọc (Held)",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  settled: {
    label: "Đã Tất Toán (Settled)",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Chờ Đối Soát",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  none: {
    label: "Không Ký Quỹ",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
  },
  waived: {
    label: "Miễn Trừ",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const formatVND = (num: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

const formatDateTime = (val?: string | null) => {
  if (!val) return "---";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "---";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminIncidentsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const queryOrderId = searchParams.get("orderId");

  // State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterReporterRole, setFilterReporterRole] = useState<string>("");
  const [filterFaultSide, setFilterFaultSide] = useState<string>("");

  // Modal / Detail State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Adjudication form state
  const [adjudicationFaultSide, setAdjudicationFaultSide] = useState<string>("shipper");
  const [adjudicationReason, setAdjudicationReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [fullPhotoUrl, setFullPhotoUrl] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Handle URL query parameters on load
  useEffect(() => {
    if (queryId) {
      loadIncidentDetail(queryId);
    } else if (queryOrderId) {
      setSearch(queryOrderId);
    }
  }, [queryId, queryOrderId]);

  // Fetch incidents list
  const fetchIncidents = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (debouncedSearch) params.append("search", debouncedSearch.trim());
      if (filterStatus) params.append("status", filterStatus);
      if (filterType) params.append("type", filterType);
      if (filterReporterRole) params.append("reporterRole", filterReporterRole);
      if (filterFaultSide) params.append("faultSide", filterFaultSide);

      const res = await fetchWithAuth(`${API_BASE}/admin/incidents?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        setIncidents(data.items || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        toast.error("Không thể tải danh sách sự cố tranh chấp");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, filterStatus, filterType, filterReporterRole, filterFaultSide]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Load Single Incident Detail & Settlement Preview
  const loadIncidentDetail = async (id: string) => {
    setSelectedIncidentId(id);
    setLoadingDetail(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${id}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        const inc: IncidentItem = data.incident;
        setSelectedIncident(inc);
        setSettlementPreview(data.settlementPreview || null);

        // Pre-fill adjudication
        const defaultFault = inc.faultSide || inc.suggestedFaultSide || (inc.type === "force_majeure" ? "none" : "shipper");
        setAdjudicationFaultSide(defaultFault);
        setAdjudicationReason(inc.latestReview?.reason || "");
      } else {
        toast.error("Không tìm thấy thông tin sự cố này");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải chi tiết sự cố");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Update dynamic settlement preview when faultSide changes in modal
  const fetchUpdatedPreview = async (incidentId: string, faultSide: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${incidentId}/settlement-preview?faultSide=${faultSide}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.settlementPreview) {
          setSettlementPreview(json.data.settlementPreview);
        }
      }
    } catch {
      // Best-effort
    }
  };

  const handleFaultSideSelect = (side: string) => {
    setAdjudicationFaultSide(side);
    if (selectedIncidentId) {
      fetchUpdatedPreview(selectedIncidentId, side);
    }
  };

  // Actions
  const handleStartReview = async () => {
    if (!selectedIncident) return;
    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${selectedIncident.id}/pending-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adjudicationReason || "Bộ phận vận hành TXEPRO tiếp nhận và bắt đầu thẩm tra vụ việc" }),
      });
      if (res.ok) {
        toast.success("Đã chuyển trạng thái sự cố sang Đang thẩm tra!");
        await loadIncidentDetail(selectedIncident.id);
        fetchIncidents(true);
      } else {
        const err = await res.json();
        toast.error(err.message || "Không thể thực hiện thao tác");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi mạng");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmFault = async () => {
    if (!selectedIncident) return;
    if (!adjudicationReason || adjudicationReason.trim().length < 3) {
      toast.error("Vui lòng nhập lý do phán quyết (tối thiểu 3 ký tự)");
      return;
    }

    const confirmMsg = adjudicationFaultSide === "shipper"
      ? "Xác nhận LỖI THUỘC VỀ CHỦ HÀNG. Hệ thống sẽ khấu trừ 3% tiền cọc ký quỹ của chủ hàng chuyển bồi thường cho tài xế theo Điều 3 HĐVT. Tiếp tục?"
      : adjudicationFaultSide === "driver"
      ? "Xác nhận LỖI THUỘC VỀ TÀI XẾ. Hệ thống sẽ khấu trừ 3% tiền cọc ký quỹ của tài xế bồi hoàn cho chủ hàng theo Điều 3 HĐVT. Tiếp tục?"
      : "Xác nhận SỰ KIỆN BẤT KHẢ KHÁNG / MIỄN TRÁCH. Tiền cọc ký quỹ 3% của cả hai bên sẽ được hoàn trả 100%. Tiếp tục?";

    if (!window.confirm(confirmMsg)) return;

    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${selectedIncident.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faultSide: adjudicationFaultSide,
          reason: adjudicationReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Đã phán quyết lỗi và thực thi chế tài đối soát tiền cọc thành công!");
        await loadIncidentDetail(selectedIncident.id);
        fetchIncidents(true);
      } else {
        const err = await res.json();
        toast.error(err.message || "Không thể xác nhận sự cố");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleDismissIncident = async () => {
    if (!selectedIncident) return;
    if (!adjudicationReason || adjudicationReason.trim().length < 3) {
      toast.error("Vui lòng nhập lý do bác bỏ khiếu nại (tối thiểu 3 ký tự)");
      return;
    }

    if (!window.confirm("Bác bỏ khiếu nại này do không đủ căn cứ chứng minh vi phạm hợp đồng?")) return;

    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${selectedIncident.id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adjudicationReason.trim() }),
      });
      if (res.ok) {
        toast.success("Đã bác bỏ khiếu nại thành công!");
        await loadIncidentDetail(selectedIncident.id);
        fetchIncidents(true);
      } else {
        const err = await res.json();
        toast.error(err.message || "Không thể bác bỏ khiếu nại");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    if (!adjudicationReason || adjudicationReason.trim().length < 3) {
      toast.error("Vui lòng nhập kết luận đóng vụ việc (tối thiểu 3 ký tự)");
      return;
    }

    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${selectedIncident.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adjudicationReason.trim() }),
      });
      if (res.ok) {
        toast.success("Đã hoàn tất tất toán và đóng hồ sơ sự cố thành công!");
        await loadIncidentDetail(selectedIncident.id);
        fetchIncidents(true);
      } else {
        const err = await res.json();
        toast.error(err.message || "Không thể đóng hồ sơ");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterStatus("");
    setFilterType("");
    setFilterReporterRole("");
    setFilterFaultSide("");
    setPage(1);
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    return {
      total,
      openOrPending: incidents.filter(i => i.status === "open" || i.status === "pending_review").length,
      confirmed: incidents.filter(i => i.status === "confirmed").length,
      resolved: incidents.filter(i => i.status === "resolved").length,
      dismissed: incidents.filter(i => i.status === "dismissed").length,
    };
  }, [total, incidents]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                Xử Lý Tranh Chấp & Sự Cố
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {total} vụ việc
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Thẩm định vi phạm hợp đồng vận chuyển, phán quyết trách nhiệm (Tài xế / Chủ hàng) và đối soát cọc ký quỹ 3% theo Điều 3 & Điều 5 HĐVT.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => fetchIncidents(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary-600" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Contract Policy Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-blue-950 text-sm block">Quy chuẩn Phán Quyết Ký Quỹ Hợp Đồng TXEPRO (3% Escrow)</span>
            <span className="text-slate-600 leading-relaxed block mt-0.5">
              - <strong>Lỗi Chủ hàng</strong> (hàng sai tải, sai quy cách, không nghe máy, cấm tải): Khấu trừ 3% cọc chủ hàng đền bù tài xế.<br/>
              - <strong>Lỗi Tài xế</strong> (tự ý bỏ đơn, không đến điểm hẹn): Khấu trừ 3% cọc tài xế bồi thường chủ hàng.<br/>
              - <strong>Bất khả kháng</strong> (thiên tai, sạt lở, bão lũ): Miễn trừ trách nhiệm, hoàn 100% tiền cọc cả 2 bên.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="px-2.5 py-1 bg-white/80 border border-blue-200 rounded-lg text-blue-800 font-semibold text-[11px] shadow-2xs">
            Điều 3 & Điều 5 HĐVT
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Ghi Nhận</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{total}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Toàn hệ thống</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Chờ Xử Lý / Thẩm Tra</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {incidents.filter(i => i.status === "open" || i.status === "pending_review").length}
          </p>
          <span className="text-[11px] text-amber-600 mt-1 block">Cần điều phối viên duyệt</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Đã Xác Định Lỗi</span>
            <Gavel className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {incidents.filter(i => i.status === "confirmed").length}
          </p>
          <span className="text-[11px] text-purple-600 mt-1 block">Đã phán quyết chế tài</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Đã Tất Toán & Đóng</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {incidents.filter(i => i.status === "resolved").length}
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Đã giải phóng tiền cọc</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đã Bác Bỏ</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2">
            {incidents.filter(i => i.status === "dismissed").length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Không vi phạm hợp đồng</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã đơn, SĐT hoặc tên tài xế/chủ hàng..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="open">Chờ tiếp nhận (Open)</option>
              <option value="pending_review">Đang thẩm tra</option>
              <option value="confirmed">Đã xác định lỗi</option>
              <option value="resolved">Đã tất toán & đóng</option>
              <option value="dismissed">Đã bác bỏ</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Filter Type */}
          <div className="md:col-span-3">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="">Tất cả loại sự cố</option>
              <option value="cargo_mismatch">Sai lệch hàng hóa / Quá tải</option>
              <option value="inaccessible_pickup">Địa điểm không tiếp cận được</option>
              <option value="unreachable_shipper">Không liên hệ được chủ hàng</option>
              <option value="force_majeure">Bất khả kháng (Thời tiết/sạt lở)</option>
              <option value="refused_delivery">Từ chối nhận hàng</option>
              <option value="unsafe_pickup">Điểm bốc xếp không an toàn</option>
              <option value="other">Sự cố khác</option>
            </select>
          </div>

          {/* Filter Reporter Role */}
          <div className="md:col-span-2">
            <select
              value={filterReporterRole}
              onChange={(e) => {
                setFilterReporterRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 cursor-pointer"
            >
              <option value="">Bên báo cáo: Tất cả</option>
              <option value="driver">Tài xế báo cáo</option>
              <option value="shipper">Chủ hàng báo cáo</option>
              <option value="system">Hệ thống báo cáo</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <div className="md:col-span-1 flex items-center">
            {(search || filterStatus || filterType || filterReporterRole || filterFaultSide) ? (
              <button
                onClick={handleResetFilters}
                title="Đặt lại bộ lọc"
                className="w-full flex items-center justify-center p-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer border border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-center text-[11px] text-slate-400">
                <Filter className="w-3.5 h-3.5 mr-1" /> Lọc
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary-600 border-t-transparent"></div>
            <p className="text-xs text-slate-500">Đang truy vấn dữ liệu sự cố thật từ máy chủ...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Không có tranh chấp hoặc sự cố nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không tìm thấy báo cáo sự cố nào phù hợp với điều kiện tìm kiếm hiện tại.
            </p>
            {(search || filterStatus || filterType || filterReporterRole) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vận Đơn & Loại Sự Cố</th>
                  <th className="py-3.5 px-4">Bên Báo Cáo & Đối Tượng</th>
                  <th className="py-3.5 px-4">Mô Tả & Bằng Chứng</th>
                  <th className="py-3.5 px-4">Trạng Thái & Phán Quyết Lỗi</th>
                  <th className="py-3.5 px-4">Ký Quỹ (3% Escrow)</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {incidents.map((incident) => {
                  const typeMeta = INCIDENT_TYPE_META[incident.type] || INCIDENT_TYPE_META.other;
                  const statusMeta = INCIDENT_STATUS_META[incident.status] || INCIDENT_STATUS_META.open;
                  const faultMeta = incident.faultSide ? FAULT_SIDE_META[incident.faultSide] : null;
                  const settlementMeta = SETTLEMENT_STATUS_META[incident.settlementStatus] || SETTLEMENT_STATUS_META.none;
                  const TypeIcon = typeMeta.icon;

                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => loadIncidentDetail(incident.id)}
                    >
                      {/* Order Code & Incident Type */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {incident.orderCode ? (
                              <Link
                                href={`/admin/orders/${incident.orderId || ""}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
                              >
                                {incident.orderCode}
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </Link>
                            ) : (
                              <span className="font-mono text-slate-400">Không có mã đơn</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeMeta.badge}`}>
                              <TypeIcon className="w-3 h-3 shrink-0" />
                              {typeMeta.label}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 block">
                            {formatDateTime(incident.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Reporter & Reported User */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          {/* Reporter */}
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              Báo cáo: {incident.reporterRole === "driver" ? "Tài xế" : incident.reporterRole === "shipper" ? "Chủ hàng" : incident.reporterRole}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {incident.reporter?.name || "Người dùng ẩn"}
                              </p>
                              {incident.reporter?.phone && (
                                <p className="text-[11px] text-slate-500">{incident.reporter.phone}</p>
                              )}
                            </div>
                          </div>

                          {/* Reported user */}
                          {incident.reportedUser && (
                            <div className="flex items-start gap-1.5 text-slate-500">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                Bị tố: {incident.reportedUser.role === "shipper" ? "Chủ hàng" : "Tài xế"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-slate-700 truncate">{incident.reportedUser.name || "---"}</p>
                                {incident.reportedUser.phone && (
                                  <p className="text-[11px] text-slate-400">{incident.reportedUser.phone}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Description & Evidence */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1.5">
                          <p className="text-slate-700 line-clamp-2 leading-relaxed">
                            {incident.description || "Không có lời mô tả"}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {incident.contactAttempts?.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                <PhoneCall className="w-2.5 h-2.5" />
                                {incident.contactAttempts.length} lần gọi
                              </span>
                            )}
                            {incident.reporterLocation?.lat && (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                <MapPin className="w-2.5 h-2.5" />
                                GPS
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status & Fault Decision */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMeta.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                          </span>

                          {faultMeta ? (
                            <div className="block">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${faultMeta.badge}`}>
                                <Gavel className="w-2.5 h-2.5" />
                                {faultMeta.label}
                              </span>
                            </div>
                          ) : incident.suggestedFaultSide ? (
                            <div className="text-[10px] text-slate-400 italic">
                              Gợi ý: {incident.suggestedFaultSide === "shipper" ? "Bên chủ hàng" : incident.suggestedFaultSide === "driver" ? "Bên tài xế" : "Không bên nào"}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Escrow Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${settlementMeta.badge}`}>
                            {settlementMeta.label}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => loadIncidentDetail(incident.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/80 rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Thẩm định
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <strong>{incidents.length}</strong> / <strong>{total}</strong> sự cố (Trang {page}/{totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`min-w-[30px] h-[30px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                        page === p
                          ? "bg-primary-600 text-white shadow-2xs"
                          : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incident Detail & Adjudication Modal */}
      {selectedIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Hồ Sơ Thẩm Định & Phán Quyết Sự Cố
                    {selectedIncident?.orderCode && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                        Đơn {selectedIncident.orderCode}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID Hồ sơ: <span className="font-mono font-medium">{selectedIncidentId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedIncidentId(null);
                  setSelectedIncident(null);
                  setSettlementPreview(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {loadingDetail ? (
                <div className="py-20 text-center space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary-600 border-t-transparent"></div>
                  <p className="text-slate-500">Đang tải hồ sơ chứng cứ và đối soát ký quỹ...</p>
                </div>
              ) : selectedIncident ? (
                <>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Trạng thái hiện tại:</span>
                      <span className={`px-2.5 py-1 rounded-full font-bold border ${INCIDENT_STATUS_META[selectedIncident.status]?.badge || "bg-slate-100 text-slate-700"}`}>
                        {INCIDENT_STATUS_META[selectedIncident.status]?.label || selectedIncident.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Bên có lỗi:</span>
                      {selectedIncident.faultSide ? (
                        <span className={`px-2.5 py-1 rounded-md font-bold border ${FAULT_SIDE_META[selectedIncident.faultSide]?.badge || "bg-slate-100 text-slate-700"}`}>
                          {FAULT_SIDE_META[selectedIncident.faultSide]?.label || selectedIncident.faultSide}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xác định (Đang chờ thẩm định)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Ký quỹ 3%:</span>
                      <span className={`px-2 py-0.5 rounded font-medium border ${SETTLEMENT_STATUS_META[selectedIncident.settlementStatus]?.badge || "bg-slate-100 text-slate-700"}`}>
                        {SETTLEMENT_STATUS_META[selectedIncident.settlementStatus]?.label || selectedIncident.settlementStatus}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Overview: Reporter & Reported */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reporter Box */}
                    <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Bên Báo Cáo Sự Cố ({selectedIncident.reporterRole === "driver" ? "Tài xế" : "Chủ hàng"})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Gửi lúc: {formatDateTime(selectedIncident.submittedAt || selectedIncident.createdAt)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{selectedIncident.reporter?.name || "Người dùng ẩn"}</p>
                        <p className="text-slate-600">SĐT: <span className="font-semibold text-slate-800">{selectedIncident.reporter?.phone || "Chưa cập nhật"}</span></p>
                        <p className="text-slate-600">Email: {selectedIncident.reporter?.email || "Chưa cập nhật"}</p>
                      </div>
                    </div>

                    {/* Reported User Box */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          Đối Tượng Bị Khiếu Nại ({selectedIncident.reportedUser?.role === "shipper" ? "Chủ hàng" : "Tài xế"})
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{selectedIncident.reportedUser?.name || "Chưa gán đối tượng"}</p>
                        <p className="text-slate-600">SĐT: <span className="font-semibold text-slate-800">{selectedIncident.reportedUser?.phone || "Chưa cập nhật"}</span></p>
                        <p className="text-slate-600">Email: {selectedIncident.reportedUser?.email || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Incident Nature & Incident Description */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Loại sự cố:</span>
                        <span className={`px-2.5 py-1 rounded-md font-semibold border ${INCIDENT_TYPE_META[selectedIncident.type]?.badge || "bg-slate-100 text-slate-700"}`}>
                          {INCIDENT_TYPE_META[selectedIncident.type]?.label || selectedIncident.type}
                        </span>
                      </div>
                      {selectedIncident.orderId && (
                        <Link
                          href={`/admin/orders/${selectedIncident.orderId}`}
                          target="_blank"
                          className="text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Mở chi tiết vận đơn <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">Lời khai mô tả của người báo cáo:</span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedIncident.description || "Không có lời mô tả."}
                      </p>
                    </div>

                    {/* GPS Coordinates & Contact Logs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* GPS */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700 block">Tọa độ GPS lúc báo sự cố:</span>
                            {selectedIncident.reporterLocation?.lat ? (
                              <span className="text-slate-500 font-mono">
                                {selectedIncident.reporterLocation.lat.toFixed(5)}, {selectedIncident.reporterLocation.lng?.toFixed(5)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Không có dữ liệu GPS</span>
                            )}
                          </div>
                        </div>
                        {selectedIncident.reporterLocation?.lat && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedIncident.reporterLocation.lat},${selectedIncident.reporterLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-primary-600 hover:bg-slate-50 font-semibold transition"
                          >
                            Xem bản đồ
                          </a>
                        )}
                      </div>

                      {/* Contact Attempts */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-orange-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700 block">Nhật ký liên hệ:</span>
                            <span className="text-slate-600">
                              {selectedIncident.contactAttempts?.length || 0} lần cố gắng liên lạc
                            </span>
                          </div>
                        </div>
                        {selectedIncident.contactAttempts?.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            Không nghe máy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Gallery */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary-600" />
                        Bằng Chứng Tại Hiện Trường ({selectedIncident.evidence?.length || 0} tệp)
                      </span>
                    </div>

                    {!selectedIncident.evidence || selectedIncident.evidence.length === 0 ? (
                      <p className="text-slate-400 italic py-3 text-center">Không có hình ảnh hoặc video bằng chứng đính kèm</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedIncident.evidence.map((ev, index) => (
                          <div
                            key={ev.id || index}
                            onClick={() => setFullPhotoUrl(ev.url)}
                            className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video cursor-pointer hover:shadow-md transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ev.url}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 bg-slate-900/70 text-white rounded text-[10px] truncate">
                              {ev.type || "Ảnh hiện trường"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Settlement & Escrow Impact Preview (Real calculation from contract service) */}
                  <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-950 text-sm">Dự Toán Xử Lý Ký Quỹ & Chế Tài 3% (Escrow Settlement)</h4>
                          <p className="text-slate-500 text-[11px]">
                            {settlementPreview?.note || "Áp dụng chế tài tự động theo điều khoản ký quỹ của Hợp Đồng Vận Tải."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {settlementPreview?.actions && settlementPreview.actions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {settlementPreview.actions.map((act, i) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">
                                Cọc {act.escrowOwner === "shipper" ? "Chủ hàng" : "Tài xế"} (3%):
                              </span>
                              <span className="font-bold text-slate-900">{formatVND(act.amount)}</span>
                            </div>
                            <div className="text-[11px]">
                              {act.action === "transfer_to_driver" && (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" /> Chuyển bồi thường cho Tài xế
                                </span>
                              )}
                              {act.action === "transfer_to_shipper" && (
                                <span className="text-orange-700 font-semibold flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" /> Chuyển bồi hoàn cho Chủ hàng
                                </span>
                              )}
                              {act.action === "release" && (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Hoàn trả lại người ký quỹ
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-indigo-100 text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-700">Quy tắc ký quỹ MB Bank 3%:</p>
                        <p className="text-[11px] text-slate-500">
                          - Lỗi Chủ hàng: Khấu trừ 3% cọc của Chủ hàng đền bù Tài xế, hoàn cọc 3% cho Tài xế.<br />
                          - Lỗi Tài xế: Khấu trừ 3% cọc của Tài xế bồi hoàn Chủ hàng, hoàn cọc 3% cho Chủ hàng.<br />
                          - Bất khả kháng: Giải tỏa cọc 100% về tài khoản ví hai bên.
                        </p>
                      </div>
                    )}

                    {selectedIncident.orderId && (
                      <div className="pt-2 flex items-center justify-between border-t border-indigo-200/60">
                        <span className="text-[11px] font-semibold text-indigo-900">Cần thao tác can thiệp vận đơn hoặc tài chính?</span>
                        <Link
                          href={`/admin/orders/${selectedIncident.orderId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition"
                        >
                          <span>Mở Vận Đơn Để Thao Tác TMS</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Adjudication Action Box */}
                  <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary-600" />
                      Quyết Định Phán Quyết & Xử Lý Hồ Sơ
                    </h4>

                    {/* Step 1: Select Fault Side */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 block">1. Chọn bên chịu trách nhiệm vi phạm hợp đồng:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("shipper")}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            adjudicationFaultSide === "shipper"
                              ? "border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-400"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Lỗi do Chủ Hàng</span>
                            {adjudicationFaultSide === "shipper" && <Check className="w-4 h-4 text-rose-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Hàng sai tải, sai quy cách, không nghe máy, cấm tải xe không vào được. Phạt mất cọc 3%.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("driver")}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            adjudicationFaultSide === "driver"
                              ? "border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-400"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Lỗi do Tài Xế</span>
                            {adjudicationFaultSide === "driver" && <Check className="w-4 h-4 text-orange-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Tự ý hủy đơn, trễ hẹn, không bốc dỡ hàng theo cam kết. Phạt khấu trừ 3% cọc.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("none")}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            adjudicationFaultSide === "none"
                              ? "border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-400"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Bất Khả Kháng (Miễn lỗi)</span>
                            {adjudicationFaultSide === "none" && <Check className="w-4 h-4 text-teal-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Thiên tai, thời tiết cực đoan, đường sạt lở. Hoàn trả 100% tiền cọc hai bên.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Reason / Notes */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">
                        2. Căn cứ phán quyết / Ghi chú thẩm định nội bộ: <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={adjudicationReason}
                        onChange={(e) => setAdjudicationReason(e.target.value)}
                        placeholder="Ghi rõ lý do phán quyết (ví dụ: Tài xế có ảnh chụp biển cấm tải và lịch sử 3 cuộc gọi không nghe máy; đối chiếu theo Điều 3.3 HĐVT...)"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 text-xs"
                      />
                    </div>

                    {/* Step 3: Action Buttons based on status */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                      {/* If Open: Start Review */}
                      {selectedIncident.status === "open" && (
                        <button
                          type="button"
                          onClick={handleStartReview}
                          disabled={actionSubmitting}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Clock className="w-4 h-4" />
                          Tiếp Nhận & Bắt Đầu Thẩm Tra
                        </button>
                      )}

                      {/* If Pending Review: Confirm or Dismiss */}
                      {selectedIncident.status === "pending_review" && (
                        <>
                          <button
                            type="button"
                            onClick={handleDismissIncident}
                            disabled={actionSubmitting}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4 text-slate-600" />
                            Bác Bỏ Khiếu Nại (Không vi phạm)
                          </button>

                          <button
                            type="button"
                            onClick={handleConfirmFault}
                            disabled={actionSubmitting}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Gavel className="w-4 h-4" />
                            Xác Nhận Lỗi & Thực Thi Khấu Trừ Cọc 3%
                          </button>
                        </>
                      )}

                      {/* If Confirmed or Dismissed: Resolve / Close */}
                      {(selectedIncident.status === "confirmed" || selectedIncident.status === "dismissed") && (
                        <button
                          type="button"
                          onClick={handleResolveIncident}
                          disabled={actionSubmitting}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Hoàn Tất Tất Toán & Đóng Hồ Sơ
                        </button>
                      )}

                      {selectedIncident.status === "resolved" && (
                        <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                          Vụ việc đã được tất toán và đóng hồ sơ hoàn tất.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Incident Events History */}
                  {selectedIncident.events && selectedIncident.events.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-800 text-xs block">Lịch Sử Tiến Trình Hồ Sơ (Audit Trail)</span>
                      <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                        {selectedIncident.events.map((evt) => (
                          <div key={evt.id} className="text-[11px] space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{evt.type}</span>
                              <span className="text-slate-400 font-mono">{formatDateTime(evt.createdAt)}</span>
                            </div>
                            {evt.reason && <p className="text-slate-600 italic">&ldquo;{evt.reason}&rdquo;</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {fullPhotoUrl && (
        <div
          onClick={() => setFullPhotoUrl(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullPhotoUrl} alt="Bằng chứng hiện trường" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            <button
              onClick={() => setFullPhotoUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-sm flex items-center gap-1 cursor-pointer"
            >
              <X className="w-5 h-5" /> Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminIncidentsPage() {
  return (
    <Suspense fallback={
      <div className="p-10 text-center text-xs text-slate-400">
        Đang tải Trung tâm giải quyết sự cố tranh chấp...
      </div>
    }>
      <AdminIncidentsContent />
    </Suspense>
  );
}
