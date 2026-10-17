export const COMPENSATION_PROMO_HOLD_DAYS = 60;

// A support-only preview is advisory too, but that does not mean the trip or
// its financial settlement has already closed. Keep those explanations apart.
export const incidentFinancialDisplay = (incident: {
  supportOnly?: boolean;
  closesTripOnReport?: boolean;
  noFinancialPenalty?: boolean;
  financialPolicyVersion?: number;
}, preview?: { advisoryOnly?: boolean; plan?: { supportOnly?: boolean; noFinancialPenalty?: boolean } } | null) => {
  if (incident.noFinancialPenalty || preview?.plan?.noFinancialPenalty) return {
    supportOnly: true,
    title: 'Hoàn quyền lợi · Không phạt hoặc bồi thường',
    guidance: 'Báo cáo của tài xế đưa đơn vào lịch sử ngay. Chủ hàng chấp nhận hoặc không phản hồi trong 24 giờ thì hoàn thành đơn, hoàn voucher/ký quỹ còn giữ. Nếu phản đối, admin đối chiếu thủ công. Không tạo vi phạm bị phạt, thu hồi voucher, thu thêm tiền hoặc bồi thường tài xế.',
  };
  if (incident.supportOnly || preview?.plan?.supportOnly) return {
    supportOnly: true,
    title: 'Hỗ trợ sự cố sau khi bắt đầu chuyến',
    guidance: incident.closesTripOnReport
      ? 'Đơn đã chuyển vào lịch sử ngay khi tài xế báo cáo. Chủ hàng chấp nhận thì đóng đơn; có phản đối thì quản trị viên đối chiếu và đóng hồ sơ. Sau Bắt đầu không phạt tiền, thu hồi voucher, hoàn phí đã thu hoặc bồi thường từ ký quỹ.'
      : 'Chuyến đã bắt đầu: chỉ ghi nhận sự cố và phối hợp hỗ trợ. Không phạt tiền, thu hồi voucher, hoàn phí đã thu hoặc bồi thường từ ký quỹ. Chấp nhận báo cáo không tự hoàn thành chuyến; quản trị viên xử lý đóng băng, tiếp tục hoặc đóng chuyến theo quy trình hỗ trợ.',
  };
  if (preview?.advisoryOnly) return {
    supportOnly: false,
    title: 'Kết quả tài chính đã ghi nhận',
    guidance: 'Hồ sơ đã quyết toán hoặc đóng; dự toán chỉ để đối chiếu, không trừ tiền, thu hồi voucher hay bồi thường lần nữa. Khoản bồi thường cũ còn chờ duyệt/cấp nguồn được xử lý riêng theo trạng thái đã lưu.',
  };
  if (Number(incident.financialPolicyVersion) >= 2) return {
    supportOnly: false,
    title: 'Ký quỹ và bồi thường trước khi bắt đầu chuyến',
    guidance: `Hủy trong 5 phút kể từ khi tài xế chấp nhận: hoàn quyền lợi, không tính vi phạm. Sau mốc này, sự cố cần đối chiếu bằng chứng và phản hồi trước khi kết luận. Bên có lỗi bị trừ ký quỹ hoặc thu hồi voucher đã áp dụng; bên không có lỗi được hoàn quyền lợi hợp lệ và nhận thêm tiền bồi thường vào Ví khuyến mãi. Tiền đã ghi có dùng ký quỹ được ngay; phần còn lại đủ điều kiện chuyển sang Ví chính sau ${COMPENSATION_PROMO_HOLD_DAYS} ngày kể từ lúc ghi có, không tự rút ra ngân hàng.`,
  };
  return {
    supportOnly: false,
    title: 'Quyền lợi theo chính sách của hồ sơ cũ',
    guidance: 'Đối chiếu quyền lợi và dự toán theo phiên bản chính sách đã lưu của đơn. Không áp dụng hồi tố quy tắc mới hoặc tính lại giao dịch đã quyết toán. Chỉ thực hiện phán quyết sau khi dự toán đúng với kết luận đã chọn được tải thành công.',
  };
};

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
  counterpartyResponse?: { decision: "accepted" | "appealed"; responderRole?: string; automatic?: boolean } | null;
}

export const incidentResponderRole = (incident: Pick<ReviewableIncident, "reporterRole" | "counterpartyResponse">) =>
  incident.counterpartyResponse?.responderRole ||
  (incident.reporterRole === "shipper" ? "driver" : incident.reporterRole === "driver" ? "shipper" : null);

export const incidentResponseLabel = (incident: Pick<ReviewableIncident, "status" | "counterpartyResponse">) => {
  if (incident.status === "cancelled") return "Báo cáo đã được rút lại";
  if (incident.counterpartyResponse?.automatic) return "Tự động chấp nhận sau 24 giờ không phản hồi";
  if (incident.counterpartyResponse?.decision === "accepted") return "Đã chấp nhận báo cáo";
  if (incident.counterpartyResponse?.decision === "appealed") return "Đã phản đối";
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
  if (event.type === "confirmed" && event.actorRole === "system") return "Tự động chấp nhận sau 24 giờ không phản hồi";
  if (event.type === "pending_review" && ["shipper", "driver"].includes(event.actorRole)) return "Gửi phản đối";
  if (event.type === "confirmed" && ["shipper", "driver"].includes(event.actorRole)) return "Chấp nhận báo cáo, xác nhận trách nhiệm";
  const labels: Record<string, string> = {
    submitted: "Gửi báo cáo sự cố", evidence_added: "Bổ sung bằng chứng",
    pending_review: "Tiếp nhận thẩm tra", confirmed: "Kết luận trách nhiệm",
    dismissed: "Bác bỏ báo cáo", resolved: "Đóng hồ sơ", cancelled: "Rút báo cáo",
    support_frozen: "Đóng băng để hỗ trợ", support_resumed: "Tiếp tục chuyến", support_closed: "Đóng chuyến sau hỗ trợ",
    settlement_held: "Giữ ký quỹ chờ đối soát", settled: "Hoàn tất quyết toán", note_added: "Bổ sung ghi chú",
  };
  return labels[event.type] || "Cập nhật hồ sơ";
};

export const incidentConfirmMessage = (faultSide: string, executesOnReview: boolean, releaseDays = COMPENSATION_PROMO_HOLD_DAYS,
  plan?: { payerMethod: string; compensationAmount: number; revokesLifetimeVoucher: boolean; supportOnly?: boolean; virtualCredit?: boolean; noFinancialPenalty?: boolean }) => {
  const conclusion = faultSide === "none" ? "Xác nhận không bên nào có lỗi" : `Xác nhận trách nhiệm thuộc về ${incidentRoleLabel(faultSide)}`;
  if (plan?.noFinancialPenalty) return `${conclusion}. Chỉ lưu kết luận đối chiếu, không phạt, thu hồi voucher, thu thêm tiền hoặc bồi thường. Đóng hồ sơ sẽ hoàn voucher/ký quỹ còn giữ của chủ hàng. Tiếp tục?`;
  if (plan?.supportOnly) return 'Chuyến đã bắt đầu. Chỉ ghi nhận kết quả đối chiếu; không phạt tiền, thu hồi voucher, hoàn phí hoặc bồi thường từ ký quỹ. Tiếp tục?';
  if (!executesOnReview) return `${conclusion}. Hồ sơ đã quyết toán hoặc đóng; thao tác này không trừ tiền hay bồi thường lần nữa. Tiếp tục?`;
  if (faultSide === "none") return `${conclusion}. Hoàn lại các khoản ký quỹ đang giữ cho hai bên. Tiếp tục?`;
  const recipient = incidentRoleLabel(faultSide === "shipper" ? "driver" : "shipper");
  if (plan?.payerMethod === "voucher") {
    const amount = new Intl.NumberFormat("vi-VN").format(plan.compensationAmount);
    const penalty = plan.revokesLifetimeVoucher ? "Thu hồi toàn bộ voucher miễn ký quỹ trọn đời của Chủ hàng" : "Thu hồi voucher đã áp dụng của Tài xế, không trừ thêm voucher chưa dùng";
    if (plan.virtualCredit) return `${conclusion}. ${penalty}. Hoàn quyền lợi hợp lệ của bên không có lỗi. TXE PRO ghi có ngay ${amount} đ bồi thường vào Ví khuyến mãi của ${recipient}, không chờ cấp nguồn. Dùng ký quỹ được ngay; có thể giải ngân sau ${releaseDays} ngày kể từ lúc ghi có. Không tạo giao dịch nạp hoặc rút tiền ngân hàng. Tiếp tục?`;
    return `${conclusion}. ${penalty}. Hoàn quyền lợi hợp lệ của bên không có lỗi. TXE PRO trả thêm ${amount} đ tiền bồi thường cho ${recipient} từ quỹ đã cấp nguồn, không quy voucher thành số dư tiền mặt. Thiếu nguồn thì ghi nhận chờ cấp nguồn, chưa cộng ví. Tiền bồi thường vào Ví khuyến mãi và có thể giải ngân sau ${releaseDays} ngày kể từ lúc ghi có. Tiếp tục?`;
  }
  return `${conclusion}. Ký quỹ của bên vi phạm được bồi thường bằng tiền vào Ví khuyến mãi của ${recipient}; được giải ngân sau ${releaseDays} ngày. Hoàn lại ký quỹ cho bên không vi phạm. Tiếp tục?`;
};
