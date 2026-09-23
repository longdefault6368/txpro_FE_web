"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Filter,
  Inbox,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl, normalizePersistedImagePath } from "@/utils/media";
import { NewsContentEditor } from "@/components/admin/NewsContentEditor";

type NewsCategory = "news" | "guide" | "community" | "promotion" | "product";
type NewsAudience = "all" | "driver" | "shipper";

interface AdminNewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  audience: NewsAudience;
  imageUrl: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string | null;
}

interface NewsForm {
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  audience: NewsAudience;
  imageUrl: string;
  published: boolean;
  publishedAt: string;
}

const CATEGORY_LABELS: Record<NewsCategory, { label: string; badge: string }> = {
  promotion: { label: "Ưu đãi", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  product: { label: "Sản phẩm", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  guide: { label: "Hướng dẫn", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  community: { label: "Cộng đồng", badge: "bg-violet-50 text-violet-800 border-violet-200" },
  news: { label: "Tin tức", badge: "bg-slate-100 text-slate-700 border-slate-200" },
};

const AUDIENCE_LABELS: Record<NewsAudience, { label: string; badge: string }> = {
  all: { label: "Tất cả", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  driver: { label: "Tài xế", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  shipper: { label: "Chủ hàng", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

const EMPTY_FORM: NewsForm = {
  title: "",
  summary: "",
  content: "",
  category: "news",
  audience: "all",
  imageUrl: "",
  published: true,
  publishedAt: "",
};

function toDateTimeLocal(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<AdminNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNewsItem | null>(null);
  const [form, setForm] = useState<NewsForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (search.trim()) params.append("search", search.trim());
      if (category !== "all") params.append("category", category);
      if (audience !== "all") params.append("audience", audience);
      if (publishedFilter !== "all") params.append("published", publishedFilter);

      const res = await fetchWithAuth(`${API_BASE}/admin/news?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Không tải được danh sách tin tức.");
      }
      const json = await res.json();
      const data = json.data || json;
      setItems(data.items || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách tin tức.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, audience, publishedFilter]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const publishedCount = useMemo(
    () => items.filter((item) => item.published).length,
    [items],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: AdminNewsItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary || "",
      content: item.content || "",
      category: item.category,
      audience: item.audience,
      imageUrl: item.imageUrl || "",
      published: item.published,
      publishedAt: toDateTimeLocal(item.publishedAt),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn ảnh PNG, JPG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh phải nhỏ hơn 5MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetchWithAuth(`${API_BASE}/admin/news/upload`, {
        method: "POST",
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Tải ảnh thất bại.");
      }
      const url = json.data?.url || json.url;
      if (url) {
        setForm((prev) => ({ ...prev, imageUrl: normalizePersistedImagePath(url) }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim() || form.summary.trim(),
        category: form.category,
        audience: form.audience,
        imageUrl: normalizePersistedImagePath(form.imageUrl),
        published: form.published,
        ...(form.publishedAt ? { publishedAt: new Date(form.publishedAt).toISOString() } : {}),
      };
      const res = await fetchWithAuth(
        editing ? `${API_BASE}/admin/news/${editing.id}` : `${API_BASE}/admin/news`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Không lưu được bài viết.");
      }
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bài viết.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminNewsItem) => {
    if (!window.confirm(`Xóa bài viết “${item.title}”? Nội dung sẽ không còn trên app.`)) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/news/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không xóa được bài viết.");
      await fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được bài viết.");
    }
  };

  const handleTogglePublish = async (item: AdminNewsItem) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/news/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!res.ok) throw new Error("Không cập nhật được trạng thái.");
      await fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tin tức & Ưu đãi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nội dung đăng tại đây sẽ hiện trên tab tin tức của tài xế và chủ hàng.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Thêm bài viết
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng bài viết</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Đang hiển thị trên trang này</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bản nháp / ẩn</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{items.length - publishedCount}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tiêu đề hoặc tóm tắt..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <select
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="driver">Tài xế</option>
            <option value="shipper">Chủ hàng</option>
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => {
              setPublishedFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang hiện</option>
            <option value="false">Đang ẩn</option>
          </select>
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">Đang tải tin tức...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Chưa có bài viết</p>
            <p className="text-xs text-slate-500 mt-1">Thêm ưu đãi hoặc tin tức để hiển thị trên app.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <th className="py-3.5 px-4">Bài viết</th>
                  <th className="py-3.5 px-4">Loại</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Xuất bản</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.news;
                  const aud = AUDIENCE_LABELS[item.audience] || AUDIENCE_LABELS.all;
                  const image = getServerMediaUrl(item.imageUrl);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Newspaper className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-[360px]">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[360px]">{item.summary || "Không có tóm tắt"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-bold ${cat.badge}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-bold ${aud.badge}`}>
                          {aud.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            item.published
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {item.published ? "Đang hiện" : "Đang ẩn"}
                        </button>
                        <div className="text-[11px] text-slate-400 mt-1">{formatDate(item.publishedAt)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            title="Xóa"
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
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs font-semibold text-slate-500 py-2">Trang {page}/{totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editing ? "Sửa bài viết" : "Thêm bài viết"}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tiêu đề *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                  placeholder="Ví dụ: Ưu đãi phí sàn tháng 9"
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Loại</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })}
                    className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Hiển thị cho</span>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value as NewsAudience })}
                    className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                  >
                    <option value="all">Tất cả</option>
                    <option value="driver">Tài xế</option>
                    <option value="shipper">Chủ hàng</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tóm tắt</span>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                  placeholder="Hiển thị trên thẻ tin"
                />
              </label>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Nội dung chi tiết bài viết *</span>
                  <span className="text-[11px] text-slate-400">Hỗ trợ định dạng trực quan & xem trước mobile</span>
                </div>
                <NewsContentEditor
                  value={form.content}
                  onChange={(content) => setForm((prev) => ({ ...prev, content }))}
                  summary={form.summary}
                  category={CATEGORY_LABELS[form.category]?.label || form.category}
                  title={form.title}
                  imageUrl={getServerMediaUrl(form.imageUrl) || form.imageUrl}
                  audience={form.audience}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600">Ảnh</span>
                <div className="mt-1.5 flex gap-3">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                    placeholder="Dán URL hoặc tải ảnh lên"
                  />
                  <label className="inline-flex items-center gap-2 px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Đang tải..." : "Tải ảnh"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-3 w-full h-36 rounded-xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getServerMediaUrl(form.imageUrl) || form.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Thời điểm đăng</span>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Hiện trên app ngay</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
