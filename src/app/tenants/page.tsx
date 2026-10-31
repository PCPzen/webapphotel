import { Suspense } from "react";
import prisma from "@/lib/prisma";
import TenantListClient from "./TenantListClient";
import AppLayout from "@/components/AppLayout";
import { maskThaiId } from "@/lib/thaiId";

async function TenantsData() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contracts: {
        where: { status: "active" },
        include: {
          room: {
            select: { id: true, roomNo: true },
          },
        },
      },
      _count: {
        select: { contracts: true },
      },
    },
  });

  const serializedTenants = tenants.map((t) => {
    const activeContract = t.contracts[0];
    return {
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      idCardNo: maskThaiId(t.idCardNo),
      maskedIdCard: maskThaiId(t.idCardNo),
      phone: t.phone,
      email: t.email,
      lineId: t.lineId,
      vehicleInfo: t.vehicleInfo,
      currentRoom: activeContract
        ? {
            id: activeContract.room.id,
            roomNo: activeContract.room.roomNo,
            contractId: activeContract.id,
          }
        : null,
      totalContractsCount: t._count.contracts,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return <TenantListClient initialTenants={serializedTenants} />;
}

export default function TenantsPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        <Suspense
          fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-20 bg-violet-950/20 rounded-2xl border border-violet-900/20"></div>
              <div className="h-28 bg-violet-950/20 rounded-2xl border border-violet-900/20"></div>
              <div className="h-96 bg-violet-950/20 rounded-2xl border border-violet-900/20"></div>
            </div>
          }
        >
          <TenantsData />
        </Suspense>
      </div>
    </AppLayout>
  );
}
