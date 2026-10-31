// -----------------------------------------------------------------------------
// Helper: ตรวจสอบและแปลง string YYYY-MM เป็น Date (วันแรกของเดือน)
// -----------------------------------------------------------------------------
export function parseReadingMonth(monthStr: string): Date {
  const parts = monthStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

export function formatMonthString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getThaiMonthName(date: Date): string {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const m = months[date.getUTCMonth()];
  const y = date.getUTCFullYear() + 543;
  return `${m} ${y}`;
}
