import Link from "next/link";
import { AdminEscrowLock, AdminFinancialSnapshot, formatAdminMoney, getAdminEscrowLockLabel, getAdminSettlementStatus } from "@/utils/admin-order-state";

export interface AdminCompensationClaim {
  id: string; status: string; amount: number; recipientRole: string; payerRole?: string;
  recipient?: { name?: string | null; phone?: string | null } | null;
  fundingSource?: string; holdReason?: string | null; automatic?: boolean;
  paidAt?: string | null; promoAvailableAt?: string | null; promoReleasedAt?: string | null;
}

const role = (value?: string) => value === "driver" ? "Tài xế" : value === "shipper" ? "Chủ hàng" : "Chưa xác định";
export function CompensationReceipt({ claim }: { claim: AdminCompensationClaim }) {
  const paid = claim.status === "paid";
  const status = paid ? claim.promoReleasedAt ? "Đã chuyển sang Ví chính" : "Đã ghi có bồi thường"
    : claim.status === "held" ? claim.holdReason === "platform_fund_insufficient" ? "Chờ cấp nguồn — chưa cộng ví" : "Chờ duyệt — chưa cộng ví"
    : "Không duyệt bồi thường";
  return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-2">
    <div className="flex flex-wrap justify-between gap-2"><strong>{formatAdminMoney(claim.amount)} → {role(claim.recipientRole)}</strong>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{status}</span></div>
    <p className="text-xs text-slate-600">Nguồn: {claim.fundingSource === "platform_fund" ? "Quỹ bồi thường TXE PRO" : "Ký quỹ bên có lỗi"}. Đây là khoản bồi thường bổ sung, tách biệt hoàn quyền lợi hợp lệ.</p>
    {claim.recipient?.name && <p className="text-xs text-slate-600">Người nhận: {claim.recipient.name}{claim.recipient.phone ? ` • ${claim.recipient.phone}` : ""}</p>}
    {paid && claim.paidAt && <p className="text-xs text-slate-600">Ghi có thực tế: {new Date(claim.paidAt).toLocaleString("vi-VN")}</p>}
    {paid && !claim.promoReleasedAt && claim.promoAvailableAt && <p className="text-xs text-slate-600">Ví khuyến mãi • Đủ thời gian chuyển sang Ví chính từ {new Date(claim.promoAvailableAt).toLocaleString("vi-VN")}. Không tự chuyển vào ngân hàng.</p>}
    {paid && claim.promoReleasedAt && <p className="text-xs text-slate-600">Đã chuyển sang Ví chính lúc {new Date(claim.promoReleasedAt).toLocaleString("vi-VN")}</p>}
    {paid && !claim.promoAvailableAt && !claim.promoReleasedAt && <p className="text-xs text-slate-600">Khoản bồi thường theo cơ chế cũ; không tự thu hồi tiền đã giải ngân.</p>}
  </div>;
}

export function OrderFinancialSummary({ snapshot, claims = [], locks = [] }: {
  snapshot?: AdminFinancialSnapshot | null; claims?: AdminCompensationClaim[];
  locks?: AdminEscrowLock[];
}) {
  const lines = [["Ký quỹ Chủ hàng", snapshot?.shipperEscrow], ["Ký quỹ Tài xế", snapshot?.driverEscrow], ["Phí nền tảng và VAT Tài xế", snapshot?.driverPlatformFee]] as const;
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-900">Ký quỹ, voucher và quyết toán</h2>
      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-900">{getAdminSettlementStatus(snapshot)}</span></div>
    <p className="text-xs text-slate-600">Tài xế giữ bảo đảm khi đăng tin; Chủ hàng giữ bảo đảm khi xác nhận đặt xe. Chỉ hiển thị số tiền và kết quả backend đã ghi nhận, không suy ra thanh toán từ trạng thái đơn.</p>
    {!snapshot ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Chưa có snapshot tài chính. Không tự tính phí, dựng giao dịch MB hoặc giả lập hoàn tiền.</p> : <>
      <p className="text-sm text-slate-700">Giá cước đã chốt: <strong>{formatAdminMoney(snapshot.orderAmount)}</strong></p>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-xs"><thead><tr className="bg-slate-50 text-slate-600"><th className="p-3 text-left">Khoản mục</th><th className="p-3 text-right">Trước miễn</th><th className="p-3 text-right">Được miễn</th><th className="p-3 text-right">Phải bảo đảm</th></tr></thead>
        <tbody>{lines.map(([label, line]) => <tr key={label} className="border-b border-slate-100"><th className="p-3 text-left font-medium text-slate-700">{label}{line?.voucherGrantId && <span className="block text-[11px] text-primary-700">Có voucher đã áp dụng</span>}</th><td className="p-3 text-right">{formatAdminMoney(line?.grossAmount)}</td><td className="p-3 text-right">{formatAdminMoney(line?.waivedAmount)}</td><td className="p-3 text-right font-semibold">{formatAdminMoney(line?.payableAmount)}</td></tr>)}</tbody></table></div>
      {snapshot.driverPlatformFee && <p className="text-xs text-slate-600">Phí nền tảng: {formatAdminMoney(snapshot.driverPlatformFee.platformFeeAmount)} • VAT trên phí: {formatAdminMoney(snapshot.driverPlatformFee.vatAmount)}. Khoản bảo đảm chung không cộng ký quỹ thêm lần nữa.</p>}
      {snapshot.startFeeSettlementId && snapshot.driverFeeCollectedAt && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">Đã quyết toán phí tài xế khi Bắt đầu lúc {new Date(snapshot.driverFeeCollectedAt).toLocaleString("vi-VN")}. Khi hoàn thành không thu lại. Biên nhận: {snapshot.startFeeSettlementId}.</p>}
      <p className="break-all text-xs text-slate-500">Tham chiếu quyết toán: {snapshot.settlementReference || "Chưa ghi nhận"}{snapshot.settledAt ? ` • ${new Date(snapshot.settledAt).toLocaleString("vi-VN")}` : ""}</p>
    </>}
    {locks.length > 0 && <div className="space-y-2"><h3 className="text-xs font-semibold text-slate-800">Các khoản giữ thực tế</h3>{locks.map(lock => <p key={lock._id} className="break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{role(lock.role)} • {formatAdminMoney(lock.amount)} • {getAdminEscrowLockLabel(lock)} • {lock._id}</p>)}</div>}
    {claims.length > 0 && <div className="space-y-3"><h3 className="text-sm font-semibold text-slate-900">Bồi thường bổ sung bằng tiền</h3>{claims.map(claim => <CompensationReceipt key={claim.id} claim={claim} />)}</div>}
    <Link href="/admin/incidents" className="inline-flex rounded-xl bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-900 hover:bg-primary-100">Đối soát tranh chấp và bồi thường</Link>
  </section>;
}
