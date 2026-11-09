import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TenantLayout, { TenantOption } from "@/components/TenantLayout";
import TenantRepairsClient, { TenantRepairItem } from "./TenantRepairsClient";
import { getServerSession } from "@/lib/session";

export default async function TenantRepairsPage({
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

  const rawRepairs = await prisma.repairRequest.findMany({
    where: { roomId: currentContract.room.id },
    orderBy: { reportedAt: "desc" },
  });

  const repairs: TenantRepairItem[] = rawRepairs.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as TenantRepairItem["category"],
    priority: r.priority as TenantRepairItem["priority"],
    status: r.status as TenantRepairItem["status"],
    imageUrl: r.imageUrl,
    reportedAt: r.reportedAt.toISOString(),
    startedAt: r.startedAt?.toISOString() || null,
    completedAt: r.completedAt?.toISOString() || null,
    assignedTo: r.assignedTo,
    cost: Number(r.cost ?? 0),
    resolutionNote: r.resolutionNote,
  }));

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
      <TenantRepairsClient
        repairs={repairs}
        tenantId={currentContract.tenant.id}
        roomNo={currentContract.room.roomNo}
      />
    </TenantLayout>
  );
}
