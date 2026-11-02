import { Suspense } from "react";
import prisma from "@/lib/prisma";
import ContractListClient from "./ContractListClient";
import AppLayout from "@/components/AppLayout";

async function ContractsData() {
  const contracts = await prisma.contract.findMany({
    orderBy: { startDate: "desc" },
    include: {
      room: {
        select: { id: true, roomNo: true, floor: true },
      },
      tenant: {
        select: { id: true, firstName: true, lastName: true, phone: true, coTenantName: true },
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedContracts = contracts.map((c) => {
    const end = new Date(c.endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;

    return {
      id: c.id,
      roomId: c.room.id,
      roomNo: c.room.roomNo,
      floor: c.room.floor,
      tenantId: c.tenant.id,
      tenantName: `${c.tenant.firstName} ${c.tenant.lastName}`,
      tenantPhone: c.tenant.phone,
      coTenantName: c.tenant.coTenantName,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      monthlyRent: Number(c.monthlyRent),
      deposit: Number(c.deposit),
      status: c.status as "active" | "ended" | "cancelled",
      isExpiringSoon,
      daysRemaining,
    };
  });

  return <ContractListClient initialContracts={serializedContracts} />;
}

export default function ContractsPage() {
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
          <ContractsData />
        </Suspense>
      </div>
    </AppLayout>
  );
}
