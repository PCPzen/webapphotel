import { Suspense } from "react";
import prisma from "@/lib/prisma";
import RoomListClient from "./RoomListClient";
import AppLayout from "@/components/AppLayout";

async function RoomsData() {
  const rooms = await prisma.room.findMany({
    orderBy: [
      { floor: "asc" },
      { roomNo: "asc" },
    ],
    include: {
      contracts: {
        where: { status: "active" },
        include: {
          tenant: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
      },
      repairRequests: {
        where: { status: { in: ["open", "in_progress"] } },
        select: { id: true, title: true, priority: true },
      },
    },
  });

  const serializedRooms = rooms.map((r) => {
    const activeContract = r.contracts[0];
    return {
      id: r.id,
      roomNo: r.roomNo,
      floor: r.floor,
      roomType: r.roomType,
      baseRent: Number(r.baseRent),
      status: r.status as "vacant" | "occupied" | "maintenance",
      note: r.note,
      activeTenant: activeContract
        ? {
            name: `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`,
            phone: activeContract.tenant.phone,
          }
        : null,
      activeRepairsCount: r.repairRequests.length,
    };
  });

  return <RoomListClient initialRooms={serializedRooms} />;
}

export default function RoomsPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        <Suspense
          fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-20 bg-slate-900/40 rounded-2xl border border-slate-800"></div>
              <div className="h-28 bg-slate-900/40 rounded-2xl border border-slate-800"></div>
              <div className="h-96 bg-slate-900/40 rounded-2xl border border-slate-800"></div>
            </div>
          }
        >
          <RoomsData />
        </Suspense>
      </div>
    </AppLayout>
  );
}
