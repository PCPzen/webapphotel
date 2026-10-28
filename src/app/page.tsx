import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Building2, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import MainRoadmapClient from "./MainRoadmapClient";

async function DatabaseStats() {
  try {
    const roomsCount = await prisma.room.count();
    const settings = await prisma.systemSetting.findFirst();

    return (
      <div className="p-4 rounded-2xl border border-emerald-900/40 bg-[#0f1917]/70 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-white">เชื่อมต่อฐานข้อมูล Supabase สำเร็จ 100%!</span>
            <span className="text-emerald-400/80 block sm:inline sm:ml-2">
              (พบห้องพักในระบบ: <strong>{roomsCount} ห้อง</strong> | หอพัก: <strong>{settings?.dormName || "พร้อมใช้งาน"}</strong>)
            </span>
          </div>
        </div>
        <Link 
          href="/rooms"
          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          ดูผังห้องพัก <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-4 rounded-2xl border border-red-900/40 bg-[#1c0f13]/80 text-red-200 text-sm">
        ⚠️ การเชื่อมต่อขัดข้อง: {err?.message}
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c0a17] text-zinc-100 antialiased p-6 md:p-12 selection:bg-violet-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="border-b border-violet-950/70 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl shadow-xl shadow-violet-950/60 ring-1 ring-violet-400/40">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">ระบบจัดการหอพัก (Dormitory Management System)</h1>
              <p className="text-xs text-zinc-400 mt-1">
                หอพักสุขสบาย เพลส • ระบบผังห้องพัก ผู้เช่า สัญญา มิเตอร์น้ำ-ไฟ และการเงิน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-800/40">
              Next.js 16 + TypeScript
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              Prisma + Supabase
            </span>
          </div>
        </header>

        {/* Database Status */}
        <Suspense fallback={<div className="h-16 bg-violet-950/20 rounded-2xl border border-violet-900/20 animate-pulse"></div>}>
          <DatabaseStats />
        </Suspense>

        {/* Interactive Roadmap with RBAC */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              ลำดับขั้นตอนการทำงานของระบบ (Sequential Progression Roadmap)
            </h2>
            <span className="text-xs text-zinc-500">ขั้นตอนที่ 1 ถึง 9 เชื่อมต่อกันแบบเป็นลำดับ</span>
          </div>

          <MainRoadmapClient />
        </section>

        {/* Footer info */}
        <footer className="pt-6 border-t border-violet-950/60 text-center text-xs text-zinc-600 space-y-1">
          <p>ระบบจัดการหอพัก (Dormitory Management System) • พัฒนาด้วย Next.js, Prisma และ PostgreSQL บน Supabase</p>
        </footer>

      </div>
    </div>
  );
}
