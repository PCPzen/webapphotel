import prisma from "@/lib/prisma";
import LoginClient, { DemoTenant } from "./login/LoginClient";

export default async function RootLoginPage() {
  const activeContracts = await prisma.contract.findMany({
    where: { status: "active" },
    include: {
      room: true,
      tenant: true,
    },
    orderBy: [
      { room: { roomNo: "asc" } },
    ],
    take: 6,
  });

  const demoTenants: DemoTenant[] = activeContracts.map((c) => ({
    id: c.tenant.id,
    name: `${c.tenant.firstName} ${c.tenant.lastName}`.trim(),
    roomNo: c.room.roomNo,
    phone: c.tenant.phone,
    idCardLast4: c.tenant.idCardNo ? c.tenant.idCardNo.replace(/[^0-9]/g, "").slice(-4) : "",
  }));

  return <LoginClient demoTenants={demoTenants} />;
}
