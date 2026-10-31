import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import RepairListClient, { RepairListItem } from "./RepairListClient";

export default async function RepairsPage() {
  const repairRecords = await prisma.repairRequest.findMany({
    orderBy: [
      { reportedAt: "desc" },
    ],
    include: {
      room: {
        select: {
          roomNo: true,
          floor: true,
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  const repairs: RepairListItem[] = repairRecords.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    roomNo: r.room.roomNo,
    floor: r.room.floor,
    tenantId: r.tenantId,
    tenantName: r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName}`.trim() : null,
    tenantPhone: r.tenant?.phone || null,
    title: r.title,
    description: r.description,
    category: r.category as RepairListItem["category"],
    priority: r.priority as RepairListItem["priority"],
    status: r.status as RepairListItem["status"],
    reportedAt: r.reportedAt.toISOString(),
    assignedTo: r.assignedTo,
    startedAt: r.startedAt?.toISOString() || null,
    completedAt: r.completedAt?.toISOString() || null,
    cost: Number(r.cost ?? 0),
    resolutionNote: r.resolutionNote,
  }));

  return (
    <AppLayout>
      <RepairListClient initialRepairs={repairs} />
    </AppLayout>
  );
}
