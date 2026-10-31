import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PrintWalksheetClient from "./PrintWalksheetClient";
import { parseReadingMonth, getThaiMonthName } from "@/lib/meters";

export default async function PrintMeterWalksheetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = month || defaultMonthStr;
  const readingMonth = parseReadingMonth(monthStr);

  // คำนวณเดือนก่อนหน้า
  const prevMonth = new Date(readingMonth);
  prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);

  // ดึงข้อมูลหอพัก
  const settings = await prisma.systemSetting.findFirst();
  const dormName = settings?.dormName || "หอพักสุขสบาย เพลส";
  const dormAddress = settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200";
  const dormPhone = settings?.dormPhone || "081-234-5678";

  // ดึงห้องพักทั้งหมด เรียงตามชั้น และเลขห้อง
  const rooms = await prisma.room.findMany({
    orderBy: [{ floor: "asc" }, { roomNo: "asc" }],
    include: {
      contracts: {
        where: { status: "active" },
        include: { tenant: true },
      },
      meterReadings: {
        where: {
          readingMonth: {
            in: [readingMonth, prevMonth],
          },
        },
      },
    },
  });

  const thaiMonthName = getThaiMonthName(readingMonth);
  const printDateThai = `${today.getDate()} ${getThaiMonthName(today)}`;

  // เตรียมข้อมูลแต่ละห้อง
  const walksheetRows = rooms.map((room, index) => {
    const activeContract = room.contracts[0];
    const currentReading = room.meterReadings.find(
      (m) => m.readingMonth.toISOString().slice(0, 7) === monthStr
    );
    const prevReading = room.meterReadings.find(
      (m) => m.readingMonth.toISOString().slice(0, 7) === prevMonth.toISOString().slice(0, 7)
    );

    // เลขก่อนหน้า: ถ้ามีในเดือนก่อน ให้ใช้เลขปัจจุบันของเดือนก่อน
    // ถ้าไม่มี ให้ใช้ startWaterMeter จากสัญญา ถ้าไม่มี ให้ใช้ 0
    const waterPrev = prevReading
      ? prevReading.waterCurr
      : activeContract?.startWaterMeter ?? 0;

    const elecPrev = prevReading
      ? prevReading.elecCurr
      : activeContract?.startElectricMeter ?? 0;

    return {
      no: index + 1,
      roomNo: room.roomNo,
      floor: room.floor,
      roomType: room.roomType,
      status: room.status,
      hasActiveContract: Boolean(activeContract),
      tenantName: activeContract
        ? `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`
        : "- ห้องว่าง -",
      waterPrev,
      elecPrev,
      waterCurr: currentReading ? currentReading.waterCurr : null,
      elecCurr: currentReading ? currentReading.elecCurr : null,
    };
  });

  return (
    <div className="min-h-screen bg-[#07050f] text-zinc-100 print:bg-white print:text-black print:min-h-0 print:p-0">
      <PrintWalksheetClient monthStr={monthStr} thaiMonthName={thaiMonthName} />

      {/* A4 Sheet */}
      <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 shadow-2xl p-8 md:p-12 mb-16 rounded-sm print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full print:rounded-none">
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-serif">
                {dormName}
              </h1>
              <p className="text-[11px] text-zinc-600">
                {dormAddress} | โทร: {dormPhone}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 rounded">
                รอบเดือน: {thaiMonthName}
              </span>
              <p className="text-[10px] text-zinc-500 mt-0.5">วันที่พิมพ์: {printDateThai}</p>
            </div>
          </div>

          <div className="text-center mt-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 underline underline-offset-4">
              ใบเดินจดเลขมิเตอร์น้ำ - ไฟฟ้าประจำเดือน (Meter Walksheet)
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              ใช้สำหรับเดินตรวจสอบและจดบันทึกมาตรวัดน้ำและไฟฟ้าหน้าห้องพัก
            </p>
          </div>
        </div>

        {/* Walksheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-y-2 border-zinc-900 bg-zinc-100 text-zinc-900 font-bold">
                <th className="py-1.5 px-2 text-center w-8 border border-zinc-300">ลำดับ</th>
                <th className="py-1.5 px-2 text-center w-14 border border-zinc-300">ห้อง</th>
                <th className="py-1.5 px-2 border border-zinc-300 w-36">ผู้เช่า / สถานะ</th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-cyan-50/60 w-20">
                  น้ำก่อนหน้า
                </th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-cyan-50/60 w-24">
                  น้ำปัจจุบัน (จด)
                </th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-cyan-50/60 w-16">
                  หน่วยใช้
                </th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-amber-50/60 w-20">
                  ไฟก่อนหน้า
                </th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-amber-50/60 w-24">
                  ไฟปัจจุบัน (จด)
                </th>
                <th className="py-1.5 px-2 text-center border border-zinc-300 bg-amber-50/60 w-16">
                  หน่วยใช้
                </th>
                <th className="py-1.5 px-2 border border-zinc-300">หมายเหตุ / ความผิดปกติ</th>
              </tr>
            </thead>
            <tbody>
              {walksheetRows.map((row) => (
                <tr
                  key={row.roomNo}
                  className={`border-b border-zinc-200 ${
                    !row.hasActiveContract ? "bg-zinc-50/60 text-zinc-500" : ""
                  }`}
                >
                  <td className="py-1.5 px-2 text-center border border-zinc-200 font-mono text-[10px]">
                    {row.no}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-zinc-200 font-black text-zinc-900">
                    {row.roomNo}
                  </td>
                  <td className="py-1.5 px-2 border border-zinc-200 truncate max-w-[130px]">
                    {row.tenantName}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-zinc-200 font-mono text-cyan-900 font-semibold bg-cyan-50/30">
                    {row.waterPrev}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-zinc-200 bg-cyan-50/20 font-mono font-bold">
                    {row.waterCurr !== null ? row.waterCurr : ""}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-zinc-200 font-mono text-zinc-400">
                    {row.waterCurr !== null ? Math.max(0, row.waterCurr - row.waterPrev) : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-zinc-200 font-mono text-amber-900 font-semibold bg-amber-50/30">
                    {row.elecPrev}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-zinc-200 bg-amber-50/20 font-mono font-bold">
                    {row.elecCurr !== null ? row.elecCurr : ""}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-zinc-200 font-mono text-zinc-400">
                    {row.elecCurr !== null ? Math.max(0, row.elecCurr - row.elecPrev) : ""}
                  </td>
                  <td className="py-1.5 px-2 border border-zinc-200 text-[10px] text-zinc-400"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้เดินจดมิเตอร์</p>
            <p className="font-bold text-zinc-900">( ............................................................ )</p>
            <p className="text-[10px] text-zinc-500">เจ้าหน้าที่ผู้บันทึกข้อมูลหน้างาน</p>
          </div>

          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้ตรวจสอบ</p>
            <p className="font-bold text-zinc-900">( ............................................................ )</p>
            <p className="text-[10px] text-zinc-500">เจ้าหน้าที่คีย์เข้าระบบ / แอดมิน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
