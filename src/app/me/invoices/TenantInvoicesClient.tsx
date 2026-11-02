"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  DollarSign,
  Download,
  Info,
  X,
} from "lucide-react";
import { formatThaiDate } from "@/lib/invoices";

export type TenantInvoiceRecord = {
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
  paymentId?: number | null;
  receiptNo?: string | null;
};

export type BankDetails = {
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  promptpayId: string;
  dormPhone: string;
};

export default function TenantInvoicesClient({
  invoices,
  bankDetails,
  tenantId,
}: {
  invoices: TenantInvoiceRecord[];
  bankDetails: BankDetails;
  tenantId: number;
}) {
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<TenantInvoiceRecord | null>(null);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-400" />
            ประวัติใบแจ้งหนี้และใบเสร็จรับเงิน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ตรวจสอบรายการค่าเช่า ค่าน้ำ-ไฟรายเดือน และพิมพ์ใบเสร็จรับเงินอย่างเป็นทางการ
          </p>
        </div>

        {totalOutstanding > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <div>
              <div className="text-[11px] text-rose-300">ยอดยังค้างชำระทั้งหมด:</div>
              <div className="text-base font-black text-rose-400">
                ฿{totalOutstanding.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices List Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">รายการใบแจ้งหนี้ทั้งหมด ({invoices.length})</h2>
          <span className="text-xs text-slate-400">จัดเรียงจากเดือนล่าสุด</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f172a] text-slate-300 border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">รอบเดือน</th>
                <th className="py-3 px-3">เลขที่ใบแจ้งหนี้</th>
                <th className="py-3 px-3 text-right">ค่าเช่า</th>
                <th className="py-3 px-3 text-right">ค่าน้ำ</th>
                <th className="py-3 px-3 text-right">ค่าไฟ</th>
                <th className="py-3 px-3 text-right">อื่น ๆ / ปรับ</th>
                <th className="py-3 px-3 text-right">ยอดรวม</th>
                <th className="py-3 px-3 text-right">ยอดค้างจ่าย</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">เอกสาร / ชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#0f172a]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{inv.billingMonthThai}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{inv.invoiceNo}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {inv.rentAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300" title={`${inv.waterUnits} หน่วย`}>
                    {inv.waterAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300" title={`${inv.electricUnits} หน่วย`}>
                    {inv.electricAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(inv.otherFee + inv.lateFee).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white font-mono">
                    ฿{inv.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {inv.balance > 0 ? (
                      <span className="text-rose-400 font-bold">
                        ฿{inv.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {inv.status === "paid" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ชำระแล้ว
                      </span>
                    )}
                    {inv.status === "partial" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ชำระบางส่วน
                      </span>
                    )}
                    {inv.status === "unpaid" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ค้างชำระ
                      </span>
                    )}
                    {inv.status === "cancelled" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        ยกเลิก
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View / Print A4 Invoice */}
                      <Link
                        href={`/invoices/${inv.id}/print`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-[#080c15] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                        title="พิมพ์ใบแจ้งหนี้ (A4)"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                      </Link>

                      {/* View / Print A4 Official Receipt if paid */}
                      {inv.paymentId && (
                        <Link
                          href={`/payments/${inv.paymentId}/receipt`}
                          target="_blank"
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="ดูใบเสร็จรับเงิน (RCP)"
                        >
                          <Receipt className="w-3 h-3" /> ใบเสร็จ
                        </Link>
                      )}

                      {/* Pay Button if unpaid/partial */}
                      {inv.balance > 0 && (
                        <button
                          onClick={() => setSelectedPayInvoice(inv)}
                          className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-md shadow-blue-950/50 flex items-center gap-1 transition-colors"
                        >
                          <CreditCard className="w-3 h-3" /> ชำระเงิน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    ไม่พบรายการใบแจ้งหนี้สำหรับห้องพักของคุณ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal with Bank & PromptPay info */}
      {selectedPayInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ชำระค่าเช่าห้องพัก</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedPayInvoice.billingMonthThai} ({selectedPayInvoice.invoiceNo})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Balance to Pay */}
            <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 text-center space-y-1">
              <div className="text-xs text-slate-400">ยอดที่ต้องชำระ</div>
              <div className="text-2xl font-black text-white">
                ฿{selectedPayInvoice.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-amber-400">
                ครบกำหนด: {formatThaiDate(selectedPayInvoice.dueDate)}
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
                <div className="text-slate-400">โอนเข้าบัญชีธนาคาร:</div>
                <div className="font-bold text-white">{bankDetails.bankName}</div>
                <div className="font-mono text-base font-bold text-blue-400">
                  {bankDetails.bankAccountNo}
                </div>
                <div className="text-[11px] text-slate-400">{bankDetails.bankAccountName}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
                <div className="text-slate-400">หรือชำระผ่าน PromptPay (พร้อมเพย์):</div>
                <div className="font-mono text-base font-bold text-emerald-400">
                  {bankDetails.promptpayId}
                </div>
                <div className="text-[11px] text-slate-400">สแกนจ่ายได้ทุกแอปธนาคาร</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-blue-500/20 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">เมื่อโอนเงินเรียบร้อยแล้ว:</strong> กรุณาแจ้งหลักฐานสลิปการโอนเงินให้สำนักงานหอพักที่เบอร์{" "}
                <strong className="text-white">{bankDetails.dormPhone}</strong> เพื่อให้เจ้าหน้าที่ออกใบเสร็จรับเงิน (RCP) ในระบบ
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
