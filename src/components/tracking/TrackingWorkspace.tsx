"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Route, RefreshCw, ShieldCheck, LockKeyhole, ArrowRight, PackageSearch, Clock3, Check, Phone, Copy, CheckCheck, MapPinned } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import VehicleIcon from "@/components/common/VehicleIcon";
import { fetchWithAuth } from "@/utils/api";
import { orderStatusLabel } from "@/utils/order-display";
import TrackingMap from "./TrackingMap";
import { trackingDate, gpsAge, type TrackingData } from "./types";
import s from "./Tracking.module.css";
export default function TrackingWorkspace() {
 const params = useSearchParams(), router = useRouter();
 const query = params.get("code")?.trim().toUpperCase() || "";
 const [code, setCode] = useState(query), [data, setData] = useState<TrackingData | null>(null);
 const [loading, setLoading] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
 const [copy, setCopy] = useState(false), [copyError, setCopyError] = useState("");
 const sequence = useRef(0);
 const loadedQuery = useRef("");
 useEffect(() => {
  const current = ++sequence.current;
  setCode(query); setCopy(false); setCopyError(""); setError("");
  if (loadedQuery.current !== query) setData(null);
  if (!query) { setLoading(false); return; }
  if (!/^ORD-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(query) || query.length > 100) { setError("Vui lòng nhập mã đơn hợp lệ, bắt đầu bằng ORD-."); setLoading(false); return; }
  const controller = new AbortController();
  setLoading(loadedQuery.current !== query);
  fetchWithAuth("/api/tracking?code=" + encodeURIComponent(query), { cache: "no-store", signal: controller.signal })
    .then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Chưa tải được thông tin đơn.");
      if (!body?.order?.orderCode || !["public", "private"].includes(body.access)) throw new Error("Thông tin tra cứu chưa đầy đủ.");
      if (current === sequence.current && !controller.signal.aborted) { loadedQuery.current = query; setData(body); }
    }).catch(error => { if (current === sequence.current && !controller.signal.aborted) setError(error.message || "Không kết nối được hệ thống."); })
    .finally(() => { if (current === sequence.current && !controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [query, reload]);
 const privateView = data?.access === "private";
 const type = data?.driver?.vehicleType || data?.order.vehicleType || "";
 const order = data?.order;
 const terminal = ["completed", "cancelled", "rejected", "deleted"].includes(order?.status || "");
 useEffect(() => {
   if (!privateView || terminal || !query) return;
   const timer = window.setInterval(() => { if (!document.hidden) setReload(value => value + 1); }, 30000);
   return () => window.clearInterval(timer);
 }, [privateView, terminal, query]);
 const steps = order ? [
  { label: "Đơn được tạo", value: order.createdAt },
  { label: "Tài xế nhận đơn", value: order.acceptedAt },
  { label: "Bắt đầu chuyến", value: order.startedAt },
  { label: order.status === "cancelled" ? "Đơn đã hủy" : "Đã đến điểm trả", value: order.status === "cancelled" ? order.cancelledAt : order.deliveredAt },
 ] : [];
 async function copyCode() {
  try { await navigator.clipboard.writeText(order?.orderCode || ""); setCopy(true); setCopyError(""); }
  catch { setCopyError("Bạn có thể chọn và sao chép mã đơn trực tiếp."); }
 }
 const submit = (event: React.FormEvent) => {
  event.preventDefault();
  const next = code.trim().toUpperCase();
  if (!next) { setError("Vui lòng nhập mã đơn cần tra cứu."); return; }
  if (next === query) setReload(value => value + 1);
  else router.push("/tracking?code=" + encodeURIComponent(next));
 };
 return <><Header /><main className={s.page}>
  <header className={s.heading}><span className={s.eyebrow}><Route size={16} />HÀNH TRÌNH TRÊN TXE PRO</span><h1>Theo dõi đơn hàng</h1><p>Nhập mã đơn để xem trạng thái mới nhất và các mốc hành trình đã được ghi nhận.</p></header>
  <form className={s.search} onSubmit={submit}><label htmlFor="tracking-code" className={s.srOnly}>Mã đơn hàng</label><Search size={21} aria-hidden="true" />
   <input id="tracking-code" value={code} onChange={event => setCode(event.target.value)} placeholder="Nhập mã đơn ORD-…" maxLength={100} autoComplete="off" spellCheck={false} />
   <button type="submit" disabled={loading}>{loading ? <RefreshCw size={17} className={s.spin} /> : <Search size={17} />}Tra cứu</button>
  </form>
  {error && <div className={s.error} role="alert">{error}<button type="button" onClick={() => setReload(value => value + 1)}>Thử lại</button></div>}
  {loading ? <div className={s.skeleton} role="status" aria-label="Đang tra cứu đơn"><div /><div /><div /></div> :
  data && order ? <>
   <section className={s.overview}><div className={s.code}><span>Mã đơn hàng</span><div><h2>{order.orderCode}</h2><button type="button" onClick={copyCode} aria-label={copy ? "Đã sao chép mã đơn" : "Sao chép mã đơn"}>{copy ? <CheckCheck size={18} /> : <Copy size={18} />}</button></div><small role="status">{copyError || (copy ? "Đã sao chép" : "")}</small></div>
    <div className={s.status}><span data-terminal={terminal}>{orderStatusLabel(order.status)}</span><small><ShieldCheck size={13} />{privateView ? "Thông tin của đơn bạn có quyền truy cập" : "Thông tin tra cứu công khai"}</small></div>
   </section>
   <section className={s.timeline} aria-label="Các mốc hành trình">{steps.map((step, index) => <div key={step.label} data-done={Boolean(step.value)}><span className={s.stepIcon}>{step.value ? <Check size={16} /> : <span>{index + 1}</span>}</span><strong>{step.label}</strong><small>{trackingDate(step.value) || "Chưa ghi nhận"}</small></div>)}</section>
   <div className={s.layout}><section className={s.mapPanel}>
    <div className={s.panelHeading}><div><MapPinned size={18} /><h2>Lộ trình di chuyển</h2></div><button type="button" onClick={() => setReload(value => value + 1)} aria-label="Cập nhật thông tin theo dõi"><RefreshCw size={16} />Cập nhật</button></div>
    <TrackingMap data={data} />
    {privateView && <div className={s.gps}><span /><Clock3 size={15} />{data.latestLocation ? gpsAge(data.latestLocation.sampledAt || data.latestLocation.createdAt) : "Chưa nhận được vị trí GPS của tài xế"}</div>}
   </section>
   <aside className={s.sidebar}>
    <section className={s.infoCard}><h2>Phương tiện</h2><div className={s.vehicle}><VehicleIcon type={type} size={88} /><div><strong>{type || "Chưa có thông tin phương tiện"}</strong><span>{privateView ? data.driver?.plateNumber || "Biển số chưa cập nhật" : "Nhóm phương tiện của đơn"}</span></div></div>
     {privateView && data.driver && <div className={s.driver}><span>Tài xế</span><strong>{data.driver.fullName || "Chưa cập nhật tên"}</strong>{data.driver.phone && <a href={"tel:" + data.driver.phone.replace(/[^+\d]/g, "")}><Phone size={15} />{data.driver.phone}</a>}</div>}
    </section>
    <section className={s.infoCard}><h2>Thông tin hành trình</h2><div className={s.locations}><div><i /><span><small>Điểm nhận</small><p>{order.pickup?.address || "Chưa có địa chỉ"}</p></span></div><div><i /><span><small>Điểm trả</small><p>{order.dropoff?.address || "Chưa có địa chỉ"}</p></span></div></div>
     {typeof order.route?.distanceMeters === "number" && order.route.distanceMeters > 0 && <div className={s.price}><span>Quãng đường</span><strong>{(order.route.distanceMeters / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km</strong></div>}
     {typeof order.route?.durationSeconds === "number" && order.route.durationSeconds > 0 && <div className={s.price}><span>Thời gian dự kiến</span><strong>{Math.ceil(order.route.durationSeconds / 60).toLocaleString("vi-VN")} phút</strong></div>}
     <div className={s.price}><span>Giá chuyến</span><strong>{typeof order.offerPrice === "number" ? order.offerPrice.toLocaleString("vi-VN") + " đ" : "Chưa có giá"}</strong></div>
    </section>
    <div className={s.help}><ShieldCheck size={20} /><p>{privateView ? "Thông tin vị trí phụ thuộc lần cập nhật GPS gần nhất. Đối chiếu trạng thái và liên hệ tài xế khi cần." : "Bản đồ hiển thị lộ trình giao nhận. GPS trực tiếp và thông tin liên hệ tài xế chỉ dành cho tài khoản có quyền xem đơn."}</p></div>
    <Link href="/tro-giup" className={s.helpLink}>Cần hỗ trợ về đơn hàng?<ArrowRight size={15} /></Link>
   </aside></div>
  </> : !error && <section className={s.empty}><PackageSearch size={43} /><h2>Mỗi hành trình, rõ từng bước</h2><p>Sử dụng mã ORD trong chi tiết đơn hoặc thông báo của bạn. Xem trạng thái, bản đồ và thông tin vận chuyển mà không cần đăng nhập.</p><div><span><Search size={17} />Nhập đúng mã đơn</span><span><Route size={17} />Xem trạng thái hành trình</span><span><LockKeyhole size={17} />Tra cứu không cần đăng nhập</span></div></section>}
 </main><Footer /></>;
}
