"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Printer,
  Calendar,
  Building2,
  User,
  Droplet,
  Zap,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  XCircle,
  Sparkles,
  Receipt,
  Landmark,
  X,
} from "lucide-react";
import { updateInvoiceOtherFee, applyLateFee, cancelInvoice } from "@/actions/invoices";
import { handleEmojiInput } from "@/lib/emoji";

export type InvoiceDetailData = {
  id: number;
  invoiceNo: string;
  billingMonth: string;
  billingMonthThai: string;
  issuedAt: string;
  dueDate: string;
  dueDateThai: string;
  isOverdue: boolean;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  rentAmount: number;
  waterUnits: number;
  waterRate: number;
  waterAmount: number;
  waterPrev: number;
  waterCurr: number;
  electricUnits: number;
  electricRate: number;
  electricAmount: number;
  elecPrev: number;
  elecCurr: number;
  otherAmount: number;
  otherNote: string | null;
  lateFee: number;
  contractLateFeeRate: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  room: {
    id: number;
    roomNo: string;
    floor: number;
    roomType: string;
  };
  tenant: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    idCardNoMasked: string;
    coTenantName?: string | null;
    vehicleInfo?: string | null;
  };
  contractId: number;
  payments: {
    id: number;
    receiptNo: string;
    amount: number;
    method: string;
    paidAt: string;
    referenceNote?: string | null;
  }[];
  dormSettings: {
    dormName: string;
    dormAddress?: string | null;
    dormPhone?: string | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankAccountName?: string | null;
    promptpayId?: string | null;
  };
};

export default function InvoiceDetailClient({ invoice }: { invoice: InvoiceDetailData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals
  const [isEditOtherOpen, setIsEditOtherOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // คิดค่าปรับล่าช้า (BR-09)
  const handleApplyLateFee = () => {
    const confirmed = window.confirm(
      `ยืนยันคิดค่าปรับล่าช้าสำหรับบิลนี้จำนวน ฿${invoice.contractLateFeeRate.toLocaleString()} หรือไม่?\n(ตามกฎ BR-09 สามารถคิดค่าปรับได้เพียงครั้งเดียวต่อใบแจ้งหนี้)`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await applyLateFee(invoice.id);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "คิดค่าปรับสำเร็จ" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  // ยกเลิกบิล
  const handleCancelInvoice = () => {
    startTransition(async () => {
      const res = await cancelInvoice(invoice.id, cancelReason);
      if (res.success) {
        setIsCancelOpen(false);
        setFeedback({ type: "success", text: res.message || "ยกเลิกใบแจ้งหนี้สำเร็จ" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  const canEditOther = invoice.status === "unpaid" && invoice.payments.length === 0;
  const canCancel = invoice.status !== "cancelled" && invoice.payments.length === 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการใบแจ้งหนี้
        </Link>
      </div>

      {/* Top Banner Card */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-950/50 border border-blue-500/30">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{invoice.invoiceNo}</h1>
                {invoice.status === "paid" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                  </span>
                )}
                {invoice.status === "partial" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    ชำระบางส่วน
                  </span>
                )}
                {invoice.status === "unpaid" && invoice.isOverdue && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> เกินกำหนดชำระ
                  </span>
                )}
                {invoice.status === "unpaid" && !invoice.isOverdue && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> รอชำระ
                  </span>
                )}
                {invoice.status === "cancelled" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    ยกเลิกแล้ว
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ห้อง {invoice.room.roomNo} (ชั้น {invoice.room.floor}) • รอบบิลประจำเดือน{" "}
                <strong className="text-slate-200">{invoice.billingMonthThai}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/invoices/${invoice.id}/print`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              พิมพ์ใบแจ้งหนี้ A4
            </Link>

            {/* Quick Link to Step 6 Payments */}
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Link
                href={`/payments?invoiceId=${invoice.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/40 border border-blue-500/30 transition-all hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                รับชำระเงิน (สเต็ป 6)
              </Link>
            )}

            {/* Apply Late Fee Button (BR-09) */}
            {invoice.isOverdue && invoice.lateFee === 0 && invoice.status !== "cancelled" && (
              <button
                type="button"
                onClick={handleApplyLateFee}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                คิดค่าปรับ (฿{invoice.contractLateFeeRate})
              </button>
            )}

            {/* Cancel Button */}
            {canCancel && (
              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-bold border border-red-800/40 transition-colors"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                ยกเลิกบิล
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
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

        {/* Financial Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ยอดรวมเรียกเก็บสุทธิ</span>
            <p className="text-xl font-black text-white font-mono">
              ฿{invoice.totalAmount.toLocaleString()}
            </p>
            {invoice.lateFee > 0 && (
              <span className="text-[10px] text-amber-400 block font-medium">
                (รวมค่าปรับ ฿{invoice.lateFee.toLocaleString()})
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ชำระแล้ว</span>
            <p className="text-xl font-black text-emerald-400 font-mono">
              ฿{invoice.paidAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ยอดคงค้างชำระ</span>
            <p className="text-xl font-black text-rose-400 font-mono">
              ฿{invoice.balance.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ครบกำหนดชำระ</span>
            <p className={`text-sm font-bold ${invoice.isOverdue ? "text-rose-400" : "text-slate-200"}`}>
              {invoice.dueDateThai}
            </p>
            {invoice.isOverdue && (
              <span className="text-[10px] text-rose-400 font-bold block">
                เกินกำหนดชำระแล้ว
              </span>
            )}
          </div>
        </div>

        {/* Invoice Items Breakdown (BR-05) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              รายละเอียดรายการในใบแจ้งหนี้ (คำนวณตามสูตร BR-05)
            </h3>
            {canEditOther && (
              <button
                type="button"
                onClick={() => setIsEditOtherOpen(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> แก้ไขค่าใช้จ่ายอื่น ๆ
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#080c15]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-400 font-bold">
                  <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-4">รายการ</th>
                  <th className="py-2.5 px-4 text-center">รายละเอียด / การคำนวณ</th>
                  <th className="py-2.5 px-4 text-right">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* 1. ค่าเช่าห้อง */}
                <tr>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">1</td>
                  <td className="py-3 px-4 font-bold text-white">ค่าเช่าห้องพักประจำเดือน</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    อัตราตามสัญญาเช่า (ห้อง {invoice.room.roomNo})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    ฿{invoice.rentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 2. ค่าน้ำประปา */}
                <tr>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">2</td>
                  <td className="py-3 px-4 font-bold text-blue-300 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" /> ค่าน้ำประปา
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                    มิเตอร์: {invoice.waterPrev} → {invoice.waterCurr} ={" "}
                    <strong className="text-blue-300">{invoice.waterUnits} หน่วย</strong> @฿
                    {invoice.waterRate}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-300">
                    ฿{invoice.waterAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 3. ค่าไฟฟ้า */}
                <tr>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">3</td>
                  <td className="py-3 px-4 font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> ค่ากระแสไฟฟ้า
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                    มิเตอร์: {invoice.elecPrev} → {invoice.elecCurr} ={" "}
                    <strong className="text-amber-300">{invoice.electricUnits} หน่วย</strong> @฿
                    {invoice.electricRate}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                    ฿{invoice.electricAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 4. ค่าอื่น ๆ (ถ้ามี) */}
                {invoice.otherAmount > 0 && (
                  <tr>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">4</td>
                    <td className="py-3 px-4 font-bold text-blue-300">
                      ค่าใช้จ่ายอื่น ๆ {invoice.otherNote ? `(${invoice.otherNote})` : ""}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">ค่าบริการเพิ่มเติม</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-300">
                      ฿{invoice.otherAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* 5. ค่าปรับล่าช้า (ถ้ามี) */}
                {invoice.lateFee > 0 && (
                  <tr className="bg-amber-950/20">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">#</td>
                    <td className="py-3 px-4 font-bold text-amber-400">ค่าปรับชำระล่าช้า (BR-09)</td>
                    <td className="py-3 px-4 text-center text-amber-400/80">
                      เนื่องจากเลยวันครบกำหนดชำระ
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      ฿{invoice.lateFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr className="border-t-2 border-slate-800 bg-[#0f172a] font-black text-sm">
                  <td colSpan={3} className="py-3.5 px-4 text-right text-white">
                    ยอดรวมสุทธิทั้งสิ้น (Total Amount)
                  </td>
                  <td className="py-3.5 px-4 text-right text-blue-400 font-mono text-base">
                    ฿{invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Room, Tenant, & Payment Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Tenant Details */}
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> ข้อมูลผู้เช่า
            </span>
            <div className="space-y-1">
              <Link
                href={`/tenants/${invoice.tenant.id}`}
                className="font-bold text-white text-sm hover:text-blue-400 transition-colors block"
              >
                คุณ {invoice.tenant.firstName} {invoice.tenant.lastName}
              </Link>
              <p className="text-slate-400">เบอร์โทรศัพท์: {invoice.tenant.phone}</p>
              <p className="text-slate-500 font-mono">เลขบัตร ปชช.: {invoice.tenant.idCardNoMasked}</p>
              {invoice.tenant.coTenantName && (
                <p className="text-blue-300/80">รูมเมท: {invoice.tenant.coTenantName}</p>
              )}
              {invoice.tenant.vehicleInfo && (
                <p className="text-slate-400">ยานพาหนะ: {invoice.tenant.vehicleInfo}</p>
              )}
            </div>
          </div>

          {/* Dormitory Bank / PromptPay Details */}
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" /> ช่องทางการชำระเงินของหอพัก
            </span>
            <div className="space-y-1 text-slate-300">
              <p className="font-bold text-white">{invoice.dormSettings.dormName}</p>
              {invoice.dormSettings.bankName && (
                <p>
                  ธนาคาร: <strong>{invoice.dormSettings.bankName}</strong> • เลขที่บัญชี:{" "}
                  <strong className="font-mono text-emerald-300">
                    {invoice.dormSettings.bankAccountNo}
                  </strong>
                </p>
              )}
              {invoice.dormSettings.bankAccountName && (
                <p className="text-slate-400 text-[11px]">
                  ชื่อบัญชี: {invoice.dormSettings.bankAccountName}
                </p>
              )}
              {invoice.dormSettings.promptpayId && (
                <p className="text-blue-300 font-mono text-[11px]">
                  พร้อมเพย์ (PromptPay): {invoice.dormSettings.promptpayId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment History List (If any) */}
        {invoice.payments.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> ประวัติการรับชำระเงินในบิลนี้ ({invoice.payments.length} รายการ)
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#080c15]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-400 font-bold">
                    <th className="py-2 px-4">เลขที่ใบเสร็จ</th>
                    <th className="py-2 px-4">วิธีชำระ</th>
                    <th className="py-2 px-4">วันเวลาที่รับเงิน</th>
                    <th className="py-2 px-4 text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-white">{p.receiptNo}</td>
                      <td className="py-2.5 px-4 text-slate-300 capitalize">{p.method}</td>
                      <td className="py-2.5 px-4 text-slate-400">{new Date(p.paidAt).toLocaleString("th-TH")}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ฿{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: แก้ไขค่าใช้จ่ายอื่น ๆ */}
      {isEditOtherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl border border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" /> แก้ไขค่าใช้จ่ายอื่น ๆ
            </h3>
            <p className="text-xs text-slate-400">
              กำหนดค่าบริการเพิ่มเติม เช่น ค่าส่วนกลาง, ค่าจอดรถ, ค่าคีย์การ์ด (สามารถแก้ได้ขณะสถานะยังไม่ชำระ)
            </p>

            <form
              action={async (formData) => {
                const res = await updateInvoiceOtherFee(invoice.id, formData);
                if (res.success) {
                  setIsEditOtherOpen(false);
                  setFeedback({ type: "success", text: res.message || "อัปเดตสำเร็จ" });
                  router.refresh();
                } else {
                  setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
                }
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="otherAmount"
                  defaultValue={invoice.otherAmount}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">รายละเอียด / หมายเหตุ</label>
                <input
                  type="text"
                  name="otherNote"
                  defaultValue={invoice.otherNote || ""}
                  placeholder="เช่น ค่าส่วนกลาง, ค่าจอดรถยนต์"
                  onInput={handleEmojiInput}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOtherOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันยกเลิกใบแจ้งหนี้ */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl border border-red-950/80 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> ยืนยันยกเลิกใบแจ้งหนี้
            </h3>
            <p className="text-xs text-slate-300">
              การยกเลิกใบแจ้งหนี้จะเปลี่ยนสถานะเป็น <strong className="text-red-400">cancelled</strong> และทำการ{" "}
              <strong>ปลดล็อกมิเตอร์น้ำ-ไฟ</strong> ของรอบเดือนนี้ เพื่อให้ออกใบแจ้งหนี้ใหม่ได้
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">ระบุเหตุผลการยกเลิก (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น จดมิเตอร์ผิด, ออกบิลซ้ำซ้อน"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onInput={handleEmojiInput}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleCancelInvoice}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg"
              >
                {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิกบิลนี้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
