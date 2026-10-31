"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintInvoiceClient({
  invoiceId,
  invoiceNo,
  roomNo,
}: {
  invoiceId: number;
  invoiceNo: string;
  roomNo: string;
}) {
  return (
    <div className="print:hidden sticky top-0 z-50 bg-[#0c0a18]/90 backdrop-blur-md border-b border-violet-950/80 px-6 py-3.5 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href={`/invoices/${invoiceId}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-xs font-bold border border-violet-800/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารายละเอียดบิล
        </Link>
        <span className="text-xs text-zinc-400 hidden sm:inline">
          ใบแจ้งหนี้ห้อง <strong className="text-white">{roomNo}</strong> ({invoiceNo})
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-violet-950/60 transition-all hover:scale-105"
        >
          <Printer className="w-4 h-4" />
          พิมพ์ใบแจ้งหนี้ / PDF (A4)
        </button>
      </div>
    </div>
  );
}
