import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TenantLayout, { TenantOption } from "@/components/TenantLayout";
import TenantHomeClient, {
  TenantProfileData,
  TenantInvoiceSummary,
  TenantRepairSummary,
  TenantBankInfo,
} from "./TenantHomeClient";
import { getThaiMonthName } from "@/lib/meters";
import { isInvoiceOverdue } from "@/lib/invoices";
import { getServerSession } from "@/lib/session";

export default async function TenantPortalHomePage({
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
    // โหมด Admin/Staff Preview: อนุญาตให้ดึงรายชื่อผู้เช่าทั้งหมดเพื่อทดสอบและตรวจดูพอร์ทัล
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
          <div className="p-12 text-center text-slate-400 space-y-4">
            <h2 className="text-xl font-bold text-white">ยังไม่มีข้อมูลผู้เช่าที่ทำสัญญาในระบบ</h2>
            <p className="text-sm">กรุณาสร้างสัญญาเช่าห้องพักในระบบจัดการหอพักก่อนเข้าใช้งานพอร์ทัล</p>
          </div>
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
    // โหมดผู้เช่าจริง (Tenant): คิวรีเฉพาะสัญญาของผู้เช่าคนนี้เท่านั้น ป้องกัน PII Leakage
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
          <div className="p-12 text-center text-slate-400 space-y-4">
            <h2 className="text-xl font-bold text-white">ไม่พบสัญญาเช่าที่เปิดใช้งาน</h2>
            <p className="text-sm">กรุณาติดต่อสำนักงานหอพักเพื่อตรวจสอบสถานะสัญญาเช่าของคุณ</p>
          </div>
        </TenantLayout>
      );
    }

    allTenants = []; // ไม่ส่งข้อมูลผู้เช่าคนอื่นไปให้ Client
  }

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
      status: rawInvoice.status,
      dueDate: rawInvoice.dueDate.toISOString(),
      isOverdue: overdue,
    };
  }

  // ดึงงานแจ้งซ่อมของห้องนี้
  const rawRepairs = await prisma.repairRequest.findMany({
    where: { roomId: currentContract.room.id },
    orderBy: { reportedAt: "desc" },
    take: 3,
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

  // ดึงข้อมูลบัญชีธนาคารสำหรับชำระเงิน
  const rawSettings = await prisma.systemSetting.findFirst();
  const bankInfo: TenantBankInfo = {
    dormName: rawSettings?.dormName || "หอพักสุขสบาย เพลส",
    dormPhone: rawSettings?.dormPhone || "081-234-5678",
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
    <TenantLayout
      currentTenant={currentTenantHeader}
      allTenants={allTenants}
      isAdminPreview={isAdminPreview}
    >
      <TenantHomeClient
        tenant={tenantData}
        latestInvoice={latestInvoice}
        recentRepairs={recentRepairs}
        bankInfo={bankInfo}
      />
    </TenantLayout>
  );
}
