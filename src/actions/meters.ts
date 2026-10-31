"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type MeterActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

export type MeterReadingInput = {
  roomId: number;
  waterPrev: number;
  waterCurr: number;
  elecPrev: number;
  elecCurr: number;
  readDate?: string;
  note?: string;
  allowAdminPrevEdit?: boolean;
};

// -----------------------------------------------------------------------------
// Helper: ตรวจสอบและแปลง string YYYY-MM เป็น Date (วันแรกของเดือน)
// -----------------------------------------------------------------------------
export function parseReadingMonth(monthStr: string): Date {
  const parts = monthStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

// -----------------------------------------------------------------------------
// 1. บันทึกมิเตอร์เดี่ยวรายห้อง (Single Save / Update) - กฎ BR-04
// -----------------------------------------------------------------------------
export async function saveMeterReading(
  readingMonthStr: string,
  input: MeterReadingInput
): Promise<MeterActionResult> {
  const { roomId, waterPrev, waterCurr, elecPrev, elecCurr, readDate, note, allowAdminPrevEdit } = input;
  const readingMonth = parseReadingMonth(readingMonthStr);

  // ตรวจสอบห้องพัก
  if (!roomId || roomId <= 0) {
    return { error: "กรุณาระบุห้องพัก" };
  }

  // กฎ BR-04: ตรวจสอบความถูกต้องของเลขมิเตอร์
  // 1. ต้องเป็นจำนวนเต็ม ไม่ติดลบ
  if (!Number.isInteger(waterPrev) || waterPrev < 0) {
    return { error: `เลขมิเตอร์น้ำก่อนหน้าต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
  }
  if (!Number.isInteger(waterCurr) || waterCurr < 0) {
    return { error: `เลขมิเตอร์น้ำปัจจุบันต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
  }
  if (!Number.isInteger(elecPrev) || elecPrev < 0) {
    return { error: `เลขมิเตอร์ไฟก่อนหน้าต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
  }
  if (!Number.isInteger(elecCurr) || elecCurr < 0) {
    return { error: `เลขมิเตอร์ไฟปัจจุบันต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
  }

  // 2. ค่าปัจจุบัน >= ค่าก่อนหน้า (เว้นแต่กรณีระบุเปลี่ยนมิเตอร์ OI-10 โดย Admin พร้อมหมายเหตุ)
  if (waterCurr < waterPrev && !allowAdminPrevEdit) {
    return {
      error: `เลขมิเตอร์น้ำปัจจุบัน (${waterCurr}) ต้องไม่ต่ำกว่าเลขก่อนหน้า (${waterPrev}) ตามกฎ BR-04`,
    };
  }
  if (elecCurr < elecPrev && !allowAdminPrevEdit) {
    return {
      error: `เลขมิเตอร์ไฟปัจจุบัน (${elecCurr}) ต้องไม่ต่ำกว่าเลขก่อนหน้า (${elecPrev}) ตามกฎ BR-04`,
    };
  }

  const recordDate = readDate ? new Date(readDate) : new Date();

  try {
    // ตรวจสอบว่ามีรายการเดิมของห้องนี้ในเดือนนี้หรือไม่
    const existing = await prisma.meterReading.findUnique({
      where: {
        uq_room_reading_month: {
          roomId,
          readingMonth,
        },
      },
      include: {
        invoice: true,
      },
    });

    // กฎ 4.14: หากออกใบแจ้งหนี้แล้ว ล็อกห้ามแก้ไข (เว้นแต่จะยกเลิกบิลก่อน)
    if (existing?.invoice && existing.invoice.status !== "cancelled") {
      return {
        error: `ห้องพักนี้ได้ออกใบแจ้งหนี้ (${existing.invoice.invoiceNo}) ไปแล้ว จึงถูกล็อกไม่ให้แก้ไขเลขมิเตอร์`,
      };
    }

    if (existing) {
      // อัปเดตรายการเดิม
      await prisma.meterReading.update({
        where: { id: existing.id },
        data: {
          waterPrev,
          waterCurr,
          elecPrev,
          elecCurr,
          readDate: recordDate,
          note: note?.trim() || null,
        },
      });
    } else {
      // บันทึกรายการใหม่
      await prisma.meterReading.create({
        data: {
          roomId,
          readingMonth,
          waterPrev,
          waterCurr,
          elecPrev,
          elecCurr,
          readDate: recordDate,
          note: note?.trim() || null,
        },
      });
    }

    revalidatePath("/meters");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "บันทึกเลขมิเตอร์เรียบร้อยแล้ว" };
  } catch (err: any) {
    console.error("saveMeterReading error:", err);
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกเลขมิเตอร์" };
  }
}

// -----------------------------------------------------------------------------
// 2. บันทึกมิเตอร์แบบทั้งตาราง (Batch Save) - กฎ UR-2.14.1 (บันทึกได้ทั้งตาราง)
// -----------------------------------------------------------------------------
export async function saveMeterReadingsBatch(
  readingMonthStr: string,
  readings: MeterReadingInput[]
): Promise<MeterActionResult> {
  const readingMonth = parseReadingMonth(readingMonthStr);

  if (!readings || readings.length === 0) {
    return { error: "ไม่มีข้อมูลมิเตอร์ที่จะบันทึก" };
  }

  // ตรวจสอบความถูกต้องเบื้องต้นของทุกแถว
  for (const item of readings) {
    if (!Number.isInteger(item.waterPrev) || item.waterPrev < 0 ||
        !Number.isInteger(item.waterCurr) || item.waterCurr < 0) {
      return { error: `ห้อง ID ${item.roomId}: เลขมิเตอร์น้ำต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
    }
    if (!Number.isInteger(item.elecPrev) || item.elecPrev < 0 ||
        !Number.isInteger(item.elecCurr) || item.elecCurr < 0) {
      return { error: `ห้อง ID ${item.roomId}: เลขมิเตอร์ไฟต้องเป็นจำนวนเต็ม 0 ขึ้นไป` };
    }
    if (item.waterCurr < item.waterPrev && !item.allowAdminPrevEdit) {
      return {
        error: `ห้อง ID ${item.roomId}: เลขมิเตอร์น้ำใหม่ (${item.waterCurr}) ต้องไม่ต่ำกว่าเลขเดิม (${item.waterPrev})`,
      };
    }
    if (item.elecCurr < item.elecPrev && !item.allowAdminPrevEdit) {
      return {
        error: `ห้อง ID ${item.roomId}: เลขมิเตอร์ไฟใหม่ (${item.elecCurr}) ต้องไม่ต่ำกว่าเลขเดิม (${item.elecPrev})`,
      };
    }
  }

  try {
    const roomIds = readings.map((r) => r.roomId);

    // ดึงข้อมูลเดิมเพื่อตรวจเช็คว่าห้องไหนล็อกแล้วบ้าง
    const existingList = await prisma.meterReading.findMany({
      where: {
        roomId: { in: roomIds },
        readingMonth,
      },
      include: {
        invoice: true,
        room: true,
      },
    });

    const lockedMap = new Map<number, string>();
    for (const item of existingList) {
      if (item.invoice && item.invoice.status !== "cancelled") {
        lockedMap.set(item.roomId, item.invoice.invoiceNo);
      }
    }

    const today = new Date();

    // ดำเนินการใน Transaction
    await prisma.$transaction(async (tx) => {
      for (const item of readings) {
        // ข้ามห้องที่ถูกออกบิลแล้ว
        if (lockedMap.has(item.roomId)) {
          continue;
        }

        const recordDate = item.readDate ? new Date(item.readDate) : today;

        await tx.meterReading.upsert({
          where: {
            uq_room_reading_month: {
              roomId: item.roomId,
              readingMonth,
            },
          },
          update: {
            waterPrev: item.waterPrev,
            waterCurr: item.waterCurr,
            elecPrev: item.elecPrev,
            elecCurr: item.elecCurr,
            readDate: recordDate,
            note: item.note?.trim() || null,
          },
          create: {
            roomId: item.roomId,
            readingMonth,
            waterPrev: item.waterPrev,
            waterCurr: item.waterCurr,
            elecPrev: item.elecPrev,
            elecCurr: item.elecCurr,
            readDate: recordDate,
            note: item.note?.trim() || null,
          },
        });
      }
    });

    revalidatePath("/meters");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    const skippedCount = lockedMap.size;
    const savedCount = readings.length - skippedCount;

    return {
      success: true,
      message: `บันทึกมิเตอร์สำเร็จ ${savedCount} ห้อง${skippedCount > 0 ? ` (ข้าม ${skippedCount} ห้องที่ออกบิลแล้ว)` : ""}`,
    };
  } catch (err: any) {
    console.error("saveMeterReadingsBatch error:", err);
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกมิเตอร์ทั้งตาราง" };
  }
}

// -----------------------------------------------------------------------------
// 3. ลบรายการมิเตอร์ (Delete Reading) - ลบได้เฉพาะยังไม่ออกบิล
// -----------------------------------------------------------------------------
export async function deleteMeterReading(meterReadingId: number): Promise<MeterActionResult> {
  try {
    const reading = await prisma.meterReading.findUnique({
      where: { id: meterReadingId },
      include: { invoice: true },
    });

    if (!reading) {
      return { error: "ไม่พบรายการมิเตอร์ที่ต้องการลบ" };
    }

    if (reading.invoice && reading.invoice.status !== "cancelled") {
      return {
        error: `ไม่สามารถลบได้เนื่องจากถูกนำไปออกใบแจ้งหนี้ (${reading.invoice.invoiceNo}) แล้ว`,
      };
    }

    await prisma.meterReading.delete({
      where: { id: meterReadingId },
    });

    revalidatePath("/meters");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "ลบรายการมิเตอร์เรียบร้อยแล้ว" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการลบรายการมิเตอร์" };
  }
}
