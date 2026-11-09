import { getServerSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export type AuthGuardResult = {
  authorized: boolean;
  role?: "admin" | "staff" | "tenant";
  userId?: string;
  tenantId?: number;
  email?: string;
  error?: string;
};

/**
 * ตรวจสอบสิทธิ์ระดับผู้ดูแลระบบสูงสุด (Admin Only)
 * ตรวจสอบทั้ง Signed Session Token และคิวรีสถานะจริงจากฐานข้อมูล (OWASP A01: Broken Access Control)
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const session = await getServerSession();

  if (!session || session.role !== "admin") {
    return {
      authorized: false,
      error: "ปฏิเสธการเข้าถึง: อนุญาตเฉพาะผู้ดูแลระบบสูงสุด (Admin) เท่านั้น",
    };
  }

  // ตรวจสอบความถูกต้องกับตาราง profiles ฝั่งฐานข้อมูล
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, isActive: true, email: true },
    });

    if (!profile || !profile.isActive || profile.role !== "admin") {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: บัญชีผู้ใช้ถูกระงับหรือไม่มีสิทธิ์ผู้ดูแลระบบ",
      };
    }

    return {
      authorized: true,
      role: "admin",
      userId: profile.id,
      email: profile.email,
    };
  } catch {
    return {
      authorized: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ผู้ดูแลระบบ",
    };
  }
}

/**
 * ตรวจสอบสิทธิ์ระดับเจ้าหน้าที่หรือผู้ดูแลระบบ (Staff or Admin)
 */
export async function requireStaffOrAdmin(): Promise<AuthGuardResult> {
  const session = await getServerSession();

  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    return {
      authorized: false,
      error: "ปฏิเสธการเข้าถึง: อนุญาตเฉพาะเจ้าหน้าที่ (Staff) หรือผู้ดูแลระบบ (Admin) เท่านั้น",
    };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, isActive: true, email: true },
    });

    if (!profile || !profile.isActive || (profile.role !== "admin" && profile.role !== "staff")) {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: บัญชีผู้ใช้นี้ถูกระงับการใช้งาน",
      };
    }

    return {
      authorized: true,
      role: profile.role as "admin" | "staff",
      userId: profile.id,
      email: profile.email,
    };
  } catch {
    return {
      authorized: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์เจ้าหน้าที่",
    };
  }
}

/**
 * ตรวจสอบสิทธิ์สำหรับการแจ้งซ่อมแซม (อนุญาต Admin, Staff หรือ Tenant เฉพาะห้องของตนเอง - ป้องกัน IDOR & Broken Object Level Auth)
 */
export async function requireRepairAccess(
  targetTenantId?: number,
  targetRoomId?: number
): Promise<AuthGuardResult> {
  const session = await getServerSession();

  if (!session) {
    return {
      authorized: false,
      error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
    };
  }

  // Admin หรือ Staff มีสิทธิ์จัดการงานซ่อมทุกห้อง
  if (session.role === "admin" || session.role === "staff") {
    return { authorized: true, role: session.role, userId: session.userId };
  }

  // กรณีผู้เช่า (Tenant) ตรวจสอบว่าผู้เช่าคนนี้มีสัญญาที่ active อยู่กับห้องนั้นจริงหรือไม่
  if (session.role === "tenant" && session.tenantId) {
    const currentTenantId = session.tenantId;

    if (targetTenantId && targetTenantId > 0 && targetTenantId !== currentTenantId) {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: ผู้เช่าสามารถแจ้งซ่อมได้เฉพาะห้องพักของตนเองเท่านั้น",
      };
    }

    // ค้นหาสัญญา active ของผู้เช่าคนนี้
    const activeContract = await prisma.contract.findFirst({
      where: {
        tenantId: currentTenantId,
        status: "active",
      },
      select: {
        roomId: true,
      },
    });

    if (!activeContract) {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: ไม่พบสัญญาเช่าที่เปิดใช้งานสำหรับบัญชีของคุณ",
      };
    }

    // หากระบุ targetRoomId ต้องตรงกับห้องที่ทำสัญญาจริง
    if (targetRoomId && targetRoomId > 0 && targetRoomId !== activeContract.roomId) {
      return {
        authorized: false,
        error: "ปฏิเสธการเข้าถึง: คุณสามารถแจ้งซ่อมได้เฉพาะห้องพักในสัญญาของคุณเท่านั้น",
      };
    }

    return {
      authorized: true,
      role: "tenant",
      tenantId: currentTenantId,
      userId: session.userId,
    };
  }

  return {
    authorized: false,
    error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
  };
}
