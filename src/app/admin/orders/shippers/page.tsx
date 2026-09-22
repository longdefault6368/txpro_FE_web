"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader,
  PackageOpen,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Truck,
  XCircle,
  MapPin,
  RefreshCw,
  Boxes,
  DollarSign,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

interface UserInfo {
  name?: string;
  phone?: string;
  email?: string;
}

interface MoneyRange {
  min?: number | null;
  max?: number | null;
}

interface LocationPoint {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  district?: string | null;
  province?: string | null;
}

interface Order {
  _id: string;
  orderCode: string;
  title?: string | null;
  cargoType?: string | null;
  vehicleType?: string | null;
  weight?: number | null;
  volume?: number | null;
  status: string;
  offerPrice?: number | null;
  budget?: number | MoneyRange | null;
  pickup?: LocationPoint;
  dropoff?: LocationPoint;
  shipperId?: UserInfo;
  driverId?: UserInfo | null;
  paymentMethod?: string | null;
  pickupTimeType?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
  createdAt: string;
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

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");

const formatBudget = (order: Order) => {
  if (order.offerPrice) return formatMoney(order.offerPrice);
  if (typeof order.budget === "number") return formatMoney(order.budget);
  if (order.budget && typeof order.budget === "object") {
    return `${formatMoney(order.budget.min)} - ${formatMoney(order.budget.max)}`;
  }
  return "---";
};

const getNumericBudget = (order: Order): number => {
  if (order.offerPrice && Number.isFinite(order.offerPrice)) return order.offerPrice;
  if (typeof order.budget === "number" && Number.isFinite(order.budget)) return order.budget;
  if (order.budget && typeof order.budget === "object") {
    if (order.budget.max && Number.isFinite(order.budget.max)) return order.budget.max;
    if (order.budget.min && Number.isFinite(order.budget.min)) return order.budget.min;
  }
  return 0;
};

// Smart format for cargo weight (ton vs kg)
const formatWeight = (value?: number | null) => {
  if (value == null || value <= 0) return "---";
  if (value >= 1000) {
    const ton = value / 1000;
    const formatted = Number.isInteger(ton) ? ton.toString() : ton.toFixed(1).replace(/\.0$/, "");
    return `${formatted} tấn`;
  }
  if (value <= 35) {
    // If entered directly in tons (e.g. 2.5, 5, 20)
    return `${value} tấn`;
  }
  return `${value.toLocaleString("vi-VN")} kg`;
};

// Vietnam province coordinates for fallback map geocoding
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
  "thủ đức": { lat: 10.849409, lng: 106.753706, region: "nam" },
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

const MOCK_SHIPPER_ORDERS: Order[] = [
  {
    _id: "so-mock-1",
    orderCode: "ORD-20260709-001",
    title: "Vận chuyển 20 tấn hạt nhựa PP",
    cargoType: "Hạt nhựa công nghiệp",
    vehicleType: "Xe tải 20 tấn",
    weight: 20000,
    volume: 35,
    status: "in_progress",
    offerPrice: 4500000,
    pickup: { address: "KCN Cát Lái, TP.HCM", lat: 10.776889, lng: 106.700806 },
    dropoff: { address: "KCN Sóng Thần, Bình Dương", lat: 11.082725, lng: 106.666992 },
    shipperId: { name: "Trần Thị Hằng", phone: "0912345678", email: "hang@gmail.com" },
    driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
    paymentMethod: "cash",
    pickupTimeType: "scheduled",
    pickupTime: "2026-07-10T02:00:00Z",
    notes: "Bốc hàng bằng xe nâng tại cổng 2.",
    createdAt: "2026-07-09T08:30:00Z",
  },
  {
    _id: "so-mock-2",
    orderCode: "ORD-20260708-005",
    title: "Giao 50 thùng hoa quả tươi xuất khẩu",
    cargoType: "Nông sản đông lạnh",
    vehicleType: "Xe tải đông lạnh 5 tấn",
    weight: 2500,
    volume: 12,
    status: "searching_driver",
    budget: { min: 1800000, max: 2500000 },
    pickup: { address: "Chợ đầu mối Thủ Đức, TP.HCM", lat: 10.849409, lng: 106.753706 },
    dropoff: { address: "Cảng Cát Lái, Quận 2, TP.HCM", lat: 10.768889, lng: 106.780806 },
    shipperId: { name: "Nguyễn Minh Thu", phone: "0933444555", email: "thu.nguyen@gmail.com" },
    paymentMethod: "wallet",
    pickupTimeType: "now",
    createdAt: "2026-07-08T14:00:00Z",
  },
  {
    _id: "so-mock-3",
    orderCode: "ORD-20260708-012",
    title: "Chở thép cuộn xây dựng công trình",
    cargoType: "Vật liệu xây dựng",
    vehicleType: "Xe đầu kéo Container 40ft",
    weight: 28000,
    volume: 40,
    status: "completed",
    offerPrice: 8500000,
    pickup: { address: "KCN Đình Vũ, Hải Phòng", lat: 20.844911, lng: 106.688084 },
    dropoff: { address: "KCN Quế Võ, Bắc Ninh", lat: 21.186096, lng: 106.076317 },
    shipperId: { name: "Công ty Thép Việt Nhật", phone: "0908889999", email: "logistics@vietnhatsteel.vn" },
    driverId: { name: "Hoàng Văn Nam", phone: "0977112233", email: "nam.hoang@gmail.com" },
    paymentMethod: "wallet",
    pickupTimeType: "scheduled",
    pickupTime: "2026-07-08T06:00:00Z",
    notes: "Có giấy cân tải trọng tại cảng.",
    createdAt: "2026-07-07T16:20:00Z",
  },
  {
    _id: "so-mock-4",
    orderCode: "ORD-20260707-009",
    title: "Vận chuyển linh kiện điện tử",
    cargoType: "Thiết bị điện tử",
    vehicleType: "Xe tải thùng kín 8 tấn",
    weight: 4500,
    volume: 24,
    status: "waiting_driver_acceptance",
    budget: 3200000,
    pickup: { address: "Khu Công Nghệ Cao, Quận 9, TP.HCM", lat: 10.852409, lng: 106.793706 },
    dropoff: { address: "KCN Biên Hòa 2, Đồng Nai", lat: 10.957448, lng: 106.842712 },
    shipperId: { name: "Phạm Hải Đăng", phone: "0944556677", email: "dang.pham@samsungsupply.vn" },
    driverId: { name: "Lê Quốc Bảo", phone: "0938123456", email: "bao.le@gmail.com" },
    paymentMethod: "wallet",
    pickupTimeType: "scheduled",
    createdAt: "2026-07-07T09:15:00Z",
  },
  {
    _id: "so-mock-5",
    orderCode: "ORD-20260706-003",
    title: "Chở phân bón NPK và thuốc BVTV",
    cargoType: "Nông dược phẩm",
    vehicleType: "Xe tải thùng bạt 15 tấn",
    weight: 15000,
    volume: 28,
    status: "delivered",
    offerPrice: 6200000,
    pickup: { address: "KCN Hiệp Phước, Nhà Bè, TP.HCM", lat: 10.6667, lng: 106.75 },
    dropoff: { address: "KCN Trà Nóc, Cần Thơ", lat: 10.045162, lng: 105.746857 },
    shipperId: { name: "Đoàn Văn Vĩnh", phone: "0918776655", email: "vinh.fertilizer@gmail.com" },
    driverId: { name: "Trương Công Định", phone: "0903332211", email: "dinh.truong@gmail.com" },
    paymentMethod: "cash",
    pickupTimeType: "scheduled",
    createdAt: "2026-07-06T11:45:00Z",
  },
  {
    _id: "so-mock-6",
    orderCode: "ORD-20260705-018",
    title: "Chở gạch men và thiết bị vệ sinh",
    cargoType: "Hàng gia dụng & VLXD",
    vehicleType: "Xe tải cẩu 10 tấn",
    weight: 9500,
    volume: 18,
    status: "searching_driver",
    offerPrice: 5000000,
    pickup: { address: "KCN Hòa Khánh, Liên Chiểu, Đà Nẵng", lat: 16.054407, lng: 108.202164 },
    dropoff: { address: "KCN Điện Nam - Điện Ngọc, Quảng Nam", lat: 15.566373, lng: 108.016357 },
    shipperId: { name: "Vũ Thị Mai", phone: "0982223344", email: "mai.ceramic@danang.vn" },
    paymentMethod: "wallet",
    pickupTimeType: "now",
    createdAt: "2026-07-05T08:00:00Z",
  },
];

const STATUS_MAP: Record<
  string,
  { label: string; color: string; dotColor: string; bg: string; icon: React.ElementType }
> = {
  searching_driver: { label: "Đang tìm tài xế", color: "text-amber-800 bg-amber-50 border-amber-200", dotColor: "#d97706", bg: "bg-amber-50", icon: Loader },
  waiting_driver: { label: "Chờ tài xế xác nhận", color: "text-purple-800 bg-purple-50 border-purple-200", dotColor: "#9333ea", bg: "bg-purple-50", icon: Clock },
  waiting_driver_acceptance: { label: "Chờ tài xế xác nhận", color: "text-purple-800 bg-purple-50 border-purple-200", dotColor: "#9333ea", bg: "bg-purple-50", icon: Clock },
  accepted: { label: "Đã tìm được tài xế", color: "text-indigo-800 bg-indigo-50 border-indigo-200", dotColor: "#4f46e5", bg: "bg-indigo-50", icon: CheckCircle },
  rejected: { label: "Tài xế từ chối nhận", color: "text-rose-800 bg-rose-50 border-rose-200", dotColor: "#e11d48", bg: "bg-rose-50", icon: XCircle },
  in_progress: { label: "Tài xế đang di chuyển", color: "text-blue-800 bg-blue-50 border-blue-200", dotColor: "#2563eb", bg: "bg-blue-50", icon: Truck },
  delivered: { label: "Đã giao hàng (Chờ chủ hàng xác nhận)", color: "text-teal-800 bg-teal-50 border-teal-200", dotColor: "#0d9488", bg: "bg-teal-50", icon: CheckCircle },
  completed: { label: "Đã hoàn thành", color: "text-emerald-900 bg-emerald-100 border-emerald-300 font-extrabold", dotColor: "#10b981", bg: "bg-emerald-100", icon: CheckCircle },
  cancelled: { label: "Đã hủy vận đơn", color: "text-red-800 bg-red-50 border-red-200", dotColor: "#dc2626", bg: "bg-red-50", icon: XCircle },
};

type TimeGranularity = "day" | "month" | "year" | "all" | "custom";

export default function AdminShipperOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mapOrders, setMapOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Time Granularity
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>("all");
  const [selectedDayPreset, setSelectedDayPreset] = useState<"today" | "yesterday" | "7days" | "30days">("today");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Map Filter & Controls
  const [activeMapRegion, setActiveMapRegion] = useState<"all" | "bac" | "trung" | "nam">("all");
  const [activeMapFilterStatus, setActiveMapFilterStatus] = useState<string>("all");
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Google Maps references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Quick helper to format Date to YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Switch time granularity and apply dates
  const handleSelectGranularity = (granularity: TimeGranularity) => {
    setTimeGranularity(granularity);
    setCurrentPage(1);
    const now = new Date();

    if (granularity === "all") {
      setStartDate("");
      setEndDate("");
    } else if (granularity === "day") {
      handleSelectDayPreset(selectedDayPreset);
    } else if (granularity === "month") {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    } else if (granularity === "year") {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31);
      setStartDate(formatYMD(start));
      setEndDate(formatYMD(end));
    }
  };

  const handleSelectDayPreset = (preset: "today" | "yesterday" | "7days" | "30days") => {
    setSelectedDayPreset(preset);
    setTimeGranularity("day");
    setCurrentPage(1);
    const now = new Date();

    if (preset === "today") {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYMD(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "7days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    } else if (preset === "30days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setTimeGranularity("month");
    setCurrentPage(1);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    setStartDate(formatYMD(start));
    setEndDate(formatYMD(end));
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setTimeGranularity("year");
    setCurrentPage(1);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    setStartDate(formatYMD(start));
    setEndDate(formatYMD(end));
  };

  const clearAllFilters = () => {
    setTimeGranularity("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setStatusFilter("");
    setActiveMapFilterStatus("all");
    setActiveMapRegion("all");
    setCurrentPage(1);
  };

  // Fetch paginated table orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch shipper orders");
      const data = await res.json();
      const fetchedOrders: Order[] = data.data?.orders || [];
      setOrders(fetchedOrders);
      setPagination(data.data?.pagination || { page: currentPage, limit, total: fetchedOrders.length, pages: 1 });
      setIsOffline(false);
    } catch (err: any) {
      console.warn("Orders API offline, using mock data", err);
      setIsOffline(true);
      const query = search.toLowerCase();
      let filtered = [...MOCK_SHIPPER_ORDERS];
      if (query) {
        filtered = filtered.filter(
          (order) =>
            order.orderCode.toLowerCase().includes(query) ||
            order.title?.toLowerCase().includes(query) ||
            order.cargoType?.toLowerCase().includes(query) ||
            order.shipperId?.name?.toLowerCase().includes(query) ||
            order.pickup?.address?.toLowerCase().includes(query) ||
            order.dropoff?.address?.toLowerCase().includes(query)
        );
      }
      if (statusFilter) filtered = filtered.filter((order) => order.status === statusFilter);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter((order) => new Date(order.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((order) => new Date(order.createdAt) <= end);
      }
      const total = filtered.length;
      const pages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
      setOrders(paginated);
      setPagination({ page: currentPage, limit, total, pages });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, statusFilter, startDate, endDate]);

  // Fetch geographic dataset for Interactive Map (up to 100 orders)
  const fetchMapOrders = useCallback(async () => {
    setMapLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "100",
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch map orders");
      const data = await res.json();
      setMapOrders(data.data?.orders || []);
    } catch (err) {
      console.warn("Map orders fallback to local/mock dataset", err);
      setMapOrders(MOCK_SHIPPER_ORDERS);
    } finally {
      setMapLoading(false);
    }
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchMapOrders();
  }, [fetchMapOrders]);

  // Unified dataset for KPI calculations
  const analyticsData = useMemo(() => {
    const dataset = mapOrders.length > 0 ? mapOrders : orders;
    const total = dataset.length;

    const searching = dataset.filter(
      (o) => o.status === "searching_driver" || o.status === "waiting_driver" || o.status === "waiting_driver_acceptance"
    ).length;

    const inProgress = dataset.filter((o) => o.status === "in_progress" || o.status === "accepted").length;
    const completed = dataset.filter((o) => o.status === "completed" || o.status === "delivered").length;
    const cancelled = dataset.filter((o) => o.status === "cancelled" || o.status === "rejected").length;

    // Total estimated budget in VND
    const totalBudget = dataset.reduce((acc, o) => acc + getNumericBudget(o), 0);

    // Acceptance/Fulfillment Rate (%)
    const fulfilled = inProgress + completed;
    const fulfillmentRate = total > 0 ? Math.round((fulfilled / total) * 100) : 0;

    // Regional breakdown
    let bacCount = 0;
    let trungCount = 0;
    let namCount = 0;
    const corridors: Record<string, number> = {};

    dataset.forEach((order) => {
      const fromLower = (order.pickup?.address || "").toLowerCase();
      const toLower = (order.dropoff?.address || "").toLowerCase();

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
      if (!foundRegion) namCount++;

      // Corridors
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
        const key = `${startCity} ⇄ ${endCity}`;
        corridors[key] = (corridors[key] || 0) + 1;
      }
    });

    const sortedCorridors = Object.entries(corridors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      searching,
      inProgress,
      completed,
      cancelled,
      totalBudget,
      fulfillmentRate,
      bacCount,
      trungCount,
      namCount,
      topCorridors: sortedCorridors,
    };
  }, [mapOrders, orders]);

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
          center: { lat: 16.054407, lng: 108.202164 },
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

      const sourceOrders = mapOrders.length > 0 ? mapOrders : orders;
      const filteredOrders =
        activeMapFilterStatus === "all"
          ? sourceOrders
          : sourceOrders.filter((o) => {
              if (activeMapFilterStatus === "searching") {
                return (
                  o.status === "searching_driver" ||
                  o.status === "waiting_driver" ||
                  o.status === "waiting_driver_acceptance"
                );
              }
              if (activeMapFilterStatus === "in_progress") {
                return o.status === "in_progress" || o.status === "accepted";
              }
              if (activeMapFilterStatus === "completed") {
                return o.status === "completed" || o.status === "delivered";
              }
              if (activeMapFilterStatus === "cancelled") {
                return o.status === "cancelled" || o.status === "rejected";
              }
              return o.status === activeMapFilterStatus;
            });

      filteredOrders.forEach((order) => {
        const pickup = resolvePointCoordinates(order.pickup?.address, order.pickup?.lat, order.pickup?.lng);
        const dropoff = resolvePointCoordinates(order.dropoff?.address, order.dropoff?.lat, order.dropoff?.lng);

        // Region filter check
        if (activeMapRegion !== "all") {
          const matchesRegion =
            pickup?.region === activeMapRegion || dropoff?.region === activeMapRegion;
          if (!matchesRegion) return;
        }

        const statusCfg = STATUS_MAP[order.status] || {
          label: order.status,
          dotColor: "#64748b",
        };

        const createContentString = (isPickup: boolean) => `
          <div style="font-family: inherit; font-size: 12px; color: #1e293b; max-width: 280px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #4f46e5; font-size: 13px;">${order.orderCode}</span>
              <span style="background: ${statusCfg.dotColor}22; color: ${statusCfg.dotColor}; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 9999px;">${statusCfg.label}</span>
            </div>
            <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${order.title || order.cargoType || "Hàng hóa"}</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px;">
              <div style="font-size: 11px; margin-bottom: 2px;"><strong>Chủ hàng:</strong> ${order.shipperId?.name || "Chưa có"}</div>
              <div style="font-size: 11px; margin-bottom: 2px;"><strong>Tài xế:</strong> ${order.driverId?.name || "Đang tìm tài xế"}</div>
              <div style="font-size: 11px; margin-bottom: 2px;"><strong>Từ:</strong> ${order.pickup?.address || "---"}</div>
              <div style="font-size: 11px; margin-bottom: 2px;"><strong>Đến:</strong> ${order.dropoff?.address || "---"}</div>
              <div style="font-size: 11px; font-weight: bold; color: #16a34a; margin-top: 4px;"><strong>Cước:</strong> ${formatBudget(order)}</div>
            </div>
            <a href="/admin/orders/${order._id}" style="display: block; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 11px;">
              Xem Chi Tiết Đơn Hàng &rarr;
            </a>
          </div>
        `;

        // Pickup Marker
        if (pickup) {
          hasValidCoords = true;
          bounds.extend(pickup);

          const pickupMarker = new google.maps.Marker({
            position: pickup,
            map,
            title: `[Lấy hàng] ${order.orderCode}: ${order.pickup?.address || ""}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6.5,
              fillColor: "#2563eb",
              fillOpacity: 0.95,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          pickupMarker.addListener("click", () => {
            infoWindowRef.current.setContent(createContentString(true));
            infoWindowRef.current.open(map, pickupMarker);
          });

          markersRef.current.push(pickupMarker);
        }

        // Dropoff Marker
        if (dropoff) {
          hasValidCoords = true;
          bounds.extend(dropoff);

          const dropoffMarker = new google.maps.Marker({
            position: dropoff,
            map,
            title: `[Giao hàng] ${order.orderCode}: ${order.dropoff?.address || ""}`,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 4.5,
              fillColor: statusCfg.dotColor || "#10b981",
              fillOpacity: 0.95,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              rotation: 180,
            },
          });

          dropoffMarker.addListener("click", () => {
            infoWindowRef.current.setContent(createContentString(false));
            infoWindowRef.current.open(map, dropoffMarker);
          });

          markersRef.current.push(dropoffMarker);
        }

        // Connecting Polyline
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
            infoWindowRef.current.setPosition(e.latLng);
            infoWindowRef.current.setContent(createContentString(true));
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
  }, [mapOrders, orders, activeMapFilterStatus, activeMapRegion]);

  const handleResetMapView = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: 16.054407, lng: 108.202164 });
      googleMapInstanceRef.current.setZoom(6);
    }
  };

  const copyOrderCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Human readable active time title
  const activeTimeTitle = useMemo(() => {
    if (timeGranularity === "all") return "Toàn bộ thời gian";
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
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hệ thống đang chạy chế độ dự phòng cục bộ (Offline Mock Data)</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Danh Sách Chủ Hàng Đăng Đơn</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
              TMS SHIPPER ANALYTICS
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Trung tâm giám sát vận đơn, luồng hàng hóa, phân bổ địa lý và tiến độ giao hàng trên toàn quốc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchOrders();
              fetchMapOrders();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Tải lại dữ liệu mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || mapLoading ? "animate-spin text-primary-600" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* --- SECTION: BẢN ĐỒ & TRUNG TÂM THỐNG KÊ (KPIs) --- */}
      <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xs p-5 sm:p-6 space-y-6">
        {/* Controls: Granularity Selector & Time Title */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              Thống kê theo:
            </span>

            <div className="inline-flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => handleSelectGranularity("day")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "day" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Theo Ngày
              </button>
              <button
                type="button"
                onClick={() => handleSelectGranularity("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "month" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => handleSelectGranularity("year")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "year" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Theo Năm
              </button>
              <button
                type="button"
                onClick={() => handleSelectGranularity("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeGranularity === "all" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất Cả
              </button>
            </div>
          </div>

          {/* Sub-selectors based on granularity */}
          <div className="flex items-center gap-2 flex-wrap">
            {timeGranularity === "day" && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl text-xs">
                {(
                  [
                    { id: "today", label: "Hôm nay" },
                    { id: "yesterday", label: "Hôm qua" },
                    { id: "7days", label: "7 ngày" },
                    { id: "30days", label: "30 ngày" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDayPreset(d.id)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedDayPreset === d.id ? "bg-primary-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {timeGranularity === "month" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthYearChange(Number(e.target.value), selectedYear)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-primary-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-primary-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeGranularity === "year" && (
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-primary-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setIsMapExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer ml-auto"
            >
              <Compass className="w-3.5 h-3.5 text-primary-600" />
              <span>{isMapExpanded ? "Thu gọn bản đồ" : "Mở bản đồ"}</span>
              {isMapExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* --- 5 KPI METRIC CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng vận đơn</span>
              <div className="w-7 h-7 rounded-xl bg-slate-200/60 text-slate-700 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{analyticsData.total}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block truncate">{activeTimeTitle}</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/70 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tìm / Chờ tài xế</span>
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-blue-900">{analyticsData.searching}</div>
            <span className="text-[10px] font-semibold text-blue-600 mt-0.5 block">Đang đợi tài xế ghép</span>
          </div>

          <div className="bg-cyan-50/70 border border-cyan-200/70 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Đang vận chuyển</span>
              <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-cyan-950">{analyticsData.inProgress}</div>
            <span className="text-[10px] font-semibold text-cyan-700 mt-0.5 block">Đã giao tài xế chạy</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Giao thành công</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-950">{analyticsData.completed}</div>
            <span className="text-[10px] font-semibold text-emerald-700 mt-0.5 block">
              Tỷ lệ hoàn thành: {analyticsData.fulfillmentRate}%
            </span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/70 p-4 rounded-2xl col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Tổng cước ước tính</span>
              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-base sm:text-lg font-bold text-purple-950 truncate">
              {formatMoney(analyticsData.totalBudget)}
            </div>
            <span className="text-[10px] font-semibold text-purple-700 mt-0.5 block">Giá trị giao dịch vận chuyển</span>
          </div>
        </div>

        {/* --- MAP VISUALIZATION CONTAINER --- */}
        {isMapExpanded && (
          <div className="space-y-3 pt-2">
            {/* Map Filters Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  Khu vực:
                </span>
                {(
                  [
                    { id: "all", label: "Toàn quốc" },
                    { id: "bac", label: `Miền Bắc (${analyticsData.bacCount})` },
                    { id: "trung", label: `Miền Trung (${analyticsData.trungCount})` },
                    { id: "nam", label: `Miền Nam (${analyticsData.namCount})` },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveMapRegion(r.id)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      activeMapRegion === r.id
                        ? "bg-slate-800 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700">Trạng thái map:</span>
                <select
                  value={activeMapFilterStatus}
                  onChange={(e) => setActiveMapFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">Tất cả vận đơn</option>
                  <option value="searching">Tìm / Chờ tài xế</option>
                  <option value="in_progress">Đang vận chuyển</option>
                  <option value="completed">Giao thành công</option>
                  <option value="cancelled">Đã hủy / Từ chối</option>
                </select>

                <button
                  type="button"
                  onClick={handleResetMapView}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  title="Căn giữa bản đồ Việt Nam"
                >
                  Căn giữa VN
                </button>
              </div>
            </div>

            {/* Map Canvas & Side Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Google Map */}
              <div className="lg:col-span-3 relative h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                <div ref={mapContainerRef} className="w-full h-full" />
                {mapLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center gap-2 z-10">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600"></div>
                    <span className="text-xs font-bold text-slate-600">Đang cập nhật luồng hàng trên bản đồ...</span>
                  </div>
                )}
              </div>

              {/* Side Stats Panel */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-4 text-xs">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                    Phân bố luồng vận tải
                  </h3>

                  {/* Region Meters */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-1">
                        <span>Miền Nam</span>
                        <span>{analyticsData.namCount} đơn</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{
                            width: `${analyticsData.total > 0 ? (analyticsData.namCount / analyticsData.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-1">
                        <span>Miền Bắc</span>
                        <span>{analyticsData.bacCount} đơn</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{
                            width: `${analyticsData.total > 0 ? (analyticsData.bacCount / analyticsData.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-1">
                        <span>Miền Trung</span>
                        <span>{analyticsData.trungCount} đơn</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{
                            width: `${analyticsData.total > 0 ? (analyticsData.trungCount / analyticsData.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top Corridors */}
                  {analyticsData.topCorridors.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-500 uppercase text-[10px] block">Tuyến hàng sôi động nhất:</span>
                      {analyticsData.topCorridors.map(([corridor, count]) => (
                        <div
                          key={corridor}
                          className="flex items-center justify-between bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 font-medium"
                        >
                          <span className="truncate mr-2 font-semibold text-slate-800">{corridor}</span>
                          <span className="font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md text-[10px]">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map Legend */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Chấm tròn xanh: Điểm nhận hàng (Pickup)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Mũi tên: Điểm giao hàng (Dropoff)</span>
                  </div>
                  <p className="text-slate-400 pt-0.5 italic">Nhấp vào tuyến đường hoặc điểm để mở chi tiết vận đơn.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* --- SEARCH & QUICK FILTERS TOOLBAR --- */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-4">
        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(
            [
              { id: "", label: "Tất cả đơn", count: analyticsData.total },
              { id: "searching_driver", label: "Đang tìm tài xế", count: analyticsData.searching },
              { id: "in_progress", label: "Đang vận chuyển", count: analyticsData.inProgress },
              { id: "completed", label: "Giao thành công", count: analyticsData.completed },
              { id: "cancelled", label: "Đã hủy đơn", count: analyticsData.cancelled },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-slate-800 text-slate-200" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã vận đơn, tên chủ hàng, số điện thoại, loại hàng, tuyến đường..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-xs font-medium transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative w-full md:w-56">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([val, item]) => (
                <option key={val} value={val}>
                  {item.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-44">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(search || statusFilter || startDate || endDate) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer transition-all shrink-0"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TABLE: SHIPPER ORDERS LIST --- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4 font-semibold">Đang tải danh sách vận đơn chủ hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <PackageOpen className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy vận đơn chủ hàng nào</p>
            <p className="text-xs text-slate-400">Hãy thử nới lỏng bộ lọc thời gian hoặc từ khóa tìm kiếm.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Horizontal Scroll Hint */}
            <div className="md:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách vận đơn</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang xem đầy đủ →</span>
            </div>

            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1150px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-5 min-w-56">Mã & Hàng hóa</th>
                    <th className="py-3.5 px-5 min-w-48">Chủ hàng</th>
                    <th className="py-3.5 px-5 min-w-48">Tài xế nhận</th>
                    <th className="py-3.5 px-5 min-w-64">Lộ trình vận chuyển</th>
                    <th className="py-3.5 px-5 min-w-44">Tải trọng & Khối</th>
                    <th className="py-3.5 px-5 min-w-40">Cước phí</th>
                    <th className="py-3.5 px-5 min-w-44">Lịch & Thanh toán</th>
                    <th className="py-3.5 px-5 min-w-36">Trạng thái</th>
                    <th className="py-3.5 px-5 text-right w-[90px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {orders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || {
                      label: order.status,
                      color: "text-slate-600 bg-slate-50 border-slate-200",
                      dotColor: "#64748b",
                      icon: Clock,
                    };
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/60 transition-colors align-top">
                        {/* Order Code & Cargo */}
                        <td className="py-4 px-5 min-w-56">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="font-mono font-bold text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {order.orderCode}
                            </Link>
                            <button
                              type="button"
                              onClick={() => copyOrderCode(order.orderCode)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                              title="Sao chép mã đơn"
                            >
                              {copiedCode === order.orderCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <p className="font-bold text-slate-900 mt-1 line-clamp-1">{order.title || "---"}</p>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {order.cargoType || "Hàng tổng hợp"}
                          </span>
                          {order.notes && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{order.notes}</p>}
                        </td>

                        {/* Shipper Info */}
                        <td className="py-4 px-5 min-w-48">
                          <p className="font-bold text-slate-800">{order.shipperId?.name || "Chưa có tên"}</p>
                          <p className="font-semibold text-slate-500 mt-0.5">{order.shipperId?.phone || "---"}</p>
                          <p className="text-slate-400 text-[11px] truncate max-w-[180px]">
                            {order.shipperId?.email || "---"}
                          </p>
                        </td>

                        {/* Driver Info */}
                        <td className="py-4 px-5 min-w-48">
                          {order.driverId?.name ? (
                            <div>
                              <p className="font-bold text-slate-800">{order.driverId.name}</p>
                              <p className="font-semibold text-slate-500 mt-0.5">{order.driverId.phone || "---"}</p>
                              <p className="text-slate-400 text-[11px] truncate max-w-[180px]">
                                {order.driverId.email || "---"}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 font-bold text-[11px]">
                              <Clock className="w-3 h-3" />
                              Chưa có tài xế
                            </span>
                          )}
                        </td>

                        {/* Route */}
                        <td className="py-4 px-5 min-w-64">
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                              <p className="font-medium text-slate-700 leading-snug">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Đi:</span>
                                {order.pickup?.address || "---"}
                              </p>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                              <p className="font-medium text-slate-700 leading-snug">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Đến:</span>
                                {order.dropoff?.address || "---"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cargo Weight & Specs */}
                        <td className="py-4 px-5 min-w-44">
                          <div className="space-y-0.5">
                            <p>
                              <span className="text-slate-400 font-medium">Tải trọng: </span>
                              <strong className="text-slate-800 font-bold">{formatWeight(order.weight)}</strong>
                            </p>
                            {order.volume && (
                              <p>
                                <span className="text-slate-400 font-medium">Khối: </span>
                                <strong className="text-slate-800 font-bold">{order.volume} m³</strong>
                              </p>
                            )}
                            {order.vehicleType && (
                              <p className="text-[10px] text-primary-700 font-semibold truncate max-w-[150px]">
                                Xe: {order.vehicleType}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Cost / Budget */}
                        <td className="py-4 px-5 min-w-40 whitespace-nowrap">
                          <p className="font-bold text-slate-900 text-xs">{formatBudget(order)}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {order.offerPrice ? "Giá đề xuất" : "Ngân sách chủ hàng"}
                          </span>
                        </td>

                        {/* Schedule & Payment */}
                        <td className="py-4 px-5 min-w-44">
                          <p className="font-bold text-slate-700">
                            {order.pickupTimeType === "scheduled" ? "Đặt lịch hẹn" : "Lấy hàng ngay"}
                          </p>
                          {order.pickupTime && (
                            <p className="text-slate-500 text-[11px] mt-0.5">{formatDateTime(order.pickupTime)}</p>
                          )}
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {order.paymentMethod === "wallet" ? "Ví TXEPRO" : "Tiền mặt"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">Tạo: {formatDateTime(order.createdAt)}</span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Xem chi tiết đơn hàng"
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
              {pagination.total} vận đơn)
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
