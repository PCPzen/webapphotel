"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  XCircle,
  X,
} from "lucide-react";
import { recordPayment, voidPayment } from "@/actions/payments";
import { formatPaymentMethod } from "@/lib/payments";
import { handleEmojiInput } from "@/lib/emoji";

export type PaymentListItem = {
  id: number;
  receiptNo: string;
  invoiceId: number;
  invoiceNo: string;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantName: string;
  tenantPhone: string;
  billingMonthThai: string;
  amount: number;
  method: "cash" | "bank_transfer" | "deposit_offset" | "other";
  paidAt: string;
  slipImageUrl?: string | null;
  referenceNote?: string | null;
  status: "valid" | "voided";
  voidReason?: string | null;
  voidedAt?: string | null;
};

export type UnpaidInvoiceOption = {
  id: number;
  invoiceNo: string;
  roomNo: string;
  floor: number;
  tenantName: string;
  billingMonthThai: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
};

export default function PaymentListClient({
  initialPayments,
  unpaidInvoices,
  preselectedInvoiceId,
}: {
  initialPayments: PaymentListItem[];
  unpaidInvoices: UnpaidInvoiceOption[];
  preselectedInvoiceId?: number;
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "bank_transfer" | "cash" | "deposit_offset" | "voided">("all");

  // Modal State: บันทึกรับชำระเงิน
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(Boolean(preselectedInvoiceId));
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number>(preselectedInvoiceId || (unpaidInvoices[0]?.id || 0));
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("bank_transfer");
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [referenceNote, setReferenceNote] = useState<string>("");
  const [slipImageUrl, setSlipImageUrl] = useState<string>("");

  // Modal State: ยกเลิกใบเสร็จ (Void)
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // หาบิลที่ถูกเลือก
  const currentInvoice = useMemo(() => {
    return unpaidInvoices.find((i) => i.id === selectedInvoiceId);
  }, [unpaidInvoices, selectedInvoiceId]);

  // เมื่อเปลี่ยนบิล ให้ตั้งค่ายอดเงินเริ่มต้นเป็นยอดค้าง
  const handleSelectInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    const target = unpaidInvoices.find((i) => i.id === id);
    if (target) {
      setAmount(target.balance.toString());
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalCollected = 0;
    let bankTransferCount = 0;
    let cashCount = 0;
    let voidedCount = 0;

    for (const p of payments) {
      if (p.status === "valid") {
        totalCollected += p.amount;
        if (p.method === "bank_transfer") bankTransferCount++;
        if (p.method === "cash") cashCount++;
      } else {
        voidedCount++;
      }
    }

    return {
      totalCollected,
      validCount: payments.filter((p) => p.status === "valid").length,
      bankTransferCount,
      cashCount,
      voidedCount,
    };
  }, [payments]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.receiptNo.toLowerCase().includes(q) ||
        p.invoiceNo.toLowerCase().includes(q) ||
        p.roomNo.toLowerCase().includes(q) ||
        p.tenantName.toLowerCase().includes(q) ||
        (p.referenceNote && p.referenceNote.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (methodFilter === "bank_transfer") return p.method === "bank_transfer" && p.status === "valid";
      if (methodFilter === "cash") return p.method === "cash" && p.status === "valid";
      if (methodFilter === "deposit_offset") return p.method === "deposit_offset" && p.status === "valid";
      if (methodFilter === "voided") return p.status === "voided";

      return true;
    });
  }, [payments, search, methodFilter]);

  // บันทึกการชำระเงิน
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFeedback({ type: "error", text: "กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0 บาท)" });
      return;
    }

    if (currentInvoice && amtNum > currentInvoice.balance) {
      setFeedback({
        type: "error",
        text: `จำนวนเงินที่ชำระ (฿${amtNum.toLocaleString()}) เกินยอดค้างชำระ (฿${currentInvoice.balance.toLocaleString()}) ตามกฎ BR-08`,
      });
      return;
    }

    const formData = new FormData();
    formData.append("invoiceId", selectedInvoiceId.toString());
    formData.append("amount", amtNum.toString());
    formData.append("method", method);
    formData.append("paidAt", paidAt);
    formData.append("referenceNote", referenceNote);
    formData.append("slipImageUrl", slipImageUrl);

    startTransition(async () => {
      const res = await recordPayment(formData);
      if (res.success && res.paymentId) {
        setIsRecordModalOpen(false);
        setFeedback({ type: "success", text: res.message || "บันทึกการชำระเงินสำเร็จ" });
        setTimeout(() => {
          router.push(`/payments/${res.paymentId}/receipt`);
        }, 1000);
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาดในการบันทึก" });
      }
    });
  };

  // ยกเลิกใบเสร็จ (Void)
  const handleConfirmVoid = () => {
    if (!voidingPaymentId) return;

    if (!voidReason.trim()) {
      setFeedback({ type: "error", text: "กรุณาระบุเหตุผลในการยกเลิกใบเสร็จ" });
      return;
    }

    startTransition(async () => {
      const res = await voidPayment(voidingPaymentId, voidReason);
      if (res.success) {
        setVoidingPaymentId(null);
        setVoidReason("");
        setFeedback({ type: "success", text: res.message || "ยกเลิกใบเสร็จเรียบร้อยแล้ว" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Payment Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1120] rounded-3xl border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50 border border-blue-500/30">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">ระบบรับชำระเงิน & ใบเสร็จ</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                สเต็ป 6
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              บันทึกการรับเงิน ออกใบเสร็จรับเงิน (RCP) และตรวจสอบสลิปโอนเงิน (BR-08, BR-11)
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (unpaidInvoices.length > 0) {
              handleSelectInvoice(unpaidInvoices[0].id);
            }
            setIsRecordModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 border border-blue-500/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          + บันทึกรับชำระเงินใหม่
        </button>
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ยอดรับชำระรวมทั้งหมด</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ฿{metrics.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500">ทั้งหมด {metrics.validCount} รายการสมบูรณ์</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">โอนผ่านธนาคาร</span>
          <p className="text-xl font-black text-blue-300 font-mono">
            {metrics.bankTransferCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
          <p className="text-[10px] text-slate-500">สแกนจ่าย / พร้อมเพย์</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ชำระด้วยเงินสด</span>
          <p className="text-xl font-black text-amber-300 font-mono">
            {metrics.cashCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
          <p className="text-[10px] text-slate-500">รับเงินสดหน้าเคาน์เตอร์</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">ยกเลิก / โมฆะ (Voided)</span>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-slate-400 font-mono">{metrics.voidedCount}</p>
            {metrics.voidedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-950/60 text-red-300 border border-red-800/40">
                ยกเลิกโดย Admin
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">เก็บร่องรอยตามกฎ BR-12</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setMethodFilter("all")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              methodFilter === "all"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ทั้งหมด ({payments.length})
          </button>
          <button
            onClick={() => setMethodFilter("bank_transfer")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              methodFilter === "bank_transfer"
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            โอนผ่านธนาคาร ({metrics.bankTransferCount})
          </button>
          <button
            onClick={() => setMethodFilter("cash")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              methodFilter === "cash"
                ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-950/60"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            เงินสด ({metrics.cashCount})
          </button>
          <button
            onClick={() => setMethodFilter("deposit_offset")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              methodFilter === "deposit_offset"
                ? "bg-blue-600 text-white font-bold shadow-md"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            หักเงินมัดจำ
          </button>
          <button
            onClick={() => setMethodFilter("voided")}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              methodFilter === "voided"
                ? "bg-slate-700 text-white font-bold shadow-md"
                : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ยกเลิกแล้ว ({metrics.voidedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาเลขใบเสร็จ, บิล, ห้อง, ผู้เช่า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onInput={handleEmojiInput}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b1120] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Payments Table */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-300 font-bold">
                <th className="py-3.5 px-4 w-40">เลขที่ใบเสร็จ</th>
                <th className="py-3.5 px-3 w-36">วันเวลาที่ชำระ</th>
                <th className="py-3.5 px-3 w-28">ห้อง / ชั้น</th>
                <th className="py-3.5 px-3 w-36">ผู้เช่า</th>
                <th className="py-3.5 px-3 w-36">อ้างอิงบิล</th>
                <th className="py-3.5 px-3 w-32">วิธีชำระ</th>
                <th className="py-3.5 px-3 text-right w-28">จำนวนเงิน (฿)</th>
                <th className="py-3.5 px-3 text-center w-24">สถานะ</th>
                <th className="py-3.5 px-4 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    ไม่พบรายการรับชำระเงินตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      p.status === "voided" ? "opacity-45 bg-slate-900/40" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      <Link
                        href={`/payments/${p.id}/receipt`}
                        className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                      >
                        {p.receiptNo}
                      </Link>
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {new Date(p.paidAt).toLocaleDateString("th-TH")}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(p.paidAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-black text-white block">ห้อง {p.roomNo}</span>
                      <span className="text-[10px] text-slate-500">ชั้น {p.floor}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200 block truncate max-w-[130px]">
                        {p.tenantName}
                      </span>
                      <span className="text-[10px] text-slate-500">{p.tenantPhone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <Link
                        href={`/invoices/${p.invoiceId}`}
                        className="font-mono text-slate-300 hover:text-blue-400 block font-semibold"
                      >
                        {p.invoiceNo}
                      </Link>
                      <span className="text-[10px] text-slate-500">{p.billingMonthThai}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#080c15] border border-slate-800 text-slate-300">
                        {formatPaymentMethod(p.method)}
                      </span>
                      {p.referenceNote && (
                        <span className="block text-[10px] text-slate-500 truncate max-w-[120px] mt-0.5" title={p.referenceNote}>
                          {p.referenceNote}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                      ฿{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {p.status === "valid" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" /> สมบูรณ์
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                          <XCircle className="w-3 h-3" /> ยกเลิก (Void)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/payments/${p.id}/receipt`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="ดูและพิมพ์ใบเสร็จรับเงิน A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>

                        {/* Void Button (Admin Only) */}
                        {p.status === "valid" && p.method !== "deposit_offset" && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoidingPaymentId(p.id);
                              setVoidReason("");
                            }}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-400 transition-colors"
                            title="ยกเลิกใบเสร็จ (Void)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* Modal 1: บันทึกรับชำระเงินใหม่ (New Payment Modal) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl border border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">บันทึกรับชำระเงิน</h3>
                  <p className="text-xs text-slate-400">
                    ออกใบเสร็จรับเงินเลขที่ RCP และอัปเดตสถานะบิลอัตโนมัติ (BR-08, BR-11)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">ไม่พบบิลที่มียอดค้างชำระในระบบ</p>
                <p className="text-xs text-slate-500">ทุกห้องได้ชำระเงินครบถ้วนเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <form onSubmit={handleRecordSubmit} className="space-y-4">
                {/* 1. เลือกใบแจ้งหนี้ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    เลือกใบแจ้งหนี้ที่ต้องการรับชำระ *
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleSelectInvoice(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        ห้อง {inv.roomNo} • คุณ {inv.tenantName} ({inv.invoiceNo} รอบ {inv.billingMonthThai}) - ค้าง ฿{inv.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* กล่องสรุปยอดค้างชำระของบิลที่เลือก */}
                {currentInvoice && (
                  <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ยอดบิลทั้งหมด:</span>
                      <span className="font-mono text-white font-bold">
                        ฿{currentInvoice.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ชำระแล้วก่อนหน้า:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        ฿{currentInvoice.paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-300 font-bold">ยอดคงค้างที่ต้องชำระ:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-rose-400">
                          ฿{currentInvoice.balance.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAmount(currentInvoice.balance.toString())}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-500/30"
                        >
                          ชำระเต็มจำนวน
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. จำนวนเงินที่รับชำระ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    จำนวนเงินที่รับชำระ (บาท) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                      ฿
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    รับชำระบางส่วนได้ โดยยอดเงินต้องไม่เกินยอดค้างคงเหลือ (กฎ BR-08)
                  </p>
                </div>

                {/* 3. วิธีการชำระเงิน & วันที่ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">วิธีการชำระเงิน *</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bank_transfer">โอนผ่านธนาคาร / สแกน QR</option>
                      <option value="cash">เงินสด</option>
                      <option value="other">อื่น ๆ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">วันและเวลาที่รับเงิน *</label>
                    <input
                      type="datetime-local"
                      required
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 4. หมายเลขอ้างอิง / หลักฐานสลิป */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    หมายเลขอ้างอิงสลิป / หมายเหตุ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    onInput={handleEmojiInput}
                    placeholder="เช่น เลขทำรายการ ธ.กสิกรไทย 14:32 น."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    ลิงก์รูปสลิปโอนเงิน (URL รูปภาพ ถ้ามี)
                  </label>
                  <input
                    type="url"
                    value={slipImageUrl}
                    onChange={(e) => setSlipImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isPending ? "กำลังบันทึกและออกใบเสร็จ..." : "ยืนยันรับชำระเงินและออกใบเสร็จ"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: ยกเลิกใบเสร็จ (Void Modal) */}
      {voidingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl border border-red-950/80 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> ยกเลิกใบเสร็จรับเงิน (Void)
            </h3>
            <p className="text-xs text-slate-300">
              ตามกฎ <strong className="text-white">BR-08 และ BR-12</strong> ระบบจะบันทึกสถานะเป็น{" "}
              <strong className="text-red-400">voided</strong> (ไม่ลบข้อมูลออกจากฐานข้อมูล)
              และจะคำนวณยอดค้างชำระของใบแจ้งหนี้ใหม่ให้อัตโนมัติ
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">เหตุผลในการยกเลิก *</label>
              <input
                type="text"
                required
                placeholder="เช่น ผู้เช่าโอนเงินผิดบัญชี, คีย์ตัวเลขรับชำระผิด"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                onInput={handleEmojiInput}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVoidingPaymentId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg"
              >
                {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิกใบเสร็จ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
