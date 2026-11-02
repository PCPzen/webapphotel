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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/ThemeProvider";

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

function safeDecodeCookie(val: string): string {
  try {
    let res = decodeURIComponent(val);
    while (res.includes("%")) {
      try {
        const next = decodeURIComponent(res);
        if (next === res) break;
        res = next;
      } catch {
        break;
      }
    }
    return res;
  } catch {
    return val;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Role & User identity state
  const [role, setRole] = useState<"admin" | "staff">("admin");
  const [userName, setUserName] = useState<string>("ผู้ดูแลระบบสูงสุด");
  const [userEmail, setUserEmail] = useState<string>("admin@webhotel.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Restore collapsed state
      const savedCollapsed = localStorage.getItem("webhotel_sidebar_collapsed");
      if (savedCollapsed === "true") {
        setIsCollapsed(true);
      }

      // Restore user identity from cookie
      const matchRole = document.cookie.match(/webhotel_user_role=([^;]+)/);
      if (matchRole && (matchRole[1] === "admin" || matchRole[1] === "staff")) {
        setRole(matchRole[1] as "admin" | "staff");
      }
      const matchName = document.cookie.match(/webhotel_user_name=([^;]+)/);
      if (matchName) {
        setUserName(safeDecodeCookie(matchName[1]));
      }
      const matchEmail = document.cookie.match(/webhotel_user_email=([^;]+)/);
      if (matchEmail) {
        setUserEmail(safeDecodeCookie(matchEmail[1]));
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("webhotel_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  const currentNavItem = NAV_ITEMS.flatMap((s) => s.items).find(
    (i) => i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c15] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0b1120] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/40">
            ห
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">หอพักสุขสบาย</span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  role === "admin"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                    : "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30"
                }`}
              >
                {role === "admin" ? "ADMIN" : "STAFF"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Swap Button */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
            aria-label="เมนูหลัก"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h2 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  หอพักสุขสบาย
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                    เพลส
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Dormitory Management</p>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle button inside header */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? "ขยายแถบเมนู (Expand)" : "ย่อแถบเมนู (Collapse)"}
            aria-label="ย่อ/ขยายเมนู"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Identity & Role Card ("ยศ") in Sidebar */}
        {!isCollapsed ? (
          <div className="mx-3 my-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md flex-shrink-0 ${
                role === "admin"
                  ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30"
                  : "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-600/20 dark:text-sky-300 dark:border-sky-500/30"
              }`}
            >
              {role === "admin" ? (
                <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    role === "admin"
                      ? "bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30"
                      : "bg-sky-600 text-white dark:bg-sky-500/20 dark:text-sky-300 dark:border dark:border-sky-500/30"
                  }`}
                >
                  {role === "admin" ? "ยศ: ADMIN" : "ยศ: STAFF"}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                {userName || (role === "admin" ? "ผู้ดูแลระบบสูงสุด" : "เจ้าหน้าที่นิติบุคคล")}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {userEmail}
              </div>
            </div>
          </div>
        ) : (
          <div className="my-2.5 flex justify-center">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                role === "admin"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "bg-sky-600/20 text-sky-300 border border-sky-500/30"
              }`}
              title={`${role === "admin" ? "ยศ: ADMIN" : "ยศ: STAFF"} - ${userName}`}
            >
              {role === "admin" ? (
                <Crown className="w-4 h-4 text-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-sky-400" />
              )}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {section.category}
                </p>
              )}
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
                      className={`flex items-center rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 ${
                        isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                      }`}
                      title="เข้าถึงได้เฉพาะยศ Admin เท่านั้น"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center rounded-xl text-xs font-semibold transition-all group ${
                      isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-500"
                        : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 ${
                        isActive ? "text-white" : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / System Info & Quick Switch */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#090d16]/70 space-y-2">
          {!isCollapsed ? (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/dashboard/roadmap"
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>แผนผังระบบ</span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800/30 text-[11px] font-medium text-rose-700 dark:text-rose-300 transition-colors"
                    title="ออกจากระบบหรือสลับบัญชี"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>ออกจากระบบ</span>
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span>
                  สิทธิ์: {role === "admin" ? "Admin" : "Staff"}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เชื่อมต่อแล้ว
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <Link
                href="/dashboard/roadmap"
                className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
                title="แผนผังระบบ (9 สเต็ป)"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area with Desktop Top Navbar */}
      <main className="flex-1 min-w-0 bg-slate-50 dark:bg-[#080c15] overflow-y-auto flex flex-col transition-colors duration-200">
        {/* Desktop Top Navbar ("Navbar บอกยศ & ควบคุมแถบเมนู") */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/95 dark:bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 py-3 items-center justify-between shadow-xs dark:shadow-sm transition-colors duration-200">
          {/* Left: Sidebar Toggle Button + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:border-slate-700/60 dark:text-slate-300 dark:hover:text-white transition-all flex items-center justify-center"
              title={isCollapsed ? "ขยายแถบเมนู (Expand Sidebar)" : "ย่อแถบเมนู (Collapse Sidebar)"}
              aria-label="ย่อ/ขยายเมนูด้านข้าง"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">หอพักสุขสบาย</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {currentNavItem?.name || "ระบบบริหารจัดการ"}
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle & Role Badge & Logout */}
          <div className="flex items-center gap-3">
            {/* Theme Swap Button (สลับธีม สว่าง/มืด) */}
            <ThemeToggle />

            {/* Rank Badge */}
            {role === "admin" ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-gradient-to-r dark:from-blue-950/60 dark:to-slate-900 border border-blue-200 dark:border-blue-500/40 shadow-xs dark:shadow-sm dark:shadow-blue-950/40">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                      ยศ: ผู้ดูแลระบบสูงสุด
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white dark:bg-blue-500/30 text-[9px] font-extrabold dark:text-blue-100 border border-blue-600 dark:border-blue-400/40">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                    {userName || userEmail || "System Admin"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-sky-50/80 dark:bg-gradient-to-r dark:from-sky-950/60 dark:to-slate-900 border border-sky-200 dark:border-sky-500/40 shadow-xs dark:shadow-sm dark:shadow-sky-950/40">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-sky-900 dark:text-sky-300">
                      ยศ: เจ้าหน้าที่นิติบุคคล
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-600 text-white dark:bg-sky-500/30 text-[9px] font-extrabold dark:text-sky-100 border border-sky-600 dark:border-sky-400/40">
                      STAFF
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none mt-0.5 truncate max-w-[150px]">
                    {userName || userEmail || "Staff Member"}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-rose-500/20 dark:text-slate-300 dark:hover:text-rose-300 dark:border-slate-700/60 text-xs font-medium transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
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
