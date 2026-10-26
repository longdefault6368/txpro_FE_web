"use client";
import { useEffect, useRef, useState } from "react";
import { MapPinned, LoaderCircle } from "lucide-react";
import { loadTrackingMaps } from "./google-maps";
import { vehicleImage } from "@/components/common/VehicleIcon";
import type { TrackingData } from "./types";
import s from "./Tracking.module.css";
const point = (value: any) => value && Number.isFinite(value.lat) && Number.isFinite(value.lng) && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
export default function TrackingMap({ data }: { data: TrackingData }) {
 const element = useRef<HTMLDivElement>(null), map = useRef<any>(null), marker = useRef<any>(null);
 const [ready, setReady] = useState(false), [error, setError] = useState(""), [routing, setRouting] = useState(false);
 const pickup = data.order.pickup, dropoff = data.order.dropoff;
 const path = data.order.route?.polyline;
 useEffect(() => {
  let disposed = false;
  const layers: any[] = [];
  let renderer: any;
  setError(""); setRouting(true);
  const run = async () => {
   await loadTrackingMaps();
   if (disposed || !element.current) return;
   const google = (window as any).google;
   const initial = point(pickup) ? pickup : point(dropoff) ? dropoff : data.latestLocation;
   if (!point(initial)) { setRouting(false); setError("Chưa có tọa độ để hiển thị bản đồ."); return; }
   if (!map.current) map.current = new google.maps.Map(element.current, { center: initial, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: "cooperative", clickableIcons: false });
   setReady(true);
   const bounds = new google.maps.LatLngBounds();
   for (const [location, label, color] of [[pickup, "A", "#136dec"], [dropoff, "B", "#15a076"]] as const) {
    if (!point(location)) continue;
    bounds.extend(location);
    layers.push(new google.maps.Marker({ map: map.current, position: location, title: location!.address, label: { text: label, color: "#fff", fontWeight: "700" },
     icon: { path: google.maps.SymbolPath.CIRCLE, scale: 13, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 } }));
   }
   if (point(data.latestLocation)) bounds.extend(data.latestLocation);
   if (!bounds.isEmpty()) { map.current.fitBounds(bounds, 55); google.maps.event.addListenerOnce(map.current, "idle", () => { if (!disposed && map.current.getZoom() > 16) map.current.setZoom(16); }); }
   if (path && google.maps.geometry?.encoding) {
     const decoded = google.maps.geometry.encoding.decodePath(path);
     if (decoded.length > 1) layers.push(new google.maps.Polyline({ map: map.current, path: decoded, strokeColor: "#136dec", strokeWeight: 6, strokeOpacity: .95 }));
     setRouting(false);
   } else if (point(pickup) && point(dropoff)) {
     renderer = new google.maps.DirectionsRenderer({ map: map.current, suppressMarkers: true, preserveViewport: true,
       polylineOptions: { strokeColor: "#136dec", strokeWeight: 6, strokeOpacity: .95 } });
     new google.maps.DirectionsService().route({ origin: pickup, destination: dropoff, travelMode: google.maps.TravelMode.DRIVING },
       (result: any, status: string) => { if (disposed) return; setRouting(false);
         if (status === "OK" && result) renderer.setDirections(result);
         else setError("Chưa tải được đường đi. Các điểm giao nhận vẫn được hiển thị."); });
   } else setRouting(false);
  };
  run().catch(error => { if (!disposed) { setError(error.message || "Chưa tải được bản đồ."); setRouting(false); } });
  return () => { disposed = true; layers.forEach(layer => layer.setMap(null)); renderer?.setMap(null); };
 // Route is only rebuilt when endpoints or stored geometry change, not on each GPS update.
 }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, path]);
 const location = data.latestLocation;
 const type = data.driver?.vehicleType || data.order.vehicleType;
 useEffect(() => {
   if (!ready || !map.current) return;
   const google = (window as any).google;
   if (!point(location)) { marker.current?.setMap(null); marker.current = null; return; }
   const icon = { url: vehicleImage(type || ""), scaledSize: new google.maps.Size(66, 48), anchor: new google.maps.Point(33, 24) };
   if (!marker.current) marker.current = new google.maps.Marker({ map: map.current, position: location, title: "Vị trí tài xế", icon, zIndex: 20 });
   else { marker.current.setPosition(location); marker.current.setIcon(icon); }
 }, [ready, location?.lat, location?.lng, type]);
 useEffect(() => () => { marker.current?.setMap(null); marker.current = null; }, []);
 return <div className={s.mapWrap}><div ref={element} className={s.map} aria-label="Bản đồ lộ trình và vị trí tài xế" />
   {routing && <div className={s.mapStatus} role="status"><LoaderCircle size={16} className={s.spin} />Đang tải lộ trình…</div>}
   {error && <div className={s.mapStatus} role="status"><MapPinned size={17} />{error}</div>}
   <div className={s.mapLegend}><span><i />Điểm nhận</span><span><i />Điểm trả</span></div>
 </div>;
}
