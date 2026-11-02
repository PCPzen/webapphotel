"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createRoom, createRoomsBatch, FormState } from "@/actions/rooms";
import { 
  Building2, ArrowLeft, Plus, Layers, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck 
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { handleEmojiInput } from "@/lib/emoji";

export default function NewRoomPage() {
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [singleState, singleAction, isSinglePending] = useActionState<FormState, FormData>(createRoom, {});
  const [batchState, batchAction, isBatchPending] = useActionState<FormState, FormData>(createRoomsBatch, {});

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> กลับสู่ผังห้องพัก
        </Link>

        {/* Main Card */}
        <div className="bg-[#0b1120] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Card Header & Tab Switcher */}
          <div className="p-6 border-b border-slate-800 bg-[#080c15] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-sky-500 text-white rounded-2xl shadow-lg shadow-blue-900/40">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-white">
                  เพิ่มห้องพักใหม่ (Room Generator)
                </h1>
                <p className="text-xs text-slate-400">
                  รองรับทั้งการเพิ่มทีละห้อง และสร้างอัตโนมัติยกชั้น (BR-03)
                </p>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080c15] border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTab("single")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === "single"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มทีละห้อง</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("batch")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === "batch"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>สร้างยกชั้น</span>
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 md:p-8">
            {tab === "single" ? (
              /* TAB 1: เพิ่มห้องเดี่ยว */
              <form action={singleAction} className="space-y-6">
                {singleState?.error && (
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{singleState.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* หมายเลขห้อง */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      หมายเลขห้องพัก <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="roomNo"
                      required
                      placeholder="เช่น 101, 201, 305"
                      onInput={handleEmojiInput}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      กฎ BR-03: หมายเลขห้องต้องไม่ซ้ำกันในระบบ
                    </p>
                  </div>

                  {/* ชั้นที่ตั้ง */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ชั้นที่ตั้งห้องพัก <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="floor"
                      min={1}
                      max={99}
                      defaultValue={1}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-500">กำหนดตามโครงสร้างอาคารจริง</p>
                  </div>

                  {/* ประเภทห้องพัก */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ประเภทห้องพัก <span className="text-rose-400">*</span>
                    </label>
                    <select
                      name="roomType"
                      defaultValue="ห้องแอร์ (มาตรฐาน)"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ห้องแอร์ (มาตรฐาน)">ห้องแอร์ (มาตรฐาน)</option>
                      <option value="ห้องแอร์ (VIP)">ห้องแอร์ (VIP)</option>
                      <option value="ห้องพัดลม (มาตรฐาน)">ห้องพัดลม (มาตรฐาน)</option>
                      <option value="ห้องมุม (สตูดิโอ)">ห้องมุม (สตูดิโอ)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">สำหรับจัดหมวดหมู่และสิ่งอำนวยความสะดวก</p>
                  </div>

                  {/* ค่าเช่ามาตรฐานต่อเดือน */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ค่าเช่ามาตรฐานรายเดือน (บาท) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">฿</span>
                      <input
                        type="number"
                        name="baseRent"
                        min={1}
                        step="100"
                        defaultValue={3500}
                        required
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">ใช้เป็นค่าตั้งต้นตอนออกสัญญาเช่า</p>
                  </div>
                </div>

                {/* สถานะเริ่มต้น */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">สถานะเริ่มต้น</label>
                  <select
                    name="status"
                    defaultValue="vacant"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vacant">ว่าง (พร้อมให้เช่า)</option>
                    <option value="maintenance">ปิดซ่อมบำรุง (ยังไม่พร้อมให้เช่า)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    * สถานะ "มีผู้เช่า" จะเกิดขึ้นอัตโนมัติเมื่อทำสัญญาเช่าเท่านั้น ตามกฎ BR-03
                  </p>
                </div>

                {/* หมายเหตุ */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    name="note"
                    rows={3}
                    placeholder="เช่น ห้องมุม, วิวสวน, ติดบันได..."
                    onInput={handleEmojiInput}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <Link
                    href="/rooms"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    ยกเลิก
                  </Link>
                  <button
                    type="submit"
                    disabled={isSinglePending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {isSinglePending ? "กำลังบันทึกข้อมูล..." : "บันทึกห้องพักใหม่"}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: สร้างห้องยกชั้น (Batch Generator) */
              <form action={batchAction} className="space-y-6">
                <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    เครื่องมือสร้างห้องพักอัตโนมัติยกชั้น (Fast Batch Floor Setup)
                  </p>
                  <p className="text-slate-400">
                    ระบบจะสร้างชุดเลขห้องให้อัตโนมัติตามรูปแบบ <code>[ชั้น][ลำดับห้อง]</code> เช่น ชั้น 2 ห้อง 01 ถึง 10 จะได้ 201 - 210
                  </p>
                </div>

                {batchState?.error && (
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{batchState.error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* ชั้น */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ชั้นที่ต้องการสร้าง <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="floor"
                      min={1}
                      max={99}
                      defaultValue={2}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* เลขห้องเริ่มต้น */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ลำดับห้องเริ่มต้น <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="startNo"
                      min={1}
                      max={99}
                      defaultValue={1}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* เลขห้องสิ้นสุด */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ลำดับห้องสิ้นสุด <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="endNo"
                      min={1}
                      max={99}
                      defaultValue={10}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* จำนวนหลัก */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">รูปแบบตัวเลข</label>
                    <select
                      name="padDigits"
                      defaultValue="2"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2">2 หลัก (เช่น 201 - 210)</option>
                      <option value="1">1 หลัก (เช่น 21 - 29)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ประเภทห้อง */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ประเภทห้องพักสำหรับชั้นนี้
                    </label>
                    <select
                      name="roomType"
                      defaultValue="ห้องแอร์ (มาตรฐาน)"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ห้องแอร์ (มาตรฐาน)">ห้องแอร์ (มาตรฐาน)</option>
                      <option value="ห้องแอร์ (VIP)">ห้องแอร์ (VIP)</option>
                      <option value="ห้องพัดลม (มาตรฐาน)">ห้องพัดลม (มาตรฐาน)</option>
                      <option value="ห้องมุม (สตูดิโอ)">ห้องมุม (สตูดิโอ)</option>
                    </select>
                  </div>

                  {/* ค่าเช่า */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ค่าเช่ามาตรฐานต่อเดือน (บาท)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">฿</span>
                      <input
                        type="number"
                        name="baseRent"
                        min={1}
                        step="100"
                        defaultValue={3500}
                        required
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Batch Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <Link
                    href="/rooms"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    ยกเลิก
                  </Link>
                  <button
                    type="submit"
                    disabled={isBatchPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40 transition-all disabled:opacity-50"
                  >
                    <Layers className="w-4 h-4" />
                    {isBatchPending ? "กำลังสร้างห้องพักทั้งชั้น..." : "สร้างห้องพักยกชั้น"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
