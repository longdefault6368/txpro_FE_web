"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";
import { incidentRoleLabel, incidentResponderRole, incidentResponseLabel, incidentReviewActions, incidentEventLabel, incidentConfirmMessage } from "@/utils/incident-review";
import { useToast } from "@/context/ToastContext";
import { PendingCancellationCompensations } from "./compensation_queue";
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Check,
  WalletCards,
  type LucideIcon,
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
  channel?: string;
  outcome?: string;
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
  counterpartyResponse?: {
    decision: "accepted" | "appealed";
    appealReason?: string | null;
    appealReasonLabel?: string | null;
    description?: string | null;
    respondedAt?: string | null;
    responderRole?: "driver" | "shipper";
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
  responseEvidence?: IncidentEvidenceItem[];
  events?: IncidentEventItem[];
}

interface SettlementAction {
  escrowOwner: string;
  action: string;
  amount: number;
  destinationWallet?: "promo";
  releaseAfterDays?: number;
  fundingSource?: "escrow" | "platform_fund";
}

interface SettlementPreview {
  plan?: { payerMethod: string; compensationAmount: number; revokesLifetimeVoucher: boolean; fundingSource: string };
  advisoryOnly: boolean;
  executesOnReview: boolean;
  executableBy: string | null;
  faultSide: string;
  currency: string;
  actions: SettlementAction[];
  note: string;
  compensationPolicy?: {
    method: "money";
    destinationWallet: "promo";
    releaseAfterDays: number;
    voucherIsCompensation: boolean;
  };
}

interface CompensationClaimItem {
  id: string;
  recipientRole: "shipper" | "driver";
  payerRole: "shipper" | "driver";
  amount: number;
  currency: string;
  status: "held" | "paid" | "released";
  automatic: boolean;
  fundingSource?: "escrow" | "platform_fund";
  holdReason?: "manual_review" | "platform_fund_insufficient" | null;
  paidAt?: string | null;
  promoAvailableAt?: string | null;
  promoReleasedAt?: string | null;
  compensationDestination?: string | null;
}

interface CompensationFundSummary { balance: number; totalAllocated: number; totalPaid: number; currency: string }

// Meta dictionaries
const INCIDENT_TYPE_META: Record<string, { label: string; desc: string; icon: LucideIcon; color: string; badge: string }> = {
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
    desc: "Báo cáo không thể liên hệ; cần đối chiếu lịch sử liên lạc và phản hồi của hai bên",
    icon: PhoneOff,
    color: "text-orange-700",
    badge: "bg-orange-50 text-orange-800 border-orange-200",
  },
  force_majeure: {
    label: "Sự Kiện Bất Khả Kháng",
    desc: "Tai nạn, hư hỏng đột xuất hoặc tình huống ngoài khả năng kiểm soát có minh chứng",
    icon: ShieldAlert,
    color: "text-indigo-700",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  refused_delivery: {
    label: "Sự cố giao nhận",
    desc: "Phát sinh khi giao hoặc nhận hàng; đối chiếu thỏa thuận trước khi kết luận",
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
  delivery_location_changed: {
    label: "Thay đổi địa điểm giao hàng",
    desc: "Tài xế báo địa điểm giao hàng phát sinh khác với địa điểm đã thỏa thuận",
    icon: MapPin,
    color: "text-amber-700",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
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
    label: "Chờ phản hồi / tiếp nhận",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  pending_review: {
    label: "Đang Thẩm Tra",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Đã có kết luận",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
  },
  dismissed: {
    label: "Đã Bác Bỏ",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  resolved: {
    label: "Đã đóng hồ sơ",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã rút báo cáo",
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
    actionDesc: "Xử lý theo kết luận vận hành; không tự suy diễn khoản bồi thường từ ký quỹ hai bên",
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
    label: "Không giữ ký quỹ cho hồ sơ",
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

const CONTACT_CHANNEL: Record<string, string> = { phone: "Điện thoại", chat: "Nhắn tin", in_person: "Trực tiếp", other: "Khác" };
const CONTACT_OUTCOME: Record<string, string> = { contacted: "Đã liên hệ", no_answer: "Không nghe máy", unreachable: "Không liên lạc được", refused: "Từ chối", other: "Khác" };

function IncidentEvidenceGallery({ title, evidence = [], onPreview }: {
  title: string; evidence?: IncidentEvidenceItem[]; onPreview: (url: string) => void;
}) {
  return (
    <section className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
        <Camera className="w-4 h-4 text-slate-500" /> {title} ({evidence.length})
      </h4>
      {evidence.length === 0 ? <p className="text-xs text-slate-500 py-3">Không có bằng chứng đính kèm. Ảnh không bắt buộc khi gửi kháng cáo.</p> : (
        <div className="grid grid-cols-2 gap-3">
          {evidence.map((item, index) => {
            const url = getServerMediaUrl(item.url);
            const isPhoto = item.type === "photo" || item.type.endsWith("_photo") || item.mimeType?.startsWith("image/");
            if (!url) return null;
            return isPhoto ? (
              <div key={item.id || index} className="space-y-1">
                <button type="button" onClick={() => onPreview(url)} aria-label={`Phóng to ${title.toLowerCase()} ${index + 1}`}
                  className="group relative w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video focus-visible:ring-2 focus-visible:ring-blue-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex items-center justify-center text-white"><Eye className="w-5 h-5" /></span>
                </button>
                <p className="text-[11px] text-slate-500">{item.type === "pickup_photo" ? "Ảnh nhận hàng" : item.type === "dropoff_photo" ? "Ảnh giao hàng" : "Ảnh đính kèm"} • {formatDateTime(item.capturedAt || item.createdAt)}</p>
              </div>
            ) : <a key={item.id || index} href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 p-3 text-blue-700 underline">Mở tệp bằng chứng {index + 1}</a>;
          })}
        </div>
      )}
    </section>
  );
}

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

  const [search, setSearch] = useState(queryOrderId || "");
  const [debouncedSearch, setDebouncedSearch] = useState(queryOrderId || "");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterReporterRole, setFilterReporterRole] = useState<string>("");
  const [filterFaultSide, setFilterFaultSide] = useState<string>("");
  const [filterResponse, setFilterResponse] = useState("");
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>({});
  const [listError, setListError] = useState<string | null>(null);

  // Modal / Detail State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);
  const [compensationClaims, setCompensationClaims] = useState<CompensationClaimItem[]>([]);
  const [compensationFund, setCompensationFund] = useState<CompensationFundSummary | null>(null);
  const [relatedIncidents, setRelatedIncidents] = useState<IncidentItem[]>([]);
  const [fundAmount, setFundAmount] = useState("");
  const [fundReference, setFundReference] = useState("");
  const [fundReason, setFundReason] = useState("");
  const [fundAttested, setFundAttested] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const previewRequest = useRef(0);
  const actionLock = useRef(false);

  // Adjudication form state
  const [adjudicationFaultSide, setAdjudicationFaultSide] = useState<string>("");
  const [adjudicationReason, setAdjudicationReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [fullPhotoUrl, setFullPhotoUrl] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch incidents list
  const fetchIncidents = useCallback(async (isSilent = false) => {
    const requestId = ++listRequest.current;
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
      if (filterResponse) params.append("response", filterResponse);

      const res = await fetchWithAuth(`${API_BASE}/admin/incidents?${params.toString()}`);
      const json = await res.json();
      if (requestId !== listRequest.current) return;
      if (res.ok) {
        const data = json.data || {};
        setListError(null);
        setIncidents(data.items || []);
        setTotal(data.pagination?.total || 0);
        const pages = data.pagination?.pages || 1;
        setTotalPages(pages);
        if (page > pages) setPage(pages);
        setStatusSummary(data.summary || {});
      } else {
        throw new Error(json.message || "Không thể tải danh sách sự cố tranh chấp");
      }
    } catch (err) {
      if (requestId !== listRequest.current) return;
      const message = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
      setListError(message);
      toast.error(message);
    } finally {
      if (requestId === listRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, limit, debouncedSearch, filterStatus, filterType, filterReporterRole, filterFaultSide, filterResponse, toast]);

  useEffect(() => {
    const requests = listRequest;
    const timer = setTimeout(() => void fetchIncidents(), 0);
    return () => { clearTimeout(timer); requests.current++; };
  }, [fetchIncidents]);

  // Load Single Incident Detail & Settlement Preview
  const loadIncidentDetail = useCallback(async (id: string) => {
    const requestId = ++detailRequest.current;
    previewRequest.current++;
    setSelectedIncidentId(id);
    setSelectedIncident(null);
    setSettlementPreview(null);
    setCompensationClaims([]);
    setCompensationFund(null);
    setRelatedIncidents([]);
    setDetailError(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setAdjudicationFaultSide("");
    setAdjudicationReason("");
    setLoadingDetail(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${id}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        if (requestId !== detailRequest.current) return;
        const inc: IncidentItem = data.incident;
        if (!inc?.id) throw new Error("Hồ sơ trả về không hợp lệ");
        setSelectedIncident(inc);
        setSettlementPreview(data.settlementPreview || null);
        setCompensationClaims(data.compensationClaims || []);
        setCompensationFund(data.compensationFund || null);
        setRelatedIncidents(data.relatedIncidents || []);

        // Pre-fill adjudication
        // A suggestion is not a verdict. Require an explicit admin selection.
        setAdjudicationFaultSide(inc.faultSide || "");
      } else {
        const json = await res.json();
        throw new Error(json.message || "Không tìm thấy thông tin sự cố này");
      }
    } catch (err) {
      if (requestId !== detailRequest.current) return;
      setDetailError(err instanceof Error ? err.message : "Lỗi tải chi tiết sự cố");
    } finally {
      if (requestId === detailRequest.current) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryId) void loadIncidentDetail(queryId);
      else if (queryOrderId) { setSearch(queryOrderId); setPage(1); }
    }, 0);
    return () => clearTimeout(timer);
  }, [queryId, queryOrderId, loadIncidentDetail]);

  useEffect(() => () => { listRequest.current++; detailRequest.current++; previewRequest.current++; }, []);

  // Update dynamic settlement preview when faultSide changes in modal
  const fetchUpdatedPreview = async (incidentId: string, faultSide: string) => {
    const requestId = ++previewRequest.current;
    const detailId = detailRequest.current;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/incidents/${incidentId}/settlement-preview?faultSide=${faultSide}`);
      const json = await res.json();
      if (!res.ok || !json.data?.settlementPreview) throw new Error(json.message || "Không thể tải dự toán quyết toán");
      if (requestId === previewRequest.current && detailId === detailRequest.current) {
        setSettlementPreview(json.data.settlementPreview);
        setCompensationFund(json.data.compensationFund || null);
      }
    } catch {
      if (requestId === previewRequest.current && detailId === detailRequest.current) setPreviewError("Chưa lấy được dự toán cho lựa chọn này. Vui lòng chọn lại hoặc tải lại hồ sơ.");
    } finally {
      if (requestId === previewRequest.current && detailId === detailRequest.current) setPreviewLoading(false);
    }
  };

  const handleFaultSideSelect = (side: string) => {
    if (actionLock.current || !selectedIncident || !incidentReviewActions(selectedIncident, compensationClaims).includes("confirmed")) return;
    setAdjudicationFaultSide(side);
    if (selectedIncidentId) {
      fetchUpdatedPreview(selectedIncidentId, side);
    }
  };

  const runDecision = async (
    action: string, path: string, payload: Record<string, string>, message: string, success: string,
  ) => {
    if (!selectedIncident || actionLock.current) return;
    const claimAction = action === "approve" || action === "dismiss-claim";
    if (!claimAction && !incidentReviewActions(selectedIncident, compensationClaims).includes(action)) {
      toast.error("Hồ sơ không còn cho phép thao tác này. Vui lòng tải lại để xem trạng thái mới.");
      return;
    }
    if (!window.confirm(message)) return;
    const id = selectedIncident.id;
    const detailId = detailRequest.current;
    actionLock.current = true;
    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(path, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409 && detailId === detailRequest.current) await loadIncidentDetail(id);
        throw new Error(json.message || "Không thể thực hiện thao tác");
      }
      toast.success(success);
      if (detailId === detailRequest.current) await loadIncidentDetail(id);
      await fetchIncidents(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể kết nối máy chủ");
    } finally {
      actionLock.current = false;
      setActionSubmitting(false);
    }
  };

  const reasonForDecision = () => {
    const reason = adjudicationReason.trim();
    if (reason.length < 3 || reason.length > 1000) {
      toast.error("Vui lòng nhập căn cứ xử lý từ 3 đến 1.000 ký tự.");
      return null;
    }
    return reason;
  };

  const handleCompensationDecision = async (claim: CompensationClaimItem, action: "approve" | "dismiss") => {
    if (!selectedIncident || claim.status !== "held") return;
    const reason = reasonForDecision();
    if (!reason) return;
    const message = action === "approve"
      ? `Duyệt ${formatVND(claim.amount)} tiền bồi thường cho ${incidentRoleLabel(claim.recipientRole)} vào Ví khuyến mãi? Khoản tiền được giải ngân sau 30 ngày.`
      : claim.fundingSource === "platform_fund"
        ? `Bác khoản chi ${formatVND(claim.amount)} từ quỹ TXE PRO? Không cộng ví người nhận và không hoàn ký quỹ giả cho bên dùng voucher; kết luận vi phạm đã ghi nhận vẫn giữ nguyên.`
        : `Bác khoản bồi thường ${formatVND(claim.amount)} và hoàn lại ký quỹ cho ${incidentRoleLabel(claim.payerRole)}?`;
    await runDecision(action === "approve" ? "approve" : "dismiss-claim",
      `${API_BASE}/admin/compensations/${claim.id}/${action}`, { reason }, message,
      action === "approve" ? "Đã duyệt bồi thường bằng tiền. Xem kết quả và lịch giải ngân bên dưới." : "Đã xử lý khoản bồi thường theo nguồn tiền của hồ sơ.");
  };

  const handleStartReview = async () => {
    if (!selectedIncident) return;
    const reason = adjudicationReason.trim() || "TXE PRO tiếp nhận hồ sơ và đối chiếu báo cáo, phản hồi và bằng chứng của hai bên.";
    await runDecision("pending_review", `${API_BASE}/admin/incidents/${selectedIncident.id}/pending-review`,
      { reason }, "Tiếp nhận hồ sơ để thẩm tra? Thao tác này chưa kết luận vi phạm và chưa chuyển tiền.", "Đã tiếp nhận hồ sơ thẩm tra.");
  };

  const handleConfirmFault = async () => {
    if (!selectedIncident) return;
    const reason = reasonForDecision();
    if (!reason) return;
    if (!["shipper", "driver", "none"].includes(adjudicationFaultSide)) {
      toast.error("Vui lòng chọn kết luận trách nhiệm sau khi đối chiếu hai bên.");
      return;
    }
    if (previewLoading || previewError || !settlementPreview || settlementPreview.faultSide !== adjudicationFaultSide) {
      toast.error("Vui lòng chờ dự toán đúng với lựa chọn trách nhiệm trước khi xác nhận.");
      return;
    }
    await runDecision("confirmed", `${API_BASE}/admin/incidents/${selectedIncident.id}/confirm`,
      { reason, faultSide: adjudicationFaultSide },
      incidentConfirmMessage(adjudicationFaultSide, settlementPreview.executesOnReview,
        settlementPreview.compensationPolicy?.releaseAfterDays || 30, settlementPreview.plan),
      "Đã ghi nhận kết luận. Xem kết quả xử lý ký quỹ và bồi thường trong hồ sơ.");
  };

  const handleAllocateFund = async () => {
    if (actionLock.current || !selectedIncident) return;
    const amount = Number(fundAmount);
    const reference = fundReference.trim();
    const reason = fundReason.trim();
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000 ||
        !/^[a-zA-Z0-9_-]{8,120}$/.test(reference) || reason.length < 10 || reason.length > 1000 || !fundAttested) {
      toast.error("Nhập số tiền nguyên từ 1 đến 1 tỷ, mã đối soát 8–120 ký tự (chữ/số/_/-), căn cứ 10–1.000 ký tự và xác nhận nguồn đã được cấp.");
      return;
    }
    if (!window.confirm(`Ghi nhận ${formatVND(amount)} ngân sách TXE PRO đã được cấp nguồn, mã ${reference}? Đây không phải lệnh chuyển tiền ngân hàng.`)) return;
    const id = selectedIncident.id;
    const detailId = detailRequest.current;
    actionLock.current = true;
    setActionSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/compensations/fund/allocate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reference, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Không thể cấp nguồn");
      toast.success(json.data?.changed ? "Đã ghi nhận nguồn quỹ. Có thể duyệt khoản chi chờ cấp nguồn." : "Mã đối soát đã ghi nhận; không cộng nguồn lần nữa.");
      setFundAmount(""); setFundReference(""); setFundReason(""); setFundAttested(false);
      if (detailId === detailRequest.current) await loadIncidentDetail(id);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Lỗi kết nối máy chủ"); }
    finally { actionLock.current = false; setActionSubmitting(false); }
  };

  const handleDismissIncident = async () => {
    if (!selectedIncident) return;
    const reason = reasonForDecision();
    if (!reason) return;
    await runDecision("dismissed", `${API_BASE}/admin/incidents/${selectedIncident.id}/dismiss`,
      { reason }, "Bác bỏ báo cáo sau khi đối chiếu bằng chứng? Hồ sơ không ghi nhận vi phạm và các khoản ký quỹ đang giữ sẽ được xử lý theo chính sách.", "Đã bác bỏ báo cáo.");
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    const reason = reasonForDecision();
    if (!reason) return;
    await runDecision("resolved", `${API_BASE}/admin/incidents/${selectedIncident.id}/resolve`,
      { reason }, "Đóng hồ sơ đã có kết luận? Khoản bồi thường đã vào Ví khuyến mãi vẫn giữ lịch giải ngân 30 ngày; đóng hồ sơ không giải ngân sớm.", "Đã đóng hồ sơ sự cố.");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterStatus("");
    setFilterType("");
    setFilterReporterRole("");
    setFilterFaultSide("");
    setFilterResponse("");
    setPage(1);
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    return {
      total,
      openOrPending: (statusSummary.open || 0) + (statusSummary.pending_review || 0),
      confirmed: statusSummary.confirmed || 0,
      resolved: statusSummary.resolved || 0,
      dismissed: statusSummary.dismissed || 0,
      cancelled: statusSummary.cancelled || 0,
    };
  }, [total, statusSummary]);

  const reviewActions = selectedIncident ? incidentReviewActions(selectedIncident, compensationClaims) : [];
  const canAdjudicate = reviewActions.includes("confirmed");
  const formReadOnly = actionSubmitting || (!reviewActions.length && !compensationClaims.some(c => c.status === "held"));

  const closeDetail = () => {
    if (actionLock.current) return;
    detailRequest.current++;
    previewRequest.current++;
    setSelectedIncidentId(null);
    setSelectedIncident(null);
    setSettlementPreview(null);
    setCompensationClaims([]);
    setFullPhotoUrl(null);
  };

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
                Đối chiếu báo cáo, kháng cáo và bằng chứng hai bên; kết luận trách nhiệm và xử lý ký quỹ, bồi thường theo hồ sơ thực tế.
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
            <span className="font-bold text-blue-950 text-sm block">Quy chuẩn phán quyết và bồi thường tiền TXE PRO</span>
            <span className="text-slate-600 leading-relaxed block mt-0.5">
              - <strong>Hủy không hợp lệ quá 5 phút:</strong> hệ thống xử lý theo chính sách của đơn. <strong>Báo cáo sự cố:</strong> đối chiếu phản hồi, ảnh và căn cứ trước khi kết luận.<br/>
              - <strong>Một bên báo cáo, bên còn lại phản hồi:</strong> chấp nhận là xác nhận trách nhiệm; kháng cáo được chuyển quản trị viên xem xét. Không tự coi người bị báo cáo là bên vi phạm.<br/>
              - Bên không có lỗi được <strong>hoàn quyền lợi hợp lệ và nhận thêm tiền bồi thường</strong>. Bên có lỗi bị trừ ký quỹ hoặc thu hồi voucher đã áp dụng; nhánh voucher do <strong>quỹ TXE PRO</strong> cấp tiền, không bồi thường bằng voucher.<br/>
              - Tiền bồi thường đủ nguồn và được duyệt vào <strong>Ví khuyến mãi</strong>, có thể giải ngân sang Ví chính sau <strong>30 ngày kể từ lúc ghi có</strong>. Thiếu nguồn thì ghi nhận chờ cấp nguồn, chưa cộng số dư.<br/>
              - <strong>Bất khả kháng hoặc không có lỗi:</strong> cần minh chứng và kết luận phù hợp; chỉ xử lý những khoản ký quỹ thực tế đang giữ. Rút báo cáo không đồng nghĩa hủy đơn hàng.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="px-2.5 py-1 bg-white/80 border border-blue-200 rounded-lg text-blue-800 font-semibold text-[11px] shadow-2xs">
            Bồi thường bằng tiền
          </span>
        </div>
      </div>

      <PendingCancellationCompensations key={`${selectedIncident?.updatedAt || ''}:${refreshing}`} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Ghi Nhận</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{total}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Theo bộ lọc hiện tại</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Chờ xử lý</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {summaryCounts.openOrPending}
          </p>
          <span className="text-[11px] text-amber-600 mt-1 block">Chờ phản hồi hoặc quản trị xem xét</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Đã có kết luận</span>
            <Gavel className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {summaryCounts.confirmed}
          </p>
          <span className="text-[11px] text-purple-600 mt-1 block">Đã xác định trách nhiệm</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Đã đóng hồ sơ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {summaryCounts.resolved}
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Không giải ngân trước hạn 30 ngày</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đã Bác Bỏ</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2">
            {summaryCounts.dismissed}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Không vi phạm hợp đồng</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Đã rút báo cáo</span><RotateCcw className="w-4 h-4 text-slate-400" /></div>
          <p className="text-2xl font-bold text-slate-700 mt-2">{summaryCounts.cancelled}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lưu hồ sơ để đối soát</span>
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
              <option value="open">Chờ phản hồi / tiếp nhận</option>
              <option value="pending_review">Đang thẩm tra</option>
              <option value="confirmed">Đã có kết luận</option>
              <option value="resolved">Đã đóng hồ sơ</option>
              <option value="dismissed">Đã bác bỏ</option>
              <option value="cancelled">Đã rút báo cáo</option>
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
              <option value="force_majeure">Sự cố bất khả kháng</option>
              <option value="refused_delivery">Sự cố giao nhận</option>
              <option value="unsafe_pickup">Điểm bốc xếp không an toàn</option>
              <option value="delivery_location_changed">Thay đổi địa điểm giao hàng</option>
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
            {(search || filterStatus || filterType || filterReporterRole || filterFaultSide || filterResponse) ? (
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
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">Phản hồi
            <select value={filterResponse} onChange={e => { setFilterResponse(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <option value="">Tất cả phản hồi</option><option value="awaiting">Chưa phản hồi</option>
              <option value="appealed">Đã kháng cáo</option><option value="accepted">Đã chấp nhận báo cáo</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">Kết luận
            <select value={filterFaultSide} onChange={e => { setFilterFaultSide(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <option value="">Tất cả kết luận</option><option value="shipper">Trách nhiệm Chủ hàng</option>
              <option value="driver">Trách nhiệm Tài xế</option><option value="none">Không bên nào có lỗi</option><option value="system">Sự cố hệ thống</option>
            </select>
          </label>
        </div>
      </div>

      {/* Incident List Table */}
      {listError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{listError} Dữ liệu hiện tại có thể chưa mới. <button onClick={() => void fetchIncidents()} className="font-bold underline">Thử lại</button></div>}
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
                  <th className="py-3.5 px-4">Phản hồi & Kết luận</th>
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
                              Báo cáo: {incidentRoleLabel(incident.reporterRole)}
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
                                Phản hồi: {incidentRoleLabel(incident.reportedUser.role || incidentResponderRole(incident))}
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
                                {incident.contactAttempts.length} lần liên hệ
                              </span>
                            )}
                            {incident.reporterLocation?.lat != null && (
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

                          <p className={`text-[11px] font-semibold ${incident.counterpartyResponse?.decision === "appealed" ? "text-amber-700" : "text-slate-500"}`}>
                            {incidentResponseLabel(incident)}
                          </p>

                          {faultMeta ? (
                            <div className="block">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${faultMeta.badge}`}>
                                <Gavel className="w-2.5 h-2.5" />
                                {faultMeta.label}
                              </span>
                            </div>
                          ) : incident.suggestedFaultSide ? (
                            <div className="text-[10px] text-slate-400 italic">
                              Chưa có kết luận trách nhiệm
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
                  <h3 className="text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
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
                  closeDetail();
                }}
                disabled={actionSubmitting}
                aria-label="Đóng hồ sơ tranh chấp"
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
              ) : detailError ? (
                <div role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-800">
                  {detailError} <button className="font-bold underline" onClick={() => void loadIncidentDetail(selectedIncidentId)}>Tải lại hồ sơ</button>
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
                          Bên báo cáo ({incidentRoleLabel(selectedIncident.reporterRole)})
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
                          Bên được báo cáo ({incidentRoleLabel(selectedIncident.reportedUser?.role || incidentResponderRole(selectedIncident))})
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
                  {!selectedIncident.counterpartyResponse && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                      <p className="font-bold text-slate-800">{incidentResponseLabel(selectedIncident)}</p>
                      <p className="text-slate-600">{selectedIncident.status === "cancelled" ? "Người gửi đã rút báo cáo; hồ sơ được giữ để đối soát, không tiếp tục coi là tranh chấp đang chờ xử lý." : "Chưa ghi nhận lựa chọn chấp nhận hoặc kháng cáo từ bên được báo cáo. Không tự suy diễn trách nhiệm từ việc chưa phản hồi."}</p>
                    </div>
                  )}
                  {selectedIncident.counterpartyResponse && (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-amber-900 flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          Phản hồi của {incidentRoleLabel(incidentResponderRole(selectedIncident))}
                        </p>
                        <span className="text-xs text-amber-800">
                          {formatDateTime(selectedIncident.counterpartyResponse.respondedAt)}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {selectedIncident.status === "cancelled" ? "Phản hồi được lưu để đối soát. Báo cáo đã rút lại, không tiếp tục xử lý như một tranh chấp đang chờ kết luận." : selectedIncident.counterpartyResponse.decision === "accepted"
                          ? "Bên được báo cáo đã chấp nhận báo cáo và xác nhận trách nhiệm."
                          : "Bên được báo cáo phản đối và đề nghị quản trị viên xem xét."}
                      </p>
                      {selectedIncident.counterpartyResponse.appealReasonLabel && (
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">Lý do kháng cáo: </span>
                          {selectedIncident.counterpartyResponse.appealReasonLabel}
                        </p>
                      )}
                      {selectedIncident.counterpartyResponse.description && (
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {selectedIncident.counterpartyResponse.description}
                        </p>
                      )}
                      <p className="text-xs text-amber-800">
                        Đối chiếu lời khai và bằng chứng của hai bên trước khi kết luận trách nhiệm và xử lý bồi thường.
                      </p>
                    </div>
                  )}
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
                            {selectedIncident.reporterLocation?.lat != null ? (
                              <span className="text-slate-500 font-mono">
                                {selectedIncident.reporterLocation.lat.toFixed(5)}, {selectedIncident.reporterLocation.lng?.toFixed(5)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Không có dữ liệu GPS</span>
                            )}
                          </div>
                        </div>
                        {selectedIncident.reporterLocation?.lat != null && (
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
                      </div>
                    </div>
                    {!!selectedIncident.contactAttempts?.length && <div className="space-y-2 border-t border-slate-100 pt-3">
                      {selectedIncident.contactAttempts.map((attempt, index) => <div key={index} className="rounded-xl bg-slate-50 p-3 flex flex-wrap gap-2 text-slate-600">
                        <span>{formatDateTime(attempt.attemptedAt)}</span>
                        <strong>{CONTACT_CHANNEL[attempt.channel || ""] || "Liên hệ"}</strong>
                        <span>{CONTACT_OUTCOME[attempt.outcome || ""] || "Chưa ghi nhận kết quả"}</span>
                        {attempt.note && <p className="w-full whitespace-pre-wrap">{attempt.note}</p>}
                      </div>)}
                    </div>}
                  </div>

                  {/* Compare report and appeal evidence without mixing their owners. */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IncidentEvidenceGallery title={`Bằng chứng báo cáo • ${incidentRoleLabel(selectedIncident.reporterRole)}`}
                      evidence={selectedIncident.evidence} onPreview={setFullPhotoUrl} />
                    <IncidentEvidenceGallery title={`Bằng chứng kháng cáo • ${incidentRoleLabel(incidentResponderRole(selectedIncident))}`}
                      evidence={selectedIncident.responseEvidence} onPreview={setFullPhotoUrl} />
                  </div>

                  {relatedIncidents.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <h4 className="font-semibold text-amber-950">Báo cáo khác của cùng đơn • Cần đối chiếu trước khi kết luận</h4>
                    <p className="text-xs text-amber-900">Có thể hai bên cùng báo cáo. Xem toàn bộ căn cứ và tránh quyết toán mâu thuẫn hoặc chi bồi thường nhiều lần cho cùng lần nhận chuyến.</p>
                    {relatedIncidents.map(item => <button type="button" key={item.id} disabled={actionSubmitting} onClick={() => void loadIncidentDetail(item.id)} className="block w-full rounded-xl border border-amber-200 bg-white p-3 text-left disabled:opacity-50">
                      <p className="font-semibold text-slate-800">{incidentRoleLabel(item.reporterRole)} báo cáo • {INCIDENT_TYPE_META[item.type]?.label || item.type} • {INCIDENT_STATUS_META[item.status]?.label || item.status}</p>
                      {item.description && <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">{item.description}</p>}
                    </button>)}
                  </section>}

                  {/* Settlement & Escrow Impact Preview (Real calculation from contract service) */}
                  <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-950 text-sm">Dự toán ký quỹ và bồi thường bằng tiền</h4>
                          <p className="text-slate-500 text-[11px]">
                            {settlementPreview?.note || "Chưa có dữ liệu dự toán quyết toán."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {previewLoading && <p role="status" className="flex items-center gap-2 text-slate-600"><RefreshCw className="w-4 h-4 animate-spin" />Đang tính dự toán theo kết luận đã chọn...</p>}
                    {previewError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{previewError}</p>}
                    {settlementPreview?.advisoryOnly && <p className="rounded-xl bg-white p-3 text-slate-600 border border-slate-200">Hồ sơ đã quyết toán hoặc đóng, không xử lý quyền lợi lần nữa. Khoản bồi thường còn chờ cấp nguồn/duyệt vẫn có thể được xử lý riêng bên dưới.</p>}
                    {!adjudicationFaultSide && canAdjudicate && <p className="text-amber-800 font-semibold">Chưa chọn kết luận trách nhiệm. Dự toán gợi ý bên dưới không phải là phán quyết.</p>}
                    {settlementPreview?.plan?.payerMethod === "voucher" && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 space-y-1">
                        <p className="font-semibold">{settlementPreview.plan.revokesLifetimeVoucher ? "Bên có lỗi: thu hồi toàn bộ voucher miễn ký quỹ trọn đời của Chủ hàng" : "Bên có lỗi: thu hồi voucher Tài xế đã áp dụng cho chuyến, không trừ thêm voucher chưa dùng"}</p>
                        <p>Hoàn lại lượt voucher/ký quỹ hợp lệ của bên không có lỗi. Tiền bồi thường bổ sung: {formatVND(settlementPreview.plan.compensationAmount)}, do quỹ TXE PRO chi, không lấy voucher làm nguồn tiền mặt.</p>
                        {settlementPreview.executesOnReview && (compensationFund?.balance ?? 0) < settlementPreview.plan.compensationAmount && <p className="font-semibold">Quỹ chưa đủ nguồn. Khi kết luận, khoản chi được ghi nhận chờ cấp nguồn; chưa cộng vào ví người nhận.</p>}
                      </div>
                    )}

                    {settlementPreview?.actions.some((action) => action.action.startsWith("transfer_to_")) && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
                        <WalletCards className="h-4 w-4 shrink-0" />
                        <span className="font-bold">Nơi nhận: Ví khuyến mãi</span>
                        <span className="text-emerald-700">• Bồi thường bằng tiền • Giải ngân sau {settlementPreview?.compensationPolicy?.releaseAfterDays || 30} ngày • Không thay thế bằng voucher</span>
                      </div>
                    )}

                    {settlementPreview?.actions && settlementPreview.actions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {settlementPreview.actions.map((act, i) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">
                                {act.action === "release" ? `Hoàn ký quỹ ${incidentRoleLabel(act.escrowOwner)}` : "Bồi thường bổ sung (3%)"}:
                              </span>
                              <span className="font-bold text-slate-900">{formatVND(act.amount)}</span>
                            </div>
                            <div className="text-[11px]">
                              {act.action.startsWith("transfer_to_") && <p className="text-slate-600">Nguồn: {act.fundingSource === "platform_fund" ? "Quỹ bồi thường TXE PRO" : "Ký quỹ bên có lỗi (không thu thêm)"}</p>}
                              {act.action === "transfer_to_driver" && (
                                <div className="space-y-0.5">
                                  <span className="text-rose-700 font-semibold flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" /> Chuyển tiền vào Ví khuyến mãi của Tài xế
                                  </span>
                                  <p className="text-slate-500">Được giải ngân sau {act.releaseAfterDays || 30} ngày</p>
                                </div>
                              )}
                              {act.action === "transfer_to_shipper" && (
                                <div className="space-y-0.5">
                                  <span className="text-orange-700 font-semibold flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" /> Chuyển tiền vào Ví khuyến mãi của Chủ hàng
                                  </span>
                                  <p className="text-slate-500">Được giải ngân sau {act.releaseAfterDays || 30} ngày</p>
                                </div>
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

                    <details className="rounded-xl border border-slate-200 bg-white p-3">
                      <summary className="cursor-pointer font-semibold text-slate-800">Quỹ bồi thường TXE PRO • Khả dụng: {formatVND(compensationFund?.balance ?? 0)}</summary>
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-slate-600">Đã cấp nguồn: {formatVND(compensationFund?.totalAllocated ?? 0)} • Đã chi: {formatVND(compensationFund?.totalPaid ?? 0)}. Chỉ ghi nhận ngân sách đã được TXE PRO cấp và đối soát; thao tác này không chuyển tiền ngân hàng, không dùng tiền nạp của khách hàng.</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-xs text-slate-700">Số tiền cấp nguồn (VND)<input type="number" min="1" max="1000000000" step="1" value={fundAmount} disabled={actionSubmitting} onChange={e => setFundAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                          <label className="text-xs text-slate-700">Mã đối soát ngân sách/ngân hàng<input value={fundReference} maxLength={120} disabled={actionSubmitting} onChange={e => setFundReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                        </div>
                        <label className="block text-xs text-slate-700">Căn cứ cấp nguồn<textarea value={fundReason} maxLength={1000} disabled={actionSubmitting} onChange={e => setFundReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                        <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={fundAttested} disabled={actionSubmitting} onChange={e => setFundAttested(e.target.checked)} className="mt-0.5" />Tôi xác nhận nguồn đã được cấp, có chứng từ đối soát và không phải tiền ký quỹ của người dùng.</label>
                        <button type="button" disabled={actionSubmitting || !fundAttested} onClick={handleAllocateFund} className="rounded-xl bg-sky-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Ghi nhận nguồn quỹ</button>
                      </div>
                    </details>

                    {compensationClaims.length > 0 && (
                      <div className="space-y-2 border-t border-indigo-200/60 pt-3">
                        <p className="font-bold text-slate-800">Kết quả bồi thường</p>
                        {compensationClaims.map((claim) => (
                          <div key={claim.id} className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {formatVND(claim.amount)} • {claim.status === "released" ? (claim.fundingSource === "platform_fund" ? "Khoản chi TXE PRO không được duyệt" : `Hoàn ký quỹ cho ${incidentRoleLabel(claim.payerRole)}`) : `${claim.fundingSource === "platform_fund" ? "Quỹ TXE PRO" : incidentRoleLabel(claim.payerRole)} → ${incidentRoleLabel(claim.recipientRole)}`}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {claim.automatic ? "Xử lý tự động theo chính sách đơn • " : "Xử lý qua thẩm định • "}
                                  {claim.status === "held" && (claim.holdReason === "platform_fund_insufficient" ? "Chờ TXE PRO cấp nguồn • Chưa cộng tiền vào ví" : "Chờ quản trị viên đối soát • Chưa cộng tiền vào ví")}
                                  {claim.status === "paid" && !claim.promoReleasedAt && claim.promoAvailableAt && `Đã ghi nhận • Được giải ngân từ ${formatDateTime(claim.promoAvailableAt)}`}
                                  {claim.status === "paid" && claim.promoReleasedAt && `Đã giải ngân vào Ví chính lúc ${formatDateTime(claim.promoReleasedAt)}`}
                                  {claim.status === "paid" && !claim.promoAvailableAt && !claim.promoReleasedAt && "Đã bồi thường theo cơ chế ví trước thời điểm áp dụng chính sách 30 ngày"}
                                  {claim.status === "released" && (claim.fundingSource === "platform_fund" ? "Không duyệt khoản chi • Không tạo giao dịch hoàn ký quỹ giả" : "Không duyệt bồi thường • Đã hoàn tiền ký quỹ cho bên nộp")}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                claim.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : claim.status === "held"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}>
                                {claim.status === "paid" ? (claim.promoReleasedAt ? "Đã giải ngân" : "Đã ghi nhận bồi thường") : claim.status === "held" ? (claim.holdReason === "platform_fund_insufficient" ? "Chờ cấp nguồn" : "Chờ duyệt") : "Không duyệt bồi thường"}
                              </span>
                            </div>
                            {claim.status === "held" && (
                              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                                <button
                                  type="button"
                                  disabled={actionSubmitting}
                                  onClick={() => handleCompensationDecision(claim, "dismiss")}
                                  className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                >
                                  Bác bồi thường
                                </button>
                                <button
                                  type="button"
                                  disabled={actionSubmitting || (claim.fundingSource === "platform_fund" && (compensationFund?.balance ?? 0) < claim.amount)}
                                  onClick={() => handleCompensationDecision(claim, "approve")}
                                  className="rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Duyệt bồi thường tiền
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
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
                    {selectedIncident.latestReview?.reason && <div className="rounded-xl bg-slate-50 p-3 text-slate-600 space-y-1">
                      <p className="font-semibold">Kết luận / phản hồi gần nhất • {incidentRoleLabel(selectedIncident.latestReview.actorRole)} • {formatDateTime(selectedIncident.latestReview.reviewedAt)}</p>
                      <p className="whitespace-pre-wrap">{selectedIncident.latestReview.reason}</p>
                    </div>}
                    {selectedIncident.status === "cancelled" && <p className="text-slate-600">Báo cáo đã được rút lại, chỉ được xem để đối soát. Không ghi nhận thêm vi phạm hoặc bồi thường từ hồ sơ này.</p>}
                    {compensationClaims.some(c => c.status === "held") && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">Còn khoản bồi thường chờ xử lý. Báo cáo đã giải quyết không có nghĩa tiền đã được chi. Đối soát nguồn quỹ, nhập căn cứ và xử lý khoản tiền bên trên.</p>}

                    {/* Step 1: Select Fault Side */}
                    {canAdjudicate && <div className="space-y-2">
                      <label className="font-bold text-slate-700 block">Chọn kết luận trách nhiệm:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("shipper")}
                          disabled={actionSubmitting}
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
                            Chỉ kết luận khi có căn cứ xác định Chủ hàng vi phạm. Quyết toán theo khoản ký quỹ thực tế.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("driver")}
                          disabled={actionSubmitting}
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
                            Chỉ kết luận khi có căn cứ xác định Tài xế vi phạm thỏa thuận hoặc chính sách của đơn.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFaultSideSelect("none")}
                          disabled={actionSubmitting}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            adjudicationFaultSide === "none"
                              ? "border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-400"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Không bên nào có lỗi</span>
                            {adjudicationFaultSide === "none" && <Check className="w-4 h-4 text-teal-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Hiểu nhầm đã được đối chiếu hoặc bất khả kháng có minh chứng. Hoàn các khoản ký quỹ đang giữ.
                          </p>
                        </button>
                      </div>
                    </div>}

                    {/* Step 2: Reason / Notes */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block">
                        Căn cứ xử lý / Ghi chú thẩm định: <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        disabled={formReadOnly}
                        value={adjudicationReason}
                        onChange={(e) => setAdjudicationReason(e.target.value)}
                        placeholder="Ghi rõ nội dung báo cáo, lý do phản đối, ảnh và nhật ký đã đối chiếu; giải thích căn cứ kết luận của quản trị viên..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 text-xs"
                      />
                    </div>

                    {/* Step 3: Action Buttons based on status */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                      {/* If Open: Start Review */}
                      {reviewActions.includes("pending_review") && (
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
                      {reviewActions.includes("dismissed") && (
                        <>
                          <button
                            type="button"
                            onClick={handleDismissIncident}
                            disabled={actionSubmitting}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4 text-slate-600" />
                            Bác bỏ báo cáo
                          </button>

                          {canAdjudicate && <button
                            type="button"
                            onClick={handleConfirmFault}
                            disabled={actionSubmitting || previewLoading || !!previewError || !adjudicationFaultSide}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Gavel className="w-4 h-4" />
                            {adjudicationFaultSide === "none" ? "Kết luận không có lỗi" : settlementPreview?.executesOnReview ? "Kết luận & quyết toán ký quỹ" : "Ghi nhận kết luận"}
                          </button>}
                        </>
                      )}

                      {/* If Confirmed or Dismissed: Resolve / Close */}
                      {reviewActions.includes("resolved") && (
                        <button
                          type="button"
                          onClick={handleResolveIncident}
                          disabled={actionSubmitting}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Đóng hồ sơ
                        </button>
                      )}

                      {selectedIncident.status === "resolved" && (
                        <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                          Hồ sơ đã đóng. Lịch giải ngân khoản bồi thường vẫn được giữ nguyên.
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
                              <span className="font-bold text-slate-800">{incidentEventLabel(evt)}</span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">{incidentRoleLabel(evt.actorRole)}</span>
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
