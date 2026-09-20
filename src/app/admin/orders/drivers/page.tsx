"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  Car,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  MapPin,
  Navigation,
  Eye,
  Globe,
  ChevronDown,
  ChevronUp,
  Layers,
  Compass,
  TrendingUp,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  ArrowUpRight,
  BarChart3,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  RefreshCw,
  Radio,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

interface UserInfo {
  name?: string;
  phone?: string;
  email?: string;
}

interface VehicleInfo {
  type?: string;
  vehicleTypeParent?: string | null;
  vehicleTypeChild?: string | null;
  plateNumber?: string;
  brand?: string | null;
  model?: string | null;
  capacity?: number | null;
  seats?: number | null;
  status?: string;
  cargoTypes?: string[];
}

interface DriverPost {
  _id: string;
  driverId?: UserInfo;
  vehicleId?: VehicleInfo;
  route?: {
    from?: string | null;
    to?: string | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    pickupRadiusMeters?: number | null;
    dropoffRadiusMeters?: number | null;
    radiusMeters?: number | null;
  };
  note?: string | null;
  scheduleType?: "active" | "scheduled";
  availableFrom?: string | null;
  availableTo?: string | null;
  pricing?: { type?: "fixed" | "negotiable"; minPrice?: number | null; maxPrice?: number | null };
  pricingMode?: "freight" | "full_trip" | "shared_seat";
  price?: number | null;
  platformFeePercent?: number | null;
  vehicleSeats?: number | null;
  availableSeats?: number | null;
  isFull?: boolean;
  status: "draft" | "active" | "paused" | "scheduled" | "matched" | "in_progress" | "completed" | "cancelled";
  cargoTypes?: string[];
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; dotColor: string }> = {
  draft: { label: "Bản nháp", color: "text-slate-600 bg-slate-50 border-slate-200", dotColor: "#94a3b8" },
  active: { label: "Đang mở", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dotColor: "#10b981" },
  paused: { label: "Tạm dừng", color: "text-amber-700 bg-amber-50 border-amber-200", dotColor: "#f59e0b" },
  scheduled: { label: "Đã lên lịch", color: "text-blue-700 bg-blue-50 border-blue-200", dotColor: "#3b82f6" },
  matched: { label: "Đã ghép đơn", color: "text-indigo-700 bg-indigo-50 border-indigo-200", dotColor: "#6366f1" },
  in_progress: { label: "Đang chạy", color: "text-cyan-700 bg-cyan-50 border-cyan-200", dotColor: "#06b6d4" },
  completed: { label: "Hoàn thành", color: "text-teal-800 bg-teal-100 border-teal-200", dotColor: "#0d9488" },
  cancelled: { label: "Đã hủy", color: "text-red-700 bg-red-50 border-red-200", dotColor: "#ef4444" },
};

const PRICING_MODE_LABEL: Record<string, string> = {
  freight: "Chở hàng",
  full_trip: "Bao chuyến",
  shared_seat: "Ghép ghế",
};

// Known Vietnam coordinates for fallback geocoding
const VIETNAM_PROVINCE_COORDS: Record<string, { lat: number; lng: number; region: "bac" | "trung" | "nam" }> = {
  "hà nội": { lat: 21.028511, lng: 105.804817, region: "bac" },
  "hải phòng": { lat: 20.844911, lng: 106.688084, region: "bac" },
  "quảng ninh": { lat: 20.950451, lng: 107.073364, region: "bac" },
  "hạ long": { lat: 20.950451, lng: 107.073364, region: "bac" },
  "bắc ninh": { lat: 21.186096, lng: 106.076317, region: "bac" },
  "hải dương": { lat: 20.937298, lng: 106.314644, region: "bac" },
  "thanh hóa": { lat: 19.806692, lng: 105.785187, region: "bac" },
  "nghệ an": { lat: 18.673397, lng: 105.681328, region: "bac" },
  "vinh": { lat: 18.673397, lng: 105.681328, region: "bac" },
  "đà nẵng": { lat: 16.054407, lng: 108.202164, region: "trung" },
  "quảng nam": { lat: 15.566373, lng: 108.016357, region: "trung" },
  "huế": { lat: 16.463713, lng: 107.590866, region: "trung" },
  "thừa thiên huế": { lat: 16.463713, lng: 107.590866, region: "trung" },
  "quảng ngãi": { lat: 15.120468, lng: 108.792275, region: "trung" },
  "bình định": { lat: 13.782967, lng: 109.219663, region: "trung" },
  "quy nhơn": { lat: 13.782967, lng: 109.219663, region: "trung" },
  "khánh hòa": { lat: 12.238791, lng: 109.196749, region: "trung" },
  "nha trang": { lat: 12.238791, lng: 109.196749, region: "trung" },
  "lâm đồng": { lat: 11.940419, lng: 108.458313, region: "trung" },
  "đà lạt": { lat: 11.940419, lng: 108.458313, region: "trung" },
  "đắk lắk": { lat: 12.666191, lng: 108.038246, region: "trung" },
  "buôn ma thuột": { lat: 12.666191, lng: 108.038246, region: "trung" },
  "hồ chí minh": { lat: 10.823099, lng: 106.629664, region: "nam" },
  "sài gòn": { lat: 10.776889, lng: 106.700806, region: "nam" },
  "bình dương": { lat: 11.082725, lng: 106.666992, region: "nam" },
  "đồng nai": { lat: 10.957448, lng: 106.842712, region: "nam" },
  "bà rịa": { lat: 10.496738, lng: 107.169525, region: "nam" },
  "vũng tàu": { lat: 10.346002, lng: 107.084305, region: "nam" },
  "long an": { lat: 10.536767, lng: 106.411621, region: "nam" },
  "tiền giang": { lat: 10.360028, lng: 106.359863, region: "nam" },
  "cần thơ": { lat: 10.045162, lng: 105.746857, region: "nam" },
  "an giang": { lat: 10.385542, lng: 105.434771, region: "nam" },
  "kiên giang": { lat: 10.012543, lng: 105.080917, region: "nam" },
  "phú quốc": { lat: 10.2289, lng: 103.9572, region: "nam" },
};

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "---");
const formatRadius = (meters?: number | null) => {
  if (!meters) return "---";
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
};

const formatCapacityTon = (value?: number | null) => {
  if (value == null || value <= 0) return null;
  const ton = value >= 100 ? value / 1000 : value;
  const formatted = Number.isInteger(ton) ? ton.toString() : ton.toFixed(1).replace(/\.0$/, "");
  return `${formatted} tấn`;
};

// Helper to resolve coordinates
function resolvePointCoordinates(
  address?: string | null,
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number; region?: "bac" | "trung" | "nam" } | null {
  if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng) };
  }
  if (!address) return null;
  const lower = address.toLowerCase();
  for (const [cityKey, coords] of Object.entries(VIETNAM_PROVINCE_COORDS)) {
    if (lower.includes(cityKey)) {
      return coords;
    }
  }
  return null;
}

// Helper to categorize vehicle logic
function getVehicleCategory(typeString?: string | null): "cargo_heavy" | "passenger_car" | "other" {
  if (!typeString) return "other";
  const str = typeString.toLowerCase().trim();

  // Nhóm xe loại trừ đặc biệt: công trình, cứu hộ, xe máy, ba gác... -> không số ghế, không tải trọng, không loại hàng hóa
  const isExcluded =
    str.includes("công trình") ||
    str.includes("cong trinh") ||
    str.includes("cứu hộ") ||
    str.includes("cuu ho") ||
    str.includes("ba gác") ||
    str.includes("ba gac") ||
    str.includes("xe máy") ||
    str.includes("xe may") ||
    str.includes("mô tô") ||
    str.includes("mo to");

  if (isExcluded) {
    return "other";
  }

  // 1. Nhóm: Xe tải vs Xe công vs Xe cẩu vs Xe tải cẩu
  const isCargoHeavy =
    str.includes("xe tải") ||
    str.includes("xe tai") ||
    str.includes("tải cẩu") ||
    str.includes("tai cau") ||
    str.includes("xe cẩu") ||
    str.includes("xe cau") ||
    str.includes("cần cẩu") ||
    str.includes("cẩu tự hành") ||
    str.includes("xe công") ||
    str.includes("xe cong") ||
    str.includes("container") ||
    str.includes("đầu kéo") ||
    str.includes("dau keo") ||
    str.includes("rơ moóc") ||
    str.includes("ro mooc") ||
    str.includes("sơ mi rơ moóc") ||
    str.includes("so mi") ||
    str.includes("mooc") ||
    str.includes("thùng bạt") ||
    str.includes("thung bat") ||
    str.includes("thùng kín") ||
    str.includes("thung kin") ||
    str.includes("thùng lửng") ||
    str.includes("thung lung") ||
    str.includes("đông lạnh") ||
    str.includes("dong lanh") ||
    (str.includes("tải") && !str.includes("bán tải")) ||
    (str.includes("tai") && !str.includes("ban tai")) ||
    (str.includes("cẩu") && !str.includes("cuu ho"));

  if (isCargoHeavy) {
    return "cargo_heavy";
  }

  // 2. Nhóm: Ô tô
  const isPassengerCar =
    str.includes("ô tô") ||
    str.includes("o to") ||
    str.includes("oto") ||
    str.includes("xe con") ||
    str.includes("du lịch") ||
    str.includes("du lich") ||
    str.includes("xe khách") ||
    str.includes("xe khach") ||
    str.includes("limousine") ||
    str.includes("chỗ") ||
    str.includes("cho") ||
    str.includes("ghế") ||
    str.includes("ghe");

  if (isPassengerCar) {
    return "passenger_car";
  }

  // 3. Các xe còn lại (xe máy, ba gác, cứu hộ, công trình...)
  return "other";
}

export default function AdminDriverPostsPage() {
  const [posts, setPosts] = useState<DriverPost[]>([]);
  const [mapPosts, setMapPosts] = useState<DriverPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- TIME FILTER MODES (NGÀY / THÁNG / NĂM) ---
  type TimeGranularity = "all" | "day" | "month" | "year" | "custom";
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>("all");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedDayPreset, setSelectedDayPreset] = useState<string>("today");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Map UI State
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [activeMapFilterStatus, setActiveMapFilterStatus] = useState<string>("all");
  const [mapSelectedPost, setMapSelectedPost] = useState<DriverPost | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Compute start/end date from granularity
  const computeDateRange = useCallback(
    (granularity: TimeGranularity, dayPreset: string, month: number, year: number) => {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const now = new Date();

      if (granularity === "all") {
        return { start: "", end: "" };
      }

      if (granularity === "day") {
        if (dayPreset === "today") {
          const s = formatDate(now);
          return { start: s, end: s };
        }
        if (dayPreset === "yesterday") {
          const yest = new Date(now);
          yest.setDate(yest.getDate() - 1);
          const s = formatDate(yest);
          return { start: s, end: s };
        }
        if (dayPreset === "7days") {
          const past = new Date(now);
          past.setDate(past.getDate() - 7);
          return { start: formatDate(past), end: formatDate(now) };
        }
        if (dayPreset === "30days") {
          const past = new Date(now);
          past.setDate(past.getDate() - 30);
          return { start: formatDate(past), end: formatDate(now) };
        }
      }

      if (granularity === "month") {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        return { start: formatDate(firstDay), end: formatDate(lastDay) };
      }

      if (granularity === "year") {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        return { start: formatDate(firstDay), end: formatDate(lastDay) };
      }

      return { start: startDate, end: endDate };
    },
    [startDate, endDate]
  );

  // Trigger date change when controls change
  const handleGranularityChange = (newMode: TimeGranularity) => {
    setTimeGranularity(newMode);
    setCurrentPage(1);

    if (newMode === "all") {
      setStartDate("");
      setEndDate("");
    } else {
      const { start, end } = computeDateRange(newMode, selectedDayPreset, selectedMonth, selectedYear);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleDayPresetChange = (preset: string) => {
    setSelectedDayPreset(preset);
    setCurrentPage(1);
    const { start, end } = computeDateRange("day", preset, selectedMonth, selectedYear);
    setStartDate(start);
    setEndDate(end);
  };

  const handleMonthYearChange = (m: number, y: number) => {
    setSelectedMonth(m);
    setSelectedYear(y);
    setCurrentPage(1);
    const { start, end } = computeDateRange("month", selectedDayPreset, m, y);
    setStartDate(start);
    setEndDate(end);
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    setCurrentPage(1);
    const { start, end } = computeDateRange("year", selectedDayPreset, selectedMonth, y);
    setStartDate(start);
    setEndDate(end);
  };

  // 1. Fetch Paginated Driver Posts (for table)
  const fetchDriverPosts = useCallback(async () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/driver-posts?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch driver posts");
      const data = await res.json();
      const fetched = data.data?.posts || [];
      setPosts(fetched);
      setMapPosts((prev) => (prev.length === 0 ? fetched : prev));
      setPagination(data.data?.pagination || { page: currentPage, limit, total: 0, pages: 0 });
      setErrorMessage("");
    } catch (err) {
      console.warn("Driver posts API failed", err);
      setPosts([]);
      setPagination({ page: currentPage, limit, total: 0, pages: 0 });
      setErrorMessage("Không thể tải danh sách tài xế từ hệ thống.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, statusFilter, startDate, endDate]);

  // 2. Fetch All Filtered Driver Posts (for Map Analytics - up to 100 posts)
  const fetchMapPosts = useCallback(async () => {
    setMapLoading(true);
    const queryParams = new URLSearchParams({
      page: "1",
      limit: "100",
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/driver-posts?${queryParams.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch map driver posts (HTTP ${res.status})`);
      }
      const data = await res.json();
      const list = data.data?.posts || [];
      setMapPosts(list.length > 0 ? list : posts);
    } catch (err: any) {
      console.warn("Map driver posts API failed, using table posts as fallback:", err?.message || err);
      setMapPosts((prev) => (prev.length > 0 ? prev : posts));
    } finally {
      setMapLoading(false);
    }
  }, [search, statusFilter, startDate, endDate, posts]);

  useEffect(() => {
    fetchDriverPosts();
  }, [fetchDriverPosts]);

  useEffect(() => {
    fetchMapPosts();
  }, [fetchMapPosts]);

  // Regional & Corridor Statistics derived from mapPosts
  const mapStats = useMemo(() => {
    const sourcePosts = mapPosts.length > 0 ? mapPosts : posts;
    const total = sourcePosts.length;
    const active = sourcePosts.filter((p) => p.status === "active").length;
    const matched = sourcePosts.filter((p) => p.status === "matched" || p.status === "in_progress").length;
    const completed = sourcePosts.filter((p) => p.status === "completed").length;

    let bacCount = 0;
    let trungCount = 0;
    let namCount = 0;

    const corridors: Record<string, number> = {};

    sourcePosts.forEach((post) => {
      const fromLower = (post.route?.from || "").toLowerCase();
      const toLower = (post.route?.to || "").toLowerCase();

      // Count region
      let foundRegion = false;
      for (const [cityKey, meta] of Object.entries(VIETNAM_PROVINCE_COORDS)) {
        if (fromLower.includes(cityKey)) {
          if (meta.region === "bac") bacCount++;
          else if (meta.region === "trung") trungCount++;
          else if (meta.region === "nam") namCount++;
          foundRegion = true;
          break;
        }
      }
      if (!foundRegion) {
        namCount++; // default fall
      }

      // Detect corridor
      let startCity = "Điểm đi";
      let endCity = "Điểm đến";
      for (const cityKey of Object.keys(VIETNAM_PROVINCE_COORDS)) {
        if (fromLower.includes(cityKey)) {
          startCity = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
          break;
        }
      }
      for (const cityKey of Object.keys(VIETNAM_PROVINCE_COORDS)) {
        if (toLower.includes(cityKey)) {
          endCity = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
          break;
        }
      }

      if (startCity !== "Điểm đi" && endCity !== "Điểm đến") {
        const corridorKey = `${startCity} ⇄ ${endCity}`;
        corridors[corridorKey] = (corridors[corridorKey] || 0) + 1;
      }
    });

    const sortedCorridors = Object.entries(corridors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      active,
      matched,
      completed,
      bacCount,
      trungCount,
      namCount,
      topCorridors: sortedCorridors,
    };
  }, [mapPosts]);

  // --- GOOGLE MAPS RENDERER ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDq4-qHUd9qYi5go9mI3OpoLEgpMhzgGU&libraries=places,geometry";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => initGoogleMap();
    } else if ((window as any).google) {
      initGoogleMap();
    }

    function initGoogleMap() {
      const google = (window as any).google;
      if (!google || !mapContainerRef.current) return;

      if (!googleMapInstanceRef.current) {
        googleMapInstanceRef.current = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 16.054407, lng: 108.202164 }, // Central Vietnam
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        infoWindowRef.current = new google.maps.InfoWindow();
      }

      renderMapData();
    }

    function renderMapData() {
      const google = (window as any).google;
      const map = googleMapInstanceRef.current;
      if (!google || !map) return;

      // Clear previous markers & polylines
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      const bounds = new google.maps.LatLngBounds();
      let hasValidCoords = false;

      const sourcePosts = mapPosts.length > 0 ? mapPosts : posts;
      const filteredPosts =
        activeMapFilterStatus === "all"
          ? sourcePosts
          : sourcePosts.filter((p) => p.status === activeMapFilterStatus);

      filteredPosts.forEach((post) => {
        const pickup = resolvePointCoordinates(post.route?.from, post.route?.pickupLat, post.route?.pickupLng);
        const dropoff = resolvePointCoordinates(post.route?.to, post.route?.dropoffLat, post.route?.dropoffLng);

        const statusCfg = STATUS_MAP[post.status] || {
          label: post.status,
          color: "text-slate-600 bg-slate-50",
          dotColor: "#94a3b8",
        };

        const postPrice = post.price
          ? formatMoney(post.price)
          : `${formatMoney(post.pricing?.minPrice)} - ${formatMoney(post.pricing?.maxPrice)}`;

        // InfoWindow HTML content
        const createContentString = (type: "pickup" | "dropoff") => `
          <div style="padding: 10px; max-width: 280px; font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-weight: bold; font-size: 13px; color: #0f172a;">${post.driverId?.name || "Tài xế"}</span>
              <span style="background: ${statusCfg.dotColor}22; color: ${statusCfg.dotColor}; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 9999px;">${statusCfg.label}</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              ${post.driverId?.phone ? `<span>📞 ${post.driverId.phone}</span> • ` : ""}
              <span>🚗 ${post.vehicleId?.plateNumber || "---"} (${post.vehicleId?.type || "Xe"})</span>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px;">
              <div style="color: #2563eb; font-weight: 600; margin-bottom: 2px;">Từ: ${post.route?.from || "---"}</div>
              <div style="color: #059669; font-weight: 600;">Đến: ${post.route?.to || "---"}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #64748b; font-size: 11px;">Giá cước:</span>
              <span style="font-weight: bold; color: #4338ca;">${postPrice}</span>
            </div>
            <a href="/admin/orders/drivers/${post._id}" style="display: block; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 11px;">
              Xem Chi Tiết Tin Đăng →
            </a>
          </div>
        `;

        if (pickup) {
          hasValidCoords = true;
          bounds.extend(pickup);

          // Pickup marker
          const pickupMarker = new google.maps.Marker({
            position: pickup,
            map,
            title: `Nhận hàng: ${post.route?.from || ""}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#2563eb",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          pickupMarker.addListener("click", () => {
            setMapSelectedPost(post);
            infoWindowRef.current.setContent(createContentString("pickup"));
            infoWindowRef.current.open(map, pickupMarker);
          });

          markersRef.current.push(pickupMarker);
        }

        if (dropoff) {
          hasValidCoords = true;
          bounds.extend(dropoff);

          // Dropoff marker
          const dropoffMarker = new google.maps.Marker({
            position: dropoff,
            map,
            title: `Trả hàng: ${post.route?.to || ""}`,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 4,
              fillColor: "#059669",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              rotation: 180,
            },
          });

          dropoffMarker.addListener("click", () => {
            setMapSelectedPost(post);
            infoWindowRef.current.setContent(createContentString("dropoff"));
            infoWindowRef.current.open(map, dropoffMarker);
          });

          markersRef.current.push(dropoffMarker);
        }

        // Draw connecting route corridor
        if (pickup && dropoff) {
          const polyline = new google.maps.Polyline({
            path: [pickup, dropoff],
            geodesic: true,
            strokeColor: statusCfg.dotColor || "#6366f1",
            strokeOpacity: 0.55,
            strokeWeight: 2.5,
            map,
            icons: [
              {
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2 },
                offset: "50%",
              },
            ],
          });

          polyline.addListener("click", (e: any) => {
            setMapSelectedPost(post);
            infoWindowRef.current.setPosition(e.latLng);
            infoWindowRef.current.setContent(createContentString("pickup"));
            infoWindowRef.current.open(map);
          });

          polylinesRef.current.push(polyline);
        }
      });

      if (hasValidCoords && !bounds.isEmpty()) {
        map.fitBounds(bounds, 40);
      } else {
        map.setCenter({ lat: 16.054407, lng: 108.202164 });
        map.setZoom(6);
      }
    }
  }, [mapPosts, posts, activeMapFilterStatus]);

  // Reset Map View to Vietnam
  const handleResetMapView = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: 16.054407, lng: 108.202164 });
      googleMapInstanceRef.current.setZoom(6);
    }
  };

  // Human readable active time title
  const activeTimeTitle = useMemo(() => {
    if (timeGranularity === "all") return "Tất cả thời gian (Toàn bộ dữ liệu)";
    if (timeGranularity === "day") {
      if (selectedDayPreset === "today") return "Hôm nay";
      if (selectedDayPreset === "yesterday") return "Hôm qua";
      if (selectedDayPreset === "7days") return "7 ngày gần nhất";
      if (selectedDayPreset === "30days") return "30 ngày gần nhất";
    }
    if (timeGranularity === "month") {
      return `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;
    }
    if (timeGranularity === "year") {
      return `Năm ${selectedYear}`;
    }
    if (timeGranularity === "custom") {
      return `Từ ${startDate || "..."} đến ${endDate || "..."}`;
    }
    return "Khoảng thời gian đã chọn";
  }, [timeGranularity, selectedDayPreset, selectedMonth, selectedYear, startDate, endDate]);

  return (
    <div className="space-y-6 w-full pb-12">
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Danh Sách & Bản Đồ Tài Xế Đăng Tin</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
              TMS MAP ANALYTICS
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Theo dõi phân bố địa lý, mật độ phương tiện và các tuyến vận tải theo Ngày / Tháng / Năm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchDriverPosts();
              fetchMapPosts();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || mapLoading ? "animate-spin text-primary-600" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* --- SECTION: BẢN ĐỒ THỐNG KÊ THEO NGÀY / THÁNG / NĂM --- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Map Header & Time Filter Toolbar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                    Bản Đồ Thống Kê & Phân Bố Tuyến Vận Tải Toàn Quốc
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {activeTimeTitle}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Tổng hợp {mapStats.total} tin đăng tài xế • Trực quan hóa hành lang điều vận toàn quốc
                </p>
              </div>
            </div>

            {/* Map Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetMapView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                title="Căn chỉnh lại góc nhìn toàn quốc"
              >
                <Compass className="w-3.5 h-3.5 text-primary-600" />
                <span className="hidden sm:inline">Toàn quốc</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                title={isMapExpanded ? "Thu gọn bản đồ" : "Mở rộng bản đồ"}
              >
                {isMapExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Thu gọn</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Mở rộng bản đồ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TIME GRANULARITY SELECTOR (NGÀY / THÁNG / NĂM / TẤT CẢ) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Tabs: Tất cả / Theo Ngày / Theo Tháng / Theo Năm / Tùy chọn */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-primary-600" />
                Thời gian:
              </span>

              <button
                type="button"
                onClick={() => handleGranularityChange("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "all"
                    ? "bg-primary-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Tất cả
              </button>

              <button
                type="button"
                onClick={() => handleGranularityChange("day")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "day"
                    ? "bg-primary-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Theo Ngày
              </button>

              <button
                type="button"
                onClick={() => handleGranularityChange("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "month"
                    ? "bg-primary-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Theo Tháng
              </button>

              <button
                type="button"
                onClick={() => handleGranularityChange("year")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "year"
                    ? "bg-primary-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Theo Năm
              </button>

              <button
                type="button"
                onClick={() => handleGranularityChange("custom")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "custom"
                    ? "bg-primary-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Tùy chọn
              </button>
            </div>

            {/* Sub-controls based on mode */}
            <div className="flex items-center gap-2 flex-wrap">
              {timeGranularity === "day" && (
                <div className="flex items-center gap-1">
                  {[
                    { id: "today", label: "Hôm nay" },
                    { id: "yesterday", label: "Hôm qua" },
                    { id: "7days", label: "7 ngày" },
                    { id: "30days", label: "30 ngày" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleDayPresetChange(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedDayPreset === p.id
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {timeGranularity === "month" && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {[2026, 2025, 2024].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {timeGranularity === "year" && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {[2026, 2025, 2024, 2023].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {timeGranularity === "custom" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Mini-Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100 bg-slate-50/40">
          <div className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng tin đăng kỳ này
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-900">{mapStats.total}</span>
              <span className="text-[11px] text-slate-400">tin</span>
            </div>
          </div>

          <div className="p-4">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Đang sẵn sàng nhận đơn
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-600">{mapStats.active}</span>
              <span className="text-[11px] text-emerald-600/80 font-semibold">
                ({mapStats.total > 0 ? Math.round((mapStats.active / mapStats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-4">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Đã ghép / Đang chạy
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-blue-600">{mapStats.matched}</span>
              <span className="text-[11px] text-blue-500 font-semibold">chuyến</span>
            </div>
          </div>

          <div className="p-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              Phân bố miền
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-700">
              <span title="Miền Bắc">B: {mapStats.bacCount}</span>
              <span>•</span>
              <span title="Miền Trung">T: {mapStats.trungCount}</span>
              <span>•</span>
              <span title="Miền Nam">N: {mapStats.namCount}</span>
            </div>
          </div>
        </div>

        {/* MAP CONTAINER & SIDEBAR */}
        {isMapExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[460px]">
            {/* Map Canvas (3 cols) */}
            <div className="lg:col-span-3 relative bg-slate-100 min-h-[380px] sm:min-h-[460px] border-r border-slate-100">
              <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

              {/* Map Floating Filter Badges */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Lọc trạng thái:</span>
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "active", label: "Đang mở" },
                  { id: "scheduled", label: "Đã lên lịch" },
                  { id: "matched", label: "Đã ghép" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveMapFilterStatus(st.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      activeMapFilterStatus === st.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-md border border-slate-200 text-[10px] font-bold text-slate-700 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Điểm nhận hàng
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Điểm trả hàng
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-indigo-500"></span> Tuyến kết nối
                </span>
              </div>
            </div>

            {/* Sidebar Corridor Analysis (1 col) */}
            <div className="p-5 space-y-4 bg-white flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                  Hành Lang Tuyến Sôi Động
                </h3>

                {mapStats.topCorridors.length > 0 ? (
                  <div className="space-y-2.5">
                    {mapStats.topCorridors.map(([corridor, count], idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800 line-clamp-1">{corridor}</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                            {count} chuyến
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((count / (mapStats.total || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Chưa có đủ dữ liệu hành lang cho kỳ này.
                  </div>
                )}
              </div>

              {/* Quick Prompt */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Mẹo điều phối:
                </p>
                <p className="text-indigo-800/80 leading-relaxed">
                  Nhấp vào bất kỳ điểm đón/trả trên bản đồ để xem ngay thông tin tài xế, giá cước và mở chi tiết vận đơn.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SECTION: BẢNG TÌM KIẾM & DANH SÁCH CHI TIẾT --- */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên tài xế, SĐT, biển số xe, điểm đi, điểm đến..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-hidden focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-44">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-hidden focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách tài xế đăng tin...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Car className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy tin đăng tài xế nào</p>
            <p className="text-xs text-slate-400">Hãy thử điều chỉnh bộ lọc ngày hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách tin đăng tài xế</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>

            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x">
              <table className="w-full min-w-[1100px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-56">Tài xế</th>
                    <th className="py-4 px-6 min-w-56">Phương tiện</th>
                    <th className="py-4 px-6 min-w-64">Tuyến đăng & Bán kính</th>
                    <th className="py-4 px-6 min-w-44">Giá / Loại chuyến</th>
                    <th className="py-4 px-6 min-w-56">Lịch khả dụng</th>
                    <th className="py-4 px-6 min-w-32">Trạng thái</th>
                    <th className="py-4 px-6 min-w-32">Ngày đăng</th>
                    <th className="py-4 px-6 text-right min-w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {posts.map((post) => {
                    const statusInfo = STATUS_MAP[post.status] || {
                      label: post.status,
                      color: "text-slate-600 bg-slate-50 border-slate-200",
                    };
                    const vehicle = post.vehicleId;
                    const priceRange = post.price
                      ? formatMoney(post.price)
                      : `${formatMoney(post.pricing?.minPrice)} - ${formatMoney(post.pricing?.maxPrice)}`;

                    return (
                      <tr key={post._id} className="hover:bg-slate-50/50 transition-colors align-top">
                        {/* Driver */}
                        <td className="py-4.5 px-6 min-w-56">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                              <UserRound className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <Link
                                href={`/admin/orders/drivers/${post._id}`}
                                className="font-bold text-primary-600 hover:underline"
                              >
                                {post.driverId?.name || "Tài xế"}
                              </Link>
                              <p className="text-xs font-semibold text-slate-500">{post.driverId?.phone || "---"}</p>
                              <p className="text-xs text-slate-400">{post.driverId?.email || "---"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="py-4.5 px-6 min-w-64">
                          <p className="font-bold text-slate-800">{vehicle?.vehicleTypeChild || vehicle?.type || "---"}</p>
                          <p className="text-xs font-semibold text-slate-500">
                            {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "---"}
                          </p>

                          {/* Sức chứa / Số chỗ / Hàng hóa theo logic nghiệp vụ (Dưới mô tả, trước hàng biển số) */}
                          {(() => {
                            const fullType = [vehicle?.vehicleTypeParent, vehicle?.vehicleTypeChild, vehicle?.type]
                              .filter(Boolean)
                              .join(" ");
                            const category = getVehicleCategory(fullType);

                            // 1. Số chỗ: Chỉ ô tô
                            if (category === "passenger_car") {
                              const seats = post.availableSeats ?? vehicle?.seats ?? post.vehicleSeats;
                              return (
                                <div className="mt-1.5 py-1 px-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-900 space-y-0.5 w-fit">
                                  <div className="flex items-center gap-1.5 font-semibold">
                                    <span className="text-blue-600">Số chỗ:</span>
                                    <strong className="text-blue-950 font-bold">{seats != null ? `${seats} chỗ` : "Chưa cập nhật"}</strong>
                                    <span className={`text-[10px] font-bold ${post.isFull ? "text-rose-600" : "text-emerald-600"}`}>
                                      • {post.isFull ? "Đã đầy" : "Còn nhận"}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            // 2. Tải trọng với hàng hoá chỉ: xe tải vs xe công vs Xe cẩu , xe tải cẩu
                            if (category === "cargo_heavy") {
                              const capacityText = formatCapacityTon(vehicle?.capacity);
                              const cargoList =
                                post.cargoTypes && post.cargoTypes.length > 0
                                  ? post.cargoTypes
                                  : vehicle?.cargoTypes && vehicle.cargoTypes.length > 0
                                  ? vehicle.cargoTypes
                                  : [];

                              return (
                                <div className="mt-1.5 py-1 px-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-950 space-y-0.5 max-w-xs">
                                  <div className="flex items-center gap-1.5 font-semibold">
                                    <span className="text-amber-700">Tải trọng:</span>
                                    <strong className="text-amber-950 font-bold">{capacityText || "Chưa cập nhật"}</strong>
                                    <span className={`text-[10px] font-bold ${post.isFull ? "text-rose-600" : "text-emerald-700"}`}>
                                      • {post.isFull ? "Đã đầy" : "Còn nhận"}
                                    </span>
                                  </div>
                                  {cargoList.length > 0 && (
                                    <div className="text-[10px] text-slate-600 line-clamp-1">
                                      <span className="text-amber-800 font-medium">Hàng hóa:</span> {cargoList.join(", ")}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // 3. Các xe còn lại: không có số ghế, ko có tải trọng, ko có loại hàng hoá
                            return null;
                          })()}

                          {vehicle?.plateNumber && (
                            <div className="mt-1.5">
                              <span className="inline-block font-mono font-bold text-xs bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-md border border-slate-900 shadow-2xs">
                                {vehicle.plateNumber}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Route */}
                        <td className="py-4.5 px-6 min-w-64">
                          <div className="space-y-1 text-xs">
                            <Link href={`/admin/orders/drivers/${post._id}`} className="block hover:text-primary-600">
                              <p className="font-semibold text-slate-700">
                                <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Từ:</span>
                                {post.route?.from || "---"}
                              </p>
                              <p className="font-semibold text-slate-700">
                                <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Đến:</span>
                                {post.route?.to || "---"}
                              </p>
                            </Link>
                            <div className="grid grid-cols-2 gap-1 pt-1">
                              <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                BK đi: {formatRadius(post.route?.pickupRadiusMeters || post.route?.radiusMeters)}
                              </span>
                              <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                BK đến: {formatRadius(post.route?.dropoffRadiusMeters || post.route?.radiusMeters)}
                              </span>
                            </div>
                            {post.note && <p className="text-slate-400 line-clamp-2 pt-1">{post.note}</p>}
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-4.5 px-6 min-w-44">
                          <p className="font-bold text-slate-800 text-xs">{priceRange}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            {PRICING_MODE_LABEL[post.pricingMode || ""] || post.pricingMode || "---"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {post.pricing?.type === "fixed" ? "Giá cố định" : "Thương lượng"}
                          </p>
                        </td>

                        {/* Schedule */}
                        <td className="py-4.5 px-6 min-w-56 text-xs">
                          <div className="flex gap-2">
                            <CalendarClock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700">
                                {post.scheduleType === "scheduled" ? "Đặt lịch trước" : "Đang sẵn sàng"}
                              </p>
                              <p className="text-slate-500">Từ: {formatDateTime(post.availableFrom)}</p>
                              <p className="text-slate-500">Đến: {formatDateTime(post.availableTo)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-4.5 px-6 text-xs font-semibold text-slate-400 min-w-32 whitespace-nowrap">
                          {formatDateTime(post.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/drivers/${post._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Xem chi tiết tin đăng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng{" "}
              {pagination.total} tin đăng)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
