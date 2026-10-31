"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Receipt,
  Wrench,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { logoutAction, switchToAdminAction } from "@/actions/auth";

export type TenantOption = {
  id: number;
  name: string;
  roomNo: string;
};

export default function TenantLayout({
  children,
  currentTenant,
  allTenants,
}: {
  children: React.ReactNode;
  currentTenant: {
    id: number;
    name: string;
    roomNo: string;
    floor: number;
  } | null;
  allTenants: TenantOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "หน้าแรกพอร์ทัล", href: "/me", icon: Home },
    { name: "ใบแจ้งหนี้ของฉัน", href: "/me/invoices", icon: Receipt },
    { name: "แจ้งซ่อมบำรุง", href: "/me/repairs", icon: Wrench },
  ];

  const handleSwitchTenant = (tenantId: number) => {
    // Preserve current subpage when switching tenant
    const base = pathname.split("?")[0];
    router.push(`${base}?tenantId=${tenantId}`);
  };

  return (
    <div className="min-h-screen bg-[#0c0a18] text-slate-100 flex flex-col antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#120f24]/90 backdrop-blur-md border-b border-violet-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Dorm Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-600/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-violet-400 font-semibold tracking-wide uppercase">
                Tenant Portal
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                หอพักสุขสบาย
                {currentTenant && (
                  <span className="text-xs text-slate-400 font-normal">
                    (ห้อง {currentTenant.roomNo})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/me"
                  ? pathname === "/me"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const hrefWithTenant = currentTenant
                ? `${item.href}?tenantId=${currentTenant.id}`
                : item.href;

              return (
                <Link
                  key={item.href}
                  href={hrefWithTenant}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Tenant Switcher & Admin Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Switcher */}
            {allTenants.length > 0 && currentTenant && (
              <div className="relative group">
                <select
                  value={currentTenant.id}
                  onChange={(e) => handleSwitchTenant(parseInt(e.target.value, 10))}
                  className="appearance-none bg-black/40 hover:bg-black/60 text-slate-200 text-xs py-1.5 pl-3 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                  title="สลับบัญชีผู้เช่า (Demo Mode)"
                >
                  {allTenants.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#16122d]">
                      ห้อง {t.roomNo} - {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Back to Admin Dashboard */}
            <form action={switchToAdminAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
                title="สลับไปยังหน้าควบคุมผู้ดูแลหอพัก"
              >
                <Building className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">แดชบอร์ดหลัก</span>
              </button>
            </form>

            {/* Logout Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-medium transition-all"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1 bg-[#120f24]">
            {navItems.map((item) => {
              const isActive =
                item.href === "/me"
                  ? pathname === "/me"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const hrefWithTenant = currentTenant
                ? `${item.href}?tenantId=${currentTenant.id}`
                : item.href;

              return (
                <Link
                  key={item.href}
                  href={hrefWithTenant}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        ระบบพอร์ทัลผู้เช่า • Dormitory Management System (SRD v1.0)
      </footer>
    </div>
  );
}
