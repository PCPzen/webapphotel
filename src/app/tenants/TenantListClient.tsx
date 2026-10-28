"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  ShieldCheck,
  ArrowRight,
  Eye,
  FileText,
  UserCheck,
  UserMinus,
  Sparkles,
} from "lucide-react";
import { maskThaiId } from "@/lib/thaiId";

type TenantItem = {
  id: number;
  firstName: string;
  lastName: string;
  idCardNo: string;
  maskedIdCard: string;
  phone: string;
  email: string | null;
  lineId?: string | null;
  vehicleInfo?: string | null;
  currentRoom: {
    id: number;
    roomNo: string;
    contractId: number;
  } | null;
  totalContractsCount: number;
  createdAt: string;
};

export default function TenantListClient({ initialTenants }: { initialTenants: TenantItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "past" | "none">("all");

  const stats = useMemo(() => {
    const total = initialTenants.length;
    const active = initialTenants.filter((t) => t.currentRoom !== null).length;
    const past = initialTenants.filter((t) => t.currentRoom === null && t.totalContractsCount > 0).length;
    const none = initialTenants.filter((t) => t.totalContractsCount === 0).length;
    return { total, active, past, none };
  }, [initialTenants]);

  const filteredTenants = useMemo(() => {
    return initialTenants.filter((tenant) => {
      const q = search.toLowerCase().trim();
      const matchName = `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(q);
      const matchPhone = tenant.phone.includes(q);
      const matchRoom = tenant.currentRoom?.roomNo.toLowerCase().includes(q);
      const matchIdLast4 = tenant.idCardNo.slice(-4).includes(q);
      const matchLine = Boolean(tenant.lineId && tenant.lineId.toLowerCase().includes(q));
      const matchVehicle = Boolean(tenant.vehicleInfo && tenant.vehicleInfo.toLowerCase().includes(q));

      const matchSearch =
        !q || matchName || matchPhone || matchRoom || matchIdLast4 || matchLine || matchVehicle;

      if (!matchSearch) return false;

      if (statusFilter === "active") return tenant.currentRoom !== null;
      if (statusFilter === "past") return tenant.currentRoom === null && tenant.totalContractsCount > 0;
      if (statusFilter === "none") return tenant.totalContractsCount === 0;
      return true;
    });
  }, [initialTenants, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-950/60 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Users className="w-5 h-5" />
            </span>
            ทะเบียนประวัติผู้เช่า (Tenants Management)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ฐานข้อมูลผู้เช่าหอพัก ค้นหาประวัติ และตรวจสอบความถูกต้องตามมาตรฐาน PDPA
          </p>
        </div>

        <Link
          href="/tenants/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-950/60 ring-1 ring-violet-400/40 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          ลงทะเบียนผู้เช่าใหม่
        </Link>
      </div>

      {/* 2. Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#120f24] p-4 rounded-2xl border border-violet-900/30 shadow-md">
          <p className="text-[11px] font-medium text-zinc-400">ผู้เช่าทั้งหมดในระบบ</p>
          <p className="text-2xl font-black text-white mt-1">
            {stats.total} <span className="text-xs font-normal text-zinc-500">คน</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-emerald-900/30 shadow-md">
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> พักอาศัยอยู่ปัจจุบัน
          </p>
          <p className="text-2xl font-black text-emerald-300 mt-1">
            {stats.active} <span className="text-xs font-normal text-emerald-500/60">คน</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-violet-800/40 shadow-md">
          <p className="text-[11px] font-semibold text-violet-300 flex items-center gap-1.5">
            <UserMinus className="w-3.5 h-3.5" /> อดีตผู้เช่า (ย้ายออก)
          </p>
          <p className="text-2xl font-black text-violet-200 mt-1">
            {stats.past} <span className="text-xs font-normal text-violet-400/60">คน</span>
          </p>
        </div>

        <div className="bg-[#120f24] p-4 rounded-2xl border border-zinc-800 shadow-md">
          <p className="text-[11px] font-medium text-zinc-400">ลงทะเบียนรอทำสัญญา</p>
          <p className="text-2xl font-black text-zinc-300 mt-1">
            {stats.none} <span className="text-xs font-normal text-zinc-500">คน</span>
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
              placeholder="ค้นหาด้วยชื่อ, นามสกุล, หมายเลขห้อง, เบอร์โทร, หรือเลขบัตร 4 หลักท้าย..."
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
                กำลังพัก
              </button>
              <button
                onClick={() => setStatusFilter("past")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "past"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ย้ายออกแล้ว
              </button>
            </div>
          </div>
        </div>

        {/* PDPA Note Banner */}
        <div className="flex items-center justify-between text-[11px] text-violet-300/80 bg-violet-950/30 px-3 py-1.5 rounded-xl border border-violet-900/30">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            การแสดงผลเลขบัตรประชาชนถูกปิดบังตามกฎ BR-13 (PDPA) เพื่อความปลอดภัย
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            แสดง 13 หลักเต็มเฉพาะหน้ารายละเอียด
          </span>
        </div>
      </div>

      {/* 4. Table / List View */}
      {filteredTenants.length === 0 ? (
        <div className="bg-[#120f24] p-12 rounded-3xl border border-violet-950 text-center space-y-4 shadow-xl">
          <Users className="w-12 h-12 text-violet-400/40 mx-auto" />
          <h3 className="text-base font-bold text-white">ไม่พบข้อมูลผู้เช่าตามเงื่อนไข</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {initialTenants.length === 0
              ? "ยังไม่มีข้อมูลผู้เช่าในระบบ เริ่มต้นลงทะเบียนผู้เช่าคนแรกได้เลยครับ"
              : "ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรอง"}
          </p>
          <div className="pt-2">
            {initialTenants.length === 0 ? (
              <Link
                href="/tenants/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-950/60"
              >
                <Plus className="w-4 h-4" /> ลงทะเบียนผู้เช่าคนแรก
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
                  <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3.5 px-4">เลขบัตร ปชช. (PDPA)</th>
                  <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3.5 px-4">ห้องพักปัจจุบัน</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-950/40">
                {filteredTenants.map((t) => {
                  const hasActiveRoom = Boolean(t.currentRoom);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-violet-950/20 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/tenants/${t.id}`}
                          className="font-bold text-white group-hover:text-violet-300 transition-colors block text-sm"
                        >
                          {t.firstName} {t.lastName}
                        </Link>
                        {t.email ? (
                          <span className="text-[11px] text-zinc-500">{t.email}</span>
                        ) : (
                          <span className="text-[11px] text-zinc-600">- ไม่ได้ระบุอีเมล -</span>
                        )}
                      </td>

                      {/* Masked Citizen ID */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        <span className="px-2 py-1 rounded bg-[#0c0a18] border border-violet-950/70">
                          {t.maskedIdCard}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-medium text-zinc-200">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400/80" />
                          {t.phone}
                        </span>
                      </td>

                      {/* Current Room */}
                      <td className="py-3.5 px-4">
                        {hasActiveRoom ? (
                          <Link
                            href={`/rooms/${t.currentRoom?.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-600/20 text-violet-200 border border-violet-500/40 font-bold hover:bg-violet-600/30 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5 text-violet-400" />
                            ห้อง {t.currentRoom?.roomNo}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">
                            {t.totalContractsCount > 0 ? "เคยพัก (ย้ายออกแล้ว)" : "ยังไม่มีห้องพัก"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {hasActiveRoom ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            กำลังพักอาศัย
                          </span>
                        ) : t.totalContractsCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                            ย้ายออกแล้ว
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            ลงทะเบียนใหม่
                          </span>
                        )}
                      </td>

                      {/* Action Links */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!hasActiveRoom && (
                            <Link
                              href={`/contracts/new?tenantId=${t.id}`}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950/40 transition-all inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> ทำสัญญา
                            </Link>
                          )}
                          <Link
                            href={`/tenants/${t.id}`}
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
