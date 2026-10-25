"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { postingRequest } from "@/utils/posting-api";
import { orderStatusLabel } from "@/utils/order-display";
import { readPostingPage, type PostingPage } from "@/utils/posting-contract";
import s from "./Posting.module.css";
type RecordRow = { id?: string; _id?: string; orderCode?: string; status: string; title?: string; offerPrice?: number; price?: number; budget?: { max?: number }; pickup?: { address: string }; dropoff?: { address: string }; route?: { from: string; to: string }; updatedAt?: string; createdAt?: string; vehicle?: { plateNumber?: string }; notes?: string };
export default function OrdersWorkspace() {
  const [role, setRole] = useState(""), [auth, setAuth] = useState(true), [error, setError] = useState("");
  const [tab, setTab] = useState("in-progress"), [page, setPage] = useState(1), [rows, setRows] = useState<RecordRow[]>([]);
  const [busy, setBusy] = useState(true), [more, setMore] = useState(false), [version, setVersion] = useState(0);
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
    setBusy(true); setError("");
    const endpoint = tab === "posts" ? "/tai-xe/posts" : "/" + role + "/orders/" + tab;
    postingRequest<PostingPage<RecordRow>>(endpoint + "?paginated=true&limit=20&page=" + page + (tab === "in-progress" ? "&includeAwaitingIncidentResponse=true" : "")).then(data => {
      if (!active) return;
      const result = readPostingPage(data);
      setRows(result.items); setMore(result.hasMore);
    }).catch(e => { if (active) { setRows([]); setMore(false); setError(e.message); } }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [role, tab, page, version]);
  const tabs = [{ value: "in-progress", name: "Đang thực hiện" }, { value: "waiting", name: "Đơn chờ" },
    ...(role === "tai-xe" ? [{ value: "posts", name: "Tin xe của tôi" }] : []), { value: "history", name: "Lịch sử" }];
  return <><Header /><main className={s.page}><div className={s.top}><Link href="/">← Trang chủ</Link><Link href="/dang-tin">+ Đăng tin mới</Link></div><div className={s.heading}><span>TXE PRO / KHU VỰC CÁ NHÂN</span><h1>Tin/đơn của tôi</h1><p>Dữ liệu thật từ tài khoản trên ứng dụng. Danh sách phân trang riêng theo từng trạng thái, không dùng dữ liệu mô phỏng.</p></div>{!auth ? <section className={s.panel}><p>{error}</p><Link className={s.primary} href="/login?next=%2Fdon-cua-ban">Đăng nhập</Link></section> : <><div className={s.tabs} role="group" aria-label="Trạng thái đơn">{tabs.map(item => <button type="button" key={item.value} aria-pressed={tab === item.value} onClick={() => { setTab(item.value); setPage(1); }} className={s.secondary + " " + (tab === item.value ? s.activeTab : "")}>{item.name}</button>)}<button type="button" disabled={busy} className={s.secondary} onClick={() => setVersion(old => old + 1)}>Cập nhật</button></div>{error && <div role="alert" className={s.error}>{error}</div>}{busy ? <div className={s.skeleton} aria-busy="true" aria-label="Đang tải danh sách"><div /><div /><div /></div> : <div className={s.list}>{rows.map(item => { const id = item.id || item._id || ""; return <article key={id}><div className={s.row}><h3>{item.orderCode || item.vehicle?.plateNumber || item.title || "Tin xe"}</h3><span className={s.badge}>{orderStatusLabel(item.status)}</span></div><p>{item.pickup?.address || item.route?.from} → {item.dropoff?.address || item.route?.to}</p><div className={s.row}><strong>{Number(item.offerPrice || item.price || item.budget?.max || 0).toLocaleString("vi-VN")} đ</strong><small>{item.updatedAt || item.createdAt ? new Date(item.updatedAt || item.createdAt!).toLocaleString("vi-VN") : ""}</small></div>{role === "chu-hang" && ["searching_driver", "waiting_driver"].includes(item.status) && <Link className={s.primary} href={"/chu-hang/form-tao-don?order=" + encodeURIComponent(id)}>Tìm xe</Link>}<details><summary>Thông tin đơn/tin</summary><p>{item.title || "Lộ trình theo thông tin đã đăng"}</p>{item.notes && <p>{item.notes}</p>}<p>Mã tham chiếu: {id}</p><p>Để cập nhật hành trình, báo cáo sự cố và các thao tác chuyến đi, vui lòng dùng ứng dụng TXE PRO. Khu vực web này chưa thay thế màn hình vận hành chuyến trên app.</p></details></article>; })}{rows.length === 0 && !error && <div className={s.empty}>Chưa có tin/đơn ở trạng thái này.</div>}</div>}<div className={s.pagination}><button type="button" className={s.secondary} disabled={page === 1 || busy} onClick={() => setPage(n => n - 1)}>Trang trước</button><span>Trang {page}</span><button type="button" className={s.secondary} disabled={!more || busy} onClick={() => setPage(n => n + 1)}>Trang tiếp</button></div></>}</main><Footer /></>;
}
