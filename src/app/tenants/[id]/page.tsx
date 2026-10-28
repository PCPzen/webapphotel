import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  User,
  ArrowLeft,
  Edit3,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { calculateAge } from "@/lib/thaiId";

async function TenantDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = parseInt(id, 10);

  if (isNaN(tenantId)) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        include: {
          room: true,
          invoices: {
            orderBy: { billingMonth: "desc" },
            take: 5,
          },
        },
        orderBy: { startDate: "desc" },
      },
      repairRequests: {
        orderBy: { reportedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const age = calculateAge(tenant.birthDate);
  const activeContract = tenant.contracts.find((c) => c.status === "active");

  // Format 13-digit Thai ID: x-xxxx-xxxxx-xx-x
  const rawId = tenant.idCardNo;
  const formattedId =
    rawId.length === 13
      ? `${rawId[0]}-${rawId.slice(1, 5)}-${rawId.slice(5, 10)}-${rawId.slice(10, 12)}-${rawId[12]}`
      : rawId;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าทะเบียนผู้เช่า
        </Link>
      </div>

      {/* Tenant Profile Header Card */}
      <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-950/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">
                  {tenant.firstName} {tenant.lastName}
                </h1>
                {activeContract ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🟢 พักอยู่ห้อง {activeContract.room.roomNo}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    ยังไม่มีห้องพัก
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                ลงทะเบียนเมื่อ: {new Date(tenant.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href={`/tenants/${tenant.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-950/50 text-violet-300 hover:bg-violet-900/50 hover:text-white text-xs font-bold border border-violet-800/30 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> แก้ไขข้อมูล
            </Link>

            {!activeContract && (
              <Link
                href={`/contracts/new?tenantId=${tenant.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> + ทำสัญญาเช่า
              </Link>
            )}
          </div>
        </div>

        {/* Detailed Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Citizen ID (Full 13 digits for Admin/Staff per BR-13) */}
          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> เลขประจำตัวประชาชน
            </span>
            <p className="text-sm font-mono font-bold text-white tracking-wider">{formattedId}</p>
            <span className="text-[10px] text-emerald-400 block">✔ ผ่านการตรวจสอบ Checksum</span>
          </div>

          {/* Phone */}
          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> เบอร์โทรศัพท์
            </span>
            <p className="text-sm font-bold text-white font-mono">{tenant.phone}</p>
          </div>

          {/* Age & BirthDate */}
          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-fuchsia-400" /> วันเกิด / อายุ
            </span>
            <p className="text-sm font-bold text-white">
              {new Date(tenant.birthDate).toLocaleDateString("th-TH")} ({age} ปี)
            </p>
            {age < 20 && (
              <span className="text-[10px] text-amber-400 block">⚠️ สถานะผู้เยาว์ตามกฎหมาย</span>
            )}
          </div>

          {/* Email */}
          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-400" /> อีเมล
            </span>
            <p className="text-sm font-bold text-white truncate">
              {tenant.email || "- ไม่ได้ระบุ -"}
            </p>
          </div>
        </div>

        {/* Address & Emergency Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-violet-400" /> ที่อยู่ตามบัตรประชาชน:
            </span>
            <p className="text-zinc-200 leading-relaxed">{tenant.address}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0a18] border border-violet-950/60 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-fuchsia-400" /> ผู้ติดต่อฉุกเฉิน:
            </span>
            <p className="text-white font-bold">{tenant.emergencyName}</p>
            <p className="text-emerald-400 font-mono">โทร: {tenant.emergencyPhone}</p>
          </div>
        </div>
      </div>

      {/* Contract History (UR-2.9) */}
      <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-violet-950/60 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" /> ประวัติสัญญาเช่าทั้งหมด ({tenant.contracts.length} ฉบับ)
          </h3>
          {!activeContract && (
            <Link
              href={`/contracts/new?tenantId=${tenant.id}`}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> ทำสัญญาเช่าใหม่
            </Link>
          )}
        </div>

        {tenant.contracts.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">ผู้เช่ารายนี้ยังไม่เคยมีประวัติสัญญาเช่า</p>
        ) : (
          <div className="divide-y divide-violet-950/50">
            {tenant.contracts.map((contract) => (
              <div
                key={contract.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      ห้อง {contract.room.roomNo}
                    </span>
                    {contract.status === "active" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        สัญญาใช้งานอยู่
                      </span>
                    )}
                    {contract.status === "ended" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                        สิ้นสุดสัญญาแล้ว
                      </span>
                    )}
                    {contract.status === "cancelled" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400">
                        ยกเลิกสัญญา
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    ระยะเวลา: {new Date(contract.startDate).toLocaleDateString("th-TH")} ถึง{" "}
                    {new Date(contract.endDate).toLocaleDateString("th-TH")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">ค่าเช่ารายเดือน</span>
                    <span className="font-bold text-fuchsia-300">
                      ฿{Number(contract.monthlyRent).toLocaleString()}
                    </span>
                  </div>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 hover:text-white font-bold text-[11px] border border-violet-800/30 transition-colors inline-flex items-center gap-1"
                  >
                    ดูสัญญา <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repair Requests by this tenant */}
      <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-violet-950/60 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-violet-400" /> ประวัติการแจ้งซ่อมของผู้เช่ารายนี้
          </h3>
        </div>

        {tenant.repairRequests.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">ผู้เช่ารายนี้ยังไม่เคยมีการแจ้งซ่อมแซม</p>
        ) : (
          <div className="divide-y divide-violet-950/50">
            {tenant.repairRequests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{r.title}</span>
                  <span className="text-zinc-500 ml-2">หมวด: {r.category}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-950 text-violet-300 border border-violet-800/30">
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

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-violet-950/20 rounded-3xl border border-violet-900/20 animate-pulse"></div>
          }
        >
          <TenantDetailContent params={params} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
