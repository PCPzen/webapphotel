"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  Wrench,
  Building2,
  AlertCircle,
  Save,
  Zap,
  Droplet,
  Wind,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { createRepairRequest, RepairFormState } from "@/actions/repairs";
import { handleEmojiInput } from "@/lib/emoji";

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
    { id: "plumbing", label: "ประปา / สุขภัณฑ์", icon: Droplet, desc: "ท่อรั่ว ก๊อกน้ำ ชักโครกตัน" },
    { id: "electric", label: "ระบบไฟฟ้า / แสงสว่าง", icon: Zap, desc: "หลอดไฟ เบรกเกอร์ ปลั๊กไฟ" },
    { id: "aircon", label: "เครื่องปรับอากาศ", icon: Wind, desc: "แอร์ไม่เย็น น้ำหยด เสียงดัง" },
    { id: "furniture", label: "เฟอร์นิเจอร์ / ประตู", icon: Home, desc: "ลูกบิด ตู้ เตียง บานพับ" },
    { id: "other", label: "อื่น ๆ", icon: Wrench, desc: "งานซ่อมบำรุงทั่วไป" },
  ];

  return (
    <form
      action={formAction}
      className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex items-center gap-3.5">
        <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-950/50">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">แจ้งซ่อมแซมและบำรุงรักษา</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            บันทึกคำขอแจ้งซ่อมสำหรับผู้เช่า หรือเจ้าหน้าที่แจ้งแทน
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Error Alert */}
        {state?.error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-bold">{state.error}</span>
          </div>
        )}

        {/* 1. เลือกห้องพักและผู้เช่า */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              ห้องพักที่พบปัญหา <span className="text-rose-400">*</span>
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
            className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id} className="bg-[#0b1120] text-white">
                ห้อง {r.roomNo} (ชั้น {r.floor} - {r.roomType})
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
          <label className="text-xs font-bold text-slate-300">
            หมวดหมู่งานซ่อม <span className="text-rose-400">*</span>
          </label>
          <input type="hidden" name="category" value={selectedCategory} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              const IconComp = c.icon;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500 shadow-md ring-1 ring-blue-500/50"
                      : "bg-[#080c15] border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                >
                  <IconComp className={`w-5 h-5 mb-2 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-white block truncate">{c.label}</span>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">{c.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ระดับความเร่งด่วน (Priority) */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-300">
            ระดับความเร่งด่วน <span className="text-rose-400">*</span>
          </label>
          <input type="hidden" name="priority" value={selectedPriority} />

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPriority("normal")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "normal"
                  ? "bg-blue-600/15 border-blue-500 text-blue-300 font-bold ring-1 ring-blue-500/50"
                  : "bg-[#080c15] border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span className="block text-xs font-bold">ปกติ</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ดำเนินการภายใน 1-2 วัน</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriority("urgent")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "urgent"
                  ? "bg-rose-500/15 border-rose-500 text-rose-300 font-bold ring-1 ring-rose-500/50"
                  : "bg-[#080c15] border-slate-800 text-slate-400 hover:text-rose-300"
              }`}
            >
              <span className="block text-xs font-bold">ด่วนมาก</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ท่อแตก ไฟดับ ไฟช็อต</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPriority("low")}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPriority === "low"
                  ? "bg-slate-800 border-slate-600 text-slate-200 font-bold"
                  : "bg-[#080c15] border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="block text-xs font-bold">ไม่ด่วน</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ซ่อมบำรุงตามรอบ</span>
            </button>
          </div>
        </div>

        {/* 4. หัวข้อและรายละเอียดงานซ่อม */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              หัวข้องานแจ้งซ่อม <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              maxLength={120}
              onInput={handleEmojiInput}
              placeholder="เช่น ก๊อกน้ำอ่างล้างหน้ารั่วซึม, แอร์ไม่เย็นมีลมร้อนออก..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {state?.fieldErrors?.title && (
              <p className="text-[11px] text-rose-400">{state.fieldErrors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              รายละเอียดของปัญหา <span className="text-rose-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              onInput={handleEmojiInput}
              placeholder="ระบุอาการ ตำแหน่งของอุปกรณ์ที่เสีย และช่วงเวลาที่สะดวกให้ช่างเข้าตรวจดู..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            ></textarea>
            {state?.fieldErrors?.description && (
              <p className="text-[11px] text-rose-400">{state.fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              ลิงก์รูปภาพประกอบ (URL รูปภาพ ถ้ามี)
            </label>
            <input
              type="url"
              name="imageUrl"
              onInput={handleEmojiInput}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400">
              แนบภาพความเสียหายเพื่อให้ช่างเตรียมอุปกรณ์และอะไหล่ได้ตรงจุด
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            href="/repairs"
            className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending || rooms.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-950/50 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "กำลังบันทึกแจ้งซ่อม..." : "ส่งคำขอแจ้งซ่อม (Open)"}
          </button>
        </div>
      </div>
    </form>
  );
}
