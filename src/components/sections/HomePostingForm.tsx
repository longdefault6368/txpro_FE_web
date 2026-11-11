"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Package, Truck, Loader2, X, ZoomIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LocationField from "@/components/posting/LocationField";
import PostingTimeField from "@/components/posting/PostingTimeField";
import { VehicleCatalogField, CargoCatalogField } from "@/components/posting/CatalogPicker";
import { validVehicleSelection } from "@/utils/catalog-presentation";
import { postingRequest } from "@/utils/posting-api";
import { postingCapabilities, validLocation, type LocationValue, type PostingOptions } from "@/utils/posting-contract";
import { saveHomePostingDraft, type PostingRole } from "@/utils/home-posting-draft";
import s from "./HomePostingForm.module.css";

const POSTERS = [
  "/images/intro/01-bat-dau.webp",
  "/images/intro/02-phuong-tien.webp",
  "/images/intro/03-hang-hoa.webp",
  "/images/intro/04-vi-tri.webp",
  "/images/intro/05-lich.webp",
  "/images/intro/06-tim-xe.webp",
];

function PosterLightbox({ src, alt, onClose, onPrev, onNext, labels }: { src: string; alt: string; onClose: () => void; onPrev: () => void; onNext: () => void; labels: { close: string; previous: string; next: string } }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; };
  }, []);
  function onKey(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") { event.preventDefault(); onNext(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); onPrev(); }
  }
  return <dialog ref={ref} className={s.lightbox} aria-label={alt} onKeyDown={onKey}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" className={s.lightboxClose} onClick={onClose} aria-label={labels.close}><X size={22} /></button>
    <button type="button" className={s.lightboxPrev} onClick={onPrev} aria-label={labels.previous}><ChevronLeft size={22} /></button>
    <img src={src} alt={alt} />
    <button type="button" className={s.lightboxNext} onClick={onNext} aria-label={labels.next}><ChevronRight size={22} /></button>
  </dialog>;
}

export default function HomePostingForm() {
  const { language } = useLanguage();
  const router = useRouter();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [role, setRole] = useState<PostingRole>("chu-hang");
  const [pickup, setPickup] = useState<LocationValue | null>(null), [dropoff, setDropoff] = useState<LocationValue | null>(null);
  const [vehicleType, setVehicleType] = useState(""), [scheduled, setScheduled] = useState(false), [shipperTime, setShipperTime] = useState("");
  const [child, setChild] = useState(""), [weightLabel, setWeightLabel] = useState(""), [cargo, setCargo] = useState("");
  const [driverFrom, setDriverFrom] = useState(""), [driverTo, setDriverTo] = useState(""), [price, setPrice] = useState("250000");
  const [options, setOptions] = useState<PostingOptions | null>(null), [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [slide, setSlide] = useState(0), [hold, setHold] = useState(false), [enlarged, setEnlarged] = useState(false), [kept, setKept] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]), submitting = useRef(false);
  const driver = role === "tai-xe";
  const caps = postingCapabilities(vehicleType, options || undefined);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogState("loading");
    postingRequest<PostingOptions>("/chu-hang/find-vehicle/options", { signal: controller.signal }, false)
      .then(value => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(value.vehicleTypes) || !value.vehicleTypes.length) { setCatalogState("error"); return; }
        setOptions(value); setCatalogState("ready");
      }).catch(() => { if (!controller.signal.aborted) setCatalogState("error"); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (hold || enlarged || media?.matches) return;
    const timer = window.setInterval(() => setSlide(index => (index + 1) % POSTERS.length), 5600);
    return () => window.clearInterval(timer);
  }, [hold, slide, enlarged]);
  useEffect(() => {
    const timer = window.setTimeout(() => setKept(slide), 800);
    return () => window.clearTimeout(timer);
  }, [slide]);
  function selectRole(next: PostingRole) { setRole(next); setError(""); }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 :
      event.key === "ArrowRight" || event.key === "ArrowLeft" ? 1 - index : null;
    if (next === null) return;
    event.preventDefault(); selectRole(next === 0 ? "chu-hang" : "tai-xe"); tabs.current[next]?.focus();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!validLocation(pickup) || !validLocation(dropoff)) {
      setError(c("Chọn đủ hai địa điểm từ gợi ý hoặc vị trí hiện tại để có tọa độ chính xác.", "Select both locations from suggestions or current location to include coordinates.", "请从建议或当前位置选择两端地点，以获取坐标。")); return;
    }
    if (options && !validVehicleSelection({ vehicleType, child, weightLabel }, options)) {
      setError(c("Vui lòng chọn loại phương tiện.", "Please choose a vehicle type.", "请选择车型。")); return;
    }
    if (options && caps.cargo && !options.cargoTypes.includes(cargo)) {
      setError(c("Vui lòng chọn loại hàng hóa.", "Please choose a cargo type.", "请选择货物类型。")); return;
    }
    const from = driver ? driverFrom : scheduled ? shipperTime : "";
    if ((driver || scheduled) && (!from || Date.parse(from) <= Date.now() || !Number.isFinite(Date.parse(from)))) {
      setError(c("Chọn thời gian bắt đầu trong tương lai.", "Choose a future start time.", "请选择未来的开始时间。")); return;
    }
    if (driver && (!driverTo || Date.parse(driverTo) <= Date.parse(from) || !/^\d{1,12}$/.test(price) || Number(price) <= 0)) {
      setError(c("Giờ kết thúc phải sau giờ bắt đầu và giá phải là số nguyên lớn hơn 0.", "End time must follow the start; enter a positive whole-number price.", "结束时间须晚于开始时间，价格须为正整数。")); return;
    }
    try {
      submitting.current = true; setSaving(true);
      const path = saveHomePostingDraft(sessionStorage, {
        role, pickup, dropoff, vehicleType, scheduled, child, weightLabel, cargo: caps.cargo ? cargo : "",
        from, to: driver ? driverTo : "", price: driver ? price : "",
      });
      router.push(path);
    } catch {
      submitting.current = false; setSaving(false);
      setError(c("Chưa lưu được thông tin tạm. Cho phép lưu trữ trên trình duyệt hoặc mở form đầy đủ bên dưới.", "Could not save the draft. Allow browser storage or open the full form below.", "无法保存草稿，请允许浏览器存储，或打开下方完整表单。"));
    }
  }
  const captions = [
    c("Bắt đầu hành trình và chọn vai trò trên ứng dụng TXE PRO", "Start a journey and choose a role in the TXE PRO app", "在 TXE PRO 应用中开始行程并选择角色"),
    c("Chọn loại phương tiện, từ xe máy đến container", "Choose a vehicle, from a motorcycle to a container truck", "选择车型，从摩托车到集装箱车"),
    c("Chọn loại hàng cần chở", "Choose the cargo you need to move", "选择需要运输的货物"),
    c("Xác nhận vị trí và phạm vi kết nối", "Confirm a location and the connection range", "确认位置和连接范围"),
    c("Lên lịch nhận hàng theo ngày và khung giờ", "Schedule a pickup by day and time window", "按日期和时间段安排取货"),
    c("Tìm xe, xem lộ trình và theo dõi chuyến hàng", "Find a vehicle, review the route and follow the shipment", "找车、查看路线并跟踪货运"),
  ];
  function showSlide(next: number) { setSlide((next + POSTERS.length) % POSTERS.length); }
  return <section id="quick-posting" className={s.section} aria-labelledby="quick-posting-title">
    <div className={s.stage} data-reveal="left" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={event => { const next = event.relatedTarget; if (!(next instanceof Node) || !event.currentTarget.contains(next)) setHold(false); }}>
      <h2 id="quick-posting-title" className={s.srOnly}>{c("Bắt đầu ngay tại đây", "Start right here", "从这里开始")}</h2>
      {POSTERS.map((src, index) => {
        const nearby = index === slide || index === kept || index === (slide + 1) % POSTERS.length;
        if (!nearby) return null;
        return <figure key={src} className={index === slide ? s.slideOn : s.slide} aria-hidden={index !== slide}>
          <Image src={src} alt={index === slide ? captions[index] : ""} fill sizes="(max-width: 850px) 92vw, 420px" />
        </figure>;
      })}
      <button type="button" className={s.expand} onClick={() => setEnlarged(true)} aria-label={c("Phóng to ảnh", "Enlarge image", "放大图片")}><span><ZoomIn size={18} /></span></button>
      <button type="button" className={s.stagePrev} onClick={() => showSlide(slide - 1)} aria-label={c("Ảnh trước", "Previous image", "上一张")}><ChevronLeft size={20} /></button>
      <button type="button" className={s.stageNext} onClick={() => showSlide(slide + 1)} aria-label={c("Ảnh sau", "Next image", "下一张")}><ChevronRight size={20} /></button>
      <div className={s.dots}>{POSTERS.map((src, index) => <button key={src} type="button" aria-current={index === slide ? "true" : undefined} aria-label={c("Ảnh ", "Image ", "图片 ") + (index + 1)} onClick={() => showSlide(index)}>{index === slide && <i />}</button>)}</div>
    </div>
    {enlarged && <PosterLightbox src={POSTERS[slide]} alt={captions[slide]} onClose={() => setEnlarged(false)} onPrev={() => showSlide(slide - 1)} onNext={() => showSlide(slide + 1)}
      labels={{ close: c("Đóng", "Close", "关闭"), previous: c("Ảnh trước", "Previous image", "上一张"), next: c("Ảnh sau", "Next image", "下一张") }} />}
    <div className={s.workspace} data-reveal="right">
      <div className={s.tabs} role="tablist" aria-label={c("Chọn nhu cầu", "Choose your role", "选择需求")}>
        {(["chu-hang", "tai-xe"] as const).map((value, index) => <button key={value} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={"quick-tab-" + value} aria-controls="quick-posting-panel" aria-selected={role === value} tabIndex={role === value ? 0 : -1} disabled={saving} onClick={() => selectRole(value)} onKeyDown={event => tabKey(event, index)}>{index === 0 ? <Package size={20} /> : <Truck size={20} />}<span>{index === 0 ? c("Khách hàng", "Customer", "客户") : c("Tài xế", "Driver", "司机")}</span></button>)}
      </div>
      <div id="quick-posting-panel" role="tabpanel" aria-labelledby={"quick-tab-" + role} className={s.panel}>
        <h3>{driver ? c("Bạn có xe trống?", "Have a vehicle available?", "有空闲车辆？") : c("Bạn cần tìm xe?", "Looking for a vehicle?", "需要找车？")}</h3>
        <p>{driver ? c("Chuẩn bị lộ trình, thời gian và giá. Bạn sẽ chọn phương tiện đã đăng ký ở bước tiếp theo.", "Prepare a route, time and price. Select your registered vehicle in the next step.", "先填写路线、时间和价格，下一步选择已登记车辆。") : c("Điền lộ trình và nhu cầu trước, rồi hoàn thiện thông tin để tìm xe phù hợp.", "Prepare your route and needs, then complete the details to find a match.", "先填写路线与需求，再补充信息寻找合适车辆。")}</p>
        <form onSubmit={submit}>
          <fieldset disabled={saving}>
            <div className={s.grid}><LocationField label={c("Vị trí nhận", "Pickup", "起点")} value={pickup} onChange={setPickup} /><LocationField label={c("Vị trí trả", "Destination", "终点")} value={dropoff} onChange={setDropoff} /></div>
            <div className={s.grid}>
              <VehicleCatalogField options={options} disabled={catalogState !== "ready"} value={{ vehicleType, child, weightLabel }}
                onChange={value => { if (value.vehicleType !== vehicleType) setCargo(""); setVehicleType(value.vehicleType); setChild(value.child); setWeightLabel(value.weightLabel); }} />
              {!driver && <PostingTimeField label={c("Thời gian", "When", "时间")} value={scheduled ? shipperTime : ""} allowNow requireFuture
                onChange={value => { setShipperTime(value); setScheduled(Boolean(value)); }} />}
              {options && caps.cargo && <CargoCatalogField options={options} value={cargo} onChange={setCargo} />}
            </div>
            {catalogState === "error" && <p className={s.catalogNotice} role="status">{c("Chưa tải được loại xe. Bạn có thể chọn tại form đầy đủ.", "Vehicle types are unavailable. Choose in the full form.", "暂时无法加载车型，可在完整表单中选择。")}<button type="button" onClick={() => setRetry(value => value + 1)}>{c("Thử lại", "Retry", "重试")}</button></p>}
            {driver && <><div className={s.grid}><PostingTimeField label={c("Có xe từ", "Available from", "开始时间")} value={driverFrom} requireFuture onChange={setDriverFrom} /><PostingTimeField label={c("Đến", "Until", "结束时间")} value={driverTo} min={driverFrom} requireFuture onChange={setDriverTo} /></div>
              <div className={s.priceCard}><div className={s.priceHeading}><label htmlFor="quick-trip-price">{c("Giá chuyến đi", "Trip price", "行程报价")}</label><output htmlFor="quick-trip-price" aria-live="polite">{(Number(price) || 0).toLocaleString(language === "en" ? "en-US" : language === "zh" ? "zh-CN" : "vi-VN")} ₫</output></div>
                <input id="quick-trip-price" aria-label={c("Kéo chọn giá chuyến đi", "Adjust trip price", "调整行程报价")} type="range" min="50000" max="20000000" step="50000" value={Math.min(20000000, Math.max(50000, Number(price) || 50000))} onChange={event => setPrice(event.target.value)} />
                <div className={s.priceLimits}><span>50.000 ₫</span><span>20.000.000 ₫</span></div>
                <label className={s.exactPrice}>{c("Hoặc nhập giá chính xác (đ)", "Or enter an exact price (VND)", "或输入准确报价（越南盾）")}<input type="number" min="1" max="999999999999" step="1" required value={price} onChange={event => setPrice(event.target.value)} /></label>
              </div></>}
          </fieldset>
          {error && <div className={s.error} role="alert">{error}</div>}
          <div className={s.actions}><button type="submit" className={s.submit} disabled={saving}>{saving ? <Loader2 className={s.spin} size={18} /> : <ArrowRight size={18} />}{driver ? c("Tiếp tục đăng xe trống", "Continue to vehicle listing", "继续发布空车") : c("Tiếp tục tìm xe", "Continue to find a vehicle", "继续找车")}</button><Link href={driver ? "/tai-xe/dang-tin" : "/chu-hang/form-tao-don"}>{c("Mở form đầy đủ", "Open full form", "打开完整表单")}</Link></div>
        </form>
      </div>
    </div>
  </section>;
}
