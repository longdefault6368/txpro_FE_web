import { getVehicleCapabilities } from "./vehicleCapabilities";

export interface AdminDriverPost {
  _id: string;
  status: string;
  availableCapacity?: number | null;
  availableCapacityMin?: number | null;
  availableCapacityMax?: number | null;
  availableSeats?: number | null;
  vehicleSeats?: number | null;
  vehicleId?: { type?: string | null; vehicleTypeParent?: string | null; vehicleTypeChild?: string | null; capacity?: number | null; seats?: number | null } | null;
  statusReason?: string | null;
  autoPausedForOrderId?: string | null;
  manualPausedAt?: string | null;
  autoTemplateId?: string | null;
  scheduleType?: string;
  walletHoldStatus?: string;
  funding?: { cashHeldAmount: number; orderHeldAmount: number; reservedVoucherId?: string | null };
  cancellationCount?: number;
  autoSchedule?: { mode?: string; weekdays?: number[]; dates?: string[]; startHour?: number | null; startMinute?: number | null; endHour?: number | null; endMinute?: number | null; nextRunAt?: string | null; lastRunAt?: string | null; utcOffsetMinutes?: number | null };
  adminControlEvents?: { actorId?: string; action: string; reason: string; occurredAt: string }[];
  adminControl?: { allowedStatuses: string[]; reason?: string | null };
  relatedOrders?: { _id: string; orderCode: string; status: string; completion?: { driverNearPickupNotifiedAt?: string | null; driverNearDropoffNotifiedAt?: string | null } | null }[];
}

const numberText = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
export function formatPostCapacity(post: AdminDriverPost) {
  if (!getVehicleCapabilities(post.vehicleId).hasCapacity) return null;
  const min = post.availableCapacityMin;
  const max = post.availableCapacityMax;
  if (min != null || max != null) {
    if (min == null || max == null || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= 0 || min > max
      || (post.vehicleId?.capacity != null && max > post.vehicleId.capacity)) return "Khoảng tải trọng cần đối soát";
    return min === max ? `${numberText(max)} tấn` : `${numberText(min)}–${numberText(max)} tấn`;
  }
  const capacity = post.availableCapacity ?? post.vehicleId?.capacity;
  return capacity != null && Number.isFinite(capacity) && capacity > 0 ? `${numberText(capacity)} tấn` : "Chưa ghi nhận tải trọng";
}

export function getPostPauseReason(post: AdminDriverPost) {
  if (post.status !== "paused") return null;
  if (post.autoPausedForOrderId) return "Tự tạm dừng do chuyến; chỉ mở lại khi đủ điều kiện.";
  const labels: Record<string, string> = {
    driver_manual_pause: "Tài xế chủ động tạm dừng", admin_manual_pause: "Quản trị viên tạm dừng",
    auto_template_paused: "Tạm dừng theo lịch đăng tin", driver_response_timeout_threshold: "Tạm dừng do bỏ lỡ phản hồi nhận đơn",
    driver_post_insufficient_balance: "Chưa đủ số dư bảo đảm", low_balance_pending: "Chờ bổ sung số dư bảo đảm",
    driver_post_payment_required: "Chờ bổ sung số dư bảo đảm",
    driver_cancelled_requires_manual_resume: "Tạm dừng sau hủy chuyến; cần chủ động mở lại",
    insufficient_post_funding: "Chờ bổ sung số dư bảo đảm",
  };
  return labels[post.statusReason || ""] || (post.manualPausedAt ? "Chủ động tạm dừng" : "Chưa ghi nhận nguyên nhân tạm dừng");
}

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp", active: "Đang mở", paused: "Tạm dừng", scheduled: "Đã lên lịch",
  matched: "Đã khớp đơn", in_progress: "Đang chạy", completed: "Hoàn thành", cancelled: "Đã hủy",
  expired: "Hết hạn", deleted: "Đã xóa", archived: "Lưu trữ cũ",
};

export function getPostHoldLabel(post: AdminDriverPost) {
  if (post.funding) {
    const { cashHeldAmount, orderHeldAmount, reservedVoucherId } = post.funding;
    if (reservedVoucherId && cashHeldAmount > 0) return `Voucher đang giữ • Tiền bảo đảm bổ sung: ${numberText(cashHeldAmount)} ₫`;
    if (reservedVoucherId) return "Voucher đang giữ riêng cho tin";
    if (cashHeldAmount > 0) return `Đang giữ tiền bảo đảm: ${numberText(cashHeldAmount)} ₫`;
    if (orderHeldAmount > 0) return "Bảo đảm đã chuyển sang chuyến liên kết";
    return post.walletHoldStatus === "low_balance_pending" ? "Chờ bổ sung số dư" : "Không có khoản giữ tiền/voucher tại tin";
  }
  const labels: Record<string, string> = { held: "Đã giữ bảo đảm", none: "Không có khoản tiền giữ tại tin", low_balance_pending: "Chờ bổ sung số dư", failed: "Giữ quỹ chưa thành công" };
  return labels[post.walletHoldStatus || ""] || "Chưa ghi nhận tình trạng giữ quỹ";
}
