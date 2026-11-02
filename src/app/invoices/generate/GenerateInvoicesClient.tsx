"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ExternalLink,
  X,
} from "lucide-react";
import { generateInvoicesBatch, GenerateInvoiceItemInput } from "@/actions/invoices";
import { roundHalfUp } from "@/lib/invoices";
import { handleEmojiInput } from "@/lib/emoji";

export type ReadyInvoiceRoom = {
  contractId: number;
  roomId: number;
  roomNo: string;
  floor: number;
  roomType: string;
  tenantName: string;
  tenantPhone: string;
  monthlyRent: number;
  waterRate: number;
  electricRate: number;
  dueDay: number;
  meterReadingId: number;
  waterPrev: number;
  waterCurr: number;
  waterUnits: number;
  elecPrev: number;
  elecCurr: number;
  elecUnits: number;
};

export type AlreadyGeneratedInvoice = {
  invoiceId: number;
  invoiceNo: string;
  roomNo: string;
  tenantName: string;
  totalAmount: number;
  status: string;
};

export type MissingMeterRoom = {
  contractId: number;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantName: string;
};

export default function GenerateInvoicesClient({
  monthStr,
  prevMonthStr,
  nextMonthStr,
  thaiMonthName,
  readyRooms,
  alreadyGenerated,
  missingMeterRooms,
}: {
  monthStr: string;
  prevMonthStr: string;
  nextMonthStr: string;
  thaiMonthName: string;
  readyRooms: ReadyInvoiceRoom[];
  alreadyGenerated: AlreadyGeneratedInvoice[];
  missingMeterRooms: MissingMeterRoom[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // สถานะการเลือกห้อง
  const [selectedContractIds, setSelectedContractIds] = useState<number[]>(() =>
    readyRooms.map((r) => r.contractId)
  );

  // ข้อมูลค่าใช้จ่ายอื่น ๆ ของแต่ละห้อง
  const [otherFees, setOtherFees] = useState<Record<number, { amount: string; note: string }>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // เลือกทั้งหมด / ยกเลิกทั้งหมด
  const handleToggleSelectAll = () => {
    if (selectedContractIds.length === readyRooms.length) {
      setSelectedContractIds([]);
    } else {
      setSelectedContractIds(readyRooms.map((r) => r.contractId));
    }
  };

  const handleToggleRoom = (contractId: number) => {
    setSelectedContractIds((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId]
    );
  };

  const handleOtherFeeChange = (contractId: number, field: "amount" | "note", val: string) => {
    setOtherFees((prev) => ({
      ...prev,
      [contractId]: {
        amount: field === "amount" ? val : prev[contractId]?.amount || "",
        note: field === "note" ? val : prev[contractId]?.note || "",
      },
    }));
  };

  // คำนวณยอดเงินรวมของห้องที่ถูกเลือก (ตามกฎ BR-05 Decimal Half-Up)
  const calculationSummary = useMemo(() => {
    let totalRent = 0;
    let totalWater = 0;
    let totalElectric = 0;
    let totalOther = 0;

    for (const r of readyRooms) {
      if (!selectedContractIds.includes(r.contractId)) continue;

      const waterAmt = roundHalfUp(r.waterUnits * r.waterRate, 2);
      const elecAmt = roundHalfUp(r.elecUnits * r.electricRate, 2);
      const otherAmt = roundHalfUp(parseFloat(otherFees[r.contractId]?.amount || "0") || 0, 2);

      totalRent += r.monthlyRent;
      totalWater += waterAmt;
      totalElectric += elecAmt;
      totalOther += otherAmt;
    }

    const grandTotal = roundHalfUp(totalRent + totalWater + totalElectric + totalOther, 2);

    return {
      selectedCount: selectedContractIds.length,
      totalRent,
      totalWater,
      totalElectric,
      totalOther,
      grandTotal,
    };
  }, [readyRooms, selectedContractIds, otherFees]);

  // สั่งออกใบแจ้งหนี้แบบ Batch
  const handleGenerate = () => {
    if (selectedContractIds.length === 0) {
      setFeedback({ type: "error", text: "กรุณาเลือกห้องพักที่ต้องการออกใบแจ้งหนี้อย่างน้อย 1 ห้อง" });
      return;
    }

    const payload: GenerateInvoiceItemInput[] = [];

    for (const contractId of selectedContractIds) {
      const room = readyRooms.find((r) => r.contractId === contractId);
      if (!room) continue;

      const otherAmt = parseFloat(otherFees[contractId]?.amount || "0");
      const otherNote = otherFees[contractId]?.note || undefined;

      payload.push({
        contractId,
        meterReadingId: room.meterReadingId,
        otherAmount: isNaN(otherAmt) ? 0 : Math.max(0, otherAmt),
        otherNote,
      });
    }

    startTransition(async () => {
      const res = await generateInvoicesBatch(monthStr, payload);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "ออกใบแจ้งหนี้สำเร็จ" });
        setTimeout(() => {
          router.push(`/invoices?month=${monthStr}`);
        }, 1200);
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาดในการออกใบแจ้งหนี้" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1120] rounded-3xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50 border border-blue-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">ออกใบแจ้งหนี้ประจำเดือน</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                สเต็ป 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              คำนวณค่าน้ำ-ไฟตามมิเตอร์ ค่าเช่า และออกใบแจ้งหนี้พร้อมกันทั้งหอพัก (BR-05 & BR-06)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้ารายการบิล
          </Link>
        </div>
      </div>

      {/* Month Switcher Bar */}
      <div className="bg-[#0b1120] rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">รอบบิลประจำเดือน:</span>
          <span className="text-base font-black text-white">{thaiMonthName}</span>
          <span className="text-xs font-mono text-slate-500">({monthStr})</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/generate?month=${prevMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            เดือนก่อนหน้า
          </Link>
          <Link
            href={`/invoices/generate`}
            className="px-3 py-1.5 rounded-xl bg-[#080c15] hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors"
          >
            เดือนปัจจุบัน
          </Link>
          <Link
            href={`/invoices/generate?month=${nextMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            เดือนถัดไป
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
              : "bg-red-950/40 border border-red-800/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Missing Meters Warning */}
      {missingMeterRooms.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <strong className="text-amber-900 dark:text-amber-300 block font-bold">
                มี {missingMeterRooms.length} ห้องที่ยังไม่ได้จดมิเตอร์น้ำ-ไฟประจำเดือนนี้
              </strong>
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                ห้องที่ยังไม่มีมิเตอร์จะถูกข้ามและไม่สามารถออกบิลได้:{" "}
                {missingMeterRooms.map((r) => r.roomNo).join(", ")}
              </span>
            </div>
          </div>
          <Link
            href={`/meters?month=${monthStr}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-500/40 transition-colors whitespace-nowrap self-start sm:self-center"
          >
            ไปจดมิเตอร์ห้องเหล่านี้
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 1. Main Ready Rooms Table */}
      <div className="bg-white dark:bg-[#0b1120] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              ห้องพักที่พร้อมออกบิล ({readyRooms.length} ห้อง)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ตรวจทานหน่วยน้ำ-ไฟ เพิ่มค่าใช้จ่ายอื่น ๆ (ถ้ามี) แล้วกดปุ่มออกใบแจ้งหนี้
            </p>
          </div>

          {readyRooms.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080c15] hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 transition-colors"
            >
              {selectedContractIds.length === readyRooms.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ยกเลิกเลือกทั้งหมด
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-500" />
                  เลือกทั้งหมด ({readyRooms.length})
                </>
              )}
            </button>
          )}
        </div>

        {readyRooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
            <p className="text-sm font-bold text-slate-300">
              ไม่มีห้องที่ค้างออกใบแจ้งหนี้สำหรับรอบเดือนนี้
            </p>
            <p className="text-xs text-slate-500">
              ทุกห้องอาจถูกออกบิลไปแล้ว หรือยังไม่ได้บันทึกมิเตอร์น้ำ-ไฟประจำเดือน
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#080c15] text-slate-400 font-bold">
                  <th className="py-2.5 px-4 w-12 text-center">เลือก</th>
                  <th className="py-2.5 px-3 w-28">ห้อง / ชั้น</th>
                  <th className="py-2.5 px-3 w-40">ผู้เช่าหลัก</th>
                  <th className="py-2.5 px-3 text-right w-24">ค่าเช่าห้อง</th>
                  <th className="py-2.5 px-3 bg-blue-950/20 text-blue-300 text-right w-36">
                    ค่าน้ำ (หน่วย x ฿)
                  </th>
                  <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 text-right w-36">
                    ค่าไฟ (หน่วย x ฿)
                  </th>
                  <th className="py-2.5 px-3 w-48">ค่าอื่น ๆ (บาท / รายละเอียด)</th>
                  <th className="py-2.5 px-4 text-right w-28 text-blue-400 font-black">
                    รวมสุทธิ (฿)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {readyRooms.map((r) => {
                  const isSelected = selectedContractIds.includes(r.contractId);
                  const waterAmt = roundHalfUp(r.waterUnits * r.waterRate, 2);
                  const elecAmt = roundHalfUp(r.elecUnits * r.electricRate, 2);
                  const otherAmt = roundHalfUp(
                    parseFloat(otherFees[r.contractId]?.amount || "0") || 0,
                    2
                  );
                  const rowTotal = roundHalfUp(
                    r.monthlyRent + waterAmt + elecAmt + otherAmt,
                    2
                  );

                  return (
                    <tr
                      key={r.contractId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-blue-950/15" : "opacity-60"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRoom(r.contractId)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-white text-sm block">{r.roomNo}</span>
                        <span className="text-[10px] text-slate-500">
                          ชั้น {r.floor} • {r.roomType}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block truncate max-w-[140px]">
                          {r.tenantName}
                        </span>
                        <span className="text-[10px] text-slate-500">โทร: {r.tenantPhone}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-300">
                        ฿{r.monthlyRent.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right bg-blue-950/10 font-mono">
                        <span className="text-blue-300 font-bold block">
                          ฿{waterAmt.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {r.waterUnits} หน่วย @฿{r.waterRate}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right bg-amber-950/10 font-mono">
                        <span className="text-amber-300 font-bold block">
                          ฿{elecAmt.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {r.elecUnits} หน่วย @฿{r.electricRate}
                        </span>
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={otherFees[r.contractId]?.amount || ""}
                            onChange={(e) =>
                              handleOtherFeeChange(r.contractId, "amount", e.target.value)
                            }
                            className="w-20 px-2 py-1 rounded bg-[#080c15] border border-slate-800 text-xs font-mono text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="เช่น ค่าส่วนกลาง, ค่าจอดรถ"
                            value={otherFees[r.contractId]?.note || ""}
                            onChange={(e) =>
                              handleOtherFeeChange(r.contractId, "note", e.target.value)
                            }
                            onInput={handleEmojiInput}
                            className="w-full px-2 py-1 rounded bg-[#080c15] border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-sm font-black text-blue-400">
                        ฿{rowTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Calculation Summary & Submit Box */}
        {readyRooms.length > 0 && (
          <div className="p-6 bg-[#0f172a] border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">เลือกออกบิล</span>
                <strong className="text-white text-sm">
                  {calculationSummary.selectedCount} / {readyRooms.length} ห้อง
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ค่าน้ำประปารวม</span>
                <strong className="text-blue-300 text-sm font-mono">
                  ฿{calculationSummary.totalWater.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ค่าไฟฟ้ารวม</span>
                <strong className="text-amber-300 text-sm font-mono">
                  ฿{calculationSummary.totalElectric.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ยอดเรียกเก็บรวมสุทธิ</span>
                <strong className="text-blue-400 text-base font-black font-mono">
                  ฿{calculationSummary.grandTotal.toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || calculationSummary.selectedCount === 0}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-xl shadow-blue-950/50 border border-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {isPending
                ? "กำลังออกใบแจ้งหนี้..."
                : `สร้างใบแจ้งหนี้ที่เลือก (${calculationSummary.selectedCount} ฉบับ)`}
            </button>
          </div>
        )}
      </div>

      {/* 2. Already Generated Invoices */}
      {alreadyGenerated.length > 0 && (
        <div className="bg-[#0b1120] rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ห้องที่ออกใบแจ้งหนี้ของรอบเดือนนี้ไปแล้ว ({alreadyGenerated.length} ห้อง)
            </h3>
            <Link
              href={`/invoices?month=${monthStr}`}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              ดูรายการใบแจ้งหนี้ทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alreadyGenerated.map((inv) => (
              <Link
                key={inv.invoiceId}
                href={`/invoices/${inv.invoiceId}`}
                className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">ห้อง {inv.roomNo}</span>
                    <span className="text-[10px] font-mono text-slate-500">{inv.invoiceNo}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                    {inv.tenantName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-blue-400 block">
                    ฿{inv.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">{inv.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
