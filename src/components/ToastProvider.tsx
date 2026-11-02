"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success", title?: string) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = {
      id,
      message,
      type,
      title: title || (type === "success" ? "ดำเนินการสำเร็จ" : type === "error" ? "เกิดข้อผิดพลาด" : type === "warning" ? "คำเตือน" : "แจ้งเตือน"),
      duration: 4500,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  // Check cookie & URL for flash notifications
  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Read flash cookie: webhotel_toast
    const cookieMatch = document.cookie.match(/webhotel_toast=([^;]+)/);
    if (cookieMatch) {
      try {
        const decoded = decodeURIComponent(cookieMatch[1]);
        const data = JSON.parse(decoded);
        if (data?.message) {
          showToast(data.message, data.type || "success", data.title);
        }
      } catch {
        // Plain text fallback
        const plainMsg = decodeURIComponent(cookieMatch[1]);
        if (plainMsg) showToast(plainMsg, "success");
      }
      // Expire cookie
      document.cookie = "webhotel_toast=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // 2. Read query parameters if present
    if (searchParams) {
      const successParam = searchParams.get("success") || searchParams.get("toast");
      const errorParam = searchParams.get("error");
      const infoParam = searchParams.get("info");

      if (successParam) {
        showToast(successParam, "success");
      } else if (errorParam) {
        showToast(errorParam, "error");
      } else if (infoParam) {
        showToast(infoParam, "info");
      }

      // Clean query params from URL without refreshing
      if (successParam || errorParam || infoParam) {
        const url = new URL(window.location.href);
        url.searchParams.delete("success");
        url.searchParams.delete("toast");
        url.searchParams.delete("error");
        url.searchParams.delete("info");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [pathname, searchParams, showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Alert Popups Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border transition-all duration-300 animate-in slide-in-from-top-4 sm:slide-in-from-right-4 backdrop-blur-md flex items-start gap-3.5 relative overflow-hidden ${
                isSuccess
                  ? "bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/50"
                  : isError
                  ? "bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/50"
                  : isWarning
                  ? "bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-950/50"
                  : "bg-blue-950/90 text-blue-100 border-blue-500/40 shadow-blue-950/50"
              }`}
            >
              {/* Icon */}
              <div
                className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  isSuccess
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isError
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : isWarning
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <AlertCircle className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-xs font-bold tracking-wide uppercase opacity-90 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs leading-relaxed font-medium break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Bottom Progress Bar Animation */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 origin-left animate-[shrink_4.5s_linear_forwards] ${
                  isSuccess
                    ? "bg-emerald-400"
                    : isError
                    ? "bg-rose-400"
                    : isWarning
                    ? "bg-amber-400"
                    : "bg-blue-400"
                }`}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
