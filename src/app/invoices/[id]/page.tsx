import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import InvoiceDetailClient, { InvoiceDetailData } from "./InvoiceDetailClient";
import { getThaiMonthName } from "@/lib/meters";
import { isInvoiceOverdue, formatThaiDate } from "@/lib/invoices";
import { maskThaiId } from "@/lib/thaiId";

async function InvoiceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = parseInt(id, 10);

  if (isNaN(invoiceId)) {
    notFound();
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
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
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const settings = await prisma.systemSetting.findFirst();

  const totalAmount = Number(invoice.totalAmount);
  const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, totalAmount - paidAmount);
  const isOverdue = isInvoiceOverdue(invoice.dueDate, balance);

  const detailData: InvoiceDetailData = {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    billingMonth: invoice.billingMonth.toISOString().slice(0, 7),
    billingMonthThai: getThaiMonthName(invoice.billingMonth),
    issuedAt: invoice.issuedAt.toISOString(),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    dueDateThai: formatThaiDate(invoice.dueDate),
    isOverdue,
    status: invoice.status as "unpaid" | "partial" | "paid" | "cancelled",
    rentAmount: Number(invoice.rentAmount),
    waterUnits: invoice.waterUnits,
    waterRate: Number(invoice.contract.waterRate),
    waterAmount: Number(invoice.waterAmount),
    waterPrev: invoice.meterReading.waterPrev,
    waterCurr: invoice.meterReading.waterCurr,
    electricUnits: invoice.electricUnits,
    electricRate: Number(invoice.contract.electricRate),
    electricAmount: Number(invoice.electricAmount),
    elecPrev: invoice.meterReading.elecPrev,
    elecCurr: invoice.meterReading.elecCurr,
    otherAmount: Number(invoice.otherAmount),
    otherNote: invoice.otherNote,
    lateFee: Number(invoice.lateFee),
    contractLateFeeRate: Number(invoice.contract.lateFee),
    totalAmount,
    paidAmount,
    balance,
    room: {
      id: invoice.contract.room.id,
      roomNo: invoice.contract.room.roomNo,
      floor: invoice.contract.room.floor,
      roomType: invoice.contract.room.roomType,
    },
    tenant: {
      id: invoice.contract.tenant.id,
      firstName: invoice.contract.tenant.firstName,
      lastName: invoice.contract.tenant.lastName,
      phone: invoice.contract.tenant.phone,
      idCardNoMasked: maskThaiId(invoice.contract.tenant.idCardNo),
      coTenantName: invoice.contract.tenant.coTenantName,
      vehicleInfo: invoice.contract.tenant.vehicleInfo,
    },
    contractId: invoice.contractId,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo,
      amount: Number(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      referenceNote: p.referenceNote,
    })),
    dormSettings: {
      dormName: settings?.dormName || "หอพักสุขสบาย เพลส",
      dormAddress: settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200",
      dormPhone: settings?.dormPhone || "081-234-5678",
      bankName: settings?.bankName || "ธนาคารกสิกรไทย",
      bankAccountNo: settings?.bankAccountNo || "123-4-56789-0",
      bankAccountName: settings?.bankAccountName || "หอพักสุขสบาย เพลส",
      promptpayId: settings?.promptpayId || "0812345678",
    },
  };

  return <InvoiceDetailClient invoice={detailData} />;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm">กำลังโหลดข้อมูลใบแจ้งหนี้...</p>
            </div>
          </div>
        }
      >
        <InvoiceDetailContent params={params} />
      </Suspense>
    </AppLayout>
  );
}
