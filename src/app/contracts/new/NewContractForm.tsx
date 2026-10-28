"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import { createContract, ContractFormState } from "@/actions/contracts";
import {
  FileText,
  Building2,
  User,
  Calendar,
  Save,
  AlertCircle,
  Sparkles,
  Users,
  Car,
  Clock,
  ShieldAlert,
  Gauge,
  Key,
  CreditCard,
} from "lucide-react";

type VacantRoom = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
};

type TenantOption = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  coTenantName?: string | null;
  vehicleInfo?: string | null;
};

type Settings = {
  defaultWaterRate: number;
  defaultElectricRate: number;
  defaultLateFee: number;
  defaultDueDay: number;
};

const initialState: ContractFormState = {};

export default function NewContractForm({
  vacantRooms,
  tenants,
  defaultSettings,
  preselectedRoomId,
  preselectedTenantId,
}: {
  vacantRooms: VacantRoom[];
  tenants: TenantOption[];
  defaultSettings: Settings;
  preselectedRoomId?: number;
  preselectedTenantId?: number;
}) {
  const [state, formAction, isPending] = useActionState(createContract, initialState);

  // Selected state
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    preselectedRoomId ? preselectedRoomId.toString() : vacantRooms[0]?.id.toString() || ""
  );
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    preselectedTenantId ? preselectedTenantId.toString() : tenants[0]?.id.toString() || ""
  );

  // Dates state
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);

  // Default +1 year
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const [endDate, setEndDate] = useState(oneYearLater.toISOString().split("T")[0]);

  // Pricing state
  const selectedRoom = vacantRooms.find((r) => r.id.toString() === selectedRoomId);
  const selectedTenant = tenants.find((t) => t.id.toString() === selectedTenantId);

  const [monthlyRent, setMonthlyRent] = useState<number>(selectedRoom?.baseRent || 3500);
  const [deposit, setDeposit] = useState<number>(selectedRoom?.baseRent || 3500);

  // When room changes, auto update rent & recommended deposit
  useEffect(() => {
    if (selectedRoom) {
      setMonthlyRent(selectedRoom.baseRent);
      setDeposit(selectedRoom.baseRent); // ปกติมัดจำ 1 เดือน
    }
  }, [selectedRoomId]);

  // Date helper buttons
  const setDurationMonths = (months: number) => {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  return (
    <form action={formAction} className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-violet-950/60">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">เปิดสัญญาเช่าห้องพักใหม่</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            จับคู่ห้องพักว่างกับผู้เช่า กำหนดระยะเวลา อัตราค่าเช่า และเงินมัดจำ (BR-02 & BR-03)
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Error Alert */}
        {state?.error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-bold">{state.error}</span>
          </div>
        )}

        {/* 1. เลือกห้องพัก และ ผู้เช่าหลัก */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* เลือกห้องพักว่าง */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-400" />
                เลือกห้องพัก (เฉพาะห้องว่าง) <span className="text-fuchsia-400">*</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-400">
                ว่าง {vacantRooms.length} ห้อง
              </span>
            </label>

            {vacantRooms.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-300 text-xs">
                ไม่มีห้องว่างในระบบ กรุณาเพิ่มห้องพักใหม่หรือรอห้องย้ายออก
              </div>
            ) : (
              <select
                name="roomId"
                required
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
              >
                {vacantRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    ห้อง {r.roomNo} (ชั้น {r.floor} • {r.roomType} • ฿{r.baseRent.toLocaleString()}/ด.)
                  </option>
                ))}
              </select>
            )}
            {state?.fieldErrors?.roomId && (
              <p className="text-[11px] text-red-400">{state.fieldErrors.roomId}</p>
            )}
          </div>

          {/* เลือกผู้เช่าหลัก */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-400" />
                เลือกผู้เช่าหลัก <span className="text-fuchsia-400">*</span>
              </label>
              <Link
                href="/tenants/new"
                className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold underline"
              >
                + ลงทะเบียนคนใหม่
              </Link>
            </div>

            {tenants.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-300 text-xs">
                ยังไม่มีข้อมูลผู้เช่าในระบบ กรุณาลงทะเบียนผู้เช่าก่อน
              </div>
            ) : (
              <select
                name="tenantId"
                required
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    คุณ {t.firstName} {t.lastName} (โทร: {t.phone})
                  </option>
                ))}
              </select>
            )}
            {state?.fieldErrors?.tenantId && (
              <p className="text-[11px] text-red-400">{state.fieldErrors.tenantId}</p>
            )}
          </div>
        </div>

        {/* แสดงข้อมูลรูมเมท และ ยานพาหนะ ของผู้เช่าที่เลือก (ถ้ามี) */}
        {selectedTenant && (selectedTenant.coTenantName || selectedTenant.vehicleInfo) && (
          <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/40 text-xs space-y-1.5">
            <p className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> ข้อมูลเพิ่มเติมของผู้เช่าคนนี้ (ที่บันทึกไว้):
            </p>
            <div className="flex flex-wrap items-center gap-4 text-zinc-300 pt-0.5">
              {selectedTenant.coTenantName && (
                <span className="flex items-center gap-1.5 bg-[#0c0a18] px-2.5 py-1 rounded-lg border border-violet-950">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <strong>รูมเมท:</strong> {selectedTenant.coTenantName}
                </span>
              )}
              {selectedTenant.vehicleInfo && (
                <span className="flex items-center gap-1.5 bg-[#0c0a18] px-2.5 py-1 rounded-lg border border-violet-950">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <strong>ยานพาหนะ:</strong> {selectedTenant.vehicleInfo}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 2. ระยะเวลาสัญญา */}
        <div className="space-y-3 pt-3 border-t border-violet-950/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-fuchsia-400" />
              ระยะเวลาสัญญาเช่า
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">ทางลัด:</span>
              <button
                type="button"
                onClick={() => setDurationMonths(6)}
                className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-[11px] font-bold border border-violet-800/30 transition-colors"
              >
                +6 เดือน
              </button>
              <button
                type="button"
                onClick={() => setDurationMonths(12)}
                className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-[11px] font-bold border border-violet-800/30 transition-colors"
              >
                +1 ปี
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                วันเริ่มต้นสัญญา <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {state?.fieldErrors?.startDate && (
                <p className="text-[11px] text-red-400">{state.fieldErrors.startDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                วันสิ้นสุดสัญญา <span className="text-fuchsia-400">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {state?.fieldErrors?.endDate && (
                <p className="text-[11px] text-red-400">{state.fieldErrors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* 3. รายการเงินและเงื่อนไข (ค่าเช่า, เงินมัดจำ, ค่าน้ำไฟ, ค่าปรับ) */}
        <div className="space-y-4 pt-3 border-t border-violet-950/60">
          <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            อัตราค่าเช่า เงินมัดจำ และกำหนดชำระ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ค่าเช่ารายเดือน */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                ค่าเช่าห้องพัก (บาท/เดือน) <span className="text-fuchsia-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                  ฿
                </span>
                <input
                  type="number"
                  name="monthlyRent"
                  required
                  step="0.01"
                  min="1"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500">ดึงค่าตั้งต้นจากประเภทห้องพักให้อัตโนมัติ</p>
            </div>

            {/* เงินประกัน / มัดจำ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                เงินมัดจำ/เงินประกัน (บาท) <span className="text-fuchsia-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                  ฿
                </span>
                <input
                  type="number"
                  name="deposit"
                  required
                  step="0.01"
                  min="0"
                  value={deposit}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500">ใช้หักค่าเสียหายและคืนเมื่อสิ้นสุดสัญญา (BR-10)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* อัตราค่าน้ำ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">ค่าน้ำ (บาท/หน่วย)</label>
              <input
                type="number"
                name="waterRate"
                required
                step="0.01"
                min="0"
                defaultValue={defaultSettings.defaultWaterRate}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* อัตราค่าไฟ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">ค่าไฟ (บาท/หน่วย)</label>
              <input
                type="number"
                name="electricRate"
                required
                step="0.01"
                min="0"
                defaultValue={defaultSettings.defaultElectricRate}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* ค่าปรับล่าช้า */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">ค่าปรับล่าช้า (บิล)</label>
              <input
                type="number"
                name="lateFee"
                required
                step="0.01"
                min="0"
                defaultValue={defaultSettings.defaultLateFee}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* กำหนดชำระประจำเดือน */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">ชำระทุกวันที่ (1-28)</label>
              <input
                type="number"
                name="dueDay"
                required
                min="1"
                max="28"
                defaultValue={defaultSettings.defaultDueDay}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* 4. ตรวจรับห้องพักและมิเตอร์เริ่มต้น (Check-in Checklist) */}
        <div className="space-y-4 pt-3 border-t border-violet-950/60">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              ตรวจรับห้องพักและเลขมิเตอร์เริ่มต้น ณ วันเข้าอยู่
            </h3>
            <span className="text-[11px] text-zinc-500">
              ใช้สำหรับคิดค่าน้ำ-ไฟงวดแรกและตรวจสอบตอนย้ายออก
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-[#0d0a1c] border border-violet-950/70">
            {/* มิเตอร์น้ำเริ่มต้น */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                เลขมิเตอร์น้ำเริ่มต้น (หน่วย)
              </label>
              <input
                type="number"
                name="startWaterMeter"
                required
                min="0"
                defaultValue={0}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090714] border border-violet-950/80 text-sm text-cyan-300 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-zinc-500">จดจากมาตรวัดน้ำหน้าห้อง ณ วันส่งมอบ</p>
            </div>

            {/* มิเตอร์ไฟเริ่มต้น */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                เลขมิเตอร์ไฟฟ้าเริ่มต้น (หน่วย)
              </label>
              <input
                type="number"
                name="startElectricMeter"
                required
                min="0"
                defaultValue={0}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090714] border border-violet-950/80 text-sm text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-zinc-500">จดจากมาตรวัดไฟฟ้าหน้าห้อง ณ วันส่งมอบ</p>
            </div>

            {/* จำนวนกุญแจห้อง */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-violet-400" />
                จำนวนกุญแจห้องที่ส่งมอบ (ดอก)
              </label>
              <input
                type="number"
                name="keyCount"
                required
                min="1"
                defaultValue={1}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090714] border border-violet-950/80 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* จำนวนคีย์การ์ด */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-fuchsia-400" />
                จำนวนคีย์การ์ด / เหรียญสแกน (ใบ)
              </label>
              <input
                type="number"
                name="keyCardCount"
                required
                min="0"
                defaultValue={0}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090714] border border-violet-950/80 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-violet-950/60 flex items-center justify-end gap-3">
          <Link
            href="/contracts"
            className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending || vacantRooms.length === 0 || tenants.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึกและล็อกห้องพัก..." : "บันทึกและเปิดสัญญาเช่า"}
          </button>
        </div>
      </div>
    </form>
  );
}
