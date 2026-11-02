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
import { handleEmojiInput } from "@/lib/emoji";

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
      setActionError("กรุณาระบุบันทึกผลการซ่อม");
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
      fd.append("isAdmin", "true");

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
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/repairs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการแจ้งซ่อม
        </Link>

        <div className="flex items-center gap-2">
          {repair.status !== "done" && repair.status !== "cancelled" && (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1120] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" /> แก้ไขรายละเอียด
            </button>
          )}
        </div>
      </div>

      {/* Feedback banners */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
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
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
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
      <div className="relative overflow-hidden rounded-3xl bg-[#0b1120] p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                รหัสแจ้งซ่อม #{repair.id.toString().padStart(5, "0")}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${priorityConfig.badgeClass}`}>
                {priorityConfig.label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-[#080c15] text-slate-300 border-slate-800 flex items-center gap-1.5">
                {renderCategoryIcon(repair.category)}
                <span>{categoryConfig.label}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {repair.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>ห้อง <strong className="text-white font-semibold">{repair.roomNo}</strong> (ชั้น {repair.floor})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>แจ้งเมื่อ: {formatThaiDate(repair.reportedAt)}</span>
              </div>
              {repair.assignedTo && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>ผู้รับผิดชอบ: <strong className="text-white">{repair.assignedTo}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-xs text-slate-400 font-medium">สถานะปัจจุบัน</div>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${statusConfig.badgeClass}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Stepper / Timeline Visualizer */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="grid grid-cols-3 gap-2 relative">
            {/* Step 1: Open */}
            <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
              repair.status === "open"
                ? "bg-blue-600/15 border-blue-500 text-blue-300"
                : repair.status === "cancelled"
                ? "bg-slate-800/40 border-slate-700 text-slate-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                {repair.status !== "open" && repair.status !== "cancelled" ? "OK" : "1"}
              </div>
              <div className="text-xs font-bold">1. รอดำเนินการ</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{formatThaiDate(repair.reportedAt)}</div>
            </div>

            {/* Step 2: In Progress */}
            <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
              repair.status === "in_progress"
                ? "bg-amber-500/15 border-amber-500 text-amber-300"
                : repair.status === "done"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-[#080c15] border-slate-800 text-slate-500"
            }`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                {repair.status === "done" ? "OK" : "2"}
              </div>
              <div className="text-xs font-bold">2. กำลังดำเนินการ</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {repair.startedAt ? formatThaiDate(repair.startedAt) : "รอมอบหมายช่าง"}
              </div>
            </div>

            {/* Step 3: Done */}
            <div className={`flex flex-col items-center text-center p-3 rounded-xl border ${
              repair.status === "done"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : repair.status === "cancelled"
                ? "bg-rose-500/10 border-rose-500 text-rose-300"
                : "bg-[#080c15] border-slate-800 text-slate-500"
            }`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 bg-black/40">
                {repair.status === "cancelled" ? "X" : repair.status === "done" ? "OK" : "3"}
              </div>
              <div className="text-xs font-bold">
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
      <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">จัดการขั้นตอนงานซ่อม</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            เปลี่ยนสถานะงานซ่อมตามลำดับขั้นตอนของระบบ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* If OPEN */}
          {repair.status === "open" && (
            <>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all"
              >
                <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" /> ยกเลิกคำขอ
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 flex items-center gap-1.5 transition-all"
              >
                <Wrench className="w-3.5 h-3.5" /> รับเรื่อง และมอบหมายช่าง
              </button>
            </>
          )}

          {/* If IN_PROGRESS */}
          {repair.status === "in_progress" && (
            <>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
              >
                เปลี่ยนช่างผู้รับผิดชอบ
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all"
              >
                <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" /> ยกเลิกงานซ่อม
              </button>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกปิดงานซ่อม (Done)
              </button>
            </>
          )}

          {/* If DONE */}
          {repair.status === "done" && (
            <button
              onClick={() => setShowRollbackModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
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
          <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> รายละเอียดปัญหาที่แจ้ง
            </h2>
            <div className="bg-[#080c15] rounded-xl p-4 border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {repair.description}
            </div>

            {/* Attached Image if any */}
            {repair.imageUrl && (
              <div className="pt-2">
                <div className="text-xs text-slate-400 mb-2">รูปภาพประกอบปัญหา:</div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-w-md bg-[#080c15]">
                  <img
                    src={repair.imageUrl}
                    alt="Repair attachment"
                    className="w-full h-auto max-h-72 object-cover"
                  />
                  <a
                    href={repair.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/80 hover:bg-black text-[11px] text-white backdrop-blur flex items-center gap-1 border border-slate-700"
                  >
                    <ExternalLink className="w-3 h-3" /> ดูรูปขนาดเต็ม
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Note Card */}
          {(repair.status === "done" || repair.resolutionNote) && (
            <div className="bg-[#0b1120] rounded-2xl p-6 border border-emerald-900/30 space-y-4">
              <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> บันทึกผลการซ่อมแซม และสรุปค่าใช้จ่าย
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
          <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> ข้อมูลห้องพัก และผู้เช่า
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">หมายเลขห้อง:</span>
                <Link
                  href={`/rooms/${repair.roomId}`}
                  className="font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  ห้อง {repair.roomNo} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ชั้น / ประเภท:</span>
                <span className="text-white font-medium">ชั้น {repair.floor} ({repair.roomType})</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ผู้แจ้ง / ผู้เช่า:</span>
                <span className="text-white font-medium">{repair.tenantName || "ส่วนกลาง / ไม่ระบุผู้เช่า"}</span>
              </div>

              {repair.tenantPhone && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                  <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                  <a
                    href={`tel:${repair.tenantPhone}`}
                    className="text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" /> {repair.tenantPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timing Stats Card */}
          <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> ข้อมูลเวลาและระยะเวลา
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

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">ระยะเวลาดำเนินการ:</span>
                <span className="font-bold text-blue-400">
                  {calculateDurationText(repair.reportedAt, repair.completedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Assign Technician */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">มอบหมายช่างผู้รับผิดชอบ</h3>
                <p className="text-xs text-slate-400">
                  เปลี่ยนสถานะเป็น &ldquo;กำลังดำเนินการ&rdquo;
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ชื่อช่าง / ผู้รับผิดชอบงานซ่อม
              </label>
              <input
                type="text"
                value={assignee}
                onInput={handleEmojiInput}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="เช่น ช่างสมชาย (ระบบไฟ), บริษัท แอร์เซอร์วิส"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950/50"
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

      {/* MODAL 2: Complete Repair */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">บันทึกปิดงานซ่อมแซม</h3>
                <p className="text-xs text-slate-400">
                  บันทึกผลการดำเนินงานและค่าใช้จ่าย
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  บันทึกผลการซ่อมแซม <span className="text-rose-400">* บังคับ</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onInput={handleEmojiInput}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="เช่น เปลี่ยนเบรกเกอร์ใหม่ 20A และทดสอบระบบไฟใช้งานได้ปกติแล้ว"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ค่าใช้จ่ายรวม (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">฿</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
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
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยกเลิกงานแจ้งซ่อม</h3>
                <p className="text-xs text-slate-400">ต้องการยกเลิกคำขอแจ้งซ่อมรายการนี้หรือไม่</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                เหตุผลในการยกเลิก (ถ้ามี)
              </label>
              <input
                type="text"
                value={cancelReason}
                onInput={handleEmojiInput}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="เช่น แจ้งซ้ำ, ผู้เช่าแก้ปัญหาเองแล้ว"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
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

      {/* MODAL 4: Admin Rollback */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ย้อนสถานะงานซ่อม</h3>
                <p className="text-xs text-amber-400 font-bold">
                  สิทธิ์เฉพาะผู้ดูแลระบบ (Admin Permission)
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleRollback}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
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
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">แก้ไขรายละเอียดงานซ่อม</h3>
                <p className="text-xs text-slate-400">อัปเดตข้อมูลหัวข้อและรายละเอียด</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  หัวข้องานแจ้งซ่อม
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onInput={handleEmojiInput}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">หมวดหมู่</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="electric" className="bg-[#0b1120]">ระบบไฟฟ้า</option>
                    <option value="plumbing" className="bg-[#0b1120]">ระบบประปา</option>
                    <option value="aircon" className="bg-[#0b1120]">เครื่องปรับอากาศ</option>
                    <option value="furniture" className="bg-[#0b1120]">เฟอร์นิเจอร์</option>
                    <option value="other" className="bg-[#0b1120]">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">ความเร่งด่วน</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="low" className="bg-[#0b1120]">ไม่ด่วน</option>
                    <option value="normal" className="bg-[#0b1120]">ปกติ</option>
                    <option value="urgent" className="bg-[#0b1120]">ด่วนมาก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">รายละเอียด</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onInput={handleEmojiInput}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">ลิงก์รูปภาพประกอบ (URL)</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onInput={handleEmojiInput}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleEditDetails}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950/50"
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
  );
}
