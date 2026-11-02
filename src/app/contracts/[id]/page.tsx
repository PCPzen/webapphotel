import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import EndContractModal from "./EndContractModal";
import RenewContractModal from "./RenewContractModal";
import {
  FileText,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Receipt,
  Printer,
  Gauge,
  Key,
  CreditCard,
  ArrowRight,
} from "lucide-react";

async function ContractDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = await params;
  const { action } = await searchParams;
  const contractId = parseInt(id, 10);

  if (isNaN(contractId)) {
    notFound();
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      room: true,
      tenant: true,
      invoices: {
        include: {
          payments: {
            where: { status: "valid" },
          },
        },
        orderBy: { billingMonth: "desc" },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  // คำนวณหายอดค้างรวม (O)
  let totalUnpaidBalance = 0;
  const invoicesWithBalance = contract.invoices.map((inv) => {
    const paidSum = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, Number(inv.totalAmount) - paidSum);
    if (inv.status !== "paid" && inv.status !== "cancelled") {
      totalUnpaidBalance += balance;
    }
    return {
      ...inv,
      paidSum,
      balance,
    };
  });

  const isActive = contract.status === "active";
  const isEnded = contract.status === "ended";

  const contractModalData = {
    id: contract.id,
    roomNo: contract.room.roomNo,
    tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
    deposit: Number(contract.deposit),
    unpaidBalance: totalUnpaidBalance,
    hasInvoices: contract.invoices.length > 0,
    startWaterMeter: contract.startWaterMeter,
    startElectricMeter: contract.startElectricMeter,
    keyCount: contract.keyCount,
    keyCardCount: contract.keyCardCount,
  };

  const renewModalData = {
    id: contract.id,
    roomNo: contract.room.roomNo,
    tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
    currentEndDate: contract.endDate.toISOString().split("T")[0],
    monthlyRent: Number(contract.monthlyRent),
    deposit: Number(contract.deposit),
    waterRate: Number(contract.waterRate),
    electricRate: Number(contract.electricRate),
    lateFee: Number(contract.lateFee),
    dueDay: contract.dueDay,
    startWaterMeter: contract.startWaterMeter,
    startElectricMeter: contract.startElectricMeter,
    keyCount: contract.keyCount,
    keyCardCount: contract.keyCardCount,
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการสัญญา
        </Link>
      </div>

      {/* Main Contract Card */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-950/60 border border-blue-500/30">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">
                  สัญญาเช่าห้อง {contract.room.roomNo}
                </h1>
                {isActive && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    ใช้งานอยู่ (Active)
                  </span>
                )}
                {isEnded && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    สิ้นสุดสัญญาแล้ว
                  </span>
                )}
                {contract.status === "cancelled" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-900">
                    ยกเลิกสัญญา
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                รหัสสัญญา: #CT-{contract.id} • บันทึกเมื่อ {new Date(contract.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          {/* Action Buttons for Active Contract */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/contracts/${contract.id}/print`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              พิมพ์หนังสือสัญญา A4
            </Link>

            {isActive && (
              <>
                <RenewContractModal contract={renewModalData} />
                <EndContractModal
                  contract={contractModalData}
                  initiallyOpen={action === "end"}
                />
              </>
            )}
          </div>
        </div>

        {/* Contract Key Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ค่าเช่ารายเดือน</span>
            <p className="text-base font-black text-blue-400">
              ฿{Number(contract.monthlyRent).toLocaleString()}
              <span className="text-[10px] font-normal text-slate-500"> /ด.</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">เงินมัดจำ/ประกัน</span>
            <p className="text-base font-black text-white">
              ฿{Number(contract.deposit).toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">ค่าน้ำ / ค่าไฟต่อหน่วย</span>
            <p className="text-sm font-bold text-slate-200">
              น้ำ ฿{Number(contract.waterRate)} • ไฟ ฿{Number(contract.electricRate)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">กำหนดชำระ / ค่าปรับ</span>
            <p className="text-sm font-bold text-slate-200">
              วันที่ {contract.dueDay} (ปรับ ฿{Number(contract.lateFee)})
            </p>
          </div>
        </div>

        {/* Check-in Inspection & Meters Checklist */}
        <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-400" />
              ตรวจรับห้องพักและมิเตอร์เริ่มต้น ณ วันเข้าอยู่ (Check-in Checklist)
            </span>
            <span className="text-[11px] text-slate-500">บันทึกเป็นฐานข้อมูลเริ่มต้นสำหรับคิดค่าน้ำ-ไฟ</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">มิเตอร์น้ำเริ่มต้น</span>
                <strong className="text-blue-400 font-mono text-sm">{contract.startWaterMeter ?? 0} หน่วย</strong>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">มิเตอร์ไฟฟ้าเริ่มต้น</span>
                <strong className="text-amber-400 font-mono text-sm">{contract.startElectricMeter ?? 0} หน่วย</strong>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">กุญแจห้องพัก</span>
                <strong className="text-white font-mono text-sm">{contract.keyCount ?? 1} ดอก</strong>
              </div>
              <Key className="w-4 h-4 text-blue-400" />
            </div>

            <div className="p-3 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">คีย์การ์ด / เหรียญสแกน</span>
                <strong className="text-white font-mono text-sm">{contract.keyCardCount ?? 0} ใบ</strong>
              </div>
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Parties: Room & Tenant Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Tenant Card */}
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> ข้อมูลผู้เช่าหลักและผู้พักอาศัย
            </span>
            <div>
              <Link
                href={`/tenants/${contract.tenant.id}`}
                className="font-bold text-white text-sm hover:text-blue-400 transition-colors"
              >
                คุณ {contract.tenant.firstName} {contract.tenant.lastName}
              </Link>
              <p className="text-slate-400 text-[11px] mt-0.5">โทร: {contract.tenant.phone}</p>
            </div>
            {contract.tenant.coTenantName && (
              <p className="text-[11px] text-blue-300/80 pt-1 border-t border-slate-800">
                <strong>รูมเมท:</strong> {contract.tenant.coTenantName}
              </p>
            )}
            {contract.tenant.vehicleInfo && (
              <p className="text-[11px] text-slate-400">
                <strong>ยานพาหนะ:</strong> {contract.tenant.vehicleInfo}
              </p>
            )}
          </div>

          {/* Room & Dates Card */}
          <div className="p-4 rounded-2xl bg-[#080c15] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> ข้อมูลห้องพักและระยะเวลา
            </span>
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/rooms/${contract.room.id}`}
                  className="font-black text-white text-sm hover:text-blue-400 transition-colors"
                >
                  ห้อง {contract.room.roomNo} (ชั้น {contract.room.floor})
                </Link>
                <p className="text-slate-400 text-[11px] mt-0.5">{contract.room.roomType}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {new Date(contract.startDate).toLocaleDateString("th-TH")} ถึง{" "}
              {new Date(contract.endDate).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      </div>

      {/* สรุปการสิ้นสุดสัญญาและคืนเงินมัดจำ (ถ้าสถานะ ended) ตามกฎ BR-10 */}
      {isEnded && (
        <div className="bg-[#0b1120] rounded-3xl border border-amber-900/40 shadow-xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ผลการสิ้นสุดสัญญาและคืนเงินมัดจำ (BR-10)
            </h3>
            {contract.movedOutDate && (
              <span className="text-xs text-slate-400">
                ย้ายออกจริงเมื่อ: {new Date(contract.movedOutDate).toLocaleDateString("th-TH")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800">
              <span className="text-slate-500">ค่าเสียหายที่หัก:</span>
              <p className="font-bold text-amber-300 text-sm mt-0.5">
                ฿{Number(contract.damageAmount || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080c15] border border-slate-800">
              <span className="text-slate-500">หักชำระยอดค้างบิล:</span>
              <p className="font-bold text-white text-sm mt-0.5">
                ฿{Number(contract.depositApplied || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
              <span className="text-emerald-400 font-semibold">เงินมัดจำที่คืนผู้เช่า:</span>
              <p className="font-black text-emerald-300 text-base mt-0.5">
                ฿{Number(contract.depositRefund || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {contract.exitNote && (
            <p className="text-xs text-slate-400 italic bg-[#080c15] p-3 rounded-xl border border-slate-800">
              หมายเหตุตอนย้ายออก: {contract.exitNote}
            </p>
          )}
        </div>
      )}

      {/* รายการใบแจ้งหนี้ภายใต้สัญญานี้ (Invoices under this contract) */}
      <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-400" />
            ประวัติใบแจ้งหนี้ของสัญญานี้ ({contract.invoices.length} ฉบับ)
          </h3>
          {totalUnpaidBalance > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-800/40">
              ยอดค้างรวม: ฿{totalUnpaidBalance.toLocaleString()}
            </span>
          )}
        </div>

        {invoicesWithBalance.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            ยังไม่มีการออกใบแจ้งหนี้สำหรับสัญญานี้ (รอบบิลจะออกในเมนูออกใบแจ้งหนี้)
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60 text-xs">
            {invoicesWithBalance.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{inv.invoiceNo}</span>
                  <span className="text-[11px] text-slate-500">
                    รอบเดือน: {new Date(inv.billingMonth).toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-white block">฿{Number(inv.totalAmount).toLocaleString()}</span>
                    {inv.status !== "paid" ? (
                      <span className="text-[10px] text-red-400">ค้าง ฿{inv.balance.toLocaleString()}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400">ชำระครบแล้ว</span>
                    )}
                  </div>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse"></div>
          }
        >
          <ContractDetailContent params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
