"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Building2,
  User,
  Zap,
  Droplet,
  Wind,
  Home,
} from "lucide-react";
import {
  formatRepairCategory,
  formatRepairPriority,
  formatRepairStatus,
  calculateDurationText,
} from "@/lib/repairs";
import { formatThaiDate } from "@/lib/invoices";

export type RepairListItem = {
  id: number;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantId?: number | null;
  tenantName?: string | null;
  tenantPhone?: string | null;
  title: string;
  description: string;
  category: "electric" | "plumbing" | "aircon" | "furniture" | "other";
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "done" | "cancelled";
  reportedAt: string;
  assignedTo?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cost: number;
  resolutionNote?: string | null;
};

export default function RepairListClient({
  initialRepairs,
}: {
  initialRepairs: RepairListItem[];
}) {
  const [repairs, setRepairs] = useState(initialRepairs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in_progress" | "urgent" | "done" | "cancelled"
  >("all");

  // Metrics
  const metrics = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let urgentCount = 0;
    let doneCount = 0;
    let totalCost = 0;

    for (const r of repairs) {
      if (r.status === "open") openCount++;
      if (r.status === "in_progress") inProgressCount++;
      if (r.priority === "urgent" && r.status !== "done" && r.status !== "cancelled") urgentCount++;
      if (r.status === "done") {
        doneCount++;
        totalCost += r.cost;
      }
    }

    return {
      total: repairs.length,
      openCount,
      inProgressCount,
      urgentCount,
      doneCount,
      totalCost,
    };
  }, [repairs]);

  // Filtered List
  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.roomNo.toLowerCase().includes(q) ||
        (r.tenantName && r.tenantName.toLowerCase().includes(q)) ||
        (r.assignedTo && r.assignedTo.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === "open") return r.status === "open";
      if (statusFilter === "in_progress") return r.status === "in_progress";
      if (statusFilter === "urgent")
        return r.priority === "urgent" && r.status !== "done" && r.status !== "cancelled";
      if (statusFilter === "done") return r.status === "done";
      if (statusFilter === "cancelled") return r.status === "cancelled";

      return true;
    });
  }, [repairs, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#120f24] rounded-3xl border border-violet-950/80 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-amber-600 via-orange-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/40">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">ระบบแจ้งซ่อมแซม</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                P18: Step 7
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ติดตามงานซ่อม มอบหมายช่าง และบันทึกค่าใช้จ่ายงานบำรุงรักษา (กฎ 4.21, 4.22)
            </p>
          </div>
        </div>

        <Link
          href="/repairs/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/40 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          + แจ้งซ่อมแซมใหม่
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#120f24] border border-violet-950/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 block">รอดำเนินการ (Open)</span>
          <p className="text-xl font-black text-cyan-300 font-mono">
            {metrics.openCount} <span className="text-xs font-normal text-zinc-400">งาน</span>
          </p>
          <p className="text-[10px] text-zinc-500">รอเจ้าหน้าที่มอบหมายช่าง</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120f24] border border-violet-950/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 block">กำลังดำเนินการ (In Progress)</span>
          <p className="text-xl font-black text-amber-300 font-mono">
            {metrics.inProgressCount} <span className="text-xs font-normal text-zinc-400">งาน</span>
          </p>
          <p className="text-[10px] text-zinc-500">ช่างกำลังเข้าตรวจสอบ/ซ่อม</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120f24] border border-violet-950/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 block">งานด่วนมาก (Urgent)</span>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-red-400 font-mono">
              {metrics.urgentCount} <span className="text-xs font-normal text-zinc-400">งาน</span>
            </p>
            {metrics.urgentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-950/80 text-red-300 border border-red-800 font-bold animate-pulse">
                ต้องทำด่วน
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500">ปัญหาฉุกเฉิน ไฟฟ้า/ประปา</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120f24] border border-violet-950/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 block">ซ่อมเสร็จสิ้น (Done)</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {metrics.doneCount} <span className="text-xs font-normal text-zinc-400">งาน</span>
          </p>
          <p className="text-[10px] text-zinc-500">
            ค่าใช้จ่ายสะสม ฿{metrics.totalCost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-violet-600 text-white font-bold shadow-md shadow-violet-950/60"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            ทั้งหมด ({repairs.length})
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "open"
                ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/60"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            รอดำเนินการ ({metrics.openCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "in_progress"
                ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-950/60"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            กำลังซ่อม ({metrics.inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("urgent")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "urgent"
                ? "bg-red-600 text-white font-bold shadow-md shadow-red-950/60"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            ด่วนมาก ({metrics.urgentCount})
          </button>
          <button
            onClick={() => setStatusFilter("done")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "done"
                ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            เสร็จสิ้น ({metrics.doneCount})
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "cancelled"
                ? "bg-zinc-700 text-white font-bold shadow-md"
                : "bg-[#120f24] text-zinc-400 hover:text-white border border-violet-950"
            }`}
          >
            ยกเลิกแล้ว
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="ค้นหาหัวข้อ, เลขห้อง, หรือช่าง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#120f24] border border-violet-950 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Main Repairs Table */}
      <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-violet-950/80 bg-[#16122d]/80 text-zinc-300 font-bold">
                <th className="py-3.5 px-4 w-16 text-center">รหัส</th>
                <th className="py-3.5 px-3 w-28">ห้อง / ชั้น</th>
                <th className="py-3.5 px-3 w-40">หมวดหมู่</th>
                <th className="py-3.5 px-4">หัวข้องานซ่อม</th>
                <th className="py-3.5 px-3 w-28 text-center">ความเร่งด่วน</th>
                <th className="py-3.5 px-3 w-32">ช่างรับผิดชอบ</th>
                <th className="py-3.5 px-3 w-32">ระยะเวลา</th>
                <th className="py-3.5 px-3 text-center w-28">สถานะ</th>
                <th className="py-3.5 px-4 text-center w-20">ดู</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-950/50">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <Wrench className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
                    ไม่พบรายการแจ้งซ่อมตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const cat = formatRepairCategory(r.category);
                  const pri = formatRepairPriority(r.priority);
                  const stat = formatRepairStatus(r.status);
                  const duration = calculateDurationText(r.reportedAt, r.completedAt);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[#16122d]/60 transition-colors ${
                        r.priority === "urgent" && r.status !== "done" && r.status !== "cancelled"
                          ? "bg-red-950/10"
                          : ""
                      } ${r.status === "cancelled" ? "opacity-50" : ""}`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-zinc-400">
                        #{r.id}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-white block">ห้อง {r.roomNo}</span>
                        <span className="text-[10px] text-zinc-500">ชั้น {r.floor}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0a0716] border border-violet-950 text-[11px] text-zinc-300">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/repairs/${r.id}`}
                          className="font-bold text-white hover:text-amber-400 transition-colors block text-sm"
                        >
                          {r.title}
                        </Link>
                        <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {r.description}
                        </span>
                        {r.tenantName && (
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            ผู้แจ้ง: คุณ {r.tenantName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${pri.badgeClass}`}
                        >
                          {pri.label}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {r.assignedTo ? (
                          <span className="font-medium text-zinc-200 block truncate max-w-[120px]">
                            {r.assignedTo}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">- ยังไม่ได้มอบหมาย -</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-zinc-400 text-[11px]">
                        <span>{duration}</span>
                        <span className="block text-[10px] text-zinc-600">
                          {formatThaiDate(r.reportedAt)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stat.badgeClass}`}
                        >
                          {stat.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/repairs/${r.id}`}
                          className="p-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 inline-block transition-colors"
                          title="ดูรายละเอียดและอัปเดตงานซ่อม"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
