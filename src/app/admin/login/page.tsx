"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, ShieldCheck, Mail, ArrowRight, UserCheck, Check } from "lucide-react";
import { API_BASE, executeFetch } from "@/utils/api";

// Helper to retrieve or generate deviceId consistent with backend validator
const getDeviceId = () => {
  if (typeof window === "undefined") return "web-client";
  let id = localStorage.getItem("txpro_device_id");
  if (!id) {
    id = "web-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("txpro_device_id", id);
  }
  return id;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Restore remembered credentials preference on mount
  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem("txpro_remembered_admin_identifier");
      if (savedIdentifier) {
        setIdentifier(savedIdentifier);
      }
      const savedRemember = localStorage.getItem("txpro_admin_remember_me");
      if (savedRemember !== null) {
        setRememberMe(savedRemember === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    setError(null);

    // Strict client-side validation
    if (!identifier.trim()) {
      setError("Vui lòng nhập số điện thoại hoặc email đăng nhập");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    const isEmail = identifier.includes("@");
    if (isEmail) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(identifier.trim())) {
        setError("Định dạng email đăng nhập không hợp lệ");
        return;
      }
    } else {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(identifier.trim().replace(/\s+/g, ""))) {
        setError("Số điện thoại đăng nhập không hợp lệ");
        return;
      }
    }

    setLoading(true);

    // Align exactly with backend Joi schema validation
    const payload = {
      phoneOrEmail: identifier.trim(),
      password: password,
      deviceId: getDeviceId(),
      rememberMe: rememberMe,
    };

    try {
      const res = await executeFetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        const userProfile = data.data?.userProfile || data.data?.user || {};
        const userRole = userProfile.role || data.data?.role || "chu-hang";
        const userName = userProfile.fullName || userProfile.name || "Quản trị viên";

        // Verify if user is admin
        if (userRole !== "admin") {
          setError("Tài khoản này không có quyền truy cập khu vực Quản Trị!");
          return;
        }

        const userId = userProfile._id || userProfile.id || data.data?.id || "";
        const emailLower = (userProfile.email || "").toLowerCase();
        const phoneClean = userProfile.phone || "";
        const idClean = identifier.trim().toLowerCase();

        // Resolve adminRole accurately from backend response or local registry
        const cachedRole = (typeof window !== "undefined"
          ? (localStorage.getItem(`txpro_admin_role_${userId}`) ||
             (emailLower ? localStorage.getItem(`txpro_admin_role_${emailLower}`) : null) ||
             (phoneClean ? localStorage.getItem(`txpro_admin_role_${phoneClean}`) : null) ||
             (idClean ? localStorage.getItem(`txpro_admin_role_${idClean}`) : null))
          : null);

        let finalAdminRole = "cskh";
        if (userProfile.adminRole) {
          finalAdminRole = userProfile.adminRole;
        } else if (data.data?.adminRole) {
          finalAdminRole = data.data.adminRole;
        } else if (cachedRole) {
          finalAdminRole = cachedRole;
        } else if (emailLower === "admin@txepro.vn" || idClean === "admin@txepro.vn" || emailLower.includes("super")) {
          finalAdminRole = "super_admin";
        } else {
          finalAdminRole = "cskh";
        }

        // Store auth tokens & session
        localStorage.setItem("txpro_token", data.data?.accessToken || "");
        localStorage.setItem("txpro_refresh_token", data.data?.refreshToken || "");
        localStorage.setItem("txpro_user_session", JSON.stringify({
          id: userId,
          name: userName,
          role: "Admin",
          rawRole: "admin",
          adminRole: finalAdminRole,
          adminPermissions: userProfile.adminPermissions || data.data?.adminPermissions || [],
          avatar: userProfile.avatar || data.data?.avatar || data.data?.user?.avatar || null,
        }));

        // Handle remember me preference persistence
        if (rememberMe) {
          localStorage.setItem("txpro_admin_remember_me", "true");
          localStorage.setItem("txpro_remembered_admin_identifier", identifier.trim());
        } else {
          localStorage.setItem("txpro_admin_remember_me", "false");
          localStorage.removeItem("txpro_remembered_admin_identifier");
        }

        setSuccess(true);
        setTimeout(() => router.push("/admin"), 1200);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Tài khoản hoặc mật khẩu không chính xác");
      }
    } catch (err: any) {
      console.error("Admin login connection error:", err);
      setError("Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền hoặc khởi động Backend!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center py-16 px-4 relative overflow-hidden">
      {/* Admin ambient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "2.5s" }}></div>

      <div className="max-w-xl w-full mx-auto z-10">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-10 md:p-12 shadow-2xl border border-slate-700/50 relative">
          {/* Admin accent border gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-3xl"></div>

          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <UserCheck className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Khu Vực Quản Trị</h2>
            <p className="text-slate-400 text-xs mt-2">Cổng đăng nhập bảo mật dành cho Quản trị viên TXEPRO</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm">
              <p className="font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/20 shadow-xl shadow-purple-500/5 animate-bounce">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">Đăng Nhập Thành Công</h3>
              <p className="text-slate-400 text-xs">Đang chuyển hướng tới trang tổng quan admin...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input SĐT/Email */}
              <div className="relative group">
                <input
                  type="text"
                  id="identifier"
                  placeholder=" "
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-700 bg-slate-800/40 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-white text-sm font-semibold transition-all shadow-inner"
                  required
                />
                <label
                  htmlFor="identifier"
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-purple-400"
                >
                  Tài khoản Admin (SĐT hoặc Email)
                </label>
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 peer-focus:text-purple-400 transition-colors duration-200" />
              </div>

              {/* Input Mật Khẩu */}
              <div className="relative group">
                <input
                  type="password"
                  id="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-700 bg-slate-800/40 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-white text-sm font-semibold transition-all shadow-inner"
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-purple-400"
                >
                  Mật khẩu
                </label>
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 peer-focus:text-purple-400 transition-colors duration-200" />
              </div>

              {/* Checkbox Ghi nhớ đăng nhập (Remember Me) */}
              <div className="flex items-center justify-between py-1 px-1">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center gap-3 cursor-pointer group select-none"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-lg border border-slate-600 bg-slate-800/80 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-indigo-600 peer-checked:border-purple-500 transition-all flex items-center justify-center shadow-inner group-hover:border-purple-400">
                      <Check
                        className={`w-3.5 h-3.5 text-white transition-all duration-200 ${
                          rememberMe ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                        strokeWidth={3}
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                      Ghi nhớ đăng nhập
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Duy trì phiên làm việc lâu dài, không bị đăng xuất giữa chừng
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-purple-950/20 transition-all hover:scale-[1.01] hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Đang xác minh..." : (
                  <>
                    Đăng Nhập Hệ Thống <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-slate-750 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-semibold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
