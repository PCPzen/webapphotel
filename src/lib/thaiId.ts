/**
 * ระบบตรวจสอบและจัดการข้อมูลบัตรประชาชนและเบอร์โทรศัพท์
 * ตามกฎ BR-01, BR-13, BR-14 และ PDPA
 */

/**
 * BR-01: ตรวจสอบเลขบัตรประชาชน 13 หลักด้วย Modulo 11 Checksum
 * สูตร: (11 - (Sum(d_i * (14 - i)) mod 11)) mod 10 == d_13
 */
export function validateThaiId(idCardNo: string): boolean {
  const cleaned = idCardNo.replace(/\D/g, "");
  if (cleaned.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned.charAt(12), 10);
}

/**
 * BR-13: ปิดบังเลขบัตรประชาชน (Masking) ตามมาตรฐาน PDPA
 * ตัวอย่าง: 1234567890121 -> •••••••••0121
 */
export function maskThaiId(idCardNo: string): string {
  const cleaned = idCardNo.replace(/\D/g, "");
  if (cleaned.length < 4) return "•••••••••••••";
  const lastFour = cleaned.slice(-4);
  return `•••••••••${lastFour}`;
}

/**
 * BR-14: ทำความสะอาดเบอร์โทรศัพท์ (ตัดขีด ช่องว่าง)
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

/**
 * BR-14: ตรวจสอบเบอร์โทรศัพท์ 10 หลักขึ้นต้นด้วย 0
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return /^0\d{9}$/.test(cleaned);
}

/**
 * UR-2.5: คำนวณอายุเต็มปีจากวันเกิด
 */
export function calculateAge(birthDateInput: Date | string): number {
  const birth = new Date(birthDateInput);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
