import { Suspense } from "react";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import NewRepairForm from "./NewRepairForm";

async function NewRepairContent({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const { roomId } = await searchParams;
  const preselectedRoomId = roomId ? parseInt(roomId, 10) : undefined;

  const rooms = await prisma.room.findMany({
    orderBy: [{ floor: "asc" }, { roomNo: "asc" }],
    include: {
      contracts: {
        where: { status: "active" },
        include: { tenant: true },
      },
    },
  });

  const roomOptions = rooms.map((r) => {
    const activeContract = r.contracts[0];
    return {
      id: r.id,
      roomNo: r.roomNo,
      floor: r.floor,
      roomType: r.roomType,
      tenantId: activeContract?.tenantId || null,
      tenantName: activeContract
        ? `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`
        : null,
    };
  });

  return <NewRepairForm rooms={roomOptions} preselectedRoomId={preselectedRoomId} />;
}

export default async function NewRepairPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-2">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <NewRepairContent searchParams={searchParams} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
