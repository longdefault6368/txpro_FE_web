"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { 
  Search, UserPlus, Filter, Trash2, Edit3, ShieldAlert, Check, 
  X, Lock, ToggleLeft, ToggleRight, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight 
} from "lucide-react";
// Interfaces
interface User {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "admin" | "tai-xe" | "chu-hang";
  isActive: boolean;
  kycStatus: "draft" | "pending" | "pending_review" | "verified" | "rejected";
  language: string;
  createdAt: string;
}

type ManagedUserRole = "tai-xe" | "chu-hang";

// Initial Mock data for offline fallback
const INITIAL_MOCK_USERS: User[] = [
  {
    _id: "u-mock-1",
    name: "Nguyễn Văn Hùng",
    phone: "0912345678",
    email: "hung.nguyen@txepro.vn",
    role: "tai-xe",
    isActive: true,
    kycStatus: "verified",
    language: "vi",
    createdAt: "2026-07-01T08:30:00Z"
  },
  {
    _id: "u-mock-2",
    name: "Trần Thị Mai",
    phone: "0987654321",
    email: "mai.tran@gmail.com",
    role: "chu-hang",
    isActive: true,
    kycStatus: "verified",
    language: "vi",
    createdAt: "2026-07-02T10:15:00Z"
  },
  {
    _id: "u-mock-3",
    name: "Lê Minh Tuấn",
    phone: "0905123456",
    email: "tuan.le@outlook.com",
    role: "tai-xe",
    isActive: false,
    kycStatus: "pending_review",
    language: "vi",
    createdAt: "2026-07-05T14:22:00Z"
  },
  {
    _id: "u-mock-4",
    name: "Admin TXEPRO",
    phone: "0333444555",
    email: "admin@txepro.vn",
    role: "admin",
    isActive: true,
    kycStatus: "verified",
    language: "vi",
    createdAt: "2026-06-20T09:00:00Z"
  },
  {
    _id: "u-mock-5",
    name: "Phạm Quốc Bảo",
    phone: "0977888999",
    email: "bao.pham@gmail.com",
    role: "chu-hang",
    isActive: true,
    kycStatus: "draft",
    language: "en",
    createdAt: "2026-07-06T11:05:00Z"
  }
];

function AdminUsersContent() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // UI Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Form input states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "chu-hang" as ManagedUserRole,
    isActive: true,
    language: "vi"
  });
  const [newPassword, setNewPassword] = useState("");
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Authorization Check on Mount
  useEffect(() => {
    const saved = localStorage.getItem("txpro_user_session");
    const savedToken = localStorage.getItem("txpro_token");
    setToken(savedToken);

    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.rawRole === "admin" || session.role === "Admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: "5",
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {})
    });

    let responseOk = false;
    let errorResponseMsg = "";

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users?${queryParams.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data.users.filter((user: User) => user.role !== "admin"));
        setPagination(data.data.pagination);
        setIsOffline(false);
        responseOk = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        errorResponseMsg = errData.message || "Không thể tải danh sách người dùng từ hệ thống.";
      }
    } catch (err: any) {
      console.warn("Backend offline or connection error, using local fallback state", err);
      setIsOffline(true);
      responseOk = true;
      
      // Offline fallback state management (filtering & search simulated locally)
      let filtered = INITIAL_MOCK_USERS.filter((user) => user.role !== "admin");
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(searchLower) ||
          (u.email && u.email.toLowerCase().includes(searchLower)) ||
          (u.phone && u.phone.includes(searchLower))
        );
      }
      
      if (roleFilter) {
        filtered = filtered.filter(u => u.role === roleFilter);
      }
      
      if (statusFilter) {
        const activeRequired = statusFilter === "active";
        filtered = filtered.filter(u => u.isActive === activeRequired);
      }

      const limit = 5;
      const total = filtered.length;
      const pages = Math.ceil(total / limit) || 1;
      const startIdx = (currentPage - 1) * limit;
      const paginatedUsers = filtered.slice(startIdx, startIdx + limit);

      setUsers(paginatedUsers);
      setPagination({
        page: currentPage,
        limit,
        total,
        pages
      });
    } finally {
      setLoading(false);
      if (!responseOk && errorResponseMsg) {
        setErrorMsg(errorResponseMsg);
      }
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      fetchUsers();
    }
  }, [isAdmin, currentPage, search, roleFilter, statusFilter, token]);

  // Toast handler helper
  const showToast = (success: boolean, msg: string) => {
    if (success) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Add User submit handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast(false, "Vui lòng nhập Họ tên");
    if (!formData.phone.trim() && !formData.email.trim()) return showToast(false, "Vui lòng nhập Số điện thoại hoặc Email");
    if (!formData.password) return showToast(false, "Vui lòng nhập Mật khẩu ban đầu");

    try {
      if (isOffline) {
        // Offline Simulation
        const newUser: User = {
          _id: "u-mock-" + Date.now(),
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          kycStatus: "draft",
          language: formData.language,
          createdAt: new Date().toISOString()
        };
        INITIAL_MOCK_USERS.unshift(newUser);
        showToast(true, "Tạo tài khoản thành công (Offline Mode)");
        setShowAddModal(false);
        fetchUsers();
      } else {
        // Backend live call
        const res = await fetchWithAuth(`${API_BASE}/admin/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          showToast(true, "Tạo tài khoản thành công");
          setShowAddModal(false);
          fetchUsers();
        } else {
          const data = await res.json();
          throw new Error(data.message || "Lỗi tạo tài khoản");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Edit User submit handler (PUT edits name/language only according to Backend specifications)
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (isOffline) {
        // Offline simulation
        const idx = INITIAL_MOCK_USERS.findIndex(u => u._id === currentUser._id);
        if (idx !== -1) {
          INITIAL_MOCK_USERS[idx] = {
            ...INITIAL_MOCK_USERS[idx],
            name: formData.name,
            language: formData.language
          };
        }
        showToast(true, "Cập nhật thành công (Offline Mode)");
        setShowEditModal(false);
        fetchUsers();
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            language: formData.language
          })
        });

        if (res.ok) {
          showToast(true, "Cập nhật thành công");
          setShowEditModal(false);
          fetchUsers();
        } else {
          const data = await res.json();
          throw new Error(data.message || "Lỗi cập nhật người dùng");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (user: User) => {
    const nextActiveState = !user.isActive;
    try {
      if (isOffline) {
        const idx = INITIAL_MOCK_USERS.findIndex(u => u._id === user._id);
        if (idx !== -1) {
          INITIAL_MOCK_USERS[idx].isActive = nextActiveState;
        }
        showToast(true, `Đã cập nhật trạng thái hoạt động (Offline Mode)`);
        fetchUsers();
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ isActive: nextActiveState })
        });

        if (res.ok) {
          showToast(true, `Cập nhật trạng thái thành công`);
          fetchUsers();
        } else {
          const data = await res.json();
          throw new Error(data.message || "Lỗi cập nhật trạng thái");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Change user role
  const handleChangeRole = async (user: User, newRole: ManagedUserRole) => {
    if (user.role === newRole) return;
    try {
      if (isOffline) {
        const idx = INITIAL_MOCK_USERS.findIndex(u => u._id === user._id);
        if (idx !== -1) {
          INITIAL_MOCK_USERS[idx].role = newRole;
        }
        showToast(true, `Đã đổi quyền sang ${newRole} (Offline Mode)`);
        fetchUsers();
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/${user._id}/role`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
          showToast(true, `Đổi vai trò thành công`);
          fetchUsers();
        } else {
          const data = await res.json();
          throw new Error(data.message || "Lỗi cập nhật vai trò");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này?")) return;

    try {
      if (isOffline) {
        const idx = INITIAL_MOCK_USERS.findIndex(u => u._id === id);
        if (idx !== -1) {
          INITIAL_MOCK_USERS.splice(idx, 1);
        }
        showToast(true, "Đã xóa tài khoản thành công (Offline Mode)");
        fetchUsers();
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}`, {
          method: "DELETE"
        });

        if (res.ok) {
          showToast(true, "Đã xóa tài khoản thành công");
          fetchUsers();
        } else {
          const data = await res.json();
          throw new Error(data.message || "Không thể xóa tài khoản");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  // Reset user password directly as admin
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newPassword || newPassword.length < 6) {
      return showToast(false, "Mật khẩu mới phải từ 6 ký tự trở lên");
    }

    try {
      if (isOffline) {
        showToast(true, `Đã reset mật khẩu tài khoản ${currentUser.name} thành công (Offline Mode)`);
        setShowPasswordModal(false);
        setNewPassword("");
      } else {
        const res = await fetchWithAuth(`${API_BASE}/admin/users/${currentUser._id}/password`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ newPassword: newPassword })
        });

        if (res.ok) {
          showToast(true, `Đã reset mật khẩu của ${currentUser.name}`);
          setShowPasswordModal(false);
          setNewPassword("");
        } else {
          const data = await res.json();
          throw new Error(data.message || "Lỗi đổi mật khẩu");
        }
      }
    } catch (err: any) {
      showToast(false, err.message);
    }
  };

  return (
    <>
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
          <AlertTriangle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Danh Sách Thành Viên
              {isOffline && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Chế độ offline
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Quản lý phân quyền, kiểm tra trạng thái hoạt động và bảo mật tài khoản thành viên hệ thống.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                name: "",
                phone: "",
                email: "",
                password: "",
                role: "chu-hang",
                isActive: true,
                language: "vi"
              });
              setShowAddModal(true);
            }}
            className="btn-primary py-3 px-5 text-xs font-bold flex items-center gap-2 rounded-2xl shadow-lg shadow-primary-200 transition-all hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4" /> Thêm Người Dùng
          </button>
        </div>
          {errorMsg && (
            <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-sm font-semibold animate-fade-in">
              <AlertTriangle className="w-5 h-5" /> {errorMsg}
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-6 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <input
                type="text"
                placeholder="Tìm theo họ tên, số điện thoại, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm transition-all"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Role Select */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-44 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Tất cả Vai trò</option>
                  <option value="tai-xe">Tài Xế</option>
                  <option value="chu-hang">Chủ Hàng</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Select */}
              <div className="relative flex-1 md:flex-initial">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full md:w-44 pl-10 pr-8 py-3 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Tất cả Trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã bị khóa</option>
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-slate-400 text-xs mt-4">Đang tải danh sách tài khoản...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <Search className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">Không tìm thấy người dùng phù hợp</p>
                <p className="text-xs">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                      <th className="py-4 px-6">Họ và Tên</th>
                      <th className="py-4 px-6">Số điện thoại / Email</th>
                      <th className="py-4 px-6">Vai trò</th>
                      <th className="py-4 px-6">Xác minh eKYC</th>
                      <th className="py-4 px-6">Ngày Tạo</th>
                      <th className="py-4 px-6 text-center">Trạng thái</th>
                      <th className="py-4 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary-50 text-primary-600 rounded-full font-bold flex items-center justify-center text-xs shadow-inner">
                              {(user.name || "User").split(" ").pop()?.substring(0, 2).toUpperCase() || "US"}
                            </div>
                            <span className="font-bold text-slate-800">{user.name || "Người dùng TXEPRO"}</span>
                          </div>
                        </td>
                        
                        {/* Phone / Email */}
                        <td className="py-4.5 px-6">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-700">{user.phone || "---"}</p>
                            <p className="text-xs text-slate-400">{user.email || "---"}</p>
                          </div>
                        </td>

                        {/* Role Select & Badge */}
                        <td className="py-4.5 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user, e.target.value as ManagedUserRole)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none border border-slate-200 bg-white transition-all cursor-pointer ${
                              user.role === "tai-xe" 
                                  ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                                  : "text-blue-600 bg-blue-50 border-blue-100"
                            }`}
                          >
                            <option value="chu-hang">Chủ Hàng</option>
                            <option value="tai-xe">Tài Xế</option>
                          </select>
                        </td>

                        {/* eKYC Verification Status Badge */}
                        <td className="py-4.5 px-6">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                            user.kycStatus === "verified"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : user.kycStatus === "pending" || user.kycStatus === "pending_review"
                                ? "text-amber-700 bg-amber-50 border-amber-200 animate-pulse"
                                : user.kycStatus === "rejected"
                                  ? "text-red-700 bg-red-50 border-red-200"
                                  : "text-slate-500 bg-slate-50 border-slate-200"
                          }`}>
                            {user.kycStatus === "verified"
                              ? "Đã xác minh"
                              : user.kycStatus === "pending" || user.kycStatus === "pending_review"
                                ? "Chờ duyệt"
                                : user.kycStatus === "rejected"
                                  ? "Bị từ chối"
                                  : "Chưa gửi"}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="py-4.5 px-6 text-xs font-semibold text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>

                        {/* Status Switch Toggle */}
                        <td className="py-4.5 px-6 text-center">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`transition-colors duration-200 outline-none focus:outline-none cursor-pointer ${
                              user.isActive ? "text-primary-500" : "text-slate-300"
                            }`}
                            title={user.isActive ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
                          >
                            {user.isActive ? (
                              <ToggleRight className="w-8 h-8" />
                            ) : (
                              <ToggleLeft className="w-8 h-8" />
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setCurrentUser(user);
                                setNewPassword("");
                                setShowPasswordModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                              title="Đặt lại mật khẩu"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setCurrentUser(user);
                                setFormData({
                                  name: user.name,
                                  phone: user.phone || "",
                                  email: user.email || "",
                                  password: "",
                                  role: user.role === "admin" ? "chu-hang" : user.role,
                                  isActive: user.isActive,
                                  language: user.language
                                });
                                setShowEditModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && pagination.pages > 1 && (
              <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-400 font-bold">
                  Hiển thị trang <span className="text-slate-700">{pagination.page}</span> / {pagination.pages} (Tổng {pagination.total} tài khoản)
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
        </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Thêm Người Dùng Mới</h3>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại liên hệ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập địa chỉ email"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mật khẩu từ 6 ký tự trở lên"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Vai trò */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as ManagedUserRole })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer"
                >
                  <option value="chu-hang">Chủ Hàng</option>
                  <option value="tai-xe">Tài Xế</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Chỉnh Sửa Thông Tin</h3>
            
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1"
                />
              </div>

              {/* Ngôn ngữ */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Ngôn ngữ mặc định</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm mt-1 bg-white cursor-pointer"
                >
                  <option value="vi">Tiếng Việt (VI)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              {/* Note on sensitive data */}
              <div className="bg-slate-50 rounded-xl p-3 text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Theo thiết kế bảo mật của hệ thống, Số điện thoại, Email, Vai trò và Trạng thái khóa sẽ được cập nhật thông qua các thao tác trực tiếp trên bảng quản lý.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {showPasswordModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Khôi Phục Mật Khẩu</h3>
            <p className="text-slate-400 text-xs mb-6">
              Đặt lại mật khẩu mới cho tài khoản của <span className="font-bold text-slate-700">{currentUser.name}</span>.
            </p>
            
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu mới</label>
                <div className="relative mt-1">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới tối thiểu 6 ký tự"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-primary-500 text-sm"
                    required
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  );
}
