import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditTenantForm from "./EditTenantForm";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";

async function EditTenantContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = parseInt(id, 10);

  if (isNaN(tenantId)) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: { status: "active" },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const serializedTenant = {
    id: tenant.id,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    idCardNo: tenant.idCardNo,
    birthDate: tenant.birthDate.toISOString().split("T")[0],
    phone: tenant.phone,
    email: tenant.email,
    lineId: tenant.lineId,
    vehicleInfo: tenant.vehicleInfo,
    coTenantName: tenant.coTenantName,
    address: tenant.address,
    emergencyName: tenant.emergencyName,
    emergencyPhone: tenant.emergencyPhone,
    hasActiveContract: tenant.contracts.length > 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/tenants/${tenant.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายละเอียดผู้เช่า
        </Link>
      </div>

      <EditTenantForm tenant={serializedTenant} />
    </div>
  );
}

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Suspense
          fallback={
            <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse"></div>
          }
        >
          <EditTenantContent params={params} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
