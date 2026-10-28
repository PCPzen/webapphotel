"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRoom, deleteRoom, FormState } from "@/actions/rooms";
import { Edit3, AlertCircle, Save, Trash2, Lock, ShieldAlert } from "lucide-react";

type Room = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
  status: "vacant" | "occupied" | "maintenance";
  note: string | null;
  activeContract?: {
    id: number;
    tenantName: string;
  } | null;
};

const initialState: FormState = {};

export default function EditRoomForm({ room }: { room: Room }) {
  const updateRoomWithId = updateRoom.bind(null, room.id);
  const [state, formAction, isPending] = useActionState(updateRoomWithId, initialState);

  const hasActiveContract = Boolean(room.activeContract);

  return (
    <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-violet-950/60">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">แก้ไขข้อมูลห้องพัก {room.roomNo}</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            ปรับปรุงรายละเอียด ประเภทห้อง อัตราค่าเช่ามาตรฐาน หรือสถานะการซ่อมบำรุง
          </p>
        </div>
      </div>

      <form action={formAction} className="p-6 md:p-8 space-y-6">
        {/* Error Message */}
        {state?.error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* BR-03 Active Contract Notice */}
        {hasActiveContract && (
          <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-700/40 text-violet-200 text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-white">
                ห้องนี้มีสัญญาเช่าที่กำลังใช้งานอยู่ (ผู้เช่า: {room.activeContract?.tenantName})
              </p>
              <p className="text-violet-300/80 text-[11px] mt-0.5">
                ตามกฎ BR-03 สถานะห้องจะถูกล็อกเป็น <strong>"มีผู้เช่า (occupied)"</strong> โดยอัตโนมัติ และจะกลับเป็นห้องว่างเมื่อบันทึกสิ้นสุดสัญญาเช่าเท่านั้น
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* หมายเลขห้อง */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">
              หมายเลขห้องพัก <span className="text-fuchsia-400">*</span>
            </label>
            <input
              type="text"
              name="roomNo"
              required
              defaultValue={room.roomNo}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* ชั้น */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">
              ชั้นที่ตั้ง (Floor) <span className="text-fuchsia-400">*</span>
            </label>
            <input
              type="number"
              name="floor"
              required
              min="0"
              max="50"
              defaultValue={room.floor}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* ประเภทห้องพัก */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">
              ประเภทห้องพัก <span className="text-fuchsia-400">*</span>
            </label>
            <select
              name="roomType"
              required
              defaultValue={room.roomType}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ห้องพัดลม">ห้องพัดลม</option>
              <option value="ห้องแอร์">ห้องแอร์</option>
              <option value="ห้องแอร์พิเศษ (VIP)">ห้องแอร์พิเศษ (VIP)</option>
            </select>
          </div>

          {/* อัตราค่าเช่ามาตรฐาน */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">
              ค่าเช่ามาตรฐาน (บาท/เดือน) <span className="text-fuchsia-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">
                ฿
              </span>
              <input
                type="number"
                name="baseRent"
                required
                step="0.01"
                min="1"
                defaultValue={room.baseRent}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              การปรับราคานี้ไม่มีผลย้อนหลังต่อสัญญาเช่าเดิมที่ทำไว้แล้ว
            </p>
          </div>
        </div>

        {/* สถานะห้องพัก (BR-03 Compliant) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">สถานะห้องพัก</label>
          {hasActiveContract ? (
            /* ถ้ามีสัญญา active: ล็อกสถานะ */
            <div>
              <input type="hidden" name="status" value="occupied" />
              <div className="px-4 py-2.5 rounded-xl bg-violet-950/30 border border-violet-800/40 text-sm text-violet-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  🟣 มีผู้เช่าอยู่ (Occupied)
                </span>
                <span className="text-xs text-violet-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> ล็อกตามสัญญาเช่า
                </span>
              </div>
            </div>
          ) : (
            /* ถ้าไม่มีสัญญา active: ให้เลือกได้เฉพาะ vacant หรือ maintenance */
            <select
              name="status"
              defaultValue={room.status}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="vacant">🟢 ว่าง (พร้อมให้เช่า)</option>
              <option value="maintenance">🟠 ปิดซ่อมบำรุง (ยังไม่พร้อมให้เช่า)</option>
            </select>
          )}
        </div>

        {/* หมายเหตุ */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300">หมายเหตุเพิ่มเติม</label>
          <textarea
            name="note"
            rows={3}
            defaultValue={room.note || ""}
            placeholder="เช่น ปรับปรุงทาสีใหม่, ติดผ้าม่านเพิ่ม..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-violet-950/60 flex items-center justify-end gap-3">
          <Link
            href={`/rooms/${room.id}`}
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

      {/* Danger Zone: ลบห้องพัก (BR-12 Compliant) */}
      <div className="p-6 bg-red-950/20 border-t border-red-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-red-500" /> จัดการลบห้องพัก (Danger Zone)
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            ลบห้องพักนี้ออกจากระบบ (ตามกฎ BR-12 จะลบได้เฉพาะห้องที่ยังไม่มีประวัติสัญญา, มิเตอร์ หรือแจ้งซ่อมเท่านั้น)
          </p>
        </div>
        <form
          action={async () => {
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบห้องพัก ${room.roomNo}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
              const res = await deleteRoom(room.id);
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
            <Trash2 className="w-3.5 h-3.5" /> ลบห้องพักนี้
          </button>
        </form>
      </div>
    </div>
  );
}
