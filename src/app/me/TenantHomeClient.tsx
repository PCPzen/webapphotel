"use client";

import Link from "next/link";
import {
  Building2,
  Calendar,
  CreditCard,
  Droplet,
  Zap,
  Home,
  Wrench,
  Receipt,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatThaiDate } from "@/lib/invoices";
import { formatRepairCategory, formatRepairStatus } from "@/lib/repairs";

export type TenantProfileData = {
  id: number;
  name: string;
  phone: string;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
  waterRate: number;
  electricRate: number;
  contractStartDate: string;
  contractEndDate: string;
  daysRemaining: number;
};

export type TenantInvoiceSummary = {
  id: number;
  invoiceNo: string;
  billingMonthThai: string;
  rentAmount: number;
  waterAmount: number;
  waterUnits: number;
  electricAmount: number;
  electricUnits: number;
  otherFee: number;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  dueDate: string;
  isOverdue: boolean;
};

export type TenantRepairSummary = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  reportedAt: string;
  completedAt?: string | null;
  resolutionNote?: string | null;
};

export type TenantBankInfo = {
  dormName: string;
  dormPhone: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  promptpayId: string;
};

export default function TenantHomeClient({
  tenant,
  latestInvoice,
  recentRepairs,
  bankInfo,
}: {
  tenant: TenantProfileData;
  latestInvoice: TenantInvoiceSummary | null;
  recentRepairs: TenantRepairSummary[];
  bankInfo: TenantBankInfo;
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b1120] p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-3.5 h-3.5" /> ห้องพัก {tenant.roomNo} (ชั้น {tenant.floor})
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              สวัสดีคุณ {tenant.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              ยินดีต้อนรับสู่ระบบพอร์ทัลผู้เช่า ติดตามบิลรายเดือนและแจ้งซ่อมบำรุงได้สะดวกตลอด 24 ชั่วโมง
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 p-4 rounded-2xl bg-[#080c15] border border-slate-800 text-xs">
            <div className="text-slate-400">สัญญาเช่าสิ้นสุด:</div>
            <div className="font-bold text-blue-400 text-sm">
              {formatThaiDate(tenant.contractEndDate)}
            </div>
            <div className="text-[11px] text-slate-400">
              (คงเหลืออีก {tenant.daysRemaining} วัน)
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Latest Invoice & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Invoice */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                ใบแจ้งหนี้รอบปัจจุบัน
              </h2>

              {latestInvoice && (
                <Link
                  href={`/me/invoices?tenantId=${tenant.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  ประวัติบิลทั้งหมด <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {latestInvoice ? (
              <div className="space-y-4">
                {/* Invoice Status & Amount Highlight */}
                <div className="p-5 rounded-2xl bg-[#080c15] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">รอบเดือน:</span>
                      <span className="text-xs font-bold text-white">{latestInvoice.billingMonthThai}</span>
                      <span className="text-slate-600">-</span>
                      <span className="text-xs font-mono text-slate-400">{latestInvoice.invoiceNo}</span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      ฿{latestInvoice.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>ครบกำหนดชำระ: {formatThaiDate(latestInvoice.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    {latestInvoice.balance <= 0 ? (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> ชำระครบถ้วนแล้ว
                      </span>
                    ) : latestInvoice.isOverdue ? (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> เกินกำหนดชำระ
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> รอการชำระเงิน
                      </span>
                    )}

                    {latestInvoice.balance > 0 && (
                      <span className="text-xs text-rose-400 font-bold">
                        ยอดที่ต้องชำระ: ฿{latestInvoice.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Itemized Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-1">
                    <span className="text-slate-400">ค่าเช่าห้อง</span>
                    <div className="font-bold text-white">
                      ฿{latestInvoice.rentAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-1">
                    <span className="text-slate-400">ค่าน้ำ ({latestInvoice.waterUnits} น.)</span>
                    <div className="font-bold text-white">
                      ฿{latestInvoice.waterAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-1">
                    <span className="text-slate-400">ค่าไฟ ({latestInvoice.electricUnits} น.)</span>
                    <div className="font-bold text-white">
                      ฿{latestInvoice.electricAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-1">
                    <span className="text-slate-400">อื่น ๆ / ค่าปรับ</span>
                    <div className="font-bold text-white">
                      ฿{(latestInvoice.otherFee + latestInvoice.lateFee).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>

                {/* Bank / Payment Instructions if unpaid */}
                {latestInvoice.balance > 0 && (
                  <div className="p-4 rounded-2xl bg-[#080c15] border border-blue-500/20 space-y-3">
                    <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      ช่องทางการชำระเงิน (โอนเงิน / PromptPay)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
                        <div className="text-slate-400">ธนาคาร: {bankInfo.bankName}</div>
                        <div className="text-white font-mono font-bold">{bankInfo.bankAccountNo}</div>
                        <div className="text-[11px] text-slate-400">{bankInfo.bankAccountName}</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
                        <div className="text-slate-400">พร้อมเพย์ (PromptPay ID):</div>
                        <div className="text-blue-400 font-mono font-bold text-sm">
                          {bankInfo.promptpayId}
                        </div>
                        <div className="text-[11px] text-slate-400">สแกนจ่ายได้ทุกแอปธนาคาร</div>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Link
                        href={`/invoices/${latestInvoice.id}/print`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-xl bg-[#0b1120] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-400" /> ดูใบแจ้งหนี้ฉบับเต็ม (A4)
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-[#080c15] border border-slate-800">
                ขณะนี้ยังไม่มีใบแจ้งหนี้รอบใหม่สำหรับห้องพักของคุณ
              </div>
            )}
          </div>

          {/* Recent Repairs */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                สถานะการแจ้งซ่อมห้องพัก
              </h2>

              <Link
                href={`/me/repairs/new?tenantId=${tenant.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950/50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> แจ้งซ่อมใหม่
              </Link>
            </div>

            <div className="space-y-3">
              {recentRepairs.map((r) => {
                const cat = formatRepairCategory(r.category);
                const st = formatRepairStatus(r.status);
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#080c15] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{r.title}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        แจ้งเมื่อ: {formatThaiDate(r.reportedAt)}
                        {r.resolutionNote && (
                          <span className="text-emerald-400 ml-2">- ผลซ่อม: {r.resolutionNote}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {recentRepairs.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-[#080c15] border border-slate-800">
                  ไม่มีรายการแจ้งซ่อมที่รอดำเนินการ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Room Info & Quick Contact */}
        <div className="space-y-6">
          {/* Room Details Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-400" /> ข้อมูลห้องพักของคุณ
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">หมายเลขห้อง:</span>
                <span className="font-bold text-white text-sm">ห้อง {tenant.roomNo}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ชั้น / ประเภท:</span>
                <span className="text-slate-200">ชั้น {tenant.floor} ({tenant.roomType})</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ค่าเช่ารายเดือน:</span>
                <span className="font-bold text-emerald-400">
                  ฿{tenant.baseRent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ค่าน้ำตามสัญญา:</span>
                <span className="text-slate-200">฿{tenant.waterRate.toFixed(2)} / หน่วย</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-slate-400">ค่าไฟตามสัญญา:</span>
                <span className="text-slate-200">฿{tenant.electricRate.toFixed(2)} / หน่วย</span>
              </div>
            </div>
          </div>

          {/* Office Contact Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" /> ติดต่อสำนักงานหอพัก
            </h2>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                หากต้องการสอบถามข้อมูล แจ้งปัญหาฉุกเฉิน หรือส่งหลักฐานการชำระเงิน สามารถติดต่อฝ่ายบริหารหอพักได้ที่:
              </p>

              <div className="p-3 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1.5">
                <div className="text-slate-400">โทรศัพท์สำนักงาน:</div>
                <a
                  href={`tel:${bankInfo.dormPhone}`}
                  className="text-base font-bold text-blue-400 hover:underline flex items-center gap-1.5 font-mono"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  {bankInfo.dormPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
