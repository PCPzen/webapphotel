"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Zap,
  X,
} from "lucide-react";
import { applyLateFee } from "@/actions/invoices";
import { formatThaiDate } from "@/lib/invoices";
import { handleEmojiInput } from "@/lib/emoji";

export type InvoiceListItem = {
  id: number;
  invoiceNo: string;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  billingMonth: string;
  billingMonthThai: string;
  rentAmount: number;
  waterUnits: number;
  waterAmount: number;
  electricUnits: number;
  electricAmount: number;
  otherAmount: number;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  dueDateThai: string;
  isOverdue: boolean;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  issuedAt: string;
  contractLateFeeRate: number;
};

export default function InvoiceListClient({
  initialInvoices,
  monthStr,
  prevMonthStr,
  nextMonthStr,
  thaiMonthName,
}: {
  initialInvoices: InvoiceListItem[];
  monthStr?: string;
  prevMonthStr: string;
  nextMonthStr: string;
  thaiMonthName: string;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unpaid" | "partial" | "paid" | "overdue" | "cancelled"
  >("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // คำนวณภาพรวมสถิติ (Financial Metrics)
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let overdueCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;

      totalInvoiced += inv.totalAmount;
      totalPaid += inv.paidAmount;
      totalBalance += inv.balance;

      if (inv.isOverdue) overdueCount++;
      if (inv.status === "unpaid" || inv.status === "partial") unpaidCount++;
      if (inv.status === "paid") paidCount++;
    }

    return {
      totalCount: invoices.filter((i) => i.status !== "cancelled").length,
      totalInvoiced,
      totalPaid,
      totalBalance,
      overdueCount,
      unpaidCount,
      paidCount,
    };
  }, [invoices]);

  // กรองตามการค้นหาและแท็บสถานะ
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.roomNo.toLowerCase().includes(q) ||
        inv.tenantName.toLowerCase().includes(q) ||
        inv.tenantPhone.includes(q);

      if (!matchSearch) return false;

      if (statusFilter === "unpaid") return inv.status === "unpaid" && !inv.isOverdue;
      if (statusFilter === "partial") return inv.status === "partial";
      if (statusFilter === "paid") return inv.status === "paid";
      if (statusFilter === "overdue") return inv.isOverdue;
      if (statusFilter === "cancelled") return inv.status === "cancelled";

      return true;
    });
  }, [invoices, search, statusFilter]);

  // คิดค่าปรับล่าช้า (BR-09)
  const handleApplyLateFee = (invoiceId: number) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const confirmed = window.confirm(
      `ยืนยันคิดค่าปรับล่าช้าสำหรับบิลห้อง ${inv.roomNo} จำนวน ฿${inv.contractLateFeeRate.toLocaleString()} หรือไม่?\n(ตามกฎ BR-09 สามารถคิดค่าปรับได้เพียงครั้งเดียวต่อใบแจ้งหนี้)`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await applyLateFee(invoiceId);
      if (res.success) {
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === invoiceId
              ? {
                  ...item,
                  lateFee: item.contractLateFeeRate,
                  totalAmount: item.totalAmount + item.contractLateFeeRate,
                  balance: item.balance + item.contractLateFeeRate,
                }
              : item
          )
        );
        setFeedback({ type: "success", text: res.message || "คิดค่าปรับสำเร็จ" });
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1120] rounded-3xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50 border border-blue-500/30">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">ระบบใบแจ้งหนี้รายเดือน</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                สเต็ป 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              จัดการใบแจ้งหนี้ ติดตามยอดค้างชำระ และคำนวณค่าปรับตามกำหนดเวลา (BR-05, BR-06, BR-07, BR-09)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {monthStr && (
            <Link
              href={`/invoices/print?month=${monthStr}`}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              พิมพ์บิลทั้งเดือน A4
            </Link>
          )}

          <Link
            href={`/invoices/generate${monthStr ? `?month=${monthStr}` : ""}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 border border-blue-500/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            + ออกใบแจ้งหนี้รอบเดือน
          </Link>
        </div>
      </div>

      {/* Month Switcher Bar */}
      <div className="bg-[#0b1120] rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">รอบบิลประจำเดือน:</span>
          <span className="text-base font-black text-white">{thaiMonthName}</span>
          {monthStr && <span className="text-xs font-mono text-slate-500">({monthStr})</span>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices?month=${prevMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            เดือนก่อน
          </Link>
          <Link
            href="/invoices"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              !monthStr
                ? "bg-blue-600 text-white"
                : "bg-[#080c15] hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            ทุกล็อตบิล
          </Link>
          <Link
            href={`/invoices?month=${nextMonthStr}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            เดือนถัดไป
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ยอดเรียกเก็บรวม (Invoiced)</span>
          <p className="text-xl font-black text-white font-mono">
            ฿{metrics.totalInvoiced.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">ทั้งหมด {metrics.totalCount} ฉบับ</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ยอดรับชำระแล้ว (Paid)</span>
          <p className="text-xl font-black text-emerald-300 font-mono">
            ฿{metrics.totalPaid.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400/80">ชำระครบแล้ว {metrics.paidCount} ห้อง</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ยอดคงค้างรวม (Outstanding)</span>
          <p className="text-xl font-black text-rose-300 font-mono">
            ฿{metrics.totalBalance.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">รอชำระ {metrics.unpaidCount} ห้อง</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">เกินกำหนดชำระ (Overdue)</span>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-amber-300 font-mono">
              {metrics.overdueCount} <span className="text-xs font-normal text-slate-400">ห้อง</span>
            </p>
            {metrics.overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ต้องติดตาม
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">ตามกฎ BR-07 (วันปัจจุบัน &gt; due_date)</p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
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
            ทั้งหมด ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter("unpaid")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "unpaid"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            รอชำระ
          </button>
          <button
            onClick={() => setStatusFilter("partial")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "partial"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ชำระบางส่วน
          </button>
          <button
            onClick={() => setStatusFilter("overdue")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "overdue"
                ? "bg-rose-600 text-white font-bold shadow-md"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            เกินกำหนด ({metrics.overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ชำระแล้ว ({metrics.paidCount})
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล, เลขห้อง, หรือผู้เช่า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onInput={handleEmojiInput}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-300 font-bold">
                <th className="py-3.5 px-4 w-36">เลขที่บิล</th>
                <th className="py-3.5 px-3 w-28">ห้อง / ชั้น</th>
                <th className="py-3.5 px-3 w-36">ผู้เช่า</th>
                <th className="py-3.5 px-3 w-28">รอบเดือน</th>
                <th className="py-3.5 px-3 text-right w-24">ยอดรวม</th>
                <th className="py-3.5 px-3 text-right w-24 text-emerald-400">ชำระแล้ว</th>
                <th className="py-3.5 px-3 text-right w-24 text-rose-300">ค้างชำระ</th>
                <th className="py-3.5 px-3 w-32">ครบกำหนด</th>
                <th className="py-3.5 px-3 text-center w-28">สถานะ</th>
                <th className="py-3.5 px-4 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    ไม่พบรายการใบแจ้งหนี้ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      inv.isOverdue ? "bg-amber-950/15" : ""
                    } ${inv.status === "cancelled" ? "opacity-50 line-through" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-mono font-bold text-white hover:text-blue-400 transition-colors block"
                      >
                        {inv.invoiceNo}
                      </Link>
                      <span className="text-[10px] text-slate-500 block">
                        ออก {formatThaiDate(inv.issuedAt)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-black text-white block">ห้อง {inv.roomNo}</span>
                      <span className="text-[10px] text-slate-500">ชั้น {inv.floor}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200 block truncate max-w-[130px]">
                        {inv.tenantName}
                      </span>
                      <span className="text-[10px] text-slate-500">{inv.tenantPhone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-300">{inv.billingMonthThai}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ฿{inv.totalAmount.toLocaleString()}
                      {inv.lateFee > 0 && (
                        <span className="block text-[10px] text-amber-400">
                          (ปรับ ฿{inv.lateFee})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ฿{inv.paidAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-300">
                      ฿{inv.balance.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`block font-medium ${
                          inv.isOverdue ? "text-rose-400 font-bold" : "text-slate-300"
                        }`}
                      >
                        {inv.dueDateThai}
                      </span>
                      {inv.isOverdue && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 text-[9px] font-bold border border-rose-800/40">
                          เลยกำหนดชำระ
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {inv.status === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                        </span>
                      )}
                      {inv.status === "partial" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          ชำระบางส่วน
                        </span>
                      )}
                      {inv.status === "unpaid" && inv.isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="w-3 h-3" /> เกินกำหนด
                        </span>
                      )}
                      {inv.status === "unpaid" && !inv.isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <Clock className="w-3 h-3" /> รอชำระ
                        </span>
                      )}
                      {inv.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          ยกเลิกแล้ว
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="ดูรายละเอียดบิล"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}/print`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="พิมพ์ใบแจ้งหนี้ A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>

                        {/* ปุ่มคิดค่าปรับ BR-09 เมื่อเกินกำหนดและยังไม่คิด */}
                        {inv.isOverdue && inv.lateFee === 0 && inv.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleApplyLateFee(inv.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors"
                            title={`คิดค่าปรับล่าช้า (฿${inv.contractLateFeeRate})`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
