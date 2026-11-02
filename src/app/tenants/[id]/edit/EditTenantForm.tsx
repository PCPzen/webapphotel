"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateTenant, deleteTenant, TenantFormState } from "@/actions/tenants";
import { Edit3, AlertCircle, Save, Trash2, ShieldCheck, Phone, Mail, MapPin, Car, Users, User } from "lucide-react";
import { handleEmojiInput } from "@/lib/emoji";

type Tenant = {
  id: number;
  firstName: string;
  lastName: string;
  idCardNo: string;
  phone: string;
  email: string | null;
  lineId?: string | null;
  vehicleInfo?: string | null;
  coTenantName?: string | null;
  birthDate: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  hasActiveContract: boolean;
};

const initialState: TenantFormState = {};

export default function EditTenantForm({ tenant }: { tenant: Tenant }) {
  const updateTenantWithId = updateTenant.bind(null, tenant.id);
  const [state, formAction, isPending] = useActionState(updateTenantWithId, initialState);

  return (
    <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
      <div className="p-6 border-b border-slate-800 bg-[#080c15] flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-sky-500 text-white rounded-2xl shadow-lg shadow-blue-900/40">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">
            แก้ไขข้อมูลผู้เช่า: {tenant.firstName} {tenant.lastName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ปรับปรุงเบอร์โทรศัพท์ ที่อยู่ ช่องทาง LINE และข้อมูลติดต่อฉุกเฉิน
          </p>
        </div>
      </div>

      <form action={formAction} className="p-6 md:p-8 space-y-5">
        {state?.error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Read-only Thai ID (Cannot edit per legal & security standards) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> เลขบัตรประจำตัวประชาชน (ไม่สามารถแก้ไขได้)
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={tenant.idCardNo}
            className="w-full px-4 py-2.5 rounded-xl bg-[#080c15]/60 border border-slate-800 text-sm text-slate-400 font-mono cursor-not-allowed"
          />
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              ชื่อจริง <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              defaultValue={tenant.firstName}
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              นามสกุล <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              defaultValue={tenant.lastName}
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Phone, LINE, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              เบอร์โทรศัพท์ (10 หลัก) <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              maxLength={12}
              defaultValue={tenant.phone}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">LINE ID</label>
            <input
              type="text"
              name="lineId"
              defaultValue={tenant.lineId || ""}
              placeholder="LINE ID"
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">อีเมล</label>
            <input
              type="email"
              name="email"
              defaultValue={tenant.email || ""}
              placeholder="email@example.com"
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Vehicle & Roommate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" /> ยานพาหนะ / ทะเบียนรถ
            </label>
            <input
              type="text"
              name="vehicleInfo"
              defaultValue={tenant.vehicleInfo || ""}
              placeholder="เช่น Honda Wave 110i ทะเบียน 1กข 1234"
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" /> ผู้ร่วมพักอาศัย / รูมเมท
            </label>
            <input
              type="text"
              name="coTenantName"
              defaultValue={tenant.coTenantName || ""}
              placeholder="ชื่อและเบอร์โทรของผู้พักร่วม"
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">
            ที่อยู่ตามบัตรประชาชน <span className="text-rose-400">*</span>
          </label>
          <textarea
            name="address"
            required
            rows={2}
            defaultValue={tenant.address}
            onInput={handleEmojiInput}
            className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              ผู้ติดต่อฉุกเฉิน <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="emergencyName"
              required
              defaultValue={tenant.emergencyName}
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              เบอร์ติดต่อฉุกเฉิน <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              name="emergencyPhone"
              required
              maxLength={12}
              defaultValue={tenant.emergencyPhone}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            href={`/tenants/${tenant.id}`}
            className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </form>

      {/* Danger Zone: ลบข้อมูลผู้เช่า */}
      <div className="p-6 bg-rose-950/20 border-t border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-500" /> จัดการลบประวัติผู้เช่า (Danger Zone)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {tenant.hasActiveContract
              ? "ผู้เช่ารายนี้มีสัญญาเช่าที่กำลังใช้งานอยู่ ไม่สามารถลบได้ตามกฎความปลอดภัย"
              : "ลบประวัติผู้เช่าออกจากระบบ (ลบได้เฉพาะผู้ที่ไม่มีประวัติสัญญาหรือหนี้ค้างชำระ)"}
          </p>
        </div>
        {!tenant.hasActiveContract && (
          <form
            action={async () => {
              if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติผู้เช่า ${tenant.firstName} ${tenant.lastName}?`)) {
                const res = await deleteTenant(tenant.id);
                if (res?.error) {
                  alert(res.error);
                }
              }
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบผู้เช่ารายนี้
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
