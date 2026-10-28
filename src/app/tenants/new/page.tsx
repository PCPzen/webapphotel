"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { createTenant, TenantFormState } from "@/actions/tenants";
import { validateThaiId, calculateAge } from "@/lib/thaiId";
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Save,
  ShieldCheck,
  Calendar,
  Phone,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Car,
  Users,
  ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const initialState: TenantFormState = {};

export default function NewTenantPage() {
  const [state, formAction, isPending] = useActionState(createTenant, initialState);

  // Live state for interactive validation
  const [idCardInput, setIdCardInput] = useState("");
  const [birthDateInput, setBirthDateInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState("");

  // Live Thai ID Checksum validation (BR-01)
  const cleanedId = idCardInput.replace(/\D/g, "");
  const is13Digits = cleanedId.length === 13;
  const isThaiIdValid = is13Digits ? validateThaiId(cleanedId) : null;

  // Live Age Calculation (UR-2.5)
  const calculatedAge = birthDateInput ? calculateAge(birthDateInput) : null;
  const isMinor = calculatedAge !== null && calculatedAge < 20;

  // Helper function to fill test Thai ID from SRD
  const fillSampleThaiId = () => {
    setIdCardInput("1234567890121");
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/tenants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าทะเบียนผู้เช่า
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-violet-950/60">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">ลงทะเบียนประวัติผู้เช่าใหม่</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                บันทึกข้อมูลส่วนบุคคล ตรวจสอบเลขบัตร 13 หลัก (BR-01) ยานพาหนะ และช่องทางติดต่อ
              </p>
            </div>
          </div>

          <form action={formAction} className="p-6 md:p-8 space-y-6">
            {/* Global Error Banner */}
            {state?.error && (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="font-bold">{state.error}</span>
                </div>
                {state.existingTenantId && (
                  <Link
                    href={`/tenants/${state.existingTenantId}`}
                    className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-white font-bold underline ml-6"
                  >
                    คลิกที่นี่เพื่อไปดูข้อมูลผู้เช่าเดิมรายนี้ <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* 1. ส่วนข้อมูลบัตรประชาชนและชื่อ-นามสกุล */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                ข้อมูลประจำตัวผู้เช่า (ตามบัตรประชาชน)
              </h3>

              {/* ช่องเลขบัตรประชาชน 13 หลัก */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    เลขบัตรประจำตัวประชาชน 13 หลัก <span className="text-fuchsia-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={fillSampleThaiId}
                    className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-fuchsia-400" /> ใส่เลขทดสอบตาม SRD (1234567890121)
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    name="idCardNo"
                    required
                    maxLength={17}
                    placeholder="x-xxxx-xxxxx-xx-x (13 หลัก)"
                    value={idCardInput}
                    onChange={(e) => setIdCardInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 font-mono ${
                      isThaiIdValid === true
                        ? "border-emerald-500/60 focus:ring-emerald-500/60"
                        : isThaiIdValid === false
                        ? "border-red-500/60 focus:ring-red-500/60"
                        : "border-violet-950/80 focus:ring-violet-500"
                    }`}
                  />
                  {isThaiIdValid === true && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center gap-1 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> ถูกต้อง (Modulo 11)
                    </span>
                  )}
                  {isThaiIdValid === false && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 flex items-center gap-1 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" /> Checksum ไม่ตรง
                    </span>
                  )}
                </div>

                {state?.fieldErrors?.idCardNo && (
                  <p className="text-[11px] text-red-400">{state.fieldErrors.idCardNo}</p>
                )}
                <p className="text-[11px] text-zinc-500">
                  ระบบจะตรวจสอบ Checksum ตามสูตรกฎ BR-01 ทันที และจะถูก Mask ปิดบังในหน้ารายการตาม PDPA
                </p>
              </div>

              {/* ชื่อ และ นามสกุล */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    ชื่อจริง <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="เช่น สมชาย"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {state?.fieldErrors?.firstName && (
                    <p className="text-[11px] text-red-400">{state.fieldErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    นามสกุล <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="เช่น ใจดี"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {state?.fieldErrors?.lastName && (
                    <p className="text-[11px] text-red-400">{state.fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* วันเกิด และ คำนวณอายุอัตโนมัติ */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">
                      วัน/เดือน/ปีเกิด <span className="text-fuchsia-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      required
                      value={birthDateInput}
                      onChange={(e) => setBirthDateInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0a18] border border-violet-950/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">อายุที่คำนวณได้:</span>
                    <span className="font-bold text-white text-sm">
                      {calculatedAge !== null ? `${calculatedAge} ปี` : "-"}
                    </span>
                  </div>
                </div>

                {/* เตือนผู้เยาว์ถ้าอายุ < 20 ปี (OI-05 / UR-2.5) */}
                {isMinor && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      <strong>แจ้งเตือนสถานะผู้เยาว์ (อายุ {calculatedAge} ปี):</strong> ตาม ป.พ.พ. ควรได้รับความยินยอมจากผู้ปกครองหรือมีผู้ปกครองร่วมลงนามตอนทำสัญญาเช่า
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. ข้อมูลการติดต่อ & LINE ID */}
            <div className="space-y-4 pt-4 border-t border-violet-950/60">
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                ข้อมูลการติดต่อและโซเชียล
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* เบอร์โทรศัพท์ (BR-14) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    เบอร์โทรศัพท์ (10 หลัก) <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={12}
                    placeholder="เช่น 0812345678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                  {state?.fieldErrors?.phone && (
                    <p className="text-[11px] text-red-400">{state.fieldErrors.phone}</p>
                  )}
                </div>

                {/* LINE ID (ใช้งานจริง) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    LINE ID (สำหรับส่งบิล)
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    placeholder="เช่น somchai_line"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* อีเมล */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">อีเมล (ถ้ามี)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="somchai@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* ที่อยู่ตามบัตร */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  ที่อยู่ตามบัตรประชาชน <span className="text-fuchsia-400">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="เช่น 123/45 หมู่ 2 ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                ></textarea>
                {state?.fieldErrors?.address && (
                  <p className="text-[11px] text-red-400">{state.fieldErrors.address}</p>
                )}
              </div>
            </div>

            {/* 3. ยานพาหนะ & ผู้พักอาศัยร่วม (Real-World Dormitory Features) */}
            <div className="space-y-4 pt-4 border-t border-violet-950/60">
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                ยานพาหนะและผู้พักอาศัยร่วม
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ยานพาหนะ / ทะเบียนรถ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    ยานพาหนะและทะเบียนรถ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="vehicleInfo"
                    placeholder="เช่น Honda Wave 110i ทะเบียน 1กข 1234 ชม."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-[11px] text-zinc-500">สำหรับจัดสติ๊กเกอร์ที่จอดรถและติดต่อกรณีฉุกเฉิน</p>
                </div>

                {/* ผู้พักอาศัยร่วม / รูมเมท */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    ผู้พักอาศัยร่วม / รูมเมท (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="coTenantName"
                    placeholder="เช่น สมศรี ใจดี (เพื่อนร่วมห้อง โทร 082-xxx-xxxx)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-[11px] text-zinc-500">ระบุชื่อและเบอร์โทรสำรองของผู้ร่วมพักอาศัย</p>
                </div>
              </div>
            </div>

            {/* 4. ผู้ติดต่อฉุกเฉิน */}
            <div className="space-y-4 pt-4 border-t border-violet-950/60">
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-fuchsia-400" />
                ข้อมูลผู้ติดต่อกรณีฉุกเฉิน (Emergency Contact)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="emergencyName"
                    required
                    placeholder="เช่น สมศรี ใจดี (มารดา)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {state?.fieldErrors?.emergencyName && (
                    <p className="text-[11px] text-red-400">{state.fieldErrors.emergencyName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    required
                    maxLength={12}
                    placeholder="เช่น 0899887766"
                    value={emergencyPhoneInput}
                    onChange={(e) => setEmergencyPhoneInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                  {state?.fieldErrors?.emergencyPhone && (
                    <p className="text-[11px] text-red-400">{state.fieldErrors.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: 2 ปุ่มรองรับ Workflow จริง */}
            <div className="pt-6 border-t border-violet-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                href="/tenants"
                className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors text-center"
              >
                ยกเลิก
              </Link>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* ปุ่มที่ 1: บันทึกข้อมูลปกติ */}
                <button
                  type="submit"
                  name="_action"
                  value="save"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-200 text-xs font-bold border border-violet-800/40 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลผู้เช่า"}
                </button>

                {/* ปุ่มที่ 2: บันทึกและไปทำสัญญาเช่าทันที */}
                <button
                  type="submit"
                  name="_action"
                  value="save_and_contract"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  {isPending ? "กำลังบันทึก..." : "บันทึกและไปทำสัญญาเช่าต่อ ⚡"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
