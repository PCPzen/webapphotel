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
import { handleEmojiInput } from "@/lib/emoji";

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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าทะเบียนผู้เช่า
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-[#080c15] flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-sky-500 text-white rounded-2xl shadow-lg shadow-blue-900/40">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">ลงทะเบียนประวัติผู้เช่าใหม่</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                บันทึกข้อมูลส่วนบุคคล ตรวจสอบเลขบัตร 13 หลัก (BR-01) ยานพาหนะ และช่องทางติดต่อ
              </p>
            </div>
          </div>

          <form action={formAction} className="p-6 md:p-8 space-y-6">
            {/* Global Error Banner */}
            {state?.error && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="font-bold">{state.error}</span>
                </div>
                {state.existingTenantId && (
                  <Link
                    href={`/tenants/${state.existingTenantId}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white font-bold underline ml-6"
                  >
                    คลิกที่นี่เพื่อไปดูข้อมูลผู้เช่าเดิมรายนี้ <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* 1. ส่วนข้อมูลบัตรประชาชนและชื่อ-นามสกุล */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                ข้อมูลประจำตัวผู้เช่า (ตามบัตรประชาชน)
              </h3>

              {/* ช่องเลขบัตรประชาชน 13 หลัก */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    เลขบัตรประจำตัวประชาชน 13 หลัก <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={fillSampleThaiId}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" /> ใส่เลขทดสอบตาม SRD (1234567890121)
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
                    className={`w-full px-4 py-2.5 rounded-xl bg-[#080c15] border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 font-mono ${
                      isThaiIdValid === true
                        ? "border-emerald-500/60 focus:ring-emerald-500/60"
                        : isThaiIdValid === false
                        ? "border-rose-500/60 focus:ring-rose-500/60"
                        : "border-slate-800 focus:ring-blue-500"
                    }`}
                  />
                  {isThaiIdValid === true && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center gap-1 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> ถูกต้อง (Modulo 11)
                    </span>
                  )}
                  {isThaiIdValid === false && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 flex items-center gap-1 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" /> Checksum ไม่ตรง
                    </span>
                  )}
                </div>

                {state?.fieldErrors?.idCardNo && (
                  <p className="text-[11px] text-rose-400">{state.fieldErrors.idCardNo}</p>
                )}
                <p className="text-[11px] text-slate-500">
                  ระบบจะตรวจสอบ Checksum ตามสูตรกฎ BR-01 ทันที และจะถูก Mask ปิดบังในหน้ารายการตาม PDPA
                </p>
              </div>

              {/* ชื่อ และ นามสกุล */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    ชื่อจริง <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="เช่น สมชาย"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {state?.fieldErrors?.firstName && (
                    <p className="text-[11px] text-rose-400">{state.fieldErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    นามสกุล <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="เช่น ใจดี"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {state?.fieldErrors?.lastName && (
                    <p className="text-[11px] text-rose-400">{state.fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* วันเกิด และ คำนวณอายุอัตโนมัติ */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      วัน/เดือน/ปีเกิด <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      required
                      value={birthDateInput}
                      onChange={(e) => setBirthDateInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#080c15] border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">อายุที่คำนวณได้:</span>
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
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                ข้อมูลการติดต่อและโซเชียล
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* เบอร์โทรศัพท์ (BR-14) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    เบอร์โทรศัพท์ (10 หลัก) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={12}
                    placeholder="เช่น 0812345678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  {state?.fieldErrors?.phone && (
                    <p className="text-[11px] text-rose-400">{state.fieldErrors.phone}</p>
                  )}
                </div>

                {/* LINE ID (ใช้งานจริง) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    LINE ID (สำหรับส่งบิล)
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    placeholder="เช่น somchai_line"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* อีเมล */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">อีเมล (ถ้ามี)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="somchai@example.com"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ที่อยู่ตามบัตร */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  ที่อยู่ตามบัตรประชาชน <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="เช่น 123/45 หมู่ 2 ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300"
                  onInput={handleEmojiInput}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                {state?.fieldErrors?.address && (
                  <p className="text-[11px] text-rose-400">{state.fieldErrors.address}</p>
                )}
              </div>
            </div>

            {/* 3. ยานพาหนะ & ผู้พักอาศัยร่วม */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                ยานพาหนะและผู้พักอาศัยร่วม
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ยานพาหนะ / ทะเบียนรถ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    ยานพาหนะและทะเบียนรถ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="vehicleInfo"
                    placeholder="เช่น Honda Wave 110i ทะเบียน 1กข 1234 ชม."
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">สำหรับจัดสติ๊กเกอร์ที่จอดรถและติดต่อกรณีฉุกเฉิน</p>
                </div>

                {/* ผู้พักอาศัยร่วม / รูมเมท */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    ผู้พักอาศัยร่วม / รูมเมท (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="coTenantName"
                    placeholder="เช่น สมศรี ใจดี (เพื่อนร่วมห้อง โทร 082-xxx-xxxx)"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">ระบุชื่อและเบอร์โทรสำรองของผู้ร่วมพักอาศัย</p>
                </div>
              </div>
            </div>

            {/* 4. ผู้ติดต่อฉุกเฉิน */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-sky-400" />
                ข้อมูลผู้ติดต่อกรณีฉุกเฉิน (Emergency Contact)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="emergencyName"
                    required
                    placeholder="เช่น สมศรี ใจดี (มารดา)"
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {state?.fieldErrors?.emergencyName && (
                    <p className="text-[11px] text-rose-400">{state.fieldErrors.emergencyName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    required
                    maxLength={12}
                    placeholder="เช่น 0899887766"
                    value={emergencyPhoneInput}
                    onChange={(e) => setEmergencyPhoneInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  {state?.fieldErrors?.emergencyPhone && (
                    <p className="text-[11px] text-rose-400">{state.fieldErrors.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: 2 ปุ่มรองรับ Workflow จริง */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                href="/tenants"
                className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors text-center"
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  {isPending ? "กำลังบันทึก..." : "บันทึกและไปทำสัญญาเช่าต่อ"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
