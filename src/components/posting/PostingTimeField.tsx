"use client";

import { useId, useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { initialPostingTime, localPostingTime, pickedTimeError, postingTimeDisplay } from "@/utils/posting-time";
import { PickerDialog } from "./CatalogPicker";
import catalog from "./CatalogPicker.module.css";
import s from "./PostingTimeField.module.css";

type Props = { label: string; value: string; onChange: (value: string) => void; allowNow?: boolean; min?: string; requireFuture?: boolean; disabled?: boolean };
export default function PostingTimeField({ label, value, onChange, allowNow = false, min = "", requireFuture = false, disabled = false }: Props) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [open, setOpen] = useState(false), [date, setDate] = useState(""), [time, setTime] = useState(""), [error, setError] = useState("");
  const id = useId();
  const selected = postingTimeDisplay(value, language);
  const display = selected || (allowNow && !value ? c("Ngay bây giờ", "Now", "现在") : c("Chọn ngày và giờ", "Choose date & time", "选择日期和时间"));
  const minDate = min && Number.isFinite(Date.parse(min)) ? localPostingTime(new Date(min)).slice(0, 10) : requireFuture ? localPostingTime(new Date()).slice(0, 10) : undefined;
  function start() {
    const initial = initialPostingTime(value, min);
    setDate(initial.slice(0, 10)); setTime(initial.slice(11, 16)); setError(""); setOpen(true);
  }
  function confirm() {
    const next = date + "T" + time;
    const code = pickedTimeError(next, { min, requireFuture });
    if (code) {
      setError(code === "min" ? c("Giờ kết thúc phải sau giờ bắt đầu.", "End time must be after start time.", "结束时间须晚于开始时间。")
        : code === "past" ? c("Vui lòng chọn thời gian trong tương lai.", "Choose a future time.", "请选择未来的时间。")
        : c("Vui lòng chọn đủ ngày và giờ hợp lệ.", "Choose a valid date and time.", "请选择有效的日期和时间。"));
      return;
    }
    onChange(next); setOpen(false);
  }
  return <div className={catalog.field}>
    <span className={catalog.fieldLabel}>{label}</span>
    <button type="button" className={catalog.trigger} aria-label={label + ": " + display} aria-haspopup="dialog" disabled={disabled} onClick={start}>
      <CalendarDays size={25} /><span><strong>{display}</strong></span><ChevronRight size={18} />
    </button>
    {open && <PickerDialog title={label} icon={<CalendarDays size={23} />} onClose={() => setOpen(false)}>
      <div className={s.content} onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); confirm(); } }}>
        {allowNow && <button type="button" className={s.nowButton} onClick={() => { onChange(""); setOpen(false); }}><Zap size={19} /><span>{c("Ngay bây giờ", "Now", "现在")}</span>{!value && <Check size={18} />}</button>}
        <div className={s.inputs}>
          <label htmlFor={id + "-date"}><span><CalendarDays size={17} />{c("Ngày", "Date", "日期")}</span>
            <input id={id + "-date"} type="date" value={date} min={minDate} autoFocus aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : undefined}
              onChange={event => { setDate(event.target.value); setError(""); }} />
          </label>
          <label htmlFor={id + "-time"}><span><Clock3 size={17} />{c("Giờ", "Time", "时间")}</span>
            <input id={id + "-time"} type="time" value={time} step="60" aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : undefined}
              onChange={event => { setTime(event.target.value); setError(""); }} />
          </label>
        </div>
        {error && <div id={id + "-error"} role="alert" className={s.error}>{error}</div>}
        <div className={s.actions}><button type="button" className={s.cancel} onClick={() => setOpen(false)}>{c("Quay lại", "Cancel", "取消")}</button>
          <button type="button" className={s.confirm} onClick={confirm}><Check size={18} />{c("Xác nhận", "Confirm", "确认")}</button>
        </div>
      </div>
    </PickerDialog>}
  </div>;
}
