"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import { 
  Search, Filter, Truck, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Eye, Loader, SlidersHorizontal,
  Calendar, RotateCcw, Package, ArrowUpRight, Banknote, Download,
  Sliders, RefreshCw, UserPlus, Lock, StickyNote, Ban, Send, ShieldCheck, X
} from "lucide-react";

export interface AdminInternalNote {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  type?: "info" | "warning" | "action";
}

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

interface Order {
  _id: string;
  orderCode: string;
  title: string;
  status:
    | "pending"
    | "searching_driver"
    | "waiting_driver"
    | "waiting_driver_acceptance"
    | "matched"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "in_transit"
    | "delivered"
    | "completed"
    | "cancelled"
    | string;
  offerPrice?: number;
  budget?: number;
  pickup?: { address: string };
  dropoff?: { address: string };
  shipperId?: UserInfo;
  driverId?: UserInfo;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  cancelledByRole?: string | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  timeoutAt?: string | null;
  cargoType?: string;
  weight?: number;
  adminNotes?: AdminInternalNote[];
  activeIncident?: {
    id: string;
    type: string;
    status: string;
    reporterRole: "driver" | "shipper" | "system" | "admin" | string;
    description?: string | null;
    createdAt?: string;
  } | null;
  createdAt: string;
}

type SortKey = "orderCode" | "title" | "cost" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const STATUS_SORT_ORDER: Record<string, number> = {
  pending: 1,
  searching_driver: 2,
  waiting_driver: 3,
  waiting_driver_acceptance: 4,
  matched: 5,
  accepted: 6,
  in_progress: 7,
  in_transit: 8,
  delivered: 9,
  completed: 10,
  rejected: 11,
  cancelled: 12,
};

const getOrderCost = (order: Order) => order.offerPrice || order.budget || 0;

const formatDateTime = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CANCEL_REASON_LABELS: Record<string, string> = {
  accident: "Xe hư hỏng / tai nạn",
  dispute: "Tranh chấp cước",
  blocked: "Đoạn đường không đi được",
  no_need: "Không còn nhu cầu vận chuyển",
  change_driver: "Muốn chọn tài xế khác",
  edit_order: "Thông tin đơn hàng cần chỉnh sửa",
  wait_too_long: "Thời gian chờ tài xế quá lâu",
  driver_rejected: "Tài xế từ chối nhận đơn",
  driver_timeout: "Tài xế không phản hồi trong thời gian quy định",
  changed_mind: "Người gửi thay đổi nhu cầu vận chuyển",
  wrong_info: "Thông tin đơn hàng chưa chính xác",
  found_other_driver: "Chủ hàng đã tìm được phương án vận chuyển khác",
  driver_unavailable: "Tài xế không thể tiếp tục thực hiện chuyến",
  vehicle_issue: "Phương tiện gặp sự cố",
  price_not_agreed: "Hai bên chưa thống nhất được giá cước",
  no_contact: "Không liên hệ được với bên còn lại",
  cannot_contact: "Không liên hệ được với bên còn lại",
  no_show: "Không có mặt tại điểm hẹn",
  weather: "Thời tiết không đảm bảo an toàn",
  emergency: "Có việc khẩn cấp",
  other: "Lý do khác",
  timeout: "Quá thời gian xác nhận đơn",
};

function getCancelledByDisplay(order: Order) {
  const roleLabel =
    order.cancelledByRole === "driver" ? "Tài xế" :
    order.cancelledByRole === "shipper" ? "Chủ hàng" :
    order.cancelledByRole === "system" ? "Hệ thống" :
    "";

  if (roleLabel && order.cancelledByName) return `${roleLabel} - ${order.cancelledByName}`;
  return order.cancelledByName || roleLabel;
}

function getCancelReasonText(order: Order) {
  const reason = order.cancellationReason || order.rejectionReason;
  if (!reason && order.timeoutAt) return "Quá thời gian xác nhận đơn";
  if (!reason) return "";

  const normalizedReason = reason.trim().toLowerCase();
  const translatedReason = CANCEL_REASON_LABELS[normalizedReason] || reason;
  const note = order.cancellationReason && order.rejectionReason && order.rejectionReason !== order.cancellationReason
    ? order.rejectionReason.trim()
    : "";

  return note ? `${translatedReason}. Ghi chú: ${note}` : translatedReason;
}


export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  cargo_mismatch: "Hàng sai tải / Sai quy cách",
  inaccessible_pickup: "Điểm lấy hàng không vào được / Cấm tải",
  unreachable_shipper: "Không liên hệ được chủ hàng",
  force_majeure: "Sự cố bất khả kháng / Thiên tai",
  refused_delivery: "Người nhận từ chối nhận hàng",
  unsafe_pickup: "Điểm bốc hàng không an toàn",
  other: "Sự cố phát sinh khác",
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: "Mới gửi (Chờ xem xét)",
  pending_review: "Đang phân giải tranh chấp",
  confirmed: "Đã xác nhận có sự cố",
  resolved: "Đã xử lý thỏa đáng",
  dismissed: "Đã bác bỏ khiếu nại",
  cancelled: "Đã hủy",
};

export interface StatusConfig {
  label: string;
  detail: string;
  color: string;
  icon: React.ElementType;
  animate?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  searching_driver: {
    label: "Đang tìm tài xế",
    detail: "Đang quét và phát tín hiệu tìm xe rỗng xung quanh",
    color: "text-amber-800 bg-amber-50 border-amber-200",
    icon: Loader,
    animate: true,
  },
  waiting_driver: {
    label: "Chờ tài xế xác nhận",
    detail: "Đã ghép chuyến, chờ tài xế xác nhận cuốc xe",
    color: "text-purple-800 bg-purple-50 border-purple-200",
    icon: Clock,
  },
  waiting_driver_acceptance: {
    label: "Chờ tài xế xác nhận",
    detail: "Đang chờ tài xế bấm chấp nhận cuốc xe",
    color: "text-purple-800 bg-purple-50 border-purple-200",
    icon: Clock,
  },
  accepted: {
    label: "Đã tìm được tài xế",
    detail: "Tài xế đã nhận đơn, đang di chuyển đến điểm bốc hàng",
    color: "text-indigo-800 bg-indigo-50 border-indigo-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Tài xế từ chối nhận",
    detail: "Tài xế từ chối, hệ thống đang tìm xe thay thế",
    color: "text-rose-800 bg-rose-50 border-rose-200",
    icon: XCircle,
  },
  in_progress: {
    label: "Tài xế đang di chuyển",
    detail: "Đang trên lộ trình vận chuyển hàng đến điểm trả",
    color: "text-blue-800 bg-blue-50 border-blue-200",
    icon: Truck,
  },
  in_transit: {
    label: "Tài xế đang di chuyển",
    detail: "Xe đang lăn bánh chở hàng trên tuyến",
    color: "text-blue-800 bg-blue-50 border-blue-200",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao hàng (Chờ chủ hàng xác nhận)",
    detail: "Đã hạ hàng tại điểm trả, chờ chủ hàng nghiệm thu",
    color: "text-teal-800 bg-teal-50 border-teal-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Đã hoàn thành",
    detail: "Chủ hàng đã xác nhận, đối soát cọc & cước xong 100%",
    color: "text-emerald-900 bg-emerald-100 border-emerald-300 font-extrabold",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy vận đơn",
    detail: "Chuyến xe đã bị hủy trên hệ thống",
    color: "text-red-800 bg-red-50 border-red-200",
    icon: XCircle,
  },
};

function AdminOrdersContent() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [overviewTotalOrders, setOverviewTotalOrders] = useState<number | null>(null);
 
  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // TMS Action Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeActionTab, setActiveActionTab] = useState<"none" | "status" | "reassign" | "escrow" | "notes" | "cancel">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingOrder, setIsSyncingOrder] = useState(false);

  // TMS form fields
  const [targetStatus, setTargetStatus] = useState<string>("in_progress");
  const [statusNote, setStatusNote] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverVehicle, setNewDriverVehicle] = useState("");
  const [reassignMode, setReassignMode] = useState<"assign" | "reopen">("assign");
  const [reassignReason, setReassignReason] = useState("");
  const [escrowActionType, setEscrowActionType] = useState<"disburse" | "freeze" | "refund">("disburse");
  const [escrowActionReason, setEscrowActionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState<AdminInternalNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<"info" | "warning" | "action">("info");
  const [cancelReasonChoice, setCancelReasonChoice] = useState("Xe hư hỏng / tai nạn kỹ thuật");
  const [cancelReasonDetail, setCancelReasonDetail] = useState("");
  const [releaseDriverChoice, setReleaseDriverChoice] = useState(true);

  const handleOpenOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setTargetStatus(order.status);
    setActiveActionTab("none");
    setStatusNote("");
    setNewDriverName("");
    setNewDriverPhone("");
    setNewDriverVehicle("");
    setReassignReason("");
    setEscrowActionReason("");
    setCancelReasonDetail("");
    setAdminNotes(order.adminNotes || []);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${order._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.order) {
          const fetched = data.data.order;
          setSelectedOrder((prev) => prev ? { ...prev, ...fetched } : fetched);
          if (Array.isArray(fetched.adminNotes)) {
            setAdminNotes(fetched.adminNotes);
          }
        }
      }
    } catch {
      // Best-effort
    }
  };

  const handleSyncSelectedOrder = async () => {
    if (!selectedOrder) return;
    setIsSyncingOrder(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.order) {
          const updated = data.data.order;
          setSelectedOrder(updated);
          setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));
          if (Array.isArray(updated.adminNotes)) {
            setAdminNotes(updated.adminNotes);
          }
        }
      }
      toast.success("Đã đồng bộ dữ liệu vận đơn thời gian thực");
    } catch {
      toast.error("Không thể kết nối máy chủ");
    } finally {
      setIsSyncingOrder(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          note: statusNote.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.data?.order || { ...selectedOrder, status: targetStatus };
        setSelectedOrder((prev) => prev ? { ...prev, ...updated } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
        if (Array.isArray(updated.adminNotes)) {
          setAdminNotes(updated.adminNotes);
        }
        toast.success(`Đã chuyển trạng thái sang "${STATUS_MAP[targetStatus]?.label || targetStatus}"`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSelectedOrder((prev) => prev ? { ...prev, status: targetStatus } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, status: targetStatus } : o)));
        toast.warning(errData.message || "Đã cập nhật trạng thái đơn (chế độ cục bộ)");
      }
    } catch {
      setSelectedOrder((prev) => prev ? { ...prev, status: targetStatus } : null);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, status: targetStatus } : o)));
      toast.warning("Đã cập nhật trạng thái đơn (chế độ ngoại tuyến)");
    } finally {
      setIsSubmitting(false);
      setStatusNote("");
      setActiveActionTab("none");
    }
  };

  const handleConfirmReassignDriver = async () => {
    if (!selectedOrder) return;
    if (reassignMode === "assign" && !newDriverName.trim()) {
      toast.warning("Vui lòng nhập họ và tên tài xế để chỉ định");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}/assign-driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: reassignMode,
          driverName: newDriverName.trim() || undefined,
          driverPhone: newDriverPhone.trim() || undefined,
          vehicle: newDriverVehicle.trim() || undefined,
          reason: reassignReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.data?.order || selectedOrder;
        setSelectedOrder((prev) => prev ? { ...prev, ...updated } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
        if (Array.isArray(updated.adminNotes)) {
          setAdminNotes(updated.adminNotes);
        }
        toast.success(reassignMode === "reopen" ? "Đã mở lại tìm kiếm tài xế trên sàn" : `Đã chỉ định tài xế: ${newDriverName}`);
      } else {
        const updatedDriver = reassignMode === "reopen" ? undefined : { name: newDriverName, phone: newDriverPhone || "---", email: "" };
        const newStatus = reassignMode === "reopen" ? "searching_driver" : "accepted";
        setSelectedOrder((prev) => prev ? { ...prev, driverId: updatedDriver, status: newStatus } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, driverId: updatedDriver, status: newStatus } : o)));
        toast.warning("Đã cập nhật điều phối (chế độ cục bộ)");
      }
    } catch {
      const updatedDriver = reassignMode === "reopen" ? undefined : { name: newDriverName, phone: newDriverPhone || "---", email: "" };
      const newStatus = reassignMode === "reopen" ? "searching_driver" : "accepted";
      setSelectedOrder((prev) => prev ? { ...prev, driverId: updatedDriver, status: newStatus } : null);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, driverId: updatedDriver, status: newStatus } : o)));
      toast.warning("Đã cập nhật điều phối (chế độ ngoại tuyến)");
    } finally {
      setIsSubmitting(false);
      setNewDriverName("");
      setNewDriverPhone("");
      setNewDriverVehicle("");
      setReassignReason("");
      setActiveActionTab("none");
    }
  };

  const handleConfirmEscrowAction = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: escrowActionType,
          reason: escrowActionReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.data?.order || selectedOrder;
        setSelectedOrder((prev) => prev ? { ...prev, ...updated } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
        if (Array.isArray(updated.adminNotes)) {
          setAdminNotes(updated.adminNotes);
        }
        toast.success(
          escrowActionType === "disburse"
            ? "Đã duyệt giải ngân 95% cước phí qua MB Bank"
            : escrowActionType === "freeze"
            ? "Đã đóng băng ký quỹ MB Bank do phát sinh tranh chấp"
            : "Đã gửi lệnh hoàn cước 100% cho chủ hàng"
        );
      } else {
        const newStatus = escrowActionType === "disburse" ? "completed" : escrowActionType === "refund" ? "cancelled" : selectedOrder.status;
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, status: newStatus } : o)));
        toast.warning("Đã thực thi nghiệp vụ ký quỹ (chế độ cục bộ)");
      }
    } catch {
      const newStatus = escrowActionType === "disburse" ? "completed" : escrowActionType === "refund" ? "cancelled" : selectedOrder.status;
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, status: newStatus } : o)));
      toast.warning("Đã thực thi nghiệp vụ ký quỹ (chế độ ngoại tuyến)");
    } finally {
      setIsSubmitting(false);
      setEscrowActionReason("");
      setActiveActionTab("none");
    }
  };

  const handleAddAdminNote = async () => {
    if (!selectedOrder || !newNoteContent.trim()) {
      toast.error("Vui lòng nhập nội dung ghi chú");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent.trim(),
          type: newNoteType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data?.adminNotes)) {
          setAdminNotes(data.data.adminNotes);
        } else if (data.data?.note) {
          setAdminNotes((prev) => [data.data.note, ...prev]);
        }
        toast.success("Đã lưu ghi chú nội bộ thành công");
      } else {
        const note: AdminInternalNote = {
          id: `n-${Date.now()}`,
          author: "Quản trị viên TMS",
          role: "Admin điều hành",
          content: newNoteContent.trim(),
          createdAt: new Date().toISOString(),
          type: newNoteType,
        };
        setAdminNotes((prev) => [note, ...prev]);
        toast.warning("Đã lưu ghi chú vào phiên làm việc");
      }
    } catch {
      const note: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Quản trị viên TMS",
        role: "Admin điều hành",
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString(),
        type: newNoteType,
      };
      setAdminNotes((prev) => [note, ...prev]);
      toast.warning("Đã lưu ghi chú vào phiên làm việc");
    } finally {
      setIsSubmitting(false);
      setNewNoteContent("");
    }
  };

  const handleConfirmEmergencyCancel = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${selectedOrder._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReasonChoice,
          detail: cancelReasonDetail.trim() || undefined,
          releaseDriver: releaseDriverChoice,
          refundEscrow: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.data?.order || { ...selectedOrder, status: "cancelled" };
        setSelectedOrder((prev) => prev ? { ...prev, ...updated } : null);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
        if (Array.isArray(updated.adminNotes)) {
          setAdminNotes(updated.adminNotes);
        }
        if (data.data?.driverFreed) {
          toast.success("Vận đơn đã hủy & ĐÃ GIẢI PHÓNG TÀI XẾ để nhận chuyến mới!");
        } else {
          toast.warning("Vận đơn đã được chuyển sang trạng thái Đã hủy đơn");
        }
      } else {
        const fullReason = `${cancelReasonChoice}${cancelReasonDetail ? `. Chi tiết: ${cancelReasonDetail}` : ""}`;
        const updated = {
          ...selectedOrder,
          status: "cancelled",
          cancellationReason: fullReason,
          cancelledByName: "Quản trị viên hệ thống",
          cancelledByRole: "admin",
          cancelledAt: new Date().toISOString(),
        };
        setSelectedOrder(updated);
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
        toast.warning("Vận đơn đã được hủy (chế độ cục bộ)");
      }
    } catch {
      const fullReason = `${cancelReasonChoice}${cancelReasonDetail ? `. Chi tiết: ${cancelReasonDetail}` : ""}`;
      const updated = {
        ...selectedOrder,
        status: "cancelled",
        cancellationReason: fullReason,
        cancelledByName: "Quản trị viên hệ thống",
        cancelledByRole: "admin",
        cancelledAt: new Date().toISOString(),
      };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updated } : o)));
      toast.warning("Vận đơn đã được hủy (chế độ ngoại tuyến)");
    } finally {
      setIsSubmitting(false);
      setCancelReasonDetail("");
      setActiveActionTab("none");
    }
  };

  // Fetch overview metrics on mount if available
  useEffect(() => {
    fetchWithAuth(`${API_BASE}/admin/users/overview`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.metrics?.totalOrders) {
          setOverviewTotalOrders(data.data.metrics.totalOrders);
        }
      })
      .catch(() => null);
  }, []);

  // Computed KPI Metrics
  const totalOrdersCount = overviewTotalOrders || pagination.total || orders.length;

  const inTransitOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "in_progress" ||
        o.status === "in_transit" ||
        (o.status as any) === "accepted" ||
        o.status === "matched"
    ).length;
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "searching_driver" ||
        (o.status as any) === "waiting_driver" ||
        (o.status as any) === "waiting_driver_acceptance" ||
        o.status === "pending"
    ).length;
  }, [orders]);

  const totalGmvAmount = useMemo(() => {
    return orders.reduce((sum, o) => sum + getOrderCost(o), 0);
  }, [orders]);

  const formatVND = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ ₫`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} tr ₫`;
    return `${val.toLocaleString("vi-VN")} ₫`;
  };

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    setCurrentPage(1);

    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      const formatted = formatDate(today);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "yesterday") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const formatted = formatDate(yest);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      return;
    }
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const fetchOrders = async () => {
    setLoading(true);

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {})
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
        setIsOffline(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("API error:", errData.message || "Failed to fetch orders");
        setOrders([]);
        setPagination({ page: 1, limit, total: 0, pages: 1 });
        setIsOffline(false);
      }
    } catch (err: unknown) {
      console.warn("Backend connection error:", err);
      setOrders([]);
      setPagination({ page: 1, limit, total: 0, pages: 1 });
      setIsOffline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, statusFilter, startDate, endDate, limit]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;

      if (sortConfig.key === "cost") {
        comparison = getOrderCost(a) - getOrderCost(b);
      } else if (sortConfig.key === "createdAt") {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortConfig.key === "status") {
        const aStatus = STATUS_SORT_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER;
        const bStatus = STATUS_SORT_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER;
        comparison = aStatus - bStatus || String(a.status).localeCompare(String(b.status), "vi");
      } else {
        comparison = String(a[sortConfig.key] || "").localeCompare(String(b[sortConfig.key] || ""), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [orders, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleExportCSV = () => {
    if (sortedOrders.length === 0) {
      toast.warning("Không có dữ liệu vận đơn nào phù hợp để xuất báo cáo!", {
        title: "Xuất dữ liệu Excel/CSV",
      });
      return;
    }

    // CSV Headers
    const headers = [
      "STT",
      "Mã Vận Đơn",
      "Tên Hàng Hóa",
      "Trạng Thái",
      "Chi Phí (VNĐ)",
      "Điểm Bốc Hàng",
      "Điểm Giao Hàng",
      "Chủ Hàng",
      "SĐT Chủ Hàng",
      "Email Chủ Hàng",
      "Tài Xế",
      "SĐT Tài Xế",
      "Email Tài Xế",
      "Ngày Tạo",
      "Lý Do Hủy",
      "Bên Hủy"
    ];

    // Helper to safely format CSV cells
    const formatCell = (val?: string | number | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedOrders.map((order, idx) => {
      const statusLabel = STATUS_MAP[order.status]?.label || order.status;
      const cost = getOrderCost(order);
      const cancelReason = order.status === "cancelled" ? getCancelReasonText(order) : "";
      const cancelledBy = order.status === "cancelled" ? getCancelledByDisplay(order) : "";

      return [
        idx + 1,
        formatCell(order.orderCode),
        formatCell(order.title),
        formatCell(statusLabel),
        cost,
        formatCell(order.pickup?.address),
        formatCell(order.dropoff?.address),
        formatCell(order.shipperId?.name),
        formatCell(order.shipperId?.phone),
        formatCell(order.shipperId?.email),
        formatCell(order.driverId?.name),
        formatCell(order.driverId?.phone),
        formatCell(order.driverId?.email),
        formatCell(formatDateTime(order.createdAt)),
        formatCell(cancelReason),
        formatCell(cancelledBy),
      ].join(",");
    });

    // Add UTF-8 BOM (\uFEFF) so Excel opens UTF-8 Vietnamese perfectly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_van_don_txepro_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất thành công ${sortedOrders.length} vận đơn sang tệp Excel/CSV!`, {
      title: "Xuất dữ liệu thành công",
    });
  };

  const renderSortableHeader = (sortKey: SortKey, label: string) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 -ml-1 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors cursor-pointer"
        title={`Sắp xếp ${label} ${direction === "asc" ? "giảm dần" : "tăng dần"}`}
      >
        <span>{label}</span>
        <span className="flex flex-col -space-y-1">
          <ChevronUp className={`h-3 w-3 ${isActive && direction === "asc" ? "text-primary-600" : "text-slate-300"}`} />
          <ChevronDown className={`h-3 w-3 ${isActive && direction === "desc" ? "text-primary-600" : "text-slate-300"}`} />
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Hệ thống đang ở chế độ Offline. Dữ liệu hiển thị bên dưới là dữ liệu giả lập.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Vận Đơn</h1>
          <p className="text-slate-400 text-xs mt-1">Giám sát trạng thái di chuyển, lộ trình vận tải và giá trị các đơn đặt xe.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex-shrink-0"
            title="Tải bảng kê vận đơn định dạng Excel / CSV (chuẩn UTF-8 tiếng Việt)"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV</span>
            <span className="bg-emerald-700/60 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
              {sortedOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Order KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {[
          {
            id: "all",
            label: "Tổng Vận Đơn",
            value: totalOrdersCount.toLocaleString(),
            subValue: "Toàn sàn hệ thống",
            badge: "Tất cả",
            trendUp: true,
            icon: Package,
            gradient: "from-blue-500 to-indigo-600",
            bgLight: "bg-blue-50",
            iconColor: "text-blue-600",
            isActive: statusFilter === "",
            hint: "Xem tất cả",
            onClick: () => {
              setStatusFilter("");
              setCurrentPage(1);
            },
          },
          {
            id: "in_progress",
            label: "Đang Vận Chuyển",
            value: inTransitOrdersCount.toLocaleString(),
            subValue: "Giám sát GPS trực tiếp",
            badge: "Đang lăn bánh",
            trendUp: true,
            icon: Truck,
            gradient: "from-emerald-500 to-teal-600",
            bgLight: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isActive: statusFilter === "in_progress" || statusFilter === "in_transit",
            hint: "Lọc xe đang chạy",
            onClick: () => {
              setStatusFilter(statusFilter === "in_progress" ? "" : "in_progress");
              setCurrentPage(1);
            },
          },
          {
            id: "searching_driver",
            label: "Đang Chờ Tài Xế",
            value: pendingOrdersCount.toLocaleString(),
            subValue: "Cần điều phối nhận chuyến",
            badge: "Chờ nhận chuyến",
            trendUp: false,
            icon: Clock,
            gradient: "from-amber-500 to-orange-600",
            bgLight: "bg-amber-50",
            iconColor: "text-amber-600",
            isActive: statusFilter === "searching_driver" || statusFilter === "waiting_driver",
            hint: "Lọc đơn chờ xe",
            onClick: () => {
              setStatusFilter(statusFilter === "searching_driver" ? "" : "searching_driver");
              setCurrentPage(1);
            },
          },
          {
            id: "gmv",
            label: "Tổng Cước Phí (GMV)",
            value: formatVND(totalGmvAmount),
            subValue: "Bảo chứng ký quỹ MB Bank",
            badge: "Doanh số",
            trendUp: true,
            icon: Banknote,
            gradient: "from-violet-500 to-purple-600",
            bgLight: "bg-violet-50",
            iconColor: "text-violet-600",
            isActive: sortConfig?.key === "cost",
            hint: "Xếp theo cước",
            onClick: () => {
              handleSort("cost");
            },
          },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className={`text-left bg-white rounded-2xl border p-4 sm:p-5 lg:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group min-w-0 cursor-pointer ${
              card.isActive
                ? "border-primary-500 ring-2 ring-primary-500/20 shadow-primary-500/5 bg-primary-50/10"
                : "border-slate-200/60 hover:border-slate-300"
            }`}
          >
            <div
              className={`absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[60px] group-hover:opacity-10 transition-opacity pointer-events-none`}
            />
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 ${card.bgLight} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}
              >
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                  card.isActive
                    ? "bg-primary-600 text-white"
                    : card.trendUp
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-amber-700 bg-amber-50"
                }`}
              >
                {card.isActive && <span>✓ Đang chọn</span>}
                {!card.isActive && card.trendUp && (
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                )}
                {!card.isActive && <span>{card.badge}</span>}
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
              {card.value}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-semibold text-slate-500 truncate">{card.label}</p>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary-600 transition-colors">
                {card.hint} →
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              {card.subValue}
            </p>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã vận đơn, tên hàng, địa điểm giao nhận..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filters */}
          <div className="relative w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="has_incident">⚠️ Có sự cố đang báo cáo (Chủ hàng / Tài xế)</option>
              <option value="searching_driver">Đang tìm tài xế</option>
              <option value="waiting_driver">Chờ tài xế xác nhận</option>
              <option value="accepted">Đã tìm được tài xế</option>
              <option value="in_progress">Tài xế đang di chuyển</option>
              <option value="delivered">Đã giao hàng (Chờ chủ hàng xác nhận)</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="rejected">Tài xế từ chối nhận</option>
              <option value="cancelled">Đã hủy vận đơn</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Page Size Select */}
          <div className="relative w-full md:w-44">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
              <option value={100}>100 dòng / trang</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <span className="text-slate-500 font-bold flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>Khoảng ngày:</span>
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay" },
              { id: "yesterday", label: "Hôm qua" },
              { id: "7days", label: "7 ngày qua" },
              { id: "30days", label: "30 ngày qua" },
              { id: "this_month", label: "Tháng này" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  datePreset === p.id && (p.id === "all" || (startDate && endDate))
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>
            <span className="text-slate-400 font-bold hidden sm:inline">-</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Xóa lọc theo ngày"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách đơn đặt xe...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Search className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs">Thử điều chỉnh lại từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách đơn hàng</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-[120px]">
                      {renderSortableHeader("orderCode", "Mã Đơn")}
                    </th>
                    <th className="py-4 px-6 min-w-[160px]">
                      {renderSortableHeader("title", "Tên Hàng Hóa")}
                    </th>
                    <th className="py-4 px-6 min-w-[220px]">Lộ Trình (Điểm Đi / Điểm Đến)</th>
                    <th className="py-4 px-6 min-w-[180px]">Chủ Hàng / Tài Xế</th>
                    <th className="py-4 px-6 min-w-[110px]">
                      {renderSortableHeader("cost", "Chi Phí")}
                    </th>
                    <th className="py-4 px-6 min-w-[140px]">
                      {renderSortableHeader("createdAt", "Ngày Tạo")}
                    </th>
                    <th className="py-4 px-6 min-w-[150px]">
                      {renderSortableHeader("status", "Trạng Thái")}
                    </th>
                    <th className="py-4 px-6 text-right w-[150px]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {sortedOrders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    const cancelReason = order.status === "cancelled" ? getCancelReasonText(order) : "";
                    const cancelledBy = order.status === "cancelled" ? getCancelledByDisplay(order) : "";
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Code */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetail(order)}
                            className="font-bold text-primary-600 text-xs hover:underline cursor-pointer text-left"
                            title="Mở thao tác TMS & chi tiết vận đơn"
                          >
                            {order.orderCode}
                          </button>
                        </td>

                        {/* Title */}
                        <td className="py-4.5 px-6 min-w-[160px] max-w-xs">
                          <span className="font-bold text-slate-800 line-clamp-2">{order.title}</span>
                        </td>

                        {/* Route */}
                        <td className="py-4.5 px-6 min-w-[220px] max-w-xs">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-semibold text-slate-700 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">TỪ:</span>{order.pickup?.address || "---"}</p>
                            <p className="font-semibold text-slate-600 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">ĐẾN:</span>{order.dropoff?.address || "---"}</p>
                          </div>
                        </td>

                        {/* Parties */}
                        <td className="py-4.5 px-6 min-w-[180px] text-xs font-semibold">
                          <div className="space-y-0.5">
                            <p className="text-slate-700 truncate"><span className="text-blue-500 font-bold text-[9px] uppercase mr-1">Shipper:</span>{order.shipperId?.name || "---"}</p>
                            <p className="text-slate-600 truncate"><span className="text-emerald-500 font-bold text-[9px] uppercase mr-1">Driver:</span>{order.driverId?.name || "---"}</p>
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="py-4.5 px-6 font-bold text-slate-800 text-xs whitespace-nowrap">
                          {(getOrderCost(order) / 1000).toLocaleString()}K ₫
                        </td>

                        {/* Created At */}
                        <td className="py-4.5 px-6 text-xs font-bold text-slate-600 whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-4.5 px-6 min-w-[220px]">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                              <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusInfo.animate ? "animate-spin text-amber-600" : ""}`} />
                              <span>{statusInfo.label}</span>
                            </span>
                            <p className="text-[11px] font-medium text-slate-500 leading-snug">
                              {statusInfo.detail}
                            </p>

                            {/* Active Incident Alert: Tài xế hoặc Chủ hàng đang báo cáo sự cố */}
                            {order.activeIncident && (
                              <div className={`p-2.5 rounded-xl border text-xs shadow-2xs mt-1.5 ${
                                order.activeIncident.reporterRole === "driver"
                                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                                  : "bg-rose-50/90 border-rose-300 text-rose-950"
                              }`}>
                                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                                    order.activeIncident.reporterRole === "driver" ? "text-amber-600 animate-pulse" : "text-rose-600 animate-pulse"
                                  }`} />
                                  <span className={order.activeIncident.reporterRole === "driver" ? "text-amber-900" : "text-rose-900"}>
                                    {order.activeIncident.reporterRole === "driver"
                                      ? "⚠️ Tài xế đang báo cáo sự cố"
                                      : "⚠️ Chủ hàng đang báo cáo sự cố"}
                                  </span>
                                </div>
                                <p className="font-bold text-[11px] mt-1 text-slate-800">
                                  {INCIDENT_TYPE_LABELS[order.activeIncident.type] || order.activeIncident.type}
                                </p>
                                {order.activeIncident.description && (
                                  <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2 italic font-normal">
                                    "{order.activeIncident.description}"
                                  </p>
                                )}
                                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-slate-200/70">
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {INCIDENT_STATUS_LABELS[order.activeIncident.status] || order.activeIncident.status}
                                  </span>
                                  <Link
                                    href={`/admin/incidents?id=${order.activeIncident.id}`}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5 ml-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Xử lý ngay →
                                  </Link>
                                </div>
                              </div>
                            )}

                            {cancelReason && (
                              <p className="max-w-xs text-[11px] font-semibold leading-relaxed text-red-600 whitespace-normal">
                                Lý do: {cancelReason}
                              </p>
                            )}
                            {cancelledBy && (
                              <p className="max-w-xs text-[10px] font-bold uppercase tracking-wide text-slate-400 whitespace-normal">
                                Bên hủy: {cancelledBy}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenOrderDetail(order)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer border border-indigo-200/60 shadow-2xs active:scale-95"
                              title="Mở Bộ Công Cụ Thao Tác Nhanh Quản Trị Viên (TMS Operations)"
                            >
                              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Thao tác TMS</span>
                            </button>
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="p-2 inline-block text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                              title="Xem toàn trang chi tiết vận đơn"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} vận đơn)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- ORDER DETAIL & TMS OPERATIONS MODAL --- */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl p-5 sm:p-7 relative shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Chi Tiết Vận Đơn: <span className="text-primary-600 font-mono">{selectedOrder.orderCode}</span>
                    </h3>
                    {(() => {
                      const statusInfo = STATUS_MAP[selectedOrder.status] || { label: selectedOrder.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">Khởi tạo lúc: {formatDateTime(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 flex-1 pr-1">
              {/* Active Incident Warning in TMS Modal */}
              {selectedOrder.activeIncident && (
                <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                  selectedOrder.activeIncident.reporterRole === "driver"
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-rose-50 border-rose-300 text-rose-950"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      selectedOrder.activeIncident.reporterRole === "driver" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs uppercase tracking-wider">
                          {selectedOrder.activeIncident.reporterRole === "driver" ? "⚠️ TÀI XẾ BÁO CÁO SỰ CỐ" : "⚠️ CHỦ HÀNG BÁO CÁO SỰ CỐ"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                          {INCIDENT_STATUS_LABELS[selectedOrder.activeIncident.status] || selectedOrder.activeIncident.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {INCIDENT_TYPE_LABELS[selectedOrder.activeIncident.type] || selectedOrder.activeIncident.type}
                      </p>
                      {selectedOrder.activeIncident.description && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">
                          "{selectedOrder.activeIncident.description}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/incidents?id=${selectedOrder.activeIncident.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 shadow-sm"
                  >
                    <span>Mở Trung Tâm Xử Lý Sự Cố</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* TMS OPERATIONS TOOLBAR */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-wider uppercase text-white">
                        Bộ Công Cụ Thao Tác Nhanh Quản Trị Viên (TMS Operations)
                      </h4>
                      <p className="text-slate-400 text-[11px]">Can thiệp điều vận thời gian thực và quản trị bảo chứng MB Bank</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 w-fit">
                    ADMIN DISPATCH CONTROL
                  </span>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {/* Sync */}
                  <button
                    type="button"
                    onClick={handleSyncSelectedOrder}
                    disabled={isSyncingOrder}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 cursor-pointer disabled:opacity-50"
                    title="Đồng bộ dữ liệu thời gian thực"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrder ? "animate-spin text-primary-400" : "text-slate-300"}`} />
                    <span>{isSyncingOrder ? "Đang đồng bộ..." : "Làm mới"}</span>
                  </button>

                  {/* Status */}
                  <button
                    type="button"
                    onClick={() => setActiveActionTab(activeActionTab === "status" ? "none" : "status")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeActionTab === "status"
                        ? "bg-indigo-500 text-white shadow-sm ring-2 ring-indigo-300"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Chuyển trạng thái</span>
                  </button>

                  {/* Reassign Driver */}
                  <button
                    type="button"
                    onClick={() => setActiveActionTab(activeActionTab === "reassign" ? "none" : "reassign")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      activeActionTab === "reassign"
                        ? "bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300"
                        : "bg-white/10 hover:bg-white/15 text-slate-200 border-white/10"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Điều phối tài xế</span>
                  </button>

                  {/* Escrow MB Bank */}
                  <button
                    type="button"
                    onClick={() => setActiveActionTab(activeActionTab === "escrow" ? "none" : "escrow")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      activeActionTab === "escrow"
                        ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300"
                        : "bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ký quỹ MB Bank</span>
                  </button>

                  {/* Notes */}
                  <button
                    type="button"
                    onClick={() => setActiveActionTab(activeActionTab === "notes" ? "none" : "notes")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer relative ${
                      activeActionTab === "notes"
                        ? "bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300"
                        : "bg-white/10 hover:bg-white/15 text-slate-200 border-white/10"
                    }`}
                  >
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ghi chú nội bộ</span>
                    {adminNotes.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                        {adminNotes.length}
                      </span>
                    )}
                  </button>

                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={() => setActiveActionTab(activeActionTab === "cancel" ? "none" : "cancel")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      activeActionTab === "cancel"
                        ? "bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300"
                        : "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hủy đơn</span>
                  </button>
                </div>
              </div>

              {/* ACTION FORM PANELS */}
              {activeActionTab === "status" && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" /> Chuyển Trạng Thái Vận Đơn
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Chọn trạng thái mới</label>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
                      >
                        <option value="searching_driver">Đang tìm tài xế (Quét xe xung quanh)</option>
                        <option value="waiting_driver_acceptance">Chờ tài xế xác nhận cuốc xe</option>
                        <option value="accepted">Đã tìm được tài xế (Đang đến điểm bốc)</option>
                        <option value="in_progress">Tài xế đang di chuyển (Vận chuyển hàng)</option>
                        <option value="delivered">Đã giao hàng (Chờ chủ hàng xác nhận nghiệm thu)</option>
                        <option value="completed">Đã hoàn thành (Chủ hàng đã xác nhận & đối soát xong)</option>
                        <option value="cancelled">Đã hủy vận đơn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Lý do điều chuyển (Audit log)</label>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Ví dụ: Đã nhận được xác nhận từ khách hàng..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab("none")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmStatusChange}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting && <Loader className="w-3 h-3 animate-spin" />}
                      <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận chuyển trạng thái"}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeActionTab === "reassign" && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-600" /> Điều Phối & Chỉ Định Tài Xế
                  </h5>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-blue-100/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReassignMode("assign")}
                      className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        reassignMode === "assign" ? "bg-white text-blue-900 shadow-xs" : "text-blue-700 hover:text-blue-950"
                      }`}
                    >
                      Chỉ định tài xế trực tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => setReassignMode("reopen")}
                      className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        reassignMode === "reopen" ? "bg-white text-blue-900 shadow-xs" : "text-blue-700 hover:text-blue-950"
                      }`}
                    >
                      Mở lại tìm kiếm trên sàn
                    </button>
                  </div>

                  {reassignMode === "assign" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Họ tên tài xế mới *</label>
                        <input
                          type="text"
                          value={newDriverName}
                          onChange={(e) => setNewDriverName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn Hùng"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={newDriverPhone}
                          onChange={(e) => setNewDriverPhone(e.target.value)}
                          placeholder="09xx xxx xxx"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Biển số / Loại xe</label>
                        <input
                          type="text"
                          value={newDriverVehicle}
                          onChange={(e) => setNewDriverVehicle(e.target.value)}
                          placeholder="51D-987.65 (15 tấn)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-blue-800 bg-blue-100/50 p-2.5 rounded-xl text-[11px]">
                      Hệ thống sẽ hủy ghép nối với tài xế hiện tại và đưa đơn hàng trở lại trạng thái tìm kiếm tài xế trên sàn toàn hệ thống.
                    </p>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Lý do điều phối</label>
                    <input
                      type="text"
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      placeholder="Ví dụ: Tài xế gặp sự cố, chủ hàng yêu cầu đổi phương tiện..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab("none")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReassignDriver}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting && <Loader className="w-3 h-3 animate-spin" />}
                      <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận điều phối"}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeActionTab === "escrow" && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Nghiệp Vụ Ký Quỹ & Bảo Chứng MB Bank
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-emerald-100/50 rounded-xl">
                    <div>
                      <span className="text-slate-500 font-medium">Mã GD MB Bank:</span>
                      <p className="font-mono font-bold text-slate-900">MB-TXE-{selectedOrder.orderCode}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Cước phí bảo chứng:</span>
                      <p className="font-bold text-blue-700">{getOrderCost(selectedOrder).toLocaleString()} ₫</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Tài xế thực nhận (95%):</span>
                      <p className="font-bold text-emerald-700">{(Math.round(getOrderCost(selectedOrder) * 0.95)).toLocaleString()} ₫</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      escrowActionType === "disburse" ? "bg-white border-emerald-500 text-emerald-900 shadow-2xs" : "bg-emerald-50/50 border-emerald-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="escrowActionType"
                        checked={escrowActionType === "disburse"}
                        onChange={() => setEscrowActionType("disburse")}
                      />
                      <div>
                        <p className="font-bold">Giải ngân ngay cho Tài xế (Disburse)</p>
                        <p className="text-[11px] opacity-80">Phát lệnh chuyển 95% cước phí vào tài khoản MB Bank của tài xế</p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      escrowActionType === "freeze" ? "bg-white border-amber-500 text-amber-900 shadow-2xs" : "bg-emerald-50/50 border-emerald-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="escrowActionType"
                        checked={escrowActionType === "freeze"}
                        onChange={() => setEscrowActionType("freeze")}
                      />
                      <div>
                        <p className="font-bold">Đóng băng tranh chấp (Freeze Escrow)</p>
                        <p className="text-[11px] opacity-80">Khóa tiền tạm thời tại MB Bank, chờ biên bản giám định hư hỏng</p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      escrowActionType === "refund" ? "bg-white border-rose-500 text-rose-900 shadow-2xs" : "bg-emerald-50/50 border-emerald-200 text-slate-700"
                    }`}>
                      <input
                        type="radio"
                        name="escrowActionType"
                        checked={escrowActionType === "refund"}
                        onChange={() => setEscrowActionType("refund")}
                      />
                      <div>
                        <p className="font-bold">Hoàn tiền 100% cho Chủ hàng (Refund)</p>
                        <p className="text-[11px] opacity-80">Hoàn lại tiền cước bảo chứng vào ví/tài khoản của chủ hàng</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ghi chú xác nhận nghiệp vụ</label>
                    <input
                      type="text"
                      value={escrowActionReason}
                      onChange={(e) => setEscrowActionReason(e.target.value)}
                      placeholder="Ví dụ: Phê duyệt theo nghiệm thu hàng hóa..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab("none")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmEscrowAction}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting && <Loader className="w-3 h-3 animate-spin" />}
                      <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận lệnh ký quỹ"}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeActionTab === "notes" && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <StickyNote className="w-4 h-4 text-amber-600" /> Nhật Ký & Ghi Chú Nội Bộ ({adminNotes.length})
                  </h5>
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">Thêm ghi chú điều phối mới:</label>
                      <select
                        value={newNoteType}
                        onChange={(e) => setNewNoteType(e.target.value as any)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-[10px]"
                      >
                        <option value="info">Thông tin chung</option>
                        <option value="warning">Cảnh báo / Rủi ro</option>
                        <option value="action">Hành động can thiệp</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Ghi chú giám sát, điều phối, thỏa thuận ngoại lệ..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddAdminNote}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>{isSubmitting ? "Đang lưu..." : "Lưu ghi chú"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {adminNotes.length === 0 ? (
                      <p className="text-slate-400 text-center py-4 italic">Chưa có ghi chú nội bộ nào.</p>
                    ) : (
                      adminNotes.map((note) => (
                        <div key={note.id} className="p-2.5 rounded-xl bg-white border border-amber-100 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-800">{note.author} <span className="text-slate-400 font-normal">({note.role})</span></span>
                            <span className="text-slate-400">{formatDateTime(note.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 font-medium">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeActionTab === "cancel" && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-rose-900 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" /> Hủy Vận Đơn Khẩn Cấp
                  </h5>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Lý do hủy đơn chính</label>
                    <select
                      value={cancelReasonChoice}
                      onChange={(e) => setCancelReasonChoice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs"
                    >
                      <option value="Xe hư hỏng / tai nạn kỹ thuật">Xe hư hỏng / tai nạn kỹ thuật</option>
                      <option value="Tranh chấp giá cước hoặc chi phí phát sinh">Tranh chấp giá cước hoặc chi phí phát sinh</option>
                      <option value="Hàng hóa sai quy cách / không an toàn">Hàng hóa sai quy cách / không an toàn</option>
                      <option value="Chủ hàng yêu cầu hủy chuyến">Chủ hàng yêu cầu hủy chuyến</option>
                      <option value="Tài xế không liên hệ được">Tài xế không liên hệ được</option>
                      <option value="Thời tiết bất khả kháng (bão lũ)">Thời tiết bất khả kháng (bão lũ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chi tiết bổ sung (tùy chọn)</label>
                    <input
                      type="text"
                      value={cancelReasonDetail}
                      onChange={(e) => setCancelReasonDetail(e.target.value)}
                      placeholder="Ghi rõ chi tiết biên bản hủy nếu có..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  {selectedOrder.driverId && (
                    <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/80 space-y-1">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={releaseDriverChoice}
                          onChange={(e) => setReleaseDriverChoice(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-blue-950 block">
                            Giải phóng tài xế ({selectedOrder.driverId.name || "Tài xế"})
                          </span>
                          <span className="text-slate-600 block mt-0.5">
                            Tự động xóa cờ bận đơn, khôi phục tin đăng tìm hàng và mở cọc 3% để tài xế nổ đơn mới ngay.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab("none")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmEmergencyCancel}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting && <Loader className="w-3 h-3 animate-spin" />}
                      <span>{isSubmitting ? "Đang hủy đơn..." : "Xác nhận hủy vận đơn"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Order Info & Parties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Route & Cargo */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Thông Tin Hàng Hóa & Lộ Trình</h5>
                  <div>
                    <span className="text-slate-400 text-[11px]">Tên mặt hàng:</span>
                    <p className="font-bold text-slate-800">{selectedOrder.title}</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Điểm Bốc (Từ):</span>
                      <p className="font-semibold text-slate-700">{selectedOrder.pickup?.address || "---"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Điểm Trả (Đến):</span>
                      <p className="font-semibold text-slate-700">{selectedOrder.dropoff?.address || "---"}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Cước phí vận chuyển:</span>
                    <span className="text-base font-bold text-primary-600">
                      {getOrderCost(selectedOrder).toLocaleString()} ₫
                    </span>
                  </div>
                </div>

                {/* Parties Details */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Đối Tác Vận Chuyển</h5>
                  {/* Shipper */}
                  <div>
                    <span className="text-blue-600 font-bold text-[10px] uppercase">Chủ Hàng (Shipper):</span>
                    <p className="font-bold text-slate-800">{selectedOrder.shipperId?.name || "---"}</p>
                    <p className="text-slate-500 text-[11px]">SĐT: {selectedOrder.shipperId?.phone || "---"}</p>
                    <p className="text-slate-400 text-[11px]">Email: {selectedOrder.shipperId?.email || "---"}</p>
                  </div>

                  {/* Driver */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-emerald-600 font-bold text-[10px] uppercase">Tài Xế (Driver):</span>
                    {selectedOrder.driverId ? (
                      <div>
                        <p className="font-bold text-slate-800">{selectedOrder.driverId.name}</p>
                        <p className="text-slate-500 text-[11px]">SĐT: {selectedOrder.driverId.phone || "---"}</p>
                        <p className="text-slate-400 text-[11px]">Email: {selectedOrder.driverId.email || "---"}</p>
                      </div>
                    ) : (
                      <p className="text-amber-600 font-semibold text-[11px] mt-0.5">Chưa có tài xế nhận chuyến.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <Link
                href={`/admin/orders/${selectedOrder._id}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Xem toàn văn hồ sơ vận đơn & e-POD đầy đủ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
