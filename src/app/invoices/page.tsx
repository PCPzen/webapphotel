import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link 
        href="/" 
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> เส้นทาง: /invoices
        </div>
        <h1 className="text-2xl font-bold text-slate-900">P13 รายการใบแจ้งหนี้</h1>
        <p className="text-slate-500 text-sm leading-relaxed">ดูบิลประจำเดือน กรองตามสถานะ และติดตามยอดค้าง</p>
        
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>โมดูลพร้อมสำหรับการลงโค้ด</span>
          <span>Dormitory Management System</span>
        </div>
      </div>
    </div>
  );
}
