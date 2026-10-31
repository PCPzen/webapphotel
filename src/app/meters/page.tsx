import { Suspense } from "react";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import MetersClient, { MeterRowData } from "./MetersClient";
import { parseReadingMonth, formatMonthString, getThaiMonthName } from "@/lib/meters";

async function MetersData({ monthParam }: { monthParam?: string }) {
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : defaultMonthStr;

  const readingMonth = parseReadingMonth(monthStr);

  // คำนวณเดือนก่อนหน้าและเดือนถัดไปสำหรับปุ่มเปลี่ยนเดือน
  const prevMonthDate = new Date(readingMonth);
  prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
  const prevMonthStr = formatMonthString(prevMonthDate);

  const nextMonthDate = new Date(readingMonth);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonthStr = formatMonthString(nextMonthDate);

  // คำนวณ 3 เดือนย้อนหลังสำหรับกฎ UR-2.15 (Anomaly Detection)
  const m1 = new Date(readingMonth);
  m1.setUTCMonth(m1.getUTCMonth() - 1);
  const m2 = new Date(readingMonth);
  m2.setUTCMonth(m2.getUTCMonth() - 2);
  const m3 = new Date(readingMonth);
  m3.setUTCMonth(m3.getUTCMonth() - 3);

  // ดึงการตั้งค่าระบบสำหรับอัตราค่าน้ำค่าไฟมาตรฐาน (กรณีไม่มีสัญญา)
  const settings = await prisma.systemSetting.findFirst();
  const defaultWaterRate = settings ? Number(settings.defaultWaterRate) : 18;
  const defaultElectricRate = settings ? Number(settings.defaultElectricRate) : 8;

  // 1. ดึงห้องพักทั้งหมด เรียงตามชั้นและเลขห้อง
  const rooms = await prisma.room.findMany({
    orderBy: [{ floor: "asc" }, { roomNo: "asc" }],
    include: {
      contracts: {
        where: { status: "active" },
        include: { tenant: true },
      },
      meterReadings: {
        where: { readingMonth },
        include: { invoice: true },
      },
    },
  });

  // 2. ดึงประวัติมิเตอร์ 3 เดือนก่อนหน้าของทุกห้อง
  const pastReadings = await prisma.meterReading.findMany({
    where: {
      readingMonth: { in: [m1, m2, m3] },
    },
    orderBy: { readingMonth: "desc" },
  });

  // จัดกลุ่มประวัติตาม roomId
  const pastByRoom = new Map<number, typeof pastReadings>();
  for (const pr of pastReadings) {
    if (!pastByRoom.has(pr.roomId)) {
      pastByRoom.set(pr.roomId, []);
    }
    pastByRoom.get(pr.roomId)!.push(pr);
  }

  // 3. ประกอบข้อมูลตารางสำหรับแต่ละห้อง
  const rows: MeterRowData[] = rooms.map((room) => {
    const activeContract = room.contracts[0];
    const currentReading = room.meterReadings[0];
    const roomPast = pastByRoom.get(room.id) || [];

    // หาประวัติเดือนก่อนหน้าทันที (m1)
    const prevReading = roomPast.find(
      (pr) => pr.readingMonth.toISOString().slice(0, 7) === prevMonthStr
    );

    // คำนวณเลขก่อนหน้า (Prev reading):
    // 1. จากเดือนก่อนหน้า (m1) ถ้ามี
    // 2. ถ้าไม่มี ให้นำมาจาก startWaterMeter/startElectricMeter ในสัญญาเช่า
    // 3. ถ้าไม่มี ให้ใช้ 0
    let waterPrev = 0;
    let elecPrev = 0;

    if (currentReading) {
      waterPrev = currentReading.waterPrev;
      elecPrev = currentReading.elecPrev;
    } else if (prevReading) {
      waterPrev = prevReading.waterCurr;
      elecPrev = prevReading.elecCurr;
    } else if (activeContract) {
      waterPrev = activeContract.startWaterMeter ?? 0;
      elecPrev = activeContract.startElectricMeter ?? 0;
    }

    // คำนวณค่าเฉลี่ย 3 เดือนก่อนหน้า (UR-2.15 Anomaly Detection)
    let sumWaterUnits = 0;
    let sumElecUnits = 0;
    let pastCount = 0;

    for (const pr of roomPast) {
      const wU = Math.max(0, pr.waterCurr - pr.waterPrev);
      const eU = Math.max(0, pr.elecCurr - pr.elecPrev);
      sumWaterUnits += wU;
      sumElecUnits += eU;
      pastCount++;
    }

    const pastAvgWater = pastCount > 0 ? sumWaterUnits / pastCount : 0;
    const pastAvgElec = pastCount > 0 ? sumElecUnits / pastCount : 0;

    const isLocked = Boolean(
      currentReading?.invoice && currentReading.invoice.status !== "cancelled"
    );

    const waterRate = activeContract ? Number(activeContract.waterRate) : defaultWaterRate;
    const electricRate = activeContract ? Number(activeContract.electricRate) : defaultElectricRate;

    return {
      roomId: room.id,
      roomNo: room.roomNo,
      floor: room.floor,
      roomType: room.roomType,
      hasActiveContract: Boolean(activeContract),
      tenantName: activeContract
        ? `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`
        : "- ห้องว่าง -",
      waterRate,
      electricRate,
      readingId: currentReading?.id || null,
      waterPrev,
      waterCurr: currentReading ? currentReading.waterCurr : null,
      elecPrev,
      elecCurr: currentReading ? currentReading.elecCurr : null,
      readDate: currentReading
        ? currentReading.readDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      note: currentReading?.note || "",
      isLocked,
      invoiceNo: currentReading?.invoice?.invoiceNo || null,
      pastAvgWater,
      pastAvgElec,
      hasHistory: pastCount > 0,
    };
  });

  const thaiMonthName = getThaiMonthName(readingMonth);

  return (
    <MetersClient
      monthStr={monthStr}
      prevMonthStr={prevMonthStr}
      nextMonthStr={nextMonthStr}
      thaiMonthName={thaiMonthName}
      initialRows={rows}
    />
  );
}

export default async function MetersPage({
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
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm">กำลังโหลดตารางมิเตอร์น้ำ-ไฟ...</p>
            </div>
          </div>
        }
      >
        <MetersData monthParam={month} />
      </Suspense>
    </AppLayout>
  );
}
