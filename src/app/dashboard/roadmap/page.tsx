import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import MainRoadmapClient from "@/app/MainRoadmapClient";

async function DatabaseStats() {
  try {
    const roomsCount = await prisma.room.count();
    const settings = await prisma.systemSetting.findFirst();

    return (
      <div className="p-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-white">เชื่อมต่อฐานข้อมูล Supabase สำเร็จ 100%!</span>
            <span className="text-emerald-400/80 block sm:inline sm:ml-2">
              (พบห้องพักในระบบ: <strong>{roomsCount} ห้อง</strong> | หอพัก:{" "}
              <strong>{settings?.dormName || "พร้อมใช้งาน"}</strong>)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-md inline-flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> แดชบอร์ดบริหาร
          </Link>
          <Link
            href="/rooms"
            className="text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 border border-slate-700"
          >
            ผังห้องพัก <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-4 rounded-2xl border border-rose-900/40 bg-rose-950/30 text-rose-200 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span>การเชื่อมต่อขัดข้อง: {err?.message}</span>
      </div>
    );
  }
}

export default function DashboardRoadmapPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Back to Dashboard & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-white rounded-2xl shadow-xl shadow-blue-900/40 ring-1 ring-blue-400/30">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                แผนผังโครงสร้างและลำดับการทำงานของระบบ (System Roadmap)
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                แผนผังทั้ง 9 สเต็ปของระบบจัดการหอพัก พร้อมสิทธิ์การเข้าถึงแยกตามบทบาท (Admin / Staff / Tenant)
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" /> กลับหน้าแดชบอร์ด
          </Link>
        </div>

        {/* Database Status */}
        <Suspense
          fallback={
            <div className="h-16 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse"></div>
          }
        >
          <DatabaseStats />
        </Suspense>

        {/* Interactive Roadmap with RBAC */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              ลำดับขั้นตอนการทำงานของระบบ (Sequential Progression Roadmap)
            </h2>
            <span className="text-xs text-slate-400">ขั้นตอนที่ 1 ถึง 9 เชื่อมต่อกันแบบเป็นลำดับ</span>
          </div>

          <MainRoadmapClient />
        </section>
      </div>
    </AppLayout>
  );
}
