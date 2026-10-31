"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AuthFormState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// -----------------------------------------------------------------------------
// 1. เข้าสู่ระบบสำหรับผู้เช่า (Tenant Login)
// ผู้เช่าสามารถล็อกอินด้วย: หมายเลขห้อง + เบอร์โทรศัพท์ หรือ อีเมล
// -----------------------------------------------------------------------------
export async function loginTenant(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const roomNo = formData.get("roomNo")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const idCardLast4 = formData.get("idCardLast4")?.toString().trim() || "";
  const tenantIdStr = formData.get("tenantId")?.toString().trim() || "";

  // กรณีเป็น Quick Demo Login ที่ระบุ tenantId โดยตรง
  if (tenantIdStr) {
    const tenantId = parseInt(tenantIdStr, 10);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        contracts: {
          where: { status: "active" },
          include: { room: true },
        },
      },
    });

    if (tenant) {
      const cookieStore = await cookies();
      cookieStore.set("webhotel_tenant_id", tenant.id.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax",
      });
      cookieStore.set("webhotel_user_role", "tenant", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
      });

      redirect(`/me?tenantId=${tenant.id}`);
    }
  }

  if (!roomNo) {
    return { error: "กรุณาระบุหมายเลขห้องพัก (เช่น 101, 202)" };
  }
  if (!phone) {
    return { error: "กรุณาระบุเบอร์โทรศัพท์ที่ลงทะเบียนไว้กับหอพัก" };
  }

  const cleanLast4 = idCardLast4.replace(/[^0-9]/g, "");
  if (!cleanLast4 || cleanLast4.length !== 4) {
    return { error: "กรุณาระบุเลขท้าย 4 หลักของบัตรประชาชนให้ครบ 4 หลัก" };
  }

  try {
    // ค้นหาห้องพัก
    const room = await prisma.room.findFirst({
      where: {
        roomNo: { equals: roomNo, mode: "insensitive" },
      },
      include: {
        contracts: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });

    if (!room || room.contracts.length === 0) {
      return {
        error: `ไม่พบสัญญาเช่าที่เปิดใช้งานสำหรับห้อง ${roomNo} กรุณาตรวจสอบหรือติดต่อสำนักงานหอพัก`,
      };
    }

    const activeContract = room.contracts[0];
    const registeredPhone = activeContract.tenant.phone.replace(/[^0-9]/g, "");
    const inputPhone = phone.replace(/[^0-9]/g, "");

    // ตรวจสอบเบอร์โทรศัพท์ (เทียบเบอร์ หรือ 4 ตัวท้าย)
    if (
      registeredPhone !== inputPhone &&
      !registeredPhone.endsWith(inputPhone) &&
      !inputPhone.endsWith(registeredPhone)
    ) {
      return {
        error: "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลในสัญญาเช่าของห้องนี้",
      };
    }

    // ตรวจสอบเลขท้าย 4 หลักของบัตรประชาชน (ความปลอดภัยระดับสูง)
    const registeredIdCard = (activeContract.tenant.idCardNo || "").replace(/[^0-9]/g, "");
    if (!registeredIdCard.endsWith(cleanLast4)) {
      return {
        error: "เลขท้าย 4 หลักของบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("webhotel_tenant_id", activeContract.tenant.id.toString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });
    cookieStore.set("webhotel_user_role", "tenant", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });

    redirect(`/me?tenantId=${activeContract.tenant.id}`);
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

// -----------------------------------------------------------------------------
// 2. เข้าสู่ระบบสำหรับผู้ดูแล & เจ้าหน้าที่ (Admin / Staff Login)
// -----------------------------------------------------------------------------
export async function loginStaff(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const isDemoAdmin = formData.get("isDemoAdmin")?.toString() === "true";
  const isDemoStaff = formData.get("isDemoStaff")?.toString() === "true";

  try {
    let profile;

    if (isDemoAdmin) {
      // Quick Demo Admin Login
      profile = await prisma.profile.findFirst({
        where: { role: "admin", isActive: true },
      });

      // หากยังไม่มี Profile Admin ในระบบ ให้สร้าง default admin ทันที
      if (!profile) {
        profile = await prisma.profile.create({
          data: {
            fullName: "ผู้ดูแลระบบสูงสุด (System Admin)",
            email: "admin@webhotel.com",
            role: "admin",
            phone: "0812345678",
            isActive: true,
          },
        });
      }
    } else if (isDemoStaff) {
      // Quick Demo Staff Login
      profile = await prisma.profile.findFirst({
        where: { role: "staff", isActive: true },
      });

      if (!profile) {
        profile = await prisma.profile.create({
          data: {
            fullName: "เจ้าหน้าที่นิติบุคคล (Staff)",
            email: "staff@webhotel.com",
            role: "staff",
            phone: "0898765432",
            isActive: true,
          },
        });
      }
    } else {
      if (!email) {
        return { error: "กรุณาระบุอีเมลเจ้าหน้าที่" };
      }

      profile = await prisma.profile.findUnique({
        where: { email },
      });

      if (!profile) {
        return { error: `ไม่พบข้อมูลผู้ใช้สำหรับอีเมล ${email}` };
      }

      if (!profile.isActive) {
        return { error: "บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ" };
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("webhotel_user_role", profile.role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });
    cookieStore.set("webhotel_user_email", profile.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });

    redirect("/dashboard");
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

// -----------------------------------------------------------------------------
// 3. สลับไปยังมุมมองผู้ดูแลระบบ (Switch to Admin Mode for Demo/Testing)
// -----------------------------------------------------------------------------
export async function switchToAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("webhotel_user_role", "admin", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/dashboard");
}

// -----------------------------------------------------------------------------
// 4. ออกจากระบบ (Logout)
// -----------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("webhotel_tenant_id");
  cookieStore.delete("webhotel_user_role");
  cookieStore.delete("webhotel_user_email");

  redirect("/");
}
