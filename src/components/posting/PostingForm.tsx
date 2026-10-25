"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, ImagePlus, Loader2, MapPin, Package, Route, Search, Send, ShieldCheck, Truck, Wallet, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import LocationField from "./LocationField";
import PostingTimeField from "./PostingTimeField";
import { CargoCatalogField, RegisteredVehicleField, VehicleCatalogField } from "./CatalogPicker";
import { postingCapabilities, type LocationValue, type PostingOptions, type PostingVehicle } from "@/utils/posting-contract";
import { cargoChoice, selectionDisplay, vehicleImage } from "@/utils/catalog-presentation";
import w from "./PostingExperience.module.css";

export type PostingFormValues = {
  pickup: LocationValue | null; dropoff: LocationValue | null;
  type: string; child: string; cargo: string; weight: string;
  vehicleId: string; price: string; min: number; max: number; radius: number;
  from: string; to: string; scheduled: boolean; note: string; images: string[]; confirmed: boolean;
};
type Quote = { requiredAmount: number; platformFeeAmount: number; vatAmount: number; voucherEligible: boolean; paymentPolicy?: string };
type Props = {
  driver: boolean; options: PostingOptions; vehicles: PostingVehicle[]; value: PostingFormValues;
  busy: boolean; uploading: boolean; uncertain: boolean; quote: Quote | null;
  onChange: (patch: Partial<PostingFormValues>) => void; onSubmit: (event: FormEvent) => void;
  onUpload: (files: FileList | null) => void; onRemoveImage: (url: string) => void;
  imagePreview: (url: string) => string | undefined;
};
const money = (value: number) => value.toLocaleString("vi-VN") + " ₫";
const dateLabel = (value: string) => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Chưa chọn thời gian";
function SectionHeading({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return <div className={w.sectionHeading}><span>{icon}</span><div><h2>{title}</h2>{hint && <p>{hint}</p>}</div></div>;
}
export function PostingFormSkeleton() {
  return <div className={w.layout} aria-busy="true" aria-label="Đang tải thông tin đăng tin">
    <div className={w.formSkeleton}><div /><div /><div /><div /></div><div className={w.summarySkeleton}><div /><div /><div /><div /></div>
  </div>;
}
/** Presentation only: authenticated requests, wallet checks and mutations belong to PostingWorkspace. */
export default function PostingForm({ driver, options, vehicles, value: v, busy, uploading, uncertain, quote, onChange, onSubmit, onUpload, onRemoveImage, imagePreview }: Props) {
  const vehicle = vehicles.find(item => (item.id || item._id) === v.vehicleId);
  const caps = postingCapabilities(driver ? vehicle?.vehicleTypeParent || vehicle?.type || "" : v.type, options);
  const limit = Math.floor(vehicle?.capacityMax || vehicle?.capacity || 0);
  const selected = selectionDisplay({ vehicleType: v.type, child: v.child, weightLabel: v.weight }, options, "vi");
  const title = driver ? vehicle?.plateNumber : selected?.title;
  const image = driver ? vehicleImage(vehicle?.vehicleTypeParent || vehicle?.type || "xe tải") : selected?.image || vehicleImage("ô tô");
  const canSubmit = !busy && !uploading && !uncertain && (!driver || Boolean(vehicle));
  const timeFields = <div className={w.twoColumns}>
    <PostingTimeField label="Thời gian nhận" value={v.from} onChange={from => onChange({ from })} />
    <PostingTimeField label="Thời gian kết thúc" value={v.to} min={v.from} onChange={to => onChange({ to })} />
  </div>;
  return <form id="posting-form" onSubmit={onSubmit} className={w.layout}>
    <fieldset disabled={busy || uploading || uncertain} className={w.fields}>
      {!driver && <section className={w.timeCard} aria-label="Ngày và giờ">
        <PostingTimeField label="Ngày và giờ" value={v.scheduled ? v.from : ""} allowNow requireFuture
          onChange={from => onChange(from ? { from, scheduled: true } : { scheduled: false })} />
      </section>}
      <section className={w.card} aria-labelledby="posting-route-title">
        <div className={w.sectionHeading}><span><Route size={21} /></span><div><h2 id="posting-route-title">Lộ trình di chuyển</h2><p>Chọn điểm nhận và điểm trả cho hành trình.</p></div></div>
        <div className={w.routeFields}>
          <div className={w.routeField}><span className={w.pickupDot} aria-hidden="true" /><LocationField label="Vị trí nhận" value={v.pickup} onChange={pickup => onChange({ pickup })} /></div>
          <div className={w.routeField}><span className={w.dropoffDot} aria-hidden="true" /><LocationField label="Vị trí trả" value={v.dropoff} onChange={dropoff => onChange({ dropoff })} /></div>
        </div>
        {driver && <div className={w.radiusField}><div><span><MapPin size={16} />Bán kính nhận / trả</span><output>{v.radius} km</output></div>
          <input aria-label="Bán kính nhận và trả (km)" type="range" min="3" max="300" step="1" value={v.radius} onChange={event => onChange({ radius: Number(event.target.value) })} />
          <div className={w.rangeLimits}><span>3 km</span><span>300 km</span></div>
        </div>}
        {v.pickup && v.dropoff && <a className={w.mapLink} href={"https://www.google.com/maps/dir/?api=1&origin=" + v.pickup.lat + "," + v.pickup.lng + "&destination=" + v.dropoff.lat + "," + v.dropoff.lng} target="_blank" rel="noopener noreferrer"><Route size={16} />Xem lộ trình trên Google Maps<ArrowRight size={15} /></a>}
      </section>
      {driver && <section className={w.card}><SectionHeading icon={<CalendarDays size={21} />} title="Thời gian xe sẵn sàng" hint="Chủ hàng có thể tìm xe trong khung giờ này." />{timeFields}</section>}
      <section className={w.card}>
        <SectionHeading icon={<Truck size={21} />} title={driver ? "Phương tiện của bạn" : "Chọn phương tiện"} hint={driver ? "Chọn xe đã đăng ký và tải trọng nhận chở." : "Cùng danh mục phương tiện với ứng dụng TXE PRO."} />
        <div className={w.catalogFields}>
          {driver ? <RegisteredVehicleField vehicles={vehicles} value={v.vehicleId} onChange={vehicleId => {
            const next = vehicles.find(item => (item.id || item._id) === vehicleId);
            const capacity = Math.floor(next?.capacityMax || next?.capacity || 0);
            onChange({ vehicleId, min: capacity, max: capacity });
          }} /> : <VehicleCatalogField options={options} value={{ vehicleType: v.type, child: v.child, weightLabel: v.weight }}
            onChange={selection => onChange({ type: selection.vehicleType, child: selection.child, weight: selection.weightLabel })} />}
          {driver && <div className={w.inlineNotice}><Truck size={20} /><span>{vehicles.length === 0 ? 'Chưa có phương tiện hoạt động. ' : ''}<Link href='/tai-xe/phuong-tien'>Thêm / quản lý phương tiện</Link> trước khi đăng xe trống.</span></div>}
          {driver && caps.capacity && vehicle && <div className={w.capacityCard}>
            <div className={w.capacityTitle}><span>Tải trọng nhận chở</span><strong>{v.min === v.max ? v.max : v.min + "–" + v.max} tấn</strong></div>
            <div className={w.twoColumns}>
              <label>Từ <output>{v.min}</output><input aria-label="Tải trọng từ (tấn)" type="range" min="0" max={limit} step="1" value={v.min} onChange={event => onChange({ min: Math.min(Number(event.target.value), v.max) })} /></label>
              <label>Đến <output>{v.max}</output><input aria-label="Tải trọng đến (tấn)" type="range" min="1" max={limit || 1} step="1" value={v.max} onChange={event => { const max = Number(event.target.value); onChange({ max, min: Math.min(v.min, max) }); }} /></label>
            </div><span className={w.helper}>Không vượt quá tải trọng phương tiện: {limit} tấn.</span>
          </div>}
          {!driver && caps.capacity && v.type !== "xe tải" && <label className={w.selectField}>Tải trọng hàng hóa
            <select required value={v.weight} onChange={event => onChange({ weight: event.target.value })}><option value="">Chọn khoảng tải trọng</option>{options.weightRanges.map(item => <option key={item}>{item}</option>)}</select>
          </label>}
          {!driver && caps.cargo && <CargoCatalogField options={options} value={v.cargo} onChange={cargo => onChange({ cargo })} />}
          {driver && caps.cargo && <div className={w.registeredCargo}><span className={w.eyebrow}><Package size={15} />Hàng hóa nhận chở</span>
            {vehicle?.cargoTypes?.length ? <div className={w.cargoChips}>{vehicle.cargoTypes.map(raw => <span key={raw}>{cargoChoice(raw, "vi").title}</span>)}</div>
              : <p>Chưa khai báo hàng hóa nhận chở. Vui lòng cập nhật phương tiện trên ứng dụng.</p>}
          </div>}
        </div>
      </section>
      <section className={w.card}>
        <label className={w.noteLabel} htmlFor="posting-note">Ghi chú <span>(Không bắt buộc)</span></label>
        <textarea id="posting-note" maxLength={2000} rows={3} value={v.note} onChange={event => onChange({ note: event.target.value })}
          placeholder={driver ? "Lịch xe, điểm đón hoặc thông tin muốn trao đổi thêm…" : "Điểm hẹn, yêu cầu vận chuyển hoặc thông tin cần lưu ý…"} />
        {!driver && caps.cargo && <div className={w.uploadArea}>
          <div className={w.uploadHeading}><span>Ảnh hàng hóa</span><span>{v.images.length}/3 ảnh</span></div>
          <label className={w.uploadButton}><ImagePlus size={24} /><span><strong>{uploading ? "Đang tải ảnh…" : "Thêm ảnh hàng hóa"}</strong><span>JPG, PNG, WebP · Tối đa 5 MB/ảnh</span></span><span className={w.uploadPlus}>+</span>
            <input className={w.fileInput} aria-label="Chọn ảnh hàng hóa" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || v.images.length >= 3}
              onChange={event => { onUpload(event.target.files); event.target.value = ""; }} />
          </label>
          {v.images.length > 0 && <div className={w.imageRow}>{v.images.map((url, index) => <div key={url} className={w.imageThumb}>
            <a href={imagePreview(url)} target="_blank" rel="noopener noreferrer" aria-label={"Xem ảnh hàng hóa " + (index + 1)}><img src={imagePreview(url)} alt={"Hàng hóa " + (index + 1)} /></a>
            <button type="button" aria-label={"Xóa ảnh hàng hóa " + (index + 1)} onClick={() => onRemoveImage(url)}><X size={15} /></button>
          </div>)}</div>}
        </div>}
      </section>
      {driver && <section className={w.priceCard}><label htmlFor="posting-price"><span className={w.fieldIcon}><Wallet size={22} /></span><span><span className={w.eyebrow}>Giá cước chuyến đi</span><span className={w.helper}>Nhập giá bạn muốn nhận cho hành trình này.</span></span></label>
        <div className={w.priceInput}><input id="posting-price" type="number" required min="1" max="999999999999" step="1" inputMode="numeric" value={v.price} placeholder="0" onChange={event => onChange({ price: event.target.value })} /><span>VNĐ</span></div>
      </section>}
    </fieldset>
    <aside className={w.summaryColumn} aria-label="Tóm tắt chuyến đi">
      <div className={w.summaryCard}>
        <div className={w.summaryVisual}><span className={w.visualLabel}>TXE PRO <span>•</span> {driver ? "Xe của bạn" : "Hành trình của bạn"}</span><Image src={image} alt="" width={300} height={170} sizes="(max-width: 850px) 260px, 300px" /><span className={w.vehiclePill}>{title || (driver ? "Chọn xe để bắt đầu" : "Chọn phương tiện phù hợp")}</span></div>
        <div className={w.summaryBody}><h2>Tóm tắt chuyến đi</h2>
          <div className={w.routeSummary}><div><span className={w.pickupDot} /><span><small>Điểm nhận</small><strong>{v.pickup?.address || "Chưa chọn điểm nhận"}</strong></span></div>
            <div><span className={w.dropoffDot} /><span><small>Điểm trả</small><strong>{v.dropoff?.address || "Chưa chọn điểm trả"}</strong></span></div></div>
          <div className={w.summaryLine}><CalendarDays size={17} /><span>{!driver && !v.scheduled ? "Ngay bây giờ" : dateLabel(v.from)}</span></div>
          {driver && <div className={w.summaryLine}><Clock3 size={17} /><span>Đến {dateLabel(v.to)}</span></div>}
          {(selected?.description || driver && caps.capacity && vehicle) && <div className={w.summaryLine}><Truck size={17} /><span>{driver ? (v.min === v.max ? v.max : v.min + "–" + v.max) + " tấn" : selected?.description}</span></div>}
          {driver && <div className={w.summaryPrice}><span>Giá chuyến đi</span><strong>{/^\d+$/.test(v.price) && Number(v.price) > 0 ? money(Number(v.price)) : "Chưa nhập giá"}</strong></div>}
          <div id="posting-finance" className={w.financeNote} tabIndex={-1}><ShieldCheck size={19} /><div><strong>{quote ? quote.paymentPolicy === "motorcycle_free_v1" ? "Xe máy miễn phí nền tảng" : quote.voucherEligible ? "Có thể sử dụng voucher" : "Sử dụng ký quỹ" : "Quyền lợi minh bạch"}</strong>
            <p>{driver ? "Voucher hoặc ký quỹ được kiểm tra khi bạn đăng tin." : "Đăng tìm xe chưa khóa voucher hoặc ký quỹ. Quyền lợi được kiểm tra khi xác nhận đặt xe."}</p>
            {quote && <dl className={w.feeDetails}><div><dt>Khoản cần bảo đảm</dt><dd>{money(quote.requiredAmount)}</dd></div><div><dt>Phí trước VAT</dt><dd>{money(quote.platformFeeAmount)}</dd></div><div><dt>VAT</dt><dd>{money(quote.vatAmount)}</dd></div></dl>}
          </div></div>
      </div></div>
      {driver && <label className={w.consent}><input type="checkbox" disabled={busy || uploading || uncertain} checked={v.confirmed} onChange={event => onChange({ confirmed: event.target.checked })} /><span>Tôi đồng ý đăng tin và áp dụng voucher/ký quỹ theo kết quả kiểm tra.</span></label>}
      <div className={w.actionBar}><div className={w.actionHint}><ShieldCheck size={17} /><span>{driver ? "Kiểm tra quyền lợi trước khi đăng" : "Chọn tài xế sau khi tìm xe"}</span></div>
        <button className={w.submitButton} type="submit" disabled={!canSubmit}>{busy || uploading ? <Loader2 className={w.spin} size={20} /> : driver ? <Send size={19} /> : <Search size={20} />}{busy ? "Đang xử lý…" : uploading ? "Đang tải ảnh…" : driver ? "Đăng tin ngay" : "Tìm xe"}</button>
      </div>
      <Link className={w.ordersLink} href="/don-cua-ban">Xem tin / đơn của tôi<ArrowRight size={15} /></Link>
    </aside>
  </form>;
}
