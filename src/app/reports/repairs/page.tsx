import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import RepairsReportClient, {
  RepairsReportData,
  RepairSummaryItem,
  CategoryStat,
  TechnicianStat,
} from "./RepairsReportClient";
import { formatRepairCategory } from "@/lib/repairs";

export default async function RepairsReportPage() {
  const repairs = await prisma.repairRequest.findMany({
    orderBy: [
      { reportedAt: "desc" },
    ],
    include: {
      room: {
        select: {
          roomNo: true,
          floor: true,
        },
      },
    },
  });

  let doneCount = 0;
  let inProgressCount = 0;
  let openCount = 0;
  let cancelledCount = 0;
  let totalCost = 0;

  let totalResolutionHours = 0;
  let completedWithTimeCount = 0;

  const categoryMap = new Map<string, { count: number; cost: number }>();
  const techMap = new Map<string, { jobCount: number; totalCost: number }>();

  const repairItems: RepairSummaryItem[] = repairs.map((r) => {
    const cost = Number(r.cost ?? 0);

    if (r.status === "done") {
      doneCount++;
      totalCost += cost;

      if (r.completedAt) {
        const diffHours =
          (new Date(r.completedAt).getTime() - new Date(r.reportedAt).getTime()) /
          (1000 * 60 * 60);
        if (diffHours > 0) {
          totalResolutionHours += diffHours;
          completedWithTimeCount++;
        }
      }
    } else if (r.status === "in_progress") {
      inProgressCount++;
    } else if (r.status === "open") {
      openCount++;
    } else if (r.status === "cancelled") {
      cancelledCount++;
    }

    // Category aggregation
    if (!categoryMap.has(r.category)) {
      categoryMap.set(r.category, { count: 0, cost: 0 });
    }
    const cat = categoryMap.get(r.category)!;
    cat.count++;
    cat.cost += cost;

    // Tech aggregation
    if (r.assignedTo) {
      if (!techMap.has(r.assignedTo)) {
        techMap.set(r.assignedTo, { jobCount: 0, totalCost: 0 });
      }
      const t = techMap.get(r.assignedTo)!;
      t.jobCount++;
      t.totalCost += cost;
    }

    return {
      id: r.id,
      roomId: r.roomId,
      roomNo: r.room.roomNo,
      floor: r.room.floor,
      title: r.title,
      category: r.category as RepairSummaryItem["category"],
      priority: r.priority as RepairSummaryItem["priority"],
      status: r.status as RepairSummaryItem["status"],
      reportedAt: r.reportedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() || null,
      assignedTo: r.assignedTo,
      cost,
      resolutionNote: r.resolutionNote,
    };
  });

  const totalCount = repairs.length;
  const avgResolutionHours =
    completedWithTimeCount > 0 ? totalResolutionHours / completedWithTimeCount : 0;

  // Categories list
  const knownCategories = ["electric", "plumbing", "aircon", "furniture", "other"];
  const categoryStats: CategoryStat[] = knownCategories.map((c) => {
    const stat = categoryMap.get(c) || { count: 0, cost: 0 };
    const meta = formatRepairCategory(c);
    return {
      category: c,
      label: meta.label,
      icon: meta.icon,
      count: stat.count,
      cost: stat.cost,
      percent: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
    };
  });

  const technicianStats: TechnicianStat[] = Array.from(techMap.entries())
    .map(([name, s]) => ({
      name,
      jobCount: s.jobCount,
      totalCost: s.totalCost,
    }))
    .sort((a, b) => b.jobCount - a.jobCount);

  const reportData: RepairsReportData = {
    totalCount,
    doneCount,
    inProgressCount,
    openCount,
    cancelledCount,
    totalCost,
    avgResolutionHours,
    categoryStats,
    technicianStats,
    recentRepairs: repairItems,
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <RepairsReportClient data={reportData} />
      </div>
    </AppLayout>
  );
}
