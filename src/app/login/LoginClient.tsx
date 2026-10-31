"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  ShieldCheck,
  Lock,
  Phone,
  DoorOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Home,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { loginTenant, loginStaff } from "@/actions/auth";

export type DemoTenant = {
  id: number;
  name: string;
  roomNo: string;
  phone: string;
};

export default function LoginClient({
  demoTenants,
}: {
  demoTenants: DemoTenant[];
}) {
  const [activeTab, setActiveTab] = useState<"tenant" | "staff">("tenant");
  const [isPending, startTransition] = useTransition();

  // Tenant form state
  const [roomNo, setRoomNo] = useState("");
  const [phone, setPhone] = useState("");

  // Staff form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Tenant Login submit
  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("roomNo", roomNo);
      fd.append("phone", phone);

      const res = await loginTenant({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  // Handle Quick Tenant Login
  const handleQuickTenantLogin = (t: DemoTenant) => {
    setErrorMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("tenantId", t.id.toString());
      fd.append("roomNo", t.roomNo);
      fd.append("phone", t.phone);

      const res = await loginTenant({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
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

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  // Handle Quick Admin Login
  const handleQuickAdminLogin = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("isDemoAdmin", "true");

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  // Handle Quick Staff Login
  const handleQuickStaffLogin = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("isDemoStaff", "true");

      const res = await loginStaff({}, fd);
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0c0a18] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-violet-600 selection:text-white">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-900/40 border border-violet-400/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">หอพักสุขสบาย เพลส</h1>
          <p className="text-xs text-slate-400">
            ระบบบริหารจัดการหอพักและพอร์ทัลผู้เช่าออนไลน์ (SRD v1.0)
          </p>
        </div>

        {/* Tab Switcher: Tenant vs Staff */}
        <div className="p-1 rounded-2xl bg-[#120f24] border border-violet-900/30 flex">
          <button
            onClick={() => {
              setActiveTab("tenant");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "tenant"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>สำหรับผู้เช่า (Tenant)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("staff");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "staff"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ผู้ดูแล & เจ้าหน้าที่ (Admin)</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#120f24] border border-violet-900/30 shadow-2xl space-y-6">
          {/* TAB 1: TENANT LOGIN */}
          {activeTab === "tenant" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-violet-400" /> เข้าสู่ระบบพอร์ทัลผู้เช่า
                </h2>
                <p className="text-xs text-slate-400">
                  ตรวจสอบบิลค่าเช่า ค่าน้ำ-ไฟ และติดตามงานแจ้งซ่อมบำรุง
                </p>
              </div>

              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    หมายเลขห้องพัก (Room No.)
                  </label>
                  <div className="relative">
                    <DoorOpen className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      placeholder="เช่น 101, 201"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-semibold placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    เบอร์โทรศัพท์ที่ลงทะเบียนในสัญญาเช่า
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 0812345678"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ระบบจะตรวจสอบความถูกต้องกับสัญญาเช่าปัจจุบัน
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <span>เข้าสู่พอร์ทัลผู้เช่า</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Logins for Testing */}
              {demoTenants.length > 0 && (
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>คลิกเพื่อทดสอบในฐานะผู้เช่าจริง (Demo Quick Login):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {demoTenants.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleQuickTenantLogin(t)}
                        disabled={isPending}
                        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">ห้อง {t.roomNo}</div>
                          <div className="text-[10px] text-slate-400 truncate">{t.name}</div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-violet-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF LOGIN */}
          {activeTab === "staff" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-violet-400" /> เข้าสู่ระบบผู้ดูแลหอพัก
                </h2>
                <p className="text-xs text-slate-400">
                  สำหรับเจ้าหน้าที่นิติบุคคล ผู้ดูแลระบบ และช่างซ่อมบำรุง
                </p>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    อีเมลเจ้าหน้าที่ (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@webhotel.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    รหัสผ่าน (Password)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <span>เข้าสู่ระบบหลังบ้าน</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Admin & Staff Demo Buttons */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>คลิกเพื่อทดสอบตามระดับสิทธิ์ (Demo Quick Login):</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/40 text-violet-300 border border-violet-800/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>เข้าสู่ระบบด่วนในฐานะ Admin (ผู้ดูแลสูงสุด)</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickStaffLogin}
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เข้าสู่ระบบด่วนในฐานะ Staff (เจ้าหน้าที่ทั่วไป)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-500">
          ระบบบริหารจัดการหอพักครบวงจร • Dormitory Management System
        </div>
      </div>
    </div>
  );
}
