"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RoomStatus } from "@prisma/client";

export type FormState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// -----------------------------------------------------------------------------
// 1. สร้างห้องพักเดี่ยว (BR-03: ตรวจสอบเลขห้องซ้ำ, ค่าเช่า > 0)
// -----------------------------------------------------------------------------
export async function createRoom(prevState: FormState, formData: FormData): Promise<FormState> {
  const roomNo = formData.get("roomNo")?.toString().trim();
  const floor = parseInt(formData.get("floor")?.toString() || "1", 10);
  const roomType = formData.get("roomType")?.toString().trim() || "พัดลม";
  const baseRent = parseFloat(formData.get("baseRent")?.toString() || "0");
  const note = formData.get("note")?.toString().trim() || null;
  const statusInput = formData.get("status")?.toString() as RoomStatus;

  // ห้องใหม่มีสถานะเป็น vacant หรือ maintenance เท่านั้น (ห้าม occupied โดยตรง)
  const status: RoomStatus = statusInput === "maintenance" ? "maintenance" : "vacant";

  if (!roomNo) {
    return { error: "กรุณากรอกหมายเลขห้องพัก (เช่น 101, 202)" };
  }
  if (isNaN(floor) || floor < 0) {
    return { error: "กรุณาระบุชั้นที่ถูกต้อง (ตัวเลขตั้งแต่ 0 ขึ้นไป)" };
  }
  if (isNaN(baseRent) || baseRent <= 0) {
    return { error: "กรุณาระบุค่าเช่ามาตรฐานมากกว่า 0 บาท" };
  }

  try {
    const existing = await prisma.room.findUnique({
      where: { roomNo },
    });
    if (existing) {
      return { error: `หมายเลขห้อง ${roomNo} มีอยู่ในระบบแล้ว กรุณาใช้หมายเลขอื่น` };
    }

    await prisma.room.create({
      data: {
        roomNo,
        floor,
        roomType,
        baseRent,
        status,
        note,
      },
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกห้องพัก" };
  }

  revalidatePath("/rooms");
  revalidatePath("/");
  redirect("/rooms");
}

// -----------------------------------------------------------------------------
// 2. สร้างห้องพักแบบชุดสำหรับทั้งชั้น (Batch Generator)
// -----------------------------------------------------------------------------
export async function createRoomsBatch(prevState: FormState, formData: FormData): Promise<FormState> {
  const floor = parseInt(formData.get("floor")?.toString() || "1", 10);
  const startNum = parseInt(formData.get("startNum")?.toString() || "1", 10);
  const endNum = parseInt(formData.get("endNum")?.toString() || "10", 10);
  const roomType = formData.get("roomType")?.toString().trim() || "พัดลม";
  const baseRent = parseFloat(formData.get("baseRent")?.toString() || "3500");

  if (isNaN(floor) || floor < 0) {
    return { error: "กรุณาระบุชั้นที่ถูกต้อง" };
  }
  if (isNaN(startNum) || isNaN(endNum) || startNum > endNum || startNum < 1 || endNum > 99) {
    return { error: "ช่วงหมายเลขห้องต้องอยู่ระหว่าง 1 ถึง 99" };
  }
  if (isNaN(baseRent) || baseRent <= 0) {
    return { error: "กรุณาระบุค่าเช่ามาตรฐานมากกว่า 0 บาท" };
  }

  try {
    const roomsToCreate = [];
    for (let i = startNum; i <= endNum; i++) {
      // ตัวอย่าง: ชั้น 1, หมายเลข 1 -> "101", หมายเลข 12 -> "112"
      const paddedNum = i < 10 ? `0${i}` : `${i}`;
      const roomNo = `${floor}${paddedNum}`;

      roomsToCreate.push({
        roomNo,
        floor,
        roomType,
        baseRent,
        status: "vacant" as RoomStatus,
      });
    }

    // กรองห้องที่ซ้ำในระบบออก
    const existingRooms = await prisma.room.findMany({
      where: {
        roomNo: { in: roomsToCreate.map((r) => r.roomNo) },
      },
      select: { roomNo: true },
    });
    const existingSet = new Set(existingRooms.map((r) => r.roomNo));

    const finalRooms = roomsToCreate.filter((r) => !existingSet.has(r.roomNo));

    if (finalRooms.length === 0) {
      return { error: "ห้องทั้งหมดในช่วงหมายเลขนี้มีอยู่ในระบบแล้ว" };
    }

    await prisma.room.createMany({
      data: finalRooms,
    });

    revalidatePath("/rooms");
    revalidatePath("/");
    return {
      success: true,
      message: `สร้างห้องพักสำเร็จ ${finalRooms.length} ห้อง (${finalRooms.map((r) => r.roomNo).join(", ")})`,
    };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการสร้างห้องพักแบบชุด" };
  }
}

// -----------------------------------------------------------------------------
// 3. แก้ไขข้อมูลห้องพัก (BR-03: ป้องกันการตั้งเป็น occupied เองโดยไม่มีสัญญา)
// -----------------------------------------------------------------------------
export async function updateRoom(
  id: number,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const roomNo = formData.get("roomNo")?.toString().trim();
  const floor = parseInt(formData.get("floor")?.toString() || "1", 10);
  const roomType = formData.get("roomType")?.toString().trim() || "พัดลม";
  const baseRent = parseFloat(formData.get("baseRent")?.toString() || "0");
  const note = formData.get("note")?.toString().trim() || null;
  const statusInput = formData.get("status")?.toString() as RoomStatus;

  if (!roomNo) {
    return { error: "กรุณากรอกหมายเลขห้องพัก" };
  }
  if (isNaN(baseRent) || baseRent <= 0) {
    return { error: "กรุณาระบุค่าเช่ามาตรฐานมากกว่า 0 บาท" };
  }

  try {
    // 1. ตรวจสอบเลขห้องซ้ำกับห้องอื่น
    const duplicate = await prisma.room.findFirst({
      where: {
        roomNo,
        NOT: { id },
      },
    });
    if (duplicate) {
      return { error: `หมายเลขห้อง ${roomNo} ซ้ำกับห้องอื่นในระบบ` };
    }

    // 2. ตรวจสอบสัญญา Active ตามกฎ BR-03
    const activeContract = await prisma.contract.findFirst({
      where: { roomId: id, status: "active" },
    });

    let finalStatus: RoomStatus = statusInput;

    if (activeContract) {
      // ถ้ามีสัญญา active: สถานะต้องเป็น occupied เสมอ ห้ามเปลี่ยนเป็น vacant หรือ maintenance
      finalStatus = "occupied";
      if (statusInput && statusInput !== "occupied") {
        return {
          error: "ไม่สามารถเปลี่ยนสถานะได้เนื่องจากห้องนี้มีสัญญาเช่าใช้งานอยู่ (สถานะจะเปลี่ยนอัตโนมัติเมื่อสิ้นสุดสัญญาเช่าเท่านั้น)",
        };
      }
    } else {
      // ถ้าไม่มีสัญญา active: สถานะห้ามเป็น occupied
      if (statusInput === "occupied") {
        return {
          error: "ไม่สามารถเปลี่ยนสถานะเป็น 'มีผู้เช่า' ด้วยมือได้ กรุณาทำสัญญาเช่าใหม่ในเมนูสัญญาเช่า (ตามกฎ BR-03)",
        };
      }
      finalStatus = statusInput === "maintenance" ? "maintenance" : "vacant";
    }

    await prisma.room.update({
      where: { id },
      data: {
        roomNo,
        floor,
        roomType,
        baseRent,
        status: finalStatus,
        note,
      },
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${id}`);
  revalidatePath("/");
  redirect(`/rooms/${id}`);
}

// -----------------------------------------------------------------------------
// 4. ลบห้องพัก (เฉพาะห้องที่ไม่มีประวัติสัญญา, มิเตอร์ หรือบิล ตาม BR-12)
// -----------------------------------------------------------------------------
export async function deleteRoom(id: number): Promise<FormState> {
  try {
    const contractsCount = await prisma.contract.count({ where: { roomId: id } });
    if (contractsCount > 0) {
      return { error: "ไม่สามารถลบห้องนี้ได้ เนื่องจากมีประวัติสัญญาเช่าผูกอยู่ (ตามกฎ BR-12 ห้ามลบข้อมูลธุรกรรม)" };
    }

    const metersCount = await prisma.meterReading.count({ where: { roomId: id } });
    if (metersCount > 0) {
      return { error: "ไม่สามารถลบห้องนี้ได้ เนื่องจากมีประวัติการจดมิเตอร์น้ำไฟผูกอยู่" };
    }

    const repairsCount = await prisma.repairRequest.count({ where: { roomId: id } });
    if (repairsCount > 0) {
      return { error: "ไม่สามารถลบห้องนี้ได้ เนื่องจากมีประวัติการแจ้งซ่อมแซมผูกอยู่" };
    }

    await prisma.room.delete({ where: { id } });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการลบห้องพัก" };
  }

  revalidatePath("/rooms");
  revalidatePath("/");
  redirect("/rooms");
}
