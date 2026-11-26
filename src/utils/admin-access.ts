import {
  ADMIN_ROLE_CONFIG,
  DEFAULT_ROLE_PERMISSIONS,
  type AdminRole,
} from "@/config/admin-roles";

export interface AdminRoleDisplay {
  label: string;
  shortLabel: string;
  badgeClass: string;
  color: string;
  allowedPaths: string[];
}

const CUSTOM_STAFF_DISPLAY: AdminRoleDisplay = {
  label: "Nhân sự nội bộ",
  shortLabel: "Nhân sự",
  badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  color: "#475569",
  allowedPaths: [],
};

export function isKnownAdminRole(role?: string | null): role is AdminRole {
  return Boolean(role && Object.prototype.hasOwnProperty.call(ADMIN_ROLE_CONFIG, role));
}

export function resolveAdminRoleDisplay(rawRole?: string | null): AdminRoleDisplay {
  if (isKnownAdminRole(rawRole)) {
    return ADMIN_ROLE_CONFIG[rawRole];
  }
  return CUSTOM_STAFF_DISPLAY;
}

export function normalizeAdminPermissions(perms: unknown): string[] {
  if (!Array.isArray(perms)) return [];
  return perms
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export function resolveEffectiveAdminPermissions(params: {
  adminRole?: string | null;
  sessionPermissions?: unknown;
  cachedUserPermissions?: unknown;
  cachedRolePermissions?: Record<string, unknown> | null;
}): string[] {
  const role = (params.adminRole || "").trim();
  if (role === "super_admin") return ["*"];

  const fromSession = normalizeAdminPermissions(params.sessionPermissions);
  if (fromSession.length > 0) return fromSession;

  const fromUserCache = normalizeAdminPermissions(params.cachedUserPermissions);
  if (fromUserCache.length > 0) return fromUserCache;

  if (role && params.cachedRolePermissions) {
    const fromRoleCache = normalizeAdminPermissions(params.cachedRolePermissions[role]);
    if (fromRoleCache.length > 0) return fromRoleCache;
  }

  if (isKnownAdminRole(role)) {
    return DEFAULT_ROLE_PERMISSIONS[role] || ADMIN_ROLE_CONFIG[role].allowedPaths;
  }

  // Never fall back to super_admin wildcard for unknown or custom roles.
  return [];
}

export function resolveAdminHomeRoute(
  adminRole?: string | null,
  permissions?: unknown
): string {
  const role = (adminRole || "").trim();
  const list = normalizeAdminPermissions(permissions);

  if (role === "super_admin" || list.includes("*")) {
    return "/admin";
  }
  if (list.includes("/admin")) {
    return "/admin";
  }
  const firstAdminPath = list.find((path) => path.startsWith("/admin"));
  if (firstAdminPath) {
    return firstAdminPath;
  }
  if (isKnownAdminRole(role)) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role] || [];
    if (defaults.includes("*") || defaults.includes("/admin")) return "/admin";
    const firstDefault = defaults.find((path) => path.startsWith("/admin"));
    if (firstDefault) return firstDefault;
  }
  return "/admin/profile";
}

export interface AdminNotificationLike {
  id?: string;
  type?: string;
  link?: string;
  read?: boolean;
  chatId?: string;
  senderId?: string;
  meta?: {
    chatId?: string;
    senderId?: string;
    ticketId?: string;
    link?: string;
    [key: string]: unknown;
  };
}

export function normalizeAdminPath(path?: string | null): string {
  if (!path || typeof path !== "string") return "";
  const withoutQuery = path.trim().split("?")[0].split("#")[0];
  if (!withoutQuery) return "";
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

export function hasFullAdminAccess(
  adminRole?: string | null,
  permissions?: unknown
): boolean {
  if ((adminRole || "").trim() === "super_admin") return true;
  return normalizeAdminPermissions(permissions).includes("*");
}

export function canAccessAdminPath(
  path: string,
  adminRole?: string | null,
  permissions?: unknown
): boolean {
  const pathname = normalizeAdminPath(path);
  if (!pathname) return false;
  if (pathname === "/admin/profile") return true;
  if (hasFullAdminAccess(adminRole, permissions)) return true;

  const list = normalizeAdminPermissions(permissions);
  return list.some((raw) => {
    const allowed = normalizeAdminPath(raw);
    if (!allowed) return false;
    if (allowed === "*") return true;
    // "/admin" grants only the overview dashboard, never sibling "/admin/*" modules.
    if (allowed === "/admin") return pathname === "/admin";
    return pathname === allowed || pathname.startsWith(`${allowed}/`);
  });
}

export function resolveAdminNotificationLink(notif: AdminNotificationLike): string {
  const type = (notif.type || "").trim().toLowerCase();
  let targetLink = typeof notif.link === "string" ? notif.link.trim() : "";

  if (!targetLink && typeof notif.meta?.link === "string") {
    targetLink = notif.meta.link.trim();
  }

  if (!targetLink || targetLink === "/admin/support") {
    if (type === "chat" || notif.meta?.chatId || notif.chatId) {
      const chatId = notif.meta?.chatId || notif.chatId;
      const senderId = notif.meta?.senderId || notif.senderId;
      return chatId
        ? `/admin/support?tab=chats&chatId=${chatId}${senderId ? `&userId=${senderId}` : ""}`
        : senderId
        ? `/admin/support?tab=chats&userId=${senderId}`
        : "/admin/support?tab=chats";
    }
    if (type === "support_ticket" || notif.meta?.ticketId) {
      return notif.meta?.ticketId
        ? `/admin/support?tab=tickets&ticketId=${notif.meta.ticketId}`
        : "/admin/support?tab=tickets";
    }
  }

  if (targetLink) return targetLink;

  if (type === "user_registered" || type === "kyc_pending") return "/admin/users";
  if (type === "order_cancelled" || type.startsWith("order_")) return "/admin/orders";
  if (type.includes("incident") || type.includes("dispute")) return "/admin/incidents";
  if (type.includes("contact")) return "/admin/contacts";
  if (type.includes("career") || type.includes("application")) return "/admin/tuyen-dung";
  if (type.includes("affiliate")) return "/admin/affiliates";
  if (type.includes("attendance") || type.includes("salary") || type.includes("leave")) {
    return "/admin/attendance";
  }

  return "";
}

export function resolveAdminNotificationRequiredPath(
  notif: AdminNotificationLike
): string | null {
  const type = (notif.type || "").trim().toLowerCase();
  if (type === "user_registered" || type === "kyc_pending") return "/admin/users";
  if (type === "order_cancelled" || type.startsWith("order_")) return "/admin/orders";
  if (
    type === "support_ticket" ||
    type === "chat" ||
    Boolean(notif.meta?.chatId || notif.chatId || notif.meta?.ticketId)
  ) {
    return "/admin/support";
  }
  if (type.includes("incident") || type.includes("dispute")) return "/admin/incidents";
  if (type.includes("contact")) return "/admin/contacts";
  if (type.includes("career") || type.includes("application")) return "/admin/tuyen-dung";
  if (type.includes("affiliate")) return "/admin/affiliates";
  if (type.includes("attendance") || type.includes("salary") || type.includes("leave")) {
    return "/admin/attendance";
  }

  const linkPath = normalizeAdminPath(
    notif.link || (typeof notif.meta?.link === "string" ? notif.meta.link : "")
  );
  if (
    linkPath &&
    linkPath.startsWith("/admin") &&
    linkPath !== "/admin/notifications" &&
    linkPath !== "/admin/profile"
  ) {
    return linkPath;
  }

  return null;
}

export function canViewAdminNotification(
  notif: AdminNotificationLike,
  adminRole?: string | null,
  permissions?: unknown
): boolean {
  if (!canAccessAdminPath("/admin/notifications", adminRole, permissions)) {
    return false;
  }
  const requiredPath = resolveAdminNotificationRequiredPath(notif);
  if (!requiredPath) return true;
  return canAccessAdminPath(requiredPath, adminRole, permissions);
}

export function filterAdminNotifications<T extends AdminNotificationLike>(
  notifications: T[],
  adminRole?: string | null,
  permissions?: unknown
): T[] {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];
  if (!canAccessAdminPath("/admin/notifications", adminRole, permissions)) return [];
  return notifications.filter((item) => canViewAdminNotification(item, adminRole, permissions));
}

export function readCurrentAdminAccessFromStorage(): {
  adminRole: string;
  permissions: string[];
} {
  if (typeof window === "undefined") {
    return { adminRole: "", permissions: [] };
  }
  try {
    const saved = localStorage.getItem("txpro_user_session");
    const session = saved ? JSON.parse(saved) : null;
    let adminRole =
      typeof session?.adminRole === "string" && session.adminRole.trim()
        ? session.adminRole.trim()
        : "";
    if (!adminRole) {
      const cachedRole =
        (session?.id ? localStorage.getItem(`txpro_admin_role_${session.id}`) : null) ||
        (session?.email
          ? localStorage.getItem(`txpro_admin_role_${String(session.email).toLowerCase()}`)
          : null);
      if (cachedRole && cachedRole.trim()) adminRole = cachedRole.trim();
    }

    let cachedUserPermissions: unknown = undefined;
    let cachedRolePermissions: Record<string, unknown> | null = null;
    try {
      const cached = session?.id ? localStorage.getItem(`txpro_admin_perms_${session.id}`) : null;
      if (cached) cachedUserPermissions = JSON.parse(cached);
    } catch {}
    try {
      const rolePermsCache = localStorage.getItem("txpro_role_permissions");
      if (rolePermsCache) cachedRolePermissions = JSON.parse(rolePermsCache);
    } catch {}

    const permissions = resolveEffectiveAdminPermissions({
      adminRole,
      sessionPermissions: session?.adminPermissions,
      cachedUserPermissions,
      cachedRolePermissions,
    });
    return { adminRole, permissions };
  } catch {
    return { adminRole: "", permissions: [] };
  }
}

export function resolvePostLoginDestination(params: {
  userRole: string;
  affiliate: boolean;
  next?: string | null;
  adminRole?: string | null;
  adminPermissions?: unknown;
}): { blockedError?: string; targetRoute?: string } {
  if (params.userRole === "admin") {
    if (params.affiliate) {
      return {
        blockedError:
          "Tài khoản nhân sự / quản trị nội bộ không sử dụng cổng Đối tác Affiliate. Vui lòng dùng tài khoản Tài xế hoặc Chủ hàng (hoặc đăng nhập quản trị tại /admin/login).",
      };
    }
    return {
      targetRoute: resolveAdminHomeRoute(params.adminRole, params.adminPermissions),
    };
  }
  if (params.userRole === "doi-tac") {
    return {
      targetRoute: "/doi-tac",
    };
  }
  return {
    targetRoute: params.affiliate ? "/doi-tac" : params.next || "/user",
  };
}
