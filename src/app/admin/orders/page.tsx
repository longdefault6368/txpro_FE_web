"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { 
  Search, Filter, Truck, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Eye, Loader, SlidersHorizontal 
} from "lucide-react";

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

interface Order {
  _id: string;
  orderCode: string;
  title: string;
  status: "pending" | "searching_driver" | "matched" | "in_transit" | "delivered" | "cancelled";
  offerPrice?: number;
  budget?: number;
  pickup?: { address: string };
  dropoff?: { address: string };
  shipperId?: UserInfo;
  driverId?: UserInfo;
  createdAt: string;
}

type SortKey = "orderCode" | "title" | "cost" | "status";
type SortDirection = "asc" | "desc";

const STATUS_SORT_ORDER: Record<string, number> = {
  pending: 1,
  searching_driver: 2,
  waiting_driver: 3,
  waiting_driver_acceptance: 4,
  matched: 5,
  accepted: 6,
  in_progress: 7,
  in_transit: 8,
  delivered: 9,
  completed: 10,
  rejected: 11,
  cancelled: 12,
};

const getOrderCost = (order: Order) => order.offerPrice || order.budget || 0;

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    _id: "o-mock-1",
    orderCode: "ORD-20260709-001",
    title: "Vận chuyển 20 tấn hạt nhựa PP",
    status: "in_transit",
    offerPrice: 4500000,
    pickup: { address: "KCN Cát Lái, Quận 2, TP.HCM" },
    dropoff: { address: "KCN Sóng Thần, Bình Dương" },
    shipperId: { name: "Trần Thị Hằng", phone: "0912345678", email: "hang@gmail.com" },
    driverId: { name: "Nguyễn Văn Tuấn", phone: "0987654321", email: "tuan.driver@gmail.com" },
    createdAt: "2026-07-09T08:30:00Z"
  },
  {
    _id: "o-mock-2",
    orderCode: "ORD-20260709-002",
    title: "Vận chuyển thiết bị gia dụng nhà thông minh",
    status: "delivered",
    offerPrice: 3200000,
    pickup: { address: "Cảng Cát Lái, Quận 2, TP.HCM" },
    dropoff: { address: "Quận Hoàn Kiếm, Hà Nội" },
    shipperId: { name: "Lê Văn Hoàng", phone: "0905111222", email: "hoang.le@outlook.com" },
    driverId: { name: "Phạm Minh Đức", phone: "0977888999", email: "duc.pham@gmail.com" },
    createdAt: "2026-07-09T06:15:00Z"
  },
  {
    _id: "o-mock-3",
    orderCode: "ORD-20260708-005",
    title: "Giao nhận 50 thùng hoa quả tươi nhập khẩu",
    status: "pending",
    budget: 900000,
    pickup: { address: "Chợ đầu mối Thủ Đức, TP.HCM" },
    dropoff: { address: "Quận 1, TP.HCM" },
    shipperId: { name: "Nguyễn Minh Thu", phone: "0933444555", email: "thu.nguyen@gmail.com" },
    createdAt: "2026-07-08T14:00:00Z"
  },
  {
    _id: "o-mock-4",
    orderCode: "ORD-20260708-004",
    title: "Vận chuyển sắt thép công trình xây dựng",
    status: "matched",
    offerPrice: 8500000,
    pickup: { address: "Nhà máy thép Hòa Phát, Dung Quất" },
    dropoff: { address: "Quận Nam Từ Liêm, Hà Nội" },
    shipperId: { name: "Công ty Cổ phần Thép Việt", phone: "0283844999", email: "info@thepviet.com" },
    driverId: { name: "Vũ Quốc Khánh", phone: "0966777888", email: "khanh.vu@gmail.com" },
    createdAt: "2026-07-08T09:45:00Z"
  },
  {
    _id: "o-mock-5",
    orderCode: "ORD-20260707-010",
    title: "Chuyển kho dệt may từ Bình Dương đi Vũng Tàu",
    status: "cancelled",
    budget: 5000000,
    pickup: { address: "KCN VSIP 1, Thuận An, Bình Dương" },
    dropoff: { address: "Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu" },
    shipperId: { name: "Trương Công Định", phone: "0944555666", email: "dinh.truong@textile.vn" },
    createdAt: "2026-07-07T16:20:00Z"
  }
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  searching_driver: { label: "Tìm tài xế", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Loader },
  waiting_driver: { label: "Đang chờ tài xế", color: "text-amber-600 bg-amber-50 border-amber-100", icon: Clock },
  waiting_driver_acceptance: { label: "Chờ tài xế nhận", color: "text-purple-600 bg-purple-50 border-purple-100", icon: Clock },
  accepted: { label: "Đã nhận đơn", color: "text-indigo-600 bg-indigo-50 border-indigo-100", icon: CheckCircle },
  rejected: { label: "Đã từ chối", color: "text-rose-600 bg-rose-50 border-rose-100", icon: XCircle },
  in_progress: { label: "Đang vận chuyển", color: "text-primary-600 bg-primary-50 border-primary-100", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700 bg-emerald-100 border-emerald-200", icon: CheckCircle },
  cancelled: { label: "Đã hủy đơn", color: "text-red-600 bg-red-50 border-red-100", icon: XCircle },
};

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
 
  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {})
    });

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/orders?${queryParams.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
        setIsOffline(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("API error:", errData.message || "Failed to fetch orders");
        setIsOffline(false);
      }
    } catch (err: unknown) {
      console.warn("Backend connection offline, using mock orders fallback", err);
      setIsOffline(true);
      
      // Offline local filter simulation
      let filtered = [...INITIAL_MOCK_ORDERS];
      
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(o => 
          o.orderCode.toLowerCase().includes(query) ||
          o.title.toLowerCase().includes(query) ||
          (o.pickup && o.pickup.address.toLowerCase().includes(query)) ||
          (o.dropoff && o.dropoff.address.toLowerCase().includes(query))
        );
      }

      if (statusFilter) {
        filtered = filtered.filter(o => o.status === statusFilter);
      }

      const total = filtered.length;
      const pages = Math.ceil(total / limit) || 1;
      const startIdx = (currentPage - 1) * limit;
      const paginated = filtered.slice(startIdx, startIdx + limit);

      setOrders(paginated);
      setPagination({
        page: currentPage,
        limit,
        total,
        pages
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, statusFilter, limit]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;

      if (sortConfig.key === "cost") {
        comparison = getOrderCost(a) - getOrderCost(b);
      } else if (sortConfig.key === "status") {
        const aStatus = STATUS_SORT_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER;
        const bStatus = STATUS_SORT_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER;
        comparison = aStatus - bStatus || String(a.status).localeCompare(String(b.status), "vi");
      } else {
        comparison = String(a[sortConfig.key] || "").localeCompare(String(b[sortConfig.key] || ""), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [orders, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortableHeader = (sortKey: SortKey, label: string) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 -ml-1 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors cursor-pointer"
        title={`Sắp xếp ${label} ${direction === "asc" ? "giảm dần" : "tăng dần"}`}
      >
        <span>{label}</span>
        <span className="flex flex-col -space-y-1">
          <ChevronUp className={`h-3 w-3 ${isActive && direction === "asc" ? "text-primary-600" : "text-slate-300"}`} />
          <ChevronDown className={`h-3 w-3 ${isActive && direction === "desc" ? "text-primary-600" : "text-slate-300"}`} />
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" /> Hệ thống đang ở chế độ Offline. Dữ liệu hiển thị bên dưới là dữ liệu giả lập.
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Sách Vận Đơn</h1>
          <p className="text-slate-400 text-xs mt-1">Giám sát trạng thái di chuyển, lộ trình vận tải và giá trị các đơn đặt xe.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã vận đơn, tên hàng, địa điểm giao nhận..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters */}
        <div className="relative w-full md:w-52">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none w-full pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white cursor-pointer"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="searching_driver">Tìm tài xế</option>
            <option value="waiting_driver">Đang chờ tài xế</option>
            <option value="waiting_driver_acceptance">Chờ tài xế nhận</option>
            <option value="accepted">Đã nhận đơn</option>
            <option value="rejected">Đã từ chối</option>
            <option value="in_progress">Đang vận chuyển</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy đơn</option>
          </select>
          <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Page Size Select */}
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
            <option value={100}>100 dòng / trang</option>
          </select>
          <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-400 text-xs mt-4">Đang tải danh sách đơn đặt xe...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Search className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs">Thử điều chỉnh lại từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6">
                    {renderSortableHeader("orderCode", "Mã Đơn")}
                  </th>
                  <th className="py-4 px-6">
                    {renderSortableHeader("title", "Tên Hàng Hóa")}
                  </th>
                  <th className="py-4 px-6">Lộ Trình (Điểm Đi / Điểm Đến)</th>
                  <th className="py-4 px-6">Chủ Hàng / Tài Xế</th>
                  <th className="py-4 px-6">
                    {renderSortableHeader("cost", "Chi Phí")}
                  </th>
                  <th className="py-4 px-6">
                    {renderSortableHeader("status", "Trạng Thái")}
                  </th>
                  <th className="py-4 px-6 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {sortedOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-slate-500 bg-slate-50", icon: Clock };
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Code */}
                      <td className="py-4.5 px-6">
                        <Link href={`/admin/orders/${order._id}`} className="font-bold text-primary-600 text-xs hover:underline cursor-pointer">
                          {order.orderCode}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-4.5 px-6">
                        <span className="font-bold text-slate-800">{order.title}</span>
                      </td>

                      {/* Route */}
                      <td className="py-4.5 px-6 max-w-xs">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-semibold text-slate-700 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">TỪ:</span>{order.pickup?.address || "---"}</p>
                          <p className="font-semibold text-slate-600 truncate"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">ĐẾN:</span>{order.dropoff?.address || "---"}</p>
                        </div>
                      </td>

                      {/* Parties */}
                      <td className="py-4.5 px-6 text-xs font-semibold">
                        <div className="space-y-0.5">
                          <p className="text-slate-700"><span className="text-blue-500 font-bold text-[9px] uppercase mr-1">Shipper:</span>{order.shipperId?.name || "---"}</p>
                          <p className="text-slate-600"><span className="text-emerald-500 font-bold text-[9px] uppercase mr-1">Driver:</span>{order.driverId?.name || "---"}</p>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-4.5 px-6 font-extrabold text-slate-800 text-xs">
                        {(getOrderCost(order) / 1000).toLocaleString()}K ₫
                      </td>

                      {/* Status */}
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4.5 px-6 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="p-2 inline-block text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                          title="Xem chi tiết vận đơn"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400 font-bold">
              Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} vận đơn)
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

      {/* --- ORDER DETAIL MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              Chi Tiết Vận Đơn: <span className="text-primary-600 font-extrabold">{selectedOrder.orderCode}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Route Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Mặt Hàng</h4>
                  <p className="text-slate-800 font-bold mt-1 text-sm">{selectedOrder.title}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Bốc Hàng</h4>
                  <p className="text-slate-700 font-semibold text-xs mt-1">{selectedOrder.pickup?.address || "---"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Hạ Hàng</h4>
                  <p className="text-slate-700 font-semibold text-xs mt-1">{selectedOrder.dropoff?.address || "---"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi phí vận chuyển</h4>
                  <p className="text-primary-600 font-extrabold mt-1 text-base">
                    {(selectedOrder.offerPrice || selectedOrder.budget || 0).toLocaleString()} ₫
                  </p>
                </div>
              </div>

              {/* Parties Details */}
              <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                {/* Shipper */}
                <div>
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Chủ Hàng (Shipper)</h4>
                  <div className="mt-1 text-xs space-y-0.5">
                    <p className="font-bold text-slate-800">{selectedOrder.shipperId?.name || "---"}</p>
                    <p className="font-semibold text-slate-500">SĐT: {selectedOrder.shipperId?.phone || "---"}</p>
                    <p className="text-slate-400">Email: {selectedOrder.shipperId?.email || "---"}</p>
                  </div>
                </div>

                {/* Driver */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tài Xế (Driver)</h4>
                  {selectedOrder.driverId ? (
                    <div className="mt-1 text-xs space-y-0.5">
                      <p className="font-bold text-slate-800">{selectedOrder.driverId.name}</p>
                      <p className="font-semibold text-slate-500">SĐT: {selectedOrder.driverId.phone}</p>
                      <p className="text-slate-400">Email: {selectedOrder.driverId.email}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-semibold text-xs mt-1">Đơn đặt xe chưa có tài xế nhận chuyến.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary py-3 px-6 text-xs font-bold rounded-xl"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
