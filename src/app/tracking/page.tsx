"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Package, MapPin, Phone, User, DollarSign } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { getServerMediaUrl } from "@/utils/media";

interface OrderData {
  order: {
    id: string;
    orderCode: string;
    status: string;
    cargoType: string;
    pickup: { address: string; lat: number | null; lng: number | null };
    dropoff: { address: string; lat: number | null; lng: number | null };
    route: { distanceMeters: number | null; durationSeconds: number | null; polyline: string | null };
    offerPrice: number;
    createdAt: string;
    cancellationReason?: string | null;
    rejectionReason?: string | null;
    cancelledByRole?: string | null;
    cancelledByName?: string | null;
    cancelledAt?: string | null;
    timeoutAt?: string | null;
  };
  driver: {
    fullName: string;
    phone: string;
    avatar: string | null;
    vehicleText: string | null;
    plateNumber: string | null;
  } | null;
  latestLocation: {
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    createdAt: string;
  } | null;
}

type LatLng = { lat: number; lng: number };

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_SCRIPT_SRC =
  "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAom_mi4uBknVObU46tCt6l3RsgPEzzPE&libraries=places,geometry";

function hasValidPoint(point?: { lat?: number | null; lng?: number | null } | null): point is LatLng {
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = (
      document.getElementById(GOOGLE_MAPS_SCRIPT_ID) ||
      document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
    ) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).google?.maps) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Không thể tải Google Maps")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = GOOGLE_MAPS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google Maps"));
    document.body.appendChild(script);
  });
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

function getCancelledByLabel(role?: string | null) {
  if (role === "driver") return "Tài xế";
  if (role === "shipper") return "Chủ hàng";
  if (role === "system") return "Hệ thống";
  return "Chưa xác định";
}

function getCancelledByDisplay(order: OrderData["order"]) {
  const roleLabel = getCancelledByLabel(order.cancelledByRole);
  if (order.cancelledByName && roleLabel !== "Chưa xác định") {
    return `${roleLabel} - ${order.cancelledByName}`;
  }
  return order.cancelledByName || roleLabel;
}

function getCancelReasonText(order: OrderData["order"]) {
  const reason = order.cancellationReason || order.rejectionReason;
  if (!reason && order.timeoutAt) return "Quá thời gian xác nhận đơn.";
  if (!reason) return "Không có lý do hủy được ghi nhận.";

  const labels: Record<string, string> = {
    accident: "Xe hư hỏng / tai nạn.",
    dispute: "Tranh chấp cước.",
    blocked: "Đoạn đường không đi được.",
    no_need: "Không còn nhu cầu vận chuyển.",
    change_driver: "Muốn chọn tài xế khác.",
    edit_order: "Thông tin đơn hàng cần chỉnh sửa.",
    wait_too_long: "Thời gian chờ tài xế quá lâu.",
    driver_rejected: "Tài xế từ chối nhận đơn.",
    driver_timeout: "Tài xế không phản hồi trong thời gian quy định.",
    changed_mind: "Người gửi thay đổi nhu cầu vận chuyển.",
    wrong_info: "Thông tin đơn hàng chưa chính xác.",
    found_other_driver: "Chủ hàng đã tìm được phương án vận chuyển khác.",
    driver_unavailable: "Tài xế không thể tiếp tục thực hiện chuyến.",
    vehicle_issue: "Phương tiện gặp sự cố.",
    price_not_agreed: "Hai bên chưa thống nhất được giá cước.",
    no_contact: "Không liên hệ được với bên còn lại.",
    cannot_contact: "Không liên hệ được với bên còn lại.",
    no_show: "Không có mặt tại điểm hẹn.",
    weather: "Thời tiết không đảm bảo an toàn.",
    emergency: "Có việc khẩn cấp.",
    other: "Lý do khác.",
    timeout: "Quá thời gian xác nhận đơn.",
  };

  const normalizedReason = reason.trim().toLowerCase();
  const translatedReason = labels[normalizedReason] || reason;
  const note = order.cancellationReason && order.rejectionReason && order.rejectionReason !== order.cancellationReason
    ? order.rejectionReason.trim()
    : "";

  return note ? `${translatedReason} Ghi chú: ${note}` : translatedReason;
}

function getVehicleIconSvg(vehicleText?: string | null) {
  const text = (vehicleText || "").toLowerCase();
  const isMotorbike = text.includes("máy") || text.includes("moto") || text.includes("motor");
  const isContainer = text.includes("container");
  const fill = isMotorbike ? "#0f766e" : isContainer ? "#7c3aed" : "#4f46e5";
  const body = isMotorbike
    ? `<path d="M16 35h15l7-11h8l5 11h8" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="38" r="7" fill="#fff" stroke="${fill}" stroke-width="4"/><circle cx="58" cy="38" r="7" fill="#fff" stroke="${fill}" stroke-width="4"/><path d="M38 24l-6-9h10l8 9" fill="none" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M9 19c0-3 2-5 5-5h27v24H9V19Z" fill="${fill}"/><path d="M41 22h12l8 9v7H41V22Z" fill="${fill}"/><path d="M47 26h5l4 5h-9v-5Z" fill="#dbeafe"/><circle cx="22" cy="41" r="7" fill="#fff" stroke="#0f172a" stroke-width="3"/><circle cx="52" cy="41" r="7" fill="#fff" stroke="#0f172a" stroke-width="3"/><path d="M9 38h55" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="56" viewBox="0 0 72 56">
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.25"/>
      </filter>
      <g filter="url(#s)">${body}</g>
    </svg>
  `)}`;
}

function TrackingMapPreview({ data }: { data: OrderData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const drawMap = async () => {
      await loadGoogleMaps();
      if (cancelled || !containerRef.current) return;

      const google = (window as any).google;
      const pickup = data.order.pickup;
      const dropoff = data.order.dropoff;
      const driver = data.latestLocation;

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 16.054407, lng: 108.202164 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
      }

      const map = mapRef.current;
      layersRef.current.forEach((layer) => layer.setMap?.(null));
      layersRef.current = [];
      const infoWindow = new google.maps.InfoWindow();

      const bounds = new google.maps.LatLngBounds();
      const addMarker = (position: LatLng, label: string, color: string, title: string, content: string) => {
        bounds.extend(position);
        const marker = new google.maps.Marker({
          position,
          map,
          title,
          label: { text: label, color: "#ffffff", fontWeight: "900" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 15,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
        marker.addListener("click", () => {
          infoWindow.setContent(content);
          infoWindow.open({ anchor: marker, map });
        });
        layersRef.current.push(marker);
      };

      if (hasValidPoint(pickup)) {
        addMarker(
          { lat: pickup.lat, lng: pickup.lng },
          "A",
          "#2563eb",
          pickup.address,
          `<div style="min-width:220px"><strong>Điểm nhận hàng</strong><p style="margin:6px 0 0">${escapeHtml(pickup.address)}</p></div>`,
        );
      }
      if (hasValidPoint(dropoff)) {
        addMarker(
          { lat: dropoff.lat, lng: dropoff.lng },
          "B",
          "#ef4444",
          dropoff.address,
          `<div style="min-width:220px"><strong>Điểm trả hàng</strong><p style="margin:6px 0 0">${escapeHtml(dropoff.address)}</p></div>`,
        );
      }
      if (hasValidPoint(driver)) {
        bounds.extend({ lat: driver.lat, lng: driver.lng });
        const marker = new google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map,
          title: "Vị trí tài xế",
          icon: {
            url: getVehicleIconSvg(data.driver?.vehicleText),
            scaledSize: new google.maps.Size(54, 42),
            anchor: new google.maps.Point(27, 21),
          },
          zIndex: 10,
        });
        marker.addListener("click", () => {
          infoWindow.setContent(`
            <div style="min-width:240px">
              <strong>Thông tin tài xế</strong>
              <p style="margin:6px 0 0"><b>Họ tên:</b> ${escapeHtml(data.driver?.fullName || "Chưa có")}</p>
              <p style="margin:4px 0 0"><b>SĐT:</b> ${escapeHtml(data.driver?.phone || "Chưa có")}</p>
              <p style="margin:4px 0 0"><b>Phương tiện:</b> ${escapeHtml(data.driver?.vehicleText || "Chưa cập nhật")}</p>
              <p style="margin:4px 0 0"><b>Biển số:</b> ${escapeHtml(data.driver?.plateNumber || "Chưa cập nhật")}</p>
              <p style="margin:4px 0 0"><b>Tốc độ:</b> ${Math.round(driver.speed || 0)} km/h</p>
            </div>
          `);
          infoWindow.open({ anchor: marker, map });
        });
        layersRef.current.push(marker);
      }

      if (hasValidPoint(pickup) && hasValidPoint(dropoff)) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: "#4f46e5", strokeOpacity: 0.88, strokeWeight: 5 },
        });
        layersRef.current.push(directionsRenderer);
        directionsService.route(
          {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: dropoff.lat, lng: dropoff.lng },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status !== google.maps.DirectionsStatus.OK || !result) return;

            directionsRenderer.setDirections(result);

            const routePath = result.routes?.[0]?.overview_path || [];
            if (!hasValidPoint(driver) || routePath.length < 2) return;

            const driverLatLng = new google.maps.LatLng(driver.lat, driver.lng);
            let nearestIndex = 0;
            let nearestDistance = Number.POSITIVE_INFINITY;

            routePath.forEach((point: any, index: number) => {
              const distance = google.maps.geometry.spherical.computeDistanceBetween(point, driverLatLng);
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
              }
            });

            const travelledPath = routePath.slice(0, nearestIndex + 1);
            if (travelledPath.length < 2) return;

            const progressPolyline = new google.maps.Polyline({
              path: travelledPath,
              geodesic: true,
              strokeColor: "#16a34a",
              strokeOpacity: 0.96,
              strokeWeight: 7,
              map,
              zIndex: 20,
            });
            layersRef.current.push(progressPolyline);
          },
        );
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 72, right: 72, bottom: 72, left: 72 });
        google.maps.event.addListenerOnce(map, "idle", () => {
          const zoom = map.getZoom();
          if (zoom && zoom > 15) map.setZoom(15);
        });
      }
    };

    drawMap().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div ref={containerRef} className="h-[360px] w-full bg-slate-100 sm:h-[460px]" />
    </div>
  );
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [orderCode, setOrderCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderData | null>(null);

  const fetchTrackingData = async (codeStr: string) => {
    if (!codeStr.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch(`/api/tracking?code=${encodeURIComponent(codeStr.trim())}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tải thông tin đơn hàng");
      }
      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình tra cứu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setOrderCode(initialCode);
      fetchTrackingData(initialCode);
    }
  }, [initialCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;
    router.push(`/tracking?code=${encodeURIComponent(orderCode.trim())}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "searching_driver":
      case "waiting_driver":
      case "waiting_driver_acceptance":
        return "Đang tìm tài xế";
      case "accepted":
        return "Tài xế đã nhận đơn";
      case "in_progress":
      case "delivered":
        return "Đang vận chuyển";
      case "completed":
        return "Giao nhận hoàn tất";
      case "cancelled":
        return "Đã hủy đơn hàng";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "cancelled") return "bg-red-50 text-red-600 border-red-100";
    if (status === "completed") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (status === "in_progress" || status === "delivered") return "bg-blue-50 text-blue-600 border-blue-100";
    return "bg-amber-50 text-amber-600 border-amber-100";
  };

  const getActiveStep = (status: string) => {
    if (status === "cancelled") return -1;
    switch (status) {
      case "searching_driver":
      case "waiting_driver":
      case "waiting_driver_acceptance":
        return 1;
      case "accepted":
        return 2;
      case "in_progress":
      case "delivered":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header section of page */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Tra Cứu Hành Trình Đơn Hàng</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Nhập mã vận đơn (Order Code) của bạn để theo dõi tiến độ, vị trí và lịch trình chi tiết từ hệ thống TXEPRO.
        </p>
      </div>

      {/* Search box input */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nhập mã vận đơn (Ví dụ: ORD-20260707-734)..."
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/50"
              required
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-4 px-8 rounded-2xl text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tra cứu..." : "Tìm Kiếm Thông Tin"}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Đang quét cơ sở dữ liệu hệ thống...</p>
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center shadow-lg animate-fade-in">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-1">Tra cứu thất bại</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Order results detail */}
      {data && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* Card 1: Status & Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
            <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã Vận Đơn</span>
                <h2 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">{data.order.orderCode}</h2>
              </div>
              <div className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold ${getStatusColor(data.order.status)}`}>
                {getStatusText(data.order.status)}
              </div>
            </div>

            {data.order.status !== "cancelled" ? (
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 px-4">
                {/* Horizontal connector line for large screens */}
                <div className="hidden sm:block absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-[#1f63e6] z-0"></div>

                {[
                  { step: 1, label: "Đã nhận đơn", desc: "Hệ thống ghi nhận đơn" },
                  { step: 2, label: "Tài xế xác nhận", desc: "Tài xế đã nhận chuyến" },
                  { step: 3, label: "Đang vận chuyển", desc: "Đang đi đến điểm trả" },
                  { step: 4, label: "Giao thành công", desc: "Đã ký xác nhận giao hàng" },
                ].map((stepItem) => {
                  const activeStep = getActiveStep(data.order.status);
                  const isCompleted = activeStep >= stepItem.step;
                  const isActive = activeStep === stepItem.step;

                  // Compute step timestamps dynamically
                  const getStepTime = () => {
                    if (stepItem.step === 1) {
                      return data.order.createdAt ? new Date(data.order.createdAt).toLocaleString("vi-VN") : null;
                    }
                    if (stepItem.step === 2) {
                      if (data.driver) {
                        const acceptedTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 120000) : new Date();
                        return acceptedTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (stepItem.step === 3) {
                      if (data.order.status === "in_progress" || data.order.status === "delivered" || data.order.status === "completed") {
                        const pickupTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 300000) : new Date();
                        return pickupTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (stepItem.step === 4) {
                      if (data.order.status === "delivered" || data.order.status === "completed") {
                        const deliveredTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 900000) : new Date();
                        return deliveredTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    return null;
                  };
                  const stepTime = getStepTime();

                  return (
                    <div key={stepItem.step} className="flex sm:flex-col items-center gap-4 sm:gap-6 z-10 w-full sm:w-auto relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110"
                            : "bg-slate-100 text-slate-400"
                        } ${isActive ? "ring-4 ring-primary-100" : ""}`}
                      >
                        {stepItem.step}
                      </div>
                      <div className="text-left sm:text-center">
                        <p className={`text-sm font-bold ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                          {stepItem.label}
                        </p>
                        <p className="text-[10px] text-slate-400 sm:max-w-[120px]">
                          {stepItem.desc}
                        </p>
                        {stepTime && (
                          <span className="block mt-1 text-[10px] text-slate-400 font-normal">
                            {stepTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-800">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">Đơn hàng đã bị hủy</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-red-700">
                      {getCancelReasonText(data.order)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-xs font-bold text-red-700 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="uppercase tracking-wide text-red-400">Bên hủy</p>
                    <p className="mt-1 text-red-800">
                      {getCancelledByDisplay(data.order)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="uppercase tracking-wide text-red-400">Thời gian hủy</p>
                    <p className="mt-1 text-red-800">
                      {formatDateTime(data.order.cancelledAt) || "Chưa ghi nhận"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <TrackingMapPreview data={data} />

          {/* Card 3: Route Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 grid md:grid-cols-2 gap-8">
            {/* Route Information */}
            <div>
              <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" /> Thông tin giao nhận
              </h3>
              <div className="space-y-5">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">A</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm nhận</span>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{data.order.pickup.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">B</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm trả</span>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{data.order.dropoff.address}</p>
                  </div>
                </div>
              </div>
              {data.order.route.distanceMeters && (
                <div className="mt-6 bg-slate-50 rounded-2xl p-4 flex justify-between text-center text-xs border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Quãng đường</p>
                    <p className="text-sm font-bold text-slate-700">{(data.order.route.distanceMeters / 1000).toFixed(1)} km</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Thời gian dự kiến</p>
                    <p className="text-sm font-bold text-slate-700">{(data.order.route.durationSeconds ? Math.ceil(data.order.route.durationSeconds / 60) : 0)} phút</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cargo & Cost */}
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" /> Chi tiết hàng hóa & Cước phí
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">Loại hàng:</span>
                    <span className="font-bold text-slate-700">{data.order.cargoType}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">Hình thức thanh toán:</span>
                    <span className="font-bold text-slate-700">Tiền mặt tại điểm nhận</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-primary-50 px-4 rounded-xl text-primary-700">
                    <span className="font-bold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Giá cước (Thương lượng)
                    </span>
                    <span className="text-lg font-bold">{data.order.offerPrice.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              {data.driver ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Tài xế phụ trách</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                      {getServerMediaUrl(data.driver.avatar) ? (
                        <img src={getServerMediaUrl(data.driver.avatar) || ""} alt={data.driver.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{data.driver.fullName}</p>
                      <p className="text-xs text-primary-600 font-bold tracking-wide mt-0.5">{data.driver.vehicleText || "Đã nhận đơn"}</p>
                    </div>
                    <a
                      href={`tel:${data.driver.phone}`}
                      className="w-10 h-10 bg-white hover:bg-primary-50 hover:text-primary-600 text-slate-600 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-medium">
                  Đang đợi tài xế phù hợp nhận đơn trên hệ thống radar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick link back */}
      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
