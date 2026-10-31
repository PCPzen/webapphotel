"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Phone,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  Printer,
  FileText,
  Search,
  Building2,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import ReportTabs from "@/components/ReportTabs";
import { formatThaiDate } from "@/lib/invoices";

export type OverdueInvoiceItem = {
  id: number;
  invoiceNo: string;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantName: string;
  tenantPhone: string;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  billingMonthThai: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  lateFee: number;
  status: "unpaid" | "partial";
};

export type OverdueReportData = {
  totalOverdueBalance: number;
  totalOverdueInvoices: number;
  criticalOverdueCount: number;
  maxDaysOverdue: number;
  invoices: OverdueInvoiceItem[];
};

export default function OverdueReportClient({ data }: { data: OverdueReportData }) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "recent">("all");
  const [search, setSearch] = useState("");

  const filteredInvoices = useMemo(() => {
    return data.invoices.filter((inv) => {
      // Filter severity
      if (filterSeverity === "critical" && inv.daysOverdue <= 30) return false;
      if (filterSeverity === "warning" && (inv.daysOverdue < 8 || inv.daysOverdue > 30)) return false;
      if (filterSeverity === "recent" && inv.daysOverdue >= 8) return false;

      // Filter search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          inv.roomNo.toLowerCase().includes(q) ||
          inv.tenantName.toLowerCase().includes(q) ||
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.tenantPhone.includes(q)
        );
      }
      return true;
    });
  }, [data.invoices, filterSeverity, search]);

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <ReportTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            รายงานยอดค้างชำระและเร่งรัดหนี้สิน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ติดตามบิลที่เกินกำหนดชำระตามกฎ BR-07 พร้อมข้อมูลติดต่อผู้เช่าเพื่อเร่งรัดหนี้สิน
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium self-start sm:self-auto transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-violet-400" />
          <span>พิมพ์ใบทวงหนี้รวม</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Overdue Debt */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#291118] to-[#18090f] border border-rose-900/40 shadow-lg">
          <div className="flex items-center justify-between text-rose-300 text-xs mb-2">
            <span>ยอดหนี้ค้างรวม</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            ฿{data.totalOverdueBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            จากทั้งหมด {data.totalOverdueInvoices} บิลที่เกินกำหนด
          </div>
        </div>

        {/* Critical Overdue (>30 Days) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#241c12] to-[#1a140d] border border-amber-900/30 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>ค้างเกิน 30 วัน</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-300 tracking-tight">
            {data.criticalOverdueCount} <span className="text-xs font-normal text-slate-400">บิล</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            เสี่ยงหนี้สูญและต้องทำหนังสือเตือน
          </div>
        </div>

        {/* Max Days Overdue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>ค้างชำระนานที่สุด</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-violet-300 tracking-tight">
            {data.maxDaysOverdue} <span className="text-xs font-normal text-slate-400">วัน</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            นับจากกำหนด Due Date
          </div>
        </div>

        {/* Overdue Ratio */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>การดำเนินการ</span>
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-semibold text-white mt-1">
            พร้อมรับชำระ & คิดค่าปรับ
          </div>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2 font-medium"
          >
            ไปที่บันทึกรับเงิน <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">ตารางรายการหนี้ค้างชำระ</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {filteredInvoices.length} รายการ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาห้อง, ชื่อผู้เช่า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setFilterSeverity("all")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterSeverity === "all" ? "bg-violet-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterSeverity("critical")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterSeverity === "critical" ? "bg-rose-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                วิกฤต (&gt;30 วัน)
              </button>
              <button
                onClick={() => setFilterSeverity("warning")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterSeverity === "warning" ? "bg-amber-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                8-30 วัน
              </button>
              <button
                onClick={() => setFilterSeverity("recent")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterSeverity === "recent" ? "bg-cyan-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                1-7 วัน
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-left">
            <thead className="bg-black/40 text-slate-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-3">ห้อง</th>
                <th className="py-3 px-3">ผู้เช่า / ติดต่อ</th>
                <th className="py-3 px-3">เลขที่บิล</th>
                <th className="py-3 px-3">รอบเดือน</th>
                <th className="py-3 px-3">กำหนดชำระ</th>
                <th className="py-3 px-3 text-center">เกินกำหนด</th>
                <th className="py-3 px-3 text-right">ยอดบิล</th>
                <th className="py-3 px-3 text-right">ชำระแล้ว</th>
                <th className="py-3 px-3 text-right">ยอดคงค้าง</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">
                    <Link href={`/rooms/${inv.roomId}`} className="hover:text-violet-300 hover:underline">
                      ห้อง {inv.roomNo}
                    </Link>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-white font-medium">{inv.tenantName}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <a
                        href={`tel:${inv.tenantPhone}`}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {inv.tenantPhone}
                      </a>
                      {inv.emergencyPhone && (
                        <span className="text-slate-500 text-[10px]" title={`ฉุกเฉิน: ${inv.emergencyName || ""}`}>
                          (ฉุกเฉิน: {inv.emergencyPhone})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono text-violet-400 hover:underline flex items-center gap-1"
                    >
                      {inv.invoiceNo}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </Link>
                  </td>

                  <td className="py-3 px-3 text-slate-300">{inv.billingMonthThai}</td>

                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {formatThaiDate(inv.dueDate)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {inv.daysOverdue > 30 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        {inv.daysOverdue} วัน
                      </span>
                    ) : inv.daysOverdue >= 8 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {inv.daysOverdue} วัน
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {inv.daysOverdue} วัน
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    ฿{inv.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    ฿{inv.paidAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                    ฿{inv.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <Link
                      href={`/payments?invoiceId=${inv.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                    >
                      <CreditCard className="w-3 h-3" /> รับชำระ
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    🎉 ไม่มียอดหนี้ค้างชำระตามเงื่อนไขที่เลือก
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
