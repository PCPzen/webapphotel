// -----------------------------------------------------------------------------
// Helper functions & Labels สำหรับระบบแจ้งซ่อมแซม (Repairs Management)
// ปรับปรุงธีม ฟ้า-ดำ-ขาว และไม่ใช้ Emoji ใดๆ ในข้อความ
// -----------------------------------------------------------------------------

export function formatRepairCategory(category: string): { label: string; icon: string } {
  switch (category) {
    case "electric":
      return { label: "ระบบไฟฟ้า", icon: "" };
    case "plumbing":
      return { label: "ประปา / สุขภัณฑ์", icon: "" };
    case "aircon":
      return { label: "เครื่องปรับอากาศ", icon: "" };
    case "furniture":
      return { label: "เฟอร์นิเจอร์ / ประตูหน้าต่าง", icon: "" };
    case "other":
    default:
      return { label: "อื่น ๆ", icon: "" };
  }
}

export function formatRepairPriority(priority: string): {
  label: string;
  badgeClass: string;
} {
  switch (priority) {
    case "urgent":
      return {
        label: "ด่วนมาก",
        badgeClass: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
      };
    case "low":
      return {
        label: "ไม่ด่วน",
        badgeClass: "bg-slate-800 text-slate-400 border border-slate-700",
      };
    case "normal":
    default:
      return {
        label: "ปกติ",
        badgeClass: "bg-blue-500/10 text-blue-300 border border-blue-500/30",
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
        label: "กำลังดำเนินการ",
        badgeClass: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
      };
    case "done":
      return {
        label: "เสร็จสิ้นแล้ว",
        badgeClass: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
      };
    case "cancelled":
      return {
        label: "ยกเลิกแล้ว",
        badgeClass: "bg-slate-800 text-slate-400 border border-slate-700",
      };
    case "open":
    default:
      return {
        label: "รอดำเนินการ",
        badgeClass: "bg-sky-500/10 text-sky-300 border border-sky-500/30",
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
