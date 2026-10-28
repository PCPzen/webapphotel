"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateThaiId,
  cleanPhoneNumber,
  validatePhoneNumber,
  calculateAge,
} from "@/lib/thaiId";

export type TenantFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
  existingTenantId?: number;
};

// -----------------------------------------------------------------------------
// 1. ลงทะเบียนผู้เช่าใหม่ (UR-2.5, BR-01, BR-14)
// -----------------------------------------------------------------------------
export async function createTenant(
  prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  const firstName = formData.get("firstName")?.toString().trim() || "";
  const lastName = formData.get("lastName")?.toString().trim() || "";
  const rawIdCardNo = formData.get("idCardNo")?.toString().trim() || "";
  const idCardNo = rawIdCardNo.replace(/\D/g, "");
  const birthDateStr = formData.get("birthDate")?.toString().trim() || "";
  const rawPhone = formData.get("phone")?.toString().trim() || "";
  const phone = cleanPhoneNumber(rawPhone);
  const email = formData.get("email")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || "";
  const emergencyName = formData.get("emergencyName")?.toString().trim() || "";
  const rawEmergencyPhone = formData.get("emergencyPhone")?.toString().trim() || "";
  const emergencyPhone = cleanPhoneNumber(rawEmergencyPhone);

  const fieldErrors: Record<string, string> = {};

  if (!firstName) fieldErrors.firstName = "กรุณากรอกชื่อจริง";
  if (!lastName) fieldErrors.lastName = "กรุณากรอกนามสกุล";

  // กฎ BR-01: ตรวจสอบเลขบัตรประชาชน 13 หลัก Modulo 11
  if (!idCardNo) {
    fieldErrors.idCardNo = "กรุณากรอกเลขบัตรประชาชน 13 หลัก";
  } else if (!validateThaiId(idCardNo)) {
    fieldErrors.idCardNo = "เลขบัตรประชาชนไม่ถูกต้องตามสูตร Modulo 11 Checksum";
  }

  // ตรวจสอบวันเกิด
  if (!birthDateStr) {
    fieldErrors.birthDate = "กรุณาระบุวันเกิด";
  } else {
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      fieldErrors.birthDate = "รูปแบบวันเกิดไม่ถูกต้อง";
    }
  }

  // กฎ BR-14: ตรวจสอบเบอร์โทรศัพท์ 10 หลัก
  if (!phone) {
    fieldErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
  } else if (!validatePhoneNumber(phone)) {
    fieldErrors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0 (เช่น 0812345678)";
  }

  if (!address) fieldErrors.address = "กรุณากรอกที่อยู่ตามบัตรประชาชน";
  if (!emergencyName) fieldErrors.emergencyName = "กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน";

  if (!emergencyPhone) {
    fieldErrors.emergencyPhone = "กรุณาระบุเบอร์ติดต่อฉุกเฉิน";
  } else if (!validatePhoneNumber(emergencyPhone)) {
    fieldErrors.emergencyPhone = "เบอร์ติดต่อฉุกเฉินต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้องตามข้อกำหนด (UR-2.7)",
      fieldErrors,
    };
  }

  try {
    // กฎ UR-2.8: ตรวจสอบข้อมูลซ้ำซ้อนด้วยเลขบัตรประชาชน
    const existing = await prisma.tenant.findUnique({
      where: { idCardNo },
    });
    if (existing) {
      return {
        error: `เลขบัตรประชาชนนี้เคยลงทะเบียนไว้แล้วในระบบ (ชื่อ: ${existing.firstName} ${existing.lastName})`,
        existingTenantId: existing.id,
      };
    }

    const birthDate = new Date(birthDateStr);

    await prisma.tenant.create({
      data: {
        idCardNo,
        firstName,
        lastName,
        birthDate,
        phone,
        email,
        address,
        emergencyName,
        emergencyPhone,
      },
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้เช่า" };
  }

  revalidatePath("/tenants");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/tenants");
}

// -----------------------------------------------------------------------------
// 2. แก้ไขข้อมูลผู้เช่า
// -----------------------------------------------------------------------------
export async function updateTenant(
  id: number,
  prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  const firstName = formData.get("firstName")?.toString().trim() || "";
  const lastName = formData.get("lastName")?.toString().trim() || "";
  const rawPhone = formData.get("phone")?.toString().trim() || "";
  const phone = cleanPhoneNumber(rawPhone);
  const email = formData.get("email")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || "";
  const emergencyName = formData.get("emergencyName")?.toString().trim() || "";
  const rawEmergencyPhone = formData.get("emergencyPhone")?.toString().trim() || "";
  const emergencyPhone = cleanPhoneNumber(rawEmergencyPhone);

  const fieldErrors: Record<string, string> = {};

  if (!firstName) fieldErrors.firstName = "กรุณากรอกชื่อจริง";
  if (!lastName) fieldErrors.lastName = "กรุณากรอกนามสกุล";
  if (!phone || !validatePhoneNumber(phone)) {
    fieldErrors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0";
  }
  if (!address) fieldErrors.address = "กรุณากรอกที่อยู่";
  if (!emergencyName) fieldErrors.emergencyName = "กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน";
  if (!emergencyPhone || !validatePhoneNumber(emergencyPhone)) {
    fieldErrors.emergencyPhone = "เบอร์ติดต่อฉุกเฉินต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors };
  }

  try {
    await prisma.tenant.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
        emergencyName,
        emergencyPhone,
      },
    });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้เช่า" };
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  redirect(`/tenants/${id}`);
}

// -----------------------------------------------------------------------------
// 3. ลบข้อมูลผู้เช่า (ตามกฎ BR-12 ห้ามลบหากมีประวัติธุรกรรม)
// -----------------------------------------------------------------------------
export async function deleteTenant(id: number): Promise<TenantFormState> {
  try {
    const contractsCount = await prisma.contract.count({ where: { tenantId: id } });
    if (contractsCount > 0) {
      return {
        error: "ไม่สามารถลบประวัติผู้เช่ารายนี้ได้ เนื่องจากมีประวัติสัญญาเช่าผูกอยู่ (ตามกฎ BR-12 ห้ามลบข้อมูลธุรกรรม)",
      };
    }

    const repairsCount = await prisma.repairRequest.count({ where: { tenantId: id } });
    if (repairsCount > 0) {
      return {
        error: "ไม่สามารถลบประวัติผู้เช่ารายนี้ได้ เนื่องจากมีประวัติการแจ้งซ่อมแซมผูกอยู่",
      };
    }

    await prisma.tenant.delete({ where: { id } });
  } catch (err: any) {
    return { error: err.message || "เกิดข้อผิดพลาดในการลบข้อมูลผู้เช่า" };
  }

  revalidatePath("/tenants");
  redirect("/tenants");
}
