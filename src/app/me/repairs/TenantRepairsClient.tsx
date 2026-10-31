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
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-violet-400" />
            ประวัติการแจ้งซ่อมบำรุงห้องพัก {roomNo}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ติดตามความคืบหน้าการซ่อมแซมและดูผลการปฏิบัติงานของช่าง
          </p>
        </div>

        <Link
          href={`/me/repairs/new?tenantId=${tenantId}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>แจ้งซ่อมรายการใหม่</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterStatus === "all" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white bg-white/5"
          }`}
        >
          ทั้งหมด ({repairs.length})
        </button>
        <button
          onClick={() => setFilterStatus("open")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterStatus === "open" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white bg-white/5"
          }`}
        >
          รอดำเนินการ ({repairs.filter((r) => r.status === "open").length})
        </button>
        <button
          onClick={() => setFilterStatus("in_progress")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterStatus === "in_progress" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white bg-white/5"
          }`}
        >
          กำลังดำเนินการ ({repairs.filter((r) => r.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilterStatus("done")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterStatus === "done" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white bg-white/5"
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
              className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{r.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${pr.badgeClass}`}>
                      {pr.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${st.badgeClass}`}>
                    {st.label}
                  </span>
                </div>
              </div>

              {/* Photo thumbnail if any */}
              {r.imageUrl && (
                <div className="pt-1">
                  <a
                    href={r.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span>ดูรูปภาพประกอบปัญหา</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              )}

              {/* Progress & Resolution Note */}
              <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span>วันที่แจ้ง: {formatThaiDate(r.reportedAt)}</span>
                  {r.assignedTo && <span>ผู้รับผิดชอบ: <strong className="text-white">{r.assignedTo}</strong></span>}
                  {r.completedAt && (
                    <span className="text-emerald-400">
                      ระยะเวลาซ่อม: {calculateDurationText(r.reportedAt, r.completedAt)}
                    </span>
                  )}
                </div>

                {r.resolutionNote && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
                    ผลการซ่อม: {r.resolutionNote}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRepairs.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-[#120f24] border border-violet-900/30">
            ไม่พบประวัติการแจ้งซ่อมตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}
