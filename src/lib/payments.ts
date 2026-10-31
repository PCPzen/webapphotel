// -----------------------------------------------------------------------------
// Helper functions สำหรับระบบรับชำระเงินและใบเสร็จ (Payments & Receipts)
// -----------------------------------------------------------------------------

/**
 * แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย (Thai Baht Text)
 * ตัวอย่าง: 4916.00 -> "สี่พันเก้าร้อยสิบหกบาทถ้วน"
 */
export function thaiBahtText(num: number): string {
  if (isNaN(num)) return "-";
  if (num === 0) return "ศูนย์บาทถ้วน";

  const numWords = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const digitUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const formatGroup = (intStr: string): string => {
    let result = "";
    const len = intStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(intStr[i], 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          result += "สิบ";
        } else if (pos === 1 && digit === 2) {
          result += "ยี่สิบ";
        } else if (pos === 0 && digit === 1 && len > 1 && intStr[len - 2] !== "0") {
          result += "เอ็ด";
        } else {
          result += numWords[digit] + digitUnits[pos];
        }
      }
    }
    return result;
  };

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split(".");

  let text = isNegative ? "ลบ" : "";

  // คำนวณส่วนจำนวนเต็ม (รองรับได้ถึงหลักล้าน)
  if (parseInt(intPart, 10) === 0) {
    text += "ศูนย์บาท";
  } else {
    // ถ้าเกินล้าน
    if (intPart.length > 6) {
      const millionPart = intPart.slice(0, intPart.length - 6);
      const remainPart = intPart.slice(intPart.length - 6);
      text += formatGroup(millionPart) + "ล้าน" + formatGroup(remainPart) + "บาท";
    } else {
      text += formatGroup(intPart) + "บาท";
    }
  }

  // คำนวณส่วนสตางค์
  const satang = parseInt(decPart, 10);
  if (satang === 0) {
    text += "ถ้วน";
  } else {
    text += formatGroup(decPart) + "สตางค์";
  }

  return text;
}

/**
 * แปลงวิธีชำระเงินเป็นภาษาไทย
 */
export function formatPaymentMethod(method: string): string {
  switch (method) {
    case "cash":
      return "เงินสด";
    case "bank_transfer":
      return "โอนผ่านธนาคาร";
    case "deposit_offset":
      return "หักเงินมัดจำ (Move-out Settlement)";
    case "other":
      return "อื่น ๆ";
    default:
      return method;
  }
}
