"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DollarSign,
  PieChart,
  AlertTriangle,
  Wrench,
  TrendingUp,
} from "lucide-react";

const reportTabs = [
  {
    name: "รายงานรายได้รายเดือน",
    href: "/reports/income",
    icon: DollarSign,
    desc: "สรุปบิล รายรับจริง และหมวดหมู่ออกใบแจ้งหนี้",
  },
  {
    name: "อัตราการเข้าพัก",
    href: "/reports/occupancy",
    icon: PieChart,
    desc: "สถิติห้องว่าง ห้องเต็ม และสัดส่วนแยกตามชั้น",
  },
  {
    name: "ยอดค้างชำระ",
    href: "/reports/overdue",
    icon: AlertTriangle,
    desc: "ติดตามบิลเกินกำหนดและจัดการเร่งรัดหนี้",
  },
  {
    name: "สรุปงานซ่อมบำรุง",
    href: "/reports/repairs",
    icon: Wrench,
    desc: "สถิติระยะเวลาเฉลี่ยและต้นทุนค่าซ่อม",
  },
];

export default function ReportTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-violet-950/60 pb-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {reportTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 font-semibold"
                  : "bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-violet-400"}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
