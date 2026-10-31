"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RepairCategory, RepairPriority, RepairStatus } from "@prisma/client";

export type RepairFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
  repairId?: number;
};

// -----------------------------------------------------------------------------
// 1. สร้างคำขอแจ้งซ่อมแซมใหม่ (User Requirement 2.21 / 4.21)
// -----------------------------------------------------------------------------
export async function createRepairRequest(
  prevState: RepairFormState,
  formData: FormData
): Promise<RepairFormState> {
  const roomId = parseInt(formData.get("roomId")?.toString() || "0", 10);
  let tenantId = parseInt(formData.get("tenantId")?.toString() || "0", 10);
  const title = formData.get("title")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || "";
  const categoryStr = formData.get("category")?.toString() || "other";
  const priorityStr = formData.get("priority")?.toString() || "normal";
  const imageUrl = formData.get("imageUrl")?.toString().trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!roomId || roomId <= 0) {
    fieldErrors.roomId = "กรุณาเลือกห้องพักที่ต้องการแจ้งซ่อม";
  }

  if (!title) {
    fieldErrors.title = "กรุณาระบุหัวข้องานแจ้งซ่อม";
  } else if (title.length > 120) {
    fieldErrors.title = "หัวข้อต้องมีความยาวไม่เกิน 120 ตัวอักษร";
  }

  if (!description) {
    fieldErrors.description = "กรุณาระบุรายละเอียดของปัญหา";
  }

  const validCategories: RepairCategory[] = ["electric", "plumbing", "aircon", "furniture", "other"];
  const category = validCategories.includes(categoryStr as RepairCategory)
    ? (categoryStr as RepairCategory)
    : "other";

  const validPriorities: RepairPriority[] = ["low", "normal", "urgent"];
  const priority = validPriorities.includes(priorityStr as RepairPriority)
    ? (priorityStr as RepairPriority)
    : "normal";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "กรุณากรอกข้อมูลการแจ้งซ่อมให้ครบถ้วน",
      fieldErrors,
    };
  }

  let createdId: number;

  try {
    // หากไม่ได้ระบุ tenantId ให้ดึงผู้เช่าปัจจุบันของห้องนั้นจากสัญญา active อัตโนมัติ (UR-2.21)
    if (!tenantId || tenantId <= 0) {
      const activeContract = await prisma.contract.findFirst({
        where: { roomId, status: "active" },
        select: { tenantId: true },
      });
      if (activeContract) {
        tenantId = activeContract.tenantId;
      }
    }

    const newRepair = await prisma.repairRequest.create({
      data: {
        roomId,
        tenantId: tenantId > 0 ? tenantId : null,
        title,
        description,
        category,
        priority,
        imageUrl,
        status: "open",
        reportedAt: new Date(),
      },
    });

    createdId = newRepair.id;
  } catch (err: any) {
    console.error("createRepairRequest error:", err);
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกการแจ้งซ่อม" };
  }

  revalidatePath("/repairs");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/repairs/${createdId}`);
}

// -----------------------------------------------------------------------------
// 2. มอบหมายช่าง & อัปเดตสถานะงานซ่อมตาม Workflow (กฎ 4.22)
// Workflow: open -> in_progress -> done (หรือ cancelled)
// -----------------------------------------------------------------------------
export async function updateRepairStatus(
  repairId: number,
  formData: FormData
): Promise<RepairFormState> {
  const targetStatus = formData.get("status")?.toString() as RepairStatus;
  const assignedTo = formData.get("assignedTo")?.toString().trim() || null;
  const resolutionNote = formData.get("resolutionNote")?.toString().trim() || null;
  const cost = parseFloat(formData.get("cost")?.toString() || "0");
  const isAdmin = formData.get("isAdmin")?.toString() === "true";

  if (!repairId || repairId <= 0) {
    return { error: "ไม่พบรหัสงานซ่อม" };
  }

  try {
    const repair = await prisma.repairRequest.findUnique({
      where: { id: repairId },
    });

    if (!repair) {
      return { error: "ไม่พบข้อมูลงานซ่อมในระบบ" };
    }

    const currentStatus = repair.status;

    // ตรวจสอบกฎการเปลี่ยนสถานะตามข้อกำหนด 4.22
    // 1. ห้ามข้ามจาก open ไป done โดยตรง (ต้องผ่าน in_progress ก่อน)
    if (currentStatus === "open" && targetStatus === "done") {
      return {
        error: "ไม่สามารถเปลี่ยนจาก 'รอดำเนินการ' ไปเป็น 'เสร็จสิ้น' โดยตรงได้ ต้องมอบหมายช่างเข้าสถานะ 'กำลังดำเนินการ' ก่อน (ตามกฎ 4.22)",
      };
    }

    // 2. การเปลี่ยนเป็น done ต้องบังคับกรอกบันทึกผลการซ่อม
    if (targetStatus === "done") {
      if (!resolutionNote) {
        return { error: "กรุณาระบุบันทึกผลการซ่อม (บังคับเมื่อสถานะเสร็จสิ้น)" };
      }
      if (isNaN(cost) || cost < 0) {
        return { error: "ค่าใช้จ่ายต้องเป็นจำนวนตัวเลข 0 บาทขึ้นไป" };
      }
    }

    // 3. กฎการย้อนสถานะ: ย้อนจาก done กลับเป็น in_progress อนุญาตเฉพาะ Admin เท่านั้น
    if (currentStatus === "done" && targetStatus === "in_progress" && !isAdmin) {
      return {
        error: "การย้อนสถานะจาก 'เสร็จสิ้น' กลับเป็น 'กำลังดำเนินการ' อนุญาตเฉพาะบทบาท Admin เท่านั้น (ตามกฎ 4.22)",
      };
    }

    // กำหนดค่าอัปเดตตามสถานะเป้าหมาย
    const updateData: any = {
      status: targetStatus,
    };

    if (assignedTo !== null) {
      updateData.assignedTo = assignedTo;
    }

    if (targetStatus === "in_progress") {
      if (!repair.startedAt) {
        updateData.startedAt = new Date();
      }
    } else if (targetStatus === "done") {
      updateData.completedAt = new Date();
      updateData.resolutionNote = resolutionNote;
      updateData.cost = Math.max(0, cost);
    } else if (targetStatus === "cancelled") {
      if (resolutionNote) {
        updateData.resolutionNote = `[ยกเลิกงานซ่อม] ${resolutionNote}`;
      }
    }

    await prisma.repairRequest.update({
      where: { id: repairId },
      data: updateData,
    });

    revalidatePath("/repairs");
    revalidatePath(`/repairs/${repairId}`);
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, message: "อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว" };
  } catch (err: any) {
    console.error("updateRepairStatus error:", err);
    return { error: err.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะงานซ่อม" };
  }
}

// -----------------------------------------------------------------------------
// 3. แก้ไขข้อมูลรายละเอียดงานซ่อม (Edit Repair Details)
// -----------------------------------------------------------------------------
export async function updateRepairDetails(
  repairId: number,
  formData: FormData
): Promise<RepairFormState> {
  const title = formData.get("title")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || "";
  const categoryStr = formData.get("category")?.toString() || "other";
  const priorityStr = formData.get("priority")?.toString() || "normal";
  const imageUrl = formData.get("imageUrl")?.toString().trim() || null;

  if (!title) return { error: "กรุณาระบุหัวข้องานซ่อม" };
  if (!description) return { error: "กรุณาระบุรายละเอียด" };

  try {
    const repair = await prisma.repairRequest.findUnique({
      where: { id: repairId },
    });

    if (!repair) return { error: "ไม่พบงานซ่อม" };
    if (repair.status === "done") {
      return { error: "ไม่สามารถแก้ไขงานซ่อมที่เสร็จสิ้นไปแล้ว" };
    }

    await prisma.repairRequest.update({
      where: { id: repairId },
      data: {
        title,
        description,
        category: categoryStr as RepairCategory,
        priority: priorityStr as RepairPriority,
        imageUrl,
      },
    });

    revalidatePath("/repairs");
    revalidatePath(`/repairs/${repairId}`);
    return { success: true, message: "แก้ไขรายละเอียดงานซ่อมสำเร็จ" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการแก้ไข" };
  }
}
