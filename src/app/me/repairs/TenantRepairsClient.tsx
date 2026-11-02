"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { formatThaiDate } from "@/lib/invoices";
import { formatRepairCategory, formatRepairPriority, formatRepairStatus, calculateDurationText } from "@/lib/repairs";

export type TenantRepairItem = {
  id: number;
  title: string;
  description: string;
  category: "electric" | "plumbing" | "aircon" | "furniture" | "other";
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "done" | "cancelled";
  imageUrl?: string | null;
  reportedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  assignedTo?: string | null;
  cost: number;
  resolutionNote?: string | null;
};

export default function TenantRepairsClient({
  repairs,
  tenantId,
  roomNo,
}: {
  repairs: TenantRepairItem[];
  tenantId: number;
  roomNo: string;
}) {
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "done">("all");

  const filteredRepairs = repairs.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            ประวัติการแจ้งซ่อมบำรุงห้องพัก {roomNo}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ติดตามความคืบหน้าการซ่อมแซมและดูผลการปฏิบัติงานของช่าง
          </p>
        </div>

        <Link
          href={`/me/repairs/new?tenantId=${tenantId}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>แจ้งซ่อมรายการใหม่</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterStatus === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white bg-[#0b1120] border border-slate-800"
          }`}
        >
          ทั้งหมด ({repairs.length})
        </button>
        <button
          onClick={() => setFilterStatus("open")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterStatus === "open" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white bg-[#0b1120] border border-slate-800"
          }`}
        >
          รอดำเนินการ ({repairs.filter((r) => r.status === "open").length})
        </button>
        <button
          onClick={() => setFilterStatus("in_progress")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterStatus === "in_progress" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white bg-[#0b1120] border border-slate-800"
          }`}
        >
          กำลังดำเนินการ ({repairs.filter((r) => r.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilterStatus("done")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterStatus === "done" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white bg-[#0b1120] border border-slate-800"
          }`}
        >
          เสร็จสิ้นแล้ว ({repairs.filter((r) => r.status === "done").length})
        </button>
      </div>

      {/* Repair Cards List */}
      <div className="space-y-4">
        {filteredRepairs.map((r) => {
          const cat = formatRepairCategory(r.category);
          const pr = formatRepairPriority(r.priority);
          const st = formatRepairStatus(r.status);

          return (
            <div
              key={r.id}
              className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      #{r.id.toString().padStart(5, "0")}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#080c15] text-slate-300 border border-slate-800">
                      {cat.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pr.badgeClass}`}>
                      {pr.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{r.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {r.description}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.badgeClass}`}>
                    {st.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatThaiDate(r.reportedAt)}
                  </span>
                </div>
              </div>

              {/* Photo Preview if any */}
              {r.imageUrl && (
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> ภาพประกอบ:
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-w-xs bg-[#080c15]">
                    <img src={r.imageUrl} alt="attachment" className="w-full h-auto max-h-48 object-cover" />
                    <a
                      href={r.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 hover:bg-black text-[10px] text-white flex items-center gap-1 border border-slate-700"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> ดูภาพเต็ม
                    </a>
                  </div>
                </div>
              )}

              {/* Progress and Technician Note */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">ช่างผู้รับผิดชอบ: </span>
                  <span className="text-white font-medium">{r.assignedTo || "-"}</span>
                </div>

                {r.status === "done" && r.resolutionNote && (
                  <div className="sm:text-right">
                    <span className="text-emerald-400 font-bold">ผลการซ่อม: </span>
                    <span className="text-slate-200">{r.resolutionNote}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRepairs.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs rounded-3xl bg-[#0b1120] border border-slate-800">
            ไม่พบรายการแจ้งซ่อมตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}
