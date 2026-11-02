/**
 * ระบบจัดการและกรอง Emoji ตามข้อกำหนด:
 * "ในเว็บไซต์นี้ห้ามใส่ emoji เด็ดขาด"
 */

export const EMOJI_REGEX =
  /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE00}-\u{FE0F}\u{200D}])/gu;

/**
 * ตัด Emoji ทั้งหมดออกจากข้อความ
 */
export function stripEmoji(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(EMOJI_REGEX, "").replace(/\s+/g, " ").trim();
}

/**
 * ตรวจสอบว่ามี Emoji อยู่ในข้อความหรือไม่
 */
export function hasEmoji(str: string | null | undefined): boolean {
  if (!str) return false;
  return EMOJI_REGEX.test(str);
}

/**
 * Event handler สำหรับ onChange/onInput ใน form เพื่อบล็อกไม่ให้พิมพ์หรือวาง Emoji
 */
export function handleEmojiInput(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const target = e.currentTarget;
  if (hasEmoji(target.value)) {
    target.value = stripEmoji(target.value);
  }
}
