"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Printer,
  Droplets,
  Zap,
  Home,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import ReportTabs from "@/components/ReportTabs";

export type IncomeInvoiceItem = {
  id: number;
  invoiceNo: string;
  roomNo: string;
  tenantName: string;
  rentAmount: number;
  waterAmount: number;
  electricAmount: number;
  otherFee: number;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  dueDate: string;
};

export type IncomeReportData = {
  monthStr: string;
  prevMonthStr: string;
  nextMonthStr: string;
  thaiMonthName: string;
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
    invoiceCount: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
  };
  categories: {
    rent: number;
    water: number;
    electric: number;
    otherFee: number;
    lateFee: number;
  };
  payments: {
    transferAmount: number;
    cashAmount: number;
    otherAmount: number;
    paymentCount: number;
  };
  invoices: IncomeInvoiceItem[];
};

export default function IncomeReportClient({ data }: { data: IncomeReportData }) {
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "partial" | "unpaid">("all");

  const filteredInvoices = data.invoices.filter((inv) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  const totalCategorySum =
    data.categories.rent +
    data.categories.water +
    data.categories.electric +
    data.categories.otherFee +
    data.categories.lateFee;

  const rentPercent = totalCategorySum > 0 ? (data.categories.rent / totalCategorySum) * 100 : 0;
  const electricPercent = totalCategorySum > 0 ? (data.categories.electric / totalCategorySum) * 100 : 0;
  const waterPercent = totalCategorySum > 0 ? (data.categories.water / totalCategorySum) * 100 : 0;
  const otherPercent =
    totalCategorySum > 0 ? ((data.categories.otherFee + data.categories.lateFee) / totalCategorySum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <ReportTabs />

      {/* Header & Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            รายงานรายได้และการเงินประจำเดือน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สรุปยอดเรียกเก็บตามใบแจ้งหนี้ ยอดรับชำระจริง และสัดส่วนโครงสร้างรายได้
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month Navigator */}
          <div className="flex items-center bg-[#130f26] border border-violet-900/40 rounded-xl p-1 shadow-sm">
            <Link
              href={`/reports/income?month=${data.prevMonthStr}`}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <span className="px-3 text-xs sm:text-sm font-semibold text-violet-200">
              {data.thaiMonthName}
            </span>

            <Link
              href={`/reports/income?month=${data.nextMonthStr}`}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Billed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ยอดเรียกเก็บรวม</span>
            <Receipt className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ฿{data.summary.totalBilled.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>ออกบิลทั้งหมด {data.summary.invoiceCount} ห้อง</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121f24] to-[#0f191e] border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>ยอดรับชำระแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-tight">
            ฿{data.summary.totalPaid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <span>ชำระครบ {data.summary.paidCount} ห้อง ({data.summary.collectionRate.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#24151a] to-[#1b1014] border border-rose-900/30 shadow-md">
          <div className="flex items-center justify-between text-rose-400 text-xs mb-2">
            <span>ยอดยังค้างชำระ</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-300 tracking-tight">
            ฿{data.summary.totalOutstanding.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1">
            <span>ค้างชำระ {data.summary.unpaidCount + data.summary.partialCount} ห้อง</span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>อัตราจัดเก็บรายได้</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-300 tracking-tight">
            {data.summary.collectionRate.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, data.summary.collectionRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2-Columns Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (ค่าเช่า/น้ำ/ไฟ/อื่นๆ) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-400" /> โครงสร้างรายได้แยกตามหมวดหมู่
            </h2>
            <span className="text-xs text-slate-400">
              รวม ฿{totalCategorySum.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden">
            <div style={{ width: `${rentPercent}%` }} className="bg-violet-500" title="ค่าเช่า" />
            <div style={{ width: `${electricPercent}%` }} className="bg-amber-500" title="ค่าไฟ" />
            <div style={{ width: `${waterPercent}%` }} className="bg-cyan-500" title="ค่าน้ำ" />
            <div style={{ width: `${otherPercent}%` }} className="bg-emerald-500" title="อื่น ๆ" />
          </div>

          <div className="space-y-3 pt-2">
            {/* Rent */}
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">ค่าเช่าห้องพัก</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">
                  ฿{data.categories.rent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({rentPercent.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Electric */}
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">ค่าไฟฟ้า (มิเตอร์)</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">
                  ฿{data.categories.electric.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({electricPercent.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Water */}
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">ค่าน้ำประปา (มิเตอร์)</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">
                  ฿{data.categories.water.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({waterPercent.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Other & Late Fees */}
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">ค่าบริการอื่น & ค่าปรับล่าช้า</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">
                  ฿{(data.categories.otherFee + data.categories.lateFee).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">({otherPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Channels & Cash Flow */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-400" /> ช่องทางการรับชำระเงินจริง
            </h2>
            <span className="text-xs text-slate-400">
              บันทึก {data.payments.paymentCount} รายการ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Transfer / PromptPay */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>โอนเงินผ่านธนาคาร / QR</span>
              </div>
              <div className="text-lg font-bold text-indigo-300">
                ฿{data.payments.transferAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">
                {data.summary.totalPaid > 0
                  ? `${((data.payments.transferAmount / data.summary.totalPaid) * 100).toFixed(1)}% ของยอดรับจริง`
                  : "0%"}
              </div>
            </div>

            {/* Cash */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>เงินสด</span>
              </div>
              <div className="text-lg font-bold text-emerald-300">
                ฿{data.payments.cashAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">
                {data.summary.totalPaid > 0
                  ? `${((data.payments.cashAmount / data.summary.totalPaid) * 100).toFixed(1)}% ของยอดรับจริง`
                  : "0%"}
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-800/30 text-xs text-violet-200/90 leading-relaxed">
            💡 <strong>คำแนะนำ:</strong> สามารถตรวจสอบสลิปและใบเสร็จรับเงินเลขที่ RCP อย่างละเอียดได้ที่หน้า{" "}
            <Link href="/payments" className="text-violet-400 underline hover:text-violet-300">
              การรับชำระเงิน
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Details Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">รายละเอียดใบแจ้งหนี้ประจำเดือน</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดง {filteredInvoices.length} จาก {data.invoices.length} ห้อง
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ทั้งหมด ({data.invoices.length})
            </button>
            <button
              onClick={() => setFilterStatus("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "paid"
                  ? "bg-emerald-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ชำระแล้ว ({data.summary.paidCount})
            </button>
            <button
              onClick={() => setFilterStatus("partial")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "partial"
                  ? "bg-amber-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ชำระบางส่วน ({data.summary.partialCount})
            </button>
            <button
              onClick={() => setFilterStatus("unpaid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "unpaid"
                  ? "bg-rose-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ค้างชำระ ({data.summary.unpaidCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-left">
            <thead className="bg-black/40 text-slate-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-3">ห้อง</th>
                <th className="py-3 px-3">ผู้เช่า</th>
                <th className="py-3 px-3">เลขที่ใบแจ้งหนี้</th>
                <th className="py-3 px-3 text-right">ค่าเช่า</th>
                <th className="py-3 px-3 text-right">ค่าน้ำ</th>
                <th className="py-3 px-3 text-right">ค่าไฟ</th>
                <th className="py-3 px-3 text-right">อื่น ๆ/ปรับ</th>
                <th className="py-3 px-3 text-right">รวมเรียกเก็บ</th>
                <th className="py-3 px-3 text-right">ชำระแล้ว</th>
                <th className="py-3 px-3 text-right">คงค้าง</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">ห้อง {inv.roomNo}</td>
                  <td className="py-3 px-3 text-slate-300">{inv.tenantName}</td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-violet-400 hover:underline font-mono"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-mono">
                    {inv.rentAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-mono">
                    {inv.waterAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-mono">
                    {inv.electricAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-mono">
                    {(inv.otherFee + inv.lateFee).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white font-mono">
                    ฿{inv.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-mono">
                    ฿{inv.paidAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {inv.balance > 0 ? (
                      <span className="text-rose-400 font-semibold">
                        ฿{inv.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {inv.status === "paid" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ชำระแล้ว
                      </span>
                    )}
                    {inv.status === "partial" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        บางส่วน
                      </span>
                    )}
                    {inv.status === "unpaid" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ค้างชำระ
                      </span>
                    )}
                    {inv.status === "cancelled" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        ยกเลิก
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    ไม่พบรายการใบแจ้งหนี้ตามเงื่อนไขที่เลือก
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
