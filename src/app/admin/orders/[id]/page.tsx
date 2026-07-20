"use client";

import { use } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { 
  ArrowLeft, MapPin, Phone, Mail, Clock, CheckCircle, 
  AlertTriangle, Truck, Info, Shield, User, Loader, DollarSign, Calendar, Star
} from "lucide-react";

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
  completion?: {
    acceptNote?: string | null;
    estimatedPickupTime?: string | null;
    pickupArrivedAt?: string | null;
    deliveredAt?: string | null;
    shipperConfirmed?: boolean;
    shipperNote?: string | null;
    driverUnselectedAt?: string | null;
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

const MOCK_ORDERS_DETAIL: Record<string, Order> = {
  "o-mock-1": {
    _id: "o-mock-1",
    orderCode: "ORD-20260709-001",
    title: "Vận chuyển 20 tấn hạt nhựa PP",
    status: "in_progress",
    cargoType: "Hạt nhựa công nghiệp",
    weight: 20000,
    volume: 35,
    paymentMethod: "Ví điện tử",
    offerPrice: 4500000,
    pickup: { address: "KCN Cát Lái, Quận 2, TP.HCM" },
    dropoff: { address: "KCN Sóng Thần, Bình Dương" },
    shipperId: { name: "Trần Thị Hằng", phone: "0912345678", email: "hang@gmail.com" },
    driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
    createdAt: "2026-07-09T08:30:00Z"
  },
  "o-mock-2": {
    _id: "o-mock-2",
    orderCode: "ORD-20260709-002",
    title: "Vận chuyển thiết bị gia dụng nhà thông minh",
    status: "delivered",
    cargoType: "Thiết bị điện tử",
    weight: 1500,
    volume: 8,
    paymentMethod: "Ví điện tử",
    offerPrice: 3200000,
    pickup: { address: "Cảng Cát Lái, Quận 2, TP.HCM" },
    dropoff: { address: "Quận Hoàn Kiếm, Hà Nội" },
    shipperId: { name: "Lê Văn Hoàng", phone: "0905111222", email: "hoang.le@outlook.com" },
    driverId: { name: "Phạm Minh Đức", phone: "0977888999", email: "duc.pham@gmail.com" },
    createdAt: "2026-07-09T06:15:00Z"
  },
  "o-mock-3": {
    _id: "o-mock-3",
    orderCode: "ORD-20260708-005",
    title: "Giao nhận 50 thùng hoa quả tươi nhập khẩu",
    status: "searching_driver",
    cargoType: "Thực phẩm lạnh",
    weight: 800,
    volume: 3,
    paymentMethod: "Tiền mặt",
    offerPrice: 900000,
    pickup: { address: "Chợ đầu mối Thủ Đức, TP.HCM" },
    dropoff: { address: "Quận 1, TP.HCM" },
    shipperId: { name: "Nguyễn Minh Thu", phone: "0933444555", email: "thu.nguyen@gmail.com" },
    createdAt: "2026-07-08T14:00:00Z"
  },
  "o-mock-4": {
    _id: "o-mock-4",
    orderCode: "ORD-20260708-004",
    title: "Vận chuyển sắt thép công trình xây dựng",
    status: "accepted",
    cargoType: "Sắt thép xây dựng",
    weight: 15000,
    volume: 12,
    paymentMethod: "Ví điện tử",
    offerPrice: 8500000,
    pickup: { address: "Nhà máy thép Hòa Phát, Dung Quất" },
    dropoff: { address: "Quận Nam Từ Liêm, Hà Nội" },
    shipperId: { name: "Công ty Cổ phần Thép Việt", phone: "0283844999", email: "info@thepviet.com" },
    driverId: { name: "Vũ Quốc Khánh", phone: "0966777888", email: "khanh.vu@gmail.com" },
    createdAt: "2026-07-08T09:45:00Z"
  },
  "o-mock-5": {
    _id: "o-mock-5",
    orderCode: "ORD-20260707-010",
    title: "Chuyển kho dệt may từ Bình Dương đi Vũng Tàu",
    status: "cancelled",
    cargoType: "Hàng may mặc",
    weight: 5000,
    volume: 18,
    paymentMethod: "Ví điện tử",
    offerPrice: 5000000,
    pickup: { address: "KCN VSIP 1, Thuận An, Bình Dương" },
    dropoff: { address: "Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu" },
    shipperId: { name: "Trương Công Định", phone: "0944555666", email: "dinh.truong@textile.vn" },
    createdAt: "2026-07-07T16:20:00Z"
  }
};

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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Load order data and initialize Google Map route
  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        if (id.startsWith("o-mock-")) {
          setOrder(MOCK_ORDERS_DETAIL[id] || null);
          setIsOffline(true);
          setLoading(false);
          return;
        }

        const res = await fetchWithAuth(`${API_BASE}/admin/users/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data.order) {
            setOrder({
              ...data.data.order,
              reviews: data.data.reviews || [],
            });
            setIsOffline(false);
          } else {
            // Check mock values as fallback
            setOrder(MOCK_ORDERS_DETAIL[id] || null);
            setIsOffline(true);
          }
        } else {
          setOrder(MOCK_ORDERS_DETAIL[id] || null);
          setIsOffline(true);
        }
      } catch (err) {
        console.warn("Backend error, displaying mock details", err);
        setOrder(MOCK_ORDERS_DETAIL[id] || null);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

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
              <span className="font-extrabold text-primary-600 text-sm bg-primary-50 px-2 py-0.5 rounded-md">{order.orderCode}</span>
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
    </div>
  );
}
