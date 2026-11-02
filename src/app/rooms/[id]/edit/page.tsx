import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditRoomForm from "./EditRoomForm";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";

async function EditRoomContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = parseInt(id, 10);

  if (isNaN(roomId)) {
    notFound();
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      contracts: {
        where: { status: "active" },
        include: {
          tenant: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!room) {
    notFound();
  }

  const activeContract = room.contracts[0];

  const serializedRoom = {
    id: room.id,
    roomNo: room.roomNo,
    floor: room.floor,
    roomType: room.roomType,
    baseRent: Number(room.baseRent),
    status: room.status as "vacant" | "occupied" | "maintenance",
    note: room.note,
    activeContract: activeContract
      ? {
          id: activeContract.id,
          tenantName: `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`,
        }
      : null,
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/rooms/${room.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายละเอียดห้องพัก
        </Link>
      </div>

      {/* Edit Form Card */}
      <EditRoomForm room={serializedRoom} />
    </div>
  );
}

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse"></div>
          }
        >
          <EditRoomContent params={params} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
