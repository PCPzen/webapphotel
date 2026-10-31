import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import RepairDetailClient, { RepairDetailData } from "./RepairDetailClient";

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repairId = parseInt(id, 10);

  if (isNaN(repairId) || repairId <= 0) {
    notFound();
  }

  const repair = await prisma.repairRequest.findUnique({
    where: { id: repairId },
    include: {
      room: {
        select: {
          roomNo: true,
          floor: true,
          roomType: true,
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          lineId: true,
        },
      },
    },
  });

  if (!repair) {
    notFound();
  }

  const data: RepairDetailData = {
    id: repair.id,
    roomId: repair.roomId,
    roomNo: repair.room.roomNo,
    roomType: repair.room.roomType,
    floor: repair.room.floor,
    tenantId: repair.tenantId,
    tenantName: repair.tenant ? `${repair.tenant.firstName} ${repair.tenant.lastName}`.trim() : null,
    tenantPhone: repair.tenant?.phone || null,
    tenantLineId: repair.tenant?.lineId || null,
    title: repair.title,
    description: repair.description,
    category: repair.category as RepairDetailData["category"],
    priority: repair.priority as RepairDetailData["priority"],
    status: repair.status as RepairDetailData["status"],
    imageUrl: repair.imageUrl,
    reportedAt: repair.reportedAt.toISOString(),
    assignedTo: repair.assignedTo,
    startedAt: repair.startedAt?.toISOString() || null,
    completedAt: repair.completedAt?.toISOString() || null,
    cost: Number(repair.cost ?? 0),
    resolutionNote: repair.resolutionNote,
  };

  return (
    <AppLayout>
      <RepairDetailClient repair={data} />
    </AppLayout>
  );
}
