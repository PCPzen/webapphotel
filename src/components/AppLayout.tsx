"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Gauge,
  Receipt,
  CreditCard,
  Wrench,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Home,
  Sparkles,
  LogOut,
  Crown,
  UserCheck,
  Lock,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
};

const NAV_ITEMS: { category: string; items: NavItem[] }[] = [
  {
    category: "หลัก",
    items: [
      { name: "แดชบอร์ดภาพรวม", href: "/dashboard", icon: LayoutDashboard },
      { name: "แผนผังระบบ (9 สเต็ป)", href: "/dashboard/roadmap", icon: Sparkles },
      { name: "ผังและจัดการห้องพัก", href: "/rooms", icon: Building2 },
    ],
  },
  {
    category: "ธุรกรรมผู้เช่า",
    items: [
      { name: "ทะเบียนผู้เช่า", href: "/tenants", icon: Users },
      { name: "สัญญาเช่าห้องพัก", href: "/contracts", icon: FileText },
      { name: "บันทึกมิเตอร์น้ำ-ไฟ", href: "/meters", icon: Gauge },
    ],
  },
  {
    category: "การเงินและบริการ",
    items: [
      { name: "ใบแจ้งหนี้รายเดือน", href: "/invoices", icon: Receipt },
      { name: "การรับชำระเงิน", href: "/payments", icon: CreditCard },
      { name: "แจ้งซ่อมบำรุง", href: "/repairs", icon: Wrench },
      { name: "รายงานการเงินและสถิติ", href: "/reports/income", icon: BarChart3 },
    ],
  },
  {
    category: "ระบบและบริการผู้เช่า",
    items: [
      { name: "จัดการผู้ใช้และสิทธิ์", href: "/admin/users", icon: ShieldCheck, adminOnly: true },
      { name: "พอร์ทัลผู้เช่า (Tenant)", href: "/me", icon: Home },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role & User identity state
  const [role, setRole] = useState<"admin" | "staff">("admin");
  const [userName, setUserName] = useState<string>("ผู้ดูแลระบบสูงสุด");
  const [userEmail, setUserEmail] = useState<string>("admin@webhotel.com");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const matchRole = document.cookie.match(/webhotel_user_role=([^;]+)/);
      if (matchRole && (matchRole[1] === "admin" || matchRole[1] === "staff")) {
        setRole(matchRole[1] as "admin" | "staff");
      }
      const matchName = document.cookie.match(/webhotel_user_name=([^;]+)/);
      if (matchName) {
        setUserName(decodeURIComponent(matchName[1]));
      }
      const matchEmail = document.cookie.match(/webhotel_user_email=([^;]+)/);
      if (matchEmail) {
        setUserEmail(decodeURIComponent(matchEmail[1]));
      }
    }
  }, []);

  const currentNavItem = NAV_ITEMS.flatMap((s) => s.items).find(
    (i) => i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href))
  );

  return (
    <div className="min-h-screen bg-[#0c0a17] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-violet-600 selection:text-white">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#110e20] border-b border-violet-950/70 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md shadow-violet-900/40">
            ห
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">หอพักสุขสบาย</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  role === "admin"
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {role === "admin" ? "ยศ: ADMIN 🛡️" : "ยศ: STAFF 🧑‍💼"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-violet-950/50 text-violet-300 hover:bg-violet-900/50"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-[#0f0c1e] border-r border-violet-950/60 flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-5 border-b border-violet-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-violet-900/40 ring-1 ring-violet-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                หอพักสุขสบาย
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  เพลส
                </span>
              </h2>
              <p className="text-[11px] text-violet-300/60">Dormitory Management</p>
            </div>
          </div>
        </div>

        {/* User Identity & Role Card ("ยศ") in Sidebar */}
        <div className="mx-3 my-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md flex-shrink-0 ${
              role === "admin"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {role === "admin" ? (
              <Crown className="w-4 h-4 text-violet-400" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  role === "admin"
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {role === "admin" ? "ยศ: ADMIN" : "ยศ: STAFF"}
              </span>
            </div>
            <div className="text-xs font-semibold text-white truncate mt-0.5">
              {userName || (role === "admin" ? "ผู้ดูแลระบบสูงสุด" : "เจ้าหน้าที่นิติบุคคล")}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {userEmail}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-violet-900/40">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-violet-400/50 uppercase tracking-wider">
                {section.category}
              </p>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                // Hide adminOnly pages from staff or display disabled
                if (item.adminOnly && role === "staff") {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed opacity-60"
                      title="เข้าถึงได้เฉพาะยศ Admin เท่านั้น"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                        🔒 Admin
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40 ring-1 ring-violet-400/40"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-violet-950/40"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-violet-400/70"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / System Info & Quick Switch */}
        <div className="p-4 border-t border-violet-950/50 bg-[#0c0a18]/60 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/dashboard/roadmap"
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/40 border border-violet-800/20 text-[11px] font-medium text-violet-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>แผนผังระบบ</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/20 text-[11px] font-medium text-rose-300 transition-colors"
                title="ออกจากระบบหรือสลับบัญชี"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-zinc-500">
            <span>
              สิทธิ์: {role === "admin" ? "🛡️ Admin" : "🧑‍💼 Staff"}
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              เชื่อมต่อแล้ว
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Desktop Top Navbar */}
      <main className="flex-1 min-w-0 bg-[#0c0a17] overflow-y-auto flex flex-col">
        {/* Desktop Top Navbar ("Navbar บอกยศ") */}
        <header className="hidden md:flex sticky top-0 z-30 bg-[#0f0c1e]/90 backdrop-blur-md border-b border-violet-950/60 px-6 py-3 items-center justify-between shadow-sm">
          {/* Left: Breadcrumbs / Page Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">หอพักสุขสบาย</span>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">
              {currentNavItem?.name || "ระบบบริหารจัดการ"}
            </span>
          </div>

          {/* Right: Role & Rank Badge (ยศ Admin / Staff) */}
          <div className="flex items-center gap-3">
            {/* Rank Badge */}
            {role === "admin" ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-950/80 to-purple-950/60 border border-violet-500/40 shadow-sm shadow-violet-900/30">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-xs">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-violet-300">
                      ยศ: ผู้ดูแลระบบสูงสุด
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-violet-500/30 text-[9px] font-extrabold text-violet-100 border border-violet-400/40">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                    {userName || userEmail || "System Admin"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border border-emerald-500/40 shadow-sm shadow-emerald-900/30">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-300">
                      ยศ: เจ้าหน้าที่นิติบุคคล
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-[9px] font-extrabold text-emerald-100 border border-emerald-400/40">
                      STAFF
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                    {userName || userEmail || "Staff Member"}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/5 text-xs font-medium transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
