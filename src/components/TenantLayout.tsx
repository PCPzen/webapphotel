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
import { ThemeToggle } from "@/components/ThemeProvider";

export type TenantOption = {
  id: number;
  name: string;
  roomNo: string;
};

export default function TenantLayout({
  children,
  currentTenant,
  allTenants,
  isAdminPreview = false,
}: {
  children: React.ReactNode;
  currentTenant: {
    id: number;
    name: string;
    roomNo: string;
    floor: number;
  } | null;
  allTenants: TenantOption[];
  isAdminPreview?: boolean;
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
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Dorm Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-sky-400 font-semibold tracking-wide uppercase">
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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Theme Swap & Tenant Info / Admin Switcher & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {isAdminPreview ? (
              <>
                {/* Admin Preview Switcher */}
                {allTenants.length > 0 && currentTenant && (
                  <div className="relative group">
                    <select
                      value={currentTenant.id}
                      onChange={(e) => handleSwitchTenant(parseInt(e.target.value, 10))}
                      className="appearance-none bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs py-1.5 pl-3 pr-8 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                      title="มุมมองแอดมิน: สลับดูพอร์ทัลของผู้เช่าห้องอื่น"
                    >
                      {allTenants.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          ห้อง {t.roomNo} - {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                )}

                {/* Back to Admin Dashboard (visible only to Admin/Staff) */}
                <form action={switchToAdminAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
                    title="กลับไปยังหน้าควบคุมผู้ดูแลหอพัก"
                  >
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">แดชบอร์ดหลัก</span>
                  </button>
                </form>
              </>
            ) : (
              currentTenant && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    ห้อง <strong>{currentTenant.roomNo}</strong> • {currentTenant.name}
                  </span>
                </div>
              )
            )}

            {/* Logout Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 text-xs font-medium transition-all"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0b1120] px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
