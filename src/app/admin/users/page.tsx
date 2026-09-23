"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { useToast } from "@/context/ToastContext";
import { getServerMediaUrl, normalizePersistedImagePath } from "@/utils/media";
import { getVehicleCapabilities } from "@/utils/vehicleCapabilities";
import { 
  Search, UserPlus, Filter, Trash2, Edit3, ShieldAlert, Check, 
  X, Lock, ToggleLeft, ToggleRight, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight,
  MessageSquare, Send, Eye, ZoomIn, FileText, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Layers,
  Truck, Plus, Car, MapPin, Box, Upload, Info, Camera,
  TrendingUp, BarChart3, DollarSign, Receipt, Coins, CreditCard, Users, PackageCheck, Package,
  ArrowUpRight, ArrowDownRight, Sparkles, Navigation, ArrowRight, PackageOpen
} from "lucide-react";
// Interfaces
interface VehicleItem {
  _id: string;
  driverId?: string;
  type: string;
  vehicleTypeParent?: string | null;
  vehicleTypeChild?: string | null;
  seats?: number | null;
  ownerName?: string | null;
  brand: string;
  model?: string | null;
  cargoTypes?: string[];
  capacity?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  plateNumber: string;
  licenseImages: string[];
  operatingProvinceCode?: string | null;
  operatingProvinceName?: string | null;
  status?: "active" | "inactive";
  createdAt?: string;
}

interface VehicleCatalogItem {
  name: string;
  key?: string;
  seats?: number | null;
  children?: VehicleCatalogItem[];
}

const FALLBACK_CARGO_TYPES: string[] = [
  "Đồ gia dụng / nội thất",
  "Vật liệu xây dựng",
  "Hàng thực phẩm / nông sản",
  "Hàng đông lạnh",
  "Hàng dễ vỡ",
  "Hàng thiết bị điện tử",
  "Máy móc & thiết bị",
  "Siêu trường siêu trọng",
  "Hàng hóa lỏng",
];

const FALLBACK_VEHICLE_TREE: VehicleCatalogItem[] = [
  {
    name: "Xe tải",
    key: "vehicle.truck",
    children: [
      { name: "Xe tải thùng bạt", key: "vehicle.truck_tarpaulin" },
      { name: "Xe tải thùng kín", key: "vehicle.truck_box" },
      { name: "Xe tải thùng lửng", key: "vehicle.truck_open" },
      { name: "Xe tải đông lạnh", key: "vehicle.truck_refrigerated" },
    ],
  },
  {
    name: "Ô tô",
    key: "vehicle.oto",
    children: [
      { name: "4 ghế", key: "seat.4", seats: 4 },
      { name: "7 ghế", key: "seat.7", seats: 7 },
      { name: "9 ghế", key: "seat.9", seats: 9 },
      { name: "16 ghế", key: "seat.16", seats: 16 },
      { name: "29 ghế", key: "seat.29", seats: 29 },
      { name: "45 ghế", key: "seat.45", seats: 45 },
    ],
  },
  {
    name: "Container / xe đầu kéo",
    key: "vehicle.container_trailer",
    children: [
      { name: "Xe container 20 feet", key: "container.20ft" },
      { name: "Xe container 40 feet", key: "container.40ft" },
      { name: "Xe container 45 feet", key: "container.45ft" },
      { name: "Xe container lạnh (reefer)", key: "container.reefer" },
      { name: "Xe container mở nóc (open top)", key: "container.open_top" },
      { name: "Xe container phẳng (flat rack)", key: "container.flat_rack" },
      { name: "Xe container moóc lùn (low-boy trailer)", key: "container.low_boy" },
      { name: "Xe container lồng (chở ô tô)", key: "container.car_carrier" },
      { name: "Xe container có cần cẩu (sidelifter)", key: "container.sidelifter" },
    ],
  },
  {
    name: "Các xe công trình",
    key: "vehicle.construction",
    children: [
      { name: "Xe máy đào", key: "construction.excavator" },
      { name: "Xe máy xúc lật vs ủi", key: "construction.loader_bulldozer" },
      { name: "Xe nâng", key: "construction.forklift" },
      { name: "Xe lu", key: "construction.roller" },
      { name: "Máy phát điện", key: "construction.generator" },
    ],
  },
  {
    name: "Xe van / ô tô bán tải",
    key: "vehicle.van_pickup",
    children: [
      { name: "Xe van chở hàng", key: "van.cargo" },
      { name: "Xe bán tải (Pickup)", key: "van.pickup" },
    ],
  },
  { name: "Xe cứu hộ", key: "vehicle.rescue" },
  { name: "Xe cẩu tự hành", key: "vehicle.crane_truck" },
  { name: "Xe ben (xe ô tô ben)", key: "vehicle.dump" },
  { name: "Xe bồn (tanker)", key: "vehicle.tanker" },
  { name: "Xe chở gia súc", key: "vehicle.livestock" },
  { name: "Xe cần cẩu", key: "vehicle.crane" },
  { name: "Xe chở ô tô (lồng)", key: "vehicle.car_carrier_truck" },
  { name: "Phương tiện khác", key: "vehicle.other" },
];

type VehicleImageCategoryKey = "frontImages" | "sideImages" | "registrationFrontImages" | "registrationBackImages";

interface VehicleImageSlotConfig {
  key: VehicleImageCategoryKey;
  title: string;
  desc: string;
  badge: string;
  placeholderHint: string;
}

const VEHICLE_IMAGE_SLOTS: VehicleImageSlotConfig[] = [
  {
    key: "frontImages",
    title: "Mặt trước xe",
    desc: "Đầu xe & biển số trước",
    badge: "Xe",
    placeholderHint: "Ảnh chụp mặt trước xe",
  },
  {
    key: "sideImages",
    title: "Mặt ngang xe",
    desc: "Toàn thân & thùng xe",
    badge: "Xe",
    placeholderHint: "Ảnh chụp mặt ngang thân xe",
  },
  {
    key: "registrationFrontImages",
    title: "Cà vẹt mặt trước",
    desc: "Mặt trước giấy đăng ký xe",
    badge: "Cà vẹt",
    placeholderHint: "Ảnh cà vẹt mặt trước",
  },
  {
    key: "registrationBackImages",
    title: "Cà vẹt mặt sau",
    desc: "Mặt sau giấy đăng ký xe",
    badge: "Cà vẹt",
    placeholderHint: "Ảnh cà vẹt mặt sau",
  },
];

function parseVehicleImageGroups(images: string[]) {
  const cleaned = (Array.isArray(images) ? images : [])
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter((img) => img.length > 0);

  const registrationImages = cleaned.length >= 2 ? cleaned.slice(cleaned.length - 2) : [];
  const vehicleImages = cleaned.length >= 2 ? cleaned.slice(0, cleaned.length - 2) : cleaned;
  const splitIndex = vehicleImages.length <= 1 ? vehicleImages.length : Math.ceil(vehicleImages.length / 2);

  return {
    frontImages: vehicleImages.slice(0, splitIndex),
    sideImages: vehicleImages.slice(splitIndex),
    registrationFrontImages: registrationImages.length > 0 ? [registrationImages[0]] : [],
    registrationBackImages: registrationImages.length > 1 ? [registrationImages[1]] : [],
  };
}

interface User {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string | null;
  portraitImage?: string | null;
  role: "admin" | "tai-xe" | "chu-hang";
  isActive: boolean;
  kycStatus: "draft" | "pending" | "pending_review" | "verified" | "rejected";
  language: string;
  createdAt: string;
}

interface KycDocumentItem {
  type: "cccdFront" | "cccdBack" | "gplxFront" | "portrait";
  label: string;
  url?: string | null;
  status?: string;
  isBlob?: boolean;
}

interface KycDetails {
  submissionId?: string | null;
  status?: string;
  role?: string;
  submittedAt?: string | null;
  identity?: {
    fullName?: string | null;
    idNumber?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    permanentAddress?: string | null;
    issueDate?: string | null;
    expiryDate?: string | null;
  } | null;
  documents: KycDocumentItem[];
}

type ManagedUserRole = "tai-xe" | "chu-hang";

interface UserOrderStat {
  orderCount: number;
  completedCount: number;
  activeCount: number;
  cancelledCount: number;
  totalAmount: number;
  completedAmount: number;
}

interface SystemOverviewStats {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  totalOrders: number;
  totalGMV: number;
  completedTurnover: number;
  estimatedFee: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
}

interface UserOrderSummary {
  _id: string;
  orderCode: string;
  title?: string | null;
  cargoType?: string | null;
  vehicleType?: string | null;
  seats?: number | null;
  weight?: number | null;
  weightLabel?: string | null;
  pickup?: { address?: string | null; province?: string | null; district?: string | null } | null;
  dropoff?: { address?: string | null; province?: string | null; district?: string | null } | null;
  pickupTimeType?: string | null;
  pickupTime?: string | null;
  offerPrice?: number | null;
  finalPrice?: number | null;
  price?: number | null;
  budget?: any;
  financialSnapshot?: { orderAmount?: number | null } | null;
  paymentMethod?: string | null;
  status: string;
  shipperId?: any;
  driverId?: any;
  createdAt: string;
  notes?: string | null;
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

const formatCurrency = (value?: any, allowZeroOrEmpty = false) => {
  const num = Number(value);
  if (allowZeroOrEmpty) {
    if (value === undefined || value === null || isNaN(num)) return "0 ₫";
    return num.toLocaleString("vi-VN") + " ₫";
  }
  if (value === undefined || value === null) return "Thương lượng";
  if (isNaN(num) || num <= 0) return "Thương lượng";
  return num.toLocaleString("vi-VN") + " ₫";
};

const formatCompactCurrency = (value: number) => {
  if (!value || isNaN(value)) return "0 ₫";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} tr ₫`;
  }
  return value.toLocaleString("vi-VN") + " ₫";
};

const getOrderPrice = (order: any) => {
  if (order.finalPrice && !isNaN(Number(order.finalPrice))) return Number(order.finalPrice);
  if (order.offerPrice && !isNaN(Number(order.offerPrice))) return Number(order.offerPrice);
  if (order.price && !isNaN(Number(order.price))) return Number(order.price);
  if (order.financialSnapshot?.orderAmount && !isNaN(Number(order.financialSnapshot.orderAmount))) {
    return Number(order.financialSnapshot.orderAmount);
  }
  if (typeof order.budget === "number" && !isNaN(order.budget)) return order.budget;
  if (order.budget?.max && !isNaN(Number(order.budget.max))) return Number(order.budget.max);
  if (order.budget?.min && !isNaN(Number(order.budget.min))) return Number(order.budget.min);
  return 0;
};

const getOrderStatusBadge = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (["completed", "delivered", "settled"].includes(normalized)) {
    return {
      label: "Hoàn thành",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (["in_progress", "delivering", "in_transit", "running"].includes(normalized)) {
    return {
      label: "Đang vận chuyển",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    };
  }
  if (["accepted", "matched", "waiting_driver_acceptance"].includes(normalized)) {
    return {
      label: "Đã nhận đơn",
      bg: "bg-purple-50 text-purple-700 border-purple-200",
      dot: "bg-purple-500",
    };
  }
  if (["searching_driver", "waiting_driver", "pending", "draft"].includes(normalized)) {
    return {
      label: "Chờ tài xế",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }
  if (["cancelled", "rejected"].includes(normalized)) {
    return {
      label: "Đã hủy",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    };
  }
  return {
    label: status || "Khác",
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };
};

const getUserAvatarUrl = (user: User) => getServerMediaUrl(user.avatar || user.portraitImage);

const getUserInitials = (user: User) => {
  const source = user.name || user.phone || user.email || "User";
  return source
    .trim()
    .split(/\s+/)
    .pop()
    ?.substring(0, 2)
    .toUpperCase() || "US";
};

function AdminUsersContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [kycFilter, setKycFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // UI Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const [userOrderStatsMap, setUserOrderStatsMap] = useState<Record<string, UserOrderStat>>({});
  const [systemOrderStats, setSystemOrderStats] = useState<SystemOverviewStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalShippers: 0,
    totalOrders: 0,
    totalGMV: 0,
    completedTurnover: 0,
    estimatedFee: 0,
    completedOrdersCount: 0,
    activeOrdersCount: 0,
  });
  const [loadingOrderStats, setLoadingOrderStats] = useState(false);

  // User Orders Modal State
  const [showUserOrdersModal, setShowUserOrdersModal] = useState(false);
  const [selectedUserForOrders, setSelectedUserForOrders] = useState<User | null>(null);
  const [userOrdersList, setUserOrdersList] = useState<UserOrderSummary[]>([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [userOrdersStatusFilter, setUserOrdersStatusFilter] = useState<string>("all");
  const [userOrdersSearch, setUserOrdersSearch] = useState<string>("");

  // Chat State
  const [chatTargetUser, setChatTargetUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Form input states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "chu-hang" as ManagedUserRole,
    isActive: true,
    language: "vi",
    kycStatus: "draft" as User["kycStatus"]
  });
  const [newPassword, setNewPassword] = useState("");
  
  // KYC Documents & Verification in Edit Modal
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycDetails, setKycDetails] = useState<KycDetails | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<{ title: string; url: string } | null>(null);

  // Vehicles Management in Edit Modal
  const [editModalTab, setEditModalTab] = useState<"ekyc" | "vehicles">("ekyc");
  const [userVehicles, setUserVehicles] = useState<VehicleItem[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<VehicleImageCategoryKey | null>(null);
  const [activeUrlCategory, setActiveUrlCategory] = useState<VehicleImageCategoryKey | null>(null);
  const [categoryUrlInput, setCategoryUrlInput] = useState("");
  
  // Mobile-aligned Catalog & Cargo State
  const [cargoTypeOptions, setCargoTypeOptions] = useState<string[]>(FALLBACK_CARGO_TYPES);
  const [vehicleCatalogTree, setVehicleCatalogTree] = useState<VehicleCatalogItem[]>(FALLBACK_VEHICLE_TREE);
  const [selectedCargoTypes, setSelectedCargoTypes] = useState<string[]>([]);
  const [isCargoDropdownOpen, setIsCargoDropdownOpen] = useState(false);
  const cargoDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close cargo dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cargoDropdownRef.current && !cargoDropdownRef.current.contains(event.target as Node)) {
        setIsCargoDropdownOpen(false);
      }
    };
    if (isCargoDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCargoDropdownOpen]);

  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    type: "Xe tải thùng bạt",
    vehicleTypeParent: "Xe tải",
    vehicleTypeChild: "Xe tải thùng bạt",
    seats: "",
    ownerName: "",
    brand: "Hyundai",
    model: "",
    capacity: "5",
    capacityUnit: "tan" as "tan" | "kg",
    length: "5.2",
    width: "2.1",
    height: "2.2",
    operatingProvinceName: "Hà Nội",
    status: "active" as "active" | "inactive",
    licenseImages: [] as string[],
    frontImages: [] as string[],
    sideImages: [] as string[],
    registrationFrontImages: [] as string[],
    registrationBackImages: [] as string[],
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Authorization Check on Mount
  useEffect(() => {
    const saved = localStorage.getItem("txpro_user_session");
    const savedToken = localStorage.getItem("txpro_token");
    setToken(savedToken);

    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.rawRole === "admin" || session.role === "Admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  // Load Catalog Options (Vehicle tree & Cargo types) matching mobile Flutter
  useEffect(() => {
    const fetchCatalogOptions = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/chu-hang/find-vehicle/options`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (Array.isArray(data.cargoTypes) && data.cargoTypes.length > 0) {
            const mapped = data.cargoTypes
              .map((c: any) => String(c || "").trim())
              .filter((c: string) => c.length > 0);
            if (mapped.length > 0) {
              setCargoTypeOptions(Array.from(new Set([...FALLBACK_CARGO_TYPES, ...mapped])));
            }
          }
          if (Array.isArray(data.vehicleTree) && data.vehicleTree.length > 0) {
            const rawTree: VehicleCatalogItem[] = data.vehicleTree;
            const hasXeTai = rawTree.some((v) => v.name.toLowerCase() === "xe tải");
            if (hasXeTai) {
              setVehicleCatalogTree(rawTree);
            } else {
              const truckChildren: VehicleCatalogItem[] = [];
              const otherChildren: VehicleCatalogItem[] = [];
              for (const item of rawTree) {
                if (item.name.toLowerCase().includes("xe tải") || item.name.toLowerCase().includes("thùng")) {
                  truckChildren.push(item);
                } else {
                  otherChildren.push(item);
                }
              }
              const xeTaiParent: VehicleCatalogItem = {
                name: "Xe tải",
                key: "vehicle.truck",
                children: truckChildren.length > 0 ? truckChildren : FALLBACK_VEHICLE_TREE[0].children,
              };
              setVehicleCatalogTree([xeTaiParent, ...otherChildren]);
            }
          }
        }
      } catch {
        // Fallback already pre-set
      }
    };
    fetchCatalogOptions();
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(pageSize),
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(kycFilter ? { kycStatus: kycFilter } : {})
    });

    let responseOk = false;
    let errorResponseMsg = "";

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users?${queryParams.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data.users.filter((user: User) => user.role !== "admin"));
        setPagination(data.data.pagination);
        setIsOffline(false);
        responseOk = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        errorResponseMsg = errData.message || "Không thể tải danh sách người dùng từ hệ thống.";
      }
    } catch (err: any) {
      console.warn("Backend connection error:", err);
      setUsers([]);
      setPagination({
        page: currentPage,
        limit: pageSize,
        total: 0,
        pages: 1
      });
      errorResponseMsg = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ backend.";
    } finally {
      setLoading(false);
      if (!responseOk && errorResponseMsg) {
        setErrorMsg(errorResponseMsg);
      }
    }
  };

  // Fetch Order and Financial Statistics (Real aggregation from backend)
  const fetchOrderStats = async () => {
    setLoadingOrderStats(true);
    try {
      // 1. Fetch overview
      let overviewData: any = null;
      try {
        const resOverview = await fetchWithAuth(`${API_BASE}/admin/users/overview`);
        if (resOverview.ok) {
          const json = await resOverview.json();
          overviewData = json.data?.metrics || json.metrics || null;
        }
      } catch (err) {
        console.warn("Could not fetch overview metrics:", err);
      }

      // 2. Fetch recent orders for aggregation (limit: 500)
      let ordersList: any[] = [];
      try {
        const resOrders = await fetchWithAuth(`${API_BASE}/admin/users/orders?limit=500`);
        if (resOrders.ok) {
          const json = await resOrders.json();
          ordersList = json.data?.orders || json.orders || [];
        }
      } catch (err) {
        console.warn("Could not fetch orders list:", err);
      }

      // 3. Compute stats strictly from real data
      const statsMap: Record<string, UserOrderStat> = {};
      let totalGMV = 0;
      let completedTurnover = 0;
      let completedOrdersCount = 0;
      let activeOrdersCount = 0;

      if (ordersList.length > 0) {
        for (const ord of ordersList) {
          const price = getOrderPrice(ord);
          totalGMV += price;

          const isCompleted = ["completed", "delivered", "settled"].includes(ord.status);
          const isActive = ["in_progress", "delivering", "in_transit", "accepted", "matched", "searching_driver", "waiting_driver", "pending"].includes(ord.status);
          const isCancelled = ["cancelled", "rejected"].includes(ord.status);

          if (isCompleted) {
            completedTurnover += price;
            completedOrdersCount++;
          } else if (isActive) {
            activeOrdersCount++;
          }

          // Aggregate for shipper
          const shipperId = typeof ord.shipperId === "object" && ord.shipperId ? ord.shipperId._id : ord.shipperId;
          if (shipperId) {
            if (!statsMap[shipperId]) {
              statsMap[shipperId] = {
                orderCount: 0,
                completedCount: 0,
                activeCount: 0,
                cancelledCount: 0,
                totalAmount: 0,
                completedAmount: 0,
              };
            }
            statsMap[shipperId].orderCount++;
            statsMap[shipperId].totalAmount += price;
            if (isCompleted) {
              statsMap[shipperId].completedCount++;
              statsMap[shipperId].completedAmount += price;
            } else if (isActive) {
              statsMap[shipperId].activeCount++;
            } else if (isCancelled) {
              statsMap[shipperId].cancelledCount++;
            }
          }

          // Aggregate for driver
          const driverId = typeof ord.driverId === "object" && ord.driverId ? ord.driverId._id : ord.driverId;
          if (driverId) {
            if (!statsMap[driverId]) {
              statsMap[driverId] = {
                orderCount: 0,
                completedCount: 0,
                activeCount: 0,
                cancelledCount: 0,
                totalAmount: 0,
                completedAmount: 0,
              };
            }
            statsMap[driverId].orderCount++;
            statsMap[driverId].totalAmount += price;
            if (isCompleted) {
              statsMap[driverId].completedCount++;
              statsMap[driverId].completedAmount += price;
            } else if (isActive) {
              statsMap[driverId].activeCount++;
            } else if (isCancelled) {
              statsMap[driverId].cancelledCount++;
            }
          }
        }
      }

      setUserOrderStatsMap(statsMap);

      const totalUsersCount = overviewData?.totalUsers ?? users.length;
      const totalDriversCount = overviewData?.totalDrivers ?? users.filter(u => u.role === "tai-xe").length;
      const totalShippersCount = overviewData?.totalShippers ?? users.filter(u => u.role === "chu-hang").length;
      const totalOrdersCount = overviewData?.totalOrders ?? ordersList.length;

      const finalGMV = totalGMV;
      const finalCompletedTurnover = completedTurnover;
      const finalEstimatedFee = Math.round(finalCompletedTurnover * 0.1);

      setSystemOrderStats({
        totalUsers: totalUsersCount,
        totalDrivers: totalDriversCount,
        totalShippers: totalShippersCount,
        totalOrders: totalOrdersCount,
        totalGMV: finalGMV,
        completedTurnover: finalCompletedTurnover,
        estimatedFee: finalEstimatedFee,
        completedOrdersCount: completedOrdersCount,
        activeOrdersCount: activeOrdersCount,
      });
    } catch (e) {
      console.warn("Error fetching order stats:", e);
    } finally {
      setLoadingOrderStats(false);
    }
  };

  // Open User Orders and Financial Detail Modal
  const handleOpenUserOrdersModal = async (user: User) => {
    setSelectedUserForOrders(user);
    setUserOrdersStatusFilter("all");
    setUserOrdersSearch("");
    setShowUserOrdersModal(true);
    setLoadingUserOrders(true);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/orders`);
      if (res.ok) {
        const json = await res.json();
        const orders = json.data?.orders || json.orders || [];
        setUserOrdersList(orders);
      } else {
        setUserOrdersList([]);
      }
    } catch (err) {
      console.warn("Could not fetch user orders:", err);
      setUserOrdersList([]);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      fetchUsers();
      fetchOrderStats();
    }
  }, [isAdmin, currentPage, pageSize, search, roleFilter, statusFilter, kycFilter, token]);

  // Toast handler helper
  const showToast = (success: boolean, msg: string) => {
    if (success) {
      toast.success(msg);
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      toast.error(msg);
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Add User submit handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast(false, "Vui lòng nhập Họ tên");
    if (!formData.phone.trim() && !formData.email.trim()) return showToast(false, "Vui lòng nhập Số điện thoại hoặc Email");
    if (!formData.password) return showToast(false, "Vui lòng nhập Mật khẩu ban đầu");

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast(true, "Tạo tài khoản thành công");
        setShowAddModal(false);
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Lỗi tạo tài khoản");
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Close Edit Modal & cleanup any created blob URLs
  const handleCloseEditModal = () => {
    if (kycDetails?.documents) {
      kycDetails.documents.forEach((doc) => {
        if (doc.isBlob && doc.url) {
          URL.revokeObjectURL(doc.url);
        }
      });
    }
    setShowEditModal(false);
    setKycDetails(null);
  };

  // Open Edit modal & load user's KYC verification data
  const handleOpenEditModal = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      phone: user.phone || "",
      email: user.email || "",
      password: "",
      role: user.role === "admin" ? "chu-hang" : user.role,
      isActive: user.isActive,
      language: user.language,
      kycStatus: user.kycStatus
    });
    setEditModalTab("ekyc");
    setShowEditModal(true);
    loadKycDetails(user);
    if (user.role === "tai-xe") {
      loadUserVehicles(user._id);
    } else {
      setUserVehicles([]);
    }
  };

  // Load vehicles for a driver (real data from API)
  const loadUserVehicles = async (userId: string) => {
    setLoadingVehicles(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/vehicles`);
      if (res.ok) {
        const data = await res.json();
        setUserVehicles(data.data?.vehicles || []);
      } else {
        setUserVehicles([]);
      }
    } catch (err) {
      console.warn("Could not load user vehicles", err);
      setUserVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Open modal to add a new vehicle
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    const initialCargo = ["Hàng thực phẩm / nông sản"];
    setSelectedCargoTypes(initialCargo);
    setVehicleForm({
      plateNumber: "",
      type: "Xe tải thùng bạt",
      vehicleTypeParent: "Xe tải",
      vehicleTypeChild: "Xe tải thùng bạt",
      seats: "",
      ownerName: currentUser?.name || "",
      brand: "Hyundai",
      model: initialCargo.join(", "),
      capacity: "5",
      capacityUnit: "tan",
      length: "5.2",
      width: "2.1",
      height: "2.2",
      operatingProvinceName: "Hà Nội",
      status: "active",
      licenseImages: [],
      frontImages: [],
      sideImages: [],
      registrationFrontImages: [],
      registrationBackImages: [],
    });
    setUploadingCategory(null);
    setActiveUrlCategory(null);
    setCategoryUrlInput("");
    setIsCargoDropdownOpen(false);
    setShowVehicleModal(true);
  };

  // Open modal to edit existing vehicle
  const handleOpenEditVehicle = (veh: VehicleItem) => {
    setEditingVehicle(veh);

    // Resolve parent & child from veh
    let resolvedParent = veh.vehicleTypeParent || "";
    let resolvedChild = veh.vehicleTypeChild || "";
    const rawType = (veh.type || "").toLowerCase();

    if (!resolvedParent) {
      if (rawType.includes("tai") || rawType.includes("thung") || rawType.includes("tải") || rawType.includes("thùng")) {
        resolvedParent = "Xe tải";
      } else if (rawType.includes("oto") || rawType.includes("ô tô") || veh.seats) {
        resolvedParent = "Ô tô";
      } else if (rawType.includes("container") || rawType.includes("kéo")) {
        resolvedParent = "Container / xe đầu kéo";
      } else if (rawType.includes("cẩu") || rawType.includes("cau")) {
        resolvedParent = "Xe cẩu tự hành";
      } else if (rawType.includes("công trình") || rawType.includes("cong-trinh")) {
        resolvedParent = "Các xe công trình";
      } else if (rawType.includes("van") || rawType.includes("bán tải")) {
        resolvedParent = "Xe van / ô tô bán tải";
      } else {
        const directMatch = vehicleCatalogTree.find((v) => v.name.toLowerCase() === rawType);
        resolvedParent = directMatch?.name || "Xe tải";
      }
    }

    if (!resolvedChild) {
      const parentNode = vehicleCatalogTree.find((v) => v.name.toLowerCase() === resolvedParent.toLowerCase());
      const childMatch = parentNode?.children?.find((c) => c.name.toLowerCase() === rawType);
      if (childMatch) {
        resolvedChild = childMatch.name;
      } else if (parentNode && parentNode.children && parentNode.children.length > 0) {
        resolvedChild = parentNode.children[0].name;
      }
    }

    const capabilities = getVehicleCapabilities({
      vehicleTypeParent: resolvedParent,
      vehicleTypeChild: resolvedChild,
      type: veh.type || resolvedChild || resolvedParent,
    });

    const parsedCargo = Array.isArray(veh.cargoTypes) && veh.cargoTypes.length > 0
      ? veh.cargoTypes
      : veh.model
      ? veh.model.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : [];

    const activeCargo = capabilities.hasCargoTypes
      ? (parsedCargo.length > 0 ? parsedCargo : ["Hàng thực phẩm / nông sản"])
      : [];
    setSelectedCargoTypes(activeCargo);

    const parsedImages = parseVehicleImageGroups(veh.licenseImages || []);

    setVehicleForm({
      plateNumber: veh.plateNumber || "",
      type: veh.type || resolvedChild || resolvedParent,
      vehicleTypeParent: resolvedParent,
      vehicleTypeChild: resolvedChild,
      seats: capabilities.hasSeats ? (veh.seats ? String(veh.seats) : "4") : "",
      ownerName: veh.ownerName || "",
      brand: veh.brand || "Hyundai",
      model: capabilities.hasCargoTypes ? (activeCargo.join(", ") || veh.model || "") : (veh.model || ""),
      capacity: capabilities.hasCapacity ? (veh.capacity !== null && veh.capacity !== undefined ? String(veh.capacity) : "5") : "",
      capacityUnit: "tan",
      length: capabilities.hasCapacity && veh.dimensions?.length ? String(veh.dimensions.length) : (capabilities.hasCapacity ? "5.2" : ""),
      width: capabilities.hasCapacity && veh.dimensions?.width ? String(veh.dimensions.width) : (capabilities.hasCapacity ? "2.1" : ""),
      height: capabilities.hasCapacity && veh.dimensions?.height ? String(veh.dimensions.height) : (capabilities.hasCapacity ? "2.2" : ""),
      operatingProvinceName: veh.operatingProvinceName || "Hà Nội",
      status: veh.status || "active",
      licenseImages: Array.isArray(veh.licenseImages) ? [...veh.licenseImages] : [],
      frontImages: parsedImages.frontImages,
      sideImages: parsedImages.sideImages,
      registrationFrontImages: parsedImages.registrationFrontImages,
      registrationBackImages: parsedImages.registrationBackImages,
    });
    setUploadingCategory(null);
    setActiveUrlCategory(null);
    setCategoryUrlInput("");
    setIsCargoDropdownOpen(false);
    setShowVehicleModal(true);
  };

  // Vehicle catalog & cargo helpers (aligned with mobile Flutter)
  const handleParentTypeChange = (newParent: string) => {
    const found = vehicleCatalogTree.find((v) => v.name.toLowerCase() === newParent.toLowerCase());
    let defaultChild = "";
    let defaultSeats = "";
    if (found && found.children && found.children.length > 0) {
      defaultChild = found.children[0].name;
      if (found.children[0].seats) {
        defaultSeats = String(found.children[0].seats);
      }
    }
    const capabilities = getVehicleCapabilities({
      vehicleTypeParent: newParent,
      vehicleTypeChild: defaultChild,
      type: defaultChild || newParent,
    });

    const updatedCargo = capabilities.hasCargoTypes
      ? (selectedCargoTypes.length > 0 ? selectedCargoTypes : ["Hàng thực phẩm / nông sản"])
      : [];
    setSelectedCargoTypes(updatedCargo);

    setVehicleForm((prev) => ({
      ...prev,
      type: defaultChild || newParent,
      vehicleTypeParent: newParent,
      vehicleTypeChild: defaultChild,
      seats: capabilities.hasSeats ? (defaultSeats || prev.seats || "4") : "",
      capacity: capabilities.hasCapacity ? (prev.capacity || "5") : "",
      length: capabilities.hasCapacity ? (prev.length || "5.2") : "",
      width: capabilities.hasCapacity ? (prev.width || "2.1") : "",
      height: capabilities.hasCapacity ? (prev.height || "2.2") : "",
      model: capabilities.hasCargoTypes ? updatedCargo.join(", ") : "",
    }));
  };

  const handleChildTypeChange = (newChild: string) => {
    const currentParent = vehicleCatalogTree.find(
      (v) => v.name.toLowerCase() === (vehicleForm.vehicleTypeParent || "").toLowerCase()
    );
    const foundChild = currentParent?.children?.find((c) => c.name === newChild);
    const seatsVal = foundChild?.seats ? String(foundChild.seats) : vehicleForm.seats;
    const capabilities = getVehicleCapabilities({
      vehicleTypeParent: vehicleForm.vehicleTypeParent,
      vehicleTypeChild: newChild,
      type: newChild || vehicleForm.vehicleTypeParent,
    });

    setVehicleForm((prev) => ({
      ...prev,
      type: newChild || prev.vehicleTypeParent,
      vehicleTypeChild: newChild,
      seats: capabilities.hasSeats ? (seatsVal || "4") : "",
      capacity: capabilities.hasCapacity ? prev.capacity : "",
    }));
  };

  const handleToggleCargoType = (cargo: string) => {
    let updated: string[];
    if (selectedCargoTypes.includes(cargo)) {
      updated = selectedCargoTypes.filter((c) => c !== cargo);
    } else {
      updated = [...selectedCargoTypes, cargo];
    }
    setSelectedCargoTypes(updated);
    setVehicleForm((prev) => ({ ...prev, model: updated.join(", ") }));
  };

  const handleSelectAllCargo = () => {
    setSelectedCargoTypes(cargoTypeOptions);
    setVehicleForm((prev) => ({ ...prev, model: cargoTypeOptions.join(", ") }));
  };

  const handleClearAllCargo = () => {
    setSelectedCargoTypes([]);
    setVehicleForm((prev) => ({ ...prev, model: "" }));
  };

  // Save vehicle (create or update)
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vehicleForm.plateNumber.trim()) {
      showToast(false, "Vui lòng nhập biển số xe");
      return;
    }

    setSavingVehicle(true);
    const capabilities = getVehicleCapabilities(vehicleForm);
    const capacityVal = capabilities.hasCapacity && vehicleForm.capacity ? Number(vehicleForm.capacity) : null;
    const finalCapacity = capacityVal !== null && vehicleForm.capacityUnit === "kg" 
      ? capacityVal / 1000 
      : capacityVal;

    const cargoString = capabilities.hasCargoTypes && selectedCargoTypes.length > 0 
      ? selectedCargoTypes.join(", ") 
      : capabilities.hasCargoTypes ? vehicleForm.model.trim() || null : null;

    const allLicenseImages = [
      ...vehicleForm.frontImages,
      ...vehicleForm.sideImages,
      ...vehicleForm.registrationFrontImages,
      ...vehicleForm.registrationBackImages,
    ]
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .map(normalizePersistedImagePath);

    const payload = {
      plateNumber: vehicleForm.plateNumber.trim().toUpperCase(),
      type: vehicleForm.vehicleTypeChild || vehicleForm.vehicleTypeParent || vehicleForm.type,
      vehicleTypeParent: vehicleForm.vehicleTypeParent || null,
      vehicleTypeChild: vehicleForm.vehicleTypeChild || null,
      seats: capabilities.hasSeats ? (vehicleForm.seats ? Number(vehicleForm.seats) : null) : null,
      ownerName: vehicleForm.ownerName.trim() || null,
      brand: vehicleForm.brand.trim() || "Khác",
      model: cargoString,
      cargoTypes: capabilities.hasCargoTypes ? selectedCargoTypes : [],
      capacity: finalCapacity,
      dimensions: capabilities.hasCapacity ? {
        length: vehicleForm.length ? Number(vehicleForm.length) : null,
        width: vehicleForm.width ? Number(vehicleForm.width) : null,
        height: vehicleForm.height ? Number(vehicleForm.height) : null,
      } : null,
      operatingProvinceName: vehicleForm.operatingProvinceName.trim() || null,
      status: vehicleForm.status,
      licenseImages: allLicenseImages.length > 0 
        ? allLicenseImages 
        : vehicleForm.licenseImages.map(normalizePersistedImagePath).filter(Boolean),
    };

    try {
      const isEdit = !!editingVehicle;
      const url = isEdit
        ? `${API_BASE}/admin/users/${currentUser._id}/vehicles/${editingVehicle._id}`
        : `${API_BASE}/admin/users/${currentUser._id}/vehicles`;

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(true, isEdit ? "Cập nhật phương tiện thành công" : "Thêm phương tiện thành công");
        await loadUserVehicles(currentUser._id);
        setShowVehicleModal(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Không thể lưu phương tiện");
      }
    } catch (err: any) {
      showToast(false, err.message || "Lỗi lưu phương tiện");
    } finally {
      setSavingVehicle(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!currentUser) return;
    if (!confirm("Bạn có chắc chắn muốn xóa phương tiện này khỏi danh sách của tài xế?")) return;

    try {
      const url = `${API_BASE}/admin/users/${currentUser._id}/vehicles/${vehicleId}`;
      const res = await fetchWithAuth(url, { method: "DELETE" });

      if (res.ok) {
        await loadUserVehicles(currentUser._id);
        showToast(true, "Đã xóa phương tiện thành công");
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Không thể xóa phương tiện");
      }
    } catch (err: any) {
      showToast(false, err.message || "Lỗi xóa phương tiện");
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Upload & update user avatar (accessible from both vehicle modal and user edit modal)
  const handleUploadUserAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const uploadUrl = `${API_BASE}/common/upload`;
      const res = await fetchWithAuth(uploadUrl, {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.data?.url || data.url;
        if (uploadedUrl) {
          const normalized = normalizePersistedImagePath(uploadedUrl);
          const updateUrl = `${API_BASE}/admin/users/${currentUser._id}`;
          await fetchWithAuth(updateUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: normalized }),
          });

          setCurrentUser((prev) => (prev ? { ...prev, avatar: normalized } : null));
          setUsers((prev) =>
            prev.map((u) => (u._id === currentUser._id ? { ...u, avatar: normalized } : u))
          );
          showToast(true, "Cập nhật ảnh đại diện thành công");
        }
      } else {
        showToast(false, "Không thể tải lên ảnh đại diện");
      }
    } catch (err: any) {
      showToast(false, err.message || "Lỗi khi cập nhật avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Upload image for a specific vehicle category
  const handleUploadCategoryPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: VehicleImageCategoryKey
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(category);
    try {
      const form = new FormData();
      form.append("file", file);

      const uploadUrl = `${API_BASE}/common/upload`;
      const res = await fetchWithAuth(uploadUrl, {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.data?.url || data.url;
        if (uploadedUrl) {
          // Normalize to relative /uploads/... so it matches mobile and syncs perfectly across platforms
          const normalized = normalizePersistedImagePath(uploadedUrl);
          setVehicleForm((prev) => ({
            ...prev,
            [category]: [...prev[category], normalized],
            licenseImages: [...prev.licenseImages, normalized],
          }));
        }
      } else {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const b64 = uploadEvent.target?.result as string;
          if (b64) {
            setVehicleForm((prev) => ({
              ...prev,
              [category]: [...prev[category], b64],
              licenseImages: [...prev.licenseImages, b64],
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const b64 = uploadEvent.target?.result as string;
        if (b64) {
          setVehicleForm((prev) => ({
            ...prev,
            [category]: [...prev[category], b64],
            licenseImages: [...prev.licenseImages, b64],
          }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCategory(null);
      e.target.value = "";
    }
  };

  // Add image by URL for a specific category
  const handleAddCategoryUrl = (category: VehicleImageCategoryKey) => {
    const trimmed = categoryUrlInput.trim();
    if (!trimmed) return;
    const normalized = normalizePersistedImagePath(trimmed);
    setVehicleForm((prev) => ({
      ...prev,
      [category]: [...prev[category], normalized],
      licenseImages: [...prev.licenseImages, normalized],
    }));
    setCategoryUrlInput("");
    setActiveUrlCategory(null);
  };

  // Remove vehicle image from a category
  const handleRemoveCategoryPhoto = (category: VehicleImageCategoryKey, index: number) => {
    setVehicleForm((prev) => {
      const updatedCategory = prev[category].filter((_, i) => i !== index);
      return {
        ...prev,
        [category]: updatedCategory,
      };
    });
  };

  // Load KYC verification documents and identity details
  const loadKycDetails = async (user: User) => {
    setLoadingKyc(true);
    if (kycDetails?.documents) {
      kycDetails.documents.forEach((doc) => {
        if (doc.isBlob && doc.url) {
          URL.revokeObjectURL(doc.url);
        }
      });
    }
    setKycDetails(null);

    try {
      // Live Backend fetch

      // Live Backend fetch
      // 1. Fetch Kyc Submissions
      let submission: any = null;
      try {
        const subRes = await fetchWithAuth(`${API_BASE}/admin/users/kyc-submissions?userId=${user._id}&limit=1`);
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData?.data?.submissions && subData.data.submissions.length > 0) {
            submission = subData.data.submissions[0];
          }
        }
      } catch (e) {
        console.warn("Could not fetch KYC submission:", e);
      }

      // 2. Fetch User Detail (for fallback kycData/portraitImage)
      let userDetail: any = null;
      try {
        const userRes = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}`);
        if (userRes.ok) {
          const uData = await userRes.json();
          userDetail = uData?.data?.user;
        }
      } catch (e) {
        console.warn("Could not fetch user details for KYC:", e);
      }

      const docItems: KycDocumentItem[] = [];

      // Helper to fetch blob for protected document preview
      const fetchDocBlobUrl = async (subId: string, docType: string): Promise<string | null> => {
        try {
          const previewUrl = `${API_BASE}/admin/users/kyc-submissions/${subId}/documents/${docType}/preview`;
          const res = await fetchWithAuth(previewUrl);
          if (res.ok) {
            const blob = await res.blob();
            return URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn(`Failed to fetch preview for ${docType}:`, e);
        }
        return null;
      };

      // cccdFront
      let cccdFrontUrl: string | null = null;
      if (submission?._id && submission?.documents?.cccdFront?.storageKey) {
        cccdFrontUrl = await fetchDocBlobUrl(submission._id, "cccdFront");
      } else if (userDetail?.kycData?.idCardFrontImage) {
        cccdFrontUrl = getServerMediaUrl(userDetail.kycData.idCardFrontImage);
      }
      docItems.push({
        type: "cccdFront",
        label: "CCCD Mặt trước",
        url: cccdFrontUrl,
        isBlob: !!cccdFrontUrl && cccdFrontUrl.startsWith("blob:"),
        status: cccdFrontUrl ? "available" : "missing"
      });

      // cccdBack
      let cccdBackUrl: string | null = null;
      if (submission?._id && submission?.documents?.cccdBack?.storageKey) {
        cccdBackUrl = await fetchDocBlobUrl(submission._id, "cccdBack");
      } else if (userDetail?.kycData?.idCardBackImage) {
        cccdBackUrl = getServerMediaUrl(userDetail.kycData.idCardBackImage);
      }
      docItems.push({
        type: "cccdBack",
        label: "CCCD Mặt sau",
        url: cccdBackUrl,
        isBlob: !!cccdBackUrl && cccdBackUrl.startsWith("blob:"),
        status: cccdBackUrl ? "available" : "missing"
      });

      // portrait
      let portraitUrl: string | null = null;
      if (submission?._id && submission?.documents?.portrait?.storageKey) {
        portraitUrl = await fetchDocBlobUrl(submission._id, "portrait");
      } else if (userDetail?.kycData?.portraitImage) {
        portraitUrl = getServerMediaUrl(userDetail.kycData.portraitImage);
      } else if (userDetail?.portraitImage || user.portraitImage) {
        portraitUrl = getServerMediaUrl(userDetail?.portraitImage || user.portraitImage);
      } else if (userDetail?.avatar || user.avatar) {
        portraitUrl = getServerMediaUrl(userDetail?.avatar || user.avatar);
      }
      docItems.push({
        type: "portrait",
        label: "Ảnh chân dung khuôn mặt",
        url: portraitUrl,
        isBlob: !!portraitUrl && portraitUrl.startsWith("blob:"),
        status: portraitUrl ? "available" : "missing"
      });

      // gplxFront (Giấy phép lái xe - tài xế)
      let gplxUrl: string | null = null;
      if (submission?._id && submission?.documents?.gplxFront?.storageKey) {
        gplxUrl = await fetchDocBlobUrl(submission._id, "gplxFront");
      }
      if (user.role === "tai-xe" || formData.role === "tai-xe" || gplxUrl) {
        docItems.push({
          type: "gplxFront",
          label: "Bằng lái xe (GPLX)",
          url: gplxUrl,
          isBlob: !!gplxUrl && gplxUrl.startsWith("blob:"),
          status: gplxUrl ? "available" : "missing"
        });
      }

      const identity = submission?.identity || userDetail?.kycData || null;

      setKycDetails({
        submissionId: submission?._id || null,
        status: submission?.status || user.kycStatus,
        role: submission?.role || user.role,
        submittedAt: submission?.submittedAt || submission?.createdAt || null,
        identity: identity ? {
          fullName: identity.fullName || user.name,
          idNumber: identity.idNumber || null,
          dateOfBirth: identity.dateOfBirth || null,
          gender: identity.gender || null,
          nationality: identity.nationality || "VN",
          permanentAddress: identity.permanentAddress || null,
          issueDate: identity.issueDate || null,
          expiryDate: identity.expiryDate || null,
        } : null,
        documents: docItems
      });
    } catch (err) {
      console.error("Error loading KYC details:", err);
    } finally {
      setLoadingKyc(false);
    }
  };

  // Edit User submit handler (PUT edits name/language, PATCH edits role, PATCH edits kycStatus)
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      // 1. Update Profile (Name, Language)
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          language: formData.language
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Lỗi cập nhật người dùng");
      }

      // 2. If Role changed, update role
      if (formData.role !== currentUser.role) {
        const roleRes = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}/role`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            role: formData.role
          })
        });

        if (!roleRes.ok) {
          const roleErr = await roleRes.json().catch(() => ({}));
          throw new Error(roleErr.message || "Lỗi cập nhật vai trò người dùng");
        }
      }

      // 3. If KYC status changed, update KYC status
      if (formData.kycStatus !== currentUser.kycStatus) {
        const kycRes = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}/kyc-status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            kycStatus: formData.kycStatus
          })
        });

        if (!kycRes.ok) {
          const kycErr = await kycRes.json().catch(() => ({}));
          throw new Error(kycErr.message || "Lỗi cập nhật trạng thái KYC");
        }
      }

      showToast(true, "Cập nhật thông tin thành công");
      handleCloseEditModal();
      fetchUsers();
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (showChatModal) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatModal]);

  // Open Chat with specific user
  const handleOpenChat = async (user: User) => {
    setChatTargetUser(user);
    setShowChatModal(true);
    setChatLoading(true);
    setMessageInput("");
    setChatMessages([]);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/chat`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.data.messages || []);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.warn("Could not load chat messages", err);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  // Send message to specific user
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !chatTargetUser || sendingMessage) return;

    const content = messageInput.trim();
    setSendingMessage(true);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${chatTargetUser._id}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.data.message]);
        setMessageInput("");
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể gửi tin nhắn");
      }
    } catch (err: any) {
      showToast(false, err.message || "Lỗi gửi tin nhắn");
    } finally {
      setSendingMessage(false);
    }
  };

  const isFromAdmin = (msg: any) => {
    if (msg.isSelf) return true;
    const role = msg.senderId?.role || msg.senderRole;
    if (role === "admin" || role === "assistant") return true;
    const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    return senderId !== chatTargetUser?._id;
  };

  // Toggle user active status
  const handleToggleStatus = async (user: User) => {
    const nextActiveState = !user.isActive;
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive: nextActiveState })
      });

      if (res.ok) {
        showToast(true, `Cập nhật trạng thái thành công`);
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Lỗi cập nhật trạng thái");
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Change user role
  const handleChangeRole = async (user: User, newRole: ManagedUserRole) => {
    if (user.role === newRole) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        showToast(true, `Đổi vai trò thành công`);
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Lỗi cập nhật vai trò");
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này?")) return;

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showToast(true, "Đã xóa tài khoản thành công");
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Không thể xóa tài khoản");
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Reset user password directly as admin
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newPassword || newPassword.length < 6) {
      return showToast(false, "Mật khẩu mới phải từ 6 ký tự trở lên");
    }

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newPassword: newPassword })
      });

      if (res.ok) {
        showToast(true, `Đã reset mật khẩu của ${currentUser.name}`);
        setShowPasswordModal(false);
        setNewPassword("");
      } else {
        const data = await res.json();
        throw new Error(data.message || "Lỗi đổi mật khẩu");
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  return (
    <>
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <AlertTriangle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      <div className="space-y-6 min-w-0 max-w-full">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Danh Sách Thành Viên
              {isOffline && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Chế độ offline
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Quản lý phân quyền, kiểm tra trạng thái hoạt động và bảo mật tài khoản thành viên hệ thống.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: "",
                phone: "",
                email: "",
                password: "",
                role: "chu-hang",
                isActive: true,
                language: "vi",
                kycStatus: "draft"
              });
              setShowAddModal(true);
            }}
            className="btn-primary py-3 px-5 text-xs font-bold flex items-center gap-2 rounded-2xl shadow-lg shadow-primary-200 transition-all hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4" /> Thêm Người Dùng
          </button>
        </div>

        {/* 5 Top-Level KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Tổng Thành Viên */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng thành viên</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {systemOrderStats.totalUsers.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">người</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Tài xế: <strong className="text-emerald-600 font-bold">{systemOrderStats.totalDrivers}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Chủ hàng: <strong className="text-blue-600 font-bold">{systemOrderStats.totalShippers}</strong></span>
            </div>
          </div>

          {/* Card 2: Tổng Đơn Hệ Thống */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng đơn vận chuyển</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {systemOrderStats.totalOrders.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">chuyến/đơn</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Hoàn thành: <strong className="text-emerald-600 font-bold">{systemOrderStats.completedOrdersCount}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Đang chạy: <strong className="text-blue-600 font-bold">{systemOrderStats.activeOrdersCount}</strong></span>
            </div>
          </div>

          {/* Card 3: Tổng Giá Trị Giao Dịch (GMV) */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng GD cước (GMV)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 truncate" title={systemOrderStats.totalGMV.toLocaleString("vi-VN") + " ₫"}>
                {formatCompactCurrency(systemOrderStats.totalGMV)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Toàn hệ thống</span>
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Tăng trưởng
              </span>
            </div>
          </div>

          {/* Card 4: Cước Đã Quyết Toán */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cước đã quyết toán</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-purple-900 truncate" title={systemOrderStats.completedTurnover.toLocaleString("vi-VN") + " ₫"}>
                {formatCompactCurrency(systemOrderStats.completedTurnover)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Đã giao thành công</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                {systemOrderStats.totalOrders > 0 ? Math.round((systemOrderStats.completedOrdersCount / systemOrderStats.totalOrders) * 100) : 0}% tỉ lệ
              </span>
            </div>
          </div>

          {/* Card 5: Phí Sàn Ước Tính */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Ước tính phí sàn (10%)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-amber-900 truncate" title={systemOrderStats.estimatedFee.toLocaleString("vi-VN") + " ₫"}>
                {formatCompactCurrency(systemOrderStats.estimatedFee)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Doanh thu nền tảng</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                Phí dịch vụ
              </span>
            </div>
          </div>
        </div>

          {/* Filters Bar */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-6 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <input
                type="text"
                placeholder="Tìm theo họ tên, số điện thoại, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Role Select */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-44 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Tất cả Vai trò</option>
                  <option value="tai-xe">Tài Xế</option>
                  <option value="chu-hang">Chủ Hàng</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Select */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-44 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Tất cả Trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã bị khóa</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* KYC Status Filter */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={kycFilter}
                  onChange={(e) => {
                    setKycFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-48 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Tất cả KYC</option>
                  <option value="verified">Đã xác minh (Pass)</option>
                  <option value="pending_review">Chờ duyệt (Pending)</option>
                  <option value="rejected">Bị từ chối</option>
                  <option value="draft">Chưa gửi (Draft)</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Page Size Filter */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-36 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
                  title="Số dòng hiển thị mỗi trang"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                  <option value={100}>100 / trang</option>
                </select>
                <Layers className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden w-full max-w-full">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-slate-400 text-xs mt-4">Đang tải danh sách tài khoản...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <Search className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">Không tìm thấy người dùng phù hợp</p>
                <p className="text-xs">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <>
                {/* Mobile Scroll Hint Banner */}
                <div className="md:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Danh sách thành viên</span>
                  <span className="text-primary-600 font-bold flex items-center gap-1">
                    ← Kéo qua lại để xem đủ cột →
                  </span>
                </div>

                <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[1060px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        <th className="py-4 px-6 whitespace-nowrap min-w-[200px]">Họ và Tên</th>
                        <th className="py-4 px-6 whitespace-nowrap min-w-[160px]">Số điện thoại / Email</th>
                        <th className="py-4 px-6 whitespace-nowrap min-w-[130px]">Vai trò</th>
                        <th className="py-4 px-6 whitespace-nowrap min-w-[210px]">Đơn & Tiền Giao Dịch</th>
                        <th className="py-4 px-6 whitespace-nowrap min-w-[140px]">Xác minh eKYC</th>
                        <th className="py-4 px-6 whitespace-nowrap min-w-[130px]">Ngày Tạo</th>
                        <th className="py-4 px-6 text-center whitespace-nowrap min-w-[100px]">Trạng thái</th>
                        <th className="py-4 px-6 text-right whitespace-nowrap min-w-[180px]">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                      {users.map((user) => {
                        const avatarUrl = getUserAvatarUrl(user);
                        return (
                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Name */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-primary-50 text-primary-600 rounded-full font-bold flex items-center justify-center text-xs shadow-inner overflow-hidden ring-1 ring-slate-100 flex-shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={user.name || user.phone || "Người dùng"}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const parent = (e.target as HTMLElement).parentElement;
                                      if (parent) {
                                        parent.textContent = getUserInitials(user);
                                      }
                                    }}
                                  />
                                ) : (
                                  getUserInitials(user)
                                )}
                              </div>
                              <span className="font-bold text-slate-800">{user.name || "Người dùng TXEPRO"}</span>
                            </div>
                          </td>
                          
                          {/* Phone / Email */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-700">{user.phone || "---"}</p>
                              <p className="text-xs text-slate-400">{user.email || "---"}</p>
                            </div>
                          </td>

                          {/* Role Select & Badge */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user, e.target.value as ManagedUserRole)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none border border-slate-200 bg-white transition-all cursor-pointer ${
                                user.role === "tai-xe" 
                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                                    : "text-blue-600 bg-blue-50 border-blue-100"
                              }`}
                            >
                              <option value="chu-hang">Chủ Hàng</option>
                              <option value="tai-xe">Tài Xế</option>
                            </select>
                          </td>

                          {/* Orders & Money Activity */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            {(() => {
                              const userStats = userOrderStatsMap[user._id];
                              const isShipper = user.role === "chu-hang";
                              if (!userStats || userStats.orderCount === 0) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUserOrdersModal(user)}
                                    className="group text-left p-2 -m-2 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer block"
                                    title="Nhấn để xem chi tiết lịch sử đơn hàng"
                                  >
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200 group-hover:bg-slate-100">
                                      Chưa có dữ liệu
                                    </span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenUserOrdersModal(user)}
                                  className="group text-left p-2 -m-2 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer block"
                                  title="Nhấn để xem chi tiết danh sách đơn hàng & dòng tiền"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                      isShipper 
                                        ? "bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-100" 
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100"
                                    }`}>
                                      {isShipper ? <Package className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                                      <span>{userStats.orderCount} {isShipper ? "đơn tạo" : "chuyến"}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      ({userStats.completedCount} xong)
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                                      {formatCurrency(userStats.totalAmount, true)}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-1 rounded ${
                                      isShipper ? "text-blue-600 bg-blue-50" : "text-emerald-600 bg-emerald-50"
                                    }`}>
                                      {isShipper ? "Tổng chi" : "Tổng thu"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })()}
                          </td>

                          {/* eKYC Verification Status Badge */}
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                              user.kycStatus === "verified"
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : user.kycStatus === "pending" || user.kycStatus === "pending_review"
                                  ? "text-amber-700 bg-amber-50 border-amber-200 animate-pulse"
                                  : user.kycStatus === "rejected"
                                    ? "text-red-700 bg-red-50 border-red-200"
                                    : "text-slate-500 bg-slate-50 border-slate-200"
                            }`}>
                              {user.kycStatus === "verified"
                                ? "Đã xác minh"
                                : user.kycStatus === "pending" || user.kycStatus === "pending_review"
                                  ? "Chờ duyệt"
                                  : user.kycStatus === "rejected"
                                    ? "Bị từ chối"
                                    : "Chưa gửi"}
                            </span>
                          </td>

                          {/* Created At */}
                          <td className="py-4.5 px-6 text-xs font-semibold text-slate-400 whitespace-nowrap">
                            {formatDateTime(user.createdAt)}
                          </td>

                          {/* Status Switch Toggle */}
                          <td className="py-4.5 px-6 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`transition-colors duration-200 outline-none focus:outline-none cursor-pointer ${
                                user.isActive ? "text-primary-500" : "text-slate-300"
                              }`}
                              title={user.isActive ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
                            >
                              {user.isActive ? (
                                <ToggleRight className="w-8 h-8" />
                              ) : (
                                <ToggleLeft className="w-8 h-8" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4.5 px-6 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              {/* View Orders & Financials */}
                              <button
                                onClick={() => handleOpenUserOrdersModal(user)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                title="Xem thống kê đơn & dòng tiền chi tiết"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>

                              {/* Chat With User */}
                              <button
                                onClick={() => handleOpenChat(user)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                title={`Nhắn tin với ${user.name || user.phone || 'người dùng'}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setCurrentUser(user);
                                  setNewPassword("");
                                  setShowPasswordModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                                title="Đặt lại mật khẩu"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {!loading && users.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span>
                    Hiển thị <span className="text-slate-800 font-bold">{users.length}</span> / <span className="text-slate-800 font-bold">{pagination.total}</span> tài khoản
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Trang <span className="text-slate-800 font-bold">{pagination.page}</span> / {Math.max(pagination.pages, 1)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <span className="hidden sm:inline text-slate-400">Hiển thị:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-bold focus:outline-none focus:border-primary-500 cursor-pointer shadow-sm"
                      title="Số dòng trên mỗi trang"
                    >
                      <option value={10}>10 dòng</option>
                      <option value={20}>20 dòng</option>
                      <option value={50}>50 dòng</option>
                      <option value={100}>100 dòng</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={currentPage >= pagination.pages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Thêm Người Dùng Mới</h3>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại liên hệ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập địa chỉ email"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mật khẩu từ 6 ký tự trở lên"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Vai trò */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as ManagedUserRole })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer"
                >
                  <option value="chu-hang">Chủ Hàng</option>
                  <option value="tai-xe">Tài Xế</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER & KYC MODAL --- */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl p-6 sm:p-8 relative shadow-2xl border border-slate-100 animate-scale-up max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">Chỉnh Sửa Thông Tin & eKYC</h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    formData.role === 'tai-xe' 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {formData.role === 'tai-xe' ? 'Tài Xế' : 'Chủ Hàng'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ID: <span className="font-mono text-slate-600 font-semibold">{currentUser._id}</span>
                  {currentUser.phone && <> • SĐT: <span className="text-slate-600 font-medium">{currentUser.phone}</span></>}
                  {currentUser.email && <> • Email: <span className="text-slate-600 font-medium">{currentUser.email}</span></>}
                </p>
              </div>
              <button 
                onClick={handleCloseEditModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                title="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Two columns */}
            <div className="overflow-y-auto py-5 pr-1 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Form Info & Settings (5 cols) */}
                <form onSubmit={handleEditUserSubmit} className="lg:col-span-5 space-y-4">
                  {/* Ảnh đại diện / Avatar */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="relative group flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-primary-200 shadow-sm flex items-center justify-center">
                        {currentUser.avatar || currentUser.portraitImage ? (
                          <img
                            src={getServerMediaUrl(currentUser.avatar || currentUser.portraitImage) || ""}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-xl flex items-center justify-center">
                            {(currentUser.name || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <label
                        className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-medium"
                        title="Đổi ảnh đại diện"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>{uploadingAvatar ? "..." : "Đổi ảnh"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          onChange={handleUploadUserAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {currentUser.phone || currentUser.email || "Chưa có liên hệ"}
                      </span>
                      <label className="text-xs text-primary-600 hover:text-primary-700 font-semibold cursor-pointer underline inline-flex items-center gap-1 mt-1">
                        <Camera className="w-3 h-3" />
                        <span>{uploadingAvatar ? "Đang tải ảnh..." : "Cập nhật ảnh đại diện"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          onChange={handleUploadUserAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Họ tên */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Họ và Tên</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập họ và tên đầy đủ"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                    />
                  </div>

                  {/* Vai trò */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Vai trò tài khoản</label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value as ManagedUserRole;
                        setFormData({ ...formData, role: newRole });
                        if (newRole === "tai-xe" && currentUser) {
                          loadUserVehicles(currentUser._id);
                        }
                      }}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer font-medium"
                    >
                      <option value="chu-hang">📦 Chủ Hàng (Merchant / Shipper)</option>
                      <option value="tai-xe">🚛 Tài Xế (Driver)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 pl-1">
                      {formData.role === "tai-xe" 
                        ? "Tài xế: nhận chuyến xe, vận chuyển hàng và yêu cầu GPLX."
                        : "Chủ hàng: đăng tin tìm xe, tạo đơn hàng vận chuyển."}
                    </p>
                  </div>

                  {/* Driver Vehicle Quick Section */}
                  {formData.role === "tai-xe" && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <span>Phương tiện đã đăng ký</span>
                            <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                              {userVehicles.length}
                            </span>
                          </p>
                          <p className="text-[11px] text-amber-800/80 truncate">
                            {userVehicles.length > 0
                              ? userVehicles.map((v) => v.plateNumber).join(" • ")
                              : "Chưa có phương tiện"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditModalTab("vehicles");
                          if (currentUser) loadUserVehicles(currentUser._id);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold bg-white text-amber-900 border border-amber-300 rounded-xl hover:bg-amber-100 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Quản lý xe →
                      </button>
                    </div>
                  )}

                  {/* Ngôn ngữ */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Ngôn ngữ mặc định</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer"
                    >
                      <option value="vi">Tiếng Việt (VI)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>

                  {/* Trạng thái eKYC */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Trạng thái eKYC</label>
                      {formData.kycStatus !== "verified" && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, kycStatus: "verified" }))}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Chọn Pass KYC
                        </button>
                      )}
                    </div>
                    <select
                      value={formData.kycStatus}
                      onChange={(e) => setFormData({ ...formData, kycStatus: e.target.value as User["kycStatus"] })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer font-medium"
                    >
                      <option value="verified">✓ Đã xác minh (Pass KYC)</option>
                      <option value="pending_review">⏳ Chờ duyệt (Pending Review)</option>
                      <option value="rejected">✕ Bị từ chối (Rejected)</option>
                      <option value="draft">○ Chưa gửi (Draft)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 pl-1">
                      {formData.kycStatus === "verified" 
                        ? "Tài khoản sẽ được xác minh hợp lệ và kích hoạt hoạt động đầy đủ."
                        : "Chọn 'Đã xác minh (Pass KYC)' để admin duyệt thủ công ngay lập tức."}
                    </p>
                  </div>

                  {/* Note info */}
                  <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed border border-slate-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Admin có thể đối chiếu giấy tờ ở cột bên phải và cấp quyền Pass KYC hoặc chuyển đổi vai trò. Nhấn <strong>Lưu Lại</strong> để cập nhật vào hệ thống.</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseEditModal}
                      className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                    >
                      Lưu Lại
                    </button>
                  </div>
                </form>

                {/* Right Column: KYC Verification Documents & OCR (7 cols) */}
                <div className="lg:col-span-7 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  {/* Top Bar with Navigation Tabs if Driver */}
                  {formData.role === "tai-xe" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setEditModalTab("ekyc")}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editModalTab === "ekyc"
                              ? "bg-white text-primary-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Giấy Tờ eKYC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditModalTab("vehicles");
                            if (currentUser) loadUserVehicles(currentUser._id);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editModalTab === "vehicles"
                              ? "bg-white text-primary-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                          <span>Phương Tiện Vận Tải</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            editModalTab === "vehicles" ? "bg-primary-100 text-primary-700" : "bg-slate-300 text-slate-700"
                          }`}>
                            {userVehicles.length}
                          </span>
                        </button>
                      </div>

                      {editModalTab === "vehicles" ? (
                        <button
                          type="button"
                          onClick={handleOpenAddVehicle}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-primary-500/20 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm Xe Mới</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            formData.kycStatus === "verified"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : formData.kycStatus === "pending_review" || formData.kycStatus === "pending"
                                ? "text-amber-700 bg-amber-50 border-amber-200"
                                : formData.kycStatus === "rejected"
                                  ? "text-red-700 bg-red-50 border-red-200"
                                  : "text-slate-500 bg-slate-100 border-slate-200"
                          }`}>
                            {formData.kycStatus === "verified"
                              ? "Đã xác minh"
                              : formData.kycStatus === "pending_review" || formData.kycStatus === "pending"
                                ? "Chờ duyệt"
                                : formData.kycStatus === "rejected"
                                  ? "Bị từ chối"
                                  : "Chưa gửi hồ sơ"}
                          </span>
                          <button
                            type="button"
                            onClick={() => currentUser && loadKycDetails(currentUser)}
                            disabled={loadingKyc}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Tải lại giấy tờ"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingKyc ? 'animate-spin text-primary-600' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-600" />
                        <h4 className="text-sm font-bold text-slate-800">Giấy Tờ Xác Minh (eKYC)</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          formData.kycStatus === "verified"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : formData.kycStatus === "pending_review" || formData.kycStatus === "pending"
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : formData.kycStatus === "rejected"
                                ? "text-red-700 bg-red-50 border-red-200"
                                : "text-slate-500 bg-slate-100 border-slate-200"
                        }`}>
                          {formData.kycStatus === "verified"
                            ? "Đã xác minh"
                            : formData.kycStatus === "pending_review" || formData.kycStatus === "pending"
                              ? "Chờ duyệt"
                              : formData.kycStatus === "rejected"
                                ? "Bị từ chối"
                                : "Chưa gửi hồ sơ"}
                        </span>
                        <button
                          type="button"
                          onClick={() => currentUser && loadKycDetails(currentUser)}
                          disabled={loadingKyc}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Tải lại giấy tờ"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingKyc ? 'animate-spin text-primary-600' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: VEHICLES LIST FOR DRIVER */}
                  {formData.role === "tai-xe" && editModalTab === "vehicles" ? (
                    <div className="space-y-4">
                      {/* Loading State */}
                      {loadingVehicles ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          <p className="text-xs">Đang tải danh sách phương tiện...</p>
                        </div>
                      ) : userVehicles.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                            <Truck className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">Tài xế chưa có phương tiện nào</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Admin có thể thêm phương tiện mới với đầy đủ thông số biển số, chủng loại, tải trọng, kích thước và ảnh giấy tờ xe.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenAddVehicle}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary-500/20 cursor-pointer mt-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Phương Tiện Đầu Tiên</span>
                          </button>
                        </div>
                      ) : (
                        /* Vehicle Cards List */
                        <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                          {userVehicles.map((veh) => (
                            <div
                              key={veh._id}
                              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-3"
                            >
                              {/* Card Header: Plate Number, Type, Status */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  {/* Vietnamese License Plate Style Badge */}
                                  <div className="border-2 border-slate-800 bg-white text-slate-900 font-mono font-bold text-xs px-2.5 py-1 rounded-md tracking-wider shadow-inner flex items-center gap-1.5 ring-1 ring-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>{veh.plateNumber}</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    {veh.brand} {veh.model ? `• ${veh.model}` : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    veh.status === "active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}>
                                    {veh.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
                                  </span>
                                </div>
                              </div>

                              {/* Specs grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                  <span className="text-slate-400 text-[11px] block">Loại xe / Thùng:</span>
                                  <span className="font-bold text-slate-700 truncate block">
                                    {veh.vehicleTypeChild || veh.type || "Xe tải"}
                                  </span>
                                </div>
                                {getVehicleCapabilities(veh).hasCapacity && (
                                <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                  <span className="text-slate-400 text-[11px] block">Tải trọng thiết kế:</span>
                                  <span className="font-bold text-primary-600 block">
                                    {veh.capacity ? `${veh.capacity} Tấn` : "Chưa cập nhật"}
                                  </span>
                                </div>
                                )}
                                {getVehicleCapabilities(veh).hasCapacity && (
                                <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                  <span className="text-slate-400 text-[11px] block">Kích thước (DxRxC):</span>
                                  <span className="font-bold text-slate-700 block">
                                    {veh.dimensions?.length && veh.dimensions?.width && veh.dimensions?.height
                                      ? `${veh.dimensions.length}m × ${veh.dimensions.width}m × ${veh.dimensions.height}m`
                                      : "Chưa cập nhật"}
                                  </span>
                                </div>
                                )}
                                {veh.ownerName && (
                                  <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                    <span className="text-slate-400 text-[11px] block">Chủ sở hữu:</span>
                                    <span className="font-semibold text-slate-700 truncate block">
                                      {veh.ownerName}
                                    </span>
                                  </div>
                                )}
                                {veh.operatingProvinceName && (
                                  <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                    <span className="text-slate-400 text-[11px] block">Khu vực hoạt động:</span>
                                    <span className="font-semibold text-slate-700 truncate block">
                                      {veh.operatingProvinceName}
                                    </span>
                                  </div>
                                )}
                                {getVehicleCapabilities(veh).hasSeats && veh.seats ? (
                                  <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                                    <span className="text-slate-400 text-[11px] block">Số ghế:</span>
                                    <span className="font-semibold text-slate-700 block">
                                      {veh.seats} chỗ ngồi
                                    </span>
                                  </div>
                                ) : null}
                                {getVehicleCapabilities(veh).hasCargoTypes && veh.model && (
                                  <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 sm:col-span-2">
                                    <span className="text-slate-400 text-[11px] block">Loại hàng vận chuyển:</span>
                                    <span className="font-semibold text-slate-700 truncate block">
                                      {veh.model}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* License Images thumbnails */}
                              {veh.licenseImages && veh.licenseImages.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Ảnh xe & Giấy tờ ({veh.licenseImages.length})
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {veh.licenseImages.map((imgUrl, imgIdx) => (
                                      <div
                                        key={imgIdx}
                                        onClick={() => setPreviewZoomImage({ title: `Phương tiện ${veh.plateNumber} - Ảnh ${imgIdx + 1}`, url: getServerMediaUrl(imgUrl) || imgUrl })}
                                        className="relative group w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs"
                                        title="Click để phóng to ảnh"
                                      >
                                        <img src={getServerMediaUrl(imgUrl) || imgUrl} alt={`Ảnh xe ${imgIdx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <Eye className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVehicle(veh)}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Sửa thông tin</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(veh._id)}
                                  className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa xe</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleOpenAddVehicle}
                            className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/40 rounded-2xl text-xs font-bold text-slate-600 hover:text-primary-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm phương tiện khác cho tài xế</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TAB 2: KYC DOCUMENTS & OCR CARD */
                    <>
                      {/* Loading State */}
                      {loadingKyc && (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          <p className="text-xs">Đang tải hồ sơ & giấy tờ xác minh...</p>
                        </div>
                      )}

                      {!loadingKyc && (
                        <>
                          {/* Identity & OCR Card (if available) */}
                          {kycDetails?.identity && (kycDetails.identity.idNumber || kycDetails.identity.fullName) && (
                            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>Thông tin trích xuất giấy tờ</span>
                                {kycDetails.identity.idNumber && (
                                  <span className="font-mono text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">
                                    {kycDetails.identity.idNumber}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                <div>
                                  <span className="text-slate-400">Họ và tên: </span>
                                  <span className="font-semibold text-slate-800">{kycDetails.identity.fullName || "---"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Ngày sinh: </span>
                                  <span className="font-semibold text-slate-800">{kycDetails.identity.dateOfBirth || "---"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Giới tính: </span>
                                  <span className="font-semibold text-slate-800">{kycDetails.identity.gender || "---"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Ngày cấp: </span>
                                  <span className="font-semibold text-slate-800">{kycDetails.identity.issueDate || "---"}</span>
                                </div>
                                {kycDetails.identity.permanentAddress && (
                                  <div className="col-span-2 mt-0.5">
                                    <span className="text-slate-400">Nơi thường trú: </span>
                                    <span className="font-semibold text-slate-800">{kycDetails.identity.permanentAddress}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Documents Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {kycDetails?.documents && kycDetails.documents.length > 0 ? (
                              kycDetails.documents.map((doc) => (
                                <div 
                                  key={doc.type} 
                                  className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
                                >
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                    <span className="text-xs font-bold text-slate-700 truncate" title={doc.label}>
                                      {doc.label}
                                    </span>
                                    {doc.url ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        Có ảnh
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        Trống
                                      </span>
                                    )}
                                  </div>

                                  {doc.url ? (
                                    <div 
                                      onClick={() => setPreviewZoomImage({ title: doc.label, url: doc.url! })}
                                      className="relative group h-36 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer flex items-center justify-center"
                                    >
                                      <img
                                        src={doc.url}
                                        alt={doc.label}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1.5">
                                        <ZoomIn className="w-4 h-4" />
                                        <span>Xem ảnh lớn</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-36 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                                      <FileText className="w-6 h-6 text-slate-300" />
                                      <span className="text-[11px]">Chưa tải lên</span>
                                    </div>
                                  )}

                                  {doc.url && (
                                    <div className="pt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewZoomImage({ title: doc.label, url: doc.url! })}
                                        className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" /> Phóng to ảnh
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 py-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                                Người dùng chưa gửi giấy tờ xác minh nào.
                              </div>
                            )}
                          </div>

                          {/* Quick verification CTA */}
                          {formData.kycStatus !== "verified" && (
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-emerald-900">Xác minh thủ công tài khoản này?</p>
                                <p className="text-[11px] text-emerald-700">Đối chiếu thông tin giấy tờ trên và duyệt trực tiếp.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, kycStatus: "verified" }))}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Pass KYC ngay
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT VEHICLE MODAL --- */}
      {showVehicleModal && currentUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-5xl p-6 sm:p-8 relative shadow-2xl border border-slate-100 animate-scale-up max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3.5">
                {/* User Avatar with Hover Upload */}
                <div className="relative group flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-primary-200 shadow-sm flex items-center justify-center">
                    {currentUser.avatar || currentUser.portraitImage ? (
                      <img
                        src={getServerMediaUrl(currentUser.avatar || currentUser.portraitImage) || ""}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-lg sm:text-xl flex items-center justify-center">
                        {(currentUser.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <label
                    className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-medium"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>{uploadingAvatar ? "..." : "Đổi ảnh"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      onChange={handleUploadUserAvatar}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {editingVehicle ? "Chỉnh Sửa Phương Tiện Vận Tải" : "Thêm Phương Tiện Vận Tải Mới"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                    <span>
                      Tài xế: <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>
                    </span>
                    {currentUser.phone && (
                      <span>
                        • SĐT: <strong className="text-slate-700 font-medium">{currentUser.phone}</strong>
                      </span>
                    )}
                    <label className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold cursor-pointer underline ml-1 inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>{uploadingAvatar ? "Đang đổi ảnh..." : "Đổi avatar"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingAvatar}
                        onChange={handleUploadUserAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                title="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveVehicle} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1.5">
              
              {/* SECTION 1: Biển số xe & Định danh */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Biển Số Xe & Định Danh Phương Tiện
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Biển số xe */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                      Biển số xe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={vehicleForm.plateNumber}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value.toUpperCase() })}
                        placeholder="VD: 29C-123.45 hoặc 51D-888.88"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-sm text-slate-800 uppercase focus:outline-none focus:border-primary-500 bg-white"
                      />
                    </div>
                    {/* Live Preview License Plate */}
                    {vehicleForm.plateNumber && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Xem trước:</span>
                        <div className="border-2 border-slate-800 bg-white text-slate-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow-2xs tracking-widest inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <span>{vehicleForm.plateNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tên chủ sở hữu theo Cà vẹt */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                      Chủ sở hữu theo giấy đăng ký (Cà vẹt)
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.ownerName}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, ownerName: e.target.value })}
                      placeholder="Họ và tên chủ phương tiện"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                    />
                  </div>

                  {/* Trạng thái hoạt động */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                      Trạng thái hoạt động
                    </label>
                    <select
                      value={vehicleForm.status}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as "active" | "inactive" })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="active">🟢 Đang hoạt động (Active)</option>
                      <option value="inactive">⚪ Tạm ngưng (Inactive)</option>
                    </select>
                  </div>

                  {/* Tỉnh / Thành phố hoạt động chính */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                      Tỉnh / Thành phố hoạt động chính
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.operatingProvinceName}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, operatingProvinceName: e.target.value })}
                      placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Chủng loại & Nhãn hiệu xe (Phân cấp Cấp Cha - Cấp Con chuẩn Mobile Flutter) */}
              {(() => {
                const capabilities = getVehicleCapabilities(vehicleForm);
                const currentParent = vehicleCatalogTree.find(
                  (v) => v.name.toLowerCase() === (vehicleForm.vehicleTypeParent || vehicleForm.type || "").toLowerCase()
                );
                const hasChildren = Boolean(currentParent?.children && currentParent.children.length > 0);

                return (
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. Loại Phương Tiện & Hãng Xe (Cấp Cha - Cấp Con)
                      </h4>
                      {/* Hierarchical Breadcrumb */}
                      <span className="text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1 rounded-xl">
                        {vehicleForm.vehicleTypeParent || "Chưa chọn"}
                        {vehicleForm.vehicleTypeChild ? ` → ${vehicleForm.vehicleTypeChild}` : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Cấp Cha: Loại phương tiện chính */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          Loại phương tiện chính (Cấp cha) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={vehicleForm.vehicleTypeParent || vehicleForm.type}
                          onChange={(e) => handleParentTypeChange(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white font-medium cursor-pointer"
                        >
                          {vehicleCatalogTree.map((item) => (
                            <option key={item.key || item.name} value={item.name}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cấp Con: Phân loại chi tiết / Thùng xe / Số chỗ */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          {capabilities.hasSeats ? "Số chỗ ngồi (Cấp con)" : "Phân loại chi tiết (Cấp con)"}
                        </label>
                        {hasChildren ? (
                          <select
                            value={vehicleForm.vehicleTypeChild || ""}
                            onChange={(e) => handleChildTypeChange(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white font-medium cursor-pointer"
                          >
                            <option value="">-- Chọn phân loại con --</option>
                            {currentParent?.children?.map((child) => (
                              <option key={child.key || child.name} value={child.name}>
                                {child.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={vehicleForm.vehicleTypeChild}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleTypeChild: e.target.value })}
                            placeholder="Nhập quy cách hoặc phân loại phụ..."
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                          />
                        )}
                      </div>

                      {/* Hãng xe (Brand) */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          Hãng xe / Nhãn hiệu <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={["Hyundai", "Hino", "Isuzu", "Thaco", "Dongfeng", "Howo", "Kia", "Ford", "Toyota", "Fuso", "Chenglong", "Daewoo", "JAC"].includes(vehicleForm.brand) ? vehicleForm.brand : "Khac"}
                            onChange={(e) => {
                              if (e.target.value !== "Khac") {
                                setVehicleForm({ ...vehicleForm, brand: e.target.value });
                              } else {
                                setVehicleForm({ ...vehicleForm, brand: "" });
                              }
                            }}
                            className="w-1/2 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 bg-white cursor-pointer font-medium"
                          >
                            <option value="Hyundai">Hyundai</option>
                            <option value="Hino">Hino</option>
                            <option value="Isuzu">Isuzu</option>
                            <option value="Thaco">Thaco</option>
                            <option value="Dongfeng">Dongfeng</option>
                            <option value="Howo">Howo</option>
                            <option value="Kia">Kia</option>
                            <option value="Ford">Ford</option>
                            <option value="Toyota">Toyota</option>
                            <option value="Fuso">Fuso</option>
                            <option value="Chenglong">Chenglong</option>
                            <option value="Daewoo">Daewoo</option>
                            <option value="JAC">JAC</option>
                            <option value="Khac">Khác...</option>
                          </select>
                          <input
                            type="text"
                            required
                            value={vehicleForm.brand}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                            placeholder="Nhập tên hãng"
                            className="w-1/2 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Dòng xe / Model */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          Dòng xe / Model & Đời xe
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.model && !selectedCargoTypes.includes(vehicleForm.model) ? vehicleForm.model : ""}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                          placeholder="VD: Mighty EX8, HD72, XZU720..."
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION: Loại Hàng Hóa Có Thể Vận Chuyển (chỉ áp dụng xe tải, container/đầu kéo, xe cẩu) */}
              {getVehicleCapabilities(vehicleForm).hasCargoTypes && (
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3. Loại Hàng Hóa Có Thể Vận Chuyển
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                      {selectedCargoTypes.length} đã chọn
                    </span>
                  </div>
                  {selectedCargoTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCargo}
                      className="text-xs text-slate-400 hover:text-red-600 font-medium cursor-pointer transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Custom Multi-select Dropdown */}
                <div className="relative" ref={cargoDropdownRef}>
                  <div
                    onClick={() => setIsCargoDropdownOpen(!isCargoDropdownOpen)}
                    className={`min-h-[44px] w-full border rounded-xl px-3.5 py-2 bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
                      isCargoDropdownOpen
                        ? "border-primary-500 ring-2 ring-primary-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {selectedCargoTypes.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        Chọn các loại hàng hóa có thể vận chuyển (chọn nhiều)...
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
                        {selectedCargoTypes.map((cargo) => (
                          <span
                            key={cargo}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-800 border border-primary-200 text-xs font-semibold"
                          >
                            <span>{cargo}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCargoType(cargo);
                              }}
                              className="text-primary-400 hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                              title="Bỏ chọn"
                            >
                              ×
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-100 text-slate-400 flex-shrink-0">
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCargoDropdownOpen ? "-rotate-90" : "rotate-90"}`} />
                    </div>
                  </div>

                  {/* Popover Dropdown Menu */}
                  {isCargoDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 space-y-2 animate-scale-up">
                      <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">
                          Danh mục hàng hóa ({cargoTypeOptions.length})
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleSelectAllCargo}
                            className="text-primary-600 hover:text-primary-800 font-semibold cursor-pointer underline text-[11px]"
                          >
                            Chọn tất cả
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            type="button"
                            onClick={handleClearAllCargo}
                            className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer underline text-[11px]"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                        {cargoTypeOptions.map((cargo) => {
                          const isChecked = selectedCargoTypes.includes(cargo);
                          return (
                            <div
                              key={cargo}
                              onClick={() => handleToggleCargoType(cargo)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-primary-50/80 text-primary-900 font-bold"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 cursor-pointer"
                                />
                                <span>{cargo}</span>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100/60 px-1.5 py-0.5 rounded">
                                  Đã chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCargoDropdownOpen(false)}
                          className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Xác nhận ({selectedCargoTypes.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* SECTION: Tải Trọng & Kích Thước Thùng (xe tải, container, xe cẩu) Hoặc Số Chỗ (chỉ Ô tô) */}
              {(() => {
                const capabilities = getVehicleCapabilities(vehicleForm);
                const stepNum = capabilities.hasCargoTypes ? 4 : 3;

                if (capabilities.hasSeats) {
                  return (
                    <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {stepNum}. Số Chỗ Ngồi Cho Phép Chở Khách (Ô Tô)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                        <div>
                          <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                            Số chỗ ngồi cho phép chở khách
                          </label>
                          <select
                            value={vehicleForm.seats || "4"}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, seats: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white font-medium cursor-pointer"
                          >
                            <option value="4">4 chỗ ngồi (Sedan / Hatchback)</option>
                            <option value="7">7 chỗ ngồi (SUV / MPV)</option>
                            <option value="9">9 chỗ ngồi (Limousine)</option>
                            <option value="16">16 chỗ ngồi (Minibus)</option>
                            <option value="29">29 chỗ ngồi (Xe khách vừa)</option>
                            <option value="45">45 chỗ ngồi (Xe khách lớn)</option>
                          </select>
                        </div>
                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                          <p className="font-bold">Phương tiện chở khách</p>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Xe du lịch & ô tô chở khách quản lý dựa trên số chỗ ngồi. Không áp dụng tải trọng hay danh mục hàng hóa.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (!capabilities.hasCapacity) return null;

                return (
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {stepNum}. Tải Trọng & Kích Thước Thùng Hàng
                      </h4>
                      {/* Auto-calculated volume badge */}
                      {vehicleForm.length && vehicleForm.width && vehicleForm.height ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Thể tích: ~{(Number(vehicleForm.length) * Number(vehicleForm.width) * Number(vehicleForm.height)).toFixed(2)} m³
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Tải trọng thiết kế */}
                      <div className="lg:col-span-2">
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          Tải trọng cho phép chở
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={vehicleForm.capacity}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                            placeholder="VD: 5"
                            className="w-2/3 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                          />
                          <select
                            value={vehicleForm.capacityUnit}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, capacityUnit: e.target.value as "tan" | "kg" })}
                            className="w-1/3 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 bg-white font-bold cursor-pointer"
                          >
                            <option value="tan">Tấn</option>
                            <option value="kg">Kg</option>
                          </select>
                        </div>
                      </div>

                      {/* Kích thước thùng (DxRxC) */}
                      <div className="lg:col-span-2">
                        <label className="text-xs font-bold text-slate-600 pl-1 block mb-1">
                          Kích thước lòng thùng (Dài × Rộng × Cao tính bằng mét)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={vehicleForm.length}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, length: e.target.value })}
                              placeholder="Dài (m)"
                              className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-xs text-slate-800 text-center focus:outline-none focus:border-primary-500 bg-white"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={vehicleForm.width}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, width: e.target.value })}
                              placeholder="Rộng (m)"
                              className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-xs text-slate-800 text-center focus:outline-none focus:border-primary-500 bg-white"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={vehicleForm.height}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, height: e.target.value })}
                              placeholder="Cao (m)"
                              className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-xs text-slate-800 text-center focus:outline-none focus:border-primary-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION: Hình ảnh xe & Giấy tờ đăng ký */}
              {(() => {
                const capabilities = getVehicleCapabilities(vehicleForm);
                const imageStepNum = 2 + (capabilities.hasCargoTypes ? 1 : 0) + (capabilities.hasSeats || capabilities.hasCapacity ? 1 : 0) + 1;

                return (
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {imageStepNum}. Hình Ảnh Xe & Giấy Tờ Cà Vẹt / Đăng Kiểm
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          4 danh mục hình ảnh đồng bộ như ứng dụng di động TXEPRO
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
                        {vehicleForm.frontImages.length +
                          vehicleForm.sideImages.length +
                          vehicleForm.registrationFrontImages.length +
                          vehicleForm.registrationBackImages.length}{" "}
                        ảnh
                      </span>
                    </div>

                {/* 4 Category Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {VEHICLE_IMAGE_SLOTS.map((slot) => {
                    const images = vehicleForm[slot.key] || [];
                    const isUploading = uploadingCategory === slot.key;
                    const isAddingUrl = activeUrlCategory === slot.key;

                    return (
                      <div
                        key={slot.key}
                        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between"
                      >
                        {/* Card Header */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {slot.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {slot.desc}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              images.length > 0
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {images.length} ảnh
                          </span>
                        </div>

                        {/* Card Body: Images or Placeholder */}
                        <div className="p-3 flex-1 flex flex-col justify-center space-y-2.5 min-h-[140px]">
                          {images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {images.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  className="relative group h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                                >
                                  <img
                                    src={getServerMediaUrl(imgUrl) || imgUrl}
                                    alt={`${slot.title} ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewZoomImage({
                                          title: `${slot.title} #${idx + 1}`,
                                          url: getServerMediaUrl(imgUrl) || imgUrl,
                                        })
                                      }
                                      className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded text-xs transition-colors cursor-pointer"
                                      title="Xem lớn"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCategoryPhoto(slot.key, idx)}
                                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors cursor-pointer"
                                      title="Xóa ảnh"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-3 flex flex-col items-center justify-center text-center">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1.5">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-medium text-slate-500">
                                Chưa có ảnh
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {slot.placeholderHint}
                              </span>
                            </div>
                          )}

                          {/* URL input field when toggled */}
                          {isAddingUrl && (
                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              <input
                                type="url"
                                autoFocus
                                value={categoryUrlInput}
                                onChange={(e) => setCategoryUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddCategoryUrl(slot.key);
                                  }
                                }}
                                placeholder="Dán link ảnh https://..."
                                className="w-full text-[11px] border border-primary-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-primary-500 bg-white"
                              />
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddCategoryUrl(slot.key)}
                                  className="flex-1 py-1 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveUrlCategory(null);
                                    setCategoryUrlInput("");
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Upload & URL actions */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50/40 flex items-center gap-1.5">
                          <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary-400 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-primary-600 transition-colors cursor-pointer shadow-2xs">
                            <Upload className="w-3.5 h-3.5 text-primary-500" />
                            <span>
                              {isUploading
                                ? "Đang tải..."
                                : images.length > 0
                                ? "+ Thêm"
                                : "Tải ảnh"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) => handleUploadCategoryPhoto(e, slot.key)}
                              className="hidden"
                            />
                          </label>
                          {!isAddingUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveUrlCategory(slot.key);
                                setCategoryUrlInput("");
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                              title="Dán liên kết URL ảnh"
                            >
                              URL
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingVehicle ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingVehicle ? "Cập Nhật Phương Tiện" : "Lưu Phương Tiện"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* --- RESET PASSWORD MODAL --- */}
      {showPasswordModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Khôi Phục Mật Khẩu</h3>
            <p className="text-slate-400 text-xs mb-6">
              Đặt lại mật khẩu mới cho tài khoản của <span className="font-bold text-slate-700">{currentUser.name}</span>.
            </p>
            
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu mới</label>
                <div className="relative mt-1">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới tối thiểu 6 ký tự"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm"
                    required
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CHAT WITH USER MODAL --- */}
      {showChatModal && chatTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg h-[620px] max-h-[90vh] flex flex-col relative shadow-2xl border border-slate-100 animate-scale-up overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full font-bold flex items-center justify-center text-xs shadow-inner overflow-hidden ring-1 ring-slate-100">
                  {getUserAvatarUrl(chatTargetUser) ? (
                    <img
                      src={getUserAvatarUrl(chatTargetUser)!}
                      alt={chatTargetUser.name || "Người dùng"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          parent.textContent = getUserInitials(chatTargetUser);
                        }
                      }}
                    />
                  ) : (
                    getUserInitials(chatTargetUser)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {chatTargetUser.name || "Người dùng TXEPRO"}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      chatTargetUser.role === "tai-xe" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {chatTargetUser.role === "tai-xe" ? "Tài Xế" : "Chủ Hàng"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {chatTargetUser.phone || chatTargetUser.email || "ID: " + chatTargetUser._id}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowChatModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng cửa sổ chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/50">
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="text-xs">Đang tải cuộc trò chuyện...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Chưa có tin nhắn nào</p>
                  <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                    Gửi tin nhắn đầu tiên để liên hệ trực tiếp với {chatTargetUser.name || "người dùng này"}.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const adminSide = isFromAdmin(msg);
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${adminSide ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {adminSide ? "Quản trị viên" : msg.senderId?.name || chatTargetUser.name || "Người dùng"}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                          adminSide
                            ? "bg-primary-600 text-white rounded-tr-xs"
                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Nhập tin nhắn gửi tới ${chatTargetUser.name || "người dùng"}...`}
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={sendingMessage || !messageInput.trim()}
                className="p-2.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-primary-600/20"
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- USER ORDERS & FINANCIAL DETAILS MODAL --- */}
      {showUserOrdersModal && selectedUserForOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col relative shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-primary-50 text-primary-600 rounded-2xl font-bold flex items-center justify-center text-sm shadow-inner ring-1 ring-slate-100 overflow-hidden flex-shrink-0">
                  {getUserAvatarUrl(selectedUserForOrders) ? (
                    <img
                      src={getUserAvatarUrl(selectedUserForOrders)!}
                      alt={selectedUserForOrders.name || "Người dùng"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          parent.textContent = getUserInitials(selectedUserForOrders);
                        }
                      }}
                    />
                  ) : (
                    getUserInitials(selectedUserForOrders)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedUserForOrders.name || "Người dùng TXEPRO"}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                      selectedUserForOrders.role === "tai-xe"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {selectedUserForOrders.role === "tai-xe" ? "Tài Xế" : "Chủ Hàng"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedUserForOrders.isActive
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {selectedUserForOrders.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    SĐT: {selectedUserForOrders.phone || "---"} • Email: {selectedUserForOrders.email || "---"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenUserOrdersModal(selectedUserForOrders)}
                  disabled={loadingUserOrders}
                  className="p-2 text-slate-400 hover:text-primary-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  title="Tải lại đơn hàng"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUserOrders ? "animate-spin text-primary-600" : ""}`} />
                </button>
                <button
                  onClick={() => setShowUserOrdersModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 4 Mini KPI Cards for this User */}
              {(() => {
                const isShipper = selectedUserForOrders.role === "chu-hang";
                const totalCount = userOrdersList.length;
                const completedOrders = userOrdersList.filter(o => ["completed", "delivered", "settled"].includes(o.status));
                const activeOrders = userOrdersList.filter(o => ["in_progress", "delivering", "in_transit", "accepted", "matched", "searching_driver", "waiting_driver", "pending"].includes(o.status));
                const totalFreight = userOrdersList.reduce((sum, o) => sum + getOrderPrice(o), 0);
                const completedFreight = completedOrders.reduce((sum, o) => sum + getOrderPrice(o), 0);
                const aov = totalCount > 0 ? Math.round(totalFreight / totalCount) : 0;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* KPI 1: Tổng đơn / chuyến */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{isShipper ? "Tổng đơn đã tạo" : "Tổng chuyến đã nhận"}</span>
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          {isShipper ? <Package className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-900">
                        {totalCount} <span className="text-xs font-normal text-slate-400">{isShipper ? "đơn" : "chuyến"}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        Đang diễn ra: <strong className="text-blue-600">{activeOrders.length}</strong>
                      </div>
                    </div>

                    {/* KPI 2: Hoàn thành */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Đã hoàn thành</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-emerald-700">
                        {completedOrders.length} <span className="text-xs font-normal text-slate-400">hoàn thành</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        Tỉ lệ: <strong className="text-emerald-600">{totalCount > 0 ? Math.round((completedOrders.length / totalCount) * 100) : 0}%</strong>
                      </div>
                    </div>

                    {/* KPI 3: Tổng tiền */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{isShipper ? "Tổng cước đã chi" : "Tổng cước đã thu"}</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-bold text-slate-900 truncate" title={totalFreight.toLocaleString("vi-VN") + " ₫"}>
                        {formatCurrency(totalFreight, true)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        Quyết toán: <strong className="text-emerald-600">{formatCompactCurrency(completedFreight)}</strong>
                      </div>
                    </div>

                    {/* KPI 4: AOV */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Giá trị đơn trung bình</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-bold text-purple-900 truncate" title={aov.toLocaleString("vi-VN") + " ₫"}>
                        {formatCurrency(aov, true)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        Trung bình mỗi chuyến
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Status Tabs */}
                {(() => {
                  const allCount = userOrdersList.length;
                  const completedCount = userOrdersList.filter(o => ["completed", "delivered", "settled"].includes(o.status)).length;
                  const activeCount = userOrdersList.filter(o => ["in_progress", "delivering", "in_transit", "accepted", "matched", "searching_driver", "waiting_driver", "pending"].includes(o.status)).length;
                  const cancelledCount = userOrdersList.filter(o => ["cancelled", "rejected"].includes(o.status)).length;

                  const tabs = [
                    { key: "all", label: "Tất cả", count: allCount },
                    { key: "completed", label: "Hoàn thành", count: completedCount },
                    { key: "active", label: "Đang vận chuyển", count: activeCount },
                    { key: "cancelled", label: "Đã hủy", count: cancelledCount },
                  ];

                  return (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                      {tabs.map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setUserOrdersStatusFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            userOrdersStatusFilter === tab.key
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            userOrdersStatusFilter === tab.key
                              ? "bg-primary-50 text-primary-600"
                              : "bg-slate-200/80 text-slate-600"
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Search in user orders */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={userOrdersSearch}
                    onChange={(e) => setUserOrdersSearch(e.target.value)}
                    placeholder="Tìm mã đơn, tuyến, hàng..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                {loadingUserOrders ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-slate-400 text-xs mt-3">Đang tải danh sách đơn hàng & doanh số...</p>
                  </div>
                ) : (() => {
                  const filteredOrders = userOrdersList.filter(order => {
                    // Status filter
                    if (userOrdersStatusFilter === "completed") {
                      if (!["completed", "delivered", "settled"].includes(order.status)) return false;
                    } else if (userOrdersStatusFilter === "active") {
                      if (!["in_progress", "delivering", "in_transit", "accepted", "matched", "searching_driver", "waiting_driver", "pending"].includes(order.status)) return false;
                    } else if (userOrdersStatusFilter === "cancelled") {
                      if (!["cancelled", "rejected"].includes(order.status)) return false;
                    }

                    // Search filter
                    if (userOrdersSearch.trim()) {
                      const q = userOrdersSearch.toLowerCase().trim();
                      const matchCode = (order.orderCode || "").toLowerCase().includes(q);
                      const matchTitle = (order.title || "").toLowerCase().includes(q);
                      const matchCargo = (order.cargoType || "").toLowerCase().includes(q);
                      const matchPickup = (order.pickup?.address || "").toLowerCase().includes(q);
                      const matchDropoff = (order.dropoff?.address || "").toLowerCase().includes(q);
                      if (!matchCode && !matchTitle && !matchCargo && !matchPickup && !matchDropoff) return false;
                    }

                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="text-center py-14 px-4 text-slate-400 space-y-2">
                        <PackageOpen className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">Chưa có dữ liệu đơn hàng & giao dịch</p>
                        <p className="text-xs text-slate-400">
                          {userOrdersList.length === 0
                            ? "Người dùng này chưa phát sinh đơn hàng hoặc giao dịch nào trên hệ thống."
                            : "Không tìm thấy bản ghi đơn theo bộ lọc hiện tại."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4 min-w-[130px]">Mã Đơn & Ngày</th>
                            <th className="py-3 px-4 min-w-[220px]">Lộ Trình Vận Chuyển</th>
                            <th className="py-3 px-4 min-w-[160px]">Hàng Hóa & Xe</th>
                            <th className="py-3 px-4 min-w-[130px]">Tiền Cước</th>
                            <th className="py-3 px-4 text-center min-w-[110px]">Trạng Thái</th>
                            <th className="py-3 px-4 text-right min-w-[80px]">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filteredOrders.map(order => {
                            const price = getOrderPrice(order);
                            const statusBadge = getOrderStatusBadge(order.status);
                            return (
                              <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                                {/* Mã đơn & Ngày */}
                                <td className="py-3 px-4">
                                  <Link
                                    href={`/admin/orders/${order._id}`}
                                    className="font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                                  >
                                    <span>{order.orderCode || "TXP-0000"}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                  </Link>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {formatDateTime(order.createdAt)}
                                  </p>
                                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                                    {order.paymentMethod === "wallet" ? "Ví TXEPRO" : "Tiền mặt"}
                                  </span>
                                </td>

                                {/* Lộ trình */}
                                <td className="py-3 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></span>
                                      <span className="font-semibold text-slate-800 line-clamp-1" title={order.pickup?.address || "Điểm bốc"}>
                                        {order.pickup?.address || "Điểm bốc hàng"}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0"></span>
                                      <span className="text-slate-600 line-clamp-1" title={order.dropoff?.address || "Điểm dỡ"}>
                                        {order.dropoff?.address || "Điểm dỡ hàng"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Hàng hóa & Xe */}
                                <td className="py-3 px-4">
                                  <p className="font-semibold text-slate-800 line-clamp-1">
                                    {order.cargoType || order.title || "Hàng hóa tổng hợp"}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {order.vehicleType || "Xe tải"} {order.weightLabel ? `• ${order.weightLabel}` : order.weight ? `• ${order.weight} tấn` : ""}
                                  </p>
                                </td>

                                {/* Tiền cước */}
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900">
                                    {formatCurrency(price, true)}
                                  </span>
                                  {price > 0 && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {selectedUserForOrders.role === "chu-hang" ? "Cước chi trả" : "Tiền nhận cước"}
                                    </p>
                                  )}
                                </td>

                                {/* Trạng thái */}
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                                    <span>{statusBadge.label}</span>
                                  </span>
                                </td>

                                {/* Thao tác */}
                                <td className="py-3 px-4 text-right">
                                  <Link
                                    href={`/admin/orders/${order._id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-600 rounded-xl transition text-[11px] font-bold"
                                  >
                                    <span>Xem</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span>Tổng cộng: <strong className="text-slate-800">{userOrdersList.length}</strong> đơn trong hồ sơ thành viên</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUserOrdersModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- IMAGE ZOOM / LIGHTBOX MODAL --- */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <h4 className="text-sm font-bold flex items-center gap-2 truncate">
                <Eye className="w-4 h-4 text-primary-400" />
                {previewZoomImage.title}
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewZoomImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition text-xs flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
                <button
                  onClick={() => setPreviewZoomImage(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
                  title="Đóng xem ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-slate-900/90 rounded-2xl overflow-hidden border border-white/10 p-2 shadow-2xl max-h-[82vh] flex items-center justify-center w-full">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.title}
                className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  );
}
