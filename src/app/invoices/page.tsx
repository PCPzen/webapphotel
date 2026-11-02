import { Suspense } from "react";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import InvoiceListClient, { InvoiceListItem } from "./InvoiceListClient";
import { parseReadingMonth, formatMonthString, getThaiMonthName } from "@/lib/meters";
import { isInvoiceOverdue, formatThaiDate } from "@/lib/invoices";

async function InvoicesData({ monthParam }: { monthParam?: string }) {
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : undefined;

  let billingMonthDate: Date | undefined;
  if (monthStr) {
    billingMonthDate = parseReadingMonth(monthStr);
  }

  // คำนวณเดือนก่อนหน้าและเดือนถัดไป
  const baseDate = billingMonthDate || parseReadingMonth(defaultMonthStr);
  const prevDate = new Date(baseDate);
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const prevMonthStr = formatMonthString(prevDate);

  const nextDate = new Date(baseDate);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const nextMonthStr = formatMonthString(nextDate);

  // ดึงรายการใบแจ้งหนี้
  const invoices = await prisma.invoice.findMany({
    where: billingMonthDate ? { billingMonth: billingMonthDate } : undefined,
    orderBy: [
      { billingMonth: "desc" },
      { contract: { room: { floor: "asc" } } },
      { contract: { room: { roomNo: "asc" } } },
    ],
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
      meterReading: true,
      payments: {
        where: { status: "valid" },
      },
    },
  });

  const serializedInvoices: InvoiceListItem[] = invoices.map((inv) => {
    const totalAmount = Number(inv.totalAmount);
    const paidAmount = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, totalAmount - paidAmount);
    const isOverdue = isInvoiceOverdue(inv.dueDate, balance);

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      roomId: inv.contract.room.id,
      roomNo: inv.contract.room.roomNo,
      floor: inv.contract.room.floor,
      tenantId: inv.contract.tenant.id,
      tenantName: `${inv.contract.tenant.firstName} ${inv.contract.tenant.lastName}`,
      tenantPhone: inv.contract.tenant.phone,
      billingMonth: inv.billingMonth.toISOString().slice(0, 7),
      billingMonthThai: getThaiMonthName(inv.billingMonth),
      rentAmount: Number(inv.rentAmount),
      waterUnits: inv.waterUnits,
      waterAmount: Number(inv.waterAmount),
      electricUnits: inv.electricUnits,
      electricAmount: Number(inv.electricAmount),
      otherAmount: Number(inv.otherAmount),
      lateFee: Number(inv.lateFee),
      totalAmount,
      paidAmount,
      balance,
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      dueDateThai: formatThaiDate(inv.dueDate),
      isOverdue,
      status: inv.status as "unpaid" | "partial" | "paid" | "cancelled",
      issuedAt: inv.issuedAt.toISOString(),
      contractLateFeeRate: Number(inv.contract.lateFee),
    };
  });

  const thaiMonthName = billingMonthDate
    ? getThaiMonthName(billingMonthDate)
    : "ทุกล็อตบิลในระบบ";

  return (
    <InvoiceListClient
      initialInvoices={serializedInvoices}
      monthStr={monthStr}
      prevMonthStr={prevMonthStr}
      nextMonthStr={nextMonthStr}
      thaiMonthName={thaiMonthName}
    />
  );
}

export default async function InvoicesPage({
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
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">กำลังโหลดรายการใบแจ้งหนี้...</p>
            </div>
          </div>
        }
      >
        <InvoicesData monthParam={month} />
      </Suspense>
    </AppLayout>
  );
}
