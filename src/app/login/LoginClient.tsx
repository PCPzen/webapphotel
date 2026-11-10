"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  User,
  ShieldCheck,
  Phone,
  DoorOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { loginTenant, loginStaff } from "@/actions/auth";
import { handleEmojiInput } from "@/lib/emoji";
import { ThemeToggle, useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ToastProvider";
import CinematicCityBackground from "@/components/CinematicCityBackground";

export type DemoTenant = {
  id: number;
  name: string;
  roomNo: string;
  phone: string;
  idCardLast4?: string;
};

export default function LoginClient({
  demoTenants,
}: {
  demoTenants: DemoTenant[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"tenant" | "staff">("tenant");
  const [isPending, startTransition] = useTransition();

  // Tenant form state
  const [roomNo, setRoomNo] = useState("");
  const [phone, setPhone] = useState("");
  const [idCardLast4, setIdCardLast4] = useState("");

  // Staff form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();

  // Handle Tenant Login submit
  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("roomNo", roomNo);
      fd.append("phone", phone);
      fd.append("idCardLast4", idCardLast4);

      const res = await loginTenant({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    });
  };

  // Handle Quick Tenant Login
  const handleQuickTenantLogin = (t: DemoTenant) => {
    setErrorMessage(null);
    setRoomNo(t.roomNo);
    setPhone(t.phone);
    if (t.idCardLast4) {
      setIdCardLast4(t.idCardLast4);
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("tenantId", t.id.toString());
      fd.append("roomNo", t.roomNo);
      fd.append("phone", t.phone);
      if (t.idCardLast4) {
        fd.append("idCardLast4", t.idCardLast4);
      }

      const res = await loginTenant({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    });
  };

  // Handle Quick Admin Login
  const handleQuickAdminLogin = () => {
    setErrorMessage(null);
    setEmail("admin@webhotel.com");
    setPassword("admin1234");

    startTransition(async () => {
      const fd = new FormData();
      fd.append("isDemoAdmin", "true");
      fd.append("email", "admin@webhotel.com");
      fd.append("password", "admin1234");

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    });
  };

  // Handle Quick Staff Login
  const handleQuickStaffLogin = () => {
    setErrorMessage(null);
    setEmail("staff@webhotel.com");
    setPassword("staff1234");

    startTransition(async () => {
      const fd = new FormData();
      fd.append("isDemoStaff", "true");
      fd.append("email", "staff@webhotel.com");
      fd.append("password", "staff1234");

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    });
  };

  // Handle Staff Login submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    });
  };

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-clip transition-colors duration-500 ${
        isDark
          ? "bg-[#04070d] text-slate-100 selection:bg-amber-400 selection:text-slate-950"
          : "bg-sky-50 text-slate-900 selection:bg-amber-500 selection:text-white"
      }`}
    >
      {/* 1. Cinematic 2D City & Traffic Animation Background (Theme-Aware) */}
      <CinematicCityBackground />

      {/* 2. Top Bar Utilities */}
      <header className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <ThemeToggle />
      </header>

      {/* 3. Main Login Monolith (Anti-Slop: Clean, Frosted Glass, High Contrast) */}
      <main className="relative z-10 w-full max-w-[420px] my-auto space-y-5">
        {/* Brand & Identity */}
        <div className="text-center space-y-2">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-colors duration-300 ${
              isDark
                ? "bg-slate-900/90 text-amber-300 ring-1 ring-amber-400/30 shadow-black/40"
                : "bg-white text-amber-600 ring-1 ring-amber-400/40 shadow-slate-300/50"
            }`}
          >
            <Building2 className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              หอพักสุขสบาย เพลส
            </h1>
            <p
              className={`text-xs mt-0.5 transition-colors duration-300 ${
                isDark ? "text-slate-400" : "text-slate-600 font-medium"
              }`}
            >
              ระบบบริหารจัดการหอพักและพอร์ทัลผู้เช่า
            </p>
          </div>
        </div>

        {/* Unified Glass Card */}
        <div
          className={`backdrop-blur-2xl rounded-3xl p-6 sm:p-7 space-y-5 transition-all duration-300 ${
            isDark
              ? "bg-slate-950/80 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/5"
              : "bg-white/85 border border-white/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
          }`}
        >
          {/* Segmented Control (Tabs) */}
          <div
            role="tablist"
            aria-label="ประเภทผู้ใช้งาน"
            className={`grid grid-cols-2 p-1 rounded-xl text-xs font-medium border transition-colors duration-300 ${
              isDark
                ? "bg-slate-900/80 border-slate-800/80"
                : "bg-slate-100/90 border-slate-200/90"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "tenant"}
              onClick={() => {
                setActiveTab("tenant");
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeTab === "tenant"
                  ? isDark
                    ? "bg-slate-800 text-white font-semibold shadow-sm"
                    : "bg-white text-slate-900 font-semibold shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ผู้เช่าห้องพัก</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "staff"}
              onClick={() => {
                setActiveTab("staff");
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeTab === "staff"
                  ? isDark
                    ? "bg-slate-800 text-white font-semibold shadow-sm"
                    : "bg-white text-slate-900 font-semibold shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>เจ้าหน้าที่ / นิติ</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: TENANT FORM */}
          {activeTab === "tenant" ? (
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              {/* Room No */}
              <div className="space-y-1.5">
                <label
                  htmlFor="roomNoInput"
                  className={`block text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700 font-semibold"
                  }`}
                >
                  หมายเลขห้องพัก
                </label>
                <div className="relative">
                  <DoorOpen className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <input
                    id="roomNoInput"
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    onInput={handleEmojiInput}
                    placeholder="เช่น 403, 101"
                    required
                    autoComplete="off"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                      isDark
                        ? "bg-slate-900/90 border border-slate-700/70 text-white"
                        : "bg-white border border-slate-300 text-slate-900 shadow-xs"
                    }`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phoneInput"
                  className={`block text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700 font-semibold"
                  }`}
                >
                  เบอร์โทรศัพท์ที่ลงทะเบียน
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <input
                    id="phoneInput"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onInput={handleEmojiInput}
                    placeholder="เช่น 0812345678"
                    required
                    autoComplete="tel"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                      isDark
                        ? "bg-slate-900/90 border border-slate-700/70 text-white"
                        : "bg-white border border-slate-300 text-slate-900 shadow-xs"
                    }`}
                  />
                </div>
              </div>

              {/* Citizen ID Last 4 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="idCardLast4Input"
                  className={`block text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700 font-semibold"
                  }`}
                >
                  เลขท้าย 4 หลักของบัตรประชาชน
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <input
                    id="idCardLast4Input"
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    value={idCardLast4}
                    onChange={(e) =>
                      setIdCardLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                    }
                    placeholder="•••• (4 หลัก)"
                    required
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono tracking-widest placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                      isDark
                        ? "bg-slate-900/90 border border-slate-700/70 text-white"
                        : "bg-white border border-slate-300 text-slate-900 shadow-xs"
                    }`}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 mt-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 shadow-md shadow-amber-500/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่พอร์ทัลผู้เช่า</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: STAFF FORM */
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="staffEmailInput"
                  className={`block text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700 font-semibold"
                  }`}
                >
                  อีเมลเจ้าหน้าที่
                </label>
                <input
                  id="staffEmailInput"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={handleEmojiInput}
                  placeholder="admin@webhotel.com"
                  required
                  autoComplete="email"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                    isDark
                      ? "bg-slate-900/90 border border-slate-700/70 text-white"
                      : "bg-white border border-slate-300 text-slate-900 shadow-xs"
                  }`}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="staffPasswordInput"
                  className={`block text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700 font-semibold"
                  }`}
                >
                  รหัสผ่าน
                </label>
                <input
                  id="staffPasswordInput"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                    isDark
                      ? "bg-slate-900/90 border border-slate-700/70 text-white"
                      : "bg-white border border-slate-300 text-slate-900 shadow-xs"
                  }`}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 mt-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 shadow-md shadow-amber-500/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบหลังบ้าน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Section (Anti-Slop: Minimalist, Tactile Pills) */}
          <div
            className={`pt-4 border-t space-y-2.5 ${
              isDark ? "border-slate-800/80" : "border-slate-200/90"
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>คลิกเพื่อทดสอบระบบ (Quick Demo)</span>
              </span>
              <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                Auto-fill
              </span>
            </div>

            {activeTab === "tenant" ? (
              /* Tenant Demo Pills */
              <div className="flex flex-wrap gap-2">
                {demoTenants.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickTenantLogin(t)}
                    className={`px-3 py-1.5 rounded-lg border text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 flex items-center gap-2 ${
                      isDark
                        ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isDark ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      ห้อง {t.roomNo}
                    </span>
                    <span
                      className={`text-[11px] truncate max-w-[100px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Staff & Admin Demo Pills */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleQuickAdminLogin}
                  className={`px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                    isDark
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold">Admin Demo</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleQuickStaffLogin}
                  className={`px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                    isDark
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">Staff Demo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quiet Footer */}
        <footer
          className={`text-center text-[11px] transition-colors duration-300 ${
            isDark ? "text-slate-500" : "text-slate-600 font-medium"
          }`}
        >
          หอพักสุขสบาย เพลส ระบบพอร์ทัลออนไลน์
        </footer>
      </main>
    </div>
  );
}
