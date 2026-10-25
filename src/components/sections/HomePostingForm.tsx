"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Package, Truck, Route, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LocationField from "@/components/posting/LocationField";
import PostingTimeField from "@/components/posting/PostingTimeField";
import { VehicleCatalogField, CargoCatalogField } from "@/components/posting/CatalogPicker";
import { validVehicleSelection } from "@/utils/catalog-presentation";
import { postingRequest } from "@/utils/posting-api";
import { postingCapabilities, validLocation, type LocationValue, type PostingOptions } from "@/utils/posting-contract";
import { saveHomePostingDraft, type PostingRole } from "@/utils/home-posting-draft";
import s from "./HomePostingForm.module.css";

export default function HomePostingForm() {
  const { language } = useLanguage();
  const router = useRouter();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [role, setRole] = useState<PostingRole>("chu-hang");
  const [pickup, setPickup] = useState<LocationValue | null>(null), [dropoff, setDropoff] = useState<LocationValue | null>(null);
  const [vehicleType, setVehicleType] = useState(""), [scheduled, setScheduled] = useState(false), [shipperTime, setShipperTime] = useState("");
  const [child, setChild] = useState(""), [weightLabel, setWeightLabel] = useState(""), [cargo, setCargo] = useState("");
  const [driverFrom, setDriverFrom] = useState(""), [driverTo, setDriverTo] = useState(""), [price, setPrice] = useState("");
  const [options, setOptions] = useState<PostingOptions | null>(null), [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0), [error, setError] = useState(""), [saving, setSaving] = useState(false);
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
    if (!driver && options && !validVehicleSelection({ vehicleType, child, weightLabel }, options)) {
      setError(c("Vui lòng chọn loại phương tiện.", "Please choose a vehicle type.", "请选择车型。")); return;
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
        role, pickup, dropoff, vehicleType: driver ? "" : vehicleType, scheduled,
        ...(!driver ? { child, weightLabel, cargo } : {}),
        from, to: driver ? driverTo : "", price: driver ? price : "",
      });
      router.push(path);
    } catch {
      submitting.current = false; setSaving(false);
      setError(c("Chưa lưu được thông tin tạm. Cho phép lưu trữ trên trình duyệt hoặc mở form đầy đủ bên dưới.", "Could not save the draft. Allow browser storage or open the full form below.", "无法保存草稿，请允许浏览器存储，或打开下方完整表单。"));
    }
  }
  return <section id="quick-posting" data-reveal className={s.section} aria-labelledby="quick-posting-title">
    <div className={s.intro}>
      <span className={s.kicker}><Route size={17} />{c("Bắt đầu ngay tại đây", "Start right here", "从这里开始")}</span>
      <h2 id="quick-posting-title">{c("Một điểm bắt đầu.\nHai cách kết nối.", "One starting point.\nTwo ways to connect.", "一个起点，\n两种连接方式。")}</h2>
      <p>{c("Chuyển tab để chuẩn bị thông tin theo nhu cầu. Chưa cần đăng nhập để tham khảo và nhập lộ trình.", "Switch tabs to prepare your request. Explore and enter a route before signing in.", "切换标签准备所需信息，无需登录即可查看并填写路线。")}</p>
      <ul><li><Check size={16} />{c("Tìm địa chỉ và lấy vị trí hiện tại", "Search addresses or use your location", "搜索地址或使用当前位置")}</li><li><Check size={16} />{c("Giữ thông tin khi chuyển sang bước tiếp theo", "Carry your details into the next step", "将已填信息带到下一步")}</li><li><Check size={16} />{c("Chỉ đăng khi bạn kiểm tra và xác nhận", "Post only after reviewing and confirming", "核对并确认后才发布")}</li></ul>
      <Link href="/tin-tuc">{c("Xem cẩm nang sử dụng", "Explore the guides", "查看使用指南")}<ArrowRight size={16} /></Link>
    </div>
    <div className={s.workspace}>
      <div className={s.tabs} role="tablist" aria-label={c("Chọn nhu cầu", "Choose your role", "选择需求")}>
        {(["chu-hang", "tai-xe"] as const).map((value, index) => <button key={value} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={"quick-tab-" + value} aria-controls="quick-posting-panel" aria-selected={role === value} tabIndex={role === value ? 0 : -1} disabled={saving} onClick={() => selectRole(value)} onKeyDown={event => tabKey(event, index)}>{index === 0 ? <Package size={20} /> : <Truck size={20} />}<span>{index === 0 ? c("Chủ hàng", "Shipper", "货主") : c("Tài xế", "Driver", "司机")}</span></button>)}
      </div>
      <div id="quick-posting-panel" role="tabpanel" aria-labelledby={"quick-tab-" + role} className={s.panel}>
        <h3>{driver ? c("Bạn có xe trống?", "Have a vehicle available?", "有空闲车辆？") : c("Bạn cần tìm xe?", "Looking for a vehicle?", "需要找车？")}</h3>
        <p>{driver ? c("Chuẩn bị lộ trình, thời gian và giá. Bạn sẽ chọn phương tiện đã đăng ký ở bước tiếp theo.", "Prepare a route, time and price. Select your registered vehicle in the next step.", "先填写路线、时间和价格，下一步选择已登记车辆。") : c("Điền lộ trình và nhu cầu trước, rồi hoàn thiện thông tin để tìm xe phù hợp.", "Prepare your route and needs, then complete the details to find a match.", "先填写路线与需求，再补充信息寻找合适车辆。")}</p>
        <form onSubmit={submit}>
          <fieldset disabled={saving}>
            <div className={s.grid}><LocationField label={c("Vị trí nhận", "Pickup", "起点")} value={pickup} onChange={setPickup} /><LocationField label={c("Vị trí trả", "Destination", "终点")} value={dropoff} onChange={setDropoff} /></div>
            {!driver && <div className={s.grid}>
              <VehicleCatalogField options={options} disabled={catalogState !== "ready"} value={{ vehicleType, child, weightLabel }}
                onChange={value => { if (value.vehicleType !== vehicleType) setCargo(""); setVehicleType(value.vehicleType); setChild(value.child); setWeightLabel(value.weightLabel); }} />
              <PostingTimeField label={c("Thời gian", "When", "时间")} value={scheduled ? shipperTime : ""} allowNow requireFuture
                onChange={value => { setShipperTime(value); setScheduled(Boolean(value)); }} />
              {options && caps.cargo && <CargoCatalogField options={options} value={cargo} onChange={setCargo} />}
            </div>}
            {!driver && catalogState === "error" && <p className={s.catalogNotice} role="status">{c("Chưa tải được loại xe. Bạn có thể chọn tại form đầy đủ.", "Vehicle types are unavailable. Choose in the full form.", "暂时无法加载车型，可在完整表单中选择。")}<button type="button" onClick={() => setRetry(value => value + 1)}>{c("Thử lại", "Retry", "重试")}</button></p>}
            {driver && <><div className={s.grid}><PostingTimeField label={c("Có xe từ", "Available from", "开始时间")} value={driverFrom} requireFuture onChange={setDriverFrom} /><PostingTimeField label={c("Đến", "Until", "结束时间")} value={driverTo} min={driverFrom} requireFuture onChange={setDriverTo} /></div><label>{c("Giá chuyến đi (đ)", "Trip price (VND)", "行程报价（越南盾）")}<input type="number" min="1" max="999999999999" step="1" required value={price} onChange={event => setPrice(event.target.value)} placeholder={c("Nhập giá dự kiến của bạn", "Enter your proposed price", "输入您的报价")} /></label></>}
          </fieldset>
          {error && <div className={s.error} role="alert">{error}</div>}
          <div className={s.actions}><button type="submit" className={s.submit} disabled={saving}>{saving ? <Loader2 className={s.spin} size={18} /> : <ArrowRight size={18} />}{driver ? c("Tiếp tục đăng xe trống", "Continue to vehicle listing", "继续发布空车") : c("Tiếp tục tìm xe", "Continue to find a vehicle", "继续找车")}</button><Link href={driver ? "/tai-xe/dang-tin" : "/chu-hang/form-tao-don"}>{c("Mở form đầy đủ", "Open full form", "打开完整表单")}</Link></div>
        </form>
      </div>
    </div>
  </section>;
}
