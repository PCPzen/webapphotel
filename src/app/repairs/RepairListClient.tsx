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
import { handleEmojiInput } from "@/lib/emoji";

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

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "electric":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "plumbing":
        return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1120] rounded-3xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">ระบบแจ้งซ่อมแซม</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                สเต็ป 7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ติดตามงานซ่อม มอบหมายช่าง และบันทึกค่าใช้จ่ายงานบำรุงรักษา
            </p>
          </div>
        </div>

        <Link
          href="/repairs/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/50 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          แจ้งซ่อมแซมใหม่
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">รอดำเนินการ (Open)</span>
          <p className="text-xl font-black text-sky-400 font-mono">
            {metrics.openCount} <span className="text-xs font-normal text-slate-400">งาน</span>
          </p>
          <p className="text-[10px] text-slate-400">รอเจ้าหน้าที่มอบหมายช่าง</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">กำลังดำเนินการ (In Progress)</span>
          <p className="text-xl font-black text-amber-400 font-mono">
            {metrics.inProgressCount} <span className="text-xs font-normal text-slate-400">งาน</span>
          </p>
          <p className="text-[10px] text-slate-400">ช่างกำลังเข้าตรวจสอบหรือซ่อม</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">งานด่วนมาก (Urgent)</span>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-rose-400 font-mono">
              {metrics.urgentCount} <span className="text-xs font-normal text-slate-400">งาน</span>
            </p>
            {metrics.urgentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                ต้องทำด่วน
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">ปัญหาฉุกเฉิน ไฟฟ้าหรือประปา</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ซ่อมเสร็จสิ้น (Done)</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {metrics.doneCount} <span className="text-xs font-normal text-slate-400">งาน</span>
          </p>
          <p className="text-[10px] text-slate-400">
            ค่าใช้จ่ายสะสม {metrics.totalCost.toLocaleString()} บาท
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
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ทั้งหมด ({repairs.length})
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "open"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            รอดำเนินการ ({metrics.openCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "in_progress"
                ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            กำลังซ่อม ({metrics.inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("urgent")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "urgent"
                ? "bg-rose-600 text-white font-bold shadow-md shadow-rose-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ด่วนมาก ({metrics.urgentCount})
          </button>
          <button
            onClick={() => setStatusFilter("done")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "done"
                ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            เสร็จสิ้น ({metrics.doneCount})
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "cancelled"
                ? "bg-slate-700 text-white font-bold shadow-md"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ยกเลิกแล้ว
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาหัวข้อ, เลขห้อง, หรือช่าง..."
            value={search}
            onInput={handleEmojiInput}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b1120] border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Repairs Table */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-300 font-bold">
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
            <tbody className="divide-y divide-slate-800/80">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
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
                      className={`hover:bg-[#0f172a]/60 transition-colors ${
                        r.priority === "urgent" && r.status !== "done" && r.status !== "cancelled"
                          ? "bg-rose-500/5"
                          : ""
                      } ${r.status === "cancelled" ? "opacity-50" : ""}`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        #{r.id}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">ห้อง {r.roomNo}</span>
                        <span className="text-[10px] text-slate-400">ชั้น {r.floor}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#080c15] border border-slate-800 text-[11px] text-slate-300">
                          {renderCategoryIcon(r.category)}
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/repairs/${r.id}`}
                          className="font-bold text-white hover:text-blue-400 transition-colors block text-sm"
                        >
                          {r.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {r.description}
                        </span>
                        {r.tenantName && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
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
                          <span className="font-medium text-slate-200 block truncate max-w-[120px]">
                            {r.assignedTo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">- ยังไม่ได้มอบหมาย -</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        <span>{duration}</span>
                        <span className="block text-[10px] text-slate-400">
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
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 inline-block transition-colors border border-blue-500/20"
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
