"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Car, CircleDollarSign, MapPin, Phone, UserRound } from "lucide-react";
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
  ownerName?: string | null;
  dimensions?: { length?: number | null; width?: number | null; height?: number | null } | null;
}

interface DriverPost {
  _id: string;
  driverId?: UserInfo;
  vehicleId?: VehicleInfo;
  route?: {
    from?: string | null;
    to?: string | null;
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
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Bản nháp",
  active: "Đang mở",
  paused: "Tạm dừng",
  scheduled: "Đã lên lịch",
  matched: "Đã ghép đơn",
  in_progress: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const PRICING_MODE_LABEL: Record<string, string> = {
  freight: "Chở hàng",
  full_trip: "Bao chuyến",
  shared_seat: "Ghép ghế",
};

const MOCK_POST: DriverPost = {
  _id: "dp-mock-1",
  driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
  vehicleId: {
    type: "truck",
    vehicleTypeChild: "Xe tải 5 tấn",
    plateNumber: "51C-123.45",
    brand: "Isuzu",
    model: "NQR",
    capacity: 5000,
    status: "active",
    ownerName: "Nguyễn Văn Tuấn",
  },
  route: { from: "TP.HCM", to: "Bình Dương", pickupRadiusMeters: 3000, dropoffRadiusMeters: 5000 },
  pricing: { type: "fixed", minPrice: 1800000, maxPrice: 2200000 },
  pricingMode: "freight",
  price: 2000000,
  scheduleType: "active",
  status: "active",
  note: "Nhận hàng trong ngày, ưu tiên hàng pallet.",
  createdAt: "2026-07-09T08:30:00Z",
};

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "---");
const formatRadius = (meters?: number | null) => {
  if (!meters) return "Chưa ghi nhận";
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-right font-bold text-slate-800">{value || "---"}</span>
    </div>
  );
}

export default function AdminDriverPostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<DriverPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/driver-posts/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch driver post detail");
        const data = await res.json();
        setPost(data.data.post);
        setIsOffline(false);
      } catch (err) {
        console.warn("Driver post detail API offline, using mock data", err);
        setPost({ ...MOCK_POST, _id: params.id });
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchPost();
  }, [params.id]);

  useEffect(() => {
    if (!post?.route?.from && !post?.route?.to) return;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAom_mi4uBknVObU46tCt6l3RsgPEzzPE&libraries=places,geometry";
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

      Promise.all([
        geocodeAddress(post.route?.from),
        geocodeAddress(post.route?.to),
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
              strokeOpacity: 0.85,
              strokeWeight: 2,
              fillColor: "#2563eb",
              fillOpacity: 0.14,
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
              strokeOpacity: 0.85,
              strokeWeight: 2,
              fillColor: "#10b981",
              fillOpacity: 0.14,
            });
            dropoffCircle.getBounds() && bounds.union(dropoffCircle.getBounds());
          }
        }

        if (points.length === 2) {
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
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 56);
        }
      });
    }
  }, [post]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow text-center space-y-4 max-w-md mx-auto mt-10">
        <h2 className="text-xl font-black text-slate-900">Không tìm thấy tin đăng</h2>
        <Link href="/admin/orders/drivers" className="btn-primary inline-flex px-5 py-3 rounded-xl text-xs font-bold">Quay lại</Link>
      </div>
    );
  }

  const vehicle = post.vehicleId;
  const priceText = post.price
    ? formatMoney(post.price)
    : `${formatMoney(post.pricing?.minPrice)} - ${formatMoney(post.pricing?.maxPrice)}`;
  const sharedRadius = post.route?.radiusMeters || null;
  const pickupRadius = post.route?.pickupRadiusMeters || sharedRadius;
  const dropoffRadius = post.route?.dropoffRadiusMeters || sharedRadius;

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl text-xs font-semibold">
          Backend đang offline, dữ liệu bên dưới là dữ liệu mẫu.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-sm">
        <div className="flex items-start gap-4">
          <Link href="/admin/orders/drivers" className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chi Tiết Tin Đăng Tài Xế</h1>
            <p className="text-slate-400 text-xs mt-1">Mã tin: <span className="font-bold text-primary-600">{post._id}</span></p>
          </div>
        </div>
        <span className="inline-flex px-4 py-2 rounded-2xl bg-primary-50 text-primary-700 border border-primary-100 text-xs font-black uppercase tracking-wider">
          {STATUS_LABEL[post.status] || post.status}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> Tuyến Đăng Và Bán Kính
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Điểm đi</p>
                <p className="text-base font-black text-slate-900 mt-2">{post.route?.from || "---"}</p>
                <p className="text-xs font-bold text-primary-600 mt-3">Bán kính nhận hàng: {formatRadius(pickupRadius)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Điểm đến</p>
                <p className="text-base font-black text-slate-900 mt-2">{post.route?.to || "---"}</p>
                <p className="text-xs font-bold text-primary-600 mt-3">Bán kính trả hàng: {formatRadius(dropoffRadius)}</p>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div id="driver-post-radius-map" className="h-[360px] w-full" />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span> Vòng nhận hàng</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Vòng trả hàng</span>
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4 text-xs font-semibold text-slate-500 leading-relaxed">
              Ghi chú tài xế: <span className="text-slate-800 font-bold">{post.note || "---"}</span>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-100 flex items-center gap-2">
              <Car className="w-4 h-4 text-primary-600" /> Phương Tiện
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-2">
              <InfoRow label="Loại xe" value={vehicle?.vehicleTypeChild || vehicle?.type} />
              <InfoRow label="Biển số" value={vehicle?.plateNumber} />
              <InfoRow label="Hãng / mẫu" value={[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ")} />
              <InfoRow label="Chủ xe" value={vehicle?.ownerName} />
              <InfoRow label="Tải trọng" value={vehicle?.capacity ? `${vehicle.capacity.toLocaleString("vi-VN")} kg` : "---"} />
              <InfoRow label="Số ghế" value={post.availableSeats ?? vehicle?.seats ?? post.vehicleSeats ?? "---"} />
              <InfoRow label="Trạng thái xe" value={vehicle?.status} />
              <InfoRow
                label="Kích thước"
                value={vehicle?.dimensions ? `${vehicle.dimensions.length || "-"} x ${vehicle.dimensions.width || "-"} x ${vehicle.dimensions.height || "-"} m` : "---"}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-100 flex items-center gap-2">
              <UserRound className="w-4 h-4 text-primary-600" /> Tài Xế
            </h2>
            <div className="mt-4 space-y-3">
              <p className="text-lg font-black text-slate-900">{post.driverId?.name || "---"}</p>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {post.driverId?.phone || "---"}</p>
              <p className="text-xs text-slate-400">{post.driverId?.email || "---"}</p>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-100 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-primary-600" /> Giá Và Loại Chuyến
            </h2>
            <div className="mt-2">
              <InfoRow label="Giá đăng" value={priceText} />
              <InfoRow label="Loại chuyến" value={PRICING_MODE_LABEL[post.pricingMode || ""] || post.pricingMode} />
              <InfoRow label="Cách báo giá" value={post.pricing?.type === "fixed" ? "Giá cố định" : "Thương lượng"} />
              <InfoRow label="Phí nền tảng" value={post.platformFeePercent != null ? `${post.platformFeePercent * 100}%` : "---"} />
              <InfoRow label="Tình trạng chỗ" value={post.isFull ? "Đã đầy" : "Còn nhận"} />
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-100 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary-600" /> Lịch Khả Dụng
            </h2>
            <div className="mt-2">
              <InfoRow label="Kiểu lịch" value={post.scheduleType === "scheduled" ? "Đặt lịch" : "Đang sẵn sàng"} />
              <InfoRow label="Bắt đầu" value={formatDateTime(post.availableFrom)} />
              <InfoRow label="Kết thúc" value={formatDateTime(post.availableTo)} />
              <InfoRow label="Ngày đăng" value={formatDateTime(post.createdAt)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
