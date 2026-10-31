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
    <div className="print:hidden sticky top-0 z-50 bg-[#0c0a18]/90 backdrop-blur-md border-b border-violet-950/80 px-6 py-3.5 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-xs font-bold border border-violet-800/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารายการรับชำระเงิน
        </Link>
        <span className="text-xs text-zinc-400 hidden sm:inline">
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
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/50 transition-all hover:scale-105"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ใบเสร็จรับเงิน / PDF (A4)
        </button>
      </div>
    </div>
  );
}
