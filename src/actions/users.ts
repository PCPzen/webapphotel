"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-guard";
import { stripEmoji } from "@/lib/emoji";
import { setToastCookie } from "@/lib/toast";

export type UserActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

// -----------------------------------------------------------------------------
// 1. เพิ่มผู้ใช้ / เจ้าหน้าที่ใหม่ (Admin / Staff Profile)
// -----------------------------------------------------------------------------
export async function createStaffProfile(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if (!auth.authorized) return { error: auth.error };

  const fullName = stripEmoji(formData.get("fullName")?.toString().trim() || "");
  const email = stripEmoji(formData.get("email")?.toString().trim().toLowerCase() || "");
  const rawPhone = formData.get("phone")?.toString().trim();
  const phone = rawPhone ? stripEmoji(rawPhone) : null;
  const roleStr = formData.get("role")?.toString() || "staff";

  if (!fullName) return { error: "กรุณาระบุชื่อ-นามสกุล" };
  if (!email || !email.includes("@")) return { error: "กรุณาระบุอีเมลที่ถูกต้อง" };

  const validRoles: UserRole[] = ["admin", "staff"];
  const role = validRoles.includes(roleStr as UserRole) ? (roleStr as UserRole) : "staff";

  try {
    const existing = await prisma.profile.findUnique({
      where: { email },
    });
    if (existing) {
      return { error: `อีเมล ${email} มีผู้ใช้งานแล้วในระบบ` };
    }

    await prisma.profile.create({
      data: {
        fullName,
        email,
        phone,
        role,
        isActive: true,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: `เพิ่มผู้ใช้งาน ${fullName} เรียบร้อยแล้ว` };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้" };
  }
}

// -----------------------------------------------------------------------------
// 2. แก้ไขข้อมูลผู้ใช้และบทบาท (Update User Profile)
// -----------------------------------------------------------------------------
export async function updateUserProfile(
  userId: string,
  formData: FormData
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if (!auth.authorized) return { error: auth.error };

  if (!userId) return { error: "ไม่พบรหัสผู้ใช้" };

  const fullName = stripEmoji(formData.get("fullName")?.toString().trim() || "");
  const rawPhone = formData.get("phone")?.toString().trim();
  const phone = rawPhone ? stripEmoji(rawPhone) : null;
  const roleStr = formData.get("role")?.toString() || "staff";
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!fullName) return { error: "กรุณาระบุชื่อ-นามสกุล" };

  const validRoles: UserRole[] = ["admin", "staff", "tenant"];
  const role = validRoles.includes(roleStr as UserRole) ? (roleStr as UserRole) : "staff";

  try {
    // ป้องกันการปิดการใช้งาน Admin คนสุดท้าย
    if (!isActive && role === "admin") {
      const activeAdminCount = await prisma.profile.count({
        where: { role: "admin", isActive: true },
      });
      if (activeAdminCount <= 1) {
        return { error: "ไม่สามารถปิดการใช้งาน Admin คนสุดท้ายของระบบได้" };
      }
    }

    await prisma.profile.update({
      where: { id: userId },
      data: {
        fullName,
        phone,
        role,
        isActive,
      },
    });

    revalidatePath("/admin/users");
    await setToastCookie("อัปเดตข้อมูลผู้ใช้งานสำเร็จ", "success");
    return { success: true, message: "อัปเดตข้อมูลผู้ใช้งานสำเร็จ" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้" };
  }
}

// -----------------------------------------------------------------------------
// 3. ลบบัญชีผู้ใช้ (Delete User Profile)
// -----------------------------------------------------------------------------
export async function deleteUserProfile(userId: string): Promise<UserActionState> {
  const auth = await requireAdmin();
  if (!auth.authorized) return { error: auth.error };

  if (!userId) return { error: "ไม่พบรหัสผู้ใช้" };

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!profile) return { error: "ไม่พบผู้ใช้ในระบบ" };

    if (profile.role === "admin") {
      const adminCount = await prisma.profile.count({
        where: { role: "admin" },
      });
      if (adminCount <= 1) {
        return { error: "ไม่สามารถลบ Admin คนสุดท้ายของระบบได้" };
      }
    }

    await prisma.profile.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "ลบบัญชีผู้ใช้งานสำเร็จ" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้" };
  }
}

// -----------------------------------------------------------------------------
// 4. บันทึกการตั้งค่าระบบหอพัก (System Settings)
// -----------------------------------------------------------------------------
export async function updateSystemSettings(
  formData: FormData
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if (!auth.authorized) return { error: auth.error };

  const dormName = stripEmoji(formData.get("dormName")?.toString().trim() || "หอพักสุขสบาย");
  const dormAddress = stripEmoji(formData.get("dormAddress")?.toString().trim() || "");
  const dormPhone = stripEmoji(formData.get("dormPhone")?.toString().trim() || "");
  const bankName = stripEmoji(formData.get("bankName")?.toString().trim() || "");
  const bankAccountNo = stripEmoji(formData.get("bankAccountNo")?.toString().trim() || "");
  const bankAccountName = stripEmoji(formData.get("bankAccountName")?.toString().trim() || "");
  const promptpayId = stripEmoji(formData.get("promptpayId")?.toString().trim() || "");

  const defaultWaterRate = parseFloat(formData.get("defaultWaterRate")?.toString() || "18");
  const defaultElectricRate = parseFloat(formData.get("defaultElectricRate")?.toString() || "8");
  const defaultLateFee = parseFloat(formData.get("defaultLateFee")?.toString() || "50");
  const defaultDueDay = parseInt(formData.get("defaultDueDay")?.toString() || "5", 10);

  if (isNaN(defaultWaterRate) || defaultWaterRate < 0) {
    return { error: "ค่าน้ำเริ่มต้นต้องเป็นตัวเลข 0 บาทขึ้นไป" };
  }
  if (isNaN(defaultElectricRate) || defaultElectricRate < 0) {
    return { error: "ค่าไฟเริ่มต้นต้องเป็นตัวเลข 0 บาทขึ้นไป" };
  }
  if (isNaN(defaultDueDay) || defaultDueDay < 1 || defaultDueDay > 28) {
    return { error: "วันครบกำหนดชำระของเดือนถัดไปต้องอยู่ระหว่างวันที่ 1 ถึง 28" };
  }

  try {
    const existing = await prisma.systemSetting.findFirst();

    if (existing) {
      await prisma.systemSetting.update({
        where: { id: existing.id },
        data: {
          dormName,
          dormAddress,
          dormPhone,
          bankName,
          bankAccountNo,
          bankAccountName,
          promptpayId,
          defaultWaterRate,
          defaultElectricRate,
          defaultLateFee,
          defaultDueDay,
        },
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          dormName,
          dormAddress,
          dormPhone,
          bankName,
          bankAccountNo,
          bankAccountName,
          promptpayId,
          defaultWaterRate,
          defaultElectricRate,
          defaultLateFee,
          defaultDueDay,
        },
      });
    }

    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true, message: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว" };
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" };
  }
}
