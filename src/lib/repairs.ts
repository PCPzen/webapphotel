// -----------------------------------------------------------------------------
// Helper functions & Labels สำหรับระบบแจ้งซ่อมแซม (Repairs Management)
// -----------------------------------------------------------------------------

export function formatRepairCategory(category: string): { label: string; icon: string } {
  switch (category) {
    case "electric":
      return { label: "ระบบไฟฟ้า", icon: "⚡" };
    case "plumbing":
      return { label: "ประปา / สุขภัณฑ์", icon: "🚿" };
    case "aircon":
      return { label: "เครื่องปรับอากาศ", icon: "❄️" };
    case "furniture":
      return { label: "เฟอร์นิเจอร์ / ประตูหน้าต่าง", icon: "🪑" };
    case "other":
    default:
      return { label: "อื่น ๆ", icon: "🔧" };
  }
}

export function formatRepairPriority(priority: string): {
  label: string;
  badgeClass: string;
} {
  switch (priority) {
    case "urgent":
      return {
        label: "ด่วนมาก 🚨",
        badgeClass: "bg-red-500/20 text-red-300 border-red-500/40",
      };
    case "low":
      return {
        label: "ไม่ด่วน",
        badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
      };
    case "normal":
    default:
      return {
        label: "ปกติ",
        badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",
      };
  }
}

export function formatRepairStatus(status: string): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "in_progress":
      return {
        label: "กำลังดำเนินการ 🔧",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    case "done":
      return {
        label: "เสร็จสิ้นแล้ว ✅",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    case "cancelled":
      return {
        label: "ยกเลิกแล้ว",
        badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
      };
    case "open":
    default:
      return {
        label: "รอดำเนินการ ⏳",
        badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      };
  }
}

export function calculateDurationText(start: Date | string, end?: Date | string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    const remainHours = diffHours % 24;
    return `${diffDays} วัน ${remainHours > 0 ? `${remainHours} ชม.` : ""}`;
  }
  if (diffHours >= 1) {
    return `${diffHours} ชั่วโมง`;
  }
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMinutes} นาที`;
}
