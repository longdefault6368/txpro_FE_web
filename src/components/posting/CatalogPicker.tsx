"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ChevronRight, Package, Truck, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { vehicleGroup, type PostingOptions, type PostingVehicle } from "@/utils/posting-contract";
import { cargoChoice, hasVehicleChildren, selectionDisplay, selectionForGroup, vehicleChildren, vehicleChoices,
  vehicleImage, type CatalogChoice, type VehicleSelection } from "@/utils/catalog-presentation";
import s from "./CatalogPicker.module.css";

export function PickerDialog({ title, onClose, onBack, children, icon, dismissible = true }: { title: string; onClose: () => void; onBack?: () => void; children: ReactNode; icon?: ReactNode; dismissible?: boolean }) {
  const { language } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} className={s.dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (dismissible) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (dismissible && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose();
    } }}>
    <div className={s.dialogContent}>
      <header className={s.header}>
        {onBack ? <button type="button" className={s.iconButton} onClick={onBack} aria-label={language === "en" ? "Back" : language === "zh" ? "返回" : "Quay lại"}><ArrowLeft size={22} /></button> : <span className={s.headerIcon}>{icon || <Truck size={23} />}</span>}
        <h2 id={titleId} className={s.title}>{title}</h2>
        <button type="button" className={s.iconButton} disabled={!dismissible} onClick={onClose} aria-label={language === "en" ? "Close" : language === "zh" ? "关闭" : "Đóng"}><X size={22} /></button>
      </header>
      <div className={s.body}>{children}</div>
    </div>
  </dialog>;
}
function ChoiceCard({ choice, selected, cargo, onClick }: { choice: CatalogChoice; selected: boolean; cargo?: boolean; onClick: () => void }) {
  return <button type="button" className={[s.choice, cargo ? s.cargo : "", selected ? s.selected : ""].join(" ")}
    aria-pressed={selected} autoFocus={selected} onClick={onClick}>
    <span className={s.image}><Image src={choice.image} alt="" width={320} height={210} sizes={cargo ? "(max-width: 600px) 40vw, 210px" : "(max-width: 600px) 34vw, 200px"} /></span>
    <span className={s.choiceText}><span className={s.choiceTitle}>{choice.title}</span>{choice.description && <span className={s.description}>{choice.description}</span>}</span>
    {selected && <span className={s.tick} aria-hidden="true"><Check size={15} strokeWidth={3} /></span>}
    {!cargo && !selected && <ChevronRight className={s.chevron} size={20} aria-hidden="true" />}
  </button>;
}
export function VehicleCatalogField({ options, value, onChange, disabled = false }: {
  options: PostingOptions | null; value: VehicleSelection; onChange: (value: VehicleSelection) => void; disabled?: boolean;
}) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [open, setOpen] = useState(false), [group, setGroup] = useState("");
  const label = c("Loại phương tiện", "Vehicle type", "车型");
  const display = options ? selectionDisplay(value, options, language) : undefined;
  const choices = options ? (group ? vehicleChildren(group, options, language) : vehicleChoices(options, language)) : [];
  const groupTitle = options ? vehicleChoices(options, language).find(choice => choice.id === group)?.title : "";
  function select(choice: CatalogChoice) {
    if (!options) return;
    if (choice.selection) { onChange(choice.selection); setOpen(false); }
    else if (hasVehicleChildren(choice.id)) setGroup(choice.id);
    else { onChange(selectionForGroup(choice.id, options)); setOpen(false); }
  }
  return <div className={s.field}>
    <span className={s.fieldLabel}>{label}</span>
    <button type="button" disabled={disabled || !options} aria-label={label + ": " + (display?.title || c("Chưa chọn", "Not selected", "未选择"))}
      aria-haspopup="dialog" className={s.trigger} onClick={() => { const id = vehicleGroup(value.vehicleType) || ""; setGroup(hasVehicleChildren(id) ? id : ""); setOpen(true); }}>
      {display ? <Image src={display.image} alt="" width={70} height={48} sizes="70px" /> : <Truck size={25} />}
      <span><strong>{display?.title || c("Chọn loại phương tiện", "Choose a vehicle", "选择车型")}</strong>{display?.description && <span className={s.triggerDetail}>{display.description}</span>}</span><ChevronRight size={18} />
    </button>
    {open && <PickerDialog title={groupTitle || c("Chọn loại phương tiện", "Choose a vehicle", "选择车型")} onClose={() => setOpen(false)} onBack={group ? () => setGroup("") : undefined}>
      <div key={group} className={[s.vehicleGrid, group ? s.childGrid : ""].join(" ")}>{choices.map(choice => <ChoiceCard key={choice.id} choice={choice}
        selected={choice.selection ? choice.selection.vehicleType === value.vehicleType && choice.selection.child === value.child : choice.id === vehicleGroup(value.vehicleType) || choice.id === "other:" + value.vehicleType}
        onClick={() => select(choice)} />)}</div>
      {choices.length === 0 && <div className={s.empty}>{c("Chưa có lựa chọn. Vui lòng thử lại sau.", "No options available. Please try again later.", "暂无选项，请稍后重试。")}</div>}
    </PickerDialog>}
  </div>;
}
export function CargoCatalogField({ options, value, onChange }: { options: PostingOptions; value: string; onChange: (value: string) => void }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [open, setOpen] = useState(false);
  const choice = value && options.cargoTypes.includes(value) ? cargoChoice(value, language) : null;
  const label = c("Loại hàng hóa", "Cargo type", "货物类型");
  return <div className={s.field}>
    <span className={s.fieldLabel}>{label}</span>
    <button type="button" className={s.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)} aria-label={label + ": " + (choice?.title || c("Chưa chọn", "Not selected", "未选择"))}>
      {choice ? <Image src={choice.image} alt="" width={60} height={48} sizes="60px" /> : <Package size={24} />}
      <span><strong>{choice?.title || c("Chọn loại hàng hóa", "Choose cargo", "选择货物类型")}</strong></span><ChevronRight size={18} />
    </button>
    {open && <PickerDialog title={label} onClose={() => setOpen(false)}>
      <div className={s.cargoGrid}>{options.cargoTypes.map(raw => <ChoiceCard key={raw} choice={cargoChoice(raw, language)} cargo selected={raw === value}
        onClick={() => { onChange(raw); setOpen(false); }} />)}</div>
      {!options.cargoTypes.length && <div className={s.empty}>{c("Chưa có loại hàng hóa.", "No cargo types available.", "暂无货物类型。")}</div>}
    </PickerDialog>}
  </div>;
}
/** A driver can only select their actual registered vehicle, never a display group. */
export function RegisteredVehicleField({ vehicles, value, onChange }: { vehicles: PostingVehicle[]; value: string; onChange: (value: string) => void }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [open, setOpen] = useState(false);
  const vehicle = vehicles.find(item => (item.id || item._id) === value);
  const label = c("Phương tiện của bạn", "Your vehicle", "您的车辆");
  return <div className={s.field}>
    <span className={s.fieldLabel}>{label}</span>
    <button type="button" className={s.trigger} aria-haspopup="dialog" disabled={!vehicles.length} onClick={() => setOpen(true)}>
      {vehicle ? <Image src={vehicleImage(vehicle.vehicleTypeParent || vehicle.type)} width={70} height={48} sizes="70px" alt="" /> : <Truck size={25} />}
      <span><strong>{vehicle?.plateNumber || c("Chọn phương tiện", "Choose your vehicle", "选择车辆")}</strong>{vehicle && <span className={s.triggerDetail}>{vehicle.type}</span>}</span><ChevronRight size={18} />
    </button>
    {open && <PickerDialog title={label} onClose={() => setOpen(false)}>
      <div className={s.vehicleGrid}>{vehicles.map(item => <ChoiceCard key={item.id || item._id} choice={{
        id: item.id || item._id || "", title: item.plateNumber,
        description: [item.type, item.vehicleTypeChild].filter(Boolean).join(" · "),
        image: vehicleImage(item.vehicleTypeParent || item.type),
      }} selected={(item.id || item._id) === value} onClick={() => { onChange(item.id || item._id || ""); setOpen(false); }} />)}</div>
    </PickerDialog>}
  </div>;
}
