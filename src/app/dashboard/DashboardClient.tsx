"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Gauge,
  Receipt,
  CreditCard,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PieChart,
  DoorOpen,
  Calendar,
  Zap,
  Droplet,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Phone,
} from "lucide-react";
import { formatThaiDate } from "@/lib/invoices";

export type DashboardRoomItem = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
  status: "vacant" | "occupied" | "maintenance";
  tenantName?: string | null;
  tenantPhone?: string | null;
  hasOverdueBill?: boolean;
};

export type DashboardData = {
  currentMonthThai: string;
  metrics: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
    totalBilledCurrentMonth: number;
    totalCollectedCurrentMonth: number;
    totalOutstandingCurrentMonth: number;
    collectionRate: number;
    totalOverdueDebt: number;
    overdueInvoicesCount: number;
    pendingRepairsCount: number;
    urgentRepairsCount: number;
    unrecordedMetersCount: number;
    expiringContractsCount: number;
  };
  recentActivities: {
    recentPayments: {
      id: number;
      receiptNo: string;
      roomNo: string;
      tenantName: string;
      amount: number;
      method: string;
      paidAt: string;
    }[];
    urgentRepairs: {
      id: number;
      roomNo: string;
      title: string;
      category: string;
      reportedAt: string;
      status: string;
    }[];
    topOverdueInvoices: {
      id: number;
      invoiceNo: string;
      roomNo: string;
      tenantName: string;
      tenantPhone: string;
      daysOverdue: number;
      balance: number;
    }[];
  };
  rooms: DashboardRoomItem[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const uniqueFloors = Array.from(new Set(data.rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const filteredRooms = data.rooms.filter((r) => {
    if (selectedFloor !== "all" && r.floor !== selectedFloor) return false;
    if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Month */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b1236] via-[#120f24] to-[#0c0a18] p-6 sm:p-8 border border-violet-900/40 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5" /> แดชบอร์ดบริหารภาพรวม • หอพักสุขสบาย
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ศูนย์ควบคุมและรายงานสรุปผู้บริหาร
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              ข้อมูลรอบเดือน <strong className="text-white">{data.currentMonthThai}</strong> • สรุปรายได้ อัตราการเข้าพัก และการติดตามหนี้สิน
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/roadmap"
              className="px-3.5 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> ดูแผนผังระบบ (9 สเต็ป)
            </Link>
            <Link
              href="/meters"
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> จดมิเตอร์
            </Link>
            <Link
              href="/invoices/generate"
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-violet-400" /> ออกบิลเดือนนี้
            </Link>
            <Link
              href="/payments"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> รับชำระเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards: Revenue & Collection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Billed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ยอดเรียกเก็บเดือนนี้</span>
            <Receipt className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ฿{data.metrics.totalBilledCurrentMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>รอบ {data.currentMonthThai}</span>
            <Link href="/reports/income" className="text-violet-400 hover:underline">
              ดูแจกแจง
            </Link>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121f24] to-[#0f191e] border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>ยอดรับชำระแล้ว (กระแสเงินสด)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-tight">
            ฿{data.metrics.totalCollectedCurrentMonth.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center justify-between">
            <span>อัตราจัดเก็บ: {data.metrics.collectionRate.toFixed(1)}%</span>
            <Link href="/payments" className="text-emerald-300 hover:underline">
              ดูใบเสร็จ
            </Link>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e1336] to-[#140b24] border border-violet-800/30 shadow-md">
          <div className="flex items-center justify-between text-violet-300 text-xs mb-2">
            <span>อัตราการเข้าพัก</span>
            <PieChart className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {data.metrics.occupancyRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
            <span>{data.metrics.occupiedRooms} / {data.metrics.totalRooms} ห้อง (ว่าง {data.metrics.vacantRooms})</span>
            <Link href="/reports/occupancy" className="text-violet-300 hover:underline">
              ดูสถิติชั้น
            </Link>
          </div>
        </div>

        {/* Total Overdue Debt */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#291118] to-[#18090f] border border-rose-900/40 shadow-md">
          <div className="flex items-center justify-between text-rose-300 text-xs mb-2">
            <span>ยอดหนี้ค้างชำระสะสม</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-300 tracking-tight">
            ฿{data.metrics.totalOverdueDebt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 flex items-center justify-between">
            <span>เกินกำหนด {data.metrics.overdueInvoicesCount} บิล</span>
            <Link href="/reports/overdue" className="text-rose-300 hover:underline">
              ติดตามหนี้
            </Link>
          </div>
        </div>
      </div>

      {/* Action Center / Alert Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Unrecorded meters alert */}
        <Link
          href="/meters"
          className="p-3.5 rounded-xl bg-[#120f24] hover:bg-[#16122d] border border-violet-900/30 hover:border-violet-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-400">ยังไม่จดมิเตอร์เดือนนี้</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{data.metrics.unrecordedMetersCount} ห้อง</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
        </Link>

        {/* Urgent/Pending Repairs */}
        <Link
          href="/repairs"
          className="p-3.5 rounded-xl bg-[#120f24] hover:bg-[#16122d] border border-violet-900/30 hover:border-violet-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-400">งานแจ้งซ่อมรอดำเนินการ</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>{data.metrics.pendingRepairsCount} งาน {data.metrics.urgentRepairsCount > 0 && `(ด่วน ${data.metrics.urgentRepairsCount})`}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
        </Link>

        {/* Expiring contracts */}
        <Link
          href="/contracts"
          className="p-3.5 rounded-xl bg-[#120f24] hover:bg-[#16122d] border border-violet-900/30 hover:border-violet-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-400">สัญญาหมดอายุใน 30 วัน</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>{data.metrics.expiringContractsCount} สัญญา</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
        </Link>

        {/* Full Reports Hub */}
        <Link
          href="/reports/income"
          className="p-3.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 hover:border-violet-500/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] text-violet-300 font-medium">ดูรายงานสรุปทั้งหมด</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>4 หมวดรายงาน</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Visual Room Grid: ผังสถานะห้องพักแบบ Real-time */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              ผังสถานะห้องพักเรียลไทม์ (Interactive Room Grid)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงสถานะทุกห้องพัก คลิกที่ห้องเพื่อดูรายละเอียดสัญญาหรือออกบิล
            </p>
          </div>

          {/* Filters & Legend */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 text-[11px] mr-2">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> มีผู้เช่า ({data.metrics.occupiedRooms})
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ว่าง ({data.metrics.vacantRooms})
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> ปรับปรุง ({data.metrics.maintenanceRooms})
              </span>
            </div>

            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="all">ทุกชั้น ({uniqueFloors.length} ชั้น)</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl}>
                  ชั้น {fl}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="occupied">มีผู้เช่า (Occupied)</option>
              <option value="vacant">ห้องว่าง (Vacant)</option>
              <option value="maintenance">ปรับปรุง (Maintenance)</option>
            </select>
          </div>
        </div>

        {/* Room Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-2">
          {filteredRooms.map((r) => {
            let bgClass = "bg-violet-950/30 border-violet-800/40 text-violet-200 hover:border-violet-500";
            let statusLabel = "มีผู้เช่า";
            let dotColor = "bg-violet-400";

            if (r.status === "vacant") {
              bgClass = "bg-emerald-950/20 border-emerald-800/30 text-emerald-200 hover:border-emerald-400";
              statusLabel = "ว่าง";
              dotColor = "bg-emerald-400";
            } else if (r.status === "maintenance") {
              bgClass = "bg-rose-950/20 border-rose-800/30 text-rose-200 hover:border-rose-400";
              statusLabel = "ปรับปรุง";
              dotColor = "bg-rose-400";
            }

            return (
              <Link
                key={r.id}
                href={`/rooms/${r.id}`}
                className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between hover:scale-[1.02] shadow-sm ${bgClass}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-sm text-white">{r.roomNo}</span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <div className="text-slate-400 truncate">
                    {r.tenantName || <span className="italic">{statusLabel}</span>}
                  </div>
                  <div className="font-mono text-slate-300 text-[10px]">
                    ฿{r.baseRent.toLocaleString("th-TH")}
                  </div>
                </div>

                {r.hasOverdueBill && (
                  <div className="mt-1.5 pt-1 border-t border-white/5 flex items-center gap-1 text-[9px] text-rose-400 font-semibold">
                    <AlertCircle className="w-2.5 h-2.5" /> ค้างชำระ
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-xs">
            ไม่พบห้องพักตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>

      {/* 2-Columns: Recent Cashflow & Critical Overdue Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Valid Payments */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              รายการรับชำระเงินล่าสุด (Recent Payments)
            </h2>
            <Link href="/payments" className="text-xs text-violet-400 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="space-y-2.5">
            {data.recentActivities.recentPayments.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">ห้อง {p.roomNo}</span>
                    <span className="text-slate-400">({p.tenantName})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {p.receiptNo} • {formatThaiDate(p.paidAt)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-400 font-mono">
                    +฿{p.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {p.method === "bank_transfer" ? "โอนเงิน / QR" : "เงินสด"}
                  </div>
                </div>
              </div>
            ))}

            {data.recentActivities.recentPayments.length === 0 && (
              <div className="py-6 text-center text-slate-500 text-xs">
                ยังไม่มีรายการรับชำระเงินในรอบนี้
              </div>
            )}
          </div>
        </div>

        {/* Critical Overdue Watchlist */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-rose-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              ห้องที่มียอดค้างชำระเกินกำหนด (Overdue Watchlist)
            </h2>
            <Link href="/reports/overdue" className="text-xs text-rose-400 hover:underline">
              รายงานหนี้เต็ม
            </Link>
          </div>

          <div className="space-y-2.5">
            {data.recentActivities.topOverdueInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-xl bg-rose-950/10 border border-rose-500/20 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">ห้อง {inv.roomNo}</span>
                    <span className="text-slate-300">{inv.tenantName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300">
                      เกิน {inv.daysOverdue} วัน
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <a href={`tel:${inv.tenantPhone}`} className="hover:text-white font-mono">
                      {inv.tenantPhone}
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-rose-400 font-mono">
                    ฿{inv.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                  <Link
                    href={`/payments?invoiceId=${inv.id}`}
                    className="text-[10px] text-violet-400 hover:underline font-medium"
                  >
                    รับชำระเงิน &gt;
                  </Link>
                </div>
              </div>
            ))}

            {data.recentActivities.topOverdueInvoices.length === 0 && (
              <div className="py-6 text-center text-slate-500 text-xs">
                🎉 ยอดเยี่ยม! ไม่พบรายการค้างชำระเกินกำหนด
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
