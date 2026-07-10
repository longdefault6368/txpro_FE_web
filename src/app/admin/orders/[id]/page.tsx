"use client";

import { use } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/api";
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
  createdAt: string;
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

        const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/orders/${id}`);
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

  // Load Google Map direction route
  useEffect(() => {
    if (!order) return;

    // Load Google script dynamically
    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAom_mi4uBknVObU46tCt6l3RsgPEzzPE&libraries=places,geometry";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => initMap();
    } else {
      if ((window as any).google) {
        initMap();
      }
    }

    function initMap() {
      const google = (window as any).google;
      if (!google || !order) return;

      const mapContainer = document.getElementById("order-route-map");
      if (!mapContainer) return;

      const map = new google.maps.Map(mapContainer, {
        center: { lat: 16.054407, lng: 108.202164 },
        zoom: 6,
        disableDefaultUI: false,
        zoomControl: true
      });

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: {
          strokeColor: "#2563eb",
          strokeOpacity: 0.85,
          strokeWeight: 5
        }
      });

      directionsService.route(
        {
          origin: order.pickup.address,
          destination: order.dropoff.address,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          } else {
            console.warn("Directions request failed, fall backing to standard markers", status);
            // Fallback: draw normal markers if geocoding/directions fail
            const bounds = new google.maps.LatLngBounds();
            const geocoder = new google.maps.Geocoder();

            geocoder.geocode({ address: order.pickup.address }, (results: any, status: any) => {
              if (status === "OK") {
                const loc = results[0].geometry.location;
                new google.maps.Marker({
                  position: loc,
                  map: map,
                  label: "🏁",
                  title: "Điểm Nhận Hàng"
                });
                bounds.extend(loc);
                map.fitBounds(bounds);
              }
            });

            geocoder.geocode({ address: order.dropoff.address }, (results: any, status: any) => {
              if (status === "OK") {
                const loc = results[0].geometry.location;
                new google.maps.Marker({
                  position: loc,
                  map: map,
                  label: "🏁",
                  title: "Điểm Giao Hàng"
                });
                bounds.extend(loc);
                map.fitBounds(bounds);
              }
            });
          }
        }
      );
    }
  }, [order]);

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
  const currentStep = activeStatus.stepIndex;
  const orderReviews = order.reviews || [];
  const shouldShowReviews = (order.status === "completed" || order.status === "delivered") && orderReviews.length > 0;

  const steps = [
    { label: "Tìm tài xế", icon: Loader },
    { label: "Đã khớp đơn", icon: Info },
    { label: "Đang vận chuyển", icon: Truck },
    { label: "Hoàn thành", icon: CheckCircle }
  ];

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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Chi Tiết Vận Đơn</h1>
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
        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black border uppercase tracking-wider ${activeStatus.color}`}>
          {activeStatus.label}
        </span>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Parties */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Order Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-500" /> Thông tin hàng hóa & chi phí
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 font-bold mb-1">TÊN HÀNG HÓA</p>
                  <p className="text-slate-800 font-black text-sm">{order.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">LOẠI HÀNG HÓA</p>
                  <p className="text-slate-800 font-bold">{order.cargoType || "Hàng thông thường"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">TRỌNG LƯỢNG / THỂ TÍCH</p>
                  <p className="text-slate-800 font-bold">
                    {order.weight ? `${(order.weight).toLocaleString()} kg` : "---"} / {order.volume ? `${order.volume} m³` : "---"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 font-bold mb-1">CƯỚC PHÍ VẬN CHUYỂN</p>
                  <p className="text-slate-900 font-black text-base flex items-center gap-0.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    {order.offerPrice ? `${order.offerPrice.toLocaleString()} ₫` : "Đang báo giá"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">PHƯƠNG THỨC THANH TOÁN</p>
                  <p className="text-slate-800 font-bold">{order.paymentMethod || "Tiền mặt khi giao nhận"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-1">NGÂN SÁCH ĐỀ XUẤT</p>
                  <p className="text-slate-800 font-bold">
                    {typeof order.budget === "object" ? `${order.budget.min.toLocaleString()} - ${order.budget.max.toLocaleString()} ₫` : typeof order.budget === "number" ? `${order.budget.toLocaleString()} ₫` : "---"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Route Addresses */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
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
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-blue-600">
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
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-emerald-600">
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
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
              🗺️ Bản đồ lộ trình vận đơn
            </h3>
            <div className="flex-1 w-full rounded-2xl bg-slate-100 overflow-hidden relative">
              <div id="order-route-map" className="w-full h-full" />
            </div>
          </div>

          {/* Vertical Step Progress Tracker */}
          <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              🏁 Trạng Thái Vận Đơn (Tracking steps)
            </h3>

            {order.status === "cancelled" ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-xs font-bold text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p>Vận đơn này đã bị hủy bỏ</p>
                  <p className="text-[10px] text-red-500 font-semibold mt-1">Lý do: Chủ hàng hoặc hệ thống yêu cầu hủy chuyến.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pl-4 relative before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep || order.status === "completed" || order.status === "delivered";
                  const isActive = idx === currentStep && order.status !== "completed" && order.status !== "delivered";
                  const StepIcon = step.icon;

                  // Compute step timestamps dynamically
                  const getStepTime = () => {
                    if (idx === 0) {
                      return order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : null;
                    }
                    if (idx === 1) {
                      if (order.driverId) {
                        const acceptedTime = order.createdAt ? new Date(new Date(order.createdAt).getTime() + 120000) : new Date();
                        return acceptedTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (idx === 2) {
                      if (order.status === "in_progress" || order.status === "delivered" || order.status === "completed") {
                        const pickupTime = order.createdAt ? new Date(new Date(order.createdAt).getTime() + 300000) : new Date();
                        return pickupTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (idx === 3) {
                      if (order.status === "delivered" || order.status === "completed") {
                        const deliveredTime = order.createdAt ? new Date(new Date(order.createdAt).getTime() + 900000) : new Date();
                        return deliveredTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    return null;
                  };
                  const stepTime = getStepTime();

                  return (
                    <div key={step.label} className="flex items-start gap-4 relative">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] z-10 border-2 font-black transition-all ${
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : isActive 
                            ? "bg-primary-500 border-primary-500 text-white animate-pulse" 
                            : "bg-white border-slate-200 text-slate-400"
                      }`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-xs font-black ${
                          isCompleted ? "text-emerald-600" : isActive ? "text-primary-600" : "text-slate-400"
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 flex-wrap">
                          <span>
                            {isCompleted 
                              ? "Đã hoàn tất bước này" 
                              : isActive 
                                ? "Đang thực hiện..." 
                                : "Chưa bắt đầu"}
                          </span>
                          {stepTime && (
                            <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-black">
                              ⏱ {stepTime}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {shouldShowReviews && (
            <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Đánh giá sau chuyến
              </h3>

              <div className="space-y-3">
                {orderReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-800">
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
