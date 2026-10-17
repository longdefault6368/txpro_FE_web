export interface AdminOrderState {
  status: string;
  acceptedAt?: string | null;
  deliveredAt?: string | null;
  shipperConfirmDeadlineAt?: string | null;
  completion?: {
    driverNearPickupNotifiedAt?: string | null;
    pickupArrivedAt?: string | null;
    driverNearDropoffNotifiedAt?: string | null;
    deliveredAt?: string | null;
    shipperConfirmed?: boolean;
    autoConfirmed?: boolean;
  } | null;
  activeIncident?: { status: string } | null;
  adminOperations?: { autoSettlementEnabled?: boolean; autoSettlementEligible?: boolean; canCancelUnassigned?: boolean; reason?: string };
}

export const ADMIN_ORDER_STATUS: Record<string, { label: string; detail: string; color: string; stepIndex: number }> = {
  searching_driver: { label: "Đang tìm tài xế", detail: "Chưa chọn tài xế; chưa khóa ký quỹ Chủ hàng.", color: "text-amber-800 bg-amber-50 border-amber-200", stepIndex: 0 },
  waiting_driver: { label: "Chờ tài xế xác nhận", detail: "Chủ hàng đã chọn xe; chờ tài xế phản hồi.", color: "text-violet-800 bg-violet-50 border-violet-200", stepIndex: 0 },
  waiting_driver_acceptance: { label: "Chờ tài xế xác nhận", detail: "Chủ hàng đã chọn xe; chờ phản hồi trong thời hạn nhận đơn.", color: "text-violet-800 bg-violet-50 border-violet-200", stepIndex: 0 },
  accepted: { label: "Tài xế đang đến điểm nhận", detail: "Tài xế đã nhận đơn; chưa xác nhận nhận hàng/khách.", color: "text-indigo-800 bg-indigo-50 border-indigo-200", stepIndex: 1 },
  in_progress: { label: "Đang giao đến điểm trả", detail: "Đã xác nhận nhận hàng/khách; đang di chuyển đến điểm trả.", color: "text-sky-800 bg-sky-50 border-sky-200", stepIndex: 2 },
  delivered: { label: "Chờ Chủ hàng xác nhận", detail: "Tài xế đã hoàn thành giao hàng; chưa đồng nghĩa đã quyết toán tiền.", color: "text-teal-800 bg-teal-50 border-teal-200", stepIndex: 3 },
  completed: { label: "Đã hoàn thành", detail: "Đơn đã kết thúc; tài chính được đối soát riêng theo giao dịch thực tế.", color: "text-emerald-800 bg-emerald-50 border-emerald-200", stepIndex: 3 },
  disputed: { label: "Đang giải quyết sự cố", detail: "Có phản đối; chờ quản trị viên đối soát. Tài xế có thể nhận chuyến khác.", color: "text-amber-800 bg-amber-50 border-amber-200", stepIndex: -1 },
  cancelled: { label: "Đã hủy", detail: "Đơn đã hủy; không suy ra đã hoàn tiền khi chưa có giao dịch.", color: "text-red-800 bg-red-50 border-red-200", stepIndex: -1 },
  rejected: { label: "Tài xế đã từ chối", detail: "Kiểm tra lần nhận chuyến và trạng thái tìm xe hiện tại.", color: "text-slate-700 bg-slate-100 border-slate-200", stepIndex: 0 },
  deleted: { label: "Đã xóa", detail: "Dữ liệu đối soát được giữ theo chính sách hệ thống.", color: "text-slate-600 bg-slate-100 border-slate-200", stepIndex: -1 },
};

export function getAdminOrderStatus(order: AdminOrderState) {
  const meta = ADMIN_ORDER_STATUS[order.status] || { label: "Trạng thái chưa hỗ trợ", detail: "Vui lòng kiểm tra dữ liệu backend.", color: "text-slate-700 bg-slate-100 border-slate-200", stepIndex: -1 };
  if (order.status === "accepted" && (order.completion?.driverNearPickupNotifiedAt || order.completion?.pickupArrivedAt)) {
    return { ...meta, label: "Tài xế đã đến điểm nhận", detail: "Đã ghi nhận đến điểm nhận; chờ xác nhận nhận hàng/khách." };
  }
  if (order.status === "in_progress" && order.completion?.driverNearDropoffNotifiedAt) {
    return { ...meta, label: "Tài xế đã đến điểm trả", detail: "Đã ghi nhận đến điểm trả; chờ xác nhận hoàn thành." };
  }
  return meta;
}

export function getAdminCompletionNotice(order: AdminOrderState) {
  if (order.status !== "delivered") return null;
  if (order.activeIncident && ["open", "pending_review", "confirmed"].includes(order.activeIncident.status)) {
    return { held: true, deadline: null, text: "Có báo cáo sự cố đang xử lý. Không tự kết luận hoàn thành hoặc giải ngân; đối soát tại trang Tranh chấp." };
  }
  const deadline = order.shipperConfirmDeadlineAt;
  const validDeadline = deadline && Number.isFinite(new Date(deadline).getTime()) ? deadline : null;
  if (order.adminOperations?.autoSettlementEnabled === false) return { held: false, deadline: validDeadline, text: "Tác vụ tự hoàn thành/quyết toán đang tắt trong cấu hình backend. Hạn xác nhận không đồng nghĩa tiền đã được giải ngân." };
  if (order.adminOperations?.autoSettlementEligible === false) return { held: false, deadline: validDeadline, text: "Đơn chưa thuộc chính sách tự quyết toán 24 giờ hiện hành. Không tự tính hạn hoặc khẳng định giải ngân cho đơn cũ." };
  return { held: false, deadline: validDeadline, text: validDeadline
    ? order.adminOperations?.autoSettlementEnabled === true ? "Nếu Chủ hàng không xác nhận và không báo cáo sự cố, backend tự hoàn thành và quyết toán theo hạn 24 giờ đã ghi nhận." : "Hạn xác nhận đã ghi nhận; cần đối chiếu cấu hình tác vụ backend trước khi kết luận tự hoàn thành/quyết toán."
    : "Chưa có hạn tự hoàn thành được backend ghi nhận; không tự tính hạn cho đơn cũ." };
}

export interface FinancialLine {
  grossAmount?: number | null;
  waivedAmount?: number | null;
  payableAmount?: number | null;
  platformFeeAmount?: number | null;
  vatAmount?: number | null;
  voucherGrantId?: string | null;
}

export interface AdminFinancialSnapshot {
  orderAmount?: number | null;
  settlementStatus?: string | null;
  settlementReference?: string | null;
  settledAt?: string | null;
  applicationKey?: string | null;
  shipperEscrow?: FinancialLine | null;
  driverEscrow?: FinancialLine | null;
  driverPlatformFee?: FinancialLine | null;
  startFeeSettlementId?: string | null;
  driverFeeCollectedAt?: string | null;
}

export interface AdminEscrowLock {
  _id: string; amount: number; status: string; role?: string; purpose?: string;
  meta?: { startFee?: { amount?: number }; completionSettlement?: { feeAmount?: number } };
}

export function getAdminEscrowLockLabel(lock: AdminEscrowLock) {
  const feeCollected = Number(lock.meta?.startFee?.amount || lock.meta?.completionSettlement?.feeAmount || 0) > 0;
  if (lock.status === "forfeited") return feeCollected ? "Đã thu phí nền tảng và VAT" : "Đã khấu trừ";
  if (lock.status === "locked" && feeCollected) return "Đã thu phí; còn giữ phần bảo đảm";
  const labels: Record<string, string> = { locked: "Đang giữ", released: "Đã hoàn", transferred: "Đã chuyển bồi thường" };
  return labels[lock.status] || lock.status;
}

export const formatAdminMoney = (value?: number | null) =>
  value != null && Number.isFinite(value) ? `${value.toLocaleString("vi-VN")} ₫` : "Chưa ghi nhận";

export function getAdminSettlementStatus(snapshot?: AdminFinancialSnapshot | null) {
  const labels: Record<string, string> = { pending: "Chưa quyết toán", held: "Đang giữ để đối soát", settled: "Đã quyết toán", reversed: "Đã đảo quyết toán" };
  return snapshot ? labels[snapshot.settlementStatus || ""] || "Chưa có kết quả quyết toán" : "Chưa có dữ liệu tài chính";
}
