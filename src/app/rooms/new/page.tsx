"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { createRoom, createRoomsBatch, FormState } from "@/actions/rooms";
import { ArrowLeft, Building2, Plus, AlertCircle, Save, Sparkles, Layers, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const initialState: FormState = {};

export default function NewRoomPage() {
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [singleState, singleFormAction, isSinglePending] = useActionState(createRoom, initialState);
  const [batchState, batchFormAction, isBatchPending] = useActionState(createRoomsBatch, initialState);

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้ารายการห้องพัก
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-violet-950/60 bg-[#16122d]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-violet-950/60">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">เพิ่มข้อมูลห้องพักใหม่</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  กำหนดหมายเลขห้อง ชั้น ประเภทห้อง และอัตราค่าเช่ามาตรฐาน
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0c0a18] border border-violet-950/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTab("single")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === "single"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ทีละ 1 ห้อง
              </button>
              <button
                type="button"
                onClick={() => setTab("batch")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === "batch"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="w-3 h-3 text-fuchsia-400" /> สร้างทั้งชั้น
              </button>
            </div>
          </div>

          {/* Form Content: Single Room Mode */}
          {tab === "single" ? (
            <form action={singleFormAction} className="p-6 md:p-8 space-y-6">
              {singleState?.error && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{singleState.error}</span>
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
                    placeholder="เช่น 101, 201, 305"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-[11px] text-zinc-500">หมายเลขประจำห้อง ห้ามซ้ำกับห้องอื่น</p>
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
                    defaultValue="1"
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
                    defaultValue="พัดลม"
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
                      placeholder="3500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">ใช้เป็นค่าตั้งต้นตอนออกสัญญาเช่า</p>
                </div>
              </div>

              {/* สถานะเริ่มต้น */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">สถานะเริ่มต้น</label>
                <select
                  name="status"
                  defaultValue="vacant"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="vacant">🟢 ว่าง (พร้อมให้เช่า)</option>
                  <option value="maintenance">🟠 ปิดซ่อมบำรุง (ยังไม่พร้อมให้เช่า)</option>
                </select>
                <p className="text-[11px] text-zinc-500">
                  * สถานะ "มีผู้เช่า" จะเกิดขึ้นอัตโนมัติเมื่อทำสัญญาเช่าเท่านั้น ตามกฎ BR-03
                </p>
              </div>

              {/* หมายเหตุ */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">หมายเหตุเพิ่มเติม</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="เช่น ห้องมุม, วิวสวน, ติดบันได..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-violet-950/60 flex items-center justify-end gap-3">
                <Link
                  href="/rooms"
                  className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors"
                >
                  ยกเลิก
                </Link>
                <button
                  type="submit"
                  disabled={isSinglePending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSinglePending ? "กำลังบันทึก..." : "บันทึกห้องพัก"}
                </button>
              </div>
            </form>
          ) : (
            /* Batch Mode: สร้างห้องทั้งชั้น */
            <form action={batchFormAction} className="p-6 md:p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/30 text-xs text-violet-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-white">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" /> ตัวช่วยสร้างห้องพักแบบชุด (Batch Generator)
                </p>
                <p className="text-zinc-400">
                  ระบบจะสร้างห้องพักตามช่วงลำดับ เช่น ชั้น 1 ลำดับ 1 ถึง 10 จะได้ห้อง: <strong>101, 102, 103 ... 110</strong> ให้โดยอัตโนมัติ
                </p>
              </div>

              {batchState?.error && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{batchState.error}</span>
                </div>
              )}

              {batchState?.success && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{batchState.message}</span>
                  </div>
                  <Link
                    href="/rooms"
                    className="font-bold underline text-white hover:text-emerald-200"
                  >
                    ดูผังห้องพัก &rarr;
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    ชั้นที่ต้องการสร้าง <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="floor"
                    required
                    min="0"
                    max="50"
                    defaultValue="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    เริ่มที่ห้องลำดับที่ <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="startNum"
                    required
                    min="1"
                    max="99"
                    defaultValue="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    ถึงห้องลำดับที่ <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="endNum"
                    required
                    min="1"
                    max="99"
                    defaultValue="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">ประเภทห้องพักทั้งชุด</label>
                  <select
                    name="roomType"
                    required
                    defaultValue="ห้องพัดลม"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="ห้องพัดลม">ห้องพัดลม</option>
                    <option value="ห้องแอร์">ห้องแอร์</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">ค่าเช่ามาตรฐาน (บาท/เดือน)</label>
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
                      defaultValue="3500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-violet-950/60 flex items-center justify-end gap-3">
                <Link
                  href="/rooms"
                  className="px-5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700/40 transition-colors"
                >
                  กลับหน้ารายการ
                </Link>
                <button
                  type="submit"
                  disabled={isBatchPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isBatchPending ? "กำลังสร้างห้องพัก..." : "สร้างห้องพักทั้งชุด"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
