let pending: Promise<void> | null = null;
export function loadTrackingMaps() {
 if (typeof window === "undefined") return Promise.reject(new Error("Bản đồ chỉ có trên trình duyệt."));
 if ((window as any).google?.maps) return Promise.resolve();
 if (pending) return pending;
 const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 pending = new Promise<void>((resolve, reject) => {
  const existing = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');
  if (!existing && !key) { reject(new Error("Bản đồ chưa được cấu hình. Bạn vẫn có thể xem thông tin đơn bên dưới.")); return; }
  const script = existing || document.createElement("script");
  const finish = () => { clearTimeout(timer); script.removeEventListener("load", done); script.removeEventListener("error", fail); };
  const done = () => { finish(); (window as any).google?.maps ? resolve() : reject(new Error("Chưa tải được bản đồ.")); };
  const fail = () => { finish(); reject(new Error("Không thể tải bản đồ. Vui lòng kiểm tra kết nối.")); };
  const timer = setTimeout(fail, 15000);
  script.addEventListener("load", done, { once: true }); script.addEventListener("error", fail, { once: true });
  if (!existing) { script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key!) + "&libraries=geometry&language=vi&region=VN"; script.async = true; script.defer = true; document.head.appendChild(script); }
 }).catch(error => { pending = null; throw error; });
 return pending;
}
