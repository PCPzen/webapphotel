import { Suspense } from "react";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import GenerateInvoicesClient, {
  ReadyInvoiceRoom,
  AlreadyGeneratedInvoice,
  MissingMeterRoom,
} from "./GenerateInvoicesClient";
import { parseReadingMonth, formatMonthString, getThaiMonthName } from "@/lib/meters";

async function GenerateInvoicesData({ monthParam }: { monthParam?: string }) {
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : defaultMonthStr;

  const billingMonth = parseReadingMonth(monthStr);

  // คำนวณวันสิ้นสุดของเดือนนั้น
  const endOfMonth = new Date(
    Date.UTC(billingMonth.getUTCFullYear(), billingMonth.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  // คำนวณเดือนก่อนหน้าและเดือนถัดไป
  const prevMonthDate = new Date(billingMonth);
  prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
  const prevMonthStr = formatMonthString(prevMonthDate);

  const nextMonthDate = new Date(billingMonth);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonthStr = formatMonthString(nextMonthDate);

  // ดึงสัญญา active ทั้งหมดที่เริ่มต้นก่อนหรือภายในเดือนนี้ (start_date <= endOfMonth)
  const activeContracts = await prisma.contract.findMany({
    where: {
      status: "active",
      startDate: { lte: endOfMonth },
    },
    include: {
      room: true,
      tenant: true,
      invoices: {
        where: { billingMonth },
      },
    },
    orderBy: [{ room: { floor: "asc" } }, { room: { roomNo: "asc" } }],
  });

  // ดึงมิเตอร์ของทุกห้องในเดือนนี้
  const roomIds = activeContracts.map((c) => c.roomId);
  const meterReadings = await prisma.meterReading.findMany({
    where: {
      roomId: { in: roomIds },
      readingMonth: billingMonth,
    },
  });

  const meterMap = new Map(meterReadings.map((m) => [m.roomId, m]));

  const readyRooms: ReadyInvoiceRoom[] = [];
  const alreadyGenerated: AlreadyGeneratedInvoice[] = [];
  const missingMeterRooms: MissingMeterRoom[] = [];

  for (const contract of activeContracts) {
    // ตรวจสอบว่ามีใบแจ้งหนี้ของรอบเดือนนี้หรือยัง
    const existingActiveInvoice = contract.invoices.find((inv) => inv.status !== "cancelled");
    if (existingActiveInvoice) {
      alreadyGenerated.push({
        invoiceId: existingActiveInvoice.id,
        invoiceNo: existingActiveInvoice.invoiceNo,
        roomNo: contract.room.roomNo,
        tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
        totalAmount: Number(existingActiveInvoice.totalAmount),
        status: existingActiveInvoice.status,
      });
      continue;
    }

    // ตรวจสอบมิเตอร์ของห้องนี้ในรอบเดือนนี้
    const meter = meterMap.get(contract.roomId);
    if (!meter) {
      missingMeterRooms.push({
        contractId: contract.id,
        roomId: contract.room.id,
        roomNo: contract.room.roomNo,
        floor: contract.room.floor,
        tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      });
      continue;
    }

    const waterUnits = Math.max(0, meter.waterCurr - meter.waterPrev);
    const elecUnits = Math.max(0, meter.elecCurr - meter.elecPrev);

    readyRooms.push({
      contractId: contract.id,
      roomId: contract.room.id,
      roomNo: contract.room.roomNo,
      floor: contract.room.floor,
      roomType: contract.room.roomType,
      tenantName: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
      tenantPhone: contract.tenant.phone,
      monthlyRent: Number(contract.monthlyRent),
      waterRate: Number(contract.waterRate),
      electricRate: Number(contract.electricRate),
      dueDay: contract.dueDay,
      meterReadingId: meter.id,
      waterPrev: meter.waterPrev,
      waterCurr: meter.waterCurr,
      waterUnits,
      elecPrev: meter.elecPrev,
      elecCurr: meter.elecCurr,
      elecUnits,
    });
  }

  const thaiMonthName = getThaiMonthName(billingMonth);

  return (
    <GenerateInvoicesClient
      monthStr={monthStr}
      prevMonthStr={prevMonthStr}
      nextMonthStr={nextMonthStr}
      thaiMonthName={thaiMonthName}
      readyRooms={readyRooms}
      alreadyGenerated={alreadyGenerated}
      missingMeterRooms={missingMeterRooms}
    />
  );
}

export default async function GenerateInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm">กำลังโหลดข้อมูลห้องพักและมิเตอร์สำหรับออกบิล...</p>
            </div>
          </div>
        }
      >
        <GenerateInvoicesData monthParam={month} />
      </Suspense>
    </AppLayout>
  );
}
