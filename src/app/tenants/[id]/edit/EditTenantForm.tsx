"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateTenant, deleteTenant, TenantFormState } from "@/actions/tenants";
import { Edit3, AlertCircle, Save, Trash2, ShieldCheck, Phone } from "lucide-react";

type Tenant = {
  id: number;
  firstName: string;
  lastName: string;
  idCardNo: string;
  birthDate: string;
  phone: string;
  email: string | null;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
};

const initialState: TenantFormState = {};

export default function EditTenantForm({ tenant }: { tenant: Tenant }) {
  const updateTenantWithId = updateTenant.bind(null, tenant.id);
  const [state, formAction, isPending] = useActionState(updateTenantWithId, initialState);

  return (
    <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden space-y-0">
      <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-violet-950/60">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">
            แก้ไขข้อมูลผู้เช่า: {tenant.firstName} {tenant.lastName}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            ปรับปรุงเบอร์โทรศัพท์ ที่อยู่ หรือข้อมูลผู้ติดต่อกรณีฉุกเฉิน
          </p>
        </div>
      </div>

      <form action={formAction} className="p-6 md:p-8 space-y-6">
        {state?.error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* เลขบัตรประชาชน (ล็อกไม่ให้แก้ เพื่อความปลอดภัย) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-violet-400" /> เลขบัตรประจำตัวประชาชน (ไม่สามารถแก้ไขได้)
            </label>
            <input
              type="text"
              disabled
              value={tenant.idCardNo}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18]/60 border border-violet-950/60 text-sm text-zinc-400 font-mono cursor-not-allowed"
            />
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
                defaultValue={tenant.firstName}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                นามสกุล <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                required
                defaultValue={tenant.lastName}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* เบอร์โทรศัพท์ และ อีเมล */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                เบอร์โทรศัพท์ (10 หลัก) <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                maxLength={12}
                defaultValue={tenant.phone}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">อีเมล</label>
              <input
                type="email"
                name="email"
                defaultValue={tenant.email || ""}
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
              defaultValue={tenant.address}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            ></textarea>
          </div>

          {/* ข้อมูลฉุกเฉิน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                ผู้ติดต่อฉุกเฉิน <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="text"
                name="emergencyName"
                required
                defaultValue={tenant.emergencyName}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                เบอร์ติดต่อฉุกเฉิน <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                required
                maxLength={12}
                defaultValue={tenant.emergencyPhone}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-violet-950/60 flex items-center justify-end gap-3">
          <Link
            href={`/tenants/${tenant.id}`}
            className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </form>

      {/* Danger Zone: ลบข้อมูลผู้เช่า (ตามกฎ BR-12) */}
      <div className="p-6 bg-red-950/20 border-t border-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-red-500" /> ลบประวัติผู้เช่า (Danger Zone)
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            ตามกฎ BR-12 จะลบได้เฉพาะผู้เช่าที่ยังไม่เคยมีสัญญาเช่าหรือประวัติแจ้งซ่อมเท่านั้น
          </p>
        </div>
        <form
          action={async () => {
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติของ ${tenant.firstName} ${tenant.lastName}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
              const res = await deleteTenant(tenant.id);
              if (res?.error) {
                alert(res.error);
              }
            }
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> ลบผู้เช่านี้
          </button>
        </form>
      </div>
    </div>
  );
}
