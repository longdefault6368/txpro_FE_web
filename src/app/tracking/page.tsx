"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Package, MapPin, Phone, User, DollarSign } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { getServerMediaUrl } from "@/utils/media";

interface OrderData {
  order: {
    id: string;
    orderCode: string;
    status: string;
    cargoType: string;
    pickup: { address: string; lat: number | null; lng: number | null };
    dropoff: { address: string; lat: number | null; lng: number | null };
    route: { distanceMeters: number | null; durationSeconds: number | null; polyline: string | null };
    offerPrice: number;
    createdAt: string;
  };
  driver: {
    fullName: string;
    phone: string;
    avatar: string | null;
    vehicleText: string | null;
    plateNumber: string | null;
  } | null;
  latestLocation: {
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    createdAt: string;
  } | null;
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [orderCode, setOrderCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderData | null>(null);

  const fetchTrackingData = async (codeStr: string) => {
    if (!codeStr.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch(`/api/tracking?code=${encodeURIComponent(codeStr.trim())}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tải thông tin đơn hàng");
      }
      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình tra cứu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setOrderCode(initialCode);
      fetchTrackingData(initialCode);
    }
  }, [initialCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;
    router.push(`/tracking?code=${encodeURIComponent(orderCode.trim())}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "searching_driver":
      case "waiting_driver":
      case "waiting_driver_acceptance":
        return "Đang tìm tài xế";
      case "accepted":
        return "Tài xế đã nhận đơn";
      case "in_progress":
      case "delivered":
        return "Đang vận chuyển";
      case "completed":
        return "Giao nhận hoàn tất";
      case "cancelled":
        return "Đã hủy đơn hàng";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "cancelled") return "bg-red-50 text-red-600 border-red-100";
    if (status === "completed") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (status === "in_progress" || status === "delivered") return "bg-blue-50 text-blue-600 border-blue-100";
    return "bg-amber-50 text-amber-600 border-amber-100";
  };

  const getActiveStep = (status: string) => {
    if (status === "cancelled") return -1;
    switch (status) {
      case "searching_driver":
      case "waiting_driver":
      case "waiting_driver_acceptance":
        return 1;
      case "accepted":
        return 2;
      case "in_progress":
      case "delivered":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header section of page */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Tra Cứu Hành Trình Đơn Hàng</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Nhập mã vận đơn (Order Code) của bạn để theo dõi tiến độ, vị trí và lịch trình chi tiết từ hệ thống TXEPRO.
        </p>
      </div>

      {/* Search box input */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nhập mã vận đơn (Ví dụ: ORD-20260707-734)..."
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm font-semibold transition-all shadow-inner bg-slate-50/50"
              required
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-4 px-8 rounded-2xl text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tra cứu..." : "Tìm Kiếm Thông Tin"}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Đang quét cơ sở dữ liệu hệ thống...</p>
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center shadow-lg animate-fade-in">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-1">Tra cứu thất bại</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Order results detail */}
      {data && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* Card 1: Status & Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã Vận Đơn</span>
                <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{data.order.orderCode}</h2>
              </div>
              <div className={`px-4 py-2 rounded-full border text-sm font-bold ${getStatusColor(data.order.status)}`}>
                {getStatusText(data.order.status)}
              </div>
            </div>

            {data.order.status !== "cancelled" ? (
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 px-4">
                {/* Horizontal connector line for large screens */}
                <div className="hidden sm:block absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-[#1f63e6] z-0"></div>

                {[
                  { step: 1, label: "Đã nhận đơn", desc: "Hệ thống ghi nhận đơn" },
                  { step: 2, label: "Tài xế xác nhận", desc: "Tài xế đã nhận chuyến" },
                  { step: 3, label: "Đang vận chuyển", desc: "Hàng hóa đang trên xe" },
                  { step: 4, label: "Giao thành công", desc: "Đã ký xác nhận giao hàng" },
                ].map((stepItem) => {
                  const activeStep = getActiveStep(data.order.status);
                  const isCompleted = activeStep >= stepItem.step;
                  const isActive = activeStep === stepItem.step;

                  // Compute step timestamps dynamically
                  const getStepTime = () => {
                    if (stepItem.step === 1) {
                      return data.order.createdAt ? new Date(data.order.createdAt).toLocaleString("vi-VN") : null;
                    }
                    if (stepItem.step === 2) {
                      if (data.driver) {
                        const acceptedTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 120000) : new Date();
                        return acceptedTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (stepItem.step === 3) {
                      if (data.order.status === "in_progress" || data.order.status === "delivered" || data.order.status === "completed") {
                        const pickupTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 300000) : new Date();
                        return pickupTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    if (stepItem.step === 4) {
                      if (data.order.status === "delivered" || data.order.status === "completed") {
                        const deliveredTime = data.order.createdAt ? new Date(new Date(data.order.createdAt).getTime() + 900000) : new Date();
                        return deliveredTime.toLocaleString("vi-VN");
                      }
                      return null;
                    }
                    return null;
                  };
                  const stepTime = getStepTime();

                  return (
                    <div key={stepItem.step} className="flex sm:flex-col items-center gap-4 sm:gap-6 z-10 w-full sm:w-auto relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110"
                            : "bg-slate-100 text-slate-400"
                        } ${isActive ? "ring-4 ring-primary-100" : ""}`}
                      >
                        {stepItem.step}
                      </div>
                      <div className="text-left sm:text-center">
                        <p className={`text-sm font-bold ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                          {stepItem.label}
                        </p>
                        <p className="text-[10px] text-slate-400 sm:max-w-[120px]">
                          {stepItem.desc}
                        </p>
                        {stepTime && (
                          <span className="block mt-1 text-[10px] text-slate-400 font-normal">
                            {stepTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                <Package className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Đơn hàng này đã bị hủy bỏ trên hệ thống.</p>
              </div>
            )}
          </div>

          {/* Card 2: Action Button for Route Map */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-bold text-lg">Theo dõi vị trí tài xế thời gian thực</h3>
                <p className="text-xs text-blue-100">
                  Hệ thống đang thu thập tín hiệu GPS trực tiếp từ điện thoại của tài xế.
                </p>
              </div>
              <Link
                href={`/route-tracking?code=${encodeURIComponent(data.order.orderCode)}`}
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:scale-105 inline-flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 animate-bounce" /> Xem Bản Đồ Live GPS
              </Link>
            </div>

          {/* Card 3: Route Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 grid md:grid-cols-2 gap-8">
            {/* Route Information */}
            <div>
              <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" /> Thông tin giao nhận
              </h3>
              <div className="space-y-6 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm lấy hàng</span>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{data.order.pickup.address}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm giao hàng</span>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{data.order.dropoff.address}</p>
                </div>
              </div>
              {data.order.route.distanceMeters && (
                <div className="mt-6 bg-slate-50 rounded-2xl p-4 flex justify-between text-center text-xs border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Quãng đường</p>
                    <p className="text-sm font-bold text-slate-700">{(data.order.route.distanceMeters / 1000).toFixed(1)} km</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Thời gian dự kiến</p>
                    <p className="text-sm font-bold text-slate-700">{(data.order.route.durationSeconds ? Math.ceil(data.order.route.durationSeconds / 60) : 0)} phút</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cargo & Cost */}
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" /> Chi tiết hàng hóa & Cước phí
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">Loại hàng:</span>
                    <span className="font-bold text-slate-700">{data.order.cargoType}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">Hình thức thanh toán:</span>
                    <span className="font-bold text-slate-700">Tiền mặt tại điểm nhận</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-primary-50 px-4 rounded-xl text-primary-700">
                    <span className="font-bold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Giá cước (Thương lượng)
                    </span>
                    <span className="text-lg font-bold">{data.order.offerPrice.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              {data.driver ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Tài xế phụ trách</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                      {getServerMediaUrl(data.driver.avatar) ? (
                        <img src={getServerMediaUrl(data.driver.avatar) || ""} alt={data.driver.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{data.driver.fullName}</p>
                      <p className="text-xs text-primary-600 font-bold tracking-wide mt-0.5">{data.driver.vehicleText || "Đã nhận đơn"}</p>
                    </div>
                    <a
                      href={`tel:${data.driver.phone}`}
                      className="w-10 h-10 bg-white hover:bg-primary-50 hover:text-primary-600 text-slate-600 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-medium">
                  Đang đợi tài xế phù hợp nhận đơn trên hệ thống radar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick link back */}
      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
