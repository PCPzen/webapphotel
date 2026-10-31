import { cookies } from "next/headers";

export type AuthGuardResult = {
  authorized: boolean;
  role?: "admin" | "staff" | "tenant";
  tenantId?: number;
  error?: string;
};

/**
 * ตรวจสอบสิทธิ์ระดับผู้ดูแลระบบสูงสุด (Admin Only)
 * ใช้ป้องกัน Server Actions ที่เกี่ยวกับการตั้งค่าระบบและจัดการสิทธิ์ผู้ใช้ (OWASP A01: Broken Access Control)
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const cookieStore = await cookies();
  const role = cookieStore.get("webhotel_user_role")?.value;

  if (role !== "admin") {
    return {
      authorized: false,
      error: "ปฏิเสธการเข้าถึง: อนุญาตเฉพาะผู้ดูแลระบบสูงสุด (Admin) เท่านั้น",
    };
  }

  return { authorized: true, role: "admin" };
}

/**
 * ตรวจสอบสิทธิ์ระดับเจ้าหน้าที่หรือผู้ดูแลระบบ (Staff or Admin)
 * ใช้ป้องกัน Server Actions สำหรับงานบริหารหอพักทั้งหมด
 */
export async function requireStaffOrAdmin(): Promise<AuthGuardResult> {
  const cookieStore = await cookies();
  const role = cookieStore.get("webhotel_user_role")?.value;

  if (role !== "admin" && role !== "staff") {
    return {
      authorized: false,
      error: "ปฏิเสธการเข้าถึง: อนุญาตเฉพาะเจ้าหน้าที่ (Staff) หรือผู้ดูแลระบบ (Admin) เท่านั้น",
    };
  }

  return { authorized: true, role };
}

/**
 * ตรวจสอบสิทธิ์สำหรับการแจ้งซ่อมแซม (อนุญาต Admin, Staff หรือ Tenant เฉพาะห้องของตนเอง - ป้องกัน IDOR)
 */
export async function requireRepairAccess(targetTenantId?: number): Promise<AuthGuardResult> {
  const cookieStore = await cookies();
  const role = cookieStore.get("webhotel_user_role")?.value;
  const cookieTenantIdStr = cookieStore.get("webhotel_tenant_id")?.value;

  if (role === "admin" || role === "staff") {
    return { authorized: true, role };
  }

  if (role === "tenant" && cookieTenantIdStr) {
    const cookieTenantId = parseInt(cookieTenantIdStr, 10);
    if (targetTenantId && targetTenantId > 0 && targetTenantId !== cookieTenantId) {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: ผู้เช่าสามารถแจ้งซ่อมได้เฉพาะห้องพักของตนเองเท่านั้น",
      };
    }
    return { authorized: true, role: "tenant", tenantId: cookieTenantId };
  }

  return {
    authorized: false,
    error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
  };
}
