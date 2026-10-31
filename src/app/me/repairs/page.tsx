import prisma from "@/lib/prisma";
import TenantLayout, { TenantOption } from "@/components/TenantLayout";
import TenantRepairsClient, { TenantRepairItem } from "./TenantRepairsClient";

export default async function TenantRepairsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { tenantId: tenantIdParam } = await searchParams;

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

  if (allActiveContracts.length === 0) {
    return (
      <TenantLayout currentTenant={null} allTenants={[]}>
        <div className="p-12 text-center text-slate-400">ยังไม่มีข้อมูลผู้เช่า</div>
      </TenantLayout>
    );
  }

  const targetId = tenantIdParam ? parseInt(tenantIdParam, 10) : allActiveContracts[0].tenant.id;
  const currentContract =
    allActiveContracts.find((c) => c.tenant.id === targetId) || allActiveContracts[0];

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
    <TenantLayout currentTenant={currentTenantHeader} allTenants={allTenants}>
      <TenantRepairsClient
        repairs={repairs}
        tenantId={currentContract.tenant.id}
        roomNo={currentContract.room.roomNo}
      />
    </TenantLayout>
  );
}
