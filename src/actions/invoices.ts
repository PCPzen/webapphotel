"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parseReadingMonth } from "@/lib/meters";
import { roundHalfUp, computeDueDate, generateInvoiceNo } from "@/lib/invoices";

export type InvoiceActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  invoiceIds?: number[];
};

export type GenerateInvoiceItemInput = {
  contractId: number;
  meterReadingId: number;
  otherAmount?: number;
  otherNote?: string;
};

// -----------------------------------------------------------------------------
// 1. สร้างใบแจ้งหนี้แบบทั้งเดือน / หลายห้อง (Batch Generate Invoices) - BR-05, BR-06, BR-11
// -----------------------------------------------------------------------------
export async function generateInvoicesBatch(
  billingMonthStr: string,
  items: GenerateInvoiceItemInput[]
): Promise<InvoiceActionResult> {
  const billingMonth = parseReadingMonth(billingMonthStr);

  if (!items || items.length === 0) {
    return { error: "กรุณาเลือกห้องพักที่ต้องการออกใบแจ้งหนี้" };
  }

  try {
    const contractIds = items.map((i) => i.contractId);
    const meterReadingIds = items.map((i) => i.meterReadingId);

    // 1. ดึงข้อมูลสัญญาและห้องพัก
    const contracts = await prisma.contract.findMany({
      where: { id: { in: contractIds } },
      include: {
        room: true,
        tenant: true,
        invoices: {
          where: { billingMonth },
        },
      },
    });

    const contractMap = new Map(contracts.map((c) => [c.id, c]));

    // 2. ดึงข้อมูลมิเตอร์
    const meterReadings = await prisma.meterReading.findMany({
      where: { id: { in: meterReadingIds } },
      include: { invoice: true },
    });

    const meterMap = new Map(meterReadings.map((m) => [m.id, m]));

    // 3. ตรวจสอบความถูกต้องตามกฎธุรกิจ
    for (const item of items) {
      const contract = contractMap.get(item.contractId);
      if (!contract) {
        return { error: `ไม่พบสัญญาเช่า ID: ${item.contractId}` };
      }

      // กฎ BR-06: หนึ่งสัญญา หนึ่งบิลต่อเดือน (ห้ามออกซ้ำถ้ายังมีบิล active อยู่)
      const existingActiveInvoice = contract.invoices.find((inv) => inv.status !== "cancelled");
      if (existingActiveInvoice) {
        return {
          error: `ห้อง ${contract.room.roomNo} มีใบแจ้งหนี้ของรอบเดือนนี้แล้ว (${existingActiveInvoice.invoiceNo}) ตามกฎ BR-06 ห้ามออกบิลซ้ำ`,
        };
      }

      const meter = meterMap.get(item.meterReadingId);
      if (!meter) {
        return { error: `ห้อง ${contract.room.roomNo} ไม่พบข้อมูลมิเตอร์ที่เลือก` };
      }

      if (meter.invoice && meter.invoice.status !== "cancelled") {
        return {
          error: `มิเตอร์ห้อง ${contract.room.roomNo} ถูกนำไปออกใบแจ้งหนี้ (${meter.invoice.invoiceNo}) แล้ว`,
        };
      }
    }

    const createdInvoiceIds: number[] = [];

    // 4. บันทึกใบแจ้งหนี้ทั้งหมดใน Transaction เดียวกัน
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const contract = contractMap.get(item.contractId)!;
        const meter = meterMap.get(item.meterReadingId)!;

        // คำนวณหน่วยใช้ (Units)
        const waterUnits = Math.max(0, meter.waterCurr - meter.waterPrev);
        const electricUnits = Math.max(0, meter.elecCurr - meter.elecPrev);

        // คำนวณยอดเงินตามกฎ BR-05 (Decimal Half-Up ที่ระดับรายการ)
        const waterRate = Number(contract.waterRate);
        const electricRate = Number(contract.electricRate);
        const waterAmount = roundHalfUp(waterUnits * waterRate, 2);
        const electricAmount = roundHalfUp(electricUnits * electricRate, 2);
        const rentAmount = Number(contract.monthlyRent);

        const otherAmount = roundHalfUp(Math.max(0, item.otherAmount || 0), 2);
        const otherNote = item.otherNote?.trim() || null;
        const lateFee = 0; // ค่าปรับเริ่มต้น 0 (คิดเมื่อเกินกำหนดตาม BR-09)

        const totalAmount = roundHalfUp(
          rentAmount + waterAmount + electricAmount + otherAmount + lateFee,
          2
        );

        // คำนวณวันครบกำหนดชำระ (Due Date)
        const dueDate = computeDueDate(billingMonth, contract.dueDay);

        // สร้างเลขที่ใบแจ้งหนี้ตาม BR-11 (INV-YYYYMM-ROOM)
        let invoiceNo = generateInvoiceNo(billingMonth, contract.room.roomNo);

        // ตรวจสอบความซ้ำซ้อนของเลขที่เอกสาร
        const existingNo = await tx.invoice.findUnique({
          where: { invoiceNo },
        });
        if (existingNo) {
          invoiceNo = generateInvoiceNo(billingMonth, contract.room.roomNo, Date.now() % 1000);
        }

        // สร้างใบแจ้งหนี้
        const newInvoice = await tx.invoice.create({
          data: {
            contractId: contract.id,
            meterReadingId: meter.id,
            invoiceNo,
            billingMonth,
            rentAmount,
            waterUnits,
            waterAmount,
            electricUnits,
            electricAmount,
            otherAmount,
            otherNote,
            lateFee,
            totalAmount,
            dueDate,
            status: "unpaid",
          },
        });

        createdInvoiceIds.push(newInvoice.id);
      }
    });

    revalidatePath("/invoices");
    revalidatePath("/meters");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: `ออกใบแจ้งหนี้สำเร็จเรียบร้อย ${createdInvoiceIds.length} ฉบับ`,
      invoiceIds: createdInvoiceIds,
    };
  } catch (err: any) {
    console.error("generateInvoicesBatch error:", err);
    return { error: err.message || "เกิดข้อผิดพลาดในการออกใบแจ้งหนี้" };
  }
}

// -----------------------------------------------------------------------------
// 2. แก้ไขค่าใช้จ่ายอื่น ๆ (Other Fee) - ทำได้ขณะสถานะ unpaid และยังไม่ชำระ
// -----------------------------------------------------------------------------
export async function updateInvoiceOtherFee(
  invoiceId: number,
  formData: FormData
): Promise<InvoiceActionResult> {
  const otherAmount = parseFloat(formData.get("otherAmount")?.toString() || "0");
  const otherNote = formData.get("otherNote")?.toString().trim() || null;

  if (isNaN(otherAmount) || otherAmount < 0) {
    return { error: "จำนวนค่าใช้จ่ายอื่น ๆ ต้องไม่ติดลบ (0 บาทขึ้นไป)" };
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: { where: { status: "valid" } },
      },
    });

    if (!invoice) {
      return { error: "ไม่พบใบแจ้งหนี้" };
    }

    if (invoice.status === "cancelled") {
      return { error: "ไม่สามารถแก้ไขใบแจ้งหนี้ที่ถูกยกเลิกไปแล้ว" };
    }

    if (invoice.payments.length > 0) {
      return { error: "ไม่สามารถแก้ไขได้เนื่องจากมีการบันทึกการชำระเงินในบิลนี้แล้ว" };
    }

    const roundedOther = roundHalfUp(otherAmount, 2);
    const newTotal = roundHalfUp(
      Number(invoice.rentAmount) +
        Number(invoice.waterAmount) +
        Number(invoice.electricAmount) +
        roundedOther +
        Number(invoice.lateFee),
      2
    );

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        otherAmount: roundedOther,
        otherNote,
        totalAmount: newTotal,
      },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { success: true, message: "อัปเดตค่าใช้จ่ายอื่น ๆ สำเร็จ" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการอัปเดตค่าใช้จ่าย" };
  }
}

// -----------------------------------------------------------------------------
// 3. คิดค่าปรับล่าช้า (กฎ BR-09: คิดได้ครั้งเดียวเมื่อเลยวันครบกำหนด)
// -----------------------------------------------------------------------------
export async function applyLateFee(invoiceId: number): Promise<InvoiceActionResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: true,
        payments: { where: { status: "valid" } },
      },
    });

    if (!invoice) {
      return { error: "ไม่พบใบแจ้งหนี้" };
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return { error: "ไม่สามารถคิดค่าปรับกับบิลที่ชำระครบแล้วหรือถูกยกเลิก" };
    }

    // ตรวจสอบว่าเคยคิดค่าปรับไปแล้วหรือยัง (กฎ BR-09: คิดได้ครั้งเดียวต่อใบแจ้งหนี้)
    if (Number(invoice.lateFee) > 0) {
      return { error: "ใบแจ้งหนี้นี้ได้คิดค่าปรับล่าช้าไปแล้ว (ตามกฎ BR-09 คิดได้เพียงครั้งเดียว)" };
    }

    // ตรวจสอบวันครบกำหนด (เลยกำหนดหรือไม่)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(invoice.dueDate);
    due.setHours(0, 0, 0, 0);

    if (today.getTime() <= due.getTime()) {
      return { error: "ยังไม่ถึงวันครบกำหนดชำระ ไม่สามารถคิดค่าปรับล่าช้าได้" };
    }

    const contractLateFee = Number(invoice.contract.lateFee);
    if (contractLateFee <= 0) {
      return { error: "สัญญาเช่าของห้องนี้กำหนดค่าปรับไว้ 0 บาท" };
    }

    const newLateFee = roundHalfUp(contractLateFee, 2);
    const newTotal = roundHalfUp(Number(invoice.totalAmount) + newLateFee, 2);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        lateFee: newLateFee,
        totalAmount: newTotal,
      },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return {
      success: true,
      message: `บันทึกค่าปรับล่าช้า ฿${newLateFee.toLocaleString()} สำเร็จ`,
    };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการคิดค่าปรับล่าช้า" };
  }
}

// -----------------------------------------------------------------------------
// 4. ยกเลิกใบแจ้งหนี้ (Cancel Invoice) - กฎ BR-06 & 4.16
// -----------------------------------------------------------------------------
export async function cancelInvoice(
  invoiceId: number,
  reason?: string
): Promise<InvoiceActionResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: { where: { status: "valid" } },
      },
    });

    if (!invoice) {
      return { error: "ไม่พบใบแจ้งหนี้" };
    }

    if (invoice.status === "cancelled") {
      return { error: "ใบแจ้งหนี้นี้ถูกยกเลิกไปแล้ว" };
    }

    // ตรวจสอบการชำระเงิน
    if (invoice.payments.length > 0) {
      return {
        error:
          "ไม่สามารถยกเลิกใบแจ้งหนี้ได้เนื่องจากมีการบันทึกการชำระเงินอยู่ (ต้องยกเลิกใบเสร็จหรือเงินรับชำระก่อนตามกฎ BR-08)",
      };
    }

    // ยกเลิกบิล
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "cancelled",
        otherNote: reason ? `${invoice.otherNote || ""} [ยกเลิก: ${reason}]`.trim() : invoice.otherNote,
      },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/meters");
    revalidatePath("/dashboard");

    return { success: true, message: "ยกเลิกใบแจ้งหนี้สำเร็จ ปลดล็อกมิเตอร์เรียบร้อย" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการยกเลิกใบแจ้งหนี้" };
  }
}
