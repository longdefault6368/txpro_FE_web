export const incidentRoleLabel = (role?: string | null): string => {
  switch (role) {
    case "shipper": case "chu-hang": return "Chủ hàng";
    case "driver": case "tai-xe": return "Tài xế";
    case "admin": return "Quản trị viên";
    case "system": return "Hệ thống";
    case "none": return "Không bên nào";
    default: return "Chưa xác định";
  }
};

export interface ReviewableIncident {
  status: string;
  reporterRole: string;
  settlementStatus: string;
  availableActions: string[];
  counterpartyResponse?: { decision: "accepted" | "appealed"; responderRole?: string } | null;
}

export const incidentResponderRole = (incident: Pick<ReviewableIncident, "reporterRole" | "counterpartyResponse">) =>
  incident.counterpartyResponse?.responderRole ||
  (incident.reporterRole === "shipper" ? "driver" : incident.reporterRole === "driver" ? "shipper" : null);

export const incidentResponseLabel = (incident: Pick<ReviewableIncident, "status" | "counterpartyResponse">) => {
  if (incident.status === "cancelled") return "Báo cáo đã được rút lại";
  if (incident.counterpartyResponse?.decision === "accepted") return "Đã chấp nhận báo cáo";
  if (incident.counterpartyResponse?.decision === "appealed") return "Đã kháng cáo";
  if (["open", "pending_review"].includes(incident.status)) return "Chưa có phản hồi";
  return "Không có phản hồi được ghi nhận";
};

export const incidentReviewActions = (incident: ReviewableIncident, claims: { status: string }[] = []) => {
  const valid: Record<string, string[]> = {
    open: ["pending_review", "dismissed"], pending_review: ["confirmed", "dismissed"],
    confirmed: ["resolved"], dismissed: ["resolved"], resolved: [], cancelled: [],
  };
  return incident.availableActions.filter(action =>
    (valid[incident.status] || []).includes(action) &&
    (action !== "resolved" || (incident.settlementStatus !== "held" && !claims.some(c => c.status === "held"))));
};

export const incidentEventLabel = (event: { type: string; actorRole: string }) => {
  if (event.type === "pending_review" && ["shipper", "driver"].includes(event.actorRole)) return "Gửi kháng cáo";
  if (event.type === "confirmed" && ["shipper", "driver"].includes(event.actorRole)) return "Chấp nhận báo cáo, xác nhận trách nhiệm";
  const labels: Record<string, string> = {
    submitted: "Gửi báo cáo sự cố", evidence_added: "Bổ sung bằng chứng",
    pending_review: "Tiếp nhận thẩm tra", confirmed: "Kết luận trách nhiệm",
    dismissed: "Bác bỏ báo cáo", resolved: "Đóng hồ sơ", cancelled: "Rút báo cáo",
    settlement_held: "Giữ ký quỹ chờ đối soát", settled: "Hoàn tất quyết toán", note_added: "Bổ sung ghi chú",
  };
  return labels[event.type] || "Cập nhật hồ sơ";
};

export const incidentConfirmMessage = (faultSide: string, executesOnReview: boolean, releaseDays = 30,
  plan?: { payerMethod: string; compensationAmount: number; revokesLifetimeVoucher: boolean }) => {
  const conclusion = faultSide === "none" ? "Xác nhận không bên nào có lỗi" : `Xác nhận trách nhiệm thuộc về ${incidentRoleLabel(faultSide)}`;
  if (!executesOnReview) return `${conclusion}. Hồ sơ đã quyết toán hoặc đóng; thao tác này không trừ tiền hay bồi thường lần nữa. Tiếp tục?`;
  if (faultSide === "none") return `${conclusion}. Hoàn lại các khoản ký quỹ đang giữ cho hai bên. Tiếp tục?`;
  const recipient = incidentRoleLabel(faultSide === "shipper" ? "driver" : "shipper");
  if (plan?.payerMethod === "voucher") {
    const amount = new Intl.NumberFormat("vi-VN").format(plan.compensationAmount);
    const penalty = plan.revokesLifetimeVoucher ? "Thu hồi toàn bộ voucher miễn ký quỹ trọn đời của Chủ hàng" : "Thu hồi voucher đã áp dụng của Tài xế, không trừ thêm voucher chưa dùng";
    return `${conclusion}. ${penalty}. Hoàn quyền lợi hợp lệ của bên không có lỗi. TXE PRO trả thêm ${amount} đ tiền bồi thường cho ${recipient} từ quỹ đã cấp nguồn, không quy voucher thành số dư tiền mặt. Thiếu nguồn thì ghi nhận chờ cấp nguồn, chưa cộng ví. Tiền bồi thường vào Ví khuyến mãi và có thể giải ngân sau ${releaseDays} ngày kể từ lúc ghi có. Tiếp tục?`;
  }
  return `${conclusion}. Ký quỹ của bên vi phạm được bồi thường bằng tiền vào Ví khuyến mãi của ${recipient}; được giải ngân sau ${releaseDays} ngày. Hoàn lại ký quỹ cho bên không vi phạm. Tiếp tục?`;
};
