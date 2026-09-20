"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Car,
  CircleDollarSign,
  MapPin,
  Phone,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  ZoomIn,
  X,
  Download,
  Copy,
  Check,
  RefreshCw,
  Truck,
  FileText,
  Sliders,
  PhoneCall,
  Mail,
  Eye,
  Info,
  Layers,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";

interface UserInfo {
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string | null;
  portraitImage?: string | null;
  kycStatus?: string;
  isActive?: boolean;
  referralCode?: string | null;
  createdAt?: string | null;
  kycData?: {
    portraitImage?: string | null;
    idCardFrontImage?: string | null;
    idCardBackImage?: string | null;
    fullName?: string | null;
    idNumber?: string | null;
    permanentAddress?: string | null;
    currentAddress?: string | null;
  } | null;
}

interface VehicleInfo {
  _id?: string;
  type?: string;
  vehicleTypeParent?: string | null;
  vehicleTypeChild?: string | null;
  plateNumber?: string;
  brand?: string | null;
  model?: string | null;
  capacity?: number | null;
  seats?: number | null;
  status?: string;
  ownerName?: string | null;
  operatingProvinceName?: string | null;
  cargoTypes?: string[];
  dimensions?: { length?: number | null; width?: number | null; height?: number | null } | null;
  licenseImages?: string[];
  vehicleImages?: string[];
  images?: string[];
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
  scheduleType?: string;
  availableFrom?: string | null;
  availableTo?: string | null;
  pricing?: { type?: string; minPrice?: number | null; maxPrice?: number | null };
  pricingMode?: string;
  price?: number | null;
  platformFeePercent?: number | null;
  vehicleSeats?: number | null;
  availableSeats?: number | null;
  isFull?: boolean;
  status: string;
  cargoTypes?: string[];
  createdAt: string;
}

interface GalleryImageItem {
  id: string;
  url: string;
  title: string;
  category: "driver" | "vehicle" | "license";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "Bản nháp", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  active: { label: "Đang mở nhận đơn", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  paused: { label: "Tạm dừng", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  scheduled: { label: "Đã lên lịch", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  matched: { label: "Đã ghép đơn", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  in_progress: { label: "Đang chạy", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  completed: { label: "Hoàn thành", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  cancelled: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const PRICING_MODE_LABEL: Record<string, string> = {
  freight: "Chở hàng",
  full_trip: "Bao chuyến",
  shared_seat: "Ghép ghế",
};

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  verified: { label: "Đã xác thực KYC", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: ShieldCheck },
  pending: { label: "Đang chờ duyệt KYC", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  rejected: { label: "Bị từ chối KYC", color: "text-rose-600 bg-rose-50 border-rose-200", icon: ShieldAlert },
  unverified: { label: "Chưa xác thực KYC", color: "text-slate-600 bg-slate-100 border-slate-200", icon: AlertCircle },
  draft: { label: "Bản nháp KYC", color: "text-slate-500 bg-slate-100 border-slate-200", icon: AlertCircle },
};

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "---");
const formatRadius = (meters?: number | null) => {
  if (!meters) return "Chưa ghi nhận";
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
};

const formatCapacityTon = (value?: number | null) => {
  if (value == null || value <= 0) return null;
  const ton = value >= 100 ? value / 1000 : value;
  const formatted = Number.isInteger(ton) ? ton.toString() : ton.toFixed(1).replace(/\.0$/, "");
  return `${formatted} tấn`;
};

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-right font-bold text-slate-800">{value || "---"}</span>
    </div>
  );
}

export default function AdminDriverPostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<DriverPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Lightbox Modal state
  const [lightboxImage, setLightboxImage] = useState<GalleryImageItem | null>(null);

  // Status Change Modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [statusNote, setStatusNote] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusSuccessToast, setStatusSuccessToast] = useState("");

  const fetchPost = useCallback(async (showRefreshing = false) => {
    if (!params.id) return;
    if (showRefreshing) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/driver-posts/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch driver post detail");
      const data = await res.json();
      const currentPost = data.data?.post || null;
      setPost(currentPost);
      if (currentPost?.status) {
        setSelectedStatus(currentPost.status);
      }
      setErrorMessage("");
    } catch (err) {
      console.warn("Driver post detail API failed", err);
      setPost(null);
      setErrorMessage("Không thể tải chi tiết tin đăng tài xế từ hệ thống.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Google Maps Initializer
  useEffect(() => {
    if (!post?.route?.from && !post?.route?.to) return;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDq4-qHUd9qYi5go9mI3OpoLEgpMhzgGU&libraries=places,geometry";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => initRadiusMap();
    } else if ((window as any).google) {
      initRadiusMap();
    }

    function initRadiusMap() {
      const google = (window as any).google;
      const mapContainer = document.getElementById("driver-post-radius-map");
      if (!google || !mapContainer || !post) return;

      const sharedRadius = post.route?.radiusMeters || null;
      const pickupRadius = post.route?.pickupRadiusMeters || sharedRadius || 0;
      const dropoffRadius = post.route?.dropoffRadiusMeters || sharedRadius || 0;
      const geocoder = new google.maps.Geocoder();
      const map = new google.maps.Map(mapContainer, {
        center: { lat: 16.054407, lng: 108.202164 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        scrollwheel: true,
        gestureHandling: "greedy",
      });

      const geocodeAddress = (address?: string | null) =>
        new Promise<any | null>((resolve) => {
          if (!address) return resolve(null);
          geocoder.geocode({ address }, (results: any, status: string) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
              resolve(results[0].geometry.location);
            } else {
              console.warn("Driver post geocode failed", address, status);
              resolve(null);
            }
          });
        });

      const pointFromRoute = (lat?: number | null, lng?: number | null) => {
        const nextLat = Number(lat);
        const nextLng = Number(lng);
        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return null;
        return new google.maps.LatLng(nextLat, nextLng);
      };

      Promise.all([
        Promise.resolve(pointFromRoute(post.route?.pickupLat, post.route?.pickupLng)).then((point) => point || geocodeAddress(post.route?.from)),
        Promise.resolve(pointFromRoute(post.route?.dropoffLat, post.route?.dropoffLng)).then((point) => point || geocodeAddress(post.route?.to)),
      ]).then(([pickupLocation, dropoffLocation]) => {
        const bounds = new google.maps.LatLngBounds();
        const points: any[] = [];

        if (pickupLocation) {
          new google.maps.Marker({
            position: pickupLocation,
            map,
            label: "N",
            title: "Điểm nhận hàng",
          });
          points.push(pickupLocation);
          bounds.extend(pickupLocation);

          if (pickupRadius > 0) {
            const pickupCircle = new google.maps.Circle({
              map,
              center: pickupLocation,
              radius: pickupRadius,
              strokeColor: "#2563eb",
              strokeOpacity: 0.95,
              strokeWeight: 3,
              fillColor: "#2563eb",
              fillOpacity: 0.18,
              zIndex: 2,
            });
            pickupCircle.getBounds() && bounds.union(pickupCircle.getBounds());
          }
        }

        if (dropoffLocation) {
          new google.maps.Marker({
            position: dropoffLocation,
            map,
            label: "T",
            title: "Điểm trả hàng",
          });
          points.push(dropoffLocation);
          bounds.extend(dropoffLocation);

          if (dropoffRadius > 0) {
            const dropoffCircle = new google.maps.Circle({
              map,
              center: dropoffLocation,
              radius: dropoffRadius,
              strokeColor: "#059669",
              strokeOpacity: 0.95,
              strokeWeight: 3,
              fillColor: "#10b981",
              fillOpacity: 0.18,
              zIndex: 2,
            });
            dropoffCircle.getBounds() && bounds.union(dropoffCircle.getBounds());
          }
        }

        if (points.length === 2) {
          const drawFallbackLine = () => {
            new google.maps.Polyline({
              map,
              path: points,
              strokeColor: "#0f172a",
              strokeOpacity: 0.55,
              strokeWeight: 4,
              icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                offset: "50%",
              }],
            });
          };

          const directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: "#2563eb",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
          });
          const directionsService = new google.maps.DirectionsService();
          directionsService.route(
            {
              origin: points[0],
              destination: points[1],
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result: any, status: string) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
              } else {
                console.warn("Driver post directions failed", status);
                drawFallbackLine();
              }
            }
          );
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 56);
        }
      });
    }
  }, [post]);

  const handleCopyId = () => {
    if (!post?._id) return;
    navigator.clipboard.writeText(post._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleUpdateStatus = async () => {
    if (!post?._id) return;
    setIsSubmittingStatus(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/driver-posts/${post._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          note: statusNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Cập nhật trạng thái thất bại");
      }

      setPost((prev) => (prev ? { ...prev, status: selectedStatus, note: statusNote.trim() || prev.note } : null));
      setIsStatusModalOpen(false);
      setStatusSuccessToast(`Đã chuyển trạng thái sang [${STATUS_CONFIG[selectedStatus]?.label || selectedStatus}] thành công!`);
      setTimeout(() => setStatusSuccessToast(""), 4000);
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Đang tải chi tiết tin đăng...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow text-center space-y-4 max-w-md mx-auto mt-10">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy tin đăng</h2>
        <p className="text-slate-500 text-xs">Mã tin đăng không tồn tại hoặc đã bị xóa khỏi hệ thống cơ sở dữ liệu.</p>
        <Link href="/admin/orders/drivers" className="btn-primary inline-flex px-5 py-3 rounded-xl text-xs font-bold">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const driver = post.driverId;
  const vehicle = post.vehicleId;
  const vehicleFullType = [vehicle?.vehicleTypeParent, vehicle?.vehicleTypeChild, vehicle?.type]
    .filter(Boolean)
    .join(" ");
  const vehicleCategory = getVehicleCategory(vehicleFullType);
  const priceText = post.price
    ? formatMoney(post.price)
    : `${formatMoney(post.pricing?.minPrice)} - ${formatMoney(post.pricing?.maxPrice)}`;
  const sharedRadius = post.route?.radiusMeters || null;
  const pickupRadius = post.route?.pickupRadiusMeters || sharedRadius;
  const dropoffRadius = post.route?.dropoffRadiusMeters || sharedRadius;

  const currentStatusConfig = STATUS_CONFIG[post.status] || {
    label: post.status,
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };

  const kycConfig = KYC_STATUS_CONFIG[driver?.kycStatus || "unverified"] || KYC_STATUS_CONFIG.unverified;
  const KycIcon = kycConfig.icon;

  // Resolve Driver Avatar
  const rawAvatar = driver?.avatar || driver?.portraitImage || driver?.kycData?.portraitImage;
  const driverAvatarUrl = getServerMediaUrl(rawAvatar);

  // Collect All Vehicle & License Images
  const galleryImages: GalleryImageItem[] = [];

  if (driverAvatarUrl) {
    galleryImages.push({
      id: "driver-avatar",
      url: driverAvatarUrl,
      title: `Ảnh nhận diện tài xế: ${driver?.name || "Tài xế"}`,
      category: "driver",
    });
  }

  if (driver?.kycData?.idCardFrontImage) {
    const frontUrl = getServerMediaUrl(driver.kycData.idCardFrontImage);
    if (frontUrl) {
      galleryImages.push({
        id: "driver-cccd-front",
        url: frontUrl,
        title: "Ảnh CCCD mặt trước (KYC)",
        category: "driver",
      });
    }
  }

  if (driver?.kycData?.idCardBackImage) {
    const backUrl = getServerMediaUrl(driver.kycData.idCardBackImage);
    if (backUrl) {
      galleryImages.push({
        id: "driver-cccd-back",
        url: backUrl,
        title: "Ảnh CCCD mặt sau (KYC)",
        category: "driver",
      });
    }
  }

  if (Array.isArray(vehicle?.licenseImages)) {
    vehicle.licenseImages.forEach((img, idx) => {
      const url = getServerMediaUrl(img);
      if (url) {
        galleryImages.push({
          id: `license-${idx}`,
          url,
          title: `Giấy tờ đăng kiểm / Bằng lái / Cavet (${idx + 1})`,
          category: "license",
        });
      }
    });
  }

  if (Array.isArray(vehicle?.vehicleImages)) {
    vehicle.vehicleImages.forEach((img, idx) => {
      const url = getServerMediaUrl(img);
      if (url) {
        galleryImages.push({
          id: `vehicle-img-${idx}`,
          url,
          title: `Hình ảnh thực tế phương tiện (${idx + 1})`,
          category: "vehicle",
        });
      }
    });
  }

  if (Array.isArray(vehicle?.images)) {
    vehicle.images.forEach((img, idx) => {
      const url = getServerMediaUrl(img);
      if (url && !galleryImages.some((g) => g.url === url)) {
        galleryImages.push({
          id: `vehicle-extra-${idx}`,
          url,
          title: `Hình ảnh xe chụp ngoài (${idx + 1})`,
          category: "vehicle",
        });
      }
    });
  }

  const vehicleOnlyImages = galleryImages.filter((g) => g.category === "vehicle" || g.category === "license");

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Toast Notification */}
      {statusSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusSuccessToast}</span>
          </div>
          <button onClick={() => setStatusSuccessToast("")} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TOP HEADER & ADMIN DISPATCH ACTIONS */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/orders/drivers"
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-all cursor-pointer shadow-2xs"
            title="Quay lại danh sách tin đăng"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chi Tiết Tin Đăng Tài Xế
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStatusConfig.bg} ${currentStatusConfig.color} ${currentStatusConfig.border}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {currentStatusConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>Mã tin:</span>
              <span className="font-mono font-bold text-slate-700">{post._id}</span>
              <button
                onClick={handleCopyId}
                className="hover:text-primary-600 transition-colors cursor-pointer p-0.5"
                title="Sao chép mã tin"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span>•</span>
              <span>Đăng ngày: <strong className="text-slate-600">{formatDateTime(post.createdAt)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls for Admin */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fetchPost(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary-600" : ""}`} />
            <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStatus(post.status);
              setIsStatusModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Đổi trạng thái tin</span>
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 COLS) */}
        <div className="xl:col-span-2 space-y-6">
          {/* SECTION 1: ROUTE & RADIUS MAP */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" /> Tuyến Đăng Và Vùng Phủ Bán Kính
              </h2>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Google Maps Dynamic Routing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50/50 border border-blue-100/80 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Điểm nhận hàng (Điểm Đi)</p>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">{post.route?.from || "Chưa xác định"}</p>
                <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bán kính nhận:</span>
                  <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                    {formatRadius(pickupRadius)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/80 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Điểm trả hàng (Điểm Đến)</p>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">{post.route?.to || "Chưa xác định"}</p>
                <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bán kính trả:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    {formatRadius(dropoffRadius)}
                  </span>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 relative">
              <div id="driver-post-radius-map" className="h-[360px] w-full" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-4 flex-wrap font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span> Bán kính nhận hàng (Vòng xanh dương)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Bán kính trả hàng (Vòng xanh lá)
                </span>
              </div>
              <span className="text-slate-400">Tự động tối ưu bán kính ghép chuyến</span>
            </div>

            {post.note && (
              <div className="rounded-2xl bg-amber-50/60 border border-amber-200/60 p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ghi chú từ tài xế: </span>
                  <span>{post.note}</span>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: VEHICLE INFORMATION & IMAGES GALLERY */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Phương Tiện & Giấy Tờ Đăng Kiểm
                  </h2>
                  <p className="text-xs text-slate-400">Thông số kỹ thuật và hình ảnh xác thực phương tiện</p>
                </div>
              </div>

              {/* VIETNAMESE LICENSE PLATE BADGE */}
              {vehicle?.plateNumber && (
                <div className="flex items-center gap-2">
                  <div className="bg-amber-300 text-slate-950 font-mono font-bold px-3.5 py-1 rounded-xl border-2 border-slate-900 shadow-xs text-sm tracking-widest uppercase flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-800 tracking-normal font-sans">VN</span>
                    <span>{vehicle.plateNumber}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loại xe</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {vehicle?.vehicleTypeChild || vehicle?.type || "Chưa xác định"}
                </span>
                {vehicle?.vehicleTypeParent && (
                  <span className="text-[10px] text-slate-500 font-semibold">{vehicle.vehicleTypeParent}</span>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hãng & Mẫu xe</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Chưa ghi nhận"}
                </span>
              </div>

              {/* 1. Số chỗ: Chỉ hiển thị cho Ô tô */}
              {vehicleCategory === "passenger_car" && (
                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Số chỗ / Ghế</span>
                    <span className={`text-[10px] font-bold ${post.isFull ? "text-rose-600" : "text-emerald-600"}`}>
                      • {post.isFull ? "Đã đầy chỗ" : "Còn nhận khách"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-950 mt-1 block">
                    {post.availableSeats != null
                      ? `${post.availableSeats} chỗ khả dụng`
                      : vehicle?.seats != null || post.vehicleSeats != null
                      ? `${vehicle?.seats ?? post.vehicleSeats} chỗ`
                      : "Chưa cập nhật"}
                  </span>
                </div>
              )}

              {/* 2. Tải trọng: Chỉ hiển thị cho Xe tải vs Xe công vs Xe cẩu, xe tải cẩu */}
              {vehicleCategory === "cargo_heavy" && (
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Tải trọng chuyên chở</span>
                    <span className={`text-[10px] font-bold ${post.isFull ? "text-rose-600" : "text-emerald-700"}`}>
                      • {post.isFull ? "Đã đầy tải" : "Còn nhận hàng"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-950 mt-1 block">
                    {formatCapacityTon(vehicle?.capacity) || "Chưa cập nhật"}
                  </span>
                </div>
              )}

              {/* Kích thước thùng (DxRxC): Chỉ hiển thị cho Xe tải vs Xe công vs Xe cẩu, xe tải cẩu */}
              {vehicleCategory === "cargo_heavy" && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kích thước thùng (DxRxC)</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {vehicle?.dimensions?.length || vehicle?.dimensions?.width || vehicle?.dimensions?.height
                      ? `${vehicle.dimensions.length || "-"} x ${vehicle.dimensions.width || "-"} x ${vehicle.dimensions.height || "-"} m`
                      : "Chưa cập nhật"}
                  </span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chủ sở hữu đăng ký</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block truncate">
                  {vehicle?.ownerName || "---"}
                </span>
              </div>
            </div>

            {/* VEHICLE & LICENSE DOCUMENTS GALLERY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary-600" />
                  Hình Ảnh Xe & Hồ Sơ Giấy Tờ Đăng Kiểm ({vehicleOnlyImages.length})
                </h3>
                <span className="text-[11px] text-slate-400">Nhấp vào ảnh để phóng to chi tiết</span>
              </div>

              {vehicleOnlyImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {vehicleOnlyImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxImage(img)}
                      className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-primary-400"
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                        <span className="self-end p-1 rounded-lg bg-black/50 text-white">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[10px] font-bold line-clamp-1 bg-black/60 px-1.5 py-0.5 rounded-md">
                          {img.title}
                        </p>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 group-hover:opacity-0 transition-opacity">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                            img.category === "license"
                              ? "bg-amber-500/90 text-white"
                              : "bg-blue-600/90 text-white"
                          }`}
                        >
                          {img.category === "license" ? "Giấy tờ xe" : "Ảnh xe"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/60 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Chưa có hình ảnh xe hoặc giấy tờ đăng kiểm đính kèm</p>
                  <p className="text-[11px] text-slate-400">
                    Tài xế chưa tải lên ảnh chụp giấy đăng ký hoặc ảnh xe thực tế trong hồ sơ phương tiện.
                  </p>
                </div>
              )}
            </div>

            {/* CARGO TYPES SECTION: Chỉ hiển thị cho xe tải vs xe công vs Xe cẩu, xe tải cẩu */}
            {vehicleCategory === "cargo_heavy" && (() => {
              const cargoList =
                post.cargoTypes && post.cargoTypes.length > 0
                  ? post.cargoTypes
                  : vehicle?.cargoTypes && vehicle.cargoTypes.length > 0
                  ? vehicle.cargoTypes
                  : [];

              if (cargoList.length === 0) return null;

              return (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary-600" /> Nhóm hàng hóa nhận vận chuyển ({cargoList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cargoList.map((cargo, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200"
                      >
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        </div>

        {/* RIGHT COLUMN (1 COL) */}
        <div className="space-y-6">
          {/* SECTION 3: DRIVER IDENTITY CARD */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserRound className="w-4 h-4 text-primary-600" /> Hồ Sơ Tài Xế
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${kycConfig.color}`}
              >
                <KycIcon className="w-3 h-3" />
                {kycConfig.label}
              </span>
            </div>

            {/* DRIVER AVATAR & BASIC DETAILS */}
            <div className="flex items-start gap-4">
              <div
                onClick={() => {
                  if (driverAvatarUrl) {
                    setLightboxImage({
                      id: "driver-avatar-modal",
                      url: driverAvatarUrl,
                      title: `Ảnh nhận diện tài xế: ${driver?.name || "Tài xế"}`,
                      category: "driver",
                    });
                  }
                }}
                className={`relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-100 shrink-0 shadow-xs ${
                  driverAvatarUrl ? "cursor-pointer group hover:border-primary-500 transition-colors" : ""
                }`}
                title={driverAvatarUrl ? "Nhấp để xem ảnh lớn" : "Chưa có ảnh đại diện"}
              >
                {driverAvatarUrl ? (
                  <>
                    <img
                      src={driverAvatarUrl}
                      alt={driver?.name || "Driver avatar"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-xl">
                    {driver?.name ? driver.name.charAt(0).toUpperCase() : "TX"}
                  </div>
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {driver?.name || "Tài xế ẩn danh"}
                  </h3>
                  {driver?.kycStatus === "verified" && (
                    <span title="Đã xác thực danh tính CCCD/GPLX">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Trạng thái:{" "}
                  <span className={driver?.isActive !== false ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {driver?.isActive !== false ? "Đang hoạt động" : "Tạm khóa"}
                  </span>
                </p>
                {driver?.referralCode && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Mã giới thiệu: <strong className="text-slate-700">{driver.referralCode}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* CONTACT ROW */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary-600" />
                  <span className="font-bold text-slate-800">{driver?.phone || "Chưa có SĐT"}</span>
                </div>
                {driver?.phone && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${driver.phone}`}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Gọi điện thoại"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(driver.phone)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary-600 transition-colors cursor-pointer"
                      title="Sao chép số điện thoại"
                    >
                      {copiedPhone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {driver?.email && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Mail className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{driver.email}</span>
                  </div>
                  <a
                    href={`mailto:${driver.email}`}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary-600 transition-colors shrink-0"
                    title="Gửi email"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Profile Link */}
            {driver?._id && (
              <Link
                href={`/admin/users?search=${encodeURIComponent(driver.phone || driver.name || "")}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Xem hồ sơ quản trị chi tiết</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </section>

          {/* SECTION 4: PRICING & MODE */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-primary-600" /> Giá Cước & Chế Độ Chuyến
            </h2>
            <div className="space-y-1">
              <InfoRow label="Giá cước đăng" value={<span className="text-primary-600 font-bold text-base">{priceText}</span>} />
              <InfoRow label="Loại chuyến" value={PRICING_MODE_LABEL[post.pricingMode || ""] || post.pricingMode} />
              <InfoRow label="Cách báo giá" value={post.pricing?.type === "fixed" ? "Giá cố định" : "Thương lượng linh hoạt"} />
              <InfoRow label="Phí nền tảng" value={post.platformFeePercent != null ? `${post.platformFeePercent * 100}%` : "Mặc định hệ thống"} />
              <InfoRow
                label="Tình trạng nhận chuyến"
                value={
                  post.isFull ? (
                    <span className="text-rose-600 font-bold">
                      {vehicleCategory === "passenger_car"
                        ? "Đã đầy chỗ"
                        : vehicleCategory === "cargo_heavy"
                        ? "Đã đầy tải"
                        : "Đã đầy"}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">
                      {vehicleCategory === "passenger_car"
                        ? "Còn nhận khách"
                        : vehicleCategory === "cargo_heavy"
                        ? "Còn nhận hàng"
                        : "Đang nhận ghép"}
                    </span>
                  )
                }
              />
            </div>
          </section>

          {/* SECTION 5: SCHEDULE & AVAILABILITY */}
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary-600" /> Lịch Trình Khả Dụng
            </h2>
            <div className="space-y-1">
              <InfoRow
                label="Kiểu lịch trình"
                value={post.scheduleType === "scheduled" ? "Đặt lịch hẹn trước" : "Đang sẵn sàng chạy ngay"}
              />
              <InfoRow label="Khởi hành từ" value={formatDateTime(post.availableFrom)} />
              <InfoRow label="Hạn chót" value={formatDateTime(post.availableTo)} />
              <InfoRow label="Ngày tạo tin" value={formatDateTime(post.createdAt)} />
            </div>
          </section>
        </div>
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-bold truncate">{lightboxImage.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Mở ảnh trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Đóng xem ảnh"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative max-h-[82vh] max-w-[95vw] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[82vh] max-w-[95vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* --- STATUS CHANGE MODAL --- */}
      {isStatusModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Đổi Trạng Thái Tin Đăng</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Chọn trạng thái mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="active">Đang mở nhận đơn (Active)</option>
                  <option value="paused">Tạm dừng nhận đơn (Paused)</option>
                  <option value="scheduled">Đã lên lịch trước (Scheduled)</option>
                  <option value="matched">Đã ghép đơn (Matched)</option>
                  <option value="in_progress">Đang chạy vận chuyển (In Progress)</option>
                  <option value="completed">Đã hoàn thành chuyến (Completed)</option>
                  <option value="cancelled">Hủy tin đăng (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Ghi chú quản trị viên (Tùy chọn)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Nhập lý do hoặc hướng dẫn điều phối..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isSubmittingStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isSubmittingStatus}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingStatus ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Xác nhận cập nhật</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
