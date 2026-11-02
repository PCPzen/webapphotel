"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintReceiptClient({
  receiptNo,
  roomNo,
  isVoided,
}: {
  receiptNo: string;
  roomNo: string;
  isVoided: boolean;
}) {
  return (
    <div className="print:hidden sticky top-0 z-50 bg-[#080c15]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารายการรับชำระเงิน
        </Link>
        <span className="text-xs text-slate-400 hidden sm:inline">
          ใบเสร็จรับเงินห้อง <strong className="text-white">{roomNo}</strong> ({receiptNo})
        </span>
        {isVoided && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800">
            เอกสารถูกยกเลิก (VOID)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 transition-all hover:scale-105"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ใบเสร็จรับเงิน / PDF (A4)
        </button>
      </div>
    </div>
  );
}
