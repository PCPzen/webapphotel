// -----------------------------------------------------------------------------
// Helper functions สำหรับระบบใบแจ้งหนี้ (Invoices Utilities)
// -----------------------------------------------------------------------------

/**
 * คำนวณการปัดเศษทศนิยมแบบ Half-Up (BR-05 & NFR-08)
 * ตัวอย่าง: 2.125 -> 2.13, 2.124 -> 2.12
 */
export function roundHalfUp(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  const sign = num >= 0 ? 1 : -1;
  const abs = Math.abs(num);
  return (sign * Math.floor(abs * factor + 0.5)) / factor;
}

/**
 * คำนวณวันครบกำหนดชำระเงิน (Due Date) ตามกฎ BR-06
 * due_day ของเดือนถัดไป (M+1) เช่น ถ้าบิลเดือน 10 dueDay=5 -> dueDate คือ 5 พ.ย.
 */
export function computeDueDate(billingMonth: Date, dueDay: number): Date {
  const year = billingMonth.getUTCFullYear();
  const month = billingMonth.getUTCMonth(); // 0-indexed

  // เดือนถัดไป (M+1)
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = nextMonthDate.getUTCMonth();

  // จำกัดวันไม่ให้เกินวันสุดท้ายของเดือนถัดไป (แม้ว่า dueDay ถูกจำกัดที่ 1-28 ใน SRD)
  const safeDay = Math.min(Math.max(1, dueDay), 28);
  return new Date(Date.UTC(nextYear, nextMonth, safeDay));
}

/**
 * สร้างเลขที่ใบแจ้งหนี้ตามกฎ BR-11: INV-YYYYMM-ROOM (เช่น INV-202610-101)
 */
export function generateInvoiceNo(billingMonth: Date, roomNo: string, suffix?: number): string {
  const y = billingMonth.getUTCFullYear();
  const m = String(billingMonth.getUTCMonth() + 1).padStart(2, "0");
  const base = `INV-${y}${m}-${roomNo.trim()}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * ตรวจสอบว่าใบแจ้งหนี้เกินกำหนดชำระหรือไม่ (กฎ BR-07)
 * เกินกำหนด = วันที่ปัจจุบัน > dueDate และยอดคงค้าง > 0
 */
export function isInvoiceOverdue(dueDate: Date, balance: number): boolean {
  if (balance <= 0) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return today.getTime() > due.getTime();
}

/**
 * แปลงวันที่เป็นข้อความภาษาไทย (เช่น 5 พฤศจิกายน 2569)
 */
export function formatThaiDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

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

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}
