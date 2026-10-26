"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RefreshCw, Search, ShieldCheck, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import RoleSwitchButton from "@/components/account/RoleSwitchButton";
import PostingForm, { PostingFormSkeleton, type PostingFormValues } from "./PostingForm";
import { validVehicleSelection, vehicleImage } from "@/utils/catalog-presentation";
import FundingPanel from "./FundingPanel";
import { postingRequest, PostingError } from "@/utils/posting-api";
import { buildDriverPosting, buildShipperPosting, postingCapabilities, readPostingPage, type PostingPage, type LocationValue, type PostingOptions, type PostingVehicle } from "@/utils/posting-contract";
import w from "./PostingExperience.module.css";
import { takeHomePostingDraft } from "@/utils/home-posting-draft";
import { bookingFundingNotice, canSelectVehicle, interruptionNotice, latestBookingMatch, matchFare, type BookingSelection, type VehicleMatch as Match } from "@/utils/shipper-booking";
import { orderStatusLabel } from "@/utils/order-display";

type Quote = { canPost: boolean; missingAmount: number; requiredAmount: number; platformFeeAmount: number; vatAmount: number; voucherEligible: boolean; paymentPolicy?: string };
const localDate = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export default function PostingWorkspace({ role }: { role: "chu-hang" | "tai-xe" }) {
  const driver = role === "tai-xe";
  const [auth, setAuth] = useState<"loading" | "login" | "wrong-role" | "kyc" | "ready" | "error">("loading");
  const [options, setOptions] = useState<PostingOptions | null>(null), [vehicles, setVehicles] = useState<PostingVehicle[]>([]);
  const [pickup, setPickup] = useState<LocationValue | null>(null), [dropoff, setDropoff] = useState<LocationValue | null>(null);
  const [type, setType] = useState(""), [child, setChild] = useState(""), [cargo, setCargo] = useState(""), [weight, setWeight] = useState("");
  const [vehicleId, setVehicleId] = useState(""), [price, setPrice] = useState(""), [min, setMin] = useState(0), [max, setMax] = useState(0), [radius, setRadius] = useState(30);
  const [from, setFrom] = useState(() => localDate(new Date())), [to, setTo] = useState(() => localDate(new Date(Date.now() + 4 * 3600000)));
  const [scheduled, setScheduled] = useState(false), [note, setNote] = useState(""), [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(""), [orderStatus, setOrderStatus] = useState(""), [matches, setMatches] = useState<Match[]>([]), [matchBusy, setMatchBusy] = useState(false);
  const [review, setReview] = useState<Match | null>(null), [quote, setQuote] = useState<Quote | null>(null), [missing, setMissing] = useState(0);
  const [confirmed, setConfirmed] = useState(false), [uncertain, setUncertain] = useState(false), [success, setSuccess] = useState(false);
  const [accountRole, setAccountRole] = useState("");
  const lock = useRef(false), uploadLock = useRef(false);
  const previewUrls = useRef(new Map<string, string>());
  useEffect(() => () => { previewUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const matchRevision = useRef(0);
  const matchLock = useRef(false);
  const vehicle = vehicles.find(v => (v.id || v._id) === vehicleId);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!localStorage.getItem("txpro_token")) { setAuth("login"); return; }
        const me = await postingRequest<{ user: { role: string; kycStatus?: string } }>("/auth/me");
        if (!active) return;
        setAccountRole(me.user.role);
        if (me.user.role !== role) { setAuth("wrong-role"); return; }
        if (driver && me.user.kycStatus && me.user.kycStatus !== 'verified') { setAuth('kyc'); return; }
        const catalog = await postingRequest<PostingOptions>("/chu-hang/find-vehicle/options", {}, false);
        if (!active) return;
        setOptions(catalog);
        if (driver) {
          const all: PostingVehicle[] = [];
          for (let page = 1; page <= 100; page++) {
            const data = await postingRequest<PostingPage<PostingVehicle>>("/tai-xe/vehicles?paginated=true&limit=100&page=" + page);
            const result = readPostingPage(data, 100);
            all.push(...result.items); if (!result.hasMore) break;
          }
          if (active) setVehicles(all.filter(v => v.status === "active"));
        } else {
          const existing = new URLSearchParams(window.location.search).get("order");
          if (existing && /^[a-f0-9]{24}$/i.test(existing)) {
            const detail = await postingRequest<{ status: string }>("/chu-hang/orders/" + existing);
            if (active) { setOrderId(existing); setOrderStatus(detail.status); }
          }
        }
        if (active) {
          // Restore only a fresh, explicit homepage draft after role/catalog checks.
          const draft = takeHomePostingDraft(sessionStorage, role, window.location.search);
          if (draft) {
            setPickup(draft.pickup); setDropoff(draft.dropoff);
            if (!driver) {
              const selection = { vehicleType: draft.vehicleType, child: draft.child || "", weightLabel: draft.weightLabel || "" };
              if (validVehicleSelection(selection, catalog)) {
                setType(selection.vehicleType); setChild(selection.child); setWeight(selection.weightLabel);
                if (catalog.cargoTypes.includes(draft.cargo || "") && postingCapabilities(selection.vehicleType, catalog).cargo) setCargo(draft.cargo || "");
              }
              setScheduled(draft.scheduled); if (draft.scheduled) setFrom(draft.from);
            } else {
              setFrom(draft.from); setTo(draft.to); setPrice(draft.price);
              setType(draft.vehicleType); setChild(draft.child || ""); setWeight(draft.weightLabel || ""); setCargo(draft.cargo || "");
            }
            setMessage(driver && draft.vehicleType
              ? "Đã nhận yêu cầu từ trang chủ: " + draft.vehicleType + (draft.child ? " · " + draft.child : "") + (draft.cargo ? " · " + draft.cargo : "") + ". Chọn phương tiện đã đăng ký phù hợp bên dưới. Hàng hóa và tải trọng đăng tin lấy từ phương tiện bạn chọn."
              : "Đã điền thông tin từ trang chủ. Vui lòng kiểm tra và hoàn thiện trước khi đăng; chưa có tin/đơn nào được tạo.");
          }
          setAuth("ready");
        }
      } catch (e) { if (active) { setError(e instanceof Error ? e.message : "Không tải được dữ liệu."); setAuth(e instanceof PostingError && e.code === "LOGIN_REQUIRED" ? "login" : e instanceof PostingError && ['KYC_REQUIRED', 'KYC_VERIFICATION_REQUIRED'].includes(e.code) ? 'kyc' : "error"); } }
    }
    void load();
    return () => { active = false; };
  }, [driver, role]);
  async function loadMatches(id = orderId) {
    if (!id || matchLock.current || lock.current) return;
    matchLock.current = true;
    const revision = ++matchRevision.current;
    setMatchBusy(true);
    try {
      const detail = await postingRequest<{ status: string }>("/chu-hang/orders/" + id);
      if (revision !== matchRevision.current) return;
      setOrderStatus(detail.status);
      if (canSelectVehicle(detail.status)) {
        const data = await postingRequest<Match[]>("/chu-hang/orders/" + id + "/matches");
        if (revision === matchRevision.current) setMatches(Array.isArray(data) ? data : []);
      } else { setMatches([]); setReview(null); setMissing(0); setConfirmed(false); }
    } catch (e) { if (revision === matchRevision.current) setError(e instanceof Error ? e.message : "Không tải được xe phù hợp."); }
    finally { matchLock.current = false; if (revision === matchRevision.current) setMatchBusy(false); }
  }
  useEffect(() => {
    if (!orderId || auth !== "ready" || uncertain) return;
    const revisions = matchRevision;
    let stopped = false;
    const refresh = async () => { if (!stopped && !document.hidden && !lock.current) await loadMatches(orderId); };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => { stopped = true; revisions.current++; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
    // Order ID, not the form fields, owns this read-only refresh loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, auth, uncertain]);
  async function upload(files: FileList | null) {
    if (!files || uploadLock.current) return;
    const selected = Array.from(files);
    if (selected.length + images.length > 3) { setError("Chỉ được đính kèm tối đa 3 ảnh."); return; }
    if (selected.some(f => !["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 5 * 1024 * 1024)) { setError("Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh."); return; }
    uploadLock.current = true; setUploading(true); setError("");
    try {
      for (const file of selected) {
        const data = new FormData(); data.append("image", file);
        const result = await postingRequest<{ url?: string; imageUrl?: string; path?: string }>("/chu-hang/find-vehicle/cargo-image", { method: "POST", body: data });
        const url = result.url || result.imageUrl || result.path;
        if (!url) throw new Error("Máy chủ chưa trả đường dẫn ảnh.");
        previewUrls.current.set(url, URL.createObjectURL(file));
        setImages(old => [...old, url]);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được ảnh."); }
    finally { uploadLock.current = false; setUploading(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || uploading || uncertain || !options) return;
    setError(""); setMessage(""); lock.current = true; setBusy(true);
    try {
    if (!driver) {
        if (orderId) return;
        if (!validVehicleSelection({ vehicleType: type, child, weightLabel: weight }, options)) throw new Error("Vui lòng chọn đầy đủ loại phương tiện.");
        const payload = buildShipperPosting({ pickup, dropoff, vehicleType: type, child, weightLabel: weight, cargo, time: scheduled ? from : "", notes: note, images }, options);
        const result = await postingRequest<{ orderId: string; status: string }>("/chu-hang/orders", { method: "POST", body: JSON.stringify(payload) });
        if (!/^[a-f0-9]{24}$/i.test(result?.orderId || "")) throw new PostingError("Chưa xác định được mã đơn. Kiểm tra Tin/đơn của tôi trước khi đăng lại.", "INVALID_RESPONSE", {}, true);
        setOrderId(result.orderId); setOrderStatus(result.status);
        window.history.replaceState(null, "", "?order=" + encodeURIComponent(result.orderId));
        setMessage("Đã đăng tìm xe. Chưa khóa voucher hoặc ký quỹ; quyền lợi được kiểm tra khi xác nhận đặt xe.");
      } else {
        if (!vehicle) throw new Error("Chọn phương tiện đã đăng ký của bạn.");
        const payload = buildDriverPosting({ vehicle, pickup, dropoff, from, to, price: Number(price), min, max, radius, note }, options);
        const eligibility = await postingRequest<Quote>("/tai-xe/posts/precheck-wallet", { method: "POST", body: JSON.stringify({ vehicleId, price: payload.price, pricing: payload.pricing, pricingMode: payload.pricingMode }) });
        setQuote(eligibility);
        if (!eligibility.canPost) { setMissing(eligibility.missingAmount); setConfirmed(false); return; }
        if (!confirmed) { setMessage("Kiểm tra quyền lợi bên dưới, đánh dấu đồng ý rồi bấm Đăng tin."); return; }
        const created = await postingRequest<{ postId: string }>("/tai-xe/posts", { method: "POST", body: JSON.stringify(payload) });
        if (!/^[a-f0-9]{24}$/i.test(created?.postId || "")) throw new PostingError("Chưa xác định được mã tin. Kiểm tra Tin/đơn của tôi trước khi đăng lại.", "INVALID_RESPONSE", {}, true);
        setSuccess(true); setMessage("Đã đăng xe trống. Quyền lợi được xử lý theo kết quả máy chủ.");
      }
    } catch (e) {
      if (e instanceof PostingError && e.code === "DRIVER_POST_INSUFFICIENT_BALANCE") { setMissing(Number(e.details.missingAmount) || 0); setConfirmed(false); }
      setUncertain(e instanceof PostingError && e.uncertain);
      setError(e instanceof Error ? e.message : "Không đăng được tin.");
    } finally { lock.current = false; setBusy(false); }
  }
  async function choose() {
    if (!review || !confirmed || lock.current || uncertain || missing > 0) return;
    matchRevision.current++; setMatchBusy(false);
    lock.current = true; setBusy(true); setError("");
    try {
      const latest = await latestBookingMatch(postingRequest, orderId, review);
      if (matchFare(latest) !== matchFare(review) || interruptionNotice(latest) !== interruptionNotice(review)) {
        setReview(latest); setConfirmed(false); setMissing(0);
        setMessage("Tin xe vừa cập nhật. Vui lòng kiểm tra giá và thông tin mới rồi xác nhận lại.");
        return;
      }
      const selected = await postingRequest<BookingSelection>("/chu-hang/orders/" + orderId + "/select-driver", { method: "POST",
        body: JSON.stringify({ driverId: latest.driverId, postId: latest.postId, offerPrice: matchFare(latest) }) });
      if (selected?.orderId !== orderId || selected.status !== "waiting_driver_acceptance") {
        throw new PostingError("Chưa xác định được kết quả đặt xe. Vui lòng kiểm tra đơn của bạn trước khi thử lại.", "INVALID_RESPONSE", {}, true);
      }
      setReview(null); setMissing(0); setConfirmed(false); setOrderStatus(selected.status); setMatches([]);
      setMessage(bookingFundingNotice(selected));
    } catch (e) {
      if (e instanceof PostingError && e.code === "SHIPPER_ESCROW_INSUFFICIENT_BALANCE") setMissing(Number(e.details.missingAmount) || 0);
      else { setReview(null); setConfirmed(false); setMatches([]); }
      setUncertain(e instanceof PostingError && e.uncertain);
      setError(e instanceof Error ? e.message : "Chưa đặt được xe.");
    } finally { lock.current = false; setBusy(false); }
  }
  const path = (driver ? "/tai-xe/dang-tin" : "/chu-hang/form-tao-don") +
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "home" &&
      !new URLSearchParams(window.location.search).has("order") ? "?from=home" : "");
  function removeImage(url: string) {
    if (busy || uploading || uncertain) return;
    const preview = previewUrls.current.get(url);
    if (preview) URL.revokeObjectURL(preview);
    previewUrls.current.delete(url);
    setImages(old => old.filter(item => item !== url));
  }
  function updateForm(patch: Partial<PostingFormValues>) {
    if (busy || uploading || uncertain) return;
    if (patch.vehicleId !== undefined && patch.vehicleId !== vehicleId || patch.price !== undefined && patch.price !== price) {
      setQuote(null); setMissing(0); setConfirmed(false);
    }
    if (patch.type !== undefined && patch.type !== type) {
      setCargo(""); setChild(""); setWeight(""); setImages([]);
      previewUrls.current.forEach(url => URL.revokeObjectURL(url)); previewUrls.current.clear();
    }
    if ("pickup" in patch) setPickup(patch.pickup || null);
    if ("dropoff" in patch) setDropoff(patch.dropoff || null);
    if (patch.type !== undefined) setType(patch.type);
    if (patch.child !== undefined) setChild(patch.child);
    if (patch.cargo !== undefined) setCargo(patch.cargo);
    if (patch.weight !== undefined) setWeight(patch.weight);
    if (patch.vehicleId !== undefined) setVehicleId(patch.vehicleId);
    if (patch.price !== undefined) setPrice(patch.price);
    if (patch.min !== undefined) setMin(patch.min);
    if (patch.max !== undefined) setMax(patch.max);
    if (patch.radius !== undefined) setRadius(patch.radius);
    if (patch.from !== undefined) setFrom(patch.from);
    if (patch.to !== undefined) setTo(patch.to);
    if (patch.scheduled !== undefined) setScheduled(patch.scheduled);
    if (patch.note !== undefined) setNote(patch.note);
    if (patch.confirmed !== undefined) setConfirmed(patch.confirmed);
  }
  useEffect(() => {
    if (auth !== "ready") return;
    const target = error ? "posting-feedback" : missing > 0 ? "posting-funding" : review ? "posting-review" : quote ? "posting-finance" : "";
    const element = target ? document.getElementById(target) : null;
    element?.scrollIntoView({ block: "nearest", behavior: "auto" });
    if (target && target !== "posting-finance") element?.focus({ preventScroll: true });
  }, [auth, error, missing, review, quote]);
  return <><Header /><div className={w.surface}><main className={w.page}>
    <div className={w.topNav}><Link href="/"><ArrowLeft size={16} />Trang chủ</Link><Link href="/don-cua-ban">Tin / đơn của tôi<ArrowRight size={15} /></Link></div>
    <header className={w.hero}>
      <div><span className={w.heroBadge}>{driver ? <Truck size={15} /> : <Search size={15} />}TXE PRO / {driver ? "Tài xế" : "Chủ hàng"}</span>
        <h1>{driver ? "Đăng xe trống" : "Tìm xe ngay"}</h1>
        <p>{driver ? "Chủ động lộ trình. Kết nối chuyến đi phù hợp với xe của bạn." : "Chọn điểm hẹn, chọn xe. Kết nối tài xế cho hành trình của bạn."}</p>
      </div>
      <Image className={w.heroArt} src={vehicleImage(driver ? "xe tải" : "ô tô")} alt="" width={210} height={150} sizes="(max-width: 520px) 92px, 170px" />
    </header>
    <nav className={w.roleNav} aria-label="Chọn chức năng đăng tin">
      <Link href="/chu-hang/form-tao-don" aria-current={!driver ? "page" : undefined}><Search size={17} />Tìm xe ngay</Link>
      <Link href="/tai-xe/dang-tin" aria-current={driver ? "page" : undefined}><Truck size={17} />Đăng xe trống</Link>
    </nav>
    {auth === "loading" ? <PostingFormSkeleton /> : auth !== "ready" ? <section className={w.stateCard}>
      <Image src={vehicleImage(driver ? "xe tải" : "ô tô")} alt="" width={260} height={190} sizes="230px" />
      <div><span className={w.stateBadge}><ShieldCheck size={16} />Tài khoản TXE PRO</span>
        <h2>{auth === "login" ? "Đăng nhập để bắt đầu" : auth === "wrong-role" ? "Bạn đang ở vai trò khác" : auth === 'kyc' ? 'Xác minh danh tính tài xế' : "Chưa tải được thông tin"}</h2>
        <p>{auth === "wrong-role" ? "Chuyển sang vai trò " + (driver ? "tài xế" : "chủ hàng") + " để tiếp tục với cùng tài khoản. Việc chuyển chỉ thực hiện khi bạn xác nhận."
          : error || "Sử dụng tài khoản trên ứng dụng để đăng tin, tìm xe và quản lý hành trình ngay trên web."}</p>
        <div className={w.buttonRow}>{auth === "error" ? <button type="button" className={w.primaryButton} onClick={() => window.location.reload()}><RefreshCw size={17} />Thử lại</button>
          : <Link className={w.primaryButton} href={"/login?next=" + encodeURIComponent(path)}>Đăng nhập<ArrowRight size={17} /></Link>}
          {auth === "wrong-role" && <RoleSwitchButton currentRole={accountRole} targetRole={role} />}
          {auth === 'kyc' && <Link className={w.primaryButton} href='/user/ekyc?next=%2Ftai-xe%2Fphuong-tien'>Xác minh eKYC để tiếp tục</Link>}
          <Link className={w.secondaryButton} href={auth === "wrong-role" ? "/user" : "/"}>{auth === "wrong-role" ? "Trang cá nhân" : "Về trang chủ"}</Link>
        </div>
      </div>
    </section> : <>
      {(error || message) && <div id="posting-feedback" tabIndex={-1} className={error ? w.errorMessage : w.message} role={error ? "alert" : "status"}>
        {error || message}{uncertain && <Link href="/don-cua-ban"> Kiểm tra kết quả trước khi thử lại.</Link>}
      </div>}
      {success ? <section className={w.stateCard}>
        <Image src={vehicleImage(vehicle?.vehicleTypeParent || vehicle?.type || "xe tải")} alt="" width={260} height={190} sizes="230px" />
        <div><span className={w.stateBadge}><CheckCircle2 size={17} />Đăng tin thành công</span><h2>Xe của bạn đã sẵn sàng kết nối</h2>
          <p>Tin xe đã được đăng. Theo dõi trạng thái và quản lý tin trong danh sách của bạn.</p>
          <Link className={w.primaryButton} href="/don-cua-ban">Xem tin / đơn của tôi<ArrowRight size={17} /></Link></div>
      </section> : orderId ? <section className={w.results}>
        <div className={w.resultsHeader}><div><h2>{canSelectVehicle(orderStatus) ? "Xe phù hợp với bạn" : orderStatusLabel(orderStatus)}</h2>
          <p>{["searching_driver", "waiting_driver"].includes(orderStatus) ? "Chọn một tin xe để xem giá và xác nhận đặt xe." : "Xem trạng thái và các bước tiếp theo trong danh sách đơn của bạn."}</p></div>
          <button type="button" className={w.secondaryButton} disabled={matchBusy || busy} onClick={() => void loadMatches()}>{matchBusy ? <Loader2 className={w.spin} size={16} /> : <RefreshCw size={16} />}Cập nhật</button>
        </div>
        {matchBusy && matches.length === 0 ? <div className={w.matchGrid} aria-busy="true" aria-label="Đang tìm xe phù hợp">{[0, 1, 2, 3].map(index => <div className={w.matchSkeleton} key={index} />)}</div>
          : matches.length === 0 ? <div className={w.emptyState}><Search size={35} /><strong>{canSelectVehicle(orderStatus) ? "Đang tìm xe phù hợp" : orderStatusLabel(orderStatus)}</strong>
            <p>{canSelectVehicle(orderStatus) ? "Bạn có thể quay lại danh sách đơn. Hệ thống tiếp tục tìm xe theo yêu cầu của bạn." : orderStatus === "waiting_driver_acceptance" ? "Yêu cầu đặt xe đã được gửi. Trang tự cập nhật khi tài xế phản hồi; quay lại danh sách không hủy yêu cầu." : "Mở danh sách đơn để theo dõi trạng thái mới nhất."}</p></div>
          : <div className={w.matchGrid} aria-busy={matchBusy}>{matches.map(item => <button type="button" key={item.postId} className={w.matchButton} disabled={busy || matchBusy || uncertain}
            onClick={() => { setReview(item); setConfirmed(false); setMissing(0); setError(""); setMessage(""); }}>
            <Image src={vehicleImage(item.vehicle.type)} alt="" width={140} height={100} sizes="100px" />
            <div><strong>{item.driverName}</strong><small>{item.vehicle.type}</small><span className={w.plate}>{item.vehicle.plateNumber}</span></div>
            <div className={w.matchPrice}><span>{matchFare(item) ? matchFare(item).toLocaleString("vi-VN") + " ₫" : "Chưa có giá"}</span><ArrowRight size={18} /></div>
          </button>)}</div>}
        <Link className={w.secondaryButton} href="/don-cua-ban"><ArrowLeft size={15} />Về tin / đơn của tôi</Link>
      </section> : options && <PostingForm driver={driver} options={options} vehicles={vehicles}
        value={{ pickup, dropoff, type, child, cargo, weight, vehicleId, price, min, max, radius, from, to, scheduled, note, images, confirmed }}
        busy={busy} uploading={uploading} uncertain={uncertain} quote={quote}
        onChange={updateForm} onSubmit={submit} onUpload={files => { void upload(files); }} onRemoveImage={removeImage} imagePreview={url => previewUrls.current.get(url)} />}
      {review && <section id="posting-review" tabIndex={-1} className={w.review} aria-label="Xác nhận và đặt xe">
        <span className={w.stateBadge}><ShieldCheck size={16} />Kiểm tra trước khi đặt</span><h2>Xác nhận và đặt xe</h2>
        <p>Tài xế: <strong>{review.driverName}</strong><br />{review.vehicle.type} · {review.vehicle.plateNumber}</p>
        <h3>{matchFare(review).toLocaleString("vi-VN")} ₫</h3>
        {interruptionNotice(review) && <p role="note">Tài xế đã sẵn sàng trở lại. {interruptionNotice(review)} Vui lòng xem xét trước khi chọn lại.</p>}
        {review.driverNote && <p>{review.driverNote}</p>}
        <p>Xác nhận sẽ gửi yêu cầu cho tài xế và giữ voucher hoặc ký quỹ theo điều kiện của đơn. Cước chuyến đi thanh toán trực tiếp theo thỏa thuận với tài xế.</p>
        <label className={w.bookingConsent}><input type="checkbox" disabled={busy || uncertain} checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Tôi đã kiểm tra thông tin và đồng ý điều khoản chuyến đi.</span></label>
        <Link className={w.termsLink} href="/thong-tin/dieu-khoan-su-dung" target="_blank" rel="noopener noreferrer">Đọc điều khoản sử dụng</Link>
        <div className={w.buttonRow}><button className={w.secondaryButton} type="button" disabled={busy} onClick={() => { setReview(null); setMissing(0); setConfirmed(false); }}>Quay lại</button>
          <button className={w.primaryButton} type="button" disabled={busy || !confirmed || missing > 0 || uncertain} onClick={() => void choose()}>{busy ? <Loader2 size={18} className={w.spin} /> : <CheckCircle2 size={18} />}{busy ? "Đang xác nhận…" : "Xác nhận và đặt xe"}</button>
        </div>
      </section>}
      {missing > 0 && <div id="posting-funding" tabIndex={-1} className={w.fundingZone}><FundingPanel key={orderId + ":" + missing} missingAmount={missing}
        onPaid={() => { setMissing(0); setQuote(null); setConfirmed(false); setMessage("Đã nhận tiền. Bấm xác nhận lại để kiểm tra điều kiện mới nhất."); }} /></div>}
    </>}
  </main></div><Footer /></>;
}
