"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Zap,
  Droplets,
  Wind,
  Home,
  User,
  Printer,
  Calendar,
  ExternalLink,
  Building2,
} from "lucide-react";
import ReportTabs from "@/components/ReportTabs";
import { formatThaiDate } from "@/lib/invoices";
import { calculateDurationText, formatRepairCategory } from "@/lib/repairs";

export type RepairSummaryItem = {
  id: number;
  roomId: number;
  roomNo: string;
  floor: number;
  title: string;
  category: "electric" | "plumbing" | "aircon" | "furniture" | "other";
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "done" | "cancelled";
  reportedAt: string;
  completedAt?: string | null;
  assignedTo?: string | null;
  cost: number;
  resolutionNote?: string | null;
};

export type CategoryStat = {
  category: string;
  label: string;
  icon: string;
  count: number;
  cost: number;
  percent: number;
};

export type TechnicianStat = {
  name: string;
  jobCount: number;
  totalCost: number;
};

export type RepairsReportData = {
  totalCount: number;
  doneCount: number;
  inProgressCount: number;
  openCount: number;
  cancelledCount: number;
  totalCost: number;
  avgResolutionHours: number;
  categoryStats: CategoryStat[];
  technicianStats: TechnicianStat[];
  recentRepairs: RepairSummaryItem[];
};

export default function RepairsReportClient({ data }: { data: RepairsReportData }) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredRepairs = data.recentRepairs.filter((r) => {
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    return true;
  });

  const completionRate = data.totalCount > 0 ? (data.doneCount / data.totalCount) * 100 : 0;

  // Format avg resolution hours into days/hours
  const avgDays = Math.floor(data.avgResolutionHours / 24);
  const avgRemainHours = Math.round(data.avgResolutionHours % 24);
  const avgDurationStr =
    avgDays > 0 ? `${avgDays} วัน ${avgRemainHours} ชม.` : `${avgRemainHours} ชั่วโมง`;

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <ReportTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            รายงานสรุปงานซ่อมบำรุงและต้นทุน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สถิติต้นทุนค่าบำรุงรักษา ประสิทธิภาพการแก้ไขปัญหา และสถิติงานซ่อมแยกหมวดหมู่
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium self-start sm:self-auto transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-violet-400" />
          <span>พิมพ์รายงานซ่อมบำรุง</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cost */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1e1424] to-[#120b17] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ต้นทุนค่าซ่อมแซมรวม</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-tight">
            ฿{data.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            เฉลี่ย ฿
            {(data.doneCount > 0 ? data.totalCost / data.doneCount : 0).toLocaleString("th-TH", {
              maximumFractionDigits: 0,
            })}{" "}
            / งาน
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121f24] to-[#0f191e] border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>อัตราปิดงานสำเร็จ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {completionRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            ปิดงานแล้ว {data.doneCount} จาก {data.totalCount} งาน
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ระยะเวลาซ่อมเฉลี่ย</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-violet-300 tracking-tight">
            {avgDurationStr}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            นับจากแจ้งจนถึงตรวจรับงาน
          </div>
        </div>

        {/* Active Workload */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#241c12] to-[#1a140d] border border-amber-900/30 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>งานที่กำลังค้างอยู่</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-300 tracking-tight">
            {data.inProgressCount + data.openCount}{" "}
            <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            รอดำเนินการ {data.openCount} | ช่างกำลังทำ {data.inProgressCount}
          </div>
        </div>
      </div>

      {/* 2-Columns: Category Breakdown & Technician Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-violet-400" /> สัดส่วนงานซ่อมและค่าใช้จ่ายแยกตามหมวดหมู่
          </h2>

          <div className="space-y-3 pt-1">
            {data.categoryStats.map((c) => (
              <div key={c.category} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{c.icon}</span>
                    <span className="font-semibold text-white">{c.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-white font-semibold">
                      ฿{c.cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({c.count} งาน, {c.percent.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${c.percent}%` }}
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Workload */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" /> ผลงานช่าง / ผู้รับเหมา
          </h2>

          <div className="space-y-3 pt-1">
            {data.technicianStats.map((t) => (
              <div key={t.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="font-bold text-violet-300 font-mono">{t.jobCount} งาน</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>มูลค่างานซ่อมที่ดูแล:</span>
                  <span className="font-mono text-slate-200">
                    ฿{t.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}

            {data.technicianStats.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs">
                ยังไม่มีข้อมูลช่างที่ได้รับมอบหมาย
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">บันทึกประวัติการซ่อมบำรุงล่าสุด</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดง {filteredRepairs.length} จาก {data.recentRepairs.length} รายการ
            </p>
          </div>

          {/* Filter by Category */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="all">ทุกหมวดหมู่งานซ่อม</option>
              <option value="electric">⚡ ระบบไฟฟ้า</option>
              <option value="plumbing">🚿 ประปา / สุขภัณฑ์</option>
              <option value="aircon">❄️ เครื่องปรับอากาศ</option>
              <option value="furniture">🪑 เฟอร์นิเจอร์</option>
              <option value="other">🔧 อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-left">
            <thead className="bg-black/40 text-slate-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-3">ห้อง</th>
                <th className="py-3 px-3">หมวดหมู่</th>
                <th className="py-3 px-3">หัวข้องานซ่อม</th>
                <th className="py-3 px-3">ผู้รับผิดชอบ</th>
                <th className="py-3 px-3">วันที่แจ้ง</th>
                <th className="py-3 px-3">ระยะเวลาทำ</th>
                <th className="py-3 px-3 text-right">ค่าใช้จ่าย</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">ดูงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRepairs.map((r) => {
                const cat = formatRepairCategory(r.category);
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">ห้อง {r.roomNo}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="mr-1">{cat.icon}</span> {cat.label}
                    </td>
                    <td className="py-3 px-3 text-white max-w-xs truncate">{r.title}</td>
                    <td className="py-3 px-3 text-slate-400">{r.assignedTo || "-"}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{formatThaiDate(r.reportedAt)}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {calculateDurationText(r.reportedAt, r.completedAt)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                      {r.cost > 0 ? `฿${r.cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.status === "done" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          เสร็จสิ้น
                        </span>
                      )}
                      {r.status === "in_progress" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          กำลังทำ
                        </span>
                      )}
                      {r.status === "open" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          รอดำเนินการ
                        </span>
                      )}
                      {r.status === "cancelled" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                          ยกเลิก
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/repairs/${r.id}`}
                        className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 hover:underline"
                      >
                        เปิดดู <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredRepairs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    ไม่พบรายการงานซ่อมตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
