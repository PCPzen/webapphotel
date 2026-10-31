import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import OccupancyReportClient, {
  OccupancyReportData,
  OccupancyRoomItem,
  FloorStat,
  RoomTypeStat,
} from "./OccupancyReportClient";

export default async function OccupancyReportPage() {
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

  const today = new Date();

  let occupiedCount = 0;
  let vacantCount = 0;
  let maintenanceCount = 0;

  let totalCapacityRent = 0;
  let actualOccupiedRent = 0;

  const floorMap = new Map<number, { total: number; occupied: number; vacant: number; maintenance: number }>();
  const typeMap = new Map<string, { total: number; occupied: number; vacant: number; rentSum: number }>();

  const roomItems: OccupancyRoomItem[] = rooms.map((r) => {
    const rent = Number(r.baseRent);
    totalCapacityRent += rent;

    const activeContract = r.contracts[0];
    const isOccupied = r.status === "occupied" || !!activeContract;

    if (isOccupied) {
      occupiedCount++;
      actualOccupiedRent += rent;
    } else if (r.status === "vacant") {
      vacantCount++;
    } else if (r.status === "maintenance") {
      maintenanceCount++;
    }

    // Floor stats aggregation
    if (!floorMap.has(r.floor)) {
      floorMap.set(r.floor, { total: 0, occupied: 0, vacant: 0, maintenance: 0 });
    }
    const fl = floorMap.get(r.floor)!;
    fl.total++;
    if (isOccupied) fl.occupied++;
    else if (r.status === "vacant") fl.vacant++;
    else fl.maintenance++;

    // Type stats aggregation
    if (!typeMap.has(r.roomType)) {
      typeMap.set(r.roomType, { total: 0, occupied: 0, vacant: 0, rentSum: 0 });
    }
    const tp = typeMap.get(r.roomType)!;
    tp.total++;
    tp.rentSum += rent;
    if (isOccupied) tp.occupied++;
    else tp.vacant++;

    let daysRemaining: number | null = null;
    if (activeContract?.endDate) {
      const diffMs = new Date(activeContract.endDate).getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      id: r.id,
      roomNo: r.roomNo,
      floor: r.floor,
      roomType: r.roomType,
      baseRent: rent,
      status: r.status as OccupancyRoomItem["status"],
      tenantName: activeContract?.tenant
        ? `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}`.trim()
        : null,
      tenantPhone: activeContract?.tenant?.phone || null,
      contractStartDate: activeContract?.startDate.toISOString() || null,
      contractEndDate: activeContract?.endDate.toISOString() || null,
      daysRemaining,
    };
  });

  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

  const floorStats: FloorStat[] = Array.from(floorMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([floor, s]) => ({
      floor,
      total: s.total,
      occupied: s.occupied,
      vacant: s.vacant,
      maintenance: s.maintenance,
      rate: s.total > 0 ? (s.occupied / s.total) * 100 : 0,
    }));

  const typeStats: RoomTypeStat[] = Array.from(typeMap.entries())
    .map(([type, s]) => ({
      type,
      total: s.total,
      occupied: s.occupied,
      vacant: s.vacant,
      avgRent: s.total > 0 ? s.rentSum / s.total : 0,
      rate: s.total > 0 ? (s.occupied / s.total) * 100 : 0,
    }));

  const reportData: OccupancyReportData = {
    totalRooms,
    occupiedRooms: occupiedCount,
    vacantRooms: vacantCount,
    maintenanceRooms: maintenanceCount,
    occupancyRate,
    totalCapacityRent,
    actualOccupiedRent,
    floorStats,
    typeStats,
    rooms: roomItems,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <OccupancyReportClient data={reportData} />
      </div>
    </AppLayout>
  );
}
