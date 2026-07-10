"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Edit3,
  FileCheck2,
  Globe,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Route,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";

type UserRole = "admin" | "tai-xe" | "chu-hang";
type WorkspaceTab = "waiting" | "in_progress" | "history";
type MainTab = "overview" | "orders" | "profile";

interface KycSummary {
  verificationEligibility?: string;
  latestSubmissionId?: string;
  reviewedAt?: string;
  submittedAt?: string;
  rejectionReason?: string;
  requiredDocuments?: string[];
  completedDocuments?: string[];
}

interface ProfileData {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  role: UserRole | string;
  language?: string;
  avatar?: string;
  kycStatus?: string;
  verificationEligibility?: string;
  kycSummary?: KycSummary | null;
  referralCode?: string;
  isActive?: boolean;
  status?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletData {
  mainBalance?: number;
  promoBalance?: number;
  lockedBalance?: number;
  availableBalance?: number;
  currency?: string;
  status?: string;
  virtualAccountNumber?: string;
  totalIncome?: number;
  totalSpend?: number;
}

interface LocationInfo {
  address?: string;
  lat?: number;
  lng?: number;
}

interface OrderSummary {
  _id: string;
  id?: string;
  orderCode?: string;
  title?: string;
  status?: string;
  offerPrice?: number;
  finalPrice?: number;
  budget?: { min?: number; max?: number } | number;
  pickup?: LocationInfo;
  dropoff?: LocationInfo;
  cargoType?: string;
  weight?: number;
  volume?: number;
  vehicleType?: string;
  distanceKm?: number;
  createdAt?: string;
  updatedAt?: string;
}



const roleLabels: Record<string, string> = {
  "tai-xe": "Tài xế",
  driver: "Tài xế",
  "chu-hang": "Chủ hàng",
  shipper: "Chủ hàng",
  admin: "Quản trị viên",
};

const getStatusLabel = (status: string, role: string) => {
  const isDriver = role === "tai-xe";
  switch (status) {
    case "searching_driver":
    case "pending":
    case "waiting_driver":
      return isDriver ? "Có thể nhận" : "Chờ tài xế";
    case "accepted":
    case "in_progress":
    case "in_transit":
    case "delivered":
      return "Đang vận chuyển";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    case "draft":
      return "Bản nháp";
    default:
      return "Đang cập nhật";
  }
};

const kycLabels: Record<string, string> = {
  draft: "Chưa hoàn tất",
  pending: "Đang chờ duyệt",
  pending_review: "Đang xét duyệt",
  verified: "Đã xác minh",
  rejected: "Bị từ chối",
  missing_documents: "Thiếu tài liệu",
  pending_verification: "Chờ xác thực",
};

const normalizeRole = (role?: string): UserRole => {
  if (role === "driver") return "tai-xe";
  if (role === "shipper" || role === "customer") return "chu-hang";
  if (role === "admin") return "admin";
  return role === "tai-xe" ? "tai-xe" : "chu-hang";
};

const getRoleApiPath = (role: UserRole) => (role === "tai-xe" ? "tai-xe" : "chu-hang");

const getProfileName = (profile: ProfileData | null) => profile?.name || profile?.fullName || "Người dùng TXEPRO";

const formatDate = (value?: string) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatCurrency = (value?: any, allowZeroOrEmpty = false) => {
  const num = Number(value);
  if (allowZeroOrEmpty) {
    if (value === undefined || value === null || isNaN(num)) return "0\u00a0\u20ab";
    return num.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  }
  if (value === undefined || value === null) return "Thương lượng";
  if (isNaN(num) || num <= 0) return "Thương lượng";
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
};

const getOrderPrice = (order: any) => {
  if (order.finalPrice) return order.finalPrice;
  if (order.offerPrice) return order.offerPrice;
  if (order.price) return order.price;
  if (typeof order.budget === "number") return order.budget;
  if (typeof order.budget === "string") return order.budget;
  if (order.budget?.max) return order.budget.max;
  if (order.budget?.min) return order.budget.min;
  return 0;
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25";
    case "in_transit":
    case "accepted":
    case "assigned":
      return "bg-blue-600 text-white shadow-sm shadow-blue-500/25";
    case "cancelled":
      return "bg-rose-500 text-white shadow-sm shadow-rose-500/25";
    default:
      return "bg-amber-500 text-white shadow-sm shadow-amber-500/25";
  }
};

const getOrderKey = (order: OrderSummary, index: number) => order._id || order.id || order.orderCode || `order-${index}`;

const extractPayload = async <T,>(res: Response): Promise<T | null> => {
  const json = await res.json().catch(() => null);
  return (json?.data ?? json) as T | null;
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-900">{value || "Chưa có"}</p>
      </div>
    </div>
  );
}

function UserProfileContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("vi");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<Record<string, number>>({});
  const [ordersList, setOrdersList] = useState<OrderSummary[]>([]);
  const [allOrdersList, setAllOrdersList] = useState<OrderSummary[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("waiting");
  const [tabLoading, setTabLoading] = useState(false);

  const handleTabChange = (tab: MainTab) => {
    setTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setTabLoading(false), 350);
  };

  const handleWorkspaceTabChange = (tab: WorkspaceTab) => {
    setTabLoading(true);
    setWorkspaceTab(tab);
    setTimeout(() => setTabLoading(false), 350);
  };

  const handleCardClick = (tabId: WorkspaceTab) => {
    setTabLoading(true);
    setActiveTab("orders");
    setWorkspaceTab(tabId);
    if (tabId === "waiting") {
      setOrdersStatusFilter("waiting");
    } else if (tabId === "in_progress") {
      setOrdersStatusFilter("in_progress");
    } else if (tabId === "history") {
      setOrdersStatusFilter("completed");
    } else {
      setOrdersStatusFilter("");
    }
    setTimeout(() => setTabLoading(false), 350);
  };

  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewStatusFilter, setOverviewStatusFilter] = useState("");
  const [overviewSortKey, setOverviewSortKey] = useState<"orderCode" | "createdAt" | "price" | "status" | "title">("createdAt");
  const [overviewSortDir, setOverviewSortDir] = useState<"asc" | "desc">("desc");

  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("");
  const [ordersSortKey, setOrdersSortKey] = useState<"orderCode" | "createdAt" | "price" | "status" | "title">("createdAt");
  const [ordersSortDir, setOrdersSortDir] = useState<"asc" | "desc">("desc");

  const [statsPeriod, setStatsPeriod] = useState<"day" | "week" | "month" | "year">("month");

  const getStatsData = () => {
    const now = new Date();
    let thresholdDate = new Date();

    if (statsPeriod === "day") {
      thresholdDate.setHours(0, 0, 0, 0);
    } else if (statsPeriod === "week") {
      thresholdDate.setDate(now.getDate() - 7);
    } else if (statsPeriod === "month") {
      thresholdDate.setDate(now.getDate() - 30);
    } else if (statsPeriod === "year") {
      thresholdDate.setMonth(0, 1);
      thresholdDate.setHours(0, 0, 0, 0);
    }

    const periodOrders = allOrdersList.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= thresholdDate;
    });

    const money = periodOrders.reduce((sum, o) => sum + getOrderPrice(o), 0);
    const trips = periodOrders.length;
    const completedTrips = periodOrders.filter(o => o.status === "completed").length;
    const rate = trips > 0 ? Math.round((completedTrips / trips) * 100) : 0;

    return {
      money,
      trips,
      rate
    };
  };

  const filteredAndSortedOverviewOrders = useMemo(() => {
    let list = [...allOrdersList];

    // Filter
    if (overviewSearch) {
      const q = overviewSearch.toLowerCase();
      list = list.filter(o =>
        (o.orderCode || "").toLowerCase().includes(q) ||
        (o.title || "").toLowerCase().includes(q) ||
        (o.cargoType || "").toLowerCase().includes(q) ||
        (o.pickup?.address || "").toLowerCase().includes(q) ||
        (o.dropoff?.address || "").toLowerCase().includes(q)
      );
    }

    if (overviewStatusFilter) {
      list = list.filter(o => o.status === overviewStatusFilter);
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (overviewSortKey === "orderCode") {
        valA = a.orderCode || a._id;
        valB = b.orderCode || b._id;
      } else if (overviewSortKey === "createdAt") {
        valA = a.createdAt || "";
        valB = b.createdAt || "";
      } else if (overviewSortKey === "price") {
        valA = getOrderPrice(a);
        valB = getOrderPrice(b);
      } else if (overviewSortKey === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (overviewSortKey === "title") {
        valA = a.title || "";
        valB = b.title || "";
      }

      if (valA < valB) return overviewSortDir === "asc" ? -1 : 1;
      if (valA > valB) return overviewSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [allOrdersList, overviewSearch, overviewStatusFilter, overviewSortKey, overviewSortDir]);

  const filteredAndSortedOrders = useMemo(() => {
    let list = [...allOrdersList];

    // Filter
    if (ordersSearch) {
      const q = ordersSearch.toLowerCase();
      list = list.filter(o =>
        (o.orderCode || "").toLowerCase().includes(q) ||
        (o.title || "").toLowerCase().includes(q) ||
        (o.cargoType || "").toLowerCase().includes(q) ||
        (o.pickup?.address || "").toLowerCase().includes(q) ||
        (o.dropoff?.address || "").toLowerCase().includes(q)
      );
    }

    // Filter by status dropdown
    if (ordersStatusFilter) {
      list = list.filter(o => {
        const s = o.status || "";
        if (ordersStatusFilter === "waiting") {
          return s === "searching_driver" || s === "pending" || s === "waiting_driver" || s === "waiting_driver_acceptance";
        }
        if (ordersStatusFilter === "in_progress") {
          return s === "accepted" || s === "in_progress" || s === "in_transit" || s === "delivered";
        }
        if (ordersStatusFilter === "completed") {
          return s === "completed";
        }
        if (ordersStatusFilter === "cancelled") {
          return s === "cancelled";
        }
        return s === ordersStatusFilter;
      });
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (ordersSortKey === "orderCode") {
        valA = a.orderCode || a._id;
        valB = b.orderCode || b._id;
      } else if (ordersSortKey === "createdAt") {
        valA = a.createdAt || "";
        valB = b.createdAt || "";
      } else if (ordersSortKey === "price") {
        valA = getOrderPrice(a);
        valB = getOrderPrice(b);
      } else if (ordersSortKey === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (ordersSortKey === "title") {
        valA = a.title || "";
        valB = b.title || "";
      }

      if (valA < valB) return ordersSortDir === "asc" ? -1 : 1;
      if (valA > valB) return ordersSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [allOrdersList, ordersSearch, ordersStatusFilter, ordersSortKey, ordersSortDir]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKycWarningModal, setShowKycWarningModal] = useState(false);
  const [orderTitle, setOrderTitle] = useState("");
  const [orderCargoType, setOrderCargoType] = useState("Hàng tiêu dùng");
  const [orderPickupAddress, setOrderPickupAddress] = useState("");
  const [orderDropoffAddress, setOrderDropoffAddress] = useState("");
  const [orderWeight, setOrderWeight] = useState("1");
  const [orderBudget, setOrderBudget] = useState("500000");

  const normalizedRole = normalizeRole(profile?.role);

  const calculatedTotalIncome = useMemo(() => {
    if (wallet?.totalIncome !== undefined && wallet?.totalIncome !== null) {
      return wallet.totalIncome;
    }
    const isDriver = normalizedRole === "tai-xe";
    if (!isDriver) return 0;
    return allOrdersList
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + getOrderPrice(o), 0);
  }, [wallet?.totalIncome, allOrdersList, normalizedRole]);

  const calculatedTotalSpend = useMemo(() => {
    if (wallet?.totalSpend !== undefined && wallet?.totalSpend !== null) {
      return wallet.totalSpend;
    }
    const isDriver = normalizedRole === "tai-xe";
    if (isDriver) return 0;
    return allOrdersList
      .filter(o => o.status === "completed" || o.status === "in_transit" || o.status === "delivered")
      .reduce((sum, o) => sum + getOrderPrice(o), 0);
  }, [wallet?.totalSpend, allOrdersList, normalizedRole]);

  const displayName = getProfileName(profile);
  const avatarUrl = getServerMediaUrl(profile?.avatar);
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    const seed = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : displayName.slice(0, 2);
    return seed.toUpperCase();
  }, [displayName]);

  const showToast = (success: boolean, msg: string) => {
    if (success) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    const sessionSaved = localStorage.getItem("txpro_user_session");

    try {
      const [authRes, commonRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/auth/profile`),
        fetchWithAuth(`${API_BASE}/common/profile`).catch(() => null),
      ]);

      if (!authRes.ok) throw new Error("Không thể tải hồ sơ");

      const authData = await extractPayload<{ user: ProfileData }>(authRes);
      const commonData = commonRes?.ok ? await extractPayload<Partial<ProfileData>>(commonRes) : null;
      const user = authData?.user;
      if (!user) throw new Error("Không có dữ liệu hồ sơ");

      const mergedProfile: ProfileData = {
        ...user,
        ...commonData,
        name: user.name || commonData?.fullName,
        role: normalizeRole(user.role || commonData?.role),
        kycStatus: commonData?.kycStatus || user.kycStatus,
        verificationEligibility: commonData?.verificationEligibility || user.verificationEligibility,
        kycSummary: commonData?.kycSummary || user.kycSummary,
      };

      setProfile(mergedProfile);
      setName(getProfileName(mergedProfile));
      setLanguage(mergedProfile.language || "vi");
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      if (!sessionSaved) {
        router.push("/login");
        return;
      }

      try {
        const session = JSON.parse(sessionSaved);
        const mockProfile: ProfileData = {
          name: session.name || "Khách hàng TXEPRO",
          role: normalizeRole(session.rawRole || session.role),
          phone: session.phone || "0900000000",
          email: session.email || "user@txepro.vn",
          language: "vi",
          kycStatus: "draft",
          isActive: true,
        };
        setProfile(mockProfile);
        setName(getProfileName(mockProfile));
        setLanguage(mockProfile.language || "vi");
      } catch {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/common/wallet/balance`);
      if (!res.ok) return;
      const data = await extractPayload<WalletData>(res);
      setWallet(data);
    } catch {
      setWallet(null);
    }
  };

  const fetchWorkspaceData = async () => {
    if (!profile) return;
    const rolePath = getRoleApiPath(normalizedRole);

    try {
      const summaryRes = await fetchWithAuth(`${API_BASE}/${rolePath}/home/summary`);
      if (summaryRes.ok) {
        const summary = await extractPayload<Record<string, number>>(summaryRes);
        setSummaryData(summary || {});
      }

      // Fetch all three tabs in parallel to construct allOrdersList
      const [waitingRes, inProgressRes, historyRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/${rolePath}/orders/waiting`),
        fetchWithAuth(`${API_BASE}/${rolePath}/orders/in-progress`),
        fetchWithAuth(`${API_BASE}/${rolePath}/orders/history`),
      ]);

      const [waitingOrders, inProgressOrders, historyOrders] = await Promise.all([
        waitingRes.ok ? extractPayload<OrderSummary[]>(waitingRes) : [],
        inProgressRes.ok ? extractPayload<OrderSummary[]>(inProgressRes) : [],
        historyRes.ok ? extractPayload<OrderSummary[]>(historyRes) : [],
      ]);

      const mergedList: OrderSummary[] = [
        ...(Array.isArray(waitingOrders) ? waitingOrders : []),
        ...(Array.isArray(inProgressOrders) ? inProgressOrders : []),
        ...(Array.isArray(historyOrders) ? historyOrders : []),
      ];

      setAllOrdersList(mergedList);

      // Filter local subset matching current tab to keep the workspace tab interactive
      const currentTabOrders = mergedList.filter((order) => {
        const status = order.status || "";
        if (workspaceTab === "waiting") {
          return status === "searching_driver" || status === "pending" || status === "waiting_driver" || status === "waiting_driver_acceptance";
        }
        if (workspaceTab === "in_progress") {
          return status === "accepted" || status === "in_progress" || status === "in_transit" || status === "delivered";
        }
        if (workspaceTab === "history") {
          return status === "completed" || status === "cancelled";
        }
        return false;
      });
      setOrdersList(currentTabOrders);
    } catch {
      setSummaryData({ waitingOrders: 2, inProgressOrders: 1, completedOrders: 5, historyOrders: 6 });

      const mockList: OrderSummary[] = [
        {
          _id: "mock-waiting",
          orderCode: "ORD-WAIT-01",
          title: "Vận chuyển hàng hóa nội thành",
          status: "searching_driver",
          budget: { max: 1500000 },
          pickup: { address: "Quận 1, TP.HCM" },
          dropoff: { address: "Thành phố Thủ Đức, TP.HCM" },
          cargoType: "Hàng tiêu dùng",
          weight: 2,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: "mock-in-progress",
          orderCode: "ORD-RUN-02",
          title: "Vận chuyển thiết bị điện tử",
          status: "in_transit",
          budget: { max: 2500000 },
          pickup: { address: "Quận 3, TP.HCM" },
          dropoff: { address: "Quận 7, TP.HCM" },
          cargoType: "Hàng công nghệ",
          weight: 1.5,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          _id: "mock-history",
          orderCode: "ORD-DONE-03",
          title: "Chuyến hàng đã hoàn thành",
          status: "completed",
          budget: { max: 3200000 },
          pickup: { address: "Quận 10, TP.HCM" },
          dropoff: { address: "Biên Hòa, Đồng Nai" },
          cargoType: "Hàng tiêu dùng",
          weight: 3,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ];

      setAllOrdersList(mockList);

      const currentTabOrders = mockList.filter((order) => {
        const status = order.status || "";
        if (workspaceTab === "waiting") return status === "searching_driver";
        if (workspaceTab === "in_progress") return status === "in_transit";
        if (workspaceTab === "history") return status === "completed";
        return false;
      });
      setOrdersList(currentTabOrders);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchWorkspaceData();
      fetchWallet();
    }
  }, [profile, workspaceTab]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast(false, "Vui lòng nhập họ tên");

    setActionLoading(true);
    try {
      if (isOffline) {
        const updatedProfile = { ...profile!, name: name.trim(), language };
        setProfile(updatedProfile);
        showToast(true, "Cập nhật hồ sơ thành công");
        setEditing(false);
        return;
      }

      const res = await fetchWithAuth(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), language }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Lỗi cập nhật hồ sơ");
      }

      const data = await extractPayload<{ user: ProfileData }>(res);
      if (data?.user) {
        const updated = { ...profile, ...data.user, role: normalizeRole(data.user.role) } as ProfileData;
        setProfile(updated);
        setName(getProfileName(updated));
        const saved = localStorage.getItem("txpro_user_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.name = getProfileName(updated);
          localStorage.setItem("txpro_user_session", JSON.stringify(parsed));
          window.dispatchEvent(new Event("storage"));
        }
      }
      showToast(true, "Cập nhật hồ sơ thành công");
      setEditing(false);
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : "Không thể cập nhật hồ sơ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderTitle.trim()) return showToast(false, "Vui lòng nhập tên hàng hóa");
    if (!orderPickupAddress.trim()) return showToast(false, "Vui lòng nhập địa chỉ bốc hàng");
    if (!orderDropoffAddress.trim()) return showToast(false, "Vui lòng nhập địa chỉ giao hàng");

    setActionLoading(true);
    const payload = {
      title: orderTitle.trim(),
      cargoType: orderCargoType.trim(),
      pickup: { address: orderPickupAddress.trim(), lat: 10.762622, lng: 106.660172 },
      dropoff: { address: orderDropoffAddress.trim(), lat: 10.823099, lng: 106.629664 },
      vehicleType: "xe-tai",
      weight: Number(orderWeight) || 1,
      volume: Number(orderWeight) * 3 || 3,
      pickupTimeType: "now",
      budget: {
        min: Math.floor(Number(orderBudget) * 0.9) || 100000,
        max: Number(orderBudget) || 120000,
      },
    };

    try {
      if (isOffline) {
        showToast(true, "Đã gửi đơn hàng lên hệ thống");
        setShowCreateModal(false);
        return;
      }

      const res = await fetchWithAuth(`${API_BASE}/chu-hang/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể tạo đơn hàng");
      }

      showToast(true, "Đăng tin vận chuyển thành công");
      setShowCreateModal(false);
      fetchWorkspaceData();
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : "Không thể tạo đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    setActionLoading(true);
    try {
      if (!isOffline) {
        const res = await fetchWithAuth(`${API_BASE}/chu-hang/orders/${orderId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Hủy đơn vận" }),
        });
        if (!res.ok) throw new Error("Lỗi hủy đơn hàng");
      }
      showToast(true, "Đã hủy đơn hàng thành công");
      fetchWorkspaceData();
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : "Không thể hủy đơn hàng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn nhận chạy đơn vận chuyển này không?")) return;

    setActionLoading(true);
    try {
      if (!isOffline) {
        const res = await fetchWithAuth(`${API_BASE}/tai-xe/orders/${orderId}/accept`, { method: "POST" });
        if (!res.ok) throw new Error("Lỗi nhận đơn chạy");
      }
      showToast(true, "Nhận chuyến xe thành công");
      fetchWorkspaceData();
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : "Không thể nhận đơn chạy");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("txpro_user_session");
    localStorage.removeItem("txpro_token");
    localStorage.removeItem("txpro_refresh_token");
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  if (loading && !profile) {
    return <PageSkeleton />;
  }

  if (!profile) return null;

  const kycStatus = profile.kycStatus || "draft";
  const accountStatus = (() => {
    if (profile.isActive === false) return "Tạm khóa";
    const s = (profile.status || "active").toLowerCase();
    if (s === "active" || s === "activated") return "Đang hoạt động";
    if (s === "inactive" || s === "deactivated") return "Chưa kích hoạt";
    if (s === "pending") return "Chờ kích hoạt";
    if (s === "suspended" || s === "blocked") return "Đã khóa";
    return profile.status || "Đang hoạt động";
  })();

  const kycStatusLabel = (() => {
    let label = kycLabels[kycStatus] || kycStatus;
    const dateVal = profile.kycSummary?.reviewedAt;
    if (kycStatus === "verified" && dateVal) {
      label += ` (${formatDate(dateVal)})`;
    }
    return label;
  })();

  const eligibilityLabel = (() => {
    const val = profile.verificationEligibility || profile.kycSummary?.verificationEligibility;
    if (!val) return "Chưa bắt đầu";
    const s = val.toLowerCase();
    if (kycLabels[s]) return kycLabels[s];
    if (s === "eligible") return "Đủ điều kiện";
    if (s === "ineligible") return "Chưa đủ điều kiện";
    return val;
  })();

  const isVerified = kycStatus === "verified";
  const isDriver = normalizedRole === "tai-xe";
  const summaryCards = [
    { label: isDriver ? "Có thể nhận" : "Chờ tài xế", value: summaryData.waitingOrders || 0, icon: Clock3, id: "waiting" as const },
    { label: "Đang vận chuyển", value: summaryData.inProgressOrders || 0, icon: Route, id: "in_progress" as const },
    { label: "Hoàn thành", value: summaryData.completedOrders || 0, icon: FileCheck2, id: "history" as const },
    { label: isDriver ? "Lịch sử chuyến" : "Lịch sử đơn", value: summaryData.historyOrders || 0, icon: Package, id: "history" as const },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        {successMsg && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
            <Check className="h-5 w-5" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
            <AlertCircle className="h-5 w-5" /> {errorMsg}
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="border-b border-slate-200 pb-7">
            <button
              onClick={() => router.push("/")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Trang chủ
            </button>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-2xl font-bold text-primary-700 shadow-sm">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                      {roleLabels[normalizedRole] || "Người dùng"}
                    </span>
                    <span className={`rounded-md px-3 py-1 text-xs font-bold ${isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {kycLabels[kycStatus] || kycStatus}
                    </span>
                    {isOffline && <span className="rounded-md bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">Offline</span>}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{displayName}</h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                    Trung tâm tài khoản cá nhân, thông tin xác minh, ví và các chuyến hàng của bạn trên TXEPRO.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {normalizedRole === "chu-hang" && (
                  <button
                    onClick={(e) => {
                      if (!isVerified) {
                        e.preventDefault();
                        setShowKycWarningModal(true);
                      } else {
                        router.push("/chu-hang/form-tao-don");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" /> Đăng đơn mới
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            </div>
          </section>

          <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200">
            {[
              { id: "overview", label: "Tổng quan", icon: BriefcaseBusiness },
              { id: "orders", label: "Đơn hàng", icon: Package },
              { id: "profile", label: "Hồ sơ đầy đủ", icon: User },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as MainTab)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${activeTab === item.id
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </nav>

          {tabLoading ? (
            <SkeletonLoader tab={activeTab} />
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {summaryCards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.label}
                            type="button"
                            onClick={() => handleCardClick(card.id)}
                            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm text-left w-full hover:border-primary-500 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-500 group-hover:text-primary-600 transition-colors">{card.label}</p>
                              <Icon className="h-5 w-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                            </div>
                            <p className="mt-4 text-3xl font-bold text-slate-950">{card.value}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-slate-950">Phân tích & Thống kê</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {isDriver ? "Báo cáo hiệu suất doanh thu và chuyến xe." : "Báo cáo chi phí và chuyến hàng vận chuyển."}
                          </p>
                        </div>
                        {/* Period Selector tabs */}
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1">
                          {(["day", "week", "month", "year"] as const).map((period) => (
                            <button
                              key={period}
                              onClick={() => setStatsPeriod(period)}
                              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${statsPeriod === period
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-950"
                                }`}
                            >
                              {period === "day" ? "Ngày" : period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Displaying Stats */}
                      <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {/* Stat Card 1 */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isDriver ? "Doanh thu" : "Tổng chi phí"}
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {formatCurrency(getStatsData().money, true)}
                          </p>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isDriver ? "Số chuyến chạy" : "Số chuyến gửi"}
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {getStatsData().trips} chuyến
                          </p>
                        </div>

                        {/* Stat Card 3 */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isDriver ? "Hiệu suất hoàn thành" : "Tỷ lệ ghép thành công"}
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {getStatsData().rate}%
                          </p>
                        </div>
                      </div>


                    </div>
                  </div>

                  <aside className="space-y-6">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-950">Xác minh</h2>
                        <ShieldCheck className={`h-5 w-5 ${isVerified ? "text-emerald-600" : "text-amber-500"}`} />
                      </div>
                      <p className="mt-4 text-2xl font-bold text-slate-950">{kycLabels[kycStatus] || kycStatus}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Điều kiện xác minh: {eligibilityLabel}.
                      </p>

                      {/* Detailed verifications with checkmarks */}
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-semibold">Xác minh Số điện thoại</span>
                          {(profile.phoneVerified || !!profile.phone) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5" /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                              Chưa xác minh
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-semibold">Xác minh Email</span>
                          {(profile.emailVerified || !!profile.email) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5" /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                              Chưa xác minh
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-semibold">Định danh eKYC</span>
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5" /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                              {kycStatus === "pending" ? "Chờ duyệt" : "Chưa định danh"}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-950">Ví TXEPRO</h2>
                        <Wallet className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Số dư khả dụng</p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(wallet?.availableBalance ?? wallet?.mainBalance, true)}</p>
                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <InfoPill label="Đang giữ" value={formatCurrency(wallet?.lockedBalance, true)} />
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="rounded-lg bg-emerald-50/50 border border-emerald-500/10 p-3">
                            <p className="text-[10px] font-bold uppercase text-emerald-650">Tổng thu</p>
                            <p className="mt-1 text-sm font-bold text-emerald-700">{formatCurrency(calculatedTotalIncome, true)}</p>
                          </div>
                          <div className="rounded-lg bg-rose-50/50 border border-rose-500/10 p-3">
                            <p className="text-[10px] font-bold uppercase text-rose-650">Tổng chi</p>
                            <p className="mt-1 text-sm font-bold text-rose-700">{formatCurrency(calculatedTotalSpend, true)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="mt-8 space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">Khu làm việc đơn hàng</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {normalizedRole === "tai-xe" ? "Theo dõi đơn có thể nhận, đang chạy và lịch sử chuyến." : "Quản lý đơn đã đăng, đang vận chuyển và lịch sử giao hàng."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Status dropdown filter */}
                        <select
                          value={ordersStatusFilter}
                          onChange={(e) => setOrdersStatusFilter(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-650 focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
                        >
                          <option value="">Tất cả Trạng thái</option>
                          <option value="searching_driver">{isDriver ? "Có thể nhận" : "Chờ tài xế"}</option>
                          <option value="in_transit">Đang vận chuyển</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-48">
                          <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={ordersSearch}
                            onChange={(e) => setOrdersSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    {filteredAndSortedOrders.length === 0 ? (
                      <EmptyOrders />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                              <th
                                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => {
                                  setOrdersSortKey("orderCode");
                                  setOrdersSortDir(d => d === "asc" ? "desc" : "asc");
                                }}
                              >
                                Mã đơn {ordersSortKey === "orderCode" && (ordersSortDir === "asc" ? "▲" : "▼")}
                              </th>
                              <th
                                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => {
                                  setOrdersSortKey("title");
                                  setOrdersSortDir(d => d === "asc" ? "desc" : "asc");
                                }}
                              >
                                Tên hàng {ordersSortKey === "title" && (ordersSortDir === "asc" ? "▲" : "▼")}
                              </th>
                              <th className="py-3.5 px-4">Lộ trình</th>
                              <th
                                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => {
                                  setOrdersSortKey("status");
                                  setOrdersSortDir(d => d === "asc" ? "desc" : "asc");
                                }}
                              >
                                Trạng thái {ordersSortKey === "status" && (ordersSortDir === "asc" ? "▲" : "▼")}
                              </th>
                              <th
                                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => {
                                  setOrdersSortKey("price");
                                  setOrdersSortDir(d => d === "asc" ? "desc" : "asc");
                                }}
                              >
                                Cước phí {ordersSortKey === "price" && (ordersSortDir === "asc" ? "▲" : "▼")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredAndSortedOrders.map((order, index) => {
                              const price = getOrderPrice(order);
                              const status = order.status || "pending";
                              return (
                                <tr key={getOrderKey(order, index)} className="hover:bg-slate-50/50 transition">
                                  <td className="py-4 px-4 font-mono text-primary-600">
                                    <Link
                                      href={`/route-tracking?code=${order.orderCode || order._id}`}
                                      className="hover:underline"
                                    >
                                      {order.orderCode || order._id}
                                    </Link>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="font-bold text-slate-950">{order.title}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{order.cargoType || "Hàng hóa"}</div>
                                  </td>
                                  <td className="py-4 px-4 space-y-1 text-[11px] max-w-[200px] truncate">
                                    <div className="truncate"><span className="text-blue-600 font-bold">Nhận:</span> {order.pickup?.address}</div>
                                    <div className="truncate"><span className="text-emerald-600 font-bold">Trả:</span> {order.dropoff?.address}</div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-full text-center ${getStatusStyles(status)}`}>
                                      {getStatusLabel(status, normalizedRole)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-slate-950">
                                    {formatCurrency(price)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">Thông tin tài khoản</h2>
                        <p className="mt-1 text-sm text-slate-500">Các dữ liệu định danh của người dùng hiện tại.</p>
                      </div>
                      <button
                        onClick={() => setEditing((value) => !value)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {editing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {editing ? "Đóng" : "Sửa"}
                      </button>
                    </div>

                    {editing ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-500">Họ và tên</label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-500">Ngôn ngữ</label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                          >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" /> Lưu thay đổi
                        </button>
                      </form>
                    ) : (
                      <div className="grid gap-4">
                        <InfoRow icon={User} label="Họ tên" value={displayName} />
                        <InfoRow icon={Phone} label="Số điện thoại" value={profile.phone} />
                        <InfoRow icon={Mail} label="Email" value={profile.email} />
                        <InfoRow icon={Globe} label="Ngôn ngữ" value={profile.language === "en" ? "English" : "Tiếng Việt"} />
                      </div>
                    )}
                  </section>

                  <section className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoRow icon={BadgeCheck} label="Vai trò" value={roleLabels[normalizedRole]} />
                      <InfoRow icon={ShieldCheck} label="Trạng thái tài khoản" value={accountStatus} />
                      <InfoRow icon={FileCheck2} label="Trạng thái KYC" value={kycStatusLabel} />
                      <InfoRow icon={CalendarDays} label="Ngày tạo tài khoản" value={formatDate(profile.createdAt)} />
                      <InfoRow icon={Bell} label="Mã giới thiệu" value={profile.referralCode} />
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Đăng tin vận chuyển mới</h3>
                <p className="mt-1 text-sm text-slate-500">Nhập thông tin cơ bản để tài xế có thể nhận chuyến.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <Field label="Tên hàng hóa">
                <input
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="Ví dụ: 10 tấn xi măng"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Loại hàng">
                  <select
                    value={orderCargoType}
                    onChange={(e) => setOrderCargoType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                  >
                    <option value="Hàng tiêu dùng">Hàng tiêu dùng</option>
                    <option value="Nông sản">Nông sản</option>
                    <option value="Vật liệu xây dựng">Vật liệu xây dựng</option>
                    <option value="Điện tử">Điện tử</option>
                    <option value="Máy móc thiết bị">Máy móc thiết bị</option>
                  </select>
                </Field>
                <Field label="Trọng lượng (tấn)">
                  <input
                    type="number"
                    min="1"
                    value={orderWeight}
                    onChange={(e) => setOrderWeight(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                    required
                  />
                </Field>
              </div>
              <Field label="Điểm nhận hàng">
                <input
                  value={orderPickupAddress}
                  onChange={(e) => setOrderPickupAddress(e.target.value)}
                  placeholder="Ví dụ: KCN Sóng Thần, Bình Dương"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                  required
                />
              </Field>
              <Field label="Điểm giao hàng">
                <input
                  value={orderDropoffAddress}
                  onChange={(e) => setOrderDropoffAddress(e.target.value)}
                  placeholder="Ví dụ: Cảng Cát Lái, TP.HCM"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                  required
                />
              </Field>
              <Field label="Cước phí mong muốn (VND)">
                <input
                  type="number"
                  min="50000"
                  value={orderBudget}
                  onChange={(e) => setOrderBudget(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-primary-500"
                  required
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  Đăng tin ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showKycWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex flex-col items-center text-center">
              {/* Warning/Shield Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">Yêu cầu xác minh tài khoản</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Để đăng đơn vận chuyển mới, bạn cần hoàn thành xác minh danh tính điện tử (eKYC) thành công.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs font-bold text-slate-650 leading-5 text-left">
                Vui lòng tải ứng dụng di động <span className="text-primary-700 font-extrabold">TXEPRO</span> để thực hiện quét căn cước và đối chiếu gương mặt một cách tự động và an toàn.
              </div>

              {/* Download Badges or Links */}
              <div className="mt-5 grid grid-cols-2 gap-3 w-full">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Ứng dụng App Store đang cập nhật!"); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-3 hover:bg-slate-50 transition font-bold text-xs text-slate-800"
                >
                  App Store
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Ứng dụng Google Play đang cập nhật!"); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-3 hover:bg-slate-50 transition font-bold text-xs text-slate-800"
                >
                  Google Play
                </a>
              </div>

              <div className="mt-6 flex w-full flex-col gap-2">
                <button
                  onClick={() => setShowKycWarningModal(false)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-950 text-white py-3 text-sm font-bold transition shadow-sm"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

function InfoPill({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value || "Chưa có"}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function EmptyOrders() {
  return (
    <div className="py-14 text-center">
      <Package className="mx-auto h-11 w-11 text-slate-300" />
      <p className="mt-3 text-sm font-bold text-slate-700">Chưa có đơn hàng trong mục này</p>
      <p className="mt-1 text-sm text-slate-500">Khi có dữ liệu mới, danh sách sẽ tự hiển thị tại đây.</p>
    </div>
  );
}

function OrderRow({
  order,
  normalizedRole,
  workspaceTab,
  onAccept,
  onCancel,
}: {
  order: OrderSummary;
  normalizedRole: UserRole;
  workspaceTab: WorkspaceTab;
  onAccept: (orderId: string) => void;
  onCancel: (orderId: string) => void;
}) {
  const price = getOrderPrice(order);
  const status = order.status || "pending";

  return (
    <div className="grid gap-5 p-5 transition hover:bg-slate-50 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/route-tracking?code=${order.orderCode || order._id}`}
            className="font-mono text-sm font-bold text-primary-600 hover:text-primary-800 hover:underline transition"
            title="Nhấp vào để theo dõi bản đồ live GPS"
          >
            {order.orderCode || order._id}
          </Link>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{order.cargoType || "Hàng hóa"}</span>
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-950">{order.title || "Đơn vận chuyển"}</h3>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span className="break-words"><strong>Điểm nhận:</strong> {order.pickup?.address || "Chưa có"}</span>
          </p>
          <p className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="break-words"><strong>Điểm trả:</strong> {order.dropoff?.address || "Chưa có"}</span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
          <span>Loại xe: {order.vehicleType || "Chưa chọn"}</span>
          <span>Ngày tạo: {formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        <span className={`inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full text-center ${getStatusStyles(status)}`}>
          {getStatusLabel(status, normalizedRole)}
        </span>
        <div className="rounded-lg bg-slate-50 p-4 text-left lg:text-right">
          <p className="text-xs font-bold uppercase text-slate-500">Cước phí</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatCurrency(price)}</p>
        </div>
        {normalizedRole === "chu-hang" && workspaceTab === "waiting" && (
          <button
            onClick={() => onCancel(order._id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <Ban className="h-4 w-4" /> Hủy đơn
          </button>
        )}
        {normalizedRole === "tai-xe" && workspaceTab === "waiting" && (
          <button
            onClick={() => onAccept(order._id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          >
            <Truck className="h-4 w-4" /> Nhận đơn
          </button>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={<PageSkeleton />}
    >
      <UserProfileContent />
    </Suspense>
  );
}

function SkeletonLoader({ tab }: { tab: MainTab }) {
  return (
    <div className="mt-8 animate-pulse space-y-6">
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-slate-200 border border-slate-200/50" />
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="space-y-3 pt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-44 rounded-lg bg-slate-200 border border-slate-200/50" />
            <div className="h-56 rounded-lg bg-slate-200 border border-slate-200/50" />
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-6">
          <div className="h-20 rounded-lg bg-slate-200 border border-slate-200/50" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-slate-200 border border-slate-200/50" />
            ))}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="h-[400px] rounded-lg bg-slate-200 border border-slate-200/50" />
          <div className="space-y-6">
            <div className="h-[200px] rounded-lg bg-slate-200 border border-slate-200/50" />
            <div className="h-[200px] rounded-lg bg-slate-200 border border-slate-200/50" />
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="border-b border-slate-200 pb-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex gap-5 items-center">
              <div className="h-24 w-24 rounded-lg bg-slate-200" />
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-200 rounded" />
                </div>
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-72 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-32 bg-slate-200 rounded-lg" />
              <div className="h-11 w-32 bg-slate-200 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-4 border-b border-slate-200 pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-28 bg-slate-200 rounded-lg" />
            ))}
          </div>

          <SkeletonLoader tab="overview" />
        </div>
      </main>
    </>
  );
}
