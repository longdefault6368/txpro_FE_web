"use client";

import { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Layers,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  LayoutDashboard,
  Bell,
  Users,
  Package,
  BarChart3,
  Headset,
  TerminalSquare,
  Settings,
  Save,
  Plus,
  RotateCcw,
  Zap,
  CheckSquare,
  Square,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl } from "@/utils/media";
import {
  AdminRole,
  ADMIN_ROLE_CONFIG,
  ADMIN_PERMISSION_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
} from "../layout";

const MODULE_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  notifications: Bell,
  users: Users,
  orders: Package,
  analytics: BarChart3,
  support: Headset,
  logs: TerminalSquare,
  settings: Settings,
  team: UserCheck,
};

const PATH_SHORT_LABELS: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/notifications": "Thông báo",
  "/admin/users": "Người Dùng",
  "/admin/orders": "Đơn hàng",
  "/admin/analytics": "Phân tích",
  "/admin/support": "Hỗ trợ & Chat",
  "/admin/logs": "Nhật ký hệ thống",
  "/admin/settings": "Cài đặt hệ thống",
  "/admin/team": "Ban Quản Trị",
};

export interface RoleItem {
  key: string;
  label: string;
  description: string;
  badgeClass?: string;
  color?: string;
}

const DEFAULT_CONFIG_ROLES: RoleItem[] = [
  {
    key: "dispatcher",
    label: "Điều Phối Viên",
    description: "Giám sát đơn hàng, theo dõi lộ trình di chuyển của xe tải, trực live chat hỗ trợ chuyến đi",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    color: "#0284c7",
  },
  {
    key: "operations",
    label: "Quản Lý Vận Hành",
    description: "Giám sát toàn diện vận đơn, tài xế, chủ hàng, báo cáo phân tích và can thiệp xử lý sự cố",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    color: "#2563eb",
  },
  {
    key: "kyc_officer",
    label: "Chuyên Viên KYC",
    description: "Thẩm định và xét duyệt hồ sơ căn cước công dân (CCCD), giấy phép lái xe và phương tiện xe tải",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    color: "#0d9488",
  },
  {
    key: "cskh",
    label: "Chăm Sóc Khách Hàng",
    description: "Trực Live Chat trực tiếp 24/7, xử lý Ticket hỗ trợ và giải quyết khiếu nại của khách hàng",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    color: "#16a34a",
  },
  {
    key: "accountant",
    label: "Kế Toán & Đối Soát",
    description: "Xem báo cáo doanh thu tài chính sàn, đối soát cước phí chuyến xe và kiểm tra giao dịch ví",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    color: "#4f46e5",
  },
];

const ROLE_DEFAULT_ICONS: Record<string, any> = {
  dispatcher: Package,
  operations: LayoutDashboard,
  kyc_officer: ShieldCheck,
  cskh: Headset,
  accountant: BarChart3,
};

interface TeamMember {
  _id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  adminRole: string;
  adminPermissions?: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  avatar?: string | null;
}

const MODULE_CATEGORY_INFO: Record<string, { label: string; badge: string }> = {
  core: { label: "Nền tảng", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  operations: { label: "Vận hành", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  support: { label: "Hỗ trợ", badge: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  finance: { label: "Tài chính", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  system: { label: "Hệ thống", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

function TeamMemberAvatar({
  avatar,
  name,
}: {
  avatar?: string | null;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const rawUrl = avatar ? (getServerMediaUrl(avatar) || avatar) : null;
  const hasValidAvatar = !!rawUrl && !imgError;

  const initials = useMemo(() => {
    if (!name || !name.trim()) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }, [name]);

  if (hasValidAvatar) {
    return (
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 shadow-sm flex-shrink-0 flex items-center justify-center">
        <img
          src={rawUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 select-none">
      <span>{initials}</span>
    </div>
  );
}

export default function AdminTeamPage() {
  const [activeTab, setActiveTab] = useState<"team" | "roles">("team");
  const [matrixViewMode, setMatrixViewMode] = useState<"table" | "cards">("table");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dynamic Roles List & Selected Role
  const [rolesList, setRolesList] = useState<RoleItem[]>(DEFAULT_CONFIG_ROLES);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>("dispatcher");

  // Role Permissions Tab State
  const [rolePermsMap, setRolePermsMap] = useState<Record<string, string[]>>({
    dispatcher: [...(DEFAULT_ROLE_PERMISSIONS.dispatcher || [])],
    operations: [...(DEFAULT_ROLE_PERMISSIONS.operations || [])],
    kyc_officer: [...(DEFAULT_ROLE_PERMISSIONS.kyc_officer || [])],
    cskh: [...(DEFAULT_ROLE_PERMISSIONS.cskh || [])],
    accountant: [...(DEFAULT_ROLE_PERMISSIONS.accountant || [])],
  });
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);

  // Role CRUD Modals State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleItem | null>(null);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);

  // Role Forms
  const [newRoleForm, setNewRoleForm] = useState({
    key: "",
    label: "",
    description: "",
    color: "#7c3aed",
  });
  const [editRoleForm, setEditRoleForm] = useState({
    label: "",
    description: "",
    color: "#2563eb",
  });

  // Staff Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    adminRole: "cskh" as string,
    adminPermissions: [...(DEFAULT_ROLE_PERMISSIONS.cskh || [])] as string[],
  });
  const [targetAdminRole, setTargetAdminRole] = useState<string>("cskh");
  const [targetPermissions, setTargetPermissions] = useState<string[]>([...(DEFAULT_ROLE_PERMISSIONS.cskh || [])]);
  const [submitting, setSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({
    show: false,
    success: true,
    message: "",
  });

  const showToast = (success: boolean, message: string) => {
    setToast({ show: true, success, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/team`);

      let teamList: any[] = [];
      if (res.ok) {
        const data = await res.json();
        teamList = data.data?.team || [];
      } else {
        // Fallback: list users with role=admin
        const fallbackRes = await fetchWithAuth(`${API_BASE}/admin/users?role=admin&limit=50`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          teamList = data.data?.users || [];
        } else {
          throw new Error("Không thể tải danh sách ban quản trị");
        }
      }

      const formattedList: TeamMember[] = teamList.map((u: any, idx: number) => {
        const userId = String(u._id || u.id || "");
        const emailLower = (u.email || "").toLowerCase();
        const phoneClean = u.phone || "";

        // Check local storage cache for any role assigned on this client
        const cachedRole = (typeof window !== "undefined"
          ? (localStorage.getItem(`txpro_admin_role_${userId}`) ||
            (emailLower ? localStorage.getItem(`txpro_admin_role_${emailLower}`) : null) ||
            (phoneClean ? localStorage.getItem(`txpro_admin_role_${phoneClean}`) : null))
          : null) as AdminRole | null;

        let cachedPerms: string[] | undefined = undefined;
        if (typeof window !== "undefined") {
          try {
            const rawPerms = localStorage.getItem(`txpro_admin_perms_${userId}`);
            if (rawPerms) {
              const parsed = JSON.parse(rawPerms);
              if (Array.isArray(parsed)) cachedPerms = parsed;
            }
          } catch { }
        }

        let resolvedRole: string = "cskh";
        if (u.adminRole) {
          resolvedRole = u.adminRole;
        } else if (cachedRole) {
          resolvedRole = cachedRole;
        } else if (emailLower === "admin@txepro.vn" || emailLower.includes("super") || (idx === 0 && !cachedRole)) {
          resolvedRole = "super_admin";
        } else {
          resolvedRole = "cskh";
        }

        let customRolePerms: string[] | undefined = undefined;
        if (typeof window !== "undefined") {
          try {
            const rawRoleMap = localStorage.getItem("txpro_role_permissions");
            if (rawRoleMap) {
              const parsed = JSON.parse(rawRoleMap);
              if (Array.isArray(parsed[resolvedRole])) customRolePerms = parsed[resolvedRole];
            }
          } catch { }
        }

        const resolvedPermissions = Array.isArray(u.adminPermissions) && u.adminPermissions.length > 0
          ? u.adminPermissions
          : (cachedPerms || customRolePerms || DEFAULT_ROLE_PERMISSIONS[resolvedRole as AdminRole] || []);

        return {
          _id: userId,
          name: u.name || "Quản trị viên",
          email: u.email,
          phone: u.phone,
          role: "admin",
          adminRole: resolvedRole,
          adminPermissions: resolvedPermissions,
          isActive: u.isActive !== false,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt || new Date().toISOString(),
          avatar: u.avatar,
        };
      });

      setTeam(formattedList);
    } catch (err: any) {
      console.warn("Fetch team error, using local fallback", err);
      showToast(false, err?.message || "Lỗi khi tải danh sách quản trị viên");
    } finally {
      setLoading(false);
    }
  };

  const getRoleMeta = (roleKey: string) => {
    const custom = rolesList.find((r) => r.key === roleKey);
    if (custom) {
      return {
        label: custom.label,
        color: custom.color || "#64748b",
        badgeClass: custom.badgeClass || "bg-slate-100 text-slate-800 border-slate-200",
      };
    }
    const builtin = (ADMIN_ROLE_CONFIG as any)[roleKey];
    if (builtin) {
      return {
        label: builtin.label,
        color: builtin.color,
        badgeClass: builtin.badgeClass,
      };
    }
    return {
      label: roleKey,
      color: "#64748b",
      badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    };
  };

  const fetchRolePermissions = async () => {
    setLoadingRolePerms(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/roles/permissions`);

      if (res.ok) {
        const data = await res.json();
        if (data.data?.rolesList && Array.isArray(data.data.rolesList)) {
          setRolesList(data.data.rolesList);
          localStorage.setItem("txpro_admin_roles_list", JSON.stringify(data.data.rolesList));
        }
        if (data.data?.rolePermissions) {
          setRolePermsMap((prev) => ({
            ...prev,
            ...data.data.rolePermissions,
          }));
          localStorage.setItem("txpro_role_permissions", JSON.stringify(data.data.rolePermissions));
        }
      } else {
        const cachedRoles = localStorage.getItem("txpro_admin_roles_list");
        if (cachedRoles) {
          try {
            setRolesList(JSON.parse(cachedRoles));
          } catch { }
        }
        const cached = localStorage.getItem("txpro_role_permissions");
        if (cached) {
          try {
            setRolePermsMap((prev) => ({ ...prev, ...JSON.parse(cached) }));
          } catch { }
        }
      }
    } catch {
      const cachedRoles = localStorage.getItem("txpro_admin_roles_list");
      if (cachedRoles) {
        try {
          setRolesList(JSON.parse(cachedRoles));
        } catch { }
      }
      const cached = localStorage.getItem("txpro_role_permissions");
      if (cached) {
        try {
          setRolePermsMap((prev) => ({ ...prev, ...JSON.parse(cached) }));
        } catch { }
      }
    } finally {
      setLoadingRolePerms(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedRoles = localStorage.getItem("txpro_admin_roles_list");
        if (cachedRoles) {
          const parsed = JSON.parse(cachedRoles);
          if (Array.isArray(parsed) && parsed.length > 0) setRolesList(parsed);
        }
        const cachedPerms = localStorage.getItem("txpro_role_permissions");
        if (cachedPerms) {
          const parsed = JSON.parse(cachedPerms);
          if (parsed && typeof parsed === "object") {
            setRolePermsMap((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {}
    }
    fetchTeam();
    fetchRolePermissions();
  }, []);

  const handleToggleRoleModule = (roleKey: string, modulePath: string) => {
    setRolePermsMap((prev) => {
      const current = prev[roleKey] || [];
      const exists = current.includes(modulePath);
      const updated = exists
        ? current.filter((p) => p !== modulePath)
        : [...current, modulePath];
      return { ...prev, [roleKey]: updated };
    });
  };

  const handleSetAllRoleModules = (roleKey: string) => {
    const allPaths = ADMIN_PERMISSION_MODULES.map((m) => m.path);
    setRolePermsMap((prev) => ({ ...prev, [roleKey]: allPaths }));
  };

  const handleClearAllRoleModules = (roleKey: string) => {
    setRolePermsMap((prev) => ({ ...prev, [roleKey]: [] }));
  };

  const handleResetRoleModulesToDefault = (roleKey: string) => {
    const defaultPaths = DEFAULT_ROLE_PERMISSIONS[roleKey as AdminRole] || ["/admin"];
    setRolePermsMap((prev) => ({ ...prev, [roleKey]: [...defaultPaths] }));
  };

  const handleSaveRolePermissions = async (roleKey: string) => {
    setSavingRole(roleKey);
    const permissions = rolePermsMap[roleKey] || [];
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/roles/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleKey, permissions }),
      });

      const updatedMap = {
        ...rolePermsMap,
        [roleKey]: permissions,
      };
      localStorage.setItem("txpro_role_permissions", JSON.stringify(updatedMap));

      // Update members in team state who have this role
      setTeam((prev) =>
        prev.map((m) => {
          if (m.adminRole === roleKey) {
            return { ...m, adminPermissions: [...permissions] };
          }
          return m;
        })
      );

      const roleMeta = getRoleMeta(roleKey);
      const count = team.filter((m) => m.adminRole === roleKey).length;
      showToast(true, `Đã lưu phân quyền cho [${roleMeta.label}] và tự động áp dụng cho tất cả ${count} thành viên!`);
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi lưu phân quyền vai trò");
    } finally {
      setSavingRole(null);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawKey = newRoleForm.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!rawKey || !newRoleForm.label.trim()) {
      showToast(false, "Vui lòng nhập mã định danh và tên hiển thị vai trò!");
      return;
    }
    if (rawKey === "super_admin") {
      showToast(false, "Không thể tạo vai trò trùng với super_admin!");
      return;
    }
    if (rolesList.some((r) => r.key === rawKey)) {
      showToast(false, `Mã vai trò '${rawKey}' đã tồn tại!`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        key: rawKey,
        label: newRoleForm.label.trim(),
        description: newRoleForm.description.trim() || `Vai trò ${newRoleForm.label.trim()}`,
        color: newRoleForm.color || "#7c3aed",
        permissions: ["/admin"],
      };

      const res = await fetchWithAuth(`${API_BASE}/admin/users/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Không thể tạo vai trò mới");
      }

      const newRoleItem: RoleItem = {
        key: payload.key,
        label: payload.label,
        description: payload.description,
        color: payload.color,
      };

      const updatedRoles = [...rolesList, newRoleItem];
      setRolesList(updatedRoles);
      localStorage.setItem("txpro_admin_roles_list", JSON.stringify(updatedRoles));
      setRolePermsMap((prev) => ({ ...prev, [payload.key]: payload.permissions }));
      setSelectedRoleKey(payload.key);
      setShowAddRoleModal(false);
      setNewRoleForm({ key: "", label: "", description: "", color: "#7c3aed" });
      showToast(true, `Đã thêm vai trò [${payload.label}] thành công!`);
      await fetchRolePermissions();
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi tạo vai trò");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleToEdit) return;
    if (!editRoleForm.label.trim()) {
      showToast(false, "Vui lòng nhập tên hiển thị của vai trò!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        label: editRoleForm.label.trim(),
        description: editRoleForm.description.trim(),
        color: editRoleForm.color,
      };

      const res = await fetchWithAuth(`${API_BASE}/admin/users/roles/${roleToEdit.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Không thể cập nhật thông tin vai trò");
      }

      const updatedRoles = rolesList.map((r) =>
        r.key === roleToEdit.key ? { ...r, ...payload } : r
      );
      setRolesList(updatedRoles);
      localStorage.setItem("txpro_admin_roles_list", JSON.stringify(updatedRoles));
      setShowEditRoleModal(false);
      setRoleToEdit(null);
      showToast(true, `Đã cập nhật thông tin vai trò [${payload.label}] thành công!`);
      await fetchRolePermissions();
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi cập nhật vai trò");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    if (roleToDelete.key === "super_admin") {
      showToast(false, "Không thể xóa vai trò Super Admin!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/roles/${roleToDelete.key}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Không thể xóa vai trò");
      }

      const remainingRoles = rolesList.filter((r) => r.key !== roleToDelete.key);
      setRolesList(remainingRoles);
      localStorage.setItem("txpro_admin_roles_list", JSON.stringify(remainingRoles));
      if (selectedRoleKey === roleToDelete.key) {
        setSelectedRoleKey(remainingRoles[0]?.key || "dispatcher");
      }
      setShowDeleteRoleModal(false);
      setRoleToDelete(null);
      showToast(true, `Đã xóa vai trò [${roleToDelete.label}] thành công!`);
      await fetchTeam();
      await fetchRolePermissions();
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi xóa vai trò");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.password.trim() || (!createForm.email?.trim() && !createForm.phone?.trim())) {
      showToast(false, "Vui lòng nhập Họ tên, Mật khẩu và ít nhất Email hoặc Số điện thoại!");
      return;
    }

    const assignedRole = createForm.adminRole;
    setSubmitting(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
        password: createForm.password.trim(),
        role: "admin",
        adminRole: assignedRole,
        adminPermissions: createForm.adminPermissions,
        isActive: true,
      };

      const res = await fetchWithAuth(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || "Không thể tạo tài khoản quản trị");
      }

      const resData = await res.json().catch(() => null);
      const createdUser = resData?.data?.user;
      const createdId = String(createdUser?._id || createdUser?.id || "");

      if (createdId) {
        // Cache role and custom permissions locally
        localStorage.setItem(`txpro_admin_role_${createdId}`, assignedRole);
        localStorage.setItem(`txpro_admin_perms_${createdId}`, JSON.stringify(createForm.adminPermissions));
        if (createForm.email) {
          localStorage.setItem(`txpro_admin_role_${createForm.email.trim().toLowerCase()}`, assignedRole);
        }
        if (createForm.phone) {
          localStorage.setItem(`txpro_admin_role_${createForm.phone.trim()}`, assignedRole);
        }

        // Also call PATCH /admin-role as backup to ensure server-side DB persistence
        try {
          await fetchWithAuth(`${API_BASE}/admin/users/${createdId}/admin-role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminRole: assignedRole,
              adminPermissions: createForm.adminPermissions,
            }),
          });
        } catch { }
      }

      showToast(true, `Đã thêm thành công nhân sự [${createForm.name}] với vai trò ${getRoleMeta(assignedRole).label}`);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        adminRole: "cskh",
        adminPermissions: [...(DEFAULT_ROLE_PERMISSIONS.cskh || [])],
      });
      await fetchTeam();
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi tạo nhân sự mới");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const payload = {
        adminRole: targetAdminRole,
        adminPermissions: targetPermissions,
      };
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${selectedMember._id}/admin-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || "Không thể cập nhật cấp bậc & quyền xem");
      }

      // Update local storage cache
      localStorage.setItem(`txpro_admin_role_${selectedMember._id}`, targetAdminRole);
      localStorage.setItem(`txpro_admin_perms_${selectedMember._id}`, JSON.stringify(targetPermissions));
      if (selectedMember.email) {
        localStorage.setItem(`txpro_admin_role_${selectedMember.email.toLowerCase()}`, targetAdminRole);
      }
      if (selectedMember.phone) {
        localStorage.setItem(`txpro_admin_role_${selectedMember.phone}`, targetAdminRole);
      }

      showToast(true, `Đã cập nhật vai trò & quyền xem của [${selectedMember.name}]`);
      setShowRoleModal(false);
      setSelectedMember(null);
      await fetchTeam();
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi đổi quyền");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (member.adminRole === "super_admin" || member.email === "admin@txepro.vn") {
      showToast(false, "Tài khoản Super Admin được bảo vệ tối cao, không thể vô hiệu hóa!");
      return;
    }

    const nextStatus = !member.isActive;
    const confirmText = nextStatus
      ? `Mở khóa quyền truy cập cho [${member.name}]?`
      : `VÔ HIỆU HÓA tài khoản [${member.name}]? Nhân sự này sẽ bị đăng xuất và khóa truy cập!`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${member._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        // If deactivating, also reset their sessions
        if (!nextStatus) {
          fetchWithAuth(`${API_BASE}/admin/users/${member._id}/reset-session`, { method: "POST" }).catch(() => null);
        }
        showToast(true, nextStatus ? `Đã mở khóa tài khoản [${member.name}]` : `Đã vô hiệu hóa tài khoản của [${member.name}]`);
        setTeam((prev) => prev.map((m) => m._id === member._id ? { ...m, isActive: nextStatus } : m));
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || "Không thể cập nhật trạng thái");
      }
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi thao tác");
    }
  };

  const handleDeleteStaff = async () => {
    if (!memberToDelete) return;
    if (memberToDelete.adminRole === "super_admin" || memberToDelete.email === "admin@txepro.vn") {
      showToast(false, "Tài khoản Super Admin được bảo vệ tối cao, không thể xóa!");
      setShowDeleteModal(false);
      setMemberToDelete(null);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${memberToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || "Không thể xóa tài khoản");
      }

      setTeam((prev) => prev.filter((m) => m._id !== memberToDelete._id));
      localStorage.removeItem(`txpro_admin_role_${memberToDelete._id}`);
      if (memberToDelete.email) localStorage.removeItem(`txpro_admin_role_${memberToDelete.email.toLowerCase()}`);
      if (memberToDelete.phone) localStorage.removeItem(`txpro_admin_role_${memberToDelete.phone}`);

      showToast(true, `Đã xóa thành công tài khoản [${memberToDelete.name}] khỏi ban quản trị!`);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err: any) {
      showToast(false, err?.message || "Lỗi khi xóa tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeam = useMemo(() => {
    return team.filter((item) => {
      if (roleFilter !== "all" && item.adminRole !== roleFilter) return false;
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchEmail = (item.email || "").toLowerCase().includes(q);
        const matchPhone = (item.phone || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [team, search, roleFilter, statusFilter]);


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ban Quản Trị</h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Quản lý các cấp bậc điều hành, nhân sự nội bộ và phân quyền vai trò cho hệ sinh thái TXEPRO
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "team" ? (
            <>
              <button
                onClick={fetchTeam}
                className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-600" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-primary-600/20"
              >
                <UserPlus className="w-4 h-4" /> Thêm Quản Trị Viên Mới
              </button>
            </>
          ) : (
            <button
              onClick={fetchRolePermissions}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="Làm mới cấu hình phân quyền vai trò"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRolePerms ? "animate-spin text-primary-600" : ""}`} />
              Làm mới quyền
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "team"
              ? "border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Ban Quản Trị</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "team" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"
              }`}
          >
            {team.length} nhân sự
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("roles");
            fetchRolePermissions();
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "roles"
              ? "border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Phân Quyền Vai Trò</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "roles" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"
              }`}
          >
            {rolesList.length} vai trò
          </span>
        </button>
      </div>

      {activeTab === "team" ? (
        <>


          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
              >
                <option value="all">Tất cả cấp bậc</option>
                <option value="super_admin">Super Admin (Chủ sở hữu)</option>
                {rolesList.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
            </div>
          </div>

          {/* Team Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Mobile Swipe Hint */}
            <div className="md:hidden px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Danh sách nhân sự</span>
              <span className="text-primary-600 font-bold">← Vuốt ngang để xem đủ cột →</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[880px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-4 px-6 min-w-[200px]">Quản Trị Viên</th>
                    <th className="py-4 px-4 min-w-[140px]">Cấp Bậc</th>
                    <th className="py-4 px-4 min-w-[180px]">Quyền Hạn Chính</th>
                    <th className="py-4 px-4 w-[110px]">Trạng Thái</th>
                    <th className="py-4 px-4 min-w-[150px]">Đăng Nhập Cuối</th>
                    <th className="py-4 px-6 text-right w-[110px]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {loading && team.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                        Đang tải danh sách ban quản trị...
                      </td>
                    </tr>
                  ) : filteredTeam.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        Không tìm thấy nhân sự phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredTeam.map((member) => {
                      const roleCfg = getRoleMeta(member.adminRole);
                      const isSuper = member.adminRole === "super_admin";
                      // Derive display labels from live rolePermsMap → module names
                      const permPaths: string[] = Array.isArray(member.adminPermissions) && member.adminPermissions.length > 0
                        ? member.adminPermissions
                        : (rolePermsMap[member.adminRole] || (DEFAULT_ROLE_PERMISSIONS as any)[member.adminRole] || []);
                      const perms: string[] = permPaths.map((path) => {
                        const mod = ADMIN_PERMISSION_MODULES.find((m) => m.path === path);
                        return mod ? mod.name : (PATH_SHORT_LABELS[path] || path);
                      });

                      return (
                        <tr key={member._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Name & Contact */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <TeamMemberAvatar avatar={member.avatar} name={member.name} />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{member.name}</p>
                                <p className="text-slate-500 text-[11px] flex flex-col gap-0.5 mt-0.5">
                                  {member.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" /> {member.email}</span>}
                                  {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" /> {member.phone}</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleCfg.badgeClass}`}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: roleCfg.color }} />
                              {isSuper ? "Admin" : roleCfg.label}
                            </span>
                          </td>

                          {/* Permissions Summary */}
                          <td className="py-4 px-4 min-w-[180px] max-w-xs">
                            <div className="flex flex-wrap items-center gap-1">
                              {isSuper ? (
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  Toàn quyền hệ thống (*)
                                </span>
                              ) : (
                                <>
                                  {Array.isArray(member.adminPermissions) &&
                                    member.adminPermissions.length > 0 &&
                                    JSON.stringify(member.adminPermissions.slice().sort()) !==
                                    JSON.stringify((DEFAULT_ROLE_PERMISSIONS[member.adminRole as AdminRole] || []).slice().sort()) && (
                                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                                        Tùy biến ({member.adminPermissions.length})
                                      </span>
                                    )}
                                  {perms.slice(0, 2).map((p, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                  {perms.length > 2 && (
                                    <span className="text-slate-400 text-[10px] font-bold py-0.5">
                                      +{perms.length - 2} quyền
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                              member.isActive
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-red-700 bg-red-50 border-red-200"
                            }`}>
                              {member.isActive ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </td>

                          {/* Last Login */}
                          <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                            {member.lastLoginAt ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(member.lastLoginAt).toLocaleString("vi-VN")}
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa đăng nhập</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setTargetAdminRole(member.adminRole);
                                  setTargetPermissions(
                                    Array.isArray(member.adminPermissions) && member.adminPermissions.length > 0
                                      ? [...member.adminPermissions]
                                      : [...(DEFAULT_ROLE_PERMISSIONS[member.adminRole as AdminRole] || rolePermsMap[member.adminRole] || [])]
                                  );
                                  setShowRoleModal(true);
                                }}
                                className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer"
                                title="Phân quyền & đổi cấp bậc"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {!isSuper && (
                                <>
                                  <button
                                    onClick={() => handleToggleStatus(member)}
                                    className={`p-2 border rounded-xl transition-colors cursor-pointer ${member.isActive
                                        ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                      }`}
                                    title={member.isActive ? "Vô hiệu hóa tài khoản" : "Mở khóa tài khoản"}
                                  >
                                    {member.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setMemberToDelete(member);
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                    title="Xóa tài khoản nhân sự"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permission Reference Guide Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Ma Trận Phân Quyền Bảo Mật TXEPRO</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Hệ thống đảm bảo tài xế và chủ hàng hoàn toàn độc lập với các vai trò quản trị nội bộ này. Mỗi cấp bậc quản trị viên chỉ được cấp quyền xem và tương tác trong phạm vi công việc chuyên trách.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {rolesList.map((roleItem) => {
                const cfg = (ADMIN_ROLE_CONFIG as any)[roleItem.key];
                const dotColor = roleItem.color || cfg?.color || "#64748b";
                const permPaths: string[] = rolePermsMap[roleItem.key] || (DEFAULT_ROLE_PERMISSIONS as any)[roleItem.key] || [];
                const moduleNames = permPaths.map((path) => {
                  const mod = ADMIN_PERMISSION_MODULES.find((m) => m.path === path);
                  return mod ? mod.name : PATH_SHORT_LABELS[path] || path;
                });
                return (
                  <div key={roleItem.key} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <p className="text-xs font-bold text-white truncate">{roleItem.label}</p>
                    </div>
                    {moduleNames.length > 0 ? (
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {moduleNames.map((name, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-primary-400 flex-shrink-0 mt-px" />
                            <span>{name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Chưa có quyền nào được cấp</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Phân Quyền Vai Trò */
        <div className="space-y-6">


          {/* Top Control Bar: Select Role Dropdown & Add Role Button */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                <span>Chọn vai trò cần cấu hình:</span>
              </div>
              <div className="relative w-full sm:w-80">
                <select
                  value={selectedRoleKey}
                  onChange={(e) => setSelectedRoleKey(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors cursor-pointer"
                >
                  {rolesList.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label} ({r.key}) — {team.filter((m) => m.adminRole === r.key).length} thành viên
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddRoleModal(true)}
                className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-primary-600/20 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Vai Trò Mới</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Role List Cards */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary-600" />
                  Danh Sách Vai Trò ({rolesList.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Nhấp chọn để sửa</span>
              </div>

              <div className="space-y-2.5">
                {rolesList.map((role) => {
                  const isSelected = selectedRoleKey === role.key;
                  const RoleIcon = ROLE_DEFAULT_ICONS[role.key] || Shield;
                  const memberCount = team.filter((m) => m.adminRole === role.key).length;
                  const rolePerms = rolePermsMap[role.key] || [];

                  return (
                    <div
                      key={role.key}
                      onClick={() => setSelectedRoleKey(role.key)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative group ${isSelected
                          ? "border-primary-500 bg-primary-50/50 shadow-sm ring-1 ring-primary-500"
                          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs"
                            style={{ backgroundColor: role.color || "#6366f1" }}
                          >
                            <RoleIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-xs font-bold truncate ${isSelected ? "text-primary-900" : "text-slate-800"}`}>
                                {role.label}
                              </p>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60 font-semibold">
                                {role.key}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {role.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                {memberCount} nhân sự
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                                {rolePerms.length}/9 module
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToEdit(role);
                              setEditRoleForm({
                                label: role.label,
                                description: role.description || "",
                                color: role.color || "#2563eb",
                              });
                              setShowEditRoleModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Chỉnh sửa thông tin vai trò"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToDelete(role);
                              setShowDeleteRoleModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa vai trò này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>


            </div>

            {/* Right Column: Role Permissions Editor for selectedRole */}
            <div className="lg:col-span-8 space-y-4">
              {(() => {
                const selectedRole = rolesList.find((r) => r.key === selectedRoleKey) || rolesList[0];
                if (!selectedRole) {
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
                      Chưa chọn vai trò nào. Vui lòng chọn một vai trò từ danh sách bên trái.
                    </div>
                  );
                }

                const activePerms = rolePermsMap[selectedRole.key] || [];
                const roleMembers = team.filter((m) => m.adminRole === selectedRole.key);
                const isSaving = savingRole === selectedRole.key;
                const RoleIcon = ROLE_DEFAULT_ICONS[selectedRole.key] || Shield;

                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                    {/* Selected Role Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: selectedRole.color || "#6366f1" }}
                        >
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{selectedRole.label}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                              {selectedRole.key}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-100">
                              {roleMembers.length} thành viên đang áp dụng
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                            {selectedRole.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRoleToEdit(selectedRole);
                            setEditRoleForm({
                              label: selectedRole.label,
                              description: selectedRole.description || "",
                              color: selectedRole.color || "#2563eb",
                            });
                            setShowEditRoleModal(true);
                          }}
                          className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa vai trò
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetRoleModulesToDefault(selectedRole.key)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Khôi phục về quyền mặc định"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Mặc định</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllRoleModules(selectedRole.key)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Cấp toàn bộ 9 module"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-primary-600" />
                          <span>Chọn tất cả</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearAllRoleModules(selectedRole.key)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Bỏ chọn toàn bộ"
                        >
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                          <span>Bỏ chọn</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveRolePermissions(selectedRole.key)}
                        className="btn-primary py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary-600/20 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Lưu & Áp Dụng Quyền</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Module Permissions Matrix */}
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          Phân hệ module được phép truy cập ({activePerms.length}/9 module)
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Nhấp thẻ để bật/tắt quyền
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ADMIN_PERMISSION_MODULES.map((mod) => {
                          const isChecked = activePerms.includes(mod.path);
                          const ModIcon = MODULE_ICONS[mod.id] || LayoutDashboard;

                          return (
                            <div
                              key={mod.id}
                              onClick={() => handleToggleRoleModule(selectedRole.key, mod.path)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${isChecked
                                  ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500 shadow-sm"
                                  : "border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-white"
                                }`}
                            >
                              <div className="pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer pointer-events-none"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isChecked
                                        ? "bg-primary-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                      }`}
                                  >
                                    <ModIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <span
                                    className={`text-xs font-bold truncate ${isChecked ? "text-slate-900" : "text-slate-700"
                                      }`}
                                  >
                                    {mod.name}
                                  </span>
                                </div>

                                <div className="mt-1">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 inline-block font-semibold">
                                    {mod.path}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                                  {mod.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Quản Trị Viên Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thêm Quản Trị Viên / Nhân Sự Mới</h3>
                  <p className="text-xs text-slate-400">Tạo tài khoản và tùy biến quyền xem phân hệ nội bộ</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="0987654321"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email nội bộ</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="nhansu@txepro.vn"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu đăng nhập *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {/* Step 1: Base Role */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Chọn Cấp Bậc / Vai Trò Cơ Sở *
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Chọn vai trò chính để thiết lập chức danh và mẫu quyền ban đầu
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    ...rolesList,
                    {
                      key: "super_admin",
                      label: "Super Admin (Chủ sở hữu)",
                      description: "Toàn quyền hệ thống",
                      color: "#9333ea",
                    },
                  ].map((roleItem) => {
                    const isSelected = createForm.adminRole === roleItem.key;
                    return (
                      <div
                        key={roleItem.key}
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            adminRole: roleItem.key,
                            adminPermissions:
                              roleItem.key === "super_admin"
                                ? ["*"]
                                : [...(DEFAULT_ROLE_PERMISSIONS[roleItem.key as AdminRole] || rolePermsMap[roleItem.key] || ["/admin"])],
                          })
                        }
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${isSelected
                            ? "border-primary-600 bg-primary-50/60 ring-2 ring-primary-200 shadow-sm"
                            : "border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{roleItem.label}</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: roleItem.color || "#6366f1" }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 font-mono">{roleItem.key}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Granular Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary-600" />
                      2. Tùy Chọn Quyền Xem & Phân Hệ Truy Cập (Tự do bật/tắt)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Đang cấp:{" "}
                      <strong className="text-primary-600 font-bold">
                        {createForm.adminPermissions.includes("*")
                          ? "Toàn quyền hệ thống (*)"
                          : `${createForm.adminPermissions.length} phân hệ`}
                      </strong>
                    </p>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          adminPermissions: [
                            ...(DEFAULT_ROLE_PERMISSIONS[createForm.adminRole as AdminRole] || rolePermsMap[createForm.adminRole] || ["/admin"]),
                          ],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-primary-600 hover:bg-primary-50 border border-primary-200 transition-colors cursor-pointer"
                    >
                      Theo vai trò
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          adminPermissions: ADMIN_PERMISSION_MODULES.map((m) => m.path),
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          adminPermissions: [],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADMIN_PERMISSION_MODULES.map((mod) => {
                    const isChecked =
                      createForm.adminPermissions.includes("*") ||
                      createForm.adminPermissions.includes(mod.path);
                    const Icon = MODULE_ICONS[mod.id] || Shield;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (createForm.adminPermissions.includes("*")) {
                            setCreateForm({
                              ...createForm,
                              adminPermissions: ADMIN_PERMISSION_MODULES.map((m) => m.path).filter(
                                (p) => p !== mod.path
                              ),
                            });
                            return;
                          }
                          if (isChecked) {
                            setCreateForm({
                              ...createForm,
                              adminPermissions: createForm.adminPermissions.filter((p) => p !== mod.path),
                            });
                          } else {
                            setCreateForm({
                              ...createForm,
                              adminPermissions: [...createForm.adminPermissions, mod.path],
                            });
                          }
                        }}
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${isChecked
                            ? "border-primary-500 bg-primary-50/40 shadow-xs ring-1 ring-primary-200"
                            : "border-slate-200 hover:bg-slate-50 opacity-60"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${isChecked ? "text-primary-600 font-bold" : "text-slate-400"
                                }`}
                            />
                            <p
                              className={`text-xs font-bold truncate ${isChecked ? "text-slate-900" : "text-slate-600"
                                }`}
                            >
                              {mod.name}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                            {mod.description}
                          </p>
                          <code className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono mt-1 inline-block">
                            {mod.path}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  {submitting ? "Đang tạo..." : "Xác Nhận Tạo Quản Trị Viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi Cấp Bậc & Tùy Biến Quyền Quản Trị */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Phân Quyền & Cấp Bậc Quản Trị
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tùy biến quyền xem và điều chỉnh vai trò cho nhân sự
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Member Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Nhân sự
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMember.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedMember.email || selectedMember.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Cấp bậc hiện tại
                  </span>
                  <p className="mt-0.5 font-bold text-primary-600">
                    {getRoleMeta(selectedMember.adminRole).label}
                  </p>
                </div>
              </div>

              {/* Section 1: Choose Base Role */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Cấp Bậc / Vai Trò Đại Diện
                </label>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Chọn chức danh quản trị cho nhân sự này
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    ...rolesList,
                    {
                      key: "super_admin",
                      label: "Super Admin (Chủ sở hữu)",
                      description: "Toàn quyền hệ thống",
                      color: "#9333ea",
                    },
                  ].map((roleItem) => {
                    const isSelected = targetAdminRole === roleItem.key;
                    return (
                      <div
                        key={roleItem.key}
                        onClick={() => {
                          setTargetAdminRole(roleItem.key);
                          if (roleItem.key === "super_admin") {
                            setTargetPermissions(["*"]);
                          } else {
                            setTargetPermissions([
                              ...(DEFAULT_ROLE_PERMISSIONS[roleItem.key as AdminRole] || rolePermsMap[roleItem.key] || ["/admin"]),
                            ]);
                          }
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                            ? "border-primary-600 bg-primary-50/50 ring-2 ring-primary-200 shadow-sm"
                            : "border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: roleItem.color || "#6366f1" }}
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{roleItem.label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{roleItem.key}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Granular Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary-600" />
                      2. Tùy Chọn Quyền Xem Phân Hệ (Tự do bật/tắt theo ý muốn)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Số phân hệ được cấp phép:{" "}
                      <strong className="text-primary-600 font-bold">
                        {targetPermissions.includes("*")
                          ? "Toàn quyền hệ thống (*)"
                          : `${targetPermissions.length} phân hệ`}
                      </strong>
                    </p>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setTargetPermissions([
                          ...(DEFAULT_ROLE_PERMISSIONS[targetAdminRole as AdminRole] || rolePermsMap[targetAdminRole] || ["/admin"]),
                        ])
                      }
                      className="px-2.5 py-1 rounded-lg text-primary-600 hover:bg-primary-50 border border-primary-200 transition-colors cursor-pointer"
                    >
                      Theo vai trò
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTargetPermissions(ADMIN_PERMISSION_MODULES.map((m) => m.path))
                      }
                      className="px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPermissions([])}
                      className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADMIN_PERMISSION_MODULES.map((mod) => {
                    const isChecked =
                      targetPermissions.includes("*") || targetPermissions.includes(mod.path);
                    const Icon = MODULE_ICONS[mod.id] || Shield;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (targetPermissions.includes("*")) {
                            setTargetPermissions(
                              ADMIN_PERMISSION_MODULES.map((m) => m.path).filter(
                                (p) => p !== mod.path
                              )
                            );
                            return;
                          }
                          if (isChecked) {
                            setTargetPermissions(targetPermissions.filter((p) => p !== mod.path));
                          } else {
                            setTargetPermissions([...targetPermissions, mod.path]);
                          }
                        }}
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${isChecked
                            ? "border-primary-500 bg-primary-50/40 shadow-xs ring-1 ring-primary-200"
                            : "border-slate-200 hover:bg-slate-50 opacity-60"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${isChecked ? "text-primary-600 font-bold" : "text-slate-400"
                                }`}
                            />
                            <p
                              className={`text-xs font-bold truncate ${isChecked ? "text-slate-900" : "text-slate-600"
                                }`}
                            >
                              {mod.name}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                            {mod.description}
                          </p>
                          <code className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono mt-1 inline-block">
                            {mod.path}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={submitting}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? "Đang lưu..." : "Lưu Quyền & Cấp Bậc"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác Nhận Xóa Nhân Sự</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản của nhân sự <strong className="text-slate-800">[{memberToDelete.name}]</strong> với vai trò <strong className="text-slate-800">[{getRoleMeta(memberToDelete.adminRole).label}]</strong>?
                </p>
              </div>

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  Hành động này sẽ vô hiệu hóa tài khoản và thu hồi toàn bộ quyền đăng nhập quản trị ngay lập tức. Các dữ liệu đơn hàng và lịch sử do nhân sự này từng xử lý vẫn được bảo toàn.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMemberToDelete(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? "Đang xóa..." : "Xác Nhận Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Vai Trò Mới */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thêm Vai Trò Mới</h3>
                  <p className="text-xs text-slate-400">Tạo cấp bậc quản trị mới cho hệ sinh thái TXEPRO</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã vai trò (Key) *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleForm.key}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, key: e.target.value })}
                  placeholder="Ví dụ: fleet_manager, marketing_lead"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Chỉ gồm chữ thường không dấu, số và dấu gạch dưới (_)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên hiển thị vai trò *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleForm.label}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, label: e.target.value })}
                  placeholder="Ví dụ: Quản Lý Đội Xe, Trưởng Nhóm Marketing"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả trách nhiệm vai trò
                </label>
                <textarea
                  rows={3}
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt nhiệm vụ và phạm vi hoạt động của vai trò này..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Màu nhận diện vai trò
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newRoleForm.color}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newRoleForm.color}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, color: e.target.value })}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                  />
                  <div className="flex items-center gap-1.5">
                    {["#0284c7", "#2563eb", "#0d9488", "#16a34a", "#7c3aed", "#e11d48", "#ea580c"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewRoleForm({ ...newRoleForm, color: c })}
                        className="w-6 h-6 rounded-full border border-white shadow-xs transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Đang tạo..." : "Tạo Vai Trò"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sửa Thông Tin Vai Trò */}
      {showEditRoleModal && roleToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chỉnh Sửa Vai Trò</h3>
                  <p className="text-xs text-slate-400">Cập nhật thông tin vai trò [{roleToEdit.key}]</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditRoleModal(false);
                  setRoleToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoleInfo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã vai trò (Key)
                </label>
                <input
                  type="text"
                  disabled
                  value={roleToEdit.key}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Mã vai trò cố định để bảo toàn quyền hạn hệ thống</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên hiển thị vai trò *
                </label>
                <input
                  type="text"
                  required
                  value={editRoleForm.label}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, label: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả vai trò
                </label>
                <textarea
                  rows={3}
                  value={editRoleForm.description}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Màu nhận diện vai trò
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editRoleForm.color}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={editRoleForm.color}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, color: e.target.value })}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                  />
                  <div className="flex items-center gap-1.5">
                    {["#0284c7", "#2563eb", "#0d9488", "#16a34a", "#7c3aed", "#e11d48", "#ea580c"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEditRoleForm({ ...editRoleForm, color: c })}
                        className="w-6 h-6 rounded-full border border-white shadow-xs transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoleModal(false);
                    setRoleToEdit(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? "Đang lưu..." : "Cập Nhật Vai Trò"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác Nhận Xóa Vai Trò */}
      {showDeleteRoleModal && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác Nhận Xóa Vai Trò</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa vai trò <strong className="text-slate-800">[{roleToDelete.label}]</strong> ({roleToDelete.key})?
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Các nhân sự hiện đang thuộc vai trò này sẽ tự động được chuyển sang vai trò <strong>Chăm Sóc Khách Hàng (cskh)</strong> để bảo đảm tài khoản không bị gián đoạn.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteRoleModal(false);
                    setRoleToDelete(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleDeleteRole}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? "Đang xóa..." : "Xác Nhận Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all ${toast.success
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
          }`}>
          {toast.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
