"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  Wrench,
  Building2,
  User,
  AlertCircle,
  Save,
  Sparkles,
  Zap,
  Droplet,
  Wind,
  Home,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { createRepairRequest, RepairFormState } from "@/actions/repairs";

type RoomOption = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  tenantId?: number | null;
  tenantName?: string | null;
};

export default function NewRepairForm({
  rooms,
  preselectedRoomId,
}: {
  rooms: RoomOption[];
  preselectedRoomId?: number;
}) {
  const [state, formAction, isPending] = useActionState<RepairFormState, FormData>(
    createRepairRequest,
    {}
  );

  const [selectedRoomId, setSelectedRoomId] = useState<number>(
    preselectedRoomId || (rooms[0]?.id || 0)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("plumbing");
  const [selectedPriority, setSelectedPriority] = useState<string>("normal");

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  const categories = [
    { id: "plumbing", label: "ประปา / สุขภัณฑ์", icon: "🚿", desc: "ท่อรั่ว ก๊อกน้ำ ชักโครกตัน" },
    { id: "electric", label: "ระบบไฟฟ้า / แสงสว่าง", icon: "⚡", desc: "หลอดไฟ เบรกเกอร์ ปลั๊กไฟ" },
    { id: "aircon", label: "เครื่องปรับอากาศ", icon: "❄️", desc: "แอร์ไม่เย็น น้ำหยด เสียงดัง" },
    { id: "furniture", label: "เฟอร์นิเจอร์ / ประตู", icon: "🪑", desc: "ลูกบิด ตู้ เตียง บานพับ" },
    { id: "other", label: "อื่น ๆ", icon: "🔧", desc: "งานซ่อมบำรุงทั่วไป" },
  ];

  return (
    <form
      action={formAction}
      className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-amber-600 via-orange-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-amber-950/50">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">แจ้งซ่อมแซมและบำรุงรักษา</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            บันทึกคำขอแจ้งซ่อมสำหรับผู้เช่า หรือเจ้าหน้าที่แจ้งแทน (User Requirement 2.21 / 4.21)
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

        {/* 1. เลือกห้องพักและผู้เช่า */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-violet-400" />
              ห้องพักที่พบปัญหา <span className="text-fuchsia-400">*</span>
            </span>
            {currentRoom?.tenantName && (
              <span className="text-xs text-emerald-400 font-normal">
                ผู้เช่า: คุณ {currentRoom.tenantName}
              </span>
            )}
          </label>

          <select
            name="roomId"
            required
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                ห้อง {r.roomNo} (ชั้น {r.floor} • {r.roomType})
                {r.tenantName ? ` - ผู้เช่า: ${r.tenantName}` : " [ห้องว่าง]"}
              </option>
            ))}
          </select>
          <input
            type="hidden"
            name="tenantId"
            value={currentRoom?.tenantId ? currentRoom.tenantId.toString() : ""}
          />
        </div>

        {/* 2. หมวดหมู่งานซ่อม (Category Cards) */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-zinc-300">
            หมวดหมู่งานซ่อม <span className="text-fuchsia-400">*</span>
          </label>
          <input type="hidden" name="category" value={selectedCategory} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-violet-950/60 border-violet-500 shadow-md ring-1 ring-violet-400/50"
                      : "bg-[#0c0a18] border-violet-950/60 hover:border-violet-800/80 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="text-xl block mb-1">{c.icon}</span>
                  <span className="text-xs font-bold text-white block truncate">{c.label}</span>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{c.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ระดับความเร่งด่วน (Priority) */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-zinc-300">
            ระดับความเร่งด่วน <span className="text-fuchsia-400">*</span>
          </label>
          <input type="hidden" name="priority" value={selectedPriority} />

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPriority("normal")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "normal"
                  ? "bg-violet-950/60 border-violet-500 text-violet-300 font-bold ring-1 ring-violet-500/50"
                  : "bg-[#0c0a18] border-violet-950/60 text-zinc-400 hover:text-white"
              }`}
            >
              <span className="block text-xs font-bold">ปกติ</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">ดำเนินการภายใน 1-2 วัน</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriority("urgent")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "urgent"
                  ? "bg-red-950/60 border-red-500 text-red-300 font-bold ring-1 ring-red-500/50"
                  : "bg-[#0c0a18] border-violet-950/60 text-zinc-400 hover:text-red-300"
              }`}
            >
              <span className="block text-xs font-bold">ด่วนมาก 🚨</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">ท่อแตก ไฟดับ ไฟช็อต</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriority("low")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "low"
                  ? "bg-zinc-800 border-zinc-500 text-zinc-200 font-bold"
                  : "bg-[#0c0a18] border-violet-950/60 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="block text-xs font-bold">ไม่ด่วน</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">ซ่อมบำรุงตามรอบ</span>
            </button>
          </div>
        </div>

        {/* 4. หัวข้อและรายละเอียดงานซ่อม */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              หัวข้องานแจ้งซ่อม <span className="text-fuchsia-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              maxLength={120}
              placeholder="เช่น ก๊อกน้ำอ่างล้างหน้ารั่วซึม, แอร์ไม่เย็นมีลมร้อนออก..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
            />
            {state?.fieldErrors?.title && (
              <p className="text-[11px] text-red-400">{state.fieldErrors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              รายละเอียดของปัญหา <span className="text-fuchsia-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="ระบุอาการ ตำแหน่งของอุปกรณ์ที่เสีย และช่วงเวลาที่สะดวกให้ช่างเข้าตรวจดู..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed"
            ></textarea>
            {state?.fieldErrors?.description && (
              <p className="text-[11px] text-red-400">{state.fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
              ลิงก์รูปภาพประกอบ (URL รูปภาพ ถ้ามี)
            </label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-[10px] text-zinc-500">
              แนบภาพความเสียหายเพื่อให้ช่างเตรียมอุปกรณ์และอะไหล่ได้ตรงจุด
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-violet-950/60 flex items-center justify-end gap-3">
          <Link
            href="/repairs"
            className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending || rooms.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white text-xs font-black shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/40 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึกแจ้งซ่อม..." : "ส่งคำขอแจ้งซ่อม (Open)"}
          </button>
        </div>
      </div>
    </form>
  );
}
