import { cookies } from "next/headers";
import {
  type UserRole,
  type SessionPayload,
  SESSION_COOKIE_NAME,
  DEFAULT_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session-core";

export * from "./session-core";

/**
 * ตั้งค่า Signed Session Cookie ในระบบ (Server Actions / Route Handlers)
 */
export async function setSessionCookie(
  data: Omit<SessionPayload, "exp" | "iat">,
  maxAgeSeconds = DEFAULT_MAX_AGE
): Promise<string> {
  const token = await createSessionToken(data, maxAgeSeconds);
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // 1. Session Token สำคัญที่สุด (httpOnly: true เพื่อป้องกัน XSS และ Console Tampering)
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    path: "/",
    maxAge: maxAgeSeconds,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });

  // 2. Display Cookies สำหรับ UI badge / sidebar (ไม่มีผลต่อการตัดสินสิทธิ์ของเซิร์ฟเวอร์)
  cookieStore.set("webhotel_user_role", data.role, {
    path: "/",
    maxAge: maxAgeSeconds,
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
  });

  if (data.tenantId) {
    cookieStore.set("webhotel_tenant_id", String(data.tenantId), {
      path: "/",
      maxAge: maxAgeSeconds,
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
    });
  }

  return token;
}

/**
 * ล้าง Session Cookies ทั้งหมดเมื่อ Logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("webhotel_user_role");
  cookieStore.delete("webhotel_tenant_id");
}

/**
 * ดึง Session ของผู้ใช้งานปัจจุบันใน Server Components / Server Actions
 * คืนค่า SessionPayload ที่ผ่านการ Verify ลายเซ็นแล้ว หรือ null หากยังไม่ยืนยันตัวตน
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
