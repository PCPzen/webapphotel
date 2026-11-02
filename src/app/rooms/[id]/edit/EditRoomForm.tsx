"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRoom, deleteRoom, FormState } from "@/actions/rooms";
import { Edit3, AlertCircle, Save, Trash2, Lock, ShieldAlert } from "lucide-react";
import { handleEmojiInput } from "@/lib/emoji";

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
    <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-[#080c15] flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-sky-500 text-white rounded-2xl shadow-lg shadow-blue-900/40">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">แก้ไขข้อมูลห้องพัก {room.roomNo}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ปรับปรุงรายละเอียด ประเภทห้อง อัตราค่าเช่ามาตรฐาน หรือสถานะการซ่อมบำรุง
          </p>
        </div>
      </div>

      <form action={formAction} className="p-6 md:p-8 space-y-6">
        {/* Error Message */}
        {state?.error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* BR-03 Active Contract Notice */}
        {hasActiveContract && (
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-white">
                ห้องนี้มีสัญญาเช่าที่กำลังใช้งานอยู่ (ผู้เช่า: {room.activeContract?.tenantName})
              </p>
              <p className="text-blue-300/80 text-[11px] mt-0.5">
                ตามกฎ BR-03 สถานะห้องจะถูกล็อกเป็น <strong>"มีผู้เช่า (occupied)"</strong> โดยอัตโนมัติ และจะกลับเป็นห้องว่างเมื่อบันทึกสิ้นสุดสัญญาเช่าเท่านั้น
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* หมายเลขห้อง */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              หมายเลขห้องพัก <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="roomNo"
              required
              defaultValue={room.roomNo}
              onInput={handleEmojiInput}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ชั้น */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              ชั้นที่ตั้ง (Floor) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              name="floor"
              required
              min="0"
              max="50"
              defaultValue={room.floor}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* ประเภทห้องพัก */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              ประเภทห้องพัก <span className="text-rose-400">*</span>
            </label>
            <select
              name="roomType"
              required
              defaultValue={room.roomType}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ห้องพัดลม">ห้องพัดลม</option>
              <option value="ห้องแอร์">ห้องแอร์</option>
              <option value="ห้องแอร์พิเศษ (VIP)">ห้องแอร์พิเศษ (VIP)</option>
            </select>
          </div>

          {/* อัตราค่าเช่ามาตรฐาน */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              ค่าเช่ามาตรฐาน (บาท/เดือน) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                ฿
              </span>
              <input
                type="number"
                name="baseRent"
                required
                step="0.01"
                min="1"
                defaultValue={room.baseRent}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              การปรับราคานี้ไม่มีผลย้อนหลังต่อสัญญาเช่าเดิมที่ทำไว้แล้ว
            </p>
          </div>
        </div>

        {/* สถานะห้องพัก (BR-03 Compliant) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">สถานะห้องพัก</label>
          {hasActiveContract ? (
            /* ถ้ามีสัญญา active: ล็อกสถานะ */
            <div>
              <input type="hidden" name="status" value="occupied" />
              <div className="px-4 py-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-sm text-blue-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  มีผู้เช่าอยู่ (Occupied)
                </span>
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> ล็อกตามสัญญาเช่า
                </span>
              </div>
            </div>
          ) : (
            /* ถ้าไม่มีสัญญา active: ให้เลือกได้เฉพาะ vacant หรือ maintenance */
            <select
              name="status"
              defaultValue={room.status}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vacant">ว่าง (พร้อมให้เช่า)</option>
              <option value="maintenance">ปิดซ่อมบำรุง (ยังไม่พร้อมให้เช่า)</option>
            </select>
          )}
        </div>

        {/* หมายเหตุ */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">หมายเหตุเพิ่มเติม</label>
          <textarea
            name="note"
            rows={3}
            defaultValue={room.note || ""}
            placeholder="เช่น ปรับปรุงทาสีใหม่, ติดผ้าม่านเพิ่ม..."
            onInput={handleEmojiInput}
            className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            href={`/rooms/${room.id}`}
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

      {/* Danger Zone: ลบห้องพัก (BR-12 Compliant) */}
      <div className="p-6 bg-rose-950/20 border-t border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-500" /> จัดการลบห้องพัก (Danger Zone)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> ลบห้องพักนี้
          </button>
        </form>
      </div>
    </div>
  );
}
