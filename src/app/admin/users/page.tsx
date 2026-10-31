import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import AdminUsersClient, { ProfileItem, SystemSettingsData } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const rawProfiles = await prisma.profile.findMany({
    orderBy: [
      { role: "asc" },
      { createdAt: "desc" },
    ],
  });

  const profiles: ProfileItem[] = rawProfiles.map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    role: p.role,
    phone: p.phone,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }));

  const rawSettings = await prisma.systemSetting.findFirst();

  const settings: SystemSettingsData = {
    id: rawSettings?.id,
    dormName: rawSettings?.dormName || "หอพักสุขสบาย",
    dormAddress: rawSettings?.dormAddress || "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
    dormPhone: rawSettings?.dormPhone || "02-123-4567",
    bankName: rawSettings?.bankName || "ธนาคารกสิกรไทย",
    bankAccountNo: rawSettings?.bankAccountNo || "123-4-56789-0",
    bankAccountName: rawSettings?.bankAccountName || "หอพักสุขสบาย โดย นายสมบูรณ์ มั่นคง",
    promptpayId: rawSettings?.promptpayId || "0812345678",
    defaultWaterRate: Number(rawSettings?.defaultWaterRate ?? 18),
    defaultElectricRate: Number(rawSettings?.defaultElectricRate ?? 8),
    defaultLateFee: Number(rawSettings?.defaultLateFee ?? 50),
    defaultDueDay: rawSettings?.defaultDueDay ?? 5,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <AdminUsersClient profiles={profiles} settings={settings} />
      </div>
    </AppLayout>
  );
}
