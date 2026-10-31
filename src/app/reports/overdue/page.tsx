import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import OverdueReportClient, { OverdueReportData, OverdueInvoiceItem } from "./OverdueReportClient";
import { getThaiMonthName } from "@/lib/meters";

export default async function OverdueReportPage() {
  const today = new Date();

  // กฎ BR-07: บิลค้างชำระคือบิลที่สถานะ unpaid หรือ partial และ dueDate < today
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["unpaid", "partial"] },
      dueDate: { lt: today },
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
      { dueDate: "asc" }, // ค้างนานสุดอยู่บนสุด
    ],
  });

  let totalOverdueBalance = 0;
  let criticalCount = 0;
  let maxDays = 0;

  const invoiceItems: OverdueInvoiceItem[] = overdueInvoices.map((inv) => {
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    totalOverdueBalance += balance;

    const diffMs = today.getTime() - new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (daysOverdue > 30) {
      criticalCount++;
    }
    if (daysOverdue > maxDays) {
      maxDays = daysOverdue;
    }

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      roomId: inv.contract.room.id,
      roomNo: inv.contract.room.roomNo,
      floor: inv.contract.room.floor,
      tenantName: `${inv.contract.tenant.firstName} ${inv.contract.tenant.lastName}`.trim(),
      tenantPhone: inv.contract.tenant.phone,
      emergencyName: inv.contract.tenant.emergencyName,
      emergencyPhone: inv.contract.tenant.emergencyPhone,
      billingMonthThai: getThaiMonthName(inv.billingMonth),
      dueDate: inv.dueDate.toISOString(),
      daysOverdue,
      totalAmount: total,
      paidAmount: paid,
      balance,
      lateFee: Number(inv.lateFee),
      status: inv.status as OverdueInvoiceItem["status"],
    };
  });

  const reportData: OverdueReportData = {
    totalOverdueBalance,
    totalOverdueInvoices: overdueInvoices.length,
    criticalOverdueCount: criticalCount,
    maxDaysOverdue: maxDays,
    invoices: invoiceItems,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <OverdueReportClient data={reportData} />
      </div>
    </AppLayout>
  );
}
