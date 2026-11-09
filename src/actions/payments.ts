"use server";

import { toSafeErrorMessage } from "@/lib/safe-error";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";
import { roundHalfUp } from "@/lib/invoices";
import { requireStaffOrAdmin } from "@/lib/auth-guard";
import { stripEmoji } from "@/lib/emoji";
import { setToastCookie } from "@/lib/toast";

export type PaymentActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
  paymentId?: number;
  receiptNo?: string;
};

// -----------------------------------------------------------------------------
// Helper: สร้างเลขที่ใบเสร็จรับเงิน (BR-11: RCP-YYYYMM-XXXX ลำดับ 4 หลักต่อเดือน)
// -----------------------------------------------------------------------------
async function generateNextReceiptNo(tx: any, paidDate: Date): Promise<string> {
  const y = paidDate.getFullYear();
  const m = String(paidDate.getMonth() + 1).padStart(2, "0");
  const prefix = `RCP-${y}${m}-`;

  // ค้นหารายการใบเสร็จล่าสุดของเดือนนี้
  const latestPayment = await tx.payment.findFirst({
    where: {
      receiptNo: { startsWith: prefix },
    },
    orderBy: { receiptNo: "desc" },
    select: { receiptNo: true },
  });

  let nextSeq = 1;
  if (latestPayment && latestPayment.receiptNo) {
    const parts = latestPayment.receiptNo.split("-");
    if (parts.length >= 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSeq = currentSeq + 1;
      }
    }
  }

  const seqStr = String(nextSeq).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

// -----------------------------------------------------------------------------
// 1. บันทึกการรับชำระเงิน (กฎ BR-08, BR-07, BR-11)
// -----------------------------------------------------------------------------
export async function recordPayment(formData: FormData): Promise<PaymentActionResult> {
  const auth = await requireStaffOrAdmin();
  if (!auth.authorized) return { error: auth.error };

  const invoiceId = parseInt(formData.get("invoiceId")?.toString() || "0", 10);
  const amount = parseFloat(formData.get("amount")?.toString() || "0");
  const methodStr = formData.get("method")?.toString() || "bank_transfer";
  const paidAtStr = formData.get("paidAt")?.toString() || "";
  const rawRefNote = formData.get("referenceNote")?.toString().trim();
  const referenceNote = rawRefNote ? stripEmoji(rawRefNote) : null;
  const slipImageUrl = formData.get("slipImageUrl")?.toString().trim() || null;

  if (!invoiceId || invoiceId <= 0) {
    return { error: "กรุณาเลือกใบแจ้งหนี้ที่ต้องการรับชำระ" };
  }

  if (isNaN(amount) || amount <= 0) {
    return { error: "จำนวนเงินที่ชำระต้องมากกว่า 0 บาท (ตามกฎ BR-08)" };
  }

  const validMethods: PaymentMethod[] = ["cash", "bank_transfer", "deposit_offset", "other"];
  const method = validMethods.includes(methodStr as PaymentMethod)
    ? (methodStr as PaymentMethod)
    : "bank_transfer";

  const paidAt = paidAtStr ? new Date(paidAtStr) : new Date();
  if (isNaN(paidAt.getTime())) {
    return { error: "รูปแบบวันเวลาที่รับเงินไม่ถูกต้อง" };
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: { where: { status: "valid" } },
        contract: { include: { room: true, tenant: true } },
      },
    });

    if (!invoice) {
      return { error: "ไม่พบใบแจ้งหนี้ที่ระบุ" };
    }

    if (invoice.status === "cancelled") {
      return { error: "ไม่สามารถรับชำระเงินกับใบแจ้งหนี้ที่ถูกยกเลิกไปแล้ว" };
    }

    // คำนวณยอดที่ชำระแล้วและยอดค้างชำระ
    const totalAmount = Number(invoice.totalAmount);
    const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = roundHalfUp(Math.max(0, totalAmount - alreadyPaid), 2);

    if (balance <= 0) {
      return { error: "ใบแจ้งหนี้นี้ได้ชำระเงินครบถ้วนแล้ว ไม่มียอดคงค้าง" };
    }

    // กฎ BR-08: จำนวนเงินต้องไม่เกินยอดค้างคงเหลือ
    const paymentAmount = roundHalfUp(amount, 2);
    if (paymentAmount > balance) {
      return {
        error: `จำนวนเงินที่ชำระ (฿${paymentAmount.toLocaleString()}) เกินยอดค้างชำระ (฿${balance.toLocaleString()}) ตามกฎ BR-08`,
      };
    }

    let createdPaymentId = 0;
    let createdReceiptNo = "";
    let maxRetries = 3;

    // บันทึกการชำระเงินและอัปเดตสถานะบิลใน Transaction เดียวกัน พร้อมระบบ Retry ป้องกันเลขใบเสร็จชนกัน (Concurrency)
    while (maxRetries > 0) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. ออกเลขที่ใบเสร็จรับเงินตามกฎ BR-11
          const receiptNo = await generateNextReceiptNo(tx, paidAt);

          // 2. สร้างเรคคอร์ดการรับชำระเงิน
          const newPayment = await tx.payment.create({
            data: {
              invoiceId,
              receiptNo,
              amount: paymentAmount,
              method,
              paidAt,
              referenceNote,
              slipImageUrl,
              status: "valid",
            },
          });

          // 3. คำนวณสถานะบิลใหม่ตามกฎ BR-07
          const newTotalPaid = roundHalfUp(alreadyPaid + paymentAmount, 2);
          let newInvoiceStatus: "paid" | "partial" | "unpaid" = "partial";

          if (newTotalPaid >= totalAmount) {
            newInvoiceStatus = "paid";
          } else if (newTotalPaid > 0) {
            newInvoiceStatus = "partial";
          } else {
            newInvoiceStatus = "unpaid";
          }

          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: newInvoiceStatus },
          });

          return newPayment;
        });

        createdPaymentId = result.id;
        createdReceiptNo = result.receiptNo;
        break;
      } catch (txErr: any) {
        maxRetries--;
        if (txErr?.code === "P2002" && maxRetries > 0) {
          // กรณีเกิดการกดพร้อมกันเสี้ยววินาที ให้คำนวณเลขลำดับใหม่ในรอบถัดไป
          continue;
        }
        throw txErr;
      }
    }

    revalidatePath("/payments");
    revalidatePath(`/payments/${createdPaymentId}/receipt`);
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/");

    await setToastCookie(`บันทึกรับเงินสำเร็จ ออกใบเสร็จเลขที่ ${createdReceiptNo}`, "success");
    return {
      success: true,
      message: `บันทึกการรับชำระเงินสำเร็จ ออกใบเสร็จเลขที่ ${createdReceiptNo}`,
      paymentId: createdPaymentId,
      receiptNo: createdReceiptNo,
    };
  } catch (err: any) {
    console.error("recordPayment error:", err);
    return { error: toSafeErrorMessage(err, "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน") };
  }
}

// -----------------------------------------------------------------------------
// 2. ยกเลิกการชำระเงิน (Void Payment) - กฎ BR-08 & BR-12 (ห้ามลบ ให้ void)
// -----------------------------------------------------------------------------
export async function voidPayment(
  paymentId: number,
  voidReason: string
): Promise<PaymentActionResult> {
  const auth = await requireStaffOrAdmin();
  if (!auth.authorized) return { error: auth.error };

  const rawReason = voidReason?.trim();
  const reason = rawReason ? stripEmoji(rawReason) : "";
  if (!reason) {
    return { error: "กรุณาระบุเหตุผลในการยกเลิกใบเสร็จ (ตามกฎ BR-08)" };
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      return { error: "ไม่พบรายการชำระเงินที่ต้องการยกเลิก" };
    }

    if (payment.status === "voided") {
      return { error: "รายการชำระเงินนี้ถูกยกเลิก (Void) ไปแล้ว" };
    }

    // ดำเนินการยกเลิกและคำนวณสถานะบิลใหม่ใน Transaction เดียวกัน
    await prisma.$transaction(async (tx) => {
      // 1. อัปเดตสถานะ payment เป็น voided
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "voided",
          voidReason: reason,
          voidedAt: new Date(),
        },
      });

      // 2. คำนวณยอดชำระที่ใช้ได้ใหม่ทั้งหมดของบิลนี้
      const remainingValidPayments = payment.invoice.payments.filter(
        (p) => p.id !== paymentId && p.status === "valid"
      );

      const newTotalPaid = roundHalfUp(
        remainingValidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        2
      );

      const invoiceTotal = Number(payment.invoice.totalAmount);
      let newInvoiceStatus: "paid" | "partial" | "unpaid" = "unpaid";

      if (newTotalPaid >= invoiceTotal) {
        newInvoiceStatus = "paid";
      } else if (newTotalPaid > 0) {
        newInvoiceStatus = "partial";
      } else {
        newInvoiceStatus = "unpaid";
      }

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newInvoiceStatus },
      });
    });

    revalidatePath("/payments");
    revalidatePath(`/payments/${paymentId}/receipt`);
    revalidatePath(`/invoices/${payment.invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/");

    await setToastCookie(`ยกเลิกใบเสร็จรับเงิน ${payment.receiptNo} เรียบร้อยแล้ว`, "info");
    return {
      success: true,
      message: `ยกเลิกใบเสร็จรับเงิน ${payment.receiptNo} เรียบร้อยแล้ว`,
    };
  } catch (err: any) {
    console.error("voidPayment error:", err);
    return { error: toSafeErrorMessage(err, "เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน") };
  }
}
