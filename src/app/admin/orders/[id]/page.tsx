"use client";

import { use } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { 
  ArrowLeft, MapPin, Phone, Mail, Clock, CheckCircle, 
  AlertTriangle, Truck, Info, Shield, User, Loader, DollarSign, Calendar, Star,
  ShieldCheck, CreditCard, Copy, Check, ExternalLink, Banknote, Lock,
  Camera, FileCheck, FileText, Maximize2, Download, Printer, Eye, CheckCircle2,
  Image as ImageIcon, X, ZoomIn, RotateCw, RefreshCw, Sliders, StickyNote,
  UserPlus, Ban, Send, Unlock, ChevronDown, CheckCheck, FileSignature
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface UserInfo {
  name: string;
  phone: string;
  email: string;
  role?: string | null;
}

interface OrderReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: UserInfo | null;
  targetUser?: UserInfo | null;
}

interface Order {
  _id: string;
  orderCode: string;
  title: string;
  status: "searching_driver" | "waiting_driver" | "waiting_driver_acceptance" | "accepted" | "rejected" | "in_progress" | "delivered" | "completed" | "cancelled";
  cargoType?: string;
  weight?: number;
  volume?: number;
  paymentMethod?: string;
  offerPrice?: number;
  budget?: { min: number; max: number } | number;
  pickup: { address: string; lat?: number; lng?: number };
  dropoff: { address: string; lat?: number; lng?: number };
  shipperId: UserInfo;
  driverId?: UserInfo;
  reviews?: OrderReview[];
  cargoImageUrls?: string[];
  insurance?: {
    isRequested?: boolean;
    declaredValue?: number | null;
    fee?: number | null;
  } | null;
  financialSnapshot?: {
    orderAmount?: number | null;
    settlementStatus?: string | null;
    settlementReference?: string | null;
    shipperEscrow?: { amount?: number | null; status?: string | null };
    driverEscrow?: { amount?: number | null; status?: string | null };
    driverPlatformFee?: { amount?: number | null; status?: string | null };
  } | null;
  completion?: {
    acceptNote?: string | null;
    estimatedPickupTime?: string | null;
    pickupArrivedAt?: string | null;
    deliveredAt?: string | null;
    shipperConfirmed?: boolean;
    shipperNote?: string | null;
    driverUnselectedAt?: string | null;
    pickupPhotos?: string[];
    photos?: string[];
    signatureUrl?: string | null;
    receiverName?: string | null;
    receiverPhone?: string | null;
    receiverTitle?: string | null;
  } | null;
  evidence?: {
    pickup?: {
      photos?: string[];
      gps?: { lat?: number; lng?: number };
      capturedAt?: string | null;
      meta?: any;
    } | null;
    dropoff?: {
      photos?: string[];
      gps?: { lat?: number; lng?: number };
      capturedAt?: string | null;
      meta?: any;
    } | null;
  } | null;
  contract?: {
    _id?: string;
    contractNumber?: string;
    hash?: string;
    status?: string;
    signedAt?: string;
  } | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  cancelledByRole?: string | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  timeoutAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface OrderActivityItem {
  key: string;
  title: string;
  description: string;
  time?: string | null;
  icon: React.ElementType;
  done: boolean;
  active: boolean;
  danger?: boolean;
}

type LatLng = { lat: number; lng: number };

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_SCRIPT_SRC =
  "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDq4-qHUd9qYi5go9mI3OpoLEgpMhzgGU&libraries=places,geometry";

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


const STATUS_MAP: Record<string, { label: string; color: string; stepIndex: number }> = {
  searching_driver: { label: "Tìm tài xế", color: "text-blue-600 bg-blue-50 border-blue-100", stepIndex: 0 },
  waiting_driver: { label: "Đang chờ tài xế", color: "text-amber-600 bg-amber-50 border-amber-100", stepIndex: 0 },
  waiting_driver_acceptance: { label: "Chờ tài xế nhận", color: "text-purple-600 bg-purple-50 border-purple-100", stepIndex: 0 },
  accepted: { label: "Đã nhận đơn", color: "text-indigo-600 bg-indigo-50 border-indigo-100", stepIndex: 1 },
  rejected: { label: "Đã từ chối", color: "text-rose-600 bg-rose-50 border-rose-100", stepIndex: 0 },
  in_progress: { label: "Đang vận chuyển", color: "text-primary-600 bg-primary-50 border-primary-100", stepIndex: 2 },
  delivered: { label: "Đã giao hàng", color: "text-emerald-600 bg-emerald-50 border-emerald-100", stepIndex: 3 },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700 bg-emerald-100 border-emerald-200", stepIndex: 3 },
  cancelled: { label: "Đã hủy đơn", color: "text-red-600 bg-red-50 border-red-100", stepIndex: -1 }
};

const CANCEL_REASON_LABELS: Record<string, string> = {
  accident: "Xe hư hỏng / tai nạn",
  dispute: "Tranh chấp cước",
  blocked: "Đoạn đường không đi được",
  no_need: "Không còn nhu cầu vận chuyển",
  change_driver: "Muốn chọn tài xế khác",
  edit_order: "Thông tin đơn hàng cần chỉnh sửa",
  wait_too_long: "Thời gian chờ tài xế quá lâu",
  driver_rejected: "Tài xế từ chối nhận đơn",
  driver_timeout: "Tài xế không phản hồi trong thời gian quy định",
  changed_mind: "Người gửi thay đổi nhu cầu vận chuyển",
  wrong_info: "Thông tin đơn hàng chưa chính xác",
  found_other_driver: "Chủ hàng đã tìm được phương án vận chuyển khác",
  driver_unavailable: "Tài xế không thể tiếp tục thực hiện chuyến",
  vehicle_issue: "Phương tiện gặp sự cố",
  price_not_agreed: "Hai bên chưa thống nhất được giá cước",
  no_contact: "Không liên hệ được với bên còn lại",
  cannot_contact: "Không liên hệ được với bên còn lại",
  no_show: "Không có mặt tại điểm hẹn",
  weather: "Thời tiết không đảm bảo an toàn",
  emergency: "Có việc khẩn cấp",
  other: "Lý do khác",
  timeout: "Quá thời gian xác nhận đơn",
};

function getCancelledByDisplay(order: Order) {
  const roleLabel =
    order.cancelledByRole === "driver" ? "Tài xế" :
    order.cancelledByRole === "shipper" ? "Chủ hàng" :
    order.cancelledByRole === "system" ? "Hệ thống" :
    "Chưa xác định";

  if (order.cancelledByName && roleLabel !== "Chưa xác định") return `${roleLabel} - ${order.cancelledByName}`;
  return order.cancelledByName || roleLabel;
}

function getCancelReasonText(order: Order) {
  const reason = order.cancellationReason || order.rejectionReason;
  if (!reason && order.timeoutAt) return "Quá thời gian xác nhận đơn";
  if (!reason) return "Không có lý do hủy được ghi nhận";

  const normalizedReason = reason.trim().toLowerCase();
  const translatedReason = CANCEL_REASON_LABELS[normalizedReason] || reason;
  const note = order.cancellationReason && order.rejectionReason && order.rejectionReason !== order.cancellationReason
    ? order.rejectionReason.trim()
    : "";

  return note ? `${translatedReason}. Ghi chú: ${note}` : translatedReason;
}

function formatAdminDateTime(value?: string | null) {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa ghi nhận";
  return date.toLocaleString("vi-VN");
}

function buildOrderActivityTimeline(order: Order): OrderActivityItem[] {
  const shipperName = order.shipperId?.name || "Chủ hàng";
  const driverName = order.driverId?.name || "Tài xế";
  const completion = order.completion || {};
  const isWaitingDriverAcceptance = order.status === "waiting_driver_acceptance";
  const hasDriverAccepted = ["accepted", "in_progress", "delivered", "completed", "cancelled"].includes(order.status) && Boolean(order.driverId);
  const hasPickupStarted = ["in_progress", "delivered", "completed"].includes(order.status);
  const hasDriverDelivered = ["delivered", "completed"].includes(order.status);
  const hasShipperCompleted = order.status === "completed";

  const timeline: OrderActivityItem[] = [
    {
      key: "created",
      title: "Chủ hàng tạo vận đơn",
      description: `${shipperName} đã tạo đơn ${order.orderCode} với tuyến từ điểm nhận đến điểm trả.`,
      time: order.createdAt,
      icon: Info,
      done: true,
      active: false,
    },
  ];

  if (order.driverId || isWaitingDriverAcceptance || hasDriverAccepted) {
    timeline.push({
      key: "driver-selected",
      title: "Chủ hàng chọn tài xế",
      description: isWaitingDriverAcceptance
        ? `${shipperName} đã gửi yêu cầu nhận chuyến cho tài xế và đang chờ phản hồi.`
        : `${shipperName} đã chọn ${driverName} cho vận đơn này.`,
      time: order.timeoutAt || order.updatedAt || order.createdAt,
      icon: User,
      done: hasDriverAccepted || isWaitingDriverAcceptance,
      active: isWaitingDriverAcceptance,
    });
  }

  if (order.status === "rejected") {
    timeline.push({
      key: "driver-rejected",
      title: "Tài xế từ chối nhận đơn",
      description: `${driverName} đã từ chối chuyến. Lý do: ${getCancelReasonText(order)}.`,
      time: order.updatedAt,
      icon: AlertTriangle,
      done: true,
      active: false,
    });
  } else if (hasDriverAccepted) {
    timeline.push({
      key: "driver-accepted",
      title: "Tài xế xác nhận nhận chuyến",
      description: `${driverName} đã xác nhận nhận vận đơn.${completion.acceptNote ? ` Ghi chú: ${completion.acceptNote}.` : ""}`,
      time: completion.estimatedPickupTime || order.updatedAt || order.createdAt,
      icon: CheckCircle,
      done: true,
      active: order.status === "accepted",
    });
  }

  if (hasPickupStarted) {
    timeline.push({
      key: "pickup-arrived",
      title: "Tài xế xác nhận điểm nhận",
      description: `${driverName} đã đến điểm nhận và xác nhận bắt đầu vận chuyển hàng.`,
      time: completion.pickupArrivedAt || order.updatedAt,
      icon: MapPin,
      done: true,
      active: order.status === "in_progress",
    });
  }

  if (hasDriverDelivered) {
    timeline.push({
      key: "driver-delivered",
      title: "Tài xế xác nhận giao hàng",
      description: `${driverName} đã xác nhận giao hàng tại điểm trả, chờ chủ hàng kiểm tra và hoàn tất.`,
      time: completion.deliveredAt || order.updatedAt,
      icon: Truck,
      done: true,
      active: order.status === "delivered",
    });
  }

  if (hasShipperCompleted) {
    timeline.push({
      key: "shipper-completed",
      title: "Chủ hàng xác nhận hoàn tất",
      description: `${shipperName} đã xác nhận nhận hàng và hoàn tất vận đơn.${completion.shipperNote ? ` Ghi chú: ${completion.shipperNote}.` : ""}`,
      time: order.updatedAt,
      icon: Shield,
      done: true,
      active: false,
    });
  }

  if (order.status === "cancelled") {
    timeline.push({
      key: "cancelled",
      title: "Vận đơn bị hủy",
      description: `Bên hủy: ${getCancelledByDisplay(order)}. Lý do: ${getCancelReasonText(order)}.`,
      time: order.cancelledAt || order.updatedAt,
      icon: AlertTriangle,
      done: true,
      active: false,
      danger: true,
    });
  }

  return timeline;
}

interface AdminInternalNote {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
  type: "info" | "warning" | "action";
}

interface EpodPhotoItem {
  id: string;
  url: string;
  caption: string;
  category: "cargo" | "document" | "plate" | "seal";
  timestamp: string;
  location: string;
  gps?: string;
}

interface OrderEpodDetail {
  certificateCode: string | null;
  sha256Hash: string | null;
  pickupTime: string | null;
  deliveredTime: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverTitle: string | null;
  conditionNote: string | null;
  signatureUrl: string | null;
  status: "verified" | "awaiting_receiver" | "in_transit" | "pending";
  pickupPhotos: EpodPhotoItem[];
  dropoffPhotos: EpodPhotoItem[];
  cargoPhotos: EpodPhotoItem[];
}

function getOrderEpodDetail(order: Order): OrderEpodDetail {
  const isDelivered = ["delivered", "completed"].includes(order.status);
  const isCompleted = order.status === "completed";
  const isInProgress = order.status === "in_progress";

  const pickupTime = order.completion?.pickupArrivedAt || null;
  const deliveredTime = order.completion?.deliveredAt || order.updatedAt || null;

  // Real certificate code from contract or orderCode
  const certificateCode = order.contract?.contractNumber || 
    (order.orderCode ? `EPOD-${order.orderCode}` : null);

  // Real SHA-256 hash from contract or evidence
  const sha256Hash = order.contract?.hash || 
    order.evidence?.dropoff?.meta?.hash || 
    order.evidence?.dropoff?.meta?.sha256 || null;

  // Real pickup photos from evidence or completion
  const rawPickupPhotos = [
    ...(Array.isArray(order.evidence?.pickup?.photos) ? order.evidence.pickup.photos : []),
    ...(Array.isArray(order.completion?.pickupPhotos) ? order.completion.pickupPhotos : []),
  ].filter((u): u is string => typeof u === "string" && Boolean(u.trim()));
  const uniquePickupUrls = Array.from(new Set(rawPickupPhotos));

  const pickupPhotos: EpodPhotoItem[] = uniquePickupUrls.map((url, idx) => ({
    id: `pickup-${idx + 1}`,
    url,
    caption: `Ảnh hiện trường bốc hàng #${idx + 1}`,
    category: idx === 0 ? "cargo" : idx === 1 ? "plate" : "seal",
    timestamp: formatAdminDateTime(pickupTime || order.createdAt),
    location: order.pickup?.address || "",
    gps: order.evidence?.pickup?.gps ? `${order.evidence.pickup.gps.lat}° N, ${order.evidence.pickup.gps.lng}° E` : undefined,
  }));

  // Real dropoff photos from evidence or completion
  const rawDropoffPhotos = [
    ...(Array.isArray(order.evidence?.dropoff?.photos) ? order.evidence.dropoff.photos : []),
    ...(Array.isArray(order.completion?.photos) ? order.completion.photos : []),
  ].filter((u): u is string => typeof u === "string" && Boolean(u.trim()));
  const uniqueDropoffUrls = Array.from(new Set(rawDropoffPhotos));

  const dropoffPhotos: EpodPhotoItem[] = uniqueDropoffUrls.map((url, idx) => ({
    id: `dropoff-${idx + 1}`,
    url,
    caption: `Ảnh hiện trường giao nhận #${idx + 1}`,
    category: idx === 0 ? "cargo" : idx === 1 ? "document" : "seal",
    timestamp: formatAdminDateTime(deliveredTime || order.updatedAt || order.createdAt),
    location: order.dropoff?.address || "",
    gps: order.evidence?.dropoff?.gps ? `${order.evidence.dropoff.gps.lat}° N, ${order.evidence.dropoff.gps.lng}° E` : undefined,
  }));

  // Initial cargo photos uploaded by shipper
  const rawCargoUrls = (Array.isArray(order.cargoImageUrls) ? order.cargoImageUrls : [])
    .filter((u): u is string => typeof u === "string" && Boolean(u.trim()));
  const uniqueCargoUrls = Array.from(new Set(rawCargoUrls));

  const cargoPhotos: EpodPhotoItem[] = uniqueCargoUrls.map((url, idx) => ({
    id: `cargo-${idx + 1}`,
    url,
    caption: `Ảnh hàng hóa lúc tạo đơn #${idx + 1}`,
    category: "cargo",
    timestamp: formatAdminDateTime(order.createdAt),
    location: order.pickup?.address || "",
  }));

  // Real receiver information
  const receiverName = 
    order.evidence?.dropoff?.meta?.receiverName || 
    order.completion?.receiverName || 
    (order.completion?.shipperConfirmed ? order.shipperId?.name : null) || 
    null;

  const receiverPhone = 
    order.evidence?.dropoff?.meta?.receiverPhone || 
    order.completion?.receiverPhone || 
    null;

  const receiverTitle = 
    order.evidence?.dropoff?.meta?.receiverTitle || 
    null;

  const conditionNote = 
    order.completion?.shipperNote || 
    order.evidence?.dropoff?.meta?.note || 
    null;

  const signatureUrl = 
    order.completion?.signatureUrl || 
    order.evidence?.dropoff?.meta?.signatureUrl || 
    null;

  const status = isCompleted
    ? "verified"
    : isDelivered
      ? "awaiting_receiver"
      : isInProgress
        ? "in_transit"
        : "pending";

  return {
    certificateCode,
    sha256Hash,
    pickupTime: pickupTime ? formatAdminDateTime(pickupTime) : null,
    deliveredTime: deliveredTime ? formatAdminDateTime(deliveredTime) : null,
    receiverName,
    receiverPhone,
    receiverTitle,
    conditionNote,
    signatureUrl,
    status,
    pickupPhotos,
    dropoffPhotos,
    cargoPhotos,
  };
}

function AdminOrderRouteMap({ order }: { order: Order }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const resolvePoint = async (
      google: any,
      location: { address: string; lat?: number; lng?: number },
    ): Promise<LatLng | null> => {
      if (hasValidPoint(location)) return { lat: location.lat, lng: location.lng };

      return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: location.address }, (results: any, status: any) => {
          if (status !== "OK" || !results?.[0]?.geometry?.location) {
            resolve(null);
            return;
          }
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        });
      });
    };

    const drawMap = async () => {
      await loadGoogleMaps();
      if (cancelled || !containerRef.current) return;

      const google = (window as any).google;
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

      const trackingData = await fetch(`/api/tracking?code=${encodeURIComponent(order.orderCode || order._id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
      if (cancelled) return;

      const trackingOrder = trackingData?.order || null;
      const trackingDriver = trackingData?.driver || null;
      const driver = trackingData?.latestLocation || null;
      const pickup = trackingOrder?.pickup || order.pickup;
      const dropoff = trackingOrder?.dropoff || order.dropoff;

      const [pickupPoint, dropoffPoint] = await Promise.all([
        resolvePoint(google, pickup),
        resolvePoint(google, dropoff),
      ]);
      if (cancelled) return;

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

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

      if (pickupPoint) {
        addMarker(
          pickupPoint,
          "A",
          "#2563eb",
          "Điểm nhận",
          `<div style="min-width:220px"><strong>Điểm nhận hàng</strong><p style="margin:6px 0 0">${escapeHtml(pickup.address)}</p></div>`,
        );
      }

      if (dropoffPoint) {
        addMarker(
          dropoffPoint,
          "B",
          "#ef4444",
          "Điểm trả",
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
            url: getVehicleIconSvg(trackingDriver?.vehicleText),
            scaledSize: new google.maps.Size(54, 42),
            anchor: new google.maps.Point(27, 21),
          },
          zIndex: 10,
        });
        marker.addListener("click", () => {
          infoWindow.setContent(`
            <div style="min-width:240px">
              <strong>Thông tin tài xế</strong>
              <p style="margin:6px 0 0"><b>Họ tên:</b> ${escapeHtml(trackingDriver?.fullName || order.driverId?.name || "Chưa có")}</p>
              <p style="margin:4px 0 0"><b>SĐT:</b> ${escapeHtml(trackingDriver?.phone || order.driverId?.phone || "Chưa có")}</p>
              <p style="margin:4px 0 0"><b>Phương tiện:</b> ${escapeHtml(trackingDriver?.vehicleText || "Chưa cập nhật")}</p>
              <p style="margin:4px 0 0"><b>Biển số:</b> ${escapeHtml(trackingDriver?.plateNumber || "Chưa cập nhật")}</p>
              <p style="margin:4px 0 0"><b>Tốc độ:</b> ${Math.round((driver as any).speed || 0)} km/h</p>
            </div>
          `);
          infoWindow.open({ anchor: marker, map });
        });
        layersRef.current.push(marker);
      }

      if (pickupPoint && dropoffPoint) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: "#4f46e5", strokeOpacity: 0.88, strokeWeight: 5 },
        });
        layersRef.current.push(directionsRenderer);

        directionsService.route(
          {
            origin: pickupPoint,
            destination: dropoffPoint,
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
        map.fitBounds(bounds, { top: 64, right: 64, bottom: 64, left: 64 });
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
  }, [order]);

  return <div ref={containerRef} className="h-full min-h-[260px] w-full bg-slate-100" />;
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [copiedEscrow, setCopiedEscrow] = useState(false);

  // e-POD states
  const [activeEpodTab, setActiveEpodTab] = useState<"dropoff" | "pickup" | "cargo">("dropoff");
  const [selectedPhoto, setSelectedPhoto] = useState<EpodPhotoItem | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Admin Action Toolbar states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Modal form states
  const [targetStatus, setTargetStatus] = useState<Order["status"]>("in_progress");
  const [statusNote, setStatusNote] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverVehicle, setNewDriverVehicle] = useState("");
  const [reassignMode, setReassignMode] = useState<"assign" | "reopen">("assign");
  const [reassignReason, setReassignReason] = useState("");
  const [escrowActionType, setEscrowActionType] = useState<"disburse" | "freeze" | "refund">("disburse");
  const [escrowActionReason, setEscrowActionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState<AdminInternalNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<"info" | "warning" | "action">("info");
  const [cancelReasonChoice, setCancelReasonChoice] = useState("Xe hư hỏng / tai nạn kỹ thuật");
  const [cancelReasonDetail, setCancelReasonDetail] = useState("");

  // Load order data and initialize Google Map route
  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.order) {
            setOrder({
              ...data.data.order,
              reviews: data.data.reviews || [],
              contract: data.data.contract || null,
              evidence: data.data.evidence || null,
            });
            setIsOffline(false);
          } else {
            setOrder(null);
            setIsOffline(false);
          }
        } else {
          setOrder(null);
          setIsOffline(false);
        }
      } catch (err) {
        console.warn("Backend error, order not loaded", err);
        setOrder(null);
        setIsOffline(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Close modals on Escape key (Must be placed before any conditional returns to obey Rules of Hooks)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPhoto(null);
        setIsPrintModalOpen(false);
        setIsStatusModalOpen(false);
        setIsReassignModalOpen(false);
        setIsEscrowModalOpen(false);
        setIsNotesModalOpen(false);
        setIsCancelModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-slate-400 text-xs font-bold">Đang tải thông tin chi tiết vận đơn...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow text-center space-y-4 max-w-md mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Không Tìm Thấy Vận Đơn</h3>
        <p className="text-slate-500 text-xs">Mã vận đơn này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <button onClick={() => router.push("/admin/orders")} className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const activeStatus = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", stepIndex: 0 };
  const orderReviews = order.reviews || [];
  const shouldShowReviews = (order.status === "completed" || order.status === "delivered") && orderReviews.length > 0;
  const activityTimeline = buildOrderActivityTimeline(order);

  const totalPrice = order.offerPrice || (typeof order.budget === "number" ? order.budget : order.budget?.max || 0);
  const platformFee = Math.round(totalPrice * 0.05);
  const driverPayout = totalPrice > 0 ? totalPrice - platformFee : 0;
  const escrowTxCode = `MB-TXE-${order.orderCode || order._id}`;

  const handleCopyEscrow = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(escrowTxCode);
      setCopiedEscrow(true);
      toast.success("Đã sao chép mã giao dịch ký quỹ MB Bank");
      setTimeout(() => setCopiedEscrow(false), 2000);
    }
  };

  const getEscrowStatus = (status: Order["status"]) => {
    if (status === "completed") {
      return {
        badge: "Đã giải ngân cho tài xế",
        sub: "Thanh toán tự động giải ngân sau khi nghiệm thu e-POD thành công",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        icon: CheckCircle,
        dotColor: "bg-emerald-500",
      };
    }
    if (status === "in_progress" || status === "delivered" || status === "accepted") {
      return {
        badge: "Đã ký quỹ 100% bảo chứng",
        sub: "Tiền phong tỏa tại MB Bank, bảo vệ quyền lợi hai bên",
        color: "text-blue-700 bg-blue-50 border-blue-200",
        icon: ShieldCheck,
        dotColor: "bg-blue-500 animate-pulse",
      };
    }
    if (status === "cancelled" || status === "rejected") {
      return {
        badge: "Đã hoàn cước / Hủy ký quỹ",
        sub: "Cước phí đã được MB Bank hoàn về tài khoản người gửi",
        color: "text-rose-700 bg-rose-50 border-rose-200",
        icon: AlertTriangle,
        dotColor: "bg-rose-500",
      };
    }
    return {
      badge: "Chờ nạp ký quỹ",
      sub: "Đang chờ chủ hàng nạp bảo chứng cước phí",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      icon: Clock,
      dotColor: "bg-amber-500",
    };
  };

  const escrowStatus = getEscrowStatus(order.status);
  const epodDetail = getOrderEpodDetail(order);

  const handleOpenPhoto = (photo: EpodPhotoItem) => {
    setSelectedPhoto(photo);
    setPhotoZoom(1);
    setPhotoRotation(0);
  };

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
    setPhotoZoom(1);
    setPhotoRotation(0);
  };

  const handleDownloadPhotos = () => {
    toast.success("Đang chuẩn bị trọn bộ ảnh e-POD chất lượng cao (.ZIP)...");
  };

  const handleDownloadSinglePhoto = (photo: EpodPhotoItem) => {
    toast.success(`Đang tải ảnh: ${photo.caption}`);
  };

  // Admin Toolbar Action Handlers
  const handleSyncOrder = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Đã đồng bộ dữ liệu vận đơn & tọa độ GPS mới nhất từ thiết bị tài xế");
    }, 600);
  };

  const handleConfirmStatusChange = () => {
    if (!order) return;
    setOrder({ ...order, status: targetStatus });
    const noteContent = `[Điều phối viên - Thao tác hệ thống]: Cập nhật trạng thái sang "${STATUS_MAP[targetStatus]?.label || targetStatus}". ${statusNote ? `Lý do: ${statusNote}` : ""}`;
    const autoNote: AdminInternalNote = {
      id: `n-${Date.now()}`,
      author: "Quản trị viên TMS",
      role: "Admin điều hành",
      content: noteContent,
      createdAt: new Date().toISOString(),
      type: "action",
    };
    setAdminNotes((prev) => [autoNote, ...prev]);
    toast.success(`Đã cập nhật trạng thái vận đơn sang "${STATUS_MAP[targetStatus]?.label || targetStatus}"`);
    setStatusNote("");
    setIsStatusModalOpen(false);
  };

  const handleConfirmReassignDriver = () => {
    if (!order) return;
    if (reassignMode === "reopen") {
      setOrder({ ...order, driverId: undefined, status: "searching_driver" });
      const autoNote: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Quản trị viên TMS",
        role: "Admin điều hành",
        content: `[Điều phối tài xế]: Đưa đơn về tìm kiếm trên sàn. Lý do: ${reassignReason || "Tài xế cũ không thể tiếp tục"}`,
        createdAt: new Date().toISOString(),
        type: "warning",
      };
      setAdminNotes((prev) => [autoNote, ...prev]);
      toast.success("Đã đưa vận đơn về trạng thái tìm kiếm tài xế trên sàn");
    } else {
      if (!newDriverName.trim()) {
        toast.warning("Vui lòng nhập họ và tên tài xế để chỉ định");
        return;
      }
      const driverObj: UserInfo = {
        name: newDriverName.trim(),
        phone: newDriverPhone.trim() || "---",
        email: "",
      };
      setOrder({
        ...order,
        driverId: driverObj,
        status: "accepted",
      });
      const autoNote: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Quản trị viên TMS",
        role: "Admin điều hành",
        content: `[Điều phối tài xế]: Chỉ định tài xế mới ${driverObj.name}${newDriverPhone ? ` (${newDriverPhone.trim()})` : ""}${newDriverVehicle ? ` - Phương tiện: ${newDriverVehicle.trim()}` : ""}. ${reassignReason ? `Ghi chú: ${reassignReason.trim()}` : ""}`,
        createdAt: new Date().toISOString(),
        type: "action",
      };
      setAdminNotes((prev) => [autoNote, ...prev]);
      toast.success(`Đã chỉ định tài xế mới: ${driverObj.name}`);
    }
    setNewDriverName("");
    setNewDriverPhone("");
    setNewDriverVehicle("");
    setReassignReason("");
    setIsReassignModalOpen(false);
  };

  const handleConfirmEscrowAction = () => {
    if (!order) return;
    if (escrowActionType === "disburse") {
      setOrder({ ...order, status: "completed" });
      const autoNote: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Ban kiểm soát Escrow MB",
        role: "Kiểm soát tài chính",
        content: `[Giải ngân MB Bank]: Đã duyệt giải ngân 95% cước phí cho tài xế. ${escrowActionReason ? `Ghi chú: ${escrowActionReason}` : ""}`,
        createdAt: new Date().toISOString(),
        type: "action",
      };
      setAdminNotes((prev) => [autoNote, ...prev]);
      toast.success("Đã gửi lệnh giải ngân 95% cước phí qua MB Bank thành công");
    } else if (escrowActionType === "freeze") {
      const autoNote: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Ban kiểm soát Escrow MB",
        role: "Kiểm soát tài chính",
        content: `[Đóng băng ký quỹ]: Đã phong tỏa tài khoản MB Bank do phát sinh tranh chấp. Lý do: ${escrowActionReason || "Yêu cầu từ kiểm soát viên"}`,
        createdAt: new Date().toISOString(),
        type: "warning",
      };
      setAdminNotes((prev) => [autoNote, ...prev]);
      toast.warning("Đã đóng băng ký quỹ MB Bank chờ giải quyết tranh chấp");
    } else {
      setOrder({ ...order, status: "cancelled" });
      const autoNote: AdminInternalNote = {
        id: `n-${Date.now()}`,
        author: "Ban kiểm soát Escrow MB",
        role: "Kiểm soát tài chính",
        content: `[Hoàn cước MB Bank]: Lệnh hoàn cước 100% về tài khoản chủ hàng. Lý do: ${escrowActionReason || "Hủy vận đơn"}`,
        createdAt: new Date().toISOString(),
        type: "info",
      };
      setAdminNotes((prev) => [autoNote, ...prev]);
      toast.info("Đã gửi lệnh hoàn cước 100% về tài khoản chủ hàng");
    }
    setEscrowActionReason("");
    setIsEscrowModalOpen(false);
  };

  const handleAddAdminNote = () => {
    if (!newNoteContent.trim()) {
      toast.error("Vui lòng nhập nội dung ghi chú");
      return;
    }
    const note: AdminInternalNote = {
      id: `n-${Date.now()}`,
      author: "Quản trị viên TMS",
      role: "Admin điều hành",
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      type: newNoteType,
    };
    setAdminNotes((prev) => [note, ...prev]);
    setNewNoteContent("");
    toast.success("Đã thêm ghi chú nội bộ thành công");
  };

  const handleConfirmEmergencyCancel = () => {
    if (!order) return;
    const fullReason = `${cancelReasonChoice}${cancelReasonDetail ? `. Chi tiết: ${cancelReasonDetail}` : ""}`;
    setOrder({
      ...order,
      status: "cancelled",
      cancellationReason: fullReason,
      cancelledByName: "Quản trị viên hệ thống",
      cancelledByRole: "admin",
      cancelledAt: new Date().toISOString(),
    });
    const autoNote: AdminInternalNote = {
      id: `n-${Date.now()}`,
      author: "Quản trị viên TMS",
      role: "Admin điều hành",
      content: `[Hủy đơn khẩn cấp]: Vận đơn đã bị hủy bởi Quản trị viên. Lý do: ${fullReason}`,
      createdAt: new Date().toISOString(),
      type: "warning",
    };
    setAdminNotes((prev) => [autoNote, ...prev]);
    toast.warning("Vận đơn đã được chuyển sang trạng thái Đã hủy đơn");
    setCancelReasonDetail("");
    setIsCancelModalOpen(false);
  };

  const currentPhotos = activeEpodTab === "dropoff"
    ? epodDetail.dropoffPhotos
    : activeEpodTab === "pickup"
      ? epodDetail.pickupPhotos
      : epodDetail.cargoPhotos;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/orders" 
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chi Tiết Vận Đơn</h1>
              <span className="font-bold text-primary-600 text-sm bg-primary-50 px-2 py-0.5 rounded-md">{order.orderCode}</span>
              {isOffline && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Mẫu mô phỏng
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">Khởi tạo lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border uppercase tracking-wider ${activeStatus.color}`}>
          {activeStatus.label}
        </span>
      </div>

      {/* Admin Action Toolbar Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-sm border border-slate-800/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold tracking-wider uppercase text-white">
                  Bộ Công Cụ Thao Tác Nhanh Quản Trị Viên (TMS Operations)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                  ADMIN DISPATCH CONTROL
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Can thiệp điều vận thời gian thực, quản trị dòng tiền MB Bank và xử lý ngoại lệ
              </p>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync / Refresh */}
            <button
              type="button"
              onClick={handleSyncOrder}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-slate-200 text-xs font-bold transition-all border border-white/10 cursor-pointer disabled:opacity-50"
              title="Đồng bộ dữ liệu thời gian thực"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-primary-400" : "text-slate-300"}`} />
              <span>{isSyncing ? "Đang đồng bộ..." : "Làm mới"}</span>
            </button>

            {/* Status Override */}
            <button
              type="button"
              onClick={() => {
                setTargetStatus(order.status);
                setIsStatusModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Chuyển trạng thái</span>
            </button>

            {/* Reassign Driver */}
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Điều phối tài xế</span>
            </button>

            {/* Escrow Actions */}
            <button
              type="button"
              onClick={() => setIsEscrowModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ký quỹ MB Bank</span>
            </button>

            {/* Internal Notes */}
            <button
              type="button"
              onClick={() => setIsNotesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 active:scale-95 cursor-pointer relative"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Ghi chú nội bộ</span>
              {adminNotes.length > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {adminNotes.length}
                </span>
              )}
            </button>

            {/* Cancel Order */}
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>Hủy đơn</span>
            </button>
          </div>
        </div>

        {/* Quick info ribbon */}
        <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Mã phiên can thiệp: <span className="text-slate-200 font-mono font-bold">TMS-SES-{(order._id || "").slice(-6).toUpperCase()}</span></span>
            <span>•</span>
            <span>Quyền hạn: <span className="text-emerald-400 font-bold">Full Admin Dispatcher</span></span>
            {adminNotes.length > 0 ? (
              <span>Ghi chú mới nhất: <span className="text-slate-200 italic">{adminNotes[0].content.slice(0, 60)}...</span></span>
            ) : (
              <span>Ghi chú nội bộ: <span className="text-slate-400 italic">Chưa có ghi chú</span></span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsNotesModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
          >
            {adminNotes.length > 0 ? `Xem toàn bộ ${adminNotes.length} ghi chú →` : "Thêm ghi chú nội bộ →"}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Parties */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Order Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-500" /> Thông tin hàng hóa & chi phí
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 font-bold mb-1">TÊN HÀNG HÓA</p>
                  <p className="text-slate-800 font-bold text-sm">{order.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">LOẠI HÀNG HÓA</p>
                  <p className="text-slate-800 font-bold">{order.cargoType || "Hàng thông thường"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 font-bold mb-1">CƯỚC PHÍ VẬN CHUYỂN</p>
                  <p className="text-slate-900 font-bold text-base flex items-center gap-0.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    {order.offerPrice ? `${order.offerPrice.toLocaleString()} ₫` : "Đang báo giá"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">PHƯƠNG THỨC THANH TOÁN</p>
                  <p className="text-slate-800 font-bold">{order.paymentMethod || "Tiền mặt khi giao nhận"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: MB Bank Escrow Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Ký Quỹ & Bảo Chứng Dòng Tiền
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wide">
                      MB BANK ESCROW
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tài khoản trung gian chuyên dụng phong tỏa theo hợp đồng điện tử
                  </p>
                </div>
              </div>

              {/* Dynamic Escrow Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${escrowStatus.color} self-start sm:self-auto`}>
                <span className={`w-2 h-2 rounded-full ${escrowStatus.dotColor}`} />
                <escrowStatus.icon className="w-3.5 h-3.5" />
                <span>{escrowStatus.badge}</span>
              </div>
            </div>

            {/* Escrow Transaction Code & Copy Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã giao dịch ký quỹ MB Bank</p>
                  <p className="font-mono text-xs font-bold text-slate-800">{escrowTxCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEscrow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                {copiedEscrow ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sao chép mã</span>
                  </>
                )}
              </button>
            </div>

            {/* Financial Breakdown 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Box 1: Tổng cước ký quỹ */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-400" /> Tổng Cước Ký Quỹ
                </span>
                <p className="text-base font-bold text-slate-900">
                  {totalPrice > 0 ? `${totalPrice.toLocaleString("vi-VN")} ₫` : "Chưa báo giá"}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {totalPrice > 0 ? "100% cước vận đơn" : "Đang chờ thỏa thuận"}
                </p>
              </div>

              {/* Box 2: Phí dịch vụ sàn */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-slate-400" /> Phí Nền Tảng (5%)
                </span>
                <p className="text-base font-bold text-slate-700">
                  {totalPrice > 0 ? `${platformFee.toLocaleString("vi-VN")} ₫` : "---"}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Bảo trì kết nối & định vị</p>
              </div>

              {/* Box 3: Bảo hiểm hàng hóa */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" /> Bảo Hiểm Hàng Hóa
                </span>
                {order.insurance?.isRequested ? (
                  <>
                    <p className="text-base font-bold text-emerald-600">
                      {order.insurance.fee ? `${order.insurance.fee.toLocaleString("vi-VN")} ₫` : "Đã kích hoạt"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      Khai báo: {order.insurance.declaredValue ? `${order.insurance.declaredValue.toLocaleString("vi-VN")} ₫` : "Theo thỏa thuận"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-slate-500">
                      Không yêu cầu
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Chủ hàng không mua bảo hiểm
                    </p>
                  </>
                )}
              </div>

              {/* Box 4: Thực nhận tài xế */}
              <div className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-600" /> Thực Nhận Tài Xế (95%)
                </span>
                <p className="text-base font-bold text-emerald-700">
                  {driverPayout > 0 ? `${driverPayout.toLocaleString("vi-VN")} ₫` : "---"}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">Tự động sau e-POD</p>
              </div>
            </div>

            {/* Escrow Safety Mechanism Callout & Link */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/60 border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Cơ Chế Bảo Chứng An Toàn Hai Đầu TXEPRO & MB Bank
                  </p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                    Khoản tiền được phong tỏa độc lập tại Ngân hàng Quân Đội (MB Bank). Tài xế an tâm nhận chuyến chắc chắn nhận tiền, chủ hàng an tâm hàng hóa được bảo vệ toàn trình.
                  </p>
                </div>
              </div>
              <Link
                href="/thong-tin/thanh-toan-ky-quy"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 font-bold whitespace-nowrap px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-blue-200/80 transition-all text-[11px] shadow-2xs self-end sm:self-auto shrink-0 cursor-pointer"
              >
                <span>Xem quy chế MB Bank</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Section 2: Route Addresses */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" /> Hành Trình Vận Đơn
            </h2>

            <div className="space-y-4 text-xs relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Pickup */}
              <div className="relative">
                <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">ĐI</span>
                <p className="text-slate-400 font-bold">ĐIỂM NHẬN HÀNG (PICKUP)</p>
                <p className="text-slate-800 font-bold mt-0.5 text-sm">{order.pickup.address}</p>
              </div>

              {/* Dropoff */}
              <div className="relative">
                <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">VỀ</span>
                <p className="text-slate-400 font-bold">ĐIỂM GIAO HÀNG (DROPOFF)</p>
                <p className="text-slate-800 font-bold mt-0.5 text-sm">{order.dropoff.address}</p>
              </div>
            </div>
          </div>

          {/* Section: Biên Bản Nghiệm Thu Điện Tử (e-POD) & Ảnh Chụp Thực Tế */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-6">
            {/* Top Title & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Biên Bản Nghiệm Thu Điện Tử (e-POD)
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 tracking-wide flex items-center gap-1">
                      <Camera className="w-3 h-3" /> CHỨNG TỪ SỐ HÓA
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Chứng từ nghiệm thu toàn trình kèm ảnh hiện trường, tọa độ GPS và chữ ký số
                  </p>
                </div>
              </div>

              {/* Status Badge & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  epodDetail.status === "verified"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : epodDetail.status === "awaiting_receiver"
                      ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                      : epodDetail.status === "in_transit"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-slate-600 bg-slate-50 border-slate-200"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    epodDetail.status === "verified"
                      ? "bg-emerald-500"
                      : epodDetail.status === "awaiting_receiver"
                        ? "bg-indigo-500 animate-pulse"
                        : epodDetail.status === "in_transit"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-slate-400"
                  }`} />
                  {epodDetail.status === "verified"
                    ? "Đã nghiệm thu hợp lệ"
                    : epodDetail.status === "awaiting_receiver"
                      ? "Chờ chủ hàng ký duyệt"
                      : epodDetail.status === "in_transit"
                        ? "Đã bốc hàng (Đang giao)"
                        : "Chờ giao nhận"}
                </span>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Xem và in biên bản e-POD chuẩn A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In e-POD (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPhotos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Tải gói dữ liệu ảnh gốc"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tải ảnh (.ZIP)</span>
                </button>
              </div>
            </div>

            {/* Checkpoint Switcher Tabs */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveEpodTab("dropoff")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeEpodTab === "dropoff"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Điểm giao hàng (Dropoff e-POD)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeEpodTab === "dropoff" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {epodDetail.dropoffPhotos.length} ảnh
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEpodTab("pickup")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeEpodTab === "pickup"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Điểm bốc hàng (Pickup e-POD)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeEpodTab === "pickup" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {epodDetail.pickupPhotos.length} ảnh
                  </span>
                </button>

                {epodDetail.cargoPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveEpodTab("cargo")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeEpodTab === "cargo"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>Ảnh hàng ban đầu</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeEpodTab === "cargo" ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {epodDetail.cargoPhotos.length} ảnh
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Photo Grid or Empty State */}
            {currentPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {currentPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handleOpenPhoto(photo)}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200/80 shadow-xs cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                    {/* Top Category Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow-2xs ${
                        photo.category === "cargo"
                          ? "bg-blue-500/90 text-white"
                          : photo.category === "document"
                            ? "bg-purple-500/90 text-white"
                            : photo.category === "seal"
                              ? "bg-amber-500/90 text-white"
                              : "bg-slate-700/90 text-white"
                      }`}>
                        {photo.category === "cargo"
                          ? "Hàng hóa"
                          : photo.category === "document"
                            ? "Chứng từ"
                            : photo.category === "seal"
                              ? "Kẹp chì Seal"
                              : "Biển số xe"}
                      </span>
                    </div>

                    {/* Top Right Zoom Trigger */}
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/50 text-white/90 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </div>

                    {/* Bottom Caption & GPS Info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-0.5">
                      <p className="text-white text-xs font-bold truncate drop-shadow-xs">
                        {photo.caption}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span className="truncate">{photo.timestamp}</span>
                        {photo.gps && (
                          <span className="flex items-center gap-0.5 text-emerald-400 font-bold shrink-0">
                            <MapPin className="w-2.5 h-2.5" /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col items-center text-center space-y-2.5">
                {activeEpodTab === "dropoff" && order.status === "in_progress" ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Phương Tiện Đang Trên Tuyến Vận Chuyển</h4>
                    <p className="text-slate-500 text-[11px] max-w-md leading-relaxed">
                      Tài xế đang vận chuyển hàng hóa đến <span className="font-semibold text-slate-700">{order.dropoff.address}</span>. Ảnh hiện trường và biên bản giao nhận sẽ được cập nhật khi đến kho nhận.
                    </p>
                  </>
                ) : activeEpodTab === "dropoff" ? (
                  <>
                    <Camera className="w-8 h-8 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700">Chưa có ảnh bàn giao tại điểm trả hàng</h4>
                    <p className="text-slate-500 text-[11px] max-w-sm">
                      {order.status === "delivered" || order.status === "completed"
                        ? "Vận đơn đã hoàn thành nhưng chưa có ảnh chụp nghiệm thu được tải lên."
                        : "Vận đơn chưa tới giai đoạn giao nhận."}
                    </p>
                  </>
                ) : activeEpodTab === "pickup" ? (
                  <>
                    <Camera className="w-8 h-8 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700">Chưa có ảnh kiểm đếm lúc bốc hàng</h4>
                    <p className="text-slate-500 text-[11px] max-w-sm">
                      {order.status === "searching_driver" || order.status === "waiting_driver" || order.status === "waiting_driver_acceptance"
                        ? "Đơn hàng đang chờ kết nối tài xế nhận chuyến."
                        : "Tài xế chưa tải lên ảnh chụp kẹp chì hoặc hiện trường bốc hàng."}
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700">Không có ảnh hàng hóa ban đầu</h4>
                    <p className="text-slate-500 text-[11px]">Chủ hàng không đính kèm ảnh khi tạo yêu cầu vận chuyển.</p>
                  </>
                )}
              </div>
            )}

            {/* Acceptance Specs & Digital Signature Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Left Box: Chi tiết nghiệm thu */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Thông tin nghiệm thu bàn giao
                </h4>

                <div className="space-y-2.5 text-slate-700 font-medium">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400 font-bold">Mã chứng chỉ e-POD:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {epodDetail.certificateCode || `EPOD-${order.orderCode}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400 font-bold">Người nhận bàn giao:</span>
                    <span className="font-bold text-slate-800">{epodDetail.receiverName || "Chưa ghi nhận người nhận"}</span>
                  </div>
                  {epodDetail.receiverPhone && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-400 font-bold">Số điện thoại người nhận:</span>
                      <span className="font-bold text-slate-800">{epodDetail.receiverPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400 font-bold">Thời điểm nghiệm thu:</span>
                    <span className="font-bold text-slate-800">{epodDetail.deliveredTime || "Chưa hoàn tất giao hàng"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold">Đánh giá ngoại quan & niêm phong:</span>
                    <p className="text-[11px] text-slate-800 font-semibold bg-white p-2.5 rounded-xl border border-slate-200/70 leading-relaxed">
                      {epodDetail.conditionNote ? `"${epodDetail.conditionNote}"` : "Chưa có ghi chú kiểm kho"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Box: Chữ ký số điện tử */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${epodDetail.signatureUrl ? "text-emerald-600" : "text-slate-400"}`} />
                    Chữ ký số xác thực (Digital Signature)
                  </h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    epodDetail.signatureUrl
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-slate-500 bg-slate-200/70"
                  }`}>
                    {epodDetail.signatureUrl ? "ĐÃ KÝ SỐ XÁC THỰC" : "CHƯA KÝ NHẬN"}
                  </span>
                </div>

                {/* Signature preview frame */}
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300/80 bg-white p-4 flex flex-col items-center justify-center min-h-[90px] overflow-hidden">
                  {epodDetail.signatureUrl ? (
                    <img src={epodDetail.signatureUrl} alt="Chữ ký người nhận" className="max-h-16 object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-xs italic space-y-1">
                      <FileSignature className="w-6 h-6 text-slate-300" />
                      <span>Chưa có chữ ký điện tử</span>
                      <span className="text-[10px] text-slate-400">
                        {order.status === "delivered" || order.status === "completed"
                          ? "Bàn giao chưa ghi nhận chữ ký số"
                          : "Sẽ được ký duyệt khi bàn giao tại kho đích"}
                      </span>
                    </div>
                  )}
                  {epodDetail.signatureUrl && (
                    <div className="absolute right-3 bottom-2 text-right pointer-events-none opacity-20">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">TXEPRO VERIFIED</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <p className="font-bold text-slate-800">{epodDetail.receiverName || "Chưa có thông tin"}</p>
                    <p className="text-[10px] text-slate-400">{epodDetail.receiverTitle || "Đại diện bên nhận"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-slate-400">SHA-256 HASH</p>
                    <p className="font-mono text-[10px] font-bold text-slate-600 truncate max-w-[120px]">
                      {epodDetail.sha256Hash || "---"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Involved Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipper */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 text-blue-600">
                <User className="w-4 h-4" /> Chủ Hàng (Shipper)
              </h3>
              <div className="space-y-3 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Họ và Tên:</span>
                  <span className="text-slate-800">{order.shipperId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số Điện Thoại:</span>
                  <span className="text-slate-800 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {order.shipperId.phone || "---"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email liên hệ:</span>
                  <span className="text-slate-800 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {order.shipperId.email || "---"}</span>
                </div>
              </div>
            </div>

            {/* Driver */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 text-emerald-600">
                <Truck className="w-4 h-4" /> Tài Xế (Driver)
              </h3>
              {order.driverId ? (
                <div className="space-y-3 text-xs font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Họ và Tên:</span>
                    <span className="text-slate-800">{order.driverId.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số Điện Thoại:</span>
                    <span className="text-slate-800 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {order.driverId.phone || "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email liên hệ:</span>
                    <span className="text-slate-800 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {order.driverId.email || "---"}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-6 text-slate-400 text-xs font-bold">
                  <Loader className="w-6 h-6 text-slate-300 animate-spin mb-2" />
                  <p>Hệ thống đang tìm kiếm tài xế thích hợp...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Google Map & Status Tracker */}
        <div className="space-y-6">
          
          {/* Route Map Container */}
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm overflow-hidden flex flex-col h-[320px]">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              🗺️ Bản đồ lộ trình vận đơn
            </h3>
            <div className="flex-1 w-full rounded-2xl bg-slate-100 overflow-hidden relative">
              <AdminOrderRouteMap order={order} />
            </div>
          </div>

          {/* Vertical Step Progress Tracker */}
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Trạng Thái Vận Đơn
            </h3>

            <div className="space-y-5 pl-4 relative before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {activityTimeline.map((item) => {
                const ActivityIcon = item.icon;
                const isDanger = Boolean(item.danger);
                return (
                  <div key={item.key} className="flex items-start gap-4 relative">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                      isDanger
                        ? "bg-red-500 border-red-500 text-white"
                        : item.active
                          ? "bg-primary-500 border-primary-500 text-white animate-pulse"
                          : item.done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-200 text-slate-400"
                    }`}>
                      <ActivityIcon className="w-2.5 h-2.5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-xs font-bold ${
                          isDanger ? "text-red-700" : item.active ? "text-primary-600" : "text-slate-800"
                        }`}>
                          {item.title}
                        </p>
                        <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          {formatAdminDateTime(item.time)}
                        </span>
                      </div>
                      <p className={`text-[11px] font-semibold leading-5 ${
                        isDanger ? "text-red-600" : "text-slate-500"
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {shouldShowReviews && (
            <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Đánh giá sau chuyến
              </h3>

              <div className="space-y-3">
                {orderReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {review.reviewer?.name || "Người đánh giá"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          Đánh giá cho {review.targetUser?.name || "người nhận đánh giá"}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-3.5 h-3.5 ${
                              index < review.rating
                                ? "text-amber-500 fill-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        “{review.comment}”
                      </p>
                    )}

                    <p className="text-[10px] font-bold text-slate-400">
                      {new Date(review.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClosePhoto}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/90 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-primary-400">
                  <Camera className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold truncate max-w-md">{selectedPhoto.caption}</h3>
                  <p className="text-[11px] text-slate-400">{selectedPhoto.timestamp} • {selectedPhoto.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoZoom(photoZoom === 1 ? 1.5 : 1)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Thu phóng ảnh"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Xoay ảnh 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePhoto(selectedPhoto)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Tải ảnh gốc"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClosePhoto}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 bg-black/60 overflow-hidden flex items-center justify-center p-4 min-h-[360px]">
              <div 
                className="transition-transform duration-300 ease-out max-h-[62vh] max-w-full flex items-center justify-center"
                style={{
                  transform: `scale(${photoZoom}) rotate(${photoRotation}deg)`,
                }}
              >
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption}
                  className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            </div>

            {/* Bottom Meta Bar */}
            <div className="p-4 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <MapPin className="w-3.5 h-3.5" /> GPS: {selectedPhoto.gps}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">Thiết bị: Samsung Galaxy Tab Active 4 Pro (TXEPRO Driver App)</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">CHỨNG TỪ SỐ e-POD # {selectedPhoto.id.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Printable A4 Modal */}
      {isPrintModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsPrintModalOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-3xl p-8 shadow-2xl text-slate-900 my-8 space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            id="printable-epod-container"
          >
            {/* Modal Controls (Hidden when printed) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Xem & In Biên Bản Giao Nhận e-POD</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Tài Liệu / Lưu PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet (A4 format) */}
            <div className="space-y-6 text-slate-800 text-xs p-2 font-sans" id="printable-epod-sheet">
              {/* Document Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="text-[10px] font-bold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
                <div className="py-2">
                  <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    BIÊN BẢN GIAO NHẬN & NGHIỆM THU ĐIỆN TỬ (e-POD)
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Mã chứng chỉ: <span className="font-bold text-slate-900">{epodDetail.certificateCode}</span> • Mã vận đơn: <span className="font-bold text-slate-900">{order.orderCode}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Bảo chứng ký quỹ MB Bank: <span className="font-bold text-blue-700 font-mono">{escrowTxCode}</span>
                  </p>
                </div>
              </div>

              {/* Parties 3-Column Info */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">BÊN GỬI HÀNG (SHIPPER)</p>
                  <p className="font-bold text-slate-900">{order.shipperId.name}</p>
                  <p className="text-slate-600">{order.shipperId.phone}</p>
                  <p className="text-slate-500 text-[10px] mt-1">{order.pickup.address}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">BÊN VẬN CHUYỂN (DRIVER)</p>
                  <p className="font-bold text-slate-900">{order.driverId?.name || "Chưa chỉ định"}</p>
                  <p className="text-slate-600">{order.driverId?.phone || "---"}</p>
                  <p className="text-slate-500 text-[10px] mt-1">Đội xe công nghệ TXEPRO</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">BÊN NHẬN HÀNG (CONSIGNEE)</p>
                  <p className="font-bold text-slate-900">{epodDetail.receiverName || "Chưa ghi nhận người nhận"}</p>
                  <p className="text-slate-600">{epodDetail.receiverPhone || "---"}</p>
                  <p className="text-slate-500 text-[10px] mt-1">{order.dropoff.address}</p>
                </div>
              </div>

              {/* Cargo Table */}
              <table className="w-full border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-left">
                    <th className="border border-slate-200 p-2">Tên Hàng Hóa</th>
                    <th className="border border-slate-200 p-2">Loại Hàng</th>
                    <th className="border border-slate-200 p-2">Khối Lượng</th>
                    <th className="border border-slate-200 p-2">Cước Phí Ký Quỹ</th>
                    <th className="border border-slate-200 p-2">Tình Trạng Nghiệm Thu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2 font-bold">{order.title}</td>
                    <td className="border border-slate-200 p-2">{order.cargoType || "Hàng thông thường"}</td>
                    <td className="border border-slate-200 p-2">{order.weight ? `${order.weight.toLocaleString()} kg` : "---"}</td>
                    <td className="border border-slate-200 p-2 font-bold text-blue-700">{totalPrice > 0 ? `${totalPrice.toLocaleString("vi-VN")} ₫` : "---"}</td>
                    <td className="border border-slate-200 p-2 text-emerald-700 font-bold">
                      {epodDetail.status === "verified" ? "Đã nghiệm thu hợp lệ" : epodDetail.status === "awaiting_receiver" ? "Chờ kiểm duyệt" : "Đang vận chuyển"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Photo thumbnails in print */}
              <div className="space-y-2">
                <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">Ảnh chụp hiện trường giao nhận tại điểm trả:</p>
                {epodDetail.dropoffPhotos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {epodDetail.dropoffPhotos.map((p) => (
                      <div key={p.id} className="border border-slate-200 rounded-lg p-1.5 space-y-1 text-center">
                        <img src={p.url} alt={p.caption} className="w-full h-20 object-cover rounded" />
                        <p className="text-[9px] font-bold text-slate-800 truncate">{p.caption}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-400 text-xs italic">
                    Chưa có ảnh chụp nghiệm thu đính kèm biên bản
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN BÊN GIAO (TÀI XẾ)</p>
                  <div>
                    <p className="font-bold text-slate-800">{order.driverId?.name || "Chưa chỉ định tài xế"}</p>
                    <p className="text-[10px] text-slate-400">
                      {order.driverId ? "Đã xác nhận bàn giao" : "Chưa có tài xế nhận đơn"}
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN BÊN NHẬN (THỦ KHO / CHỦ HÀNG)</p>
                  <div className="h-14 flex items-center justify-center">
                    {epodDetail.signatureUrl ? (
                      <img src={epodDetail.signatureUrl} alt="Chữ ký người nhận" className="max-h-12 object-contain" />
                    ) : (
                      <div className="text-slate-400 text-xs italic">(Chưa có chữ ký điện tử)</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{epodDetail.receiverName || "Chưa cập nhật người nhận"}</p>
                    <p className="text-[10px] text-slate-400">
                      {epodDetail.deliveredTime ? `Thời gian: ${epodDetail.deliveredTime}` : "Chưa hoàn tất giao hàng"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <p>Chứng từ số hóa được ký nhận qua TXEPRO TMS. Mã băm: {epodDetail.sha256Hash || "---"}</p>
                <p className="font-bold text-slate-600">HỆ THỐNG ĐIỀU VẬN LOGISTICS TXEPRO</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal 1: Cập Nhật Trạng Thái Vận Đơn */}
      {isStatusModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chuyển Trạng Thái Vận Đơn</h3>
                  <p className="text-[11px] text-slate-400">Can thiệp vòng đời chu trình logistics</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsStatusModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Chọn trạng thái mới</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as Order["status"])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="searching_driver">Tìm tài xế (Searching)</option>
                  <option value="waiting_driver_acceptance">Chờ tài xế xác nhận</option>
                  <option value="accepted">Tài xế đã nhận đơn (Accepted)</option>
                  <option value="in_progress">Đang vận chuyển (In Progress)</option>
                  <option value="delivered">Đã giao hàng (Delivered - Chờ duyệt)</option>
                  <option value="completed">Đã hoàn thành (Completed)</option>
                  <option value="cancelled">Đã hủy đơn (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lý do can thiệp (Ghi log kiểm toán)</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ví dụ: Đã nhận được cuộc gọi xác nhận hoàn thành từ khách hàng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Lưu ý điều phối viên
                </p>
                <p>Hành động này sẽ cập nhật toàn trình trạng thái trên ứng dụng của cả Tài xế và Chủ hàng.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Xác nhận chuyển trạng thái
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Điều Phối / Chỉ Định Lại Tài Xế */}
      {isReassignModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsReassignModalOpen(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Điều Phối & Chỉ Định Tài Xế</h3>
                  <p className="text-[11px] text-slate-400">Thay thế tài xế hoặc mở lại tìm kiếm trên sàn</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsReassignModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReassignMode("assign")}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    reassignMode === "assign" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Chỉ định tài xế trực tiếp
                </button>
                <button
                  type="button"
                  onClick={() => setReassignMode("reopen")}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    reassignMode === "reopen" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mở lại tìm kiếm trên sàn
                </button>
              </div>

              {reassignMode === "assign" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Họ và tên tài xế mới <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn Hùng"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={newDriverPhone}
                        onChange={(e) => setNewDriverPhone(e.target.value)}
                        placeholder="09xx xxx xxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Biển số / Loại xe</label>
                      <input
                        type="text"
                        value={newDriverVehicle}
                        onChange={(e) => setNewDriverVehicle(e.target.value)}
                        placeholder="51D-987.65 (Xe 15 tấn)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                  <p className="font-bold">Mở lại tìm kiếm trên sàn toàn mạng lưới</p>
                  <p className="text-[11px] leading-relaxed">
                    Vận đơn sẽ được hủy ghép nối với tài xế hiện tại và đưa trở lại sàn tìm kiếm để các tài xế khác có thể nhận đơn.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lý do điều phối lại</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Ví dụ: Tài xế báo sự cố nổ lốp, đổi sang xe 15 tấn dự phòng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReassignDriver}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Xác nhận điều phối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Xử Lý Ký Quỹ & Bảo Chứng MB Bank */}
      {isEscrowModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsEscrowModalOpen(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nghiệp Vụ Ký Quỹ MB Bank</h3>
                  <p className="text-[11px] text-slate-400">Can thiệp bảo chứng và dòng tiền giải ngân</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEscrowModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Mã giao dịch ký quỹ:</span>
                  <span className="font-mono font-bold text-slate-900">{escrowTxCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Tổng tiền bảo chứng:</span>
                  <span className="font-bold text-slate-900">{totalPrice ? `${totalPrice.toLocaleString("vi-VN")} ₫` : "---"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Thực nhận tài xế (95%):</span>
                  <span className="font-bold text-emerald-600">{totalPrice ? `${driverPayout.toLocaleString("vi-VN")} ₫` : "---"}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Chọn lệnh can thiệp dòng tiền</label>
                <div className="space-y-2">
                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    escrowActionType === "disburse" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <input
                      type="radio"
                      name="escrowAction"
                      checked={escrowActionType === "disburse"}
                      onChange={() => setEscrowActionType("disburse")}
                    />
                    <div>
                      <p className="font-bold">Giải ngân ngay cho Tài xế (Disburse)</p>
                      <p className="text-[11px] opacity-80">Phát lệnh chuyển 95% cước phí vào tài khoản MB Bank của tài xế</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    escrowActionType === "freeze" ? "bg-amber-50 border-amber-500 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <input
                      type="radio"
                      name="escrowAction"
                      checked={escrowActionType === "freeze"}
                      onChange={() => setEscrowActionType("freeze")}
                    />
                    <div>
                      <p className="font-bold">Đóng băng tranh chấp (Freeze Escrow)</p>
                      <p className="text-[11px] opacity-80">Khóa tiền tạm thời tại MB Bank, chờ biên bản giám định hư hỏng</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    escrowActionType === "refund" ? "bg-rose-50 border-rose-500 text-rose-900" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <input
                      type="radio"
                      name="escrowAction"
                      checked={escrowActionType === "refund"}
                      onChange={() => setEscrowActionType("refund")}
                    />
                    <div>
                      <p className="font-bold">Hoàn tiền 100% cho Chủ hàng (Refund)</p>
                      <p className="text-[11px] opacity-80">Hoàn lại tiền cước bảo chứng vào ví/tài khoản của chủ hàng</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Ghi chú xác nhận nghiệp vụ</label>
                <input
                  type="text"
                  value={escrowActionReason}
                  onChange={(e) => setEscrowActionReason(e.target.value)}
                  placeholder="Ví dụ: Phê duyệt theo biên bản e-POD số 8899..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEscrowModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmEscrowAction}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Xác nhận thực thi lệnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Ghi Chú Nội Bộ Quản Trị Viên (Internal Notes) */}
      {isNotesModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsNotesModalOpen(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhật Ký & Ghi Chú Nội Bộ ({adminNotes.length})</h3>
                  <p className="text-[11px] text-slate-400">Chỉ hiển thị cho Quản trị viên & Điều phối viên</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsNotesModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input new note */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Thêm ghi chú điều phối mới:</label>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold text-[10px]"
                >
                  <option value="info">Thông tin chung</option>
                  <option value="warning">Cảnh báo / Rủi ro</option>
                  <option value="action">Hành động can thiệp</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Nhập nội dung ghi chú giám sát tuyến vận tải..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddAdminNote}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Lưu ghi chú</span>
                </button>
              </div>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[180px]">
              {adminNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 text-slate-400">
                  <StickyNote className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Chưa có ghi chú nội bộ</p>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Vận đơn này hiện chưa có nhật ký can thiệp. Bạn có thể thêm ghi chú điều phối đầu tiên ở khung phía trên.
                  </p>
                </div>
              ) : (
                adminNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{note.author} <span className="text-[10px] text-slate-400">({note.role})</span></span>
                      <span className="text-[10px] text-slate-400">{formatAdminDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Hủy Vận Đơn Khẩn Cấp */}
      {isCancelModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsCancelModalOpen(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hủy Vận Đơn Khẩn Cấp</h3>
                  <p className="text-[11px] text-slate-400">Dành cho trường hợp bất khả kháng hoặc tranh chấp</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCancelModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lý do hủy đơn chính</label>
                <select
                  value={cancelReasonChoice}
                  onChange={(e) => setCancelReasonChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Xe hư hỏng / tai nạn kỹ thuật">Xe hư hỏng / tai nạn kỹ thuật</option>
                  <option value="Tranh chấp giá cước hoặc phát sinh chi phí bốc dỡ">Tranh chấp giá cước hoặc chi phí phát sinh</option>
                  <option value="Hàng hóa sai quy cách / không đảm bảo an toàn">Hàng hóa sai quy cách / không an toàn</option>
                  <option value="Chủ hàng yêu cầu hủy chuyến">Chủ hàng yêu cầu hủy chuyến</option>
                  <option value="Tài xế không liên hệ được / quá giờ hẹn">Tài xế không liên hệ được</option>
                  <option value="Thời tiết bất khả kháng (bão lũ, ngập lụt)">Thời tiết bất khả kháng (bão lũ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Chi tiết bổ sung (tùy chọn)</label>
                <textarea
                  rows={3}
                  value={cancelReasonDetail}
                  onChange={(e) => setCancelReasonDetail(e.target.value)}
                  placeholder="Ghi rõ chi tiết biên bản hiện trường nếu có..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo hủy đơn
                </p>
                <p>Thao tác này sẽ chấm dứt hành trình của vận đơn và chuyển lệnh hoàn cước ký quỹ MB Bank về tài khoản chủ hàng.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergencyCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Xác nhận hủy vận đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
