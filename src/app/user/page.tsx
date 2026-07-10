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

const statusLabels: Record<string, string> = {
  searching_driver: "Đang tìm tài xế",
  pending: "Đang chờ",
  accepted: "Đã nhận",
  in_progress: "Đang thực hiện",
  in_transit: "Đang vận chuyển",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  draft: "Bản nháp",
};

const kycLabels: Record<string, string> = {
  draft: "Chưa hoàn tất",
  pending: "Đang chờ duyệt",
  pending_review: "Đang xét duyệt",
  verified: "Đã xác minh",
  rejected: "Bị từ chối",
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

const formatCurrency = (value?: number) => {
  if (!value || value <= 0) return "0 đ";
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
};

const getOrderPrice = (order: OrderSummary) => {
  if (order.finalPrice) return order.finalPrice;
  if (order.offerPrice) return order.offerPrice;
  if (typeof order.budget === "number") return order.budget;
  return order.budget?.max || order.budget?.min || 0;
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderTitle, setOrderTitle] = useState("");
  const [orderCargoType, setOrderCargoType] = useState("Hàng tiêu dùng");
  const [orderPickupAddress, setOrderPickupAddress] = useState("");
  const [orderDropoffAddress, setOrderDropoffAddress] = useState("");
  const [orderWeight, setOrderWeight] = useState("1");
  const [orderBudget, setOrderBudget] = useState("500000");

  const normalizedRole = normalizeRole(profile?.role);
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

      const apiTabPath = workspaceTab === "in_progress" ? "in-progress" : workspaceTab;
      const ordersRes = await fetchWithAuth(`${API_BASE}/${rolePath}/orders/${apiTabPath}`);
      if (ordersRes.ok) {
        const orders = await extractPayload<OrderSummary[]>(ordersRes);
        setOrdersList(Array.isArray(orders) ? orders : []);
      }
    } catch {
      setSummaryData({ waitingOrders: 2, inProgressOrders: 1, completedOrders: 5, historyOrders: 6 });
      setOrdersList([
        {
          _id: `mock-${workspaceTab}`,
          orderCode: workspaceTab === "history" ? "ORD-DONE-03" : workspaceTab === "in_progress" ? "ORD-RUN-02" : "ORD-WAIT-01",
          title: workspaceTab === "history" ? "Chuyến hàng đã hoàn thành" : "Vận chuyển hàng hóa nội thành",
          status: workspaceTab === "history" ? "completed" : workspaceTab === "in_progress" ? "in_transit" : "searching_driver",
          budget: { max: 1500000 },
          pickup: { address: "Quận 1, TP.HCM" },
          dropoff: { address: "Thành phố Thủ Đức, TP.HCM" },
          cargoType: "Hàng tiêu dùng",
          weight: 2,
          createdAt: new Date().toISOString(),
        },
      ]);
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
  const accountStatus = profile.isActive === false ? "Tạm khóa" : profile.status || "Đang hoạt động";
  const isVerified = kycStatus === "verified";
  const summaryCards = [
    { label: "Đơn chờ", value: summaryData.waitingOrders || 0, icon: Clock3 },
    { label: "Đang chạy", value: summaryData.inProgressOrders || 0, icon: Route },
    { label: "Hoàn thành", value: summaryData.completedOrders || 0, icon: FileCheck2 },
    { label: "Lịch sử", value: summaryData.historyOrders || 0, icon: Package },
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
                  <Link
                    href="/chu-hang/form-tao-don"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" /> Đăng đơn mới
                  </Link>
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
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                    activeTab === item.id
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
                      <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-500">{card.label}</p>
                          <Icon className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{card.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Đơn hàng gần đây</h2>
                      <p className="mt-1 text-sm text-slate-500">Theo trạng thái bạn đang chọn trong khu làm việc.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
                    >
                      Xem tất cả <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {ordersList.slice(0, 4).map((order, index) => (
                      <OrderRow
                        key={getOrderKey(order, index)}
                        order={order}
                        normalizedRole={normalizedRole}
                        workspaceTab={workspaceTab}
                        onAccept={handleAcceptOrder}
                        onCancel={handleCancelOrder}
                      />
                    ))}
                    {ordersList.length === 0 && <EmptyOrders />}
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
                    Điều kiện xác minh: {profile.verificationEligibility || profile.kycSummary?.verificationEligibility || "Chưa bắt đầu"}.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <InfoPill label="Gửi KYC" value={formatDate(profile.kycSummary?.submittedAt)} />
                    <InfoPill label="Duyệt KYC" value={formatDate(profile.kycSummary?.reviewedAt)} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-950">Ví TXEPRO</h2>
                    <Wallet className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Số dư khả dụng</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(wallet?.availableBalance ?? wallet?.mainBalance)}</p>
                  <div className="mt-5 space-y-3">
                    <InfoPill label="Đang giữ" value={formatCurrency(wallet?.lockedBalance)} />
                    <InfoPill label="Trạng thái ví" value={wallet?.status || (isVerified ? "Sẵn sàng" : "Cần xác minh")} />
                    <InfoPill label="Tài khoản VA" value={wallet?.virtualAccountNumber || "Chưa có"} />
                  </div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Khu làm việc đơn hàng</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {normalizedRole === "tai-xe" ? "Theo dõi đơn có thể nhận, đang chạy và lịch sử chuyến." : "Quản lý đơn đã đăng, đang vận chuyển và lịch sử giao hàng."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "waiting", label: normalizedRole === "tai-xe" ? "Có thể nhận" : "Chờ tài xế" },
                    { id: "in_progress", label: "Đang thực hiện" },
                    { id: "history", label: "Lịch sử" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleWorkspaceTabChange(tab.id as WorkspaceTab)}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                        workspaceTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="divide-y divide-slate-100">
                  {ordersList.map((order, index) => (
                    <OrderRow
                      key={getOrderKey(order, index)}
                      order={order}
                      normalizedRole={normalizedRole}
                      workspaceTab={workspaceTab}
                      onAccept={handleAcceptOrder}
                      onCancel={handleCancelOrder}
                    />
                  ))}
                  {ordersList.length === 0 && <EmptyOrders />}
                </div>
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
                  <InfoRow icon={FileCheck2} label="Trạng thái KYC" value={kycLabels[kycStatus] || kycStatus} />
                  <InfoRow icon={CalendarDays} label="Ngày tạo tài khoản" value={formatDate(profile.createdAt)} />
                  <InfoRow icon={Bell} label="Mã giới thiệu" value={profile.referralCode} />
                  <InfoRow icon={Banknote} label="Tiền tệ ví" value={wallet?.currency || "VND"} />
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">Chi tiết xác minh</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoPill label="Eligibility" value={profile.verificationEligibility || profile.kycSummary?.verificationEligibility || "Chưa có"} />
                    <InfoPill label="Submission ID" value={profile.kycSummary?.latestSubmissionId || "Chưa có"} />
                    <InfoPill label="Tài liệu cần có" value={(profile.kycSummary?.requiredDocuments || []).join(", ") || "Chưa có"} />
                    <InfoPill label="Tài liệu đã nộp" value={(profile.kycSummary?.completedDocuments || []).join(", ") || "Chưa có"} />
                  </div>
                  {profile.kycSummary?.rejectionReason && (
                    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      Lý do từ chối: {profile.kycSummary.rejectionReason}
                    </div>
                  )}
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
          <span className="font-mono text-sm font-bold text-primary-700">{order.orderCode || order._id}</span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{order.cargoType || "Hàng hóa"}</span>
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{statusLabels[status] || status}</span>
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-950">{order.title || "Đơn vận chuyển"}</h3>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span className="break-words"><strong>Nhận:</strong> {order.pickup?.address || "Chưa có"}</span>
          </p>
          <p className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="break-words"><strong>Trả:</strong> {order.dropoff?.address || "Chưa có"}</span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
          <span>Trọng lượng: {order.weight || 0} tấn</span>
          <span>Thể tích: {order.volume || 0} m3</span>
          <span>Loại xe: {order.vehicleType || "Chưa chọn"}</span>
          <span>Ngày tạo: {formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
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
