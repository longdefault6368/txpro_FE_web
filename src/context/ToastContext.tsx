"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: ReactNode;
  duration?: number; // ms, default 4200. Set 0 for sticky
  action?: ToastAction;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  duration: number;
  createdAt: number;
  isExiting?: boolean;
}

interface ToastMethod {
  (options: ToastOptions | string, type?: ToastType): string;
  success: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) => string;
  error: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) => string;
  warning: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) => string;
  info: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) => string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions | string, type?: ToastType) => string;
  toast: ToastMethod;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global event bus for non-React code (API helpers, interceptors, callbacks)
const TOAST_EVENT_NAME = "txpro_global_toast";

export const globalToast = {
  show: (options: ToastOptions | string, type: ToastType = "info"): void => {
    if (typeof window === "undefined") return;
    const detail = typeof options === "string" ? { message: options, type } : { ...options, type: options.type || type };
    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
  },
  success: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">): void => {
    globalToast.show({ ...options, message, type: "success" });
  },
  error: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">): void => {
    globalToast.show({ ...options, message, type: "error" });
  },
  warning: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">): void => {
    globalToast.show({ ...options, message, type: "warning" });
  },
  info: (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">): void => {
    globalToast.show({ ...options, message, type: "info" });
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Start exit animation, then remove after 220ms
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, isExiting: true })));
    setTimeout(() => {
      setToasts([]);
    }, 220);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string, explicitType?: ToastType): string => {
      const isString = typeof options === "string";
      const type: ToastType = explicitType || (isString ? "info" : options.type || "info");
      const message: ReactNode = isString ? options : options.message;
      const title: string | undefined = !isString ? options.title : undefined;
      const duration = !isString && options.duration !== undefined ? options.duration : 4200;
      const action = !isString ? options.action : undefined;
      const id =
        (!isString && options.id) ||
        `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        action,
        createdAt: Date.now(),
        isExiting: false,
      };

      setToasts((prev) => {
        // Limit queue to 5 toasts maximum to avoid cluttering UI
        const filtered = prev.filter((t) => t.id !== id);
        if (filtered.length >= 5) {
          filtered[0].isExiting = true;
        }
        return [...filtered, newToast];
      });

      return id;
    },
    []
  );

  // Bind toast shorthand methods
  const toastMethod = useCallback(
    (options: ToastOptions | string, type?: ToastType) => showToast(options, type),
    [showToast]
  ) as ToastMethod;

  toastMethod.success = useCallback(
    (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) =>
      showToast({ ...options, message, type: "success" }),
    [showToast]
  );
  toastMethod.error = useCallback(
    (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) =>
      showToast({ ...options, message, type: "error" }),
    [showToast]
  );
  toastMethod.warning = useCallback(
    (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) =>
      showToast({ ...options, message, type: "warning" }),
    [showToast]
  );
  toastMethod.info = useCallback(
    (message: ReactNode, options?: Omit<ToastOptions, "message" | "type">) =>
      showToast({ ...options, message, type: "info" }),
    [showToast]
  );

  // Listen for global toast events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastOptions>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleGlobalToast);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleGlobalToast);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        toast: toastMethod,
        dismissToast,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

/* -------------------------------------------------------------------------- */
/*                               TOAST CONTAINER                              */
/* -------------------------------------------------------------------------- */

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[99999] pointer-events-none flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 TOAST CARD                                 */
/* -------------------------------------------------------------------------- */

const TOAST_THEMES = {
  success: {
    icon: CheckCircle2,
    badgeBg: "bg-emerald-50 border border-emerald-100",
    iconColor: "text-emerald-600",
    progressBg: "bg-emerald-500",
    borderAccent: "border-l-4 border-l-emerald-500",
    defaultTitle: "Thành công",
  },
  error: {
    icon: AlertCircle,
    badgeBg: "bg-rose-50 border border-rose-100",
    iconColor: "text-rose-600",
    progressBg: "bg-rose-500",
    borderAccent: "border-l-4 border-l-rose-500",
    defaultTitle: "Đã xảy ra lỗi",
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: "bg-amber-50 border border-amber-100",
    iconColor: "text-amber-600",
    progressBg: "bg-amber-500",
    borderAccent: "border-l-4 border-l-amber-500",
    defaultTitle: "Cảnh báo",
  },
  info: {
    icon: Info,
    badgeBg: "bg-blue-50 border border-blue-100",
    iconColor: "text-blue-600",
    progressBg: "bg-primary-600",
    borderAccent: "border-l-4 border-l-primary-600",
    defaultTitle: "Thông tin",
  },
};

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingTimeRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());

  const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.info;
  const Icon = theme.icon;

  // Countdown & Progress logic
  useEffect(() => {
    if (toast.duration <= 0) return; // Sticky toast

    if (isPaused) {
      return;
    }

    startTimeRef.current = Date.now();
    const interval = 30; // update progress every 30ms

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (currentRemaining / toast.duration) * 100;
      setProgress(pct);

      if (currentRemaining <= 0) {
        clearInterval(progressInterval);
        onDismiss(toast.id);
      }
    }, interval);

    return () => {
      clearInterval(progressInterval);
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
    };
  }, [isPaused, toast.duration, toast.id, onDismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-100/90 shadow-2xl rounded-2xl overflow-hidden p-3.5 sm:p-4 flex gap-3 relative transition-all duration-200 ease-out transform ${
        theme.borderAccent
      } ${
        toast.isExiting
          ? "opacity-0 translate-x-8 scale-95"
          : "opacity-100 translate-x-0 scale-100"
      }`}
    >
      {/* Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.badgeBg}`}
      >
        <Icon className={`w-5 h-5 ${theme.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
            {toast.title || theme.defaultTitle}
          </h4>
        </div>
        <div className="text-xs font-medium text-slate-600 mt-1 leading-relaxed break-words">
          {toast.message}
        </div>

        {/* Action button if provided */}
        {toast.action && (
          <div className="mt-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => onDismiss(toast.id)}
        className="w-7 h-7 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Animated Progress Bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/80 overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${theme.progressBg}`}
            style={{
              width: `${progress}%`,
              transitionDuration: isPaused ? "0ms" : "30ms",
            }}
          />
        </div>
      )}
    </div>
  );
};
