import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import DashboardClient, { DashboardData, DashboardRoomItem } from "./DashboardClient";
import { getThaiMonthName } from "@/lib/meters";

export default async function DashboardPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentMonthDate = new Date(Date.UTC(currentYear, currentMonth, 1));
  const currentMonthThai = getThaiMonthName(currentMonthDate);

  // 1. ดึงห้องพักทั้งหมดพร้อมสัญญาที่ active
  const rooms = await prisma.room.findMany({
    orderBy: [
      { floor: "asc" },
      { roomNo: "asc" },
    ],
    include: {
      contracts: {
        where: { status: "active" },
        include: {
          tenant: true,
        },
      },
    },
  });

  // 2. ดึงใบแจ้งหนี้ประจำเดือนปัจจุบัน
  const currentMonthInvoices = await prisma.invoice.findMany({
    where: {
      billingMonth: currentMonthDate,
      status: { not: "cancelled" },
    },
    include: {
      payments: {
        where: { status: "valid" },
      },
    },
  });

  let totalBilledCurrentMonth = 0;
  let totalCollectedCurrentMonth = 0;

  for (const inv of currentMonthInvoices) {
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    totalBilledCurrentMonth += total;
    totalCollectedCurrentMonth += paid;
  }

  const totalOutstandingCurrentMonth = Math.max(0, totalBilledCurrentMonth - totalCollectedCurrentMonth);
  const collectionRate = totalBilledCurrentMonth > 0 ? (totalCollectedCurrentMonth / totalBilledCurrentMonth) * 100 : 0;

  // 3. ดึงบิลที่ค้างชำระเกินกำหนด (BR-07: unpaid/partial และ dueDate < today)
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["unpaid", "partial"] },
      dueDate: { lt: today },
    },
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
      payments: {
        where: { status: "valid" },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  let totalOverdueDebt = 0;
  const overdueRoomIds = new Set<number>();

  const topOverdueItems = overdueInvoices.slice(0, 5).map((inv) => {
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    totalOverdueDebt += balance;
    overdueRoomIds.add(inv.contract.room.id);

    const diffMs = today.getTime() - new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      roomNo: inv.contract.room.roomNo,
      tenantName: `${inv.contract.tenant.firstName} ${inv.contract.tenant.lastName}`.trim(),
      tenantPhone: inv.contract.tenant.phone,
      daysOverdue,
      balance,
    };
  });

  // คำนวณยอดหนี้รวมทั้งหมดที่เหลือจาก overdueInvoices
  for (let i = 5; i < overdueInvoices.length; i++) {
    const inv = overdueInvoices[i];
    const total = Number(inv.totalAmount);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    totalOverdueDebt += Math.max(0, total - paid);
    overdueRoomIds.add(inv.contract.room.id);
  }

  // 4. คำนวณสถานะห้องพัก
  let occupiedCount = 0;
  let vacantCount = 0;
  let maintenanceCount = 0;

  const roomItems: DashboardRoomItem[] = rooms.map((r) => {
    const activeContract = r.contracts[0];
    const isOccupied = r.status === "occupied" || !!activeContract;

    if (isOccupied) occupiedCount++;
    else if (r.status === "vacant") vacantCount++;
    else if (r.status === "maintenance") maintenanceCount++;

    return {
      id: r.id,
      roomNo: r.roomNo,
      floor: r.floor,
      roomType: r.roomType,
      baseRent: Number(r.baseRent),
      status: (isOccupied ? "occupied" : r.status) as DashboardRoomItem["status"],
      tenantName: activeContract?.tenant
        ? `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`.trim()
        : null,
      tenantPhone: activeContract?.tenant?.phone || null,
      hasOverdueBill: overdueRoomIds.has(r.id),
    };
  });

  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

  // 5. สัญญาที่ใกล้หมดอายุใน 30 วันข้างหน้า
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringContractsCount = await prisma.contract.count({
    where: {
      status: "active",
      endDate: {
        gte: today,
        lte: in30Days,
      },
    },
  });

  // 6. ตรวจสอบมิเตอร์ที่ยังไม่ได้จดในรอบเดือนนี้
  const existingReadingsCount = await prisma.meterReading.count({
    where: { readingMonth: currentMonthDate },
  });
  const unrecordedMetersCount = Math.max(0, occupiedCount - existingReadingsCount);

  // 7. งานแจ้งซ่อมค้างอยู่
  const pendingRepairs = await prisma.repairRequest.findMany({
    where: {
      status: { in: ["open", "in_progress"] },
    },
    include: {
      room: {
        select: { roomNo: true },
      },
    },
    orderBy: { reportedAt: "desc" },
  });

  const pendingRepairsCount = pendingRepairs.length;
  const urgentRepairsCount = pendingRepairs.filter((r) => r.priority === "urgent").length;

  const urgentRepairItems = pendingRepairs.slice(0, 5).map((r) => ({
    id: r.id,
    roomNo: r.room.roomNo,
    title: r.title,
    category: r.category,
    reportedAt: r.reportedAt.toISOString(),
    status: r.status,
  }));

  // 8. รายการรับชำระเงินล่าสุด
  const rawRecentPayments = await prisma.payment.findMany({
    where: { status: "valid" },
    orderBy: { paidAt: "desc" },
    take: 5,
    include: {
      invoice: {
        include: {
          contract: {
            include: {
              room: true,
              tenant: true,
            },
          },
        },
      },
    },
  });

  const recentPayments = rawRecentPayments.map((p) => ({
    id: p.id,
    receiptNo: p.receiptNo,
    roomNo: p.invoice.contract.room.roomNo,
    tenantName: `${p.invoice.contract.tenant.firstName} ${p.invoice.contract.tenant.lastName}`.trim(),
    amount: Number(p.amount),
    method: p.method,
    paidAt: p.paidAt.toISOString(),
  }));

  const dashboardData: DashboardData = {
    currentMonthThai,
    metrics: {
      totalRooms,
      occupiedRooms: occupiedCount,
      vacantRooms: vacantCount,
      maintenanceRooms: maintenanceCount,
      occupancyRate,
      totalBilledCurrentMonth,
      totalCollectedCurrentMonth,
      totalOutstandingCurrentMonth,
      collectionRate,
      totalOverdueDebt,
      overdueInvoicesCount: overdueInvoices.length,
      pendingRepairsCount,
      urgentRepairsCount,
      unrecordedMetersCount,
      expiringContractsCount,
    },
    recentActivities: {
      recentPayments,
      urgentRepairs: urgentRepairItems,
      topOverdueInvoices: topOverdueItems,
    },
    rooms: roomItems,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <DashboardClient data={dashboardData} />
      </div>
    </AppLayout>
  );
}
