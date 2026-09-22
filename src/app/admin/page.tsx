"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import {
  Users, Truck, Package, ShoppingCart, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Loader,
  Bell, ShieldAlert, AlertTriangle, Headset, UserPlus, CheckCheck,
  BarChart3, Activity, Route, Compass, Calendar, Layers, MapPin,
  Maximize2, Eye, Navigation, Globe, RefreshCw
} from "lucide-react";

interface OverviewMetrics {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  activeDrivers: number;
  totalOrders: number;
  totalViolations: number;
  pendingKyc: number;
  userTrend?: string;
  driverTrend?: string;
  shipperTrend?: string;
  orderTrend?: string;
  userGrowthUp?: boolean;
  driverGrowthUp?: boolean;
  shipperGrowthUp?: boolean;
  orderGrowthUp?: boolean;
}

interface StatusBreakdownItem {
  count: number;
  percent: number;
  label: string;
}

interface StatusBreakdown {
  completed: StatusBreakdownItem;
  in_progress: StatusBreakdownItem;
  searching_driver: StatusBreakdownItem;
  cancelled: StatusBreakdownItem;
}

interface CorridorItem {
  route: string;
  count: number;
  percent: number;
  color: string;
  text: string;
  hex?: string;
  fromCity?: string;
  toCity?: string;
  isIntra?: boolean;
  fromCoords?: { lat: number; lng: number } | null;
  toCoords?: { lat: number; lng: number } | null;
}

interface MapMarkerPoint {
  id: string;
  type: "driver" | "order";
  subType?: "pickup" | "dropoff";
  orderId?: string;
  orderCode?: string;
  driverId?: string;
  name: string;
  title?: string;
  status?: string;
  coords: { lat: number; lng: number };
  address?: string;
  details?: string;
  route?: string;
  amount?: number;
  vehicle?: string;
  phone?: string;
  createdAt?: string;
}

interface MapData {
  corridors: CorridorItem[];
  markers: MapMarkerPoint[];
  summary?: {
    totalActiveDrivers: number;
    totalTrackedOrders: number;
    hotCorridorsCount: number;
  };
}

interface RecentOrder {
  _id: string;
  orderCode: string;
  title: string;
  status: string;
  offerPrice?: number;
  budget?: number | { min?: number; max?: number } | null;
  financialSnapshot?: { orderAmount?: number } | null;
  pickup?: { address?: string; lat?: number; lng?: number };
  dropoff?: { address?: string; lat?: number; lng?: number };
  createdAt: string;
}

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, any>;
}

interface TrendDataPoint {
  label: string;
  fullDate: string;
  orders: number;
  revenue: number;
  completed: number;
}

interface TrendsData {
  "7days": TrendDataPoint[];
  "30days": TrendDataPoint[];
  months: TrendDataPoint[];
  revenueGrowthRate?: number;
  orderGrowthRate?: number;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeAgo = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  searching_driver: { label: "Tìm tài xế", color: "text-blue-600 bg-blue-50", icon: Loader },
  waiting_driver: { label: "Đang chờ tài xế", color: "text-amber-600 bg-amber-50", icon: Clock },
  waiting_driver_acceptance: { label: "Chờ tài xế nhận", color: "text-purple-600 bg-purple-50", icon: Clock },
  accepted: { label: "Đã nhận đơn", color: "text-indigo-600 bg-indigo-50", icon: CheckCircle },
  rejected: { label: "Đã từ chối", color: "text-rose-600 bg-rose-50", icon: XCircle },
  in_progress: { label: "Đang vận chuyển", color: "text-primary-600 bg-primary-50", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700 bg-emerald-100", icon: CheckCircle },
  cancelled: { label: "Đã hủy đơn", color: "text-red-600 bg-red-50", icon: XCircle },
};

const formatVND = (val: number) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ ₫`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(0)} tr ₫`;
  return `${val.toLocaleString("vi-VN")} ₫`;
};

const getOrderDisplayPrice = (order: RecentOrder) => {
  if (typeof order.offerPrice === "number" && order.offerPrice > 0) return order.offerPrice;
  if (order.financialSnapshot?.orderAmount && order.financialSnapshot.orderAmount > 0) {
    return order.financialSnapshot.orderAmount;
  }
  if (typeof order.budget === "number" && order.budget > 0) return order.budget;
  if (typeof order.budget === "object" && order.budget) {
    if (order.budget.max && order.budget.max > 0) return order.budget.max;
    if (order.budget.min && order.budget.min > 0) return order.budget.min;
  }
  return 0;
};

// Hub coordinates for Vector Logistics schematic map (viewBox 0 0 460 520)
const VIETNAM_GIS_HUBS: Record<string, { x: number; y: number; label: string; region: string }> = {
  "Hà Nội": { x: 210, y: 75, label: "Hà Nội", region: "Bắc Bộ" },
  "Hải Phòng": { x: 265, y: 90, label: "Hải Phòng", region: "Bắc Bộ" },
  "Huế": { x: 255, y: 200, label: "Huế", region: "Trung Bộ" },
  "Đà Nẵng": { x: 275, y: 225, label: "Đà Nẵng", region: "Trung Bộ" },
  "Quảng Ngãi": { x: 290, y: 265, label: "Quảng Ngãi", region: "Trung Bộ" },
  "Gia Lai": { x: 275, y: 305, label: "Gia Lai", region: "Tây Nguyên" },
  "Lâm Đồng": { x: 265, y: 350, label: "Lâm Đồng", region: "Tây Nguyên" },
  "Bình Dương": { x: 230, y: 390, label: "Bình Dương", region: "Đông Nam Bộ" },
  "Đồng Nai": { x: 255, y: 395, label: "Đồng Nai", region: "Đông Nam Bộ" },
  "Hồ Chí Minh": { x: 235, y: 415, label: "TP. Hồ Chí Minh", region: "Đông Nam Bộ" },
  "Cần Thơ": { x: 195, y: 455, label: "Cần Thơ", region: "ĐBSCL" },
};

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

function AdminDashboardContent() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null);
  const [topCorridors, setTopCorridors] = useState<CorridorItem[]>([]);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Interactive Visual Charts State
  const [trendTimeframe, setTrendTimeframe] = useState<"7days" | "30days" | "months">("7days");
  const [trendMetric, setTrendMetric] = useState<"orders" | "revenue">("orders");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<"status" | "roles">("status");

  // Interactive Live Map State
  const [mapMode, setMapMode] = useState<"google" | "vector">("google");
  const [mapReady, setMapReady] = useState(false);
  const [mapFilter, setMapFilter] = useState<"all" | "drivers" | "orders" | "corridors">("all");
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorItem | null>(null);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const fetchOverview = async () => {
    setLoading(true);

    try {
      const [overviewRes, notifRes] = await Promise.allSettled([
        fetchWithAuth(`${API_BASE}/admin/users/overview`),
        fetchWithAuth(`${API_BASE}/admin/users/notifications/feed`)
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
        let resJson = await overviewRes.value.json();
        let data = resJson.data || {};

        // Fallback: If cloud response is missing rich analytics (trends, corridors, map markers)
        // because cloud runs older backend code, fetch from local backend on port 5000
        if ((!data.trends || !data.topCorridors || data.topCorridors.length === 0 || !data.mapData) && typeof window !== "undefined") {
          try {
            const localRes = await fetchWithAuth("http://localhost:5000/api/v1/admin/users/overview");
            if (localRes.ok) {
              const localJson = await localRes.json();
              if (localJson.data && (localJson.data.trends || localJson.data.topCorridors)) {
                data = localJson.data;
              }
            }
          } catch {
            // keep existing data
          }
        }

        setMetrics(data.metrics || null);
        setStatusBreakdown(data.statusBreakdown || null);
        setTopCorridors(data.topCorridors || []);
        setTrends(data.trends || null);
        setRecentOrders(data.recentOrders || []);
        setMapData(data.mapData || null);
        setIsOffline(false);
      } else {
        // If overview request failed (e.g. cloud 401 or offline), try local backend directly
        try {
          const localRes = await fetchWithAuth("http://localhost:5000/api/v1/admin/users/overview");
          if (localRes.ok) {
            const localJson = await localRes.json();
            const data = localJson.data || {};
            setMetrics(data.metrics || null);
            setStatusBreakdown(data.statusBreakdown || null);
            setTopCorridors(data.topCorridors || []);
            setTrends(data.trends || null);
            setRecentOrders(data.recentOrders || []);
            setMapData(data.mapData || null);
            setIsOffline(false);
          } else {
            setIsOffline(true);
          }
        } catch {
          setIsOffline(true);
        }
      }

      if (notifRes.status === "fulfilled" && notifRes.value.ok) {
        const nData = await notifRes.value.json();
        const list: AdminNotificationItem[] = nData.data?.notifications || [];
        setNotifications(list);
        setUnreadCount(nData.data?.unreadCount ?? list.filter(n => !n.read).length);
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ dữ liệu quản trị thực tế:", err);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Robust Google Maps initialization
  const initGoogleMap = () => {
    if (typeof window === "undefined") return false;
    const google = (window as any).google;
    const container = mapContainerRef.current || document.getElementById("admin-live-map");
    if (!google || !google.maps || !container) return false;

    if (mapRef.current) {
      google.maps.event.trigger(mapRef.current, "resize");
      return true;
    }

    try {
      const map = new google.maps.Map(container, {
        center: { lat: 16.054407, lng: 108.202164 }, // Central Vietnam (Da Nang)
        zoom: 6,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
      setMapReady(true);
      return true;
    } catch (err) {
      console.warn("Lỗi tạo Google Maps instance:", err);
      return false;
    }
  };

  // Load Google Maps Script and initialize whenever loading completes or mapMode is google
  useEffect(() => {
    if (typeof window === "undefined" || loading) return;

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDq4-qHUd9qYi5go9mI3OpoLEgpMhzgGU&libraries=places,geometry";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleMap();
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).google && (window as any).google.maps) {
        initGoogleMap();
      } else {
        existingScript.addEventListener("load", () => {
          initGoogleMap();
        });
      }
    }

    // Interval retry to guarantee map initializes once DOM element is attached
    const timer = setInterval(() => {
      if (initGoogleMap() || mapRef.current) {
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, [loading, mapMode]);

  // Render Real Markers and Corridors on Google Maps
  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google || !map || !mapReady || !mapData) return;

    // 1. Clear existing markers and polylines
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // 2. Draw Transport Corridors (Polylines)
    if (mapFilter === "all" || mapFilter === "corridors") {
      const corridorsToDraw = mapData.corridors || topCorridors || [];
      corridorsToDraw.forEach((c) => {
        if (!c.fromCoords || !c.toCoords || c.isIntra) return;

        const isSelected = selectedCorridor?.route === c.route;
        const strokeColor = isSelected ? "#ef4444" : (c.hex || "#3b82f6");
        const strokeWeight = isSelected ? 5 : Math.max(3, Math.min(6, Math.round(c.percent / 5) + 2));
        const strokeOpacity = isSelected ? 0.95 : 0.75;

        const polyline = new google.maps.Polyline({
          path: [c.fromCoords, c.toCoords],
          geodesic: true,
          strokeColor,
          strokeOpacity,
          strokeWeight,
          map,
        });

        polyline.addListener("click", (e: any) => {
          setSelectedCorridor(c);
          infoWindowRef.current?.setContent(`
            <div style="font-family: sans-serif; padding: 6px; min-width: 180px;">
              <span style="font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase;">Hành lang vận tải</span>
              <h4 style="margin: 3px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${c.route}</h4>
              <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #334155;">
                Lưu lượng: <b style="color: #0284c7;">${c.count} chuyến</b> (${c.percent}% toàn sàn)
              </p>
            </div>
          `);
          infoWindowRef.current?.setPosition(e.latLng || c.fromCoords);
          infoWindowRef.current?.open(map);
        });

        polylinesRef.current.push(polyline);
        bounds.extend(c.fromCoords);
        bounds.extend(c.toCoords);
        hasPoints = true;
      });
    }

    // 3. Draw Real Database Markers (Orders & Drivers)
    const markersToDraw = (mapData.markers || []).filter((m) => {
      if (mapFilter === "all") return true;
      if (mapFilter === "drivers") return m.type === "driver";
      if (mapFilter === "orders") return m.type === "order";
      return true;
    });

    markersToDraw.forEach((item) => {
      if (!item.coords?.lat || !item.coords?.lng) return;

      const isDriver = item.type === "driver";
      const markerColor = isDriver ? "#10b981" : "#2563eb";
      const markerLabel = isDriver ? "🚚" : "📦";

      const marker = new google.maps.Marker({
        position: item.coords,
        map,
        title: item.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
          scale: isDriver ? 14 : 12,
        },
        label: {
          text: markerLabel,
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
        },
      });

      marker.addListener("click", () => {
        const popupHtml = isDriver ? `
          <div style="font-family: sans-serif; padding: 6px; min-width: 200px;">
            <span style="font-size: 9px; font-weight: 800; color: #16a34a; text-transform: uppercase; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">Tài xế trực tuyến</span>
            <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${item.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #64748b;">${item.address || ''}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #334155;">${item.details || ''}</p>
            ${item.phone ? `<p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #0284c7;">SĐT: ${item.phone}</p>` : ''}
            <div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
              <a href="/admin/orders" style="font-size: 11px; font-weight: 700; color: #2563eb; text-decoration: none;">Xem danh sách chuyến xe →</a>
            </div>
          </div>
        ` : `
          <div style="font-family: sans-serif; padding: 6px; min-width: 220px;">
            <span style="font-size: 9px; font-weight: 800; color: #2563eb; text-transform: uppercase; background: #dbeafe; padding: 2px 6px; border-radius: 4px;">Vận đơn: ${item.orderCode || ''}</span>
            <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${item.title || item.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #64748b;">Điểm lấy: ${item.address || ''}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #334155;">${item.details || ''}</p>
            ${item.orderId ? `
              <div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                <a href="/admin/orders/${item.orderId}" style="font-size: 11px; font-weight: 700; color: #2563eb; text-decoration: none;">Mở chi tiết vận đơn này →</a>
              </div>
            ` : ''}
          </div>
        `;

        infoWindowRef.current?.setContent(popupHtml);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(item.coords);
      hasPoints = true;
    });

    if (hasPoints && !selectedCorridor) {
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  }, [mapReady, mapData, mapFilter, selectedCorridor, topCorridors, mapMode]);

  // Handle focus on a specific corridor from the card
  const handleSelectCorridor = (corridor: CorridorItem) => {
    setSelectedCorridor(corridor);
    setMapFilter("corridors");

    if (mapMode === "google") {
      const google = (window as any).google;
      const map = mapRef.current;
      if (!google || !map) return;

      if (corridor.fromCoords && corridor.toCoords && !corridor.isIntra) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(corridor.fromCoords);
        bounds.extend(corridor.toCoords);
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        infoWindowRef.current?.setContent(`
          <div style="font-family: sans-serif; padding: 6px; min-width: 180px;">
            <span style="font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase;">Hành lang vận tải</span>
            <h4 style="margin: 3px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${corridor.route}</h4>
            <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #334155;">
              Lưu lượng: <b style="color: #0284c7;">${corridor.count} chuyến</b> (${corridor.percent}% toàn sàn)
            </p>
          </div>
        `);
        infoWindowRef.current?.setPosition(corridor.fromCoords);
        infoWindowRef.current?.open(map);
      } else if (corridor.fromCoords) {
        map.setCenter(corridor.fromCoords);
        map.setZoom(11);
      }
    }
  };

  const handleResetMapFocus = () => {
    setSelectedCorridor(null);
    setMapFilter("all");
    const map = mapRef.current;
    if (map) {
      map.setCenter({ lat: 16.054407, lng: 108.202164 });
      map.setZoom(6);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetchWithAuth(`${API_BASE}/admin/users/notifications/read-all`, { method: "PATCH" });
    } catch (e) {
      // Best-effort
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc", {
      title: "Thông báo hệ thống",
    });
  };

  const getNotificationLink = (notif: AdminNotificationItem) => {
    let link = notif.link;
    if (!link || link === "/admin/support") {
      if (notif.type === "chat" || notif.meta?.chatId) {
        const chatId = notif.meta?.chatId || (notif as any).chatId;
        const senderId = notif.meta?.senderId || (notif as any).senderId;
        link = chatId
          ? `/admin/support?tab=chats&chatId=${chatId}${senderId ? `&userId=${senderId}` : ""}`
          : (senderId ? `/admin/support?tab=chats&userId=${senderId}` : `/admin/support?tab=chats`);
      } else if (notif.type === "support_ticket" && notif.meta?.ticketId) {
        link = `/admin/support?tab=tickets&ticketId=${notif.meta.ticketId}`;
      }
    }
    return link || "/admin/notifications";
  };

  const handleNotificationClick = async (notif: AdminNotificationItem) => {
    if (!notif.read && notif.id) {
      fetchWithAuth(`${API_BASE}/admin/users/notifications/${notif.id}/read`, { method: "PATCH" }).catch(() => null);
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };


  const statsCards = [
    {
      label: "Tổng Người Dùng",
      value: metrics?.totalUsers || 0,
      icon: Users,
      trend: metrics?.userTrend || "+0%",
      trendUp: metrics?.userGrowthUp !== false,
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      label: "Tổng Tài Xế",
      value: metrics?.totalDrivers || 0,
      icon: Truck,
      trend: `${metrics?.activeDrivers || 0} hoạt động`,
      trendUp: true,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      label: "Tổng Chủ Hàng",
      value: metrics?.totalShippers || 0,
      icon: ShoppingCart,
      trend: metrics?.shipperTrend || "+0%",
      trendUp: metrics?.shipperGrowthUp !== false,
      gradient: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50",
      iconColor: "text-violet-600"
    },
    {
      label: "Tổng Đơn Hàng",
      value: metrics?.totalOrders || 0,
      icon: Package,
      trend: metrics?.orderTrend || `${metrics?.totalViolations || 0} vi phạm`,
      trendUp: metrics?.orderGrowthUp !== false,
      gradient: "from-orange-500 to-red-500",
      bgLight: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  // Calculate role distribution percentages for donut chart
  const total = (metrics?.totalDrivers || 0) + (metrics?.totalShippers || 0);
  const driverPct = total > 0 ? Math.round(((metrics?.totalDrivers || 0) / total) * 100) : 50;
  const shipperPct = 100 - driverPct;

  // Visual Charts Trend Calculations from Real DB (Vietnam Timezone)
  const currentTrendData =
    trendTimeframe === "7days"
      ? (trends?.["7days"] || [])
      : trendTimeframe === "30days"
      ? (trends?.["30days"] || [])
      : (trends?.months || []);

  const totalPeriodOrders = currentTrendData.reduce((acc, cur) => acc + cur.orders, 0);
  const totalPeriodRevenue = currentTrendData.reduce((acc, cur) => acc + cur.revenue, 0);
  const avgPeriodOrders = Math.round(totalPeriodOrders / Math.max(1, currentTrendData.length));
  const totalCompleted = currentTrendData.reduce((acc, cur) => acc + cur.completed, 0);
  const completionRate = totalPeriodOrders > 0 ? ((totalCompleted / totalPeriodOrders) * 100).toFixed(1) : "0.0";
  const periodGrowthRate = trendMetric === "orders" ? (trends?.orderGrowthRate ?? 0) : (trends?.revenueGrowthRate ?? 0);

  const maxVal = Math.max(
    1,
    ...currentTrendData.map((d) => (trendMetric === "orders" ? d.orders : d.revenue))
  );

  const svgWidth = 640;
  const svgHeight = 210;
  const padL = 45;
  const padR = 25;
  const padT = 25;
  const padB = 35;
  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const points = currentTrendData.map((d, i) => {
    const val = trendMetric === "orders" ? d.orders : d.revenue;
    const x = padL + (i / Math.max(1, currentTrendData.length - 1)) * chartW;
    const y = padT + chartH - (maxVal > 0 ? (val / maxVal) * chartH : 0);
    return { ...d, val, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
    : "";

  const completedPct = statusBreakdown?.completed?.percent ?? 0;
  const inProgressPct = statusBreakdown?.in_progress?.percent ?? 0;
  const searchingPct = statusBreakdown?.searching_driver?.percent ?? 0;
  const cancelledPct = statusBreakdown?.cancelled?.percent ?? 0;

  const p1 = completedPct;
  const p2 = p1 + inProgressPct;
  const p3 = p2 + searchingPct;
  const donutGradient = (metrics?.totalOrders || 0) > 0
    ? `conic-gradient(#10b981 0% ${p1}%, #3b82f6 ${p1}% ${p2}%, #f59e0b ${p2}% ${p3}%, #ef4444 ${p3}% 100%)`
    : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <div className="space-y-6">
      {/* Offline / Error Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Không thể kết nối Backend để lấy dữ liệu thực tế. Vui lòng kiểm tra lại dịch vụ máy chủ hoặc phiên đăng nhập.</span>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
          >
            Tải lại dữ liệu
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group min-w-0"
          >
            <div className={`absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[60px] group-hover:opacity-10 transition-opacity pointer-events-none`} />
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 ${card.bgLight} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${card.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3 flex-shrink-0" /> : <ArrowDownRight className="w-3 h-3 flex-shrink-0" />}
                <span>{card.trend}</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">{card.value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1 truncate">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Left 2 cols, Right 1 col on XL screens */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main Column (2 cols on xl): Trends Chart, Live Google Map, Recent Orders, Quick Stats */}
        <div className="xl:col-span-2 space-y-6 min-w-0 max-w-full">
          {/* Visual Interactive Trend Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-5 sm:p-6 space-y-5">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Xu Hướng Vận Đơn & Cước Phí
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Biến động lưu lượng đơn hàng và giá trị vận chuyển toàn sàn theo thời gian thực (Múi giờ VN)
                  </p>
                </div>
              </div>

              {/* Controls: Metric Switcher & Timeframe */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Metric Selector (Orders / Revenue) */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTrendMetric("orders")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      trendMetric === "orders"
                        ? "bg-white text-primary-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Số đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric("revenue")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      trendMetric === "revenue"
                        ? "bg-white text-emerald-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Doanh số (GMV)
                  </button>
                </div>

                {/* Timeframe Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {[
                    { key: "7days", label: "7 ngày" },
                    { key: "30days", label: "30 ngày" },
                    { key: "months", label: "6 tháng" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTrendTimeframe(t.key as any);
                        setHoveredTrendIdx(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendTimeframe === t.key
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tổng kỳ này</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {trendMetric === "orders"
                    ? `${totalPeriodOrders.toLocaleString()} đơn`
                    : formatVND(totalPeriodRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Trung bình</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {trendMetric === "orders"
                    ? `${avgPeriodOrders} đơn/ngày`
                    : formatVND(Math.round(totalPeriodRevenue / Math.max(1, currentTrendData.length)))}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tỷ lệ hoàn thành</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {completionRate}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tăng trưởng</p>
                <p className={`text-base font-bold mt-0.5 flex items-center gap-1 ${periodGrowthRate >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {periodGrowthRate >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {periodGrowthRate >= 0 ? `+${periodGrowthRate}%` : `${periodGrowthRate}%`}
                </p>
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="relative pt-2">
              {currentTrendData.length === 0 ? (
                <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
                  <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                  Chưa có dữ liệu vận đơn trong khoảng thời gian này
                </div>
              ) : (
                <>
                  {/* Tooltip Card (when hovered) */}
                  {hoveredTrendIdx !== null && points[hoveredTrendIdx] && (
                    <div
                      className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[140px]"
                      style={{
                        left: `${(points[hoveredTrendIdx].x / svgWidth) * 100}%`,
                        top: `${(points[hoveredTrendIdx].y / svgHeight) * 100}%`,
                      }}
                    >
                      <p className="font-bold text-slate-200 text-[11px]">
                        {points[hoveredTrendIdx].fullDate}
                      </p>
                      <p className="text-sm font-bold text-white mt-1">
                        {trendMetric === "orders"
                          ? `${points[hoveredTrendIdx].orders} đơn đặt xe`
                          : formatVND(points[hoveredTrendIdx].revenue)}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        Đã hoàn tất: {points[hoveredTrendIdx].completed} đơn
                      </p>
                    </div>
                  )}

                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-56 overflow-visible select-none"
                  >
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = padT + chartH * (1 - ratio);
                      const labelVal = maxVal * ratio;
                      return (
                        <g key={idx}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={padL + chartW}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padL - 8}
                            y={y + 3.5}
                            textAnchor="end"
                            className="text-[10px] fill-slate-400 font-semibold"
                          >
                            {trendMetric === "orders"
                              ? Math.round(labelVal)
                              : formatVND(labelVal).replace(" ₫", "")}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area Polygon */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill={trendMetric === "orders" ? "url(#orderGrad)" : "url(#revenueGrad)"}
                      />
                    )}

                    {/* Bars beneath for subtle texture */}
                    {points.map((p, i) => {
                      const barWidth = Math.min(28, (chartW / points.length) * 0.45);
                      const isHovered = hoveredTrendIdx === i;
                      return (
                        <rect
                          key={i}
                          x={p.x - barWidth / 2}
                          y={p.y}
                          width={barWidth}
                          height={padT + chartH - p.y}
                          rx={4}
                          className={`transition-colors cursor-pointer ${
                            isHovered
                              ? trendMetric === "orders" ? "fill-primary-200" : "fill-emerald-200"
                              : "fill-slate-100/70 hover:fill-slate-200"
                          }`}
                          onMouseEnter={() => setHoveredTrendIdx(i)}
                          onMouseLeave={() => setHoveredTrendIdx(null)}
                        />
                      );
                    })}

                    {/* Main Trend Stroke Line */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke={trendMetric === "orders" ? "#2563eb" : "#10b981"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Points */}
                    {points.map((p, i) => {
                      const isHovered = hoveredTrendIdx === i;
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredTrendIdx(i)}
                          onMouseLeave={() => setHoveredTrendIdx(null)}
                        >
                          {/* Interactive Touch Target */}
                          <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                          {/* Visual Dot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke={trendMetric === "orders" ? "#2563eb" : "#10b981"}
                            strokeWidth={isHovered ? 3 : 2}
                            className="transition-all duration-150"
                          />
                        </g>
                      );
                    })}

                    {/* X-Axis Labels */}
                    {points.map((p, i) => (
                      <text
                        key={i}
                        x={p.x}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className={`text-[10px] transition-colors ${
                          hoveredTrendIdx === i
                            ? "fill-primary-600 font-bold"
                            : "fill-slate-400 font-semibold"
                        }`}
                      >
                        {p.label}
                      </text>
                    ))}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* DUAL-MODE MAP: Google Maps Live + Vector GIS Logistics Backbone */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-5 sm:p-6 space-y-4">
            {/* Map Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Bản Đồ Phân Phối Vận Tải & Tuyến Nhộn Nhịp
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Định vị tài xế, điểm tập kết hàng hóa và các hành lang vận tải đường dài toàn quốc
                  </p>
                </div>
              </div>

              {/* View Mode & Layer Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mode Switcher: Google Map vs Vector Logistics */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMapMode("google")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      mapMode === "google"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Google Maps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode("vector")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      mapMode === "vector"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Vector GIS</span>
                  </button>
                </div>

                {/* Filter Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => { setMapFilter("all"); setSelectedCorridor(null); }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      mapFilter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMapFilter("drivers"); setSelectedCorridor(null); }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      mapFilter === "drivers" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🚚 Tài xế
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMapFilter("orders"); setSelectedCorridor(null); }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      mapFilter === "orders" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📦 Đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMapFilter("corridors"); }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      mapFilter === "corridors" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ⚡ Tuyến hot
                  </button>
                </div>

                {selectedCorridor && (
                  <button
                    type="button"
                    onClick={handleResetMapFocus}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Trở về toàn cảnh Việt Nam"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Thu phóng lại</span>
                  </button>
                )}
              </div>
            </div>

            {/* Map Canvas: Dual Presentation */}
            <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
              {/* Google Maps Layer */}
              <div
                ref={mapContainerRef}
                id="admin-live-map"
                className={`w-full h-full transition-opacity duration-300 ${
                  mapMode === "google" ? "opacity-100 z-10 block" : "opacity-0 pointer-events-none hidden"
                }`}
                style={{ width: "100%", height: "100%", minHeight: "400px" }}
              />

              {/* Vector GIS Logistics Schematic Map */}
              {mapMode === "vector" && (
                <div className="w-full h-full relative bg-slate-950 flex items-center justify-center p-4 select-none">
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <svg
                    viewBox="0 0 460 520"
                    className="w-full h-full max-h-[440px] overflow-visible"
                  >
                    <defs>
                      <linearGradient id="corridorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                      </filter>
                    </defs>

                    {/* Background S-curve spine hint for Vietnam */}
                    <path
                      d="M 210 75 Q 260 140 255 200 Q 285 260 275 320 Q 240 380 235 415 Q 210 440 195 455"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="14"
                      strokeLinecap="round"
                      opacity="0.4"
                    />

                    {/* Dynamic Corridor Arcs */}
                    {(mapFilter === "all" || mapFilter === "corridors") &&
                      topCorridors.map((c, idx) => {
                        const from = VIETNAM_GIS_HUBS[c.fromCity || ""] || VIETNAM_GIS_HUBS["Hà Nội"];
                        const to = VIETNAM_GIS_HUBS[c.toCity || ""] || VIETNAM_GIS_HUBS["Hồ Chí Minh"];
                        if (!from || !to || c.isIntra) return null;

                        const isSelected = selectedCorridor?.route === c.route;
                        const midX = (from.x + to.x) / 2 + (idx % 2 === 0 ? 30 : -25);
                        const midY = (from.y + to.y) / 2;
                        const pathD = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

                        return (
                          <g key={idx} className="cursor-pointer" onClick={() => handleSelectCorridor(c)}>
                            {/* Halo / Touch Target */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="transparent"
                              strokeWidth="18"
                            />
                            {/* Glowing Flow Arc */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke={isSelected ? "#f43f5e" : c.hex || "#38bdf8"}
                              strokeWidth={isSelected ? "4.5" : "2.5"}
                              strokeDasharray="6 4"
                              filter={isSelected ? "url(#glow)" : undefined}
                              opacity={isSelected ? 1 : 0.75}
                              className="transition-all duration-300"
                            />
                            {/* Midpoint trip count badge */}
                            <rect
                              x={midX - 22}
                              y={midY - 9}
                              width="44"
                              height="18"
                              rx="9"
                              fill="#0f172a"
                              stroke={isSelected ? "#f43f5e" : "#38bdf8"}
                              strokeWidth="1.5"
                            />
                            <text
                              x={midX}
                              y={midY + 3.5}
                              textAnchor="middle"
                              className="text-[9px] font-bold fill-white pointer-events-none select-none"
                            >
                              {c.count} đ
                            </text>
                          </g>
                        );
                      })}

                    {/* Regional Logistics Hub Nodes */}
                    {Object.entries(VIETNAM_GIS_HUBS).map(([cityName, pos]) => {
                      const isHovered = hoveredHub === cityName;
                      const hasCorridor = topCorridors.some(
                        (c) => c.fromCity === cityName || c.toCity === cityName
                      );

                      return (
                        <g
                          key={cityName}
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredHub(cityName)}
                          onMouseLeave={() => setHoveredHub(null)}
                        >
                          {/* Pulsing ring */}
                          {hasCorridor && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={isHovered ? 14 : 10}
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1"
                              opacity="0.5"
                              className="animate-ping"
                            />
                          )}
                          {/* Center Node */}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={isHovered ? 7 : 5}
                            fill={hasCorridor ? "#38bdf8" : "#64748b"}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          {/* Hub Label */}
                          <text
                            x={pos.x + 10}
                            y={pos.y + 3.5}
                            className={`text-[10px] select-none font-bold transition-colors ${
                              isHovered ? "fill-emerald-400 font-extrabold" : "fill-slate-300"
                            }`}
                          >
                            {pos.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Real Order & Driver Floating Pins */}
                    {(mapFilter === "all" || mapFilter === "orders" || mapFilter === "drivers") &&
                      (mapData?.markers || []).slice(0, 25).map((m, i) => {
                        // Normalize coordinates onto the SVG canvas
                        // lat: 10 (South) -> y: 440; lat: 21 (North) -> y: 75
                        // lng: 105 (West) -> x: 180; lng: 108.5 (East) -> x: 290
                        const latClamped = Math.max(10, Math.min(22, m.coords.lat));
                        const lngClamped = Math.max(105, Math.min(109, m.coords.lng));
                        const y = 450 - ((latClamped - 10) / 12) * 375;
                        const x = 180 + ((lngClamped - 105) / 4) * 110;

                        const isDriver = m.type === "driver";
                        if (mapFilter === "drivers" && !isDriver) return null;
                        if (mapFilter === "orders" && isDriver) return null;

                        return (
                          <g key={m.id || i} className="cursor-pointer">
                            <circle
                              cx={x}
                              cy={y}
                              r="8"
                              fill={isDriver ? "#10b981" : "#2563eb"}
                              fillOpacity="0.85"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={y + 3}
                              textAnchor="middle"
                              className="text-[7.5px] fill-white font-bold select-none pointer-events-none"
                            >
                              {isDriver ? "🚚" : "📦"}
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                </div>
              )}

              {/* Floating Map Legend */}
              <div className="absolute bottom-3.5 left-3.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700/80 z-20 space-y-1 text-xs text-white">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Chú giải bản đồ điều hành</p>
                <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">🚚</span>
                    <span>Tài xế hoạt động ({mapData?.summary?.totalActiveDrivers ?? metrics?.activeDrivers ?? 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">📦</span>
                    <span>Điểm hàng thực tế ({mapData?.summary?.totalTrackedOrders ?? 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-1 bg-indigo-500 rounded-full inline-block" />
                    <span>Hành lang nhộn nhịp ({topCorridors.length})</span>
                  </div>
                </div>
              </div>

              {/* Selected Corridor Banner (if focused) */}
              {selectedCorridor && (
                <div className="absolute top-3.5 left-3.5 right-3.5 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl z-20 flex items-center justify-between gap-3 text-xs border border-primary-500/40">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Đang xem hành lang: <b className="text-white">{selectedCorridor.route}</b> ({selectedCorridor.count} chuyến • {selectedCorridor.percent}% toàn sàn)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetMapFocus}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Thu nhỏ lại
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">Đơn Hàng Gần Đây</h3>
              <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0">
                Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Đơn hàng gần đây</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[620px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">
                    <th className="py-3 px-4 sm:px-6">Mã Đơn</th>
                    <th className="py-3 px-4 sm:px-6">Tiêu Đề</th>
                    <th className="py-3 px-4 sm:px-6">Trạng Thái</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Giá Trị</th>
                    <th className="py-3 px-4 sm:px-6">Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentOrders.length > 0 ? recentOrders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    const price = getOrderDisplayPrice(order);
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline">
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-700 text-xs max-w-[200px] truncate" title={order.title || ""}>
                          {order.title || "---"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 flex-shrink-0" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                          {price > 0 ? `${(price / 1000).toLocaleString("vi-VN")}K ₫` : "Thương lượng"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-400 font-semibold whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-xs">Chưa có đơn hàng nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">Tài Xế Đang Hoạt Động</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.activeDrivers || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">KYC Chờ Duyệt</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.pendingKyc || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/50 p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 truncate">Vi Phạm Hệ Thống</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.totalViolations || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column (1 col on xl): Role Distribution, Top Corridors & Notifications */}
        <div className="space-y-6 min-w-0 max-w-full">
          {/* Interactive Donut & Status Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 p-5 sm:p-6 shadow-sm space-y-5">
            {/* Card Header & Tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {breakdownTab === "status" ? "Trạng Thái Vận Đơn" : "Cơ Cấu Thành Viên"}
                </h3>
              </div>

              {/* Tab Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBreakdownTab("status")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownTab === "status"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Đơn hàng
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("roles")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    breakdownTab === "roles"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Vai trò
                </button>
              </div>
            </div>

            {/* Donut Visualization */}
            <div className="flex items-center justify-center my-3">
              <div
                className="w-36 h-36 rounded-full relative shadow-xs transition-all duration-300"
                style={{
                  background:
                    breakdownTab === "status"
                      ? donutGradient
                      : `conic-gradient(#10b981 0% ${driverPct}%, #8b5cf6 ${driverPct}% 100%)`,
                }}
              >
                <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {breakdownTab === "status"
                        ? (metrics?.totalOrders || 0).toLocaleString()
                        : total.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {breakdownTab === "status" ? "Tổng đơn" : "Thành viên"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend & Details */}
            {breakdownTab === "status" ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đã hoàn thành</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{completedPct}%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({(statusBreakdown?.completed?.count || 0).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đang vận chuyển</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{inProgressPct}%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({(statusBreakdown?.in_progress?.count || 0).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đang tìm tài xế</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{searchingPct}%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({(statusBreakdown?.searching_driver?.count || 0).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="font-semibold text-slate-600">Đã hủy đơn</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{cancelledPct}%</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({(statusBreakdown?.cancelled?.count || 0).toLocaleString()} đơn)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span className="font-semibold text-slate-600">Tài Xế</span>
                  </div>
                  <span className="font-bold text-slate-800">{metrics?.totalDrivers || 0} ({driverPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full flex-shrink-0"></div>
                    <span className="font-semibold text-slate-600">Chủ Hàng</span>
                  </div>
                  <span className="font-bold text-slate-800">{metrics?.totalShippers || 0} ({shipperPct}%)</span>
                </div>
                {metrics?.pendingKyc ? (
                  <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-amber-700">{metrics.pendingKyc} hồ sơ KYC đang chờ duyệt</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Top Corridors / Logistics Routes Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tuyến Vận Tải Nhộn Nhịp</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Hành lang có lưu lượng cao nhất từ đơn hàng thực tế</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {topCorridors.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  Chưa có đủ dữ liệu hành lang vận tải
                </div>
              ) : (
                topCorridors.map((corridor, idx) => {
                  const isSelected = selectedCorridor?.route === corridor.route;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectCorridor(corridor)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 text-xs ${
                        isSelected
                          ? "border-primary-500 bg-primary-50/40 shadow-xs"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50/70"
                      }`}
                      title="Nhấn để xem trực quan tuyến đường này trên bản đồ"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate max-w-[190px]">
                          {corridor.route}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{corridor.count} chuyến</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${corridor.text}`}>
                            {corridor.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${corridor.color}`}
                          style={{ width: `${Math.min(100, Math.max(corridor.percent, 4))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{corridor.isIntra ? "Vận tải nội tỉnh" : "Vận tải liên tỉnh"}</span>
                        <span className="text-primary-600 font-bold flex items-center gap-0.5 hover:underline">
                          Xem trên bản đồ 📍
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 truncate">Hoạt Động Mới Nhất</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Cập nhật tức thì sự kiện hệ thống
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotifsRead}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[10px] hidden xs:inline">Đã đọc</span>
                  </button>
                )}
                <Link
                  href="/admin/notifications"
                  className="text-primary-600 hover:text-primary-700 text-[11px] font-bold transition-colors flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary-50"
                  title="Xem tất cả thông báo"
                >
                  <span>Xem</span> <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600">Không có thông báo mới</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống đang hoạt động ổn định.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {notifications.slice(0, 5).map((notif) => {
                  const isOrder = notif.type === "order_cancelled";
                  const isKyc = notif.type === "kyc_pending";
                  const isSupport = notif.type === "support_ticket" || notif.type === "chat";

                  return (
                    <Link
                      key={notif.id}
                      href={getNotificationLink(notif)}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50/80 group ${
                        !notif.read ? "bg-primary-50/25" : ""
                      }`}
                    >
                      {/* Category Icon */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 ${
                          isOrder
                            ? "bg-red-50 text-red-500 border border-red-100"
                            : isKyc
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : isSupport
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {isOrder ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : isKyc ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : isSupport ? (
                          <Headset className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span
                            className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isOrder
                                ? "bg-red-100/70 text-red-700"
                                : isKyc
                                ? "bg-amber-100/70 text-amber-700"
                                : isSupport
                                ? "bg-emerald-100/70 text-emerald-700"
                                : "bg-blue-100/70 text-blue-700"
                            }`}
                          >
                            {isOrder
                              ? "Đơn Hàng"
                              : isKyc
                              ? "eKYC"
                              : isSupport
                              ? "Hỗ Trợ"
                              : "Người Dùng"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          )}
                        </div>

                        <h4
                          className={`text-xs leading-snug group-hover:text-primary-600 transition-colors line-clamp-1 ${
                            !notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action Link Arrow */}
                      <div className="flex items-center text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 self-center">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
