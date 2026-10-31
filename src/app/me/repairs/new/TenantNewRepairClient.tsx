"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  ArrowLeft,
  Building2,
  AlertTriangle,
  Zap,
  Droplet,
  Wind,
  Home,
  Camera,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { createRepairRequest } from "@/actions/repairs";

export default function TenantNewRepairClient({
  tenantId,
  roomId,
  roomNo,
  floor,
}: {
  tenantId: number;
  roomId: number;
  roomNo: string;
  floor: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"electric" | "plumbing" | "aircon" | "furniture" | "other">("electric");
  const [priority, setPriority] = useState<"low" | "normal" | "urgent">("normal");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("กรุณาระบุหัวข้องานแจ้งซ่อม");
      return;
    }
    if (!description.trim()) {
      setError("กรุณาระบุรายละเอียดของปัญหา");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("roomId", roomId.toString());
      fd.append("tenantId", tenantId.toString());
      fd.append("title", title.trim());
      fd.append("category", category);
      fd.append("priority", priority);
      fd.append("description", description.trim());
      if (imageUrl.trim()) {
        fd.append("imageUrl", imageUrl.trim());
      }

      try {
        const res = await createRepairRequest({}, fd);
        if (res?.error) {
          setError(res.error);
        } else {
          router.push(`/me/repairs?tenantId=${tenantId}`);
        }
      } catch (err: any) {
        // Next.js redirect may throw an internal navigation error, which is expected
        if (err?.message?.includes("NEXT_REDIRECT")) {
          router.push(`/me/repairs?tenantId=${tenantId}`);
          return;
        }
        router.push(`/me/repairs?tenantId=${tenantId}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/me/repairs?tenantId=${tenantId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการแจ้งซ่อม
        </Link>
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">แจ้งซ่อมบำรุงห้องพัก</h1>
              <p className="text-xs text-slate-400">
                ส่งคำขอแจ้งซ่อมถึงฝ่ายช่างและนิติบุคคลของหอพัก
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 text-xs font-semibold border border-violet-500/20">
              ห้อง {roomNo} (ชั้น {floor})
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              หัวข้องานแจ้งซ่อม <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แอร์ไม่เย็น มีน้ำหยด, ก๊อกน้ำอ่างล้างหน้ารั่ว"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">หมวดหมู่งานซ่อม</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="electric" className="bg-[#16122d]">⚡ ระบบไฟฟ้า / หลอดไฟ</option>
                <option value="plumbing" className="bg-[#16122d]">🚿 ประปา / สุขภัณฑ์</option>
                <option value="aircon" className="bg-[#16122d]">❄️ เครื่องปรับอากาศ</option>
                <option value="furniture" className="bg-[#16122d]">🪑 เฟอร์นิเจอร์ / ประตูหน้าต่าง</option>
                <option value="other" className="bg-[#16122d]">🔧 อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">ระดับความเร่งด่วน</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="normal" className="bg-[#16122d]">ปกติ (ภายใน 1-2 วัน)</option>
                <option value="urgent" className="bg-[#16122d]">ด่วนมาก 🚨 (ท่อน้ำแตก / ไฟฟ้าลัดวงจร)</option>
                <option value="low" className="bg-[#16122d]">ไม่ด่วน (สะดวกวันไหนก็ได้)</option>
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              รายละเอียดของปัญหา <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุอาการ ตำแหน่งที่พบปัญหา หรือช่วงเวลาที่สะดวกให้ช่างเข้าตรวจสอบ..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500 leading-relaxed"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              ลิงก์รูปภาพประกอบปัญหา (ถ้ามี)
            </label>
            <div className="relative">
              <Camera className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
            <Link
              href={`/me/repairs?tenantId=${tenantId}`}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังส่งเรื่อง...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" /> ส่งคำขอแจ้งซ่อม
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
