export type VehicleMatch = {
 postId: string; driverId: string; driverName: string; price?: number | null; estimatedPrice?: number | null;
 driverNote?: string; availableTo?: string | null; status?: string;
 previousInterruption?: { reason?: string | null; reasonLabel?: string | null } | null;
 vehicle: { type: string; plateNumber: string };
};
export type BookingSelection = {
 orderId: string; status: string;
 invite?: { responseDeadlineAt?: string | null };
 financialSummary?: { shipperEscrow?: { payableAmount?: number | null; waivedAmount?: number | null; voucherGrantId?: string | null } };
};
export const canSelectVehicle = (status: string) => ["searching_driver", "waiting_driver"].includes(status);
export function matchFare(match: VehicleMatch): number {
 const value = match.estimatedPrice ?? match.price;
 return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : 0;
}
export function interruptionNotice(match: VehicleMatch): string {
 return match.previousInterruption?.reasonLabel?.trim() || (match.previousInterruption?.reason ? "Tài xế từng dừng lượt ghép trước đó và đã mở lại tin xe." : "");
}
// Recheck after viewing a card or paying a QR. No financial mutation occurs here.
export async function latestBookingMatch(request: <T>(path: string) => Promise<T>, orderId: string, selected: VehicleMatch, now?: number) {
 const order = await request<{ status: string }>("/chu-hang/orders/" + orderId);
 if (!canSelectVehicle(order.status)) throw new Error("Đơn đã thay đổi trạng thái. Vui lòng kiểm tra danh sách đơn của bạn.");
 const matches = await request<VehicleMatch[]>("/chu-hang/orders/" + orderId + "/matches");
 if (!Array.isArray(matches)) throw new Error("Chưa kiểm tra được danh sách xe mới nhất. Vui lòng thử lại.");
 const match = matches.find(item => item.postId === selected.postId && item.driverId === selected.driverId);
 if (!match || (match.status && match.status !== "active") ||
  (match.availableTo && (!Number.isFinite(Date.parse(match.availableTo)) || Date.parse(match.availableTo) <= (now ?? Date.now())))) {
  throw new Error("Tin xe đã hết hạn, tạm dừng hoặc không còn phù hợp. Vui lòng chọn xe khác.");
 }
 if (!matchFare(match)) throw new Error("Tin xe chưa có giá cước hợp lệ. Vui lòng chọn xe khác.");
 return match;
}
export function bookingFundingNotice(selection: BookingSelection) {
 const escrow = selection.financialSummary?.shipperEscrow;
 if (escrow?.payableAmount === 0 && typeof escrow.waivedAmount === "number" && escrow.waivedAmount > 0 && escrow.voucherGrantId?.trim()) {
  return "Đơn này được miễn ký quỹ bằng voucher. Đang chờ tài xế xác nhận.";
 }
 if (typeof escrow?.payableAmount === "number" && Number.isSafeInteger(escrow.payableAmount) && escrow.payableAmount > 0) {
  return "Đã ký quỹ " + escrow.payableAmount.toLocaleString("vi-VN") + " đ cho đơn hàng này. Đang chờ tài xế xác nhận.";
 }
 return "Đã gửi yêu cầu đặt xe. Đang chờ tài xế xác nhận.";
}
