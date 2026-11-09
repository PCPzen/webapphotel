import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TenantLayout, { TenantOption } from "@/components/TenantLayout";
import TenantInvoicesClient, {
  TenantInvoiceRecord,
  BankDetails,
} from "./TenantInvoicesClient";
import { getThaiMonthName } from "@/lib/meters";
import { isInvoiceOverdue } from "@/lib/invoices";
import { getServerSession } from "@/lib/session";

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { tenantId: tenantIdParam } = await searchParams;

  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const isAdminPreview = session.role === "admin" || session.role === "staff";

  let currentContract;
  let allTenants: TenantOption[] = [];

  if (isAdminPreview) {
    // โหมด Admin/Staff Preview: อนุญาตให้ดึงรายชื่อผู้เช่าทั้งหมดเพื่อตรวจดูพอร์ทัล
    const allActiveContracts = await prisma.contract.findMany({
      where: { status: "active" },
      include: {
        tenant: true,
        room: true,
      },
      orderBy: [{ room: { roomNo: "asc" } }],
    });

    if (allActiveContracts.length === 0) {
      return (
        <TenantLayout currentTenant={null} allTenants={[]} isAdminPreview={true}>
          <div className="p-12 text-center text-slate-400">ยังไม่มีข้อมูลผู้เช่า</div>
        </TenantLayout>
      );
    }

    allTenants = allActiveContracts.map((c) => ({
      id: c.tenant.id,
      name: `${c.tenant.firstName} ${c.tenant.lastName}`.trim(),
      roomNo: c.room.roomNo,
    }));

    const targetId = tenantIdParam ? parseInt(tenantIdParam, 10) : allActiveContracts[0].tenant.id;
    currentContract = allActiveContracts.find((c) => c.tenant.id === targetId) || allActiveContracts[0];
  } else {
    // โหมดผู้เช่าจริง (Tenant): คิวรีเฉพาะสัญญาของตนเอง ป้องกัน PII Leakage
    if (!session.tenantId) {
      redirect("/login");
    }

    currentContract = await prisma.contract.findFirst({
      where: {
        tenantId: session.tenantId,
        status: "active",
      },
      include: {
        tenant: true,
        room: true,
      },
    });

    if (!currentContract) {
      return (
        <TenantLayout currentTenant={null} allTenants={[]} isAdminPreview={false}>
          <div className="p-12 text-center text-slate-400">ไม่พบสัญญาเช่าที่เปิดใช้งาน</div>
        </TenantLayout>
      );
    }
  }

  // ดึงใบแจ้งหนี้ทั้งหมดของสัญญานี้
  const rawInvoices = await prisma.invoice.findMany({
    where: { contractId: currentContract.id },
    include: {
      payments: {
        where: { status: "valid" },
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: { billingMonth: "desc" },
  });

  const invoices: TenantInvoiceRecord[] = rawInvoices.map((inv) => {
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    const overdue = isInvoiceOverdue(inv.dueDate, balance);
    const latestPayment = inv.payments[0];

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      billingMonthThai: getThaiMonthName(inv.billingMonth),
      rentAmount: Number(inv.rentAmount),
      waterAmount: Number(inv.waterAmount),
      waterUnits: inv.waterUnits,
      electricAmount: Number(inv.electricAmount),
      electricUnits: inv.electricUnits,
      otherFee: Number(inv.otherAmount),
      lateFee: Number(inv.lateFee),
      totalAmount: total,
      paidAmount: paid,
      balance,
      status: inv.status as TenantInvoiceRecord["status"],
      dueDate: inv.dueDate.toISOString(),
      isOverdue: overdue,
      paymentId: latestPayment?.id || null,
      receiptNo: latestPayment?.receiptNo || null,
    };
  });

  const rawSettings = await prisma.systemSetting.findFirst();
  const bankDetails: BankDetails = {
    bankName: rawSettings?.bankName || "ธนาคารกสิกรไทย",
    bankAccountNo: rawSettings?.bankAccountNo || "123-4-56789-0",
    bankAccountName: rawSettings?.bankAccountName || "หอพักสุขสบาย",
    promptpayId: rawSettings?.promptpayId || "0812345678",
    dormPhone: rawSettings?.dormPhone || "02-123-4567",
  };

  const currentTenantHeader = {
    id: currentContract.tenant.id,
    name: `${currentContract.tenant.firstName} ${currentContract.tenant.lastName}`.trim(),
    roomNo: currentContract.room.roomNo,
    floor: currentContract.room.floor,
  };

  return (
    <TenantLayout
      currentTenant={currentTenantHeader}
      allTenants={allTenants}
      isAdminPreview={isAdminPreview}
    >
      <TenantInvoicesClient
        invoices={invoices}
        bankDetails={bankDetails}
        tenantId={currentContract.tenant.id}
      />
    </TenantLayout>
  );
}
