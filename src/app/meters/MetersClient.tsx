"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gauge,
  Calendar,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Droplet,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import { saveMeterReading, saveMeterReadingsBatch, MeterReadingInput } from "@/actions/meters";
import { handleEmojiInput } from "@/lib/emoji";

export type MeterRowData = {
  roomId: number;
  roomNo: string;
  floor: number;
  roomType: string;
  hasActiveContract: boolean;
  tenantName: string;
  waterRate: number;
  electricRate: number;
  readingId?: number | null;
  waterPrev: number;
  waterCurr: number | null;
  elecPrev: number;
  elecCurr: number | null;
  readDate: string;
  note: string;
  isLocked: boolean;
  invoiceNo?: string | null;
  pastAvgWater: number;
  pastAvgElec: number;
  hasHistory: boolean;
};

export default function MetersClient({
  monthStr,
  prevMonthStr,
  nextMonthStr,
  thaiMonthName,
  initialRows,
}: {
  monthStr: string;
  prevMonthStr: string;
  nextMonthStr: string;
  thaiMonthName: string;
  initialRows: MeterRowData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // สถานะข้อมูลของแต่ละห้องในตาราง
  const [rows, setRows] = useState<
    (MeterRowData & {
      inputWaterCurr: string;
      inputElecCurr: string;
      inputWaterPrev: string;
      inputElecPrev: string;
      inputNote: string;
      inputReadDate: string;
      isAdminEditPrev: boolean;
      rowStatus?: "idle" | "saving" | "saved" | "error";
      rowError?: string;
    })[]
  >(() =>
    initialRows.map((r) => ({
      ...r,
      inputWaterCurr: r.waterCurr !== null ? r.waterCurr.toString() : "",
      inputElecCurr: r.elecCurr !== null ? r.elecCurr.toString() : "",
      inputWaterPrev: r.waterPrev.toString(),
      inputElecPrev: r.elecPrev.toString(),
      inputNote: r.note || "",
      inputReadDate: r.readDate || new Date().toISOString().split("T")[0],
      isAdminEditPrev: false,
      rowStatus: "idle",
    }))
  );

  // ฟิลเตอร์และค้นหา
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "recorded" | "anomaly" | "locked">("all");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // คำนวณภาพรวมสถิติประจำเดือน (Monthly Metrics)
  const metrics = useMemo(() => {
    const total = rows.length;
    let recorded = 0;
    let locked = 0;
    let anomalyCount = 0;
    let totalWaterUnits = 0;
    let totalElecUnits = 0;
    let totalEstimatedCost = 0;

    for (const r of rows) {
      const isRecorded = r.inputWaterCurr !== "" && r.inputElecCurr !== "";
      if (isRecorded) recorded++;
      if (r.isLocked) locked++;

      const wCurr = parseInt(r.inputWaterCurr, 10);
      const eCurr = parseInt(r.inputElecCurr, 10);
      const wPrev = parseInt(r.inputWaterPrev, 10) || 0;
      const ePrev = parseInt(r.inputElecPrev, 10) || 0;

      if (!isNaN(wCurr) && wCurr >= wPrev) {
        const u = wCurr - wPrev;
        totalWaterUnits += u;
        totalEstimatedCost += u * r.waterRate;
        if (r.hasHistory && r.pastAvgWater > 0 && u > 3 * r.pastAvgWater) {
          anomalyCount++;
        }
      }

      if (!isNaN(eCurr) && eCurr >= ePrev) {
        const u = eCurr - ePrev;
        totalElecUnits += u;
        totalEstimatedCost += u * r.electricRate;
        if (r.hasHistory && r.pastAvgElec > 0 && u > 3 * r.pastAvgElec) {
          anomalyCount++;
        }
      }
    }

    const pending = total - recorded;
    const progressPercent = total > 0 ? Math.round((recorded / total) * 100) : 0;

    return {
      total,
      recorded,
      pending,
      locked,
      anomalyCount,
      totalWaterUnits,
      totalElecUnits,
      totalEstimatedCost,
      progressPercent,
    };
  }, [rows]);

  // กรองแถวตามแท็บและคำค้นหา
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. ตรวจสอบค้นหา
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.roomNo.toLowerCase().includes(q) ||
        r.tenantName.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. ตรวจสอบ Filter Tab
      const isRecorded = r.inputWaterCurr !== "" && r.inputElecCurr !== "";
      if (filterTab === "pending") return !isRecorded;
      if (filterTab === "recorded") return isRecorded;
      if (filterTab === "locked") return r.isLocked;
      if (filterTab === "anomaly") {
        const wCurr = parseInt(r.inputWaterCurr, 10);
        const eCurr = parseInt(r.inputElecCurr, 10);
        const wPrev = parseInt(r.inputWaterPrev, 10) || 0;
        const ePrev = parseInt(r.inputElecPrev, 10) || 0;
        const wU = !isNaN(wCurr) ? Math.max(0, wCurr - wPrev) : 0;
        const eU = !isNaN(eCurr) ? Math.max(0, eCurr - ePrev) : 0;
        const isWAnomaly = r.hasHistory && r.pastAvgWater > 0 && wU > 3 * r.pastAvgWater;
        const isEAnomaly = r.hasHistory && r.pastAvgElec > 0 && eU > 3 * r.pastAvgElec;
        return isWAnomaly || isEAnomaly;
      }
      return true;
    });
  }, [rows, search, filterTab]);

  // เปลี่ยนแปลงค่าในช่อง Input
  const handleInputChange = (
    index: number,
    field: "inputWaterCurr" | "inputElecCurr" | "inputWaterPrev" | "inputElecPrev" | "inputNote" | "inputReadDate",
    value: string
  ) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleAdminEditPrev = (index: number) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        isAdminEditPrev: !copy[index].isAdminEditPrev,
      };
      return copy;
    });
  };

  // Keyboard navigation (Enter / Tab auto focus next)
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: "water" | "elec") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "water") {
        const nextElem = document.getElementById(`elec-input-${rowIndex}`);
        nextElem?.focus();
      } else {
        const nextRowElem = document.getElementById(`water-input-${rowIndex + 1}`);
        if (nextRowElem) {
          nextRowElem.focus();
        } else {
          document.getElementById("btn-batch-save")?.focus();
        }
      }
    }
  };

  // บันทึกแถวเดี่ยว
  const handleSaveRow = async (index: number) => {
    const r = rows[index];
    if (r.isLocked) return;

    const waterCurr = parseInt(r.inputWaterCurr, 10);
    const elecCurr = parseInt(r.inputElecCurr, 10);
    const waterPrev = parseInt(r.inputWaterPrev, 10);
    const elecPrev = parseInt(r.inputElecPrev, 10);

    if (isNaN(waterCurr) || isNaN(elecCurr)) {
      setFeedbackMessage({
        type: "error",
        text: `ห้อง ${r.roomNo}: กรุณากรอกเลขมิเตอร์น้ำและไฟปัจจุบันให้ครบถ้วน`,
      });
      return;
    }

    if (!r.isAdminEditPrev && (waterCurr < waterPrev || elecCurr < elecPrev)) {
      setFeedbackMessage({
        type: "error",
        text: `ห้อง ${r.roomNo}: เลขมิเตอร์ใหม่ต้องไม่น้อยกว่าเลขก่อนหน้า (ตามกฎ BR-04)`,
      });
      return;
    }

    setRows((prev) => {
      const copy = [...prev];
      copy[index].rowStatus = "saving";
      return copy;
    });

    startTransition(async () => {
      const res = await saveMeterReading(monthStr, {
        roomId: r.roomId,
        waterPrev,
        waterCurr,
        elecPrev,
        elecCurr,
        readDate: r.inputReadDate,
        note: r.inputNote,
        allowAdminPrevEdit: r.isAdminEditPrev,
      });

      if (res.success) {
        setRows((prev) => {
          const copy = [...prev];
          copy[index].rowStatus = "saved";
          copy[index].waterCurr = waterCurr;
          copy[index].elecCurr = elecCurr;
          return copy;
        });
        setFeedbackMessage({ type: "success", text: `บันทึกมิเตอร์ห้อง ${r.roomNo} เรียบร้อยแล้ว` });
      } else {
        setRows((prev) => {
          const copy = [...prev];
          copy[index].rowStatus = "error";
          copy[index].rowError = res.error;
          return copy;
        });
        setFeedbackMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  // บันทึกทั้งตาราง (Batch Save)
  const handleBatchSave = async () => {
    const validPayload: MeterReadingInput[] = [];
    const anomalies: string[] = [];

    for (const r of rows) {
      if (r.isLocked) continue;
      if (r.inputWaterCurr === "" || r.inputElecCurr === "") continue;

      const waterCurr = parseInt(r.inputWaterCurr, 10);
      const elecCurr = parseInt(r.inputElecCurr, 10);
      const waterPrev = parseInt(r.inputWaterPrev, 10);
      const elecPrev = parseInt(r.inputElecPrev, 10);

      if (isNaN(waterCurr) || isNaN(elecCurr)) continue;

      if (!r.isAdminEditPrev && (waterCurr < waterPrev || elecCurr < elecPrev)) {
        setFeedbackMessage({
          type: "error",
          text: `ห้อง ${r.roomNo}: เลขใหม่น้อยกว่าเลขเดิม ไม่อนุญาตให้บันทึก (BR-04)`,
        });
        return;
      }

      const wUnits = waterCurr - waterPrev;
      const eUnits = elecCurr - elecPrev;
      if (r.hasHistory && ((r.pastAvgWater > 0 && wUnits > 3 * r.pastAvgWater) || (r.pastAvgElec > 0 && eUnits > 3 * r.pastAvgElec))) {
        anomalies.push(`ห้อง ${r.roomNo}`);
      }

      validPayload.push({
        roomId: r.roomId,
        waterPrev,
        waterCurr,
        elecPrev,
        elecCurr,
        readDate: r.inputReadDate,
        note: r.inputNote,
        allowAdminPrevEdit: r.isAdminEditPrev,
      });
    }

    if (validPayload.length === 0) {
      setFeedbackMessage({ type: "error", text: "ไม่มีข้อมูลมิเตอร์ใหม่ที่พร้อมบันทึก" });
      return;
    }

    if (anomalies.length > 0) {
      const confirmed = window.confirm(
        `แจ้งเตือน: มีการใช้งานมิเตอร์สูงผิดปกติเกิน 3 เท่าใน ${anomalies.join(", ")}\n\nคุณต้องการยืนยันว่าเลขมิเตอร์ถูกต้องและบันทึกต่อไปหรือไม่?`
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      const res = await saveMeterReadingsBatch(monthStr, validPayload);
      if (res.success) {
        setFeedbackMessage({ type: "success", text: res.message || "บันทึกมิเตอร์สำเร็จทุกห้อง" });
        router.refresh();
      } else {
        setFeedbackMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาดในการบันทึก" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b1120] rounded-3xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50 border border-blue-500/30">
            <Gauge className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">บันทึกมิเตอร์น้ำ-ไฟ</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                สเต็ป 4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              จดบันทึกมาตรวัดน้ำ-ไฟฟ้าประจำเดือน คำนวณหน่วยใช้ และส่งต่อออกใบแจ้งหนี้ (BR-04, UR-2.14, UR-2.15)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print Walksheet */}
          <Link
            href={`/meters/print?month=${monthStr}`}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition-all hover:scale-105"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            พิมพ์ใบเดินจด (Walksheet)
          </Link>

          {/* Go to Generate Invoices */}
          <Link
            href={`/invoices/generate?month=${monthStr}`}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/40 border border-blue-500/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            ออกบิลต่อ (สเต็ป 5)
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Batch Save Button */}
          <button
            id="btn-batch-save"
            onClick={handleBatchSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/60 border border-blue-500/30 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึกทั้งตาราง..." : "บันทึกทั้งตาราง"}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
              : "bg-red-950/40 border border-red-800/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-500 hover:text-slate-300 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Month Selector Bar */}
      <div className="bg-[#0b1120] rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">รอบประจำเดือน:</span>
          <span className="text-base font-black text-white">{thaiMonthName}</span>
          <span className="text-xs font-mono text-slate-500">({monthStr})</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/meters?month=${prevMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            เดือนก่อนหน้า
          </Link>

          <Link
            href={`/meters`}
            className="px-3 py-1.5 rounded-xl bg-[#080c15] hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors"
          >
            เดือนปัจจุบัน
          </Link>

          <Link
            href={`/meters?month=${nextMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            เดือนถัดไป
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Progress Card */}
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold">ความคืบหน้าการจด</span>
            <span className="font-mono text-white font-bold">
              {metrics.recorded}/{metrics.total} ห้อง
            </span>
          </div>
          <div className="w-full bg-[#080c15] rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics.progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 flex justify-between">
            <span>จดเสร็จ {metrics.progressPercent}%</span>
            <span>รอจด {metrics.pending} ห้อง</span>
          </p>
        </div>

        {/* Total Water Units */}
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-blue-400" /> รวมหน่วยใช้น้ำ
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-800/30">
              ประปา
            </span>
          </div>
          <p className="text-xl font-black text-blue-300 font-mono">
            {metrics.totalWaterUnits.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">หน่วย</span>
          </p>
          <p className="text-[11px] text-slate-500">
            จดแล้ว {metrics.recorded} ห้อง
          </p>
        </div>

        {/* Total Electric Units */}
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> รวมหน่วยใช้ไฟฟ้า
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/30">
              ไฟฟ้า
            </span>
          </div>
          <p className="text-xl font-black text-amber-300 font-mono">
            {metrics.totalElecUnits.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">หน่วย</span>
          </p>
          <p className="text-[11px] text-slate-500">
            จดแล้ว {metrics.recorded} ห้อง
          </p>
        </div>

        {/* Anomaly & Invoiced Card */}
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> ตรวจสอบความผิดปกติ
            </span>
            <span className="text-[10px] text-slate-400">
              ล็อกแล้ว {metrics.locked} ห้อง
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {metrics.anomalyCount > 0 ? (
              <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                พบ {metrics.anomalyCount} รายการสูงกว่าปกติ 3 เท่า
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                หน่วยการใช้งานอยู่ในเกณฑ์ปกติ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterTab === "all"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ทั้งหมด ({rows.length})
          </button>
          <button
            onClick={() => setFilterTab("pending")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterTab === "pending"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ยังไม่จด ({metrics.pending})
          </button>
          <button
            onClick={() => setFilterTab("recorded")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterTab === "recorded"
                ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            จดแล้ว ({metrics.recorded})
          </button>
          <button
            onClick={() => setFilterTab("anomaly")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterTab === "anomaly"
                ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ผิดปกติ &gt;3x ({metrics.anomalyCount})
          </button>
          <button
            onClick={() => setFilterTab("locked")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterTab === "locked"
                ? "bg-slate-700 text-white font-bold shadow-md"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Lock className="w-3 h-3 inline mr-1" />
            ออกบิลแล้ว ({metrics.locked})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาเลขห้อง หรือผู้เช่า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onInput={handleEmojiInput}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-300 font-bold tracking-wider">
                <th className="py-3 px-4 w-28">ห้องพัก</th>
                <th className="py-3 px-4 w-44">ผู้เช่าหลัก</th>
                <th className="py-3 px-4 bg-blue-950/20 text-blue-300 border-x border-slate-800" colSpan={3}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-blue-400" /> มิเตอร์น้ำประปา
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (ก่อนหน้า → ปัจจุบัน = หน่วยใช้)
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 bg-amber-950/20 text-amber-300 border-x border-slate-800" colSpan={3}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> มิเตอร์ไฟฟ้า
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (ก่อนหน้า → ปัจจุบัน = หน่วยใช้)
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3 w-40">หมายเหตุ</th>
                <th className="py-3 px-4 text-center w-28">สถานะ / บันทึก</th>
              </tr>
              <tr className="border-b border-slate-800 bg-[#080c15] text-[11px] text-slate-500">
                <th className="py-1 px-4">เลข / ชั้น</th>
                <th className="py-1 px-4">ชื่อ - นามสกุล</th>
                {/* Water subheaders */}
                <th className="py-1 px-3 text-right bg-blue-950/10 text-blue-400/80 w-24">ก่อนหน้า</th>
                <th className="py-1 px-3 text-center bg-blue-950/10 text-blue-400 w-28">ปัจจุบัน (จด)</th>
                <th className="py-1 px-3 text-center bg-blue-950/10 text-blue-300 w-20 border-r border-slate-800">
                  หน่วยใช้
                </th>
                {/* Electric subheaders */}
                <th className="py-1 px-3 text-right bg-amber-950/10 text-amber-400/80 w-24">ก่อนหน้า</th>
                <th className="py-1 px-3 text-center bg-amber-950/10 text-amber-400 w-28">ปัจจุบัน (จด)</th>
                <th className="py-1 px-3 text-center bg-amber-950/10 text-amber-300 w-20 border-r border-slate-800">
                  หน่วยใช้
                </th>
                <th className="py-1 px-3">บันทึกเพิ่มเติม</th>
                <th className="py-1 px-4 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Gauge className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    ไม่พบข้อมูลมิเตอร์ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const originalIndex = rows.findIndex((item) => item.roomId === r.roomId);

                  const waterPrevNum = parseInt(r.inputWaterPrev, 10) || 0;
                  const elecPrevNum = parseInt(r.inputElecPrev, 10) || 0;
                  const waterCurrNum = r.inputWaterCurr !== "" ? parseInt(r.inputWaterCurr, 10) : null;
                  const elecCurrNum = r.inputElecCurr !== "" ? parseInt(r.inputElecCurr, 10) : null;

                  const waterUnits =
                    waterCurrNum !== null ? Math.max(0, waterCurrNum - waterPrevNum) : 0;
                  const elecUnits =
                    elecCurrNum !== null ? Math.max(0, elecCurrNum - elecPrevNum) : 0;

                  const isWaterLower =
                    waterCurrNum !== null && waterCurrNum < waterPrevNum && !r.isAdminEditPrev;
                  const isElecLower =
                    elecCurrNum !== null && elecCurrNum < elecPrevNum && !r.isAdminEditPrev;

                  // ตรวจจับ 3x Anomaly
                  const isWaterAnomaly =
                    r.hasHistory && r.pastAvgWater > 0 && waterUnits > 3 * r.pastAvgWater;
                  const isElecAnomaly =
                    r.hasHistory && r.pastAvgElec > 0 && elecUnits > 3 * r.pastAvgElec;

                  const isRowRecorded = waterCurrNum !== null && elecCurrNum !== null;

                  return (
                    <tr
                      key={r.roomId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        r.isLocked ? "bg-slate-900/40 opacity-75" : ""
                      } ${isWaterAnomaly || isElecAnomaly ? "bg-amber-950/15" : ""}`}
                    >
                      {/* Room & Floor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{r.roomNo}</span>
                          <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-[#080c15] border border-slate-800">
                            ชั้น {r.floor}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{r.roomType}</span>
                      </td>

                      {/* Tenant Name */}
                      <td className="py-3 px-4">
                        {r.hasActiveContract ? (
                          <div>
                            <span className="font-bold text-slate-200 block truncate max-w-[150px]">
                              {r.tenantName}
                            </span>
                            <span className="text-[10px] text-emerald-400">สัญญาเปิดใช้งาน</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-500 block truncate max-w-[150px]">
                              {r.tenantName}
                            </span>
                            <span className="text-[10px] text-slate-600">ไม่มีสัญญาเช่า</span>
                          </div>
                        )}
                      </td>

                      {/* Water: Prev reading */}
                      <td className="py-3 px-3 text-right bg-blue-950/10">
                        {r.isAdminEditPrev ? (
                          <input
                            type="number"
                            min="0"
                            value={r.inputWaterPrev}
                            onChange={(e) =>
                              handleInputChange(originalIndex, "inputWaterPrev", e.target.value)
                            }
                            className="w-20 px-2 py-1 rounded bg-[#080c15] border border-blue-500 text-xs font-mono text-blue-300 text-right focus:outline-none"
                            title="แก้ไขเลขก่อนหน้า (OI-10)"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono text-blue-300 font-bold">{r.inputWaterPrev}</span>
                            {!r.isLocked && (
                              <button
                                type="button"
                                onClick={() => toggleAdminEditPrev(originalIndex)}
                                title="แก้ไขเลขก่อนหน้า (กรณีเปลี่ยนมิเตอร์ใหม่)"
                                className="text-slate-500 hover:text-blue-400 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Water: Current input */}
                      <td className="py-3 px-3 bg-blue-950/10">
                        <div className="relative">
                          <input
                            id={`water-input-${originalIndex}`}
                            type="number"
                            min="0"
                            step="1"
                            disabled={r.isLocked}
                            placeholder={r.inputWaterPrev}
                            value={r.inputWaterCurr}
                            onChange={(e) =>
                              handleInputChange(originalIndex, "inputWaterCurr", e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(e, originalIndex, "water")}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-center font-mono font-bold text-sm text-white focus:outline-none focus:ring-2 transition-all ${
                              r.isLocked
                                ? "bg-transparent text-slate-500 border-none"
                                : isWaterLower
                                ? "bg-red-950/40 border border-red-500 ring-1 ring-red-500 text-red-200"
                                : isWaterAnomaly
                                ? "bg-[#080c15] border border-amber-500/80 focus:ring-amber-500"
                                : "bg-[#080c15] border border-slate-800 focus:ring-blue-500"
                            }`}
                          />
                          {isWaterLower && (
                            <span className="block text-[10px] text-red-400 mt-0.5 text-center">
                              ต่ำกว่าเดิม
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Water: Units used */}
                      <td className="py-3 px-3 text-center bg-blue-950/10 border-r border-slate-800">
                        <span
                          className={`font-mono font-bold ${
                            waterCurrNum === null
                              ? "text-slate-600"
                              : isWaterAnomaly
                              ? "text-amber-400"
                              : "text-blue-300"
                          }`}
                        >
                          {waterCurrNum !== null ? waterUnits : "-"}
                        </span>
                        {isWaterAnomaly && (
                          <span
                            className="block text-[9px] text-amber-400 font-bold bg-amber-950/70 rounded px-1 mt-0.5"
                            title={`ค่าเฉลี่ย 3 เดือน: ~${Math.round(r.pastAvgWater)} หน่วย`}
                          >
                            &gt;3x ผิดปกติ
                          </span>
                        )}
                      </td>

                      {/* Electric: Prev reading */}
                      <td className="py-3 px-3 text-right bg-amber-950/10">
                        {r.isAdminEditPrev ? (
                          <input
                            type="number"
                            min="0"
                            value={r.inputElecPrev}
                            onChange={(e) =>
                              handleInputChange(originalIndex, "inputElecPrev", e.target.value)
                            }
                            className="w-20 px-2 py-1 rounded bg-[#080c15] border border-amber-500 text-xs font-mono text-amber-300 text-right focus:outline-none"
                            title="แก้ไขเลขก่อนหน้า (OI-10)"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono text-amber-300 font-bold">{r.inputElecPrev}</span>
                            {!r.isLocked && (
                              <button
                                type="button"
                                onClick={() => toggleAdminEditPrev(originalIndex)}
                                title="แก้ไขเลขก่อนหน้า (กรณีเปลี่ยนมิเตอร์ใหม่)"
                                className="text-slate-500 hover:text-amber-400 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Electric: Current input */}
                      <td className="py-3 px-3 bg-amber-950/10">
                        <div className="relative">
                          <input
                            id={`elec-input-${originalIndex}`}
                            type="number"
                            min="0"
                            step="1"
                            disabled={r.isLocked}
                            placeholder={r.inputElecPrev}
                            value={r.inputElecCurr}
                            onChange={(e) =>
                              handleInputChange(originalIndex, "inputElecCurr", e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(e, originalIndex, "elec")}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-center font-mono font-bold text-sm text-white focus:outline-none focus:ring-2 transition-all ${
                              r.isLocked
                                ? "bg-transparent text-slate-500 border-none"
                                : isElecLower
                                ? "bg-red-950/40 border border-red-500 ring-1 ring-red-500 text-red-200"
                                : isElecAnomaly
                                ? "bg-[#080c15] border border-amber-500/80 focus:ring-amber-500"
                                : "bg-[#080c15] border border-slate-800 focus:ring-amber-500"
                            }`}
                          />
                          {isElecLower && (
                            <span className="block text-[10px] text-red-400 mt-0.5 text-center">
                              ต่ำกว่าเดิม
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Electric: Units used */}
                      <td className="py-3 px-3 text-center bg-amber-950/10 border-r border-slate-800">
                        <span
                          className={`font-mono font-bold ${
                            elecCurrNum === null
                              ? "text-slate-600"
                              : isElecAnomaly
                              ? "text-amber-400"
                              : "text-amber-300"
                          }`}
                        >
                          {elecCurrNum !== null ? elecUnits : "-"}
                        </span>
                        {isElecAnomaly && (
                          <span
                            className="block text-[9px] text-amber-400 font-bold bg-amber-950/70 rounded px-1 mt-0.5"
                            title={`ค่าเฉลี่ย 3 เดือน: ~${Math.round(r.pastAvgElec)} หน่วย`}
                          >
                            &gt;3x ผิดปกติ
                          </span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          disabled={r.isLocked}
                          placeholder={r.isAdminEditPrev ? "ระบุเหตุผลเปลี่ยนมิเตอร์" : "หมายเหตุ (ถ้ามี)"}
                          value={r.inputNote}
                          onChange={(e) =>
                            handleInputChange(originalIndex, "inputNote", e.target.value)
                          }
                          onInput={handleEmojiInput}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#080c15] border border-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Status / Action */}
                      <td className="py-3 px-4 text-center">
                        {r.isLocked ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                              <Lock className="w-3 h-3 text-amber-400" />
                              ออกบิลแล้ว
                            </span>
                            <span className="text-[9px] text-slate-500 mt-0.5">
                              {r.invoiceNo}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveRow(originalIndex)}
                              disabled={isPending || r.rowStatus === "saving"}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                isRowRecorded
                                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                              }`}
                              title="บันทึกมิเตอร์ห้องนี้"
                            >
                              {r.rowStatus === "saving" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {isRowRecorded && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Shortcuts */}
        <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>
              <strong>คำแนะนำการใช้งาน:</strong> พิมพ์ตัวเลขแล้วกดปุ่ม <strong>Enter</strong> เพื่อเลื่อนไปยังช่องถัดไปได้ทันที
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>กฎ BR-04: เลขใหม่ ≥ เลขเก่า</span>
            <span>•</span>
            <span>UR-2.15: เตือนเมื่อ &gt; 3 เท่าค่าเฉลี่ย 3 เดือน</span>
          </div>
        </div>
      </div>
    </div>
  );
}
