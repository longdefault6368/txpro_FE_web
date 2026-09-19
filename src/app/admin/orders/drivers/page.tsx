"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CalendarClock, Car, ChevronLeft, ChevronRight, Filter, RotateCcw, Search, SlidersHorizontal, UserRound } from "lucide-react";
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
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Bản nháp", color: "text-slate-600 bg-slate-50 border-slate-200" },
  active: { label: "Đang mở", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  paused: { label: "Tạm dừng", color: "text-amber-700 bg-amber-50 border-amber-200" },
  scheduled: { label: "Đã lên lịch", color: "text-blue-700 bg-blue-50 border-blue-200" },
  matched: { label: "Đã ghép đơn", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  in_progress: { label: "Đang chạy", color: "text-primary-700 bg-primary-50 border-primary-200" },
  completed: { label: "Hoàn thành", color: "text-emerald-800 bg-emerald-100 border-emerald-200" },
  cancelled: { label: "Đã hủy", color: "text-red-700 bg-red-50 border-red-200" },
};

const PRICING_MODE_LABEL: Record<string, string> = {
  freight: "Chở hàng",
  full_trip: "Bao chuyến",
  shared_seat: "Ghép ghế",
};

const formatMoney = (value?: number | null) => (value ? `${value.toLocaleString("vi-VN")} ₫` : "---");
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "---");
const formatRadius = (meters?: number | null) => {
  if (!meters) return "---";
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
};

export default function AdminDriverPostsPage() {
  const [posts, setPosts] = useState<DriverPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    setCurrentPage(1);

    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      const formatted = formatDate(today);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "yesterday") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const formatted = formatDate(yest);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      return;
    }

    if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      return;
    }
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const fetchDriverPosts = async () => {
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
      setPosts(data.data?.posts || []);
      setPagination(data.data?.pagination || { page: currentPage, limit, total: 0, pages: 0 });
      setErrorMessage("");
    } catch (err) {
      console.warn("Driver posts API failed", err);
      setPosts([]);
      setPagination({ page: currentPage, limit, total: 0, pages: 0 });
      setErrorMessage("Không thể tải danh sách tài xế từ hệ thống. Vui lòng kiểm tra đăng nhập admin hoặc backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverPosts();
  }, [currentPage, search, statusFilter, startDate, endDate, limit]);

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Tài Xế Đăng</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi các tuyến xe, lịch trống, giá đăng và thông tin phương tiện do tài xế tạo.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-5 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tài xế, SĐT, biển số, điểm đi, điểm đến..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
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
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([value, item]) => (
                <option key={value} value={value}>{item.label}</option>
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
              className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
            >
              <option value={10}>10 dòng / trang</option>
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <span className="text-slate-500 font-bold flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>Khoảng ngày:</span>
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay" },
              { id: "yesterday", label: "Hôm qua" },
              { id: "7days", label: "7 ngày qua" },
              { id: "30days", label: "30 ngày qua" },
              { id: "this_month", label: "Tháng này" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  datePreset === p.id && (p.id === "all" || (startDate && endDate))
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>
            <span className="text-slate-400 font-bold hidden sm:inline">-</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full sm:w-auto text-slate-800"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Xóa lọc theo ngày"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách tài xế đăng...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Car className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy tin đăng tài xế</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách tin đăng tài xế</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1100px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-56">Tài xế</th>
                    <th className="py-4 px-6 min-w-56">Phương tiện</th>
                    <th className="py-4 px-6 min-w-64">Tuyến đăng</th>
                    <th className="py-4 px-6 min-w-44">Giá / loại chuyến</th>
                    <th className="py-4 px-6 min-w-56">Lịch khả dụng</th>
                    <th className="py-4 px-6 min-w-36">Sức chứa</th>
                    <th className="py-4 px-6 min-w-32">Trạng thái</th>
                    <th className="py-4 px-6 min-w-32">Ngày đăng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {posts.map((post) => {
                    const statusInfo = STATUS_MAP[post.status] || { label: post.status, color: "text-slate-600 bg-slate-50 border-slate-200" };
                    const vehicle = post.vehicleId;
                    const priceRange = post.price
                      ? formatMoney(post.price)
                      : `${formatMoney(post.pricing?.minPrice)} - ${formatMoney(post.pricing?.maxPrice)}`;
                    return (
                      <tr key={post._id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="py-4.5 px-6 min-w-56">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                              <UserRound className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <Link href={`/admin/orders/drivers/${post._id}`} className="font-bold text-primary-600 hover:underline">
                                {post.driverId?.name || "---"}
                              </Link>
                              <p className="text-xs font-semibold text-slate-500">{post.driverId?.phone || "---"}</p>
                              <p className="text-xs text-slate-400">{post.driverId?.email || "---"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 min-w-56">
                          <p className="font-bold text-slate-800">{vehicle?.vehicleTypeChild || vehicle?.type || "---"}</p>
                          <p className="text-xs font-semibold text-slate-500">{[vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "---"}</p>
                          <p className="text-xs font-bold text-primary-600 mt-1">{vehicle?.plateNumber || "---"}</p>
                        </td>
                        <td className="py-4.5 px-6 min-w-64">
                          <div className="space-y-1 text-xs">
                            <Link href={`/admin/orders/drivers/${post._id}`} className="block hover:text-primary-600">
                              <p className="font-semibold text-slate-700"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Từ:</span>{post.route?.from || "---"}</p>
                              <p className="font-semibold text-slate-700"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Đến:</span>{post.route?.to || "---"}</p>
                            </Link>
                            <div className="grid grid-cols-2 gap-1 pt-1">
                              <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">BK đi: {formatRadius(post.route?.pickupRadiusMeters || post.route?.radiusMeters)}</span>
                              <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">BK đến: {formatRadius(post.route?.dropoffRadiusMeters || post.route?.radiusMeters)}</span>
                            </div>
                            {post.note && <p className="text-slate-400 line-clamp-2 pt-1">{post.note}</p>}
                          </div>
                        </td>
                        <td className="py-4.5 px-6 min-w-44">
                          <p className="font-bold text-slate-800 text-xs">{priceRange}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{PRICING_MODE_LABEL[post.pricingMode || ""] || post.pricingMode || "---"}</p>
                          <p className="text-[10px] text-slate-400">{post.pricing?.type === "fixed" ? "Giá cố định" : "Thương lượng"}</p>
                        </td>
                        <td className="py-4.5 px-6 min-w-56 text-xs">
                          <div className="flex gap-2">
                            <CalendarClock className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700">{post.scheduleType === "scheduled" ? "Đặt lịch" : "Đang sẵn sàng"}</p>
                              <p className="text-slate-500">Từ: {formatDateTime(post.availableFrom)}</p>
                              <p className="text-slate-500">Đến: {formatDateTime(post.availableTo)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-xs font-semibold min-w-36">
                          <p>Tải trọng: <span className="font-bold text-slate-800">{vehicle?.capacity ? `${vehicle.capacity.toLocaleString("vi-VN")} kg` : "---"}</span></p>
                          <p>Ghế: <span className="font-bold text-slate-800">{post.availableSeats ?? vehicle?.seats ?? post.vehicleSeats ?? "---"}</span></p>
                          <p className={post.isFull ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{post.isFull ? "Đã đầy" : "Còn nhận"}</p>
                        </td>
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>{statusInfo.label}</span>
                        </td>
                        <td className="py-4.5 px-6 text-xs font-semibold text-slate-400 min-w-32 whitespace-nowrap">
                          {formatDateTime(post.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} tin đăng)
            </span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={currentPage === pagination.pages} onClick={() => setCurrentPage((prev) => prev + 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
