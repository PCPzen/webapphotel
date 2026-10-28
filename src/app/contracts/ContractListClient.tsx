"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";

type ContractItem = {
  id: number;
  roomId: number;
  roomNo: string;
  floor: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  coTenantName?: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: "active" | "ended" | "cancelled";
  isExpiringSoon: boolean;
  daysRemaining: number;
};

export default function ContractListClient({ initialContracts }: { initialContracts: ContractItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "ended">("all");

  const stats = useMemo(() => {
    const total = initialContracts.length;
    const active = initialContracts.filter((c) => c.status === "active").length;
    const expiring = initialContracts.filter((c) => c.status === "active" && c.isExpiringSoon).length;
    const ended = initialContracts.filter((c) => c.status === "ended").length;
    return { total, active, expiring, ended };
  }, [initialContracts]);

  const filteredContracts = useMemo(() => {
    return initialContracts.filter((contract) => {
      const q = search.toLowerCase().trim();
      const matchRoom = contract.roomNo.toLowerCase().includes(q);
      const matchTenant = contract.tenantName.toLowerCase().includes(q);
      const matchId = `ct-${contract.id}`.includes(q) || contract.id.toString().includes(q);

      const matchSearch = !q || matchRoom || matchTenant || matchId;

      if (!matchSearch) return false;

      if (statusFilter === "active") return contract.status === "active";
      if (statusFilter === "expiring") return contract.status === "active" && contract.isExpiringSoon;
      if (statusFilter === "ended") return contract.status === "ended";
      return true;
    });
  }, [initialContracts, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-950/60 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <FileText className="w-5 h-5" />
            </span>
            ระบบสัญญาเช่าห้องพัก (Contracts Management)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ทำสัญญาเช่าใหม่ ตรวจสอบสัญญาใกล้หมดอายุ และจัดการการสิ้นสุดสัญญาคืนเงินมัดจำ (BR-02 & BR-10)
          </p>
        </div>

        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          ทำสัญญาเช่าใหม่
        </Link>
      </div>

      {/* 2. Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#120f24] p-4 rounded-2xl border border-violet-900/30 shadow-md">
          <p className="text-[11px] font-medium text-zinc-400">สัญญาทั้งหมดในระบบ</p>
          <p className="text-2xl font-black text-white mt-1">
            {stats.total} <span className="text-xs font-normal text-zinc-500">ฉบับ</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-emerald-900/30 shadow-md">
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> สัญญาที่กำลังใช้งาน (Active)
          </p>
          <p className="text-2xl font-black text-emerald-300 mt-1">
            {stats.active} <span className="text-xs font-normal text-emerald-500/60">ห้อง</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-amber-900/30 shadow-md">
          <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> ใกล้หมดอายุ (&le; 30 วัน)
          </p>
          <p className="text-2xl font-black text-amber-300 mt-1">
            {stats.expiring} <span className="text-xs font-normal text-amber-500/60">ฉบับ</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-zinc-800 shadow-md">
          <p className="text-[11px] font-medium text-zinc-400">สิ้นสุดสัญญาแล้ว (Ended)</p>
          <p className="text-2xl font-black text-zinc-300 mt-1">
            {stats.ended} <span className="text-xs font-normal text-zinc-500">ฉบับ</span>
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#120f24] p-4 rounded-2xl border border-violet-950/80 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400/60" />
            <input
              type="text"
              placeholder="ค้นหาด้วยหมายเลขห้อง, ชื่อผู้เช่า หรือรหัสสัญญา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0a18] border border-violet-950/80 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400">สถานะ:</span>
            <div className="flex items-center gap-1 bg-[#0c0a18] p-1 rounded-xl border border-violet-950/70 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                กำลังใช้งาน
              </button>
              <button
                onClick={() => setStatusFilter("expiring")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "expiring"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ใกล้หมดอายุ
              </button>
              <button
                onClick={() => setStatusFilter("ended")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "ended"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                สิ้นสุดแล้ว
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table / List View */}
      {filteredContracts.length === 0 ? (
        <div className="bg-[#120f24] p-12 rounded-3xl border border-violet-950 text-center space-y-4 shadow-xl">
          <FileText className="w-12 h-12 text-violet-400/40 mx-auto" />
          <h3 className="text-base font-bold text-white">ไม่พบสัญญาเช่าตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {initialContracts.length === 0
              ? "ยังไม่มีสัญญาเช่าในระบบ เริ่มต้นทำสัญญาเช่าฉบับแรกได้เลยครับ"
              : "ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรอง"}
          </p>
          <div className="pt-2">
            {initialContracts.length === 0 ? (
              <Link
                href="/contracts/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-950/60"
              >
                <Plus className="w-4 h-4" /> ทำสัญญาเช่าฉบับแรก
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-xs font-semibold border border-violet-800/30"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#120f24] rounded-3xl border border-violet-950/80 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#16122d]/70 border-b border-violet-950/60 text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">ห้องพัก</th>
                  <th className="py-3.5 px-4">ผู้เช่าหลัก / รูมเมท</th>
                  <th className="py-3.5 px-4">ระยะเวลาสัญญา</th>
                  <th className="py-3.5 px-4">ค่าเช่า / เงินมัดจำ</th>
                  <th className="py-3.5 px-4">สถานะสัญญา</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-950/40">
                {filteredContracts.map((c) => {
                  const isActive = c.status === "active";
                  const isEnded = c.status === "ended";

                  return (
                    <tr key={c.id} className="hover:bg-violet-950/20 transition-colors group">
                      {/* Room */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/rooms/${c.roomId}`}
                          className="font-black text-white text-base group-hover:text-violet-300 transition-colors flex items-center gap-1.5"
                        >
                          <Building2 className="w-4 h-4 text-violet-400" />
                          ห้อง {c.roomNo}
                        </Link>
                        <span className="text-[11px] text-zinc-500">ชั้น {c.floor}</span>
                      </td>

                      {/* Tenant */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/tenants/${c.tenantId}`}
                          className="font-bold text-white hover:text-violet-300 transition-colors block text-sm"
                        >
                          {c.tenantName}
                        </Link>
                        {c.coTenantName ? (
                          <span className="text-[11px] text-violet-300/80 block">
                            รูมเมท: {c.coTenantName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">โทร: {c.tenantPhone}</span>
                        )}
                      </td>

                      {/* Dates & Expiring Warning */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-zinc-200 block">
                            {new Date(c.startDate).toLocaleDateString("th-TH")} -{" "}
                            {new Date(c.endDate).toLocaleDateString("th-TH")}
                          </span>
                          {isActive && c.isExpiringSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> เหลืออีก {c.daysRemaining} วัน
                            </span>
                          )}
                          {isActive && !c.isExpiringSoon && (
                            <span className="text-[10px] text-zinc-500">
                              เหลืออีก {c.daysRemaining} วัน
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rent & Deposit */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-fuchsia-300 block">
                            ฿{c.monthlyRent.toLocaleString()} /ด.
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            มัดจำ: ฿{c.deposit.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            🟢 กำลังใช้งาน (Active)
                          </span>
                        )}
                        {isEnded && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            สิ้นสุดสัญญาแล้ว
                          </span>
                        )}
                        {c.status === "cancelled" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-900">
                            ยกเลิก
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <Link
                              href={`/contracts/${c.id}?action=end`}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-colors"
                            >
                              คืนมัดจำ/ย้ายออก
                            </Link>
                          )}
                          <Link
                            href={`/contracts/${c.id}`}
                            className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 hover:text-white text-[11px] font-semibold border border-violet-800/30 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> รายละเอียด
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
