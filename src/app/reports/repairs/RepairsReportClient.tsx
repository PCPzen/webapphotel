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

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "electric":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "plumbing":
        return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case "aircon":
        return <Wind className="w-3.5 h-3.5 text-sky-400" />;
      case "furniture":
        return <Home className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <ReportTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            รายงานสรุปงานซ่อมบำรุงและต้นทุน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สถิติต้นทุนค่าบำรุงรักษา ประสิทธิภาพการแก้ไขปัญหา และสถิติงานซ่อมแยกหมวดหมู่
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b1120] hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold self-start sm:self-auto transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          <span>พิมพ์รายงานซ่อมบำรุง</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cost */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ต้นทุนค่าซ่อมแซมรวม</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
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
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>อัตราปิดงานสำเร็จ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {completionRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            ปิดงานแล้ว {data.doneCount} จาก {data.totalCount} งาน
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ระยะเวลาซ่อมเฉลี่ย</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 tracking-tight">
            {avgDurationStr}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            นับจากแจ้งจนถึงตรวจรับงาน
          </div>
        </div>

        {/* Active Workload */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>งานที่กำลังค้างอยู่</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-400" /> สัดส่วนงานซ่อมและค่าใช้จ่ายแยกตามหมวดหมู่
          </h2>

          <div className="space-y-3 pt-1">
            {data.categoryStats.map((c) => (
              <div key={c.category} className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {renderCategoryIcon(c.category)}
                    <span className="font-bold text-white">{c.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-white font-bold">
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
                    className="bg-blue-600 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Workload */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" /> ผลงานช่าง / ผู้รับเหมา
          </h2>

          <div className="space-y-3 pt-1">
            {data.technicianStats.map((t) => (
              <div key={t.name} className="p-3.5 rounded-xl bg-[#080c15] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{t.name}</span>
                  <span className="font-bold text-blue-400 font-mono">{t.jobCount} งาน</span>
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
              <div className="p-6 text-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลช่างที่ได้รับมอบหมาย
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">บันทึกประวัติการซ่อมบำรุงล่าสุด</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดง {filteredRepairs.length} จาก {data.recentRepairs.length} รายการ
            </p>
          </div>

          {/* Filter by Category */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="all" className="bg-[#0b1120]">ทุกหมวดหมู่งานซ่อม</option>
              <option value="electric" className="bg-[#0b1120]">ระบบไฟฟ้า</option>
              <option value="plumbing" className="bg-[#0b1120]">ประปา / สุขภัณฑ์</option>
              <option value="aircon" className="bg-[#0b1120]">เครื่องปรับอากาศ</option>
              <option value="furniture" className="bg-[#0b1120]">เฟอร์นิเจอร์</option>
              <option value="other" className="bg-[#0b1120]">อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f172a] text-slate-300 border-b border-slate-800 font-bold">
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
            <tbody className="divide-y divide-slate-800/80">
              {filteredRepairs.map((r) => {
                const cat = formatRepairCategory(r.category);
                return (
                  <tr key={r.id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">ห้อง {r.roomNo}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        {renderCategoryIcon(r.category)}
                        <span>{cat.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white max-w-xs truncate font-medium">{r.title}</td>
                    <td className="py-3 px-3 text-slate-400">{r.assignedTo || "-"}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{formatThaiDate(r.reportedAt)}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {calculateDurationText(r.reportedAt, r.completedAt)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {r.cost > 0 ? `฿${r.cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.status === "done" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          เสร็จสิ้น
                        </span>
                      )}
                      {r.status === "in_progress" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          กำลังทำ
                        </span>
                      )}
                      {r.status === "open" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          รอดำเนินการ
                        </span>
                      )}
                      {r.status === "cancelled" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          ยกเลิก
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/repairs/${r.id}`}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-bold"
                      >
                        เปิดดู <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredRepairs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
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
