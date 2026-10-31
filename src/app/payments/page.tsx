import { Suspense } from "react";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import PaymentListClient, { PaymentListItem, UnpaidInvoiceOption } from "./PaymentListClient";
import { getThaiMonthName } from "@/lib/meters";

async function PaymentsData({ invoiceIdParam }: { invoiceIdParam?: string }) {
  const preselectedInvoiceId = invoiceIdParam ? parseInt(invoiceIdParam, 10) : undefined;

  // 1. ดึงรายการชำระเงินทั้งหมด เรียงจากใหม่ไปเก่า
  const payments = await prisma.payment.findMany({
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
    include: {
      invoice: {
        include: {
          contract: {
            include: {
              room: true,
              tenant: true,
            },
          },
        },
      },
    },
  });

  const serializedPayments: PaymentListItem[] = payments.map((p) => ({
    id: p.id,
    receiptNo: p.receiptNo,
    invoiceId: p.invoiceId,
    invoiceNo: p.invoice.invoiceNo,
    roomId: p.invoice.contract.room.id,
    roomNo: p.invoice.contract.room.roomNo,
    floor: p.invoice.contract.room.floor,
    tenantName: `${p.invoice.contract.tenant.firstName} ${p.invoice.contract.tenant.lastName}`,
    tenantPhone: p.invoice.contract.tenant.phone,
    billingMonthThai: getThaiMonthName(p.invoice.billingMonth),
    amount: Number(p.amount),
    method: p.method,
    paidAt: p.paidAt.toISOString(),
    slipImageUrl: p.slipImageUrl,
    referenceNote: p.referenceNote,
    status: p.status,
    voidReason: p.voidReason,
    voidedAt: p.voidedAt ? p.voidedAt.toISOString() : null,
  }));

  // 2. ดึงใบแจ้งหนี้ที่ยังมียอดค้างชำระ (unpaid หรือ partial) สำหรับให้เลือกรับชำระ
  const unpaidInvoicesRaw = await prisma.invoice.findMany({
    where: {
      status: { in: ["unpaid", "partial"] },
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
      { billingMonth: "desc" },
      { contract: { room: { roomNo: "asc" } } },
    ],
  });

  const unpaidInvoices: UnpaidInvoiceOption[] = [];

  for (const inv of unpaidInvoicesRaw) {
    const totalAmount = Number(inv.totalAmount);
    const paidAmount = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, totalAmount - paidAmount);

    if (balance > 0) {
      unpaidInvoices.push({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        roomNo: inv.contract.room.roomNo,
        floor: inv.contract.room.floor,
        tenantName: `${inv.contract.tenant.firstName} ${inv.contract.tenant.lastName}`,
        billingMonthThai: getThaiMonthName(inv.billingMonth),
        totalAmount,
        paidAmount,
        balance,
      });
    }
  }

  return (
    <PaymentListClient
      initialPayments={serializedPayments}
      unpaidInvoices={unpaidInvoices}
      preselectedInvoiceId={preselectedInvoiceId}
    />
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const { invoiceId } = await searchParams;

  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm">กำลังโหลดข้อมูลประวัติการชำระเงินและใบเสร็จ...</p>
            </div>
          </div>
        }
      >
        <PaymentsData invoiceIdParam={invoiceId} />
      </Suspense>
    </AppLayout>
  );
}
