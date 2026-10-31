"use client";

import { useState } from "react";
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
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const NAV_ITEMS = [
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
      { name: "จัดการผู้ใช้และสิทธิ์", href: "/admin/users", icon: ShieldCheck },
      { name: "พอร์ทัลผู้เช่า (Tenant)", href: "/me", icon: Home },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0a17] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-violet-600 selection:text-white">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#110e20] border-b border-violet-950/70 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md shadow-violet-900/40">
            ห
          </div>
          <span className="font-bold text-sm tracking-wide text-white">หอพักสุขสบาย</span>
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

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-violet-900/40">
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

        {/* Footer / System Info */}
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
            <span>สถานะ: Admin / Staff</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase เชื่อมต่อแล้ว
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#0c0a17] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
