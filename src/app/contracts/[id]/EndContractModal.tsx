"use client";

import { useState } from "react";
import { endContract, cancelContract } from "@/actions/contracts";
import {
  AlertTriangle,
  X as CloseIcon,
  Calculator,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Trash2,
} from "lucide-react";

type ContractInfo = {
  id: number;
  roomNo: string;
  tenantName: string;
  deposit: number;
  unpaidBalance: number;
  hasInvoices: boolean;
};

export default function EndContractModal({
  contract,
  initiallyOpen = false,
}: {
  contract: ContractInfo;
  initiallyOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [movedOutDate, setMovedOutDate] = useState(new Date().toISOString().split("T")[0]);
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [exitNote, setExitNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // คำนวณสูตร BR-10 แบบ Real-time:
  const D = contract.deposit;
  const X = Math.max(0, damageAmount);
  const O = contract.unpaidBalance;

  const A = Math.max(0, D - X);
  const depositApplied = Math.min(A, O); // หักยอดค้าง
  const depositRefund = A - depositApplied; // เงินคืนผู้เช่า
  const tenantMustPayMore = O - depositApplied + Math.max(0, X - D); // ยอดที่ผู้เช่าต้องชำระเพิ่ม

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("movedOutDate", movedOutDate);
    formData.append("damageAmount", damageAmount.toString());
    formData.append("exitNote", exitNote);

    const res = await endContract(contract.id, formData);
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    }
  };

  const handleCancel = async () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสัญญานี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      setIsPending(true);
      const res = await cancelContract(contract.id);
      if (res?.error) {
        alert(res.error);
        setIsPending(false);
      }
    }
  };

  // Preset Test Cases from SRD 4.12
  const applyTestCase = (caseNum: 1 | 2 | 3) => {
    if (caseNum === 1) {
      setDamageAmount(0);
    } else if (caseNum === 2) {
      setDamageAmount(500);
    } else if (caseNum === 3) {
      setDamageAmount(6000);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/40 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
        >
          <Calculator className="w-4 h-4" /> สิ้นสุดสัญญา / คืนมัดจำ (BR-10)
        </button>

        {!contract.hasInvoices && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="ยกเลิกสัญญาที่สร้างผิดเมื่อยังไม่มีใบแจ้งหนี้ (SRD 4.10)"
          >
            <Trash2 className="w-3.5 h-3.5" /> ยกเลิกสัญญา
          </button>
        )}
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#120f24] rounded-3xl border border-violet-900/80 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  คำนวณคืนเงินมัดจำและสิ้นสุดสัญญา (BR-10)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ห้อง {contract.roomNo} • ผู้เช่า: {contract.tenantName}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-violet-950/40 text-zinc-400 hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input: วันที่ย้ายออก & ค่าเสียหาย */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">วันที่ย้ายออกจริง *</label>
                  <input
                    type="date"
                    required
                    value={movedOutDate}
                    onChange={(e) => setMovedOutDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    ค่าเสียหาย / ค่าทำความสะอาด (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={damageAmount}
                    onChange={(e) => setDamageAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* สูตรคำนวณตามกฎ BR-10 แบบ Live Preview */}
              <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/80 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-violet-950/60 pb-2">
                  <span className="font-bold text-violet-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> สรุปผลคำนวณตามสูตร BR-10
                  </span>
                  <span className="text-[10px] text-zinc-500">A = max(0, D - X)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[11px]">เงินมัดจำ (D):</span>
                    <p className="font-bold text-white text-sm">฿{D.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">ค่าเสียหาย (X):</span>
                    <p className="font-bold text-amber-300 text-sm">฿{X.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">ยอดค้างชำระรวม (O):</span>
                    <p className="font-bold text-red-400 text-sm">฿{O.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-violet-950/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* เงินคืนผู้เช่า */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                    <span className="text-[11px] text-emerald-400 font-semibold block">
                      เงินมัดจำที่ต้องคืนผู้เช่า:
                    </span>
                    <p className="text-xl font-black text-emerald-300 mt-0.5">
                      ฿{depositRefund.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      (หักค่าเสียหายและยอดค้างแล้ว)
                    </span>
                  </div>

                  {/* ยอดที่ผู้เช่าต้องจ่ายเพิ่ม */}
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40">
                    <span className="text-[11px] text-red-400 font-semibold block">
                      ยอดที่ผู้เช่าต้องชำระเพิ่ม:
                    </span>
                    <p className="text-xl font-black text-red-300 mt-0.5">
                      ฿{tenantMustPayMore.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      {tenantMustPayMore > 0 ? "กรณีมัดจำไม่พอหัก" : "ไม่มีค้างชำระเพิ่ม"}
                    </span>
                  </div>
                </div>
              </div>

              {/* หมายเหตุการย้ายออก */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">หมายเหตุตอนย้ายออก (Exit Note)</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ตรวจห้องเรียบร้อย คืนกุญแจครบ..."
                  value={exitNote}
                  onChange={(e) => setExitNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-violet-950/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50"
                >
                  {isPending ? "กำลังบันทึก..." : "ยืนยันสิ้นสุดสัญญาและคืนห้องพัก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
