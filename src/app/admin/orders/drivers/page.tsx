"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Car, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { fetchWithAuth } from "@/utils/api";

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

const MOCK_DRIVER_POSTS: DriverPost[] = [
  {
    _id: "dp-mock-1",
    driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
    vehicleId: { type: "truck", vehicleTypeChild: "Xe tải 5 tấn", plateNumber: "51C-123.45", brand: "Isuzu", model: "NQR", capacity: 5000, status: "active" },
    route: { from: "TP.HCM", to: "Bình Dương", pickupRadiusMeters: 3000, dropoffRadiusMeters: 5000 },
    pricing: { type: "fixed", minPrice: 1800000, maxPrice: 2200000 },
    pricingMode: "freight",
    price: 2000000,
    scheduleType: "active",
    status: "active",
    note: "Nhận hàng trong ngày, ưu tiên hàng pallet.",
    createdAt: "2026-07-09T08:30:00Z",
  },
  {
    _id: "dp-mock-2",
    driverId: { name: "Vũ Quốc Khánh", phone: "0966777888", email: "khanh.vu@gmail.com" },
    vehicleId: { type: "car", vehicleTypeChild: "Xe 7 chỗ", plateNumber: "30A-888.99", brand: "Toyota", model: "Innova", seats: 7, status: "active" },
    route: { from: "Hà Nội", to: "Hải Phòng", pickupRadiusMeters: 4000, dropoffRadiusMeters: 3000 },
    pricing: { type: "negotiable", minPrice: 900000, maxPrice: 1300000 },
    pricingMode: "shared_seat",
    availableSeats: 4,
    vehicleSeats: 7,
    scheduleType: "scheduled",
    availableFrom: "2026-07-11T01:00:00Z",
    availableTo: "2026-07-11T12:00:00Z",
    status: "scheduled",
    note: "Có nhận ghép khách và hàng nhỏ.",
    createdAt: "2026-07-08T10:15:00Z",
  },
];

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
  const [isOffline, setIsOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDriverPosts = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });

    try {
      const res = await fetchWithAuth(`http://127.0.0.1:5000/api/v1/admin/users/driver-posts?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch driver posts");
      const data = await res.json();
      setPosts(data.data.posts);
      setPagination(data.data.pagination);
      setIsOffline(false);
    } catch (err) {
      console.warn("Driver posts API offline, using mock data", err);
      setIsOffline(true);
      const query = search.toLowerCase();
      let filtered = [...MOCK_DRIVER_POSTS];
      if (query) {
        filtered = filtered.filter((post) =>
          post.driverId?.name?.toLowerCase().includes(query) ||
          post.driverId?.phone?.includes(query) ||
          post.vehicleId?.plateNumber?.toLowerCase().includes(query) ||
          post.route?.from?.toLowerCase().includes(query) ||
          post.route?.to?.toLowerCase().includes(query)
        );
      }
      if (statusFilter) filtered = filtered.filter((post) => post.status === statusFilter);
      const total = filtered.length;
      const pages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
      setPosts(paginated);
      setPagination({ page: currentPage, limit, total, pages });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverPosts();
  }, [currentPage, search, statusFilter, limit]);

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Backend đang offline, dữ liệu bên dưới là dữ liệu mẫu.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Sách Tài Xế Đăng</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi các tuyến xe, lịch trống, giá đăng và thông tin phương tiện do tài xế tạo.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6">Tài xế</th>
                  <th className="py-4 px-6">Phương tiện</th>
                  <th className="py-4 px-6">Tuyến đăng</th>
                  <th className="py-4 px-6">Giá / loại chuyến</th>
                  <th className="py-4 px-6">Lịch khả dụng</th>
                  <th className="py-4 px-6">Sức chứa</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Ngày đăng</th>
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
                        <p className="text-xs font-black text-primary-600 mt-1">{vehicle?.plateNumber || "---"}</p>
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
                        <p className="font-extrabold text-slate-800 text-xs">{priceRange}</p>
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
                        <p>Tải trọng: <span className="font-black text-slate-800">{vehicle?.capacity ? `${vehicle.capacity.toLocaleString("vi-VN")} kg` : "---"}</span></p>
                        <p>Ghế: <span className="font-black text-slate-800">{post.availableSeats ?? vehicle?.seats ?? post.vehicleSeats ?? "---"}</span></p>
                        <p className={post.isFull ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{post.isFull ? "Đã đầy" : "Còn nhận"}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="py-4.5 px-6 text-xs font-semibold text-slate-400 min-w-32">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
