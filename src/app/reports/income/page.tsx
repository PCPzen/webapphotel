import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import IncomeReportClient, { IncomeReportData, IncomeInvoiceItem } from "./IncomeReportClient";
import { parseReadingMonth, formatMonthString, getThaiMonthName } from "@/lib/meters";

export default async function IncomeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = month && /^\d{4}-\d{2}$/.test(month) ? month : defaultMonthStr;

  const billingMonthDate = parseReadingMonth(monthStr);

  // Month navigation (prev & next)
  const prevDate = new Date(billingMonthDate);
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const prevMonthStr = formatMonthString(prevDate);

  const nextDate = new Date(billingMonthDate);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const nextMonthStr = formatMonthString(nextDate);

  const thaiMonthName = getThaiMonthName(billingMonthDate);

  // ดึงรายการใบแจ้งหนี้ประจำเดือน พร้อมยอดชำระจริงจาก payments
  const invoices = await prisma.invoice.findMany({
    where: {
      billingMonth: billingMonthDate,
      status: { not: "cancelled" },
    },
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
      payments: {
        where: { status: "valid" },
      },
    },
    orderBy: [
      { contract: { room: { roomNo: "asc" } } },
    ],
  });

  // คำนวณสรุปยอดรายได้
  let totalBilled = 0;
  let totalPaid = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  let rentSum = 0;
  let waterSum = 0;
  let electricSum = 0;
  let otherFeeSum = 0;
  let lateFeeSum = 0;

  const invoiceItems: IncomeInvoiceItem[] = invoices.map((inv) => {
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    const rent = Number(inv.rentAmount);
    const water = Number(inv.waterAmount);
    const electric = Number(inv.electricAmount);
    const other = Number(inv.otherAmount);
    const late = Number(inv.lateFee);

    totalBilled += total;
    totalPaid += paid;

    rentSum += rent;
    waterSum += water;
    electricSum += electric;
    otherFeeSum += other;
    lateFeeSum += late;

    if (inv.status === "paid") paidCount++;
    else if (inv.status === "partial") partialCount++;
    else if (inv.status === "unpaid") unpaidCount++;

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      roomNo: inv.contract.room.roomNo,
      tenantName: `${inv.contract.tenant.firstName} ${inv.contract.tenant.lastName}`.trim(),
      rentAmount: rent,
      waterAmount: water,
      electricAmount: electric,
      otherFee: other,
      lateFee: late,
      totalAmount: total,
      paidAmount: paid,
      balance,
      status: inv.status as IncomeInvoiceItem["status"],
      dueDate: inv.dueDate.toISOString(),
    };
  });

  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  // ดึงรายการชำระเงินที่เกิดขึ้นในเดือนนี้ (เพื่อแยกช่องทาง เงินสด / โอน)
  const invoiceIds = invoices.map((i) => i.id);
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId: { in: invoiceIds },
      status: "valid",
    },
  });

  let transferAmount = 0;
  let cashAmount = 0;
  let otherAmount = 0;

  for (const p of payments) {
    const amt = Number(p.amount);
    if (p.method === "bank_transfer") {
      transferAmount += amt;
    } else if (p.method === "cash") {
      cashAmount += amt;
    } else {
      otherAmount += amt;
    }
  }

  const reportData: IncomeReportData = {
    monthStr,
    prevMonthStr,
    nextMonthStr,
    thaiMonthName,
    summary: {
      totalBilled,
      totalPaid,
      totalOutstanding,
      collectionRate,
      invoiceCount: invoices.length,
      paidCount,
      partialCount,
      unpaidCount,
    },
    categories: {
      rent: rentSum,
      water: waterSum,
      electric: electricSum,
      otherFee: otherFeeSum,
      lateFee: lateFeeSum,
    },
    payments: {
      transferAmount,
      cashAmount,
      otherAmount,
      paymentCount: payments.length,
    },
    invoices: invoiceItems,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <IncomeReportClient data={reportData} />
      </div>
    </AppLayout>
  );
}
