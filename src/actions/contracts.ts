"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContractStatus } from "@prisma/client";

export type ContractFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
};

// -----------------------------------------------------------------------------
// 1. สร้างสัญญาเช่าใหม่ (BR-02 & BR-03)
// -----------------------------------------------------------------------------
export async function createContract(
  prevState: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const roomId = parseInt(formData.get("roomId")?.toString() || "0", 10);
  const tenantId = parseInt(formData.get("tenantId")?.toString() || "0", 10);
  const startDateStr = formData.get("startDate")?.toString().trim() || "";
  const endDateStr = formData.get("endDate")?.toString().trim() || "";
  const monthlyRent = parseFloat(formData.get("monthlyRent")?.toString() || "0");
  const deposit = parseFloat(formData.get("deposit")?.toString() || "0");
  const waterRate = parseFloat(formData.get("waterRate")?.toString() || "18");
  const electricRate = parseFloat(formData.get("electricRate")?.toString() || "8");
  const lateFee = parseFloat(formData.get("lateFee")?.toString() || "50");
  const dueDay = parseInt(formData.get("dueDay")?.toString() || "5", 10);

  const fieldErrors: Record<string, string> = {};

  if (!roomId || roomId <= 0) fieldErrors.roomId = "กรุณาเลือกห้องพัก";
  if (!tenantId || tenantId <= 0) fieldErrors.tenantId = "กรุณาเลือกผู้เช่าหลัก";

  if (!startDateStr) fieldErrors.startDate = "กรุณาระบุวันเริ่มต้นสัญญา";
  if (!endDateStr) fieldErrors.endDate = "กรุณาระบุวันสิ้นสุดสัญญา";

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime())) fieldErrors.startDate = "วันที่เริ่มต้นไม่ถูกต้อง";
  if (isNaN(endDate.getTime())) fieldErrors.endDate = "วันที่สิ้นสุดไม่ถูกต้อง";

  if (startDate && endDate && endDate <= startDate) {
    fieldErrors.endDate = "วันสิ้นสุดสัญญาต้องมากกว่าวันเริ่มต้นสัญญา (ตามกฎ SRD 4.10)";
  }

  if (isNaN(monthlyRent) || monthlyRent <= 0) {
    fieldErrors.monthlyRent = "ค่าเช่ารายเดือนต้องมากกว่า 0 บาท";
  }
  if (isNaN(deposit) || deposit < 0) {
    fieldErrors.deposit = "เงินมัดจำต้องไม่ติดลบ (0 บาทขึ้นไป)";
  }
  if (isNaN(waterRate) || waterRate < 0) {
    fieldErrors.waterRate = "อัตราค่าน้ำต้องไม่ติดลบ";
  }
  if (isNaN(electricRate) || electricRate < 0) {
    fieldErrors.electricRate = "อัตราค่าไฟต้องไม่ติดลบ";
  }
  if (isNaN(lateFee) || lateFee < 0) {
    fieldErrors.lateFee = "ค่าปรับล่าช้าต้องไม่ติดลบ";
  }
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
    fieldErrors.dueDay = "วันครบกำหนดชำระต้องอยู่ระหว่างวันที่ 1 ถึง 28 ของเดือน";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "กรุณาตรวจสอบข้อมูลสัญญาเช่าให้ครบถ้วนถูกต้อง",
      fieldErrors,
    };
  }

  let createdContractId: number;

  try {
    // กฎ BR-02: ตรวจสอบว่าห้องนี้มีสัญญา active อยู่แล้วหรือไม่
    const existingActive = await prisma.contract.findFirst({
      where: { roomId, status: "active" },
    });
    if (existingActive) {
      return {
        error: "ห้องพักนี้มีสัญญาเช่าที่เปิดใช้งานอยู่แล้ว (ตามกฎ BR-02 ห้องหนึ่งมีได้แค่ 1 สัญญา Active)",
      };
    }

    // กฎ BR-03: ทำการบันทึกสัญญา และเปลี่ยนสถานะห้องเป็น occupied ใน Transaction เดียวกัน
    const result = await prisma.$transaction(async (tx) => {
      // 1. บันทึกสัญญาเช่า
      const newContract = await tx.contract.create({
        data: {
          roomId,
          tenantId,
          startDate,
          endDate,
          monthlyRent,
          deposit,
          waterRate,
          electricRate,
          lateFee,
          dueDay,
          status: "active",
        },
      });

      // 2. อัปเดตสถานะห้องพักเป็น occupied
      await tx.room.update({
        where: { id: roomId },
        data: { status: "occupied" },
      });

      return newContract;
    });

    createdContractId = result.id;
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการสร้างสัญญาเช่า" };
  }

  revalidatePath("/contracts");
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/contracts/${createdContractId}`);
}

// -----------------------------------------------------------------------------
// 2. สิ้นสุดสัญญาเช่าและคืนเงินมัดจำ (กฎ BR-10 & BR-03)
// -----------------------------------------------------------------------------
export async function endContract(
  contractId: number,
  formData: FormData
): Promise<ContractFormState> {
  const movedOutDateStr = formData.get("movedOutDate")?.toString().trim() || "";
  const damageAmount = parseFloat(formData.get("damageAmount")?.toString() || "0");
  const exitNote = formData.get("exitNote")?.toString().trim() || null;

  if (!movedOutDateStr) {
    return { error: "กรุณาระบุวันที่ย้ายออกจริง" };
  }
  const movedOutDate = new Date(movedOutDateStr);
  if (isNaN(movedOutDate.getTime())) {
    return { error: "รูปแบบวันที่ย้ายออกไม่ถูกต้อง" };
  }
  if (isNaN(damageAmount) || damageAmount < 0) {
    return { error: "ค่าเสียหายต้องไม่ติดลบ (0 บาทขึ้นไป)" };
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        room: true,
        invoices: {
          where: { status: { in: ["unpaid", "partial"] } },
          include: { payments: { where: { status: "valid" } } },
          orderBy: { billingMonth: "asc" }, // เก่าสุดก่อน
        },
      },
    });

    if (!contract || contract.status !== "active") {
      return { error: "สัญญานี้ไม่ได้อยู่ในสถานะเปิดใช้งาน (Active)" };
    }

    // คำนวณสูตรตามกฎ BR-10:
    // D = เงินมัดจำ, X = ค่าเสียหาย, O = ยอดค้างชำระรวมทุกใบแจ้งหนี้
    const D = Number(contract.deposit);
    const X = damageAmount;

    // คำนวณหายอดค้างรวม (O)
    let O = 0;
    const unpaidInvoicesWithBalance = contract.invoices.map((inv) => {
      const paidSum = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = Math.max(0, Number(inv.totalAmount) - paidSum);
      O += balance;
      return { invoice: inv, balance };
    });

    const A = Math.max(0, D - X);
    const depositApplied = Math.min(A, O); // หักยอดค้าง
    const depositRefund = A - depositApplied; // เงินคืนผู้เช่า
    const tenantMustPayMore = O - depositApplied + Math.max(0, X - D); // ผู้เช่าต้องชำระเพิ่ม

    // บันทึกการสิ้นสุดสัญญาและคืนห้องใน Transaction เดียวกัน
    await prisma.$transaction(async (tx) => {
      // 1. ถ้ามีเงินมัดจำหักยอดค้าง (depositApplied > 0) ให้สร้าง payment แบบ deposit_offset ตัดบิลเก่าสุดก่อน
      let remainingOffset = depositApplied;

      for (const item of unpaidInvoicesWithBalance) {
        if (remainingOffset <= 0) break;
        if (item.balance <= 0) continue;

        const offsetForThisBill = Math.min(remainingOffset, item.balance);
        const receiptNo = `RCP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

        // บันทึกการชำระเงิน
        await tx.payment.create({
          data: {
            invoiceId: item.invoice.id,
            receiptNo,
            amount: offsetForThisBill,
            method: "deposit_offset",
            status: "valid",
            referenceNote: `หักจากเงินมัดจำตอนสิ้นสุดสัญญาห้อง ${contract.room.roomNo}`,
          },
        });

        // อัปเดตสถานะบิล
        const newPaidSum =
          item.invoice.payments.reduce((s, p) => s + Number(p.amount), 0) + offsetForThisBill;
        const newStatus =
          newPaidSum >= Number(item.invoice.totalAmount) ? "paid" : "partial";

        await tx.invoice.update({
          where: { id: item.invoice.id },
          data: { status: newStatus },
        });

        remainingOffset -= offsetForThisBill;
      }

      // 2. อัปเดตสถานะสัญญาเป็น ended พร้อมบันทึกผลการคำนวณเงินมัดจำ
      await tx.contract.update({
        where: { id: contractId },
        data: {
          status: "ended",
          movedOutDate,
          damageAmount: X,
          depositApplied,
          depositRefund,
          exitNote: `${exitNote || ""}${tenantMustPayMore > 0 ? ` (ผู้เช่ามียอดค้างต้องชำระเพิ่ม ฿${tenantMustPayMore.toLocaleString()})` : ""}`.trim(),
        },
      });

      // 3. คืนสถานะห้องกลับเป็น vacant
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: "vacant" },
      });
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการสิ้นสุดสัญญาเช่า" };
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/contracts/${contractId}`);
}

// -----------------------------------------------------------------------------
// 3. ยกเลิกสัญญาเช่า (SRD 4.10: ยกเลิกสัญญาที่สร้างผิดเมื่อยังไม่มีใบแจ้งหนี้)
// -----------------------------------------------------------------------------
export async function cancelContract(contractId: number): Promise<ContractFormState> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { invoices: true },
    });

    if (!contract || contract.status !== "active") {
      return { error: "สามารถยกเลิกได้เฉพาะสัญญาที่กำลัง Active เท่านั้น" };
    }

    if (contract.invoices.length > 0) {
      return {
        error: "ไม่สามารถยกเลิกสัญญาได้เนื่องจากมีการออกใบแจ้งหนี้ไปแล้ว (ตามกฎ SRD 4.10 ต้องใช้การสิ้นสุดสัญญาและคืนเงินมัดจำแทน)",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { status: "cancelled" },
      });

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: "vacant" },
      });
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการยกเลิกสัญญา" };
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/contracts");
}
