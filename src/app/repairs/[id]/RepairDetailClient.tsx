"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  DollarSign,
  Phone,
  FileText,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  RotateCcw,
  XCircle,
  Edit3,
  Loader2,
  Zap,
  Droplet,
  Wind,
  Home,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  formatRepairCategory,
  formatRepairPriority,
  formatRepairStatus,
  calculateDurationText,
} from "@/lib/repairs";
import { formatThaiDate } from "@/lib/invoices";
import { updateRepairStatus, updateRepairDetails } from "@/actions/repairs";

export type RepairDetailData = {
  id: number;
  roomId: number;
  roomNo: string;
  roomType: string;
  floor: number;
  tenantId?: number | null;
  tenantName?: string | null;
  tenantPhone?: string | null;
  tenantLineId?: string | null;
  title: string;
  description: string;
  category: "electric" | "plumbing" | "aircon" | "furniture" | "other";
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "done" | "cancelled";
  imageUrl?: string | null;
  reportedAt: string;
  assignedTo?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cost: number;
  resolutionNote?: string | null;
};

export default function RepairDetailClient({
  repair,
}: {
  repair: RepairDetailData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [assignee, setAssignee] = useState(repair.assignedTo || "");
  const [resolutionNote, setResolutionNote] = useState(repair.resolutionNote || "");
  const [cost, setCost] = useState(repair.cost.toString());
  const [cancelReason, setCancelReason] = useState("");

  // Edit details state
  const [editTitle, setEditTitle] = useState(repair.title);
  const [editDescription, setEditDescription] = useState(repair.description);
  const [editCategory, setEditCategory] = useState(repair.category);
  const [editPriority, setEditPriority] = useState(repair.priority);
  const [editImageUrl, setEditImageUrl] = useState(repair.imageUrl || "");

  // Notification
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const statusConfig = formatRepairStatus(repair.status);
  const priorityConfig = formatRepairPriority(repair.priority);
  const categoryConfig = formatRepairCategory(repair.category);

  // Handle Assign / In Progress
  const handleAssign = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("status", "in_progress");
      fd.append("assignedTo", assignee);
      const res = await updateRepairStatus(repair.id, fd);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("มอบหมายงานช่างเรียบร้อยแล้ว");
        setShowAssignModal(false);
        router.refresh();
      }
    });
  };

  // Handle Complete (done)
  const handleComplete = () => {
    setActionError(null);
    if (!resolutionNote.trim()) {
      setActionError("กรุณาระบุบันทึกผลการซ่อม (บังคับตามกฎ 4.22)");
      return;
    }
    const costNum = parseFloat(cost || "0");
    if (isNaN(costNum) || costNum < 0) {
      setActionError("ค่าใช้จ่ายต้องเป็นตัวเลข 0 ขึ้นไป");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("status", "done");
      fd.append("resolutionNote", resolutionNote.trim());
      fd.append("cost", costNum.toString());
      if (assignee) fd.append("assignedTo", assignee);

      const res = await updateRepairStatus(repair.id, fd);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("บันทึกปิดงานซ่อมเรียบร้อยแล้ว");
        setShowCompleteModal(false);
        router.refresh();
      }
    });
  };

  // Handle Cancel
  const handleCancel = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("status", "cancelled");
      fd.append("resolutionNote", cancelReason.trim());

      const res = await updateRepairStatus(repair.id, fd);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("ยกเลิกงานแจ้งซ่อมเรียบร้อย");
        setShowCancelModal(false);
        router.refresh();
      }
    });
  };

  // Handle Rollback (done -> in_progress) by Admin
  const handleRollback = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("status", "in_progress");
      fd.append("isAdmin", "true"); // Admin permission flag

      const res = await updateRepairStatus(repair.id, fd);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("ย้อนสถานะกลับเป็น กำลังดำเนินการ เรียบร้อย");
        setShowRollbackModal(false);
        router.refresh();
      }
    });
  };

  // Handle Edit Details
  const handleEditDetails = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", editTitle);
      fd.append("description", editDescription);
      fd.append("category", editCategory);
      fd.append("priority", editPriority);
      if (editImageUrl) fd.append("imageUrl", editImageUrl);

      const res = await updateRepairDetails(repair.id, fd);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("แก้ไขรายละเอียดงานซ่อมสำเร็จ");
        setShowEditModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0c0a18] text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/repairs"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการแจ้งซ่อม
          </Link>

          <div className="flex items-center gap-2">
            {repair.status !== "done" && repair.status !== "cancelled" && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-violet-400" /> แก้ไขรายละเอียด
              </button>
            )}
          </div>
        </div>

        {/* Feedback banners */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-xs text-rose-400 hover:text-rose-200"
            >
              ปิด
            </button>
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Main Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16122d] via-[#120f24] to-[#0c0a18] p-6 md:p-8 border border-violet-900/30 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  รหัสแจ้งซ่อม #{repair.id.toString().padStart(5, "0")}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityConfig.badgeClass}`}>
                  {priorityConfig.label}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-slate-300 border-white/10 flex items-center gap-1">
                  <span>{categoryConfig.icon}</span>
                  <span>{categoryConfig.label}</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {repair.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-violet-400" />
                  <span>ห้อง <strong className="text-white font-semibold">{repair.roomNo}</strong> (ชั้น {repair.floor})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>แจ้งเมื่อ: {formatThaiDate(repair.reportedAt)}</span>
                </div>
                {repair.assignedTo && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>ผู้รับผิดชอบ: <strong className="text-white">{repair.assignedTo}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Status Badge */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="text-xs text-slate-400 font-medium">สถานะปัจจุบัน</div>
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 ${statusConfig.badgeClass}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {statusConfig.label}
              </div>
            </div>
          </div>

          {/* Stepper / Timeline Visualizer (Workflow 4.22) */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="grid grid-cols-3 gap-2 relative">
              {/* Step 1: Open */}
              <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
                repair.status === "open"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : repair.status === "cancelled"
                  ? "bg-slate-800/40 border-slate-700 text-slate-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                  {repair.status !== "open" && repair.status !== "cancelled" ? "✓" : "1"}
                </div>
                <div className="text-xs font-semibold">1. รอดำเนินการ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{formatThaiDate(repair.reportedAt)}</div>
              </div>

              {/* Step 2: In Progress */}
              <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
                repair.status === "in_progress"
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10"
                  : repair.status === "done"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/[0.02] border-white/5 text-slate-500"
              }`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                  {repair.status === "done" ? "✓" : "2"}
                </div>
                <div className="text-xs font-semibold">2. กำลังดำเนินการ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {repair.startedAt ? formatThaiDate(repair.startedAt) : "รอมอบหมายช่าง"}
                </div>
              </div>

              {/* Step 3: Done */}
              <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
                repair.status === "done"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : repair.status === "cancelled"
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                  : "bg-white/[0.02] border-white/5 text-slate-500"
              }`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                  {repair.status === "cancelled" ? "✕" : repair.status === "done" ? "✓" : "3"}
                </div>
                <div className="text-xs font-semibold">
                  {repair.status === "cancelled" ? "ยกเลิกแล้ว" : "3. เสร็จสิ้น"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {repair.completedAt ? formatThaiDate(repair.completedAt) : "รอตรวจรับงาน"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Actions Control Bar */}
        <div className="bg-[#120f24] rounded-2xl p-6 border border-violet-900/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">จัดการขั้นตอนงานซ่อม</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              เปลี่ยนสถานะงานซ่อมตามลำดับ workflow ของระบบ (กฎ 4.22)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* If OPEN: Can assign technician -> in_progress, or cancel */}
            {repair.status === "open" && (
              <>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-medium transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" /> ยกเลิกคำขอ
                </button>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Wrench className="w-3.5 h-3.5" /> รับเรื่อง & มอบหมายช่าง
                </button>
              </>
            )}

            {/* If IN_PROGRESS: Can update assignee, complete work -> done, or cancel */}
            {repair.status === "in_progress" && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all"
                >
                  เปลี่ยนช่างผู้รับผิดชอบ
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-medium transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" /> ยกเลิกงานซ่อม
                </button>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกปิดงานซ่อม (Done)
                </button>
              </>
            )}

            {/* If DONE: Closed work, but Admin can rollback to in_progress (Rule 4.22) */}
            {repair.status === "done" && (
              <button
                onClick={() => setShowRollbackModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-xs font-medium transition-all flex items-center gap-1.5"
                title="เฉพาะสิทธิ์ Admin เท่านั้น"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> ย้อนสถานะเป็นกำลังดำเนินการ (Admin)
              </button>
            )}

            {/* If CANCELLED */}
            {repair.status === "cancelled" && (
              <span className="text-xs text-rose-400 italic">คำขอนี้ถูกยกเลิกแล้ว</span>
            )}
          </div>
        </div>

        {/* Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details & Resolution Note */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Description Card */}
            <div className="bg-[#120f24] rounded-2xl p-6 border border-violet-900/30 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" /> รายละเอียดปัญหาที่แจ้ง
              </h2>
              <div className="bg-black/30 rounded-xl p-4 border border-white/5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                {repair.description}
              </div>

              {/* Attached Image if any */}
              {repair.imageUrl && (
                <div className="pt-2">
                  <div className="text-xs text-slate-400 mb-2">รูปภาพประกอบปัญหา:</div>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-w-md bg-black/40">
                    <img
                      src={repair.imageUrl}
                      alt="Repair attachment"
                      className="w-full h-auto max-h-72 object-cover"
                    />
                    <a
                      href={repair.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/70 hover:bg-black/90 text-[11px] text-white backdrop-blur flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> ดูรูปขนาดเต็ม
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Note Card (if done or has resolutionNote) */}
            {(repair.status === "done" || repair.resolutionNote) && (
              <div className="bg-[#120f24] rounded-2xl p-6 border border-emerald-900/30 space-y-4">
                <h2 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> บันทึกผลการซ่อมแซม & สรุปค่าใช้จ่าย
                </h2>

                <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/20 space-y-3">
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">
                    {repair.resolutionNote || "ไม่มีบันทึกรายละเอียด"}
                  </div>

                  <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-xs">
                    <div className="text-slate-400">
                      ค่าใช้จ่ายการซ่อมแซม:
                    </div>
                    <div className="text-base font-bold text-emerald-400">
                      ฿{repair.cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Room & Tenant & Time Stats */}
          <div className="space-y-6">
            {/* Room & Tenant Card */}
            <div className="bg-[#120f24] rounded-2xl p-6 border border-violet-900/30 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-400" /> ข้อมูลห้องพัก & ผู้เช่า
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400">หมายเลขห้อง:</span>
                  <Link
                    href={`/rooms/${repair.roomId}`}
                    className="font-semibold text-violet-300 hover:text-violet-200 hover:underline flex items-center gap-1"
                  >
                    ห้อง {repair.roomNo} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400">ชั้น / ประเภท:</span>
                  <span className="text-white font-medium">ชั้น {repair.floor} ({repair.roomType})</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400">ผู้แจ้ง / ผู้เช่า:</span>
                  <span className="text-white font-medium">{repair.tenantName || "ส่วนกลาง / ไม่ระบุผู้เช่า"}</span>
                </div>

                {repair.tenantPhone && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                    <a
                      href={`tel:${repair.tenantPhone}`}
                      className="text-violet-300 hover:text-violet-200 font-medium flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" /> {repair.tenantPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Timing Stats Card */}
            <div className="bg-[#120f24] rounded-2xl p-6 border border-violet-900/30 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" /> ข้อมูลเวลาและระยะเวลา
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">วันที่แจ้ง:</span>
                  <span className="text-slate-200 font-mono">{formatThaiDate(repair.reportedAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">เริ่มดำเนินการ:</span>
                  <span className="text-slate-200 font-mono">
                    {repair.startedAt ? formatThaiDate(repair.startedAt) : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">เสร็จสิ้นเมื่อ:</span>
                  <span className="text-slate-200 font-mono">
                    {repair.completedAt ? formatThaiDate(repair.completedAt) : "-"}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">ระยะเวลาดำเนินการ:</span>
                  <span className="font-semibold text-violet-300">
                    {calculateDurationText(repair.reportedAt, repair.completedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: Assign Technician (open -> in_progress or edit assignee) */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16122d] border border-violet-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">มอบหมายช่างผู้รับผิดชอบ</h3>
                  <p className="text-xs text-slate-400">
                    เปลี่ยนสถานะเป็น &ldquo;กำลังดำเนินการ&rdquo; (กฎ 4.22)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ชื่อช่าง / ผู้รับผิดชอบงานซ่อม
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="เช่น ช่างสมชาย (ระบบไฟ), บ. แอร์เซอร์วิส"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...
                    </>
                  ) : (
                    "ยืนยันมอบหมายงาน"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Complete Repair (in_progress -> done) */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16122d] border border-emerald-500/30 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">บันทึกปิดงานซ่อมแซม</h3>
                  <p className="text-xs text-slate-400">
                    บันทึกผลการดำเนินงานและค่าใช้จ่าย (กฎ 4.22 บังคับกรอกผลการซ่อม)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    บันทึกผลการซ่อมแซม <span className="text-rose-400">* บังคับ</span>
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="เช่น เปลี่ยนเบรกเกอร์ใหม่ 20A และทดสอบระบบไฟใช้งานได้ปกติแล้ว"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ค่าใช้จ่ายรวม (บาท)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">฿</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">ใส่ 0 ได้หากไม่มีค่าใช้จ่ายหรืออยู่ในประกัน</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...
                    </>
                  ) : (
                    "ยืนยันปิดงานซ่อม"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Cancel Repair */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16122d] border border-rose-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ยกเลิกงานแจ้งซ่อม</h3>
                  <p className="text-xs text-slate-400">ต้องการยกเลิกคำขอแจ้งซ่อมรายการนี้หรือไม่</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  เหตุผลในการยกเลิก (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น แจ้งซ้ำ, ผู้เช่าแก้ปัญหาเองแล้ว"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังยกเลิก...
                    </>
                  ) : (
                    "ยืนยันยกเลิกงานซ่อม"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Admin Rollback (done -> in_progress, Rule 4.22) */}
        {showRollbackModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16122d] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ย้อนสถานะงานซ่อม</h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    สิทธิ์เฉพาะผู้ดูแลระบบ (Admin Permission) ตามกฎ 4.22
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                การย้อนสถานะจาก &ldquo;เสร็จสิ้น&rdquo; กลับเป็น &ldquo;กำลังดำเนินการ&rdquo; จะเปิดให้แก้ไขข้อมูลและตรวจรับงานซ่อมใหม่อีกครั้ง
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRollbackModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังดำเนินการ...
                    </>
                  ) : (
                    "ยืนยันย้อนสถานะ"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: Edit Details */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16122d] border border-violet-500/30 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">แก้ไขรายละเอียดงานซ่อม</h3>
                  <p className="text-xs text-slate-400">อัปเดตข้อมูลหัวข้อและรายละเอียด</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    หัวข้องานแจ้งซ่อม
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">หมวดหมู่</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="electric" className="bg-[#16122d]">ระบบไฟฟ้า</option>
                      <option value="plumbing" className="bg-[#16122d]">ระบบประปา</option>
                      <option value="aircon" className="bg-[#16122d]">เครื่องปรับอากาศ</option>
                      <option value="furniture" className="bg-[#16122d]">เฟอร์นิเจอร์</option>
                      <option value="other" className="bg-[#16122d]">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">ความเร่งด่วน</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="low" className="bg-[#16122d]">ต่ำ</option>
                      <option value="normal" className="bg-[#16122d]">ปกติ</option>
                      <option value="urgent" className="bg-[#16122d]">ด่วนมาก</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">รายละเอียด</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ลิงก์รูปภาพประกอบ (URL)</label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleEditDetails}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึกการแก้ไข"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
