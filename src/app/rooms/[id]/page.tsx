import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import {
  Building2,
  ArrowLeft,
  FileText,
  Wrench,
  Snowflake,
  Wind,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Edit3,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

async function RoomDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = parseInt(id, 10);

  if (isNaN(roomId)) {
    notFound();
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      contracts: {
        include: {
          tenant: true,
        },
        orderBy: { startDate: "desc" },
      },
      repairRequests: {
        orderBy: { reportedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!room) {
    notFound();
  }

  const activeContract = room.contracts.find((c) => c.status === "active");

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Link
        href="/rooms"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> กลับสู่ผังห้องพัก
      </Link>

      {/* Main Room Overview Card */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40">
              {room.roomNo}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">ห้องพัก {room.roomNo}</h1>
                {room.status === "vacant" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ว่าง (พร้อมเช่า)
                  </span>
                )}
                {room.status === "occupied" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    มีผู้เช่าอยู่
                  </span>
                )}
                {room.status === "maintenance" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ปิดซ่อมบำรุง
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ชั้นที่ {room.floor} • หอพักสุขสบาย เพลส
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href={`/rooms/${room.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold border border-slate-700 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> แก้ไขข้อมูลห้อง
            </Link>

            {room.status === "vacant" && (
              <Link
                href={`/contracts/new?roomId=${room.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> + ทำสัญญาเช่าห้องนี้
              </Link>
            )}
          </div>
        </div>

        {/* Room Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500">ประเภทห้อง</span>
            <p className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
              {room.roomType.includes("แอร์") ? (
                <Snowflake className="w-4 h-4 text-cyan-400" />
              ) : (
                <Wind className="w-4 h-4 text-slate-400" />
              )}
              {room.roomType}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500">ค่าเช่ามาตรฐาน</span>
            <p className="text-sm font-black text-sky-300 mt-1.5">
              ฿{Number(room.baseRent).toLocaleString()}
              <span className="text-[10px] font-normal text-slate-500"> /เดือน</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500">ชั้นที่ตั้ง</span>
            <p className="text-sm font-bold text-white mt-1.5">ชั้น {room.floor}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500">ประวัติสัญญาทั้งหมด</span>
            <p className="text-sm font-bold text-blue-300 mt-1.5">{room.contracts.length} ฉบับ</p>
          </div>
        </div>

        {room.note && (
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 text-xs">
            <span className="font-bold text-slate-400">หมายเหตุ: </span>
            <span className="text-slate-300">{room.note}</span>
          </div>
        )}
      </div>

      {/* Active Contract Info */}
      {activeContract ? (
        <div className="bg-[#0b1120] rounded-3xl border border-blue-900/40 shadow-xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> ข้อมูลผู้เช่าปัจจุบัน (Active Contract)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              สัญญามีผลใช้งาน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800">
              <span className="text-slate-500 text-[11px]">ชื่อผู้เช่า:</span>
              <p className="font-bold text-white text-sm mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {activeContract.tenant.firstName} {activeContract.tenant.lastName}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800">
              <span className="text-slate-500 text-[11px]">เบอร์โทรศัพท์:</span>
              <p className="font-bold text-white text-sm mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {activeContract.tenant.phone}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800">
              <span className="text-slate-500 text-[11px]">ระยะเวลาสัญญา:</span>
              <p className="font-bold text-white text-sm mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                {new Date(activeContract.startDate).toLocaleDateString("th-TH")} -{" "}
                {new Date(activeContract.endDate).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Link
              href={`/contracts/${activeContract.id}`}
              className="text-xs font-bold text-blue-300 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              ดูรายละเอียดสัญญาและเงื่อนไขการคืนเงินมัดจำ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0b1120] rounded-3xl border border-slate-800 p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-blue-400/30 mx-auto" />
          <h3 className="text-sm font-bold text-white">ห้องนี้ยังไม่มีสัญญาเช่า (สถานะห้องว่าง)</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            คุณสามารถเปิดสัญญาเช่าใหม่สำหรับห้องนี้เพื่อบันทึกประวัติผู้เช่าและเริ่มคิดค่าเช่าได้ทันที
          </p>
          <div className="pt-2">
            <Link
              href={`/contracts/new?roomId=${room.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all"
            >
              <Plus className="w-4 h-4" /> ทำสัญญาเช่าห้อง {room.roomNo}
            </Link>
          </div>
        </div>
      )}

      {/* Repair History Card */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-400" /> ประวัติการแจ้งซ่อมแซมของห้องนี้
          </h3>
          <Link
            href={`/repairs/new?roomId=${room.id}`}
            className="text-xs font-bold text-blue-300 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> แจ้งซ่อมห้องนี้
          </Link>
        </div>

        {room.repairRequests.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">ห้องนี้ยังไม่มีประวัติการแจ้งซ่อมแซม</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {room.repairRequests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{r.title}</span>
                  <span className="text-slate-500 ml-2">หมวด: {r.category}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-blue-300 border border-slate-800">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse"></div>
          }
        >
          <RoomDetailContent params={params} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
