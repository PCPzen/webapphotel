import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import NewContractForm from "./NewContractForm";
import AppLayout from "@/components/AppLayout";
import { ArrowLeft } from "lucide-react";

async function NewContractContent({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; tenantId?: string }>;
}) {
  const { roomId, tenantId } = await searchParams;
  const preselectedRoomId = roomId ? parseInt(roomId, 10) : undefined;
  const preselectedTenantId = tenantId ? parseInt(tenantId, 10) : undefined;

  // 1. ดึงเฉพาะห้องว่าง (vacant)
  const vacantRoomsRaw = await prisma.room.findMany({
    where: {
      OR: [
        { status: "vacant" },
        ...(preselectedRoomId ? [{ id: preselectedRoomId }] : []),
      ],
    },
    orderBy: [
      { floor: "asc" },
      { roomNo: "asc" },
    ],
  });

  const vacantRooms = vacantRoomsRaw.map((r) => ({
    id: r.id,
    roomNo: r.roomNo,
    floor: r.floor,
    roomType: r.roomType,
    baseRent: Number(r.baseRent),
  }));

  // 2. ดึงรายชื่อผู้เช่าทั้งหมด
  const tenantsRaw = await prisma.tenant.findMany({
    orderBy: { firstName: "asc" },
  });

  const tenants = tenantsRaw.map((t) => ({
    id: t.id,
    firstName: t.firstName,
    lastName: t.lastName,
    phone: t.phone,
    coTenantName: t.coTenantName,
    vehicleInfo: t.vehicleInfo,
  }));

  // 3. ดึงการตั้งค่ากลางของระบบ (System Settings)
  const settings = await prisma.systemSetting.findFirst();

  const defaultSettings = {
    defaultWaterRate: settings ? Number(settings.defaultWaterRate) : 18,
    defaultElectricRate: settings ? Number(settings.defaultElectricRate) : 8,
    defaultLateFee: settings ? Number(settings.defaultLateFee) : 50,
    defaultDueDay: settings ? settings.defaultDueDay : 5,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการสัญญา
        </Link>
      </div>

      <NewContractForm
        vacantRooms={vacantRooms}
        tenants={tenants}
        defaultSettings={defaultSettings}
        preselectedRoomId={preselectedRoomId}
        preselectedTenantId={preselectedTenantId}
      />
    </div>
  );
}

export default function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; tenantId?: string }>;
}) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-violet-950/20 rounded-3xl border border-violet-900/20 animate-pulse"></div>
          }
        >
          <NewContractContent searchParams={searchParams} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
