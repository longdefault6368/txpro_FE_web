"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  Inbox,
  ShieldCheck,
  Building,
  Truck,
  Package,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";

interface ContactMessage {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  category: "shipper" | "driver" | "enterprise" | "payment" | "other";
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "spam";
  adminNotes?: string;
  ip?: string;
  resolvedBy?: { _id: string; name: string; email?: string } | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactCounts {
  new: number;
  inProgress: number;
  resolved: number;
  total: number;
}

const CATEGORY_LABELS: Record<string, { label: string; badge: string; icon: any }> = {
  shipper: { label: "Chủ hàng", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: Package },
  driver: { label: "Tài xế / Nhà xe", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck },
  enterprise: { label: "Doanh nghiệp B2B", badge: "bg-purple-50 text-purple-700 border-purple-200", icon: Building },
  payment: { label: "Thanh toán & Ví", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: CreditCard },
  other: { label: "Khác", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: MessageSquare },
};

const STATUS_BADGES: Record<string, { label: string; badge: string; dot: string }> = {
  new: { label: "Mới cần xử lý", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_progress: { label: "Đang xử lý", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  resolved: { label: "Đã xử lý", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  spam: { label: "Spam / Hủy", badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<ContactCounts>({ new: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [modalStatus, setModalStatus] = useState<string>("new");
  const [modalNotes, setModalNotes] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (search.trim()) params.append("search", search.trim());
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await fetchWithAuth(`${API_BASE}/contacts/admin?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setContacts(data.contacts || []);
        if (data.counts) setCounts(data.counts);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openContactDetail = (contact: ContactMessage) => {
    setSelectedContact(contact);
    setModalStatus(contact.status);
    setModalNotes(contact.adminNotes || "");
    setActionSuccess(null);
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/contacts/admin/${selectedContact._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: modalStatus,
          adminNotes: modalNotes,
        }),
      });

      if (res.ok) {
        setActionSuccess("Đã lưu cập nhật thành công!");
        fetchContacts();
        setTimeout(() => {
          setSelectedContact((prev) => (prev ? { ...prev, status: modalStatus as any, adminNotes: modalNotes } : null));
        }, 300);
      }
    } catch (e) {
      console.error("Update failed", e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin nhắn liên hệ này không?")) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/contacts/admin/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedContact?._id === id) {
          setSelectedContact(null);
        }
        fetchContacts();
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-primary-600" />
            Quản Lý Liên Hệ Website
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, xử lý và phân loại các yêu cầu tư vấn, hợp tác gửi từ trang liên hệ của TXEPRO
          </p>
        </div>
        <button
          onClick={() => fetchContacts()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-600" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng liên hệ</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{counts.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-center justify-between bg-blue-50/20">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Mới cần xử lý</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{counts.new}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/20">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Đang xử lý</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{counts.inProgress}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Đã hoàn tất</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.resolved}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo họ tên, SĐT, email, tiêu đề..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="new">Mới cần xử lý</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="spam">Spam / Hủy</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 ml-2">
            <span>Đối tượng:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="shipper">Chủ hàng</option>
            <option value="driver">Tài xế / Nhà xe</option>
            <option value="enterprise">Doanh nghiệp B2B</option>
            <option value="payment">Thanh toán / Ví</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      {/* Contact Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">Đang tải danh sách liên hệ...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Chưa có liên hệ nào</p>
            <p className="text-xs text-slate-500 mt-1">Các liên hệ gửi từ website sẽ hiển thị đầy đủ tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Tiêu đề & Nội dung</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => {
                  const cat = CATEGORY_LABELS[contact.category] || CATEGORY_LABELS.other;
                  const CatIcon = cat.icon;
                  const st = STATUS_BADGES[contact.status] || STATUS_BADGES.new;
                  const formattedDate = new Date(contact.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={contact._id}
                      onClick={() => openContactDetail(contact)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        contact.status === "new" ? "bg-blue-50/15" : ""
                      }`}
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{contact.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium">{contact.phone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{contact.email}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.badge}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </td>

                      {/* Subject & snippet */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 truncate">{contact.subject}</div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{contact.message}</div>
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openContactDetail(contact)}
                            className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 text-xs font-semibold transition-colors"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa liên hệ"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 font-semibold"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 font-semibold"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & Handling Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Chi tiết tin nhắn liên hệ
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedContact.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sender Info Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Người gửi:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedContact.fullName}</p>
                <p className="text-slate-500 mt-0.5">
                  Đối tượng: {CATEGORY_LABELS[selectedContact.category]?.label || "Khác"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Số điện thoại:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-900 text-sm">{selectedContact.phone}</span>
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Gọi ngay"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-slate-400 mt-0.5">Bấm để gọi trực tiếp</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Địa chỉ Email:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-900 text-xs truncate">{selectedContact.email}</span>
                  <a
                    href={`mailto:${selectedContact.email}?subject=TXEPRO phản hồi: ${encodeURIComponent(
                      selectedContact.subject
                    )}`}
                    className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Gửi email phản hồi"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-slate-400 mt-0.5">Bấm để gửi email</p>
              </div>
            </div>

            {/* Message Content */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nội dung lời nhắn
              </label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                {selectedContact.message}
              </div>
            </div>

            {/* Handling Form */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Trạng thái xử lý
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full text-sm font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="new">Mới cần xử lý</option>
                    <option value="in_progress">Đang xử lý (Đã gọi / Đang trao đổi)</option>
                    <option value="resolved">Đã giải quyết hoàn tất</option>
                    <option value="spam">Spam / Hủy bỏ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Thời gian gửi tin
                  </label>
                  <div className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                    {new Date(selectedContact.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ghi chú nội bộ của Quản trị viên
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ghi lại tiến độ liên hệ, nội dung thỏa thuận hoặc hướng xử lý của chuyên viên..."
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium resize-none"
                />
              </div>

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteContact(selectedContact._id)}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tin nhắn này</span>
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={handleUpdateContact}
                    className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {updatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lưu cập nhật</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
