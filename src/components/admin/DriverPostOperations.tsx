import Link from "next/link";
import { AdminDriverPost, getPostHoldLabel, getPostPauseReason, POST_STATUS_LABELS } from "@/utils/admin-driver-post";
import { getAdminOrderStatus } from "@/utils/admin-order-state";

export default function DriverPostOperations({ post }: { post: AdminDriverPost }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
    <h2 className="font-bold text-slate-900">Tin xe và chuyến liên quan</h2>
    <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary-50 px-3 py-1 text-primary-900">Tin: {POST_STATUS_LABELS[post.status] || "Chưa hỗ trợ"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{getPostHoldLabel(post)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Lượt hủy tin: {post.cancellationCount ?? 0}/3</span></div>
    {getPostPauseReason(post) && <p className="text-xs text-slate-600">{getPostPauseReason(post)}</p>}
    {post.adminControl?.reason && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{post.adminControl.reason}</p>}
    <p className="text-xs text-slate-500">Một tài xế có thể chạy nhiều chuyến từ các tin khác nhau. Không dùng trạng thái một chuyến để dừng tất cả tin của tài xế.</p>
    {post.scheduleType === "scheduled" && !post.autoTemplateId && <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
      <p className="font-semibold text-slate-800">Lịch đăng tin tự động</p>
      <p>{post.autoSchedule?.mode === "date" ? `Ngày: ${post.autoSchedule.dates?.map(date => new Date(date).toLocaleDateString("vi-VN")).join(", ") || "Chưa ghi nhận"}` : `Lặp theo tuần: ${post.autoSchedule?.weekdays?.map(day => day === 0 ? "Chủ nhật" : `Thứ ${day + 1}`).join(", ") || "Chưa ghi nhận"}`}</p>
      <p>Khung giờ: {post.autoSchedule?.startHour != null ? `${String(post.autoSchedule.startHour).padStart(2, "0")}:${String(post.autoSchedule.startMinute ?? 0).padStart(2, "0")}–${String(post.autoSchedule.endHour ?? 0).padStart(2, "0")}:${String(post.autoSchedule.endMinute ?? 0).padStart(2, "0")}` : "Chưa ghi nhận"} • UTC{(post.autoSchedule?.utcOffsetMinutes ?? 420) / 60 >= 0 ? "+" : ""}{(post.autoSchedule?.utcOffsetMinutes ?? 420) / 60}</p>
      <p>Lần kích hoạt tiếp theo: {post.autoSchedule?.nextRunAt ? new Date(post.autoSchedule.nextRunAt).toLocaleString("vi-VN") : "Chưa có lịch kế tiếp"}. Chỉ tin phát sinh đang mở, đúng thời gian và đủ bảo đảm mới được tìm thấy.</p>
    </div>}
    {post.autoTemplateId && <Link href={`/admin/orders/drivers/${post.autoTemplateId}`} className="block text-xs font-semibold text-primary-800">Xem lịch tự động tạo tin này</Link>}
    {!!post.adminControlEvents?.length && <details className="rounded-xl border border-slate-200 p-3 text-xs"><summary className="cursor-pointer font-semibold text-slate-700">Nhật ký thao tác quản trị ({post.adminControlEvents.length})</summary><div className="mt-2 space-y-2">{post.adminControlEvents.slice().reverse().map((event, index) => <p key={index} className="text-slate-600">{new Date(event.occurredAt).toLocaleString("vi-VN")} • {POST_STATUS_LABELS[event.action] || event.action} • {event.reason}</p>)}</div></details>}
    {post.relatedOrders?.length ? <div className="space-y-2">{post.relatedOrders.map(order => <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><span className="font-semibold text-primary-800">{order.orderCode}</span><span className="text-xs text-slate-600">{getAdminOrderStatus(order).label}</span></Link>)}</div> : <p className="text-xs text-slate-500">Không có chuyến đang chờ/chạy/tranh chấp liên kết với tin này.</p>}
  </section>;
}
