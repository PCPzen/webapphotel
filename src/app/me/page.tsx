import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import TenantLayout, { TenantOption } from "@/components/TenantLayout";
import TenantHomeClient, {
  TenantProfileData,
  TenantInvoiceSummary,
  TenantRepairSummary,
  TenantBankInfo,
} from "./TenantHomeClient";
import { getThaiMonthName } from "@/lib/meters";
import { isInvoiceOverdue } from "@/lib/invoices";

export default async function TenantPortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { tenantId: tenantIdParam } = await searchParams;

  // ดึงผู้เช่าทั้งหมดที่มีสัญญา active
  const allActiveContracts = await prisma.contract.findMany({
    where: { status: "active" },
    include: {
      tenant: true,
      room: true,
    },
    orderBy: [
      { room: { roomNo: "asc" } },
    ],
  });

  const allTenants: TenantOption[] = allActiveContracts.map((c) => ({
    id: c.tenant.id,
    name: `${c.tenant.firstName} ${c.tenant.lastName}`.trim(),
    roomNo: c.room.roomNo,
  }));

  // หากไม่มีผู้เช่าที่มีสัญญา active เลย
  if (allActiveContracts.length === 0) {
    return (
      <TenantLayout currentTenant={null} allTenants={[]}>
        <div className="p-12 text-center text-slate-400 space-y-4">
          <h2 className="text-xl font-bold text-white">ยังไม่มีข้อมูลผู้เช่าที่ทำสัญญาในระบบ</h2>
          <p className="text-sm">กรุณาสร้างสัญญาเช่าห้องพักในระบบจัดการหอพักก่อนเข้าใช้งานพอร์ทัล</p>
        </div>
      </TenantLayout>
    );
  }

  // ตรวจสอบ tenantId จาก query param หรือจาก session cookie
  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get("webhotel_tenant_id")?.value;
  const targetId = tenantIdParam
    ? parseInt(tenantIdParam, 10)
    : cookieTenantId
    ? parseInt(cookieTenantId, 10)
    : allActiveContracts[0].tenant.id;
  const currentContract =
    allActiveContracts.find((c) => c.tenant.id === targetId) || allActiveContracts[0];

  const today = new Date();
  const diffDays = Math.max(
    0,
    Math.ceil((new Date(currentContract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const tenantData: TenantProfileData = {
    id: currentContract.tenant.id,
    name: `${currentContract.tenant.firstName} ${currentContract.tenant.lastName}`.trim(),
    phone: currentContract.tenant.phone,
    roomNo: currentContract.room.roomNo,
    floor: currentContract.room.floor,
    roomType: currentContract.room.roomType,
    baseRent: Number(currentContract.monthlyRent),
    waterRate: Number(currentContract.waterRate),
    electricRate: Number(currentContract.electricRate),
    contractStartDate: currentContract.startDate.toISOString(),
    contractEndDate: currentContract.endDate.toISOString(),
    daysRemaining: diffDays,
  };

  // ดึงใบแจ้งหนี้ล่าสุดของสัญญานี้
  const rawInvoice = await prisma.invoice.findFirst({
    where: {
      contractId: currentContract.id,
      status: { not: "cancelled" },
    },
    include: {
      payments: {
        where: { status: "valid" },
      },
    },
    orderBy: { billingMonth: "desc" },
  });

  let latestInvoice: TenantInvoiceSummary | null = null;
  if (rawInvoice) {
    const total = Number(rawInvoice.totalAmount);
    const paid = rawInvoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    const overdue = isInvoiceOverdue(rawInvoice.dueDate, balance);

    latestInvoice = {
      id: rawInvoice.id,
      invoiceNo: rawInvoice.invoiceNo,
      billingMonthThai: getThaiMonthName(rawInvoice.billingMonth),
      rentAmount: Number(rawInvoice.rentAmount),
      waterAmount: Number(rawInvoice.waterAmount),
      waterUnits: rawInvoice.waterUnits,
      electricAmount: Number(rawInvoice.electricAmount),
      electricUnits: rawInvoice.electricUnits,
      otherFee: Number(rawInvoice.otherAmount),
      lateFee: Number(rawInvoice.lateFee),
      totalAmount: total,
      paidAmount: paid,
      balance,
      status: rawInvoice.status as TenantInvoiceSummary["status"],
      dueDate: rawInvoice.dueDate.toISOString(),
      isOverdue: overdue,
    };
  }

  // ดึงงานแจ้งซ่อมของห้องนี้
  const rawRepairs = await prisma.repairRequest.findMany({
    where: { roomId: currentContract.room.id },
    orderBy: { reportedAt: "desc" },
    take: 5,
  });

  const recentRepairs: TenantRepairSummary[] = rawRepairs.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    priority: r.priority,
    status: r.status,
    reportedAt: r.reportedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() || null,
    resolutionNote: r.resolutionNote,
  }));

  // ดึงการตั้งค่าระบบสำหรับข้อมูลธนาคาร
  const rawSettings = await prisma.systemSetting.findFirst();
  const bankInfo: TenantBankInfo = {
    dormName: rawSettings?.dormName || "หอพักสุขสบาย",
    dormPhone: rawSettings?.dormPhone || "02-123-4567",
    bankName: rawSettings?.bankName || "ธนาคารกสิกรไทย",
    bankAccountNo: rawSettings?.bankAccountNo || "123-4-56789-0",
    bankAccountName: rawSettings?.bankAccountName || "หอพักสุขสบาย",
    promptpayId: rawSettings?.promptpayId || "0812345678",
  };

  const currentTenantHeader = {
    id: currentContract.tenant.id,
    name: `${currentContract.tenant.firstName} ${currentContract.tenant.lastName}`.trim(),
    roomNo: currentContract.room.roomNo,
    floor: currentContract.room.floor,
  };

  return (
    <TenantLayout currentTenant={currentTenantHeader} allTenants={allTenants}>
      <TenantHomeClient
        tenant={tenantData}
        latestInvoice={latestInvoice}
        recentRepairs={recentRepairs}
        bankInfo={bankInfo}
      />
    </TenantLayout>
  );
}
