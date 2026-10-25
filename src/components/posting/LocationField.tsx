"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { postingRequest } from "@/utils/posting-api";
import { validLocation, type LocationValue } from "@/utils/posting-contract";
import s from "./Posting.module.css";
import { useLanguage } from "@/context/LanguageContext";

export default function LocationField({ label, value, onChange }: { label: string; value: LocationValue | null; onChange: (v: LocationValue | null) => void }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [text, setText] = useState(value?.address || "");
  const [results, setResults] = useState<LocationValue[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [activeResult, setActiveResult] = useState(-1);
  const fieldId = useId();
  const version = useRef(0);
  useEffect(() => { if (value?.address) setText(value.address); }, [value?.address]);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    if (text.trim().length < 3 || value?.address === text) return;
    const controller = new AbortController();
    const searchVersion = version.current;
    const task = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const data = await postingRequest<LocationValue[]>("/address/search?q=" + encodeURIComponent(text) + "&limit=5", { signal: controller.signal }, false);
        if (!controller.signal.aborted && searchVersion === version.current) { setResults(Array.isArray(data) ? data.filter(validLocation) : []); setActiveResult(-1); }
      } catch { if (!controller.signal.aborted && searchVersion === version.current) setError(c("Chưa tìm được địa chỉ. Bạn thử lại với tên đường, tỉnh/thành.", "Could not find the address. Try a street or city name.", "未找到地址，请尝试道路或城市名称。")); }
      finally { if (!controller.signal.aborted && searchVersion === version.current) setBusy(false); }
    }, 400);
    return () => { clearTimeout(task); controller.abort(); };
  }, [text, value?.address, language]);
  const locate = () => {
    const requestVersion = ++version.current;
    if (!navigator.geolocation) { setError(c("Trình duyệt không hỗ trợ vị trí.", "Your browser does not support location.", "浏览器不支持定位。")); return; }
    setBusy(true); setError("");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude: lat, longitude: lng } = position.coords;
        const data = await postingRequest<LocationValue>("/address/reverse?lat=" + lat + "&lng=" + lng, {}, false);
        if (requestVersion === version.current) { const next = { ...data, lat, lng }; if (!validLocation(next)) throw new Error("Invalid location"); onChange(next); setText(next.address); setResults([]); }
      } catch { if (requestVersion === version.current) setError(c("Chưa lấy được địa chỉ GPS. Vui lòng tìm địa chỉ.", "Could not resolve your location. Search for an address.", "无法解析当前位置，请搜索地址。")); }
      finally { if (requestVersion === version.current) setBusy(false); }
    }, () => { if (requestVersion === version.current) { setBusy(false); setError(c("Không lấy được GPS. Kiểm tra quyền vị trí hoặc tìm địa chỉ.", "Location unavailable. Check permissions or search for an address.", "无法定位，请检查权限或搜索地址。")); } }, { timeout: 12000, maximumAge: 30000 });
  };
  const choose = (item: LocationValue) => {
    version.current++; onChange(item); setText(item.address); setResults([]); setActiveResult(-1); setBusy(false); setError("");
  };
  return <div className={s.location}>
    <label htmlFor={fieldId}>{label}<div className={s.locationInput}><MapPin size={18} />
      <input id={fieldId} value={text} role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0}
        aria-controls={results.length ? fieldId + "-results" : undefined} aria-activedescendant={results.length && activeResult >= 0 ? fieldId + "-result-" + activeResult : undefined}
        aria-invalid={Boolean(error)} aria-describedby={error ? fieldId + "-error" : undefined}
        placeholder={c("Tìm đường, địa điểm, tỉnh/thành...", "Search a street, place or city…", "搜索道路、地点或城市…")} autoComplete="off"
        onChange={event => { version.current++; setText(event.target.value); onChange(null); setResults([]); setActiveResult(-1); setBusy(false); setError(""); }}
        onKeyDown={event => {
          if (event.key === "Escape") { version.current++; setResults([]); setActiveResult(-1); setBusy(false); return; }
          if (!results.length) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setActiveResult(index => event.key === "ArrowDown" ? (index + 1) % results.length : (index <= 0 ? results.length - 1 : index - 1));
          } else if (event.key === "Enter" && activeResult >= 0) { event.preventDefault(); choose(results[activeResult]); }
        }} />
      <button type="button" title={c("Vị trí hiện tại", "Current location", "当前位置")} aria-label={c("Lấy vị trí hiện tại cho ", "Use current location for ", "使用当前位置：") + label} onClick={locate} disabled={busy}>
        {busy ? <Loader2 className={s.spin} size={18} /> : <LocateFixed size={18} />}
      </button>
    </div></label>
    {results.length > 0 && <ul id={fieldId + "-results"} role="listbox" aria-label={label} className={s.suggestions}>
      {results.map((item, index) => <li role="presentation" key={item.placeId || item.address + index}>
        <button id={fieldId + "-result-" + index} type="button" role="option" aria-selected={index === activeResult} tabIndex={-1} onClick={() => choose(item)}>{item.address}</button>
      </li>)}
    </ul>}
    {value && <small className={s.valid}>{c("Đã chọn vị trí có tọa độ", "Location selected with coordinates", "已选择带坐标的地点")}</small>}
    {error && <small id={fieldId + "-error"} role="alert" className={s.errorText}>{error}</small>}
  </div>;
}
