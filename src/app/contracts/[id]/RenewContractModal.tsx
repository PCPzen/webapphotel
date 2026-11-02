"use client";

import { useState } from "react";
import { renewContract } from "@/actions/contracts";
import {
  RefreshCw,
  X as CloseIcon,
  Calendar,
  AlertCircle,
  Gauge,
} from "lucide-react";
import { handleEmojiInput } from "@/lib/emoji";

type RenewContractInfo = {
  id: number;
  roomNo: string;
  tenantName: string;
  currentEndDate: string;
  monthlyRent: number;
  deposit: number;
  waterRate: number;
  electricRate: number;
  lateFee: number;
  dueDay: number;
  startWaterMeter?: number | null;
  startElectricMeter?: number | null;
  keyCount?: number | null;
  keyCardCount?: number | null;
};

export default function RenewContractModal({
  contract,
}: {
  contract: RenewContractInfo;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // คำนวณวันเริ่มต้นสัญญาใหม่ (วันถัดจากวันหมดอายุสัญญาเดิม)
  const computeInitialStartDate = () => {
    const end = new Date(contract.currentEndDate);
    if (isNaN(end.getTime())) return new Date().toISOString().split("T")[0];
    const nextDay = new Date(end);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split("T")[0];
  };

  const initialStart = computeInitialStartDate();
  const [startDate, setStartDate] = useState(initialStart);

  // วันสิ้นสุดเริ่มต้น: +1 ปี
  const computeInitialEndDate = (startStr: string) => {
    const s = new Date(startStr);
    if (isNaN(s.getTime())) return "";
    const e = new Date(s);
    e.setFullYear(e.getFullYear() + 1);
    return e.toISOString().split("T")[0];
  };

  const [endDate, setEndDate] = useState(computeInitialEndDate(initialStart));
  const [monthlyRent, setMonthlyRent] = useState<number>(contract.monthlyRent);
  const [deposit, setDeposit] = useState<number>(contract.deposit);
  const [startWaterMeter, setStartWaterMeter] = useState<number>(contract.startWaterMeter || 0);
  const [startElectricMeter, setStartElectricMeter] = useState<number>(contract.startElectricMeter || 0);
  const [renewNote, setRenewNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDurationMonths = (months: number) => {
    const s = new Date(startDate);
    if (!isNaN(s.getTime())) {
      const e = new Date(s);
      e.setMonth(e.getMonth() + months);
      setEndDate(e.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("monthlyRent", monthlyRent.toString());
    formData.append("deposit", deposit.toString());
    formData.append("waterRate", contract.waterRate.toString());
    formData.append("electricRate", contract.electricRate.toString());
    formData.append("lateFee", contract.lateFee.toString());
    formData.append("dueDay", contract.dueDay.toString());
    formData.append("startWaterMeter", startWaterMeter.toString());
    formData.append("startElectricMeter", startElectricMeter.toString());
    formData.append("keyCount", (contract.keyCount || 1).toString());
    formData.append("keyCardCount", (contract.keyCardCount || 0).toString());
    formData.append("renewNote", renewNote);

    const res = await renewContract(contract.id, formData);
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition-all hover:scale-105"
      >
        <RefreshCw className="w-4 h-4 text-blue-400" />
        ต่ออายุสัญญาเช่า (Renew)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl border border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ต่ออายุสัญญาเช่า</h3>
                  <p className="text-xs text-slate-400">
                    ห้อง <strong className="text-white">{contract.roomNo}</strong> •{" "}
                    {contract.tenantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info banner */}
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-blue-300">
                  ระบบยกยอดเงินประกันอัตโนมัติ
                </p>
                <p className="text-[11px] text-slate-400">
                  สัญญาเดิม (#CTR-{contract.id}) จะถูกบันทึกว่าสิ้นสุดเนื่องจากต่อสัญญา และระบบจะสร้างสัญญาฉบับใหม่ที่ต่อเนื่องกันทันทีโดยไม่ต้องคืนเงินมัดจำ
                </p>
              </div>

              {/* Date selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    กำหนดระยะเวลาสัญญาใหม่
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDurationMonths(6)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors"
                    >
                      +6 เดือน
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationMonths(12)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors"
                    >
                      +1 ปี
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">วันเริ่มสัญญาใหม่</span>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">วันสิ้นสุดสัญญาใหม่</span>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial values */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    อัตราค่าเช่าใหม่ (บาท/เดือน)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    เงินประกันยกยอดมา (บาท)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={deposit}
                    onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Meter readings baseline for the renewed period */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#080c15] border border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  เลขมิเตอร์ ณ วันต่อสัญญา
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-blue-400">มิเตอร์น้ำล่าสุด</span>
                    <input
                      type="number"
                      min="0"
                      value={startWaterMeter}
                      onChange={(e) => setStartWaterMeter(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b1120] border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-amber-400">มิเตอร์ไฟล่าสุด</span>
                    <input
                      type="number"
                      min="0"
                      value={startElectricMeter}
                      onChange={(e) => setStartElectricMeter(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b1120] border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">หมายเหตุการต่อสัญญา</label>
                <input
                  type="text"
                  placeholder="เช่น ผู้เช่าขอต่อสัญญา 1 ปี ปรับค่าเช่าตามเงื่อนไขใหม่..."
                  value={renewNote}
                  onChange={(e) => setRenewNote(e.target.value)}
                  onInput={handleEmojiInput}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  {isPending ? "กำลังบันทึกต่ออายุสัญญา..." : "ยืนยันต่ออายุสัญญาเช่า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
