"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { postingRequest } from "@/utils/posting-api";
import { orderStatusLabel } from "@/utils/order-display";
import { readPostingPage, type PostingPage } from "@/utils/posting-contract";
import { orderListAction, orderListEndpoint } from "@/utils/order-list";
import s from "./Orders.module.css";
import { ClipboardList, Plus, Clock3, Truck, History, Route, RefreshCw, LockKeyhole, ArrowRight, AlertCircle, Hash, PackageSearch, ChevronLeft, ChevronRight } from "lucide-react";
type RecordRow = { id?: string; _id?: string; kind?: "order" | "post"; orderCode?: string; status: string; title?: string; offerPrice?: number; price?: number; budget?: { max?: number }; pickup?: { address: string }; dropoff?: { address: string }; route?: { from: string; to: string }; activityOccurredAt?: string; historyOccurredAt?: string; updatedAt?: string; createdAt?: string; vehicle?: { plateNumber?: string; type?: string }; vehicleType?: string; notes?: string; note?: string };
export default function OrdersWorkspace() {
  const [role, setRole] = useState(""), [auth, setAuth] = useState(true), [error, setError] = useState("");
  const [tab, setTab] = useState("all"), [page, setPage] = useState(1), [rows, setRows] = useState<RecordRow[]>([]);
  const [busy, setBusy] = useState(true), [more, setMore] = useState(false), [version, setVersion] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    postingRequest<{ user: { role: string } }>("/auth/me").then(data => {
      if (!active) return;
      if (!["chu-hang", "tai-xe"].includes(data.user.role)) { setError("Khu vực này dành cho tài xế và chủ hàng."); setBusy(false); return; }
      setRole(data.user.role);
    }).catch(e => { if (active) { setAuth(false); setBusy(false); setError(e.message); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!role) return;
    let active = true;
    postingRequest<PostingPage<RecordRow>>(orderListEndpoint(role, tab, page)).then(data => {
      if (!active) return;
      const result = readPostingPage(data);
      setRows(result.items); setMore(result.hasMore); setError("");
      setTotal(data.pagination && Number.isSafeInteger(data.pagination.total) ? data.pagination.total : null);
    }).catch(e => { if (active) { setRows([]); setMore(false); setError(e.message); } }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [role, tab, page, version]);
  const tabs = [{ value: "all", name: "Tất cả" }, { value: "in-progress", name: "Đang thực hiện" }, { value: "waiting", name: "Đơn chờ" },
    ...(role === "tai-xe" ? [{ value: "posts", name: "Tin xe của tôi" }] : []), { value: "history", name: "Lịch sử" }];
  const newPostPath = role === "tai-xe" ? "/tai-xe/dang-tin" : role === "chu-hang" ? "/chu-hang/form-tao-don" : "/dang-tin";
  const tabIcon = (value: string) => value === "all" ? ClipboardList : value === "waiting" ? Clock3 : value === "posts" ? Truck : value === "history" ? History : Route;
  function navigate(nextTab: string, nextPage = 1) { setBusy(true); setError(""); setTab(nextTab); setPage(nextPage); }
  return <><Header /><main className={s.page}>
    <div className={s.heading}><div><span className={s.eyebrow}><ClipboardList size={15} />KHU VỰC TÀI KHOẢN</span>
      <h1>Đơn của bạn</h1><p>{role === "tai-xe" ? "Quản lý tin xe và theo dõi từng chuyến đi của bạn." : "Theo dõi đơn, tìm phương tiện và xem lại những hành trình đã qua."}</p></div>
      {auth && <Link className={s.primary} href={newPostPath}><Plus size={17} />{role === "tai-xe" ? "Đăng xe trống" : "Tìm xe mới"}</Link>}
    </div>
    {!auth ? <section className={s.empty}><LockKeyhole size={39} /><h2>Đăng nhập để xem đơn của bạn</h2><p>Kết nối với tài khoản TXE PRO để tiếp tục quản lý tin và hành trình.</p><Link className={s.primary} href="/login?next=%2Fdon-cua-ban">Đăng nhập<ArrowRight size={17} /></Link></section> : <>
      <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Trạng thái đơn">{tabs.map(item => { const Icon = tabIcon(item.value); return <button type="button" key={item.value} aria-pressed={tab === item.value} disabled={busy || tab === item.value} onClick={() => navigate(item.value)}><Icon size={17} />{item.name}</button>; })}</div>
        <button type="button" disabled={busy} className={s.refresh} onClick={() => { setBusy(true); setVersion(old => old + 1); }} aria-label="Cập nhật danh sách"><RefreshCw size={17} className={busy ? s.spinner : undefined} /><span>Cập nhật</span></button>
      </div>
      {!busy && !error && total !== null && <div className={s.resultCount}><span>{total.toLocaleString("vi-VN")} {role === "tai-xe" && tab === "all" ? "tin / đơn" : tab === "posts" ? "tin xe" : "đơn"}</span>{tab === "all" && <small>Ưu tiên đơn đang thực hiện</small>}</div>}
      {error && <div role="alert" className={s.error}><AlertCircle size={18} />{error}</div>}
      {busy ? <div className={s.skeleton} aria-busy="true" aria-label="Đang tải danh sách">{Array.from({ length: 4 }, (_, index) => <div key={index}><span /><span /><span /><span /></div>)}</div> :
      rows.length ? <div className={s.list}>{rows.map(item => {
        const id = item.id || item._id || "";
        const isPost = item.kind === "post" || tab === "posts";
        const action = orderListAction(role, item, isPost);
        const pickup = item.pickup?.address || item.route?.from || "Chưa có địa chỉ";
        const dropoff = item.dropoff?.address || item.route?.to || "Chưa có địa chỉ";
        const amount = item.offerPrice ?? item.price ?? item.budget?.max;
        const price = typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? amount.toLocaleString("vi-VN") + " đ" : "Chưa có giá";
        const stamp = item.activityOccurredAt || item.historyOccurredAt || item.updatedAt || item.createdAt;
        const date = stamp ? new Date(stamp) : null;
        const validDate = date && !Number.isNaN(date.getTime());
        const tone = ["completed"].includes(item.status) ? "success" : ["cancelled", "rejected", "expired"].includes(item.status) ? "danger" : ["disputed", "incident", "incident_reported", "paused"].includes(item.status) ? "warning" : "info";
        return <article key={(isPost ? "post:" : "order:") + id} className={s.card}>
          <div className={s.cardTop}><div className={s.code}>{isPost ? <Truck size={15} /> : <Hash size={15} />}<h2 title={item.orderCode || item.vehicle?.plateNumber}>{item.orderCode || item.vehicle?.plateNumber || "Tin xe"}</h2></div><span className={s.badge} data-tone={tone} title={orderStatusLabel(item.status)}>{orderStatusLabel(item.status)}</span></div>
          <div className={s.route}><div className={s.routePins} aria-hidden="true"><span /><i /><span /></div><div className={s.addresses}>
            <div><p title={pickup}><span className={s.srOnly}>Điểm nhận: </span>{pickup}</p></div>
            <div><p title={dropoff}><span className={s.srOnly}>Điểm trả: </span>{dropoff}</p></div>
          </div></div>
          <div className={s.meta}><span className={s.vehicleType}>{item.vehicle?.type || item.vehicleType || (isPost ? "Tin xe trống" : "Đơn vận chuyển")}</span>{validDate && <time dateTime={date.toISOString()} title="Thời gian cập nhật hành trình"><Clock3 size={12} />{date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}</time>}</div>
          <div className={s.cardActions}><div className={s.price}><strong>{price}</strong></div>{action && <Link className={action.label === "Tìm xe" ? s.primary : s.secondary} href={action.href}>{action.label}<ArrowRight size={15} /></Link>}</div>
          <details className={s.details}><summary>Xem thông tin</summary><div><p><strong>Điểm nhận:</strong> {pickup}</p><p><strong>Điểm trả:</strong> {dropoff}</p>{(item.notes || item.note) && <p>{item.notes || item.note}</p>}<p>Cập nhật hành trình và xử lý sự cố trong ứng dụng TXE PRO.</p></div></details>
        </article>;
      })}</div> : !error && <section className={s.empty}><PackageSearch size={42} /><h2>Chưa có {tab === "posts" ? "tin xe" : "đơn"} trong mục này</h2><p>{tab === "history" ? "Những hành trình đã kết thúc sẽ được lưu tại đây để bạn xem lại." : "Khi có thông tin mới, danh sách sẽ hiển thị tại đây. Bạn có thể tạo tin hoặc xem trạng thái khác."}</p>{tab !== "history" && <Link className={s.primary} href={newPostPath}>{role === "tai-xe" ? "Đăng xe trống" : "Tìm xe"}<ArrowRight size={16} /></Link>}</section>}
      {!busy && rows.length > 0 && <div className={s.pagination}><button type="button" className={s.secondary} disabled={page === 1 || busy} onClick={() => navigate(tab, page - 1)}><ChevronLeft size={15} />Trang trước</button><span>Trang {page}</span><button type="button" className={s.secondary} disabled={!more || busy} onClick={() => navigate(tab, page + 1)}>Trang tiếp<ChevronRight size={15} /></button></div>}
      {!busy && !rows.length && page > 1 && <div className={s.pagination}><button type="button" className={s.secondary} onClick={() => navigate(tab)}>Về trang đầu</button></div>}
    </>}
  </main><Footer /></>;
}
