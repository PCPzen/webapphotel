"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PieChart,
  Building2,
  Users,
  DoorOpen,
  Wrench,
  BookmarkCheck,
  TrendingUp,
  DollarSign,
  Printer,
  Calendar,
  Phone,
  ArrowRight,
  Filter,
} from "lucide-react";
import ReportTabs from "@/components/ReportTabs";
import { formatThaiDate } from "@/lib/invoices";

export type OccupancyRoomItem = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
  status: "vacant" | "occupied" | "maintenance";
  tenantName?: string | null;
  tenantPhone?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  daysRemaining?: number | null;
};

export type FloorStat = {
  floor: number;
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  rate: number;
};

export type RoomTypeStat = {
  type: string;
  total: number;
  occupied: number;
  vacant: number;
  avgRent: number;
  rate: number;
};

export type OccupancyReportData = {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  totalCapacityRent: number;
  actualOccupiedRent: number;
  floorStats: FloorStat[];
  typeStats: RoomTypeStat[];
  rooms: OccupancyRoomItem[];
};

export default function OccupancyReportClient({ data }: { data: OccupancyReportData }) {
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredRooms = useMemo(() => {
    return data.rooms.filter((r) => {
      if (selectedFloor !== "all" && r.floor !== selectedFloor) return false;
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      return true;
    });
  }, [data.rooms, selectedFloor, selectedStatus]);

  const uniqueFloors = useMemo(() => {
    return Array.from(new Set(data.rooms.map((r) => r.floor))).sort((a, b) => a - b);
  }, [data.rooms]);

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <ReportTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-violet-400" />
            รายงานอัตราการเข้าพักและสถานะห้องพัก
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            วิเคราะห์อัตราการเข้าพัก (Occupancy Rate) สัดส่วนรายชั้น และมูลค่าสร้างรายได้ของหอพัก
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium self-start sm:self-auto transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-violet-400" />
          <span>พิมพ์รายงาน</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Occupancy Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1b1236] to-[#120c24] border border-violet-800/40 shadow-lg">
          <div className="flex items-center justify-between text-violet-300 text-xs mb-2">
            <span>อัตราเข้าพักรวม</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {data.occupancyRate.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-fuchsia-400 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, data.occupancyRate))}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            มีผู้เช่า {data.occupiedRooms} / {data.totalRooms} ห้อง
          </div>
        </div>

        {/* Vacant Rooms */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121f24] to-[#0f191e] border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>ห้องว่างพร้อมเช่า</span>
            <DoorOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-300 tracking-tight">
            {data.vacantRooms} <span className="text-xs font-normal text-slate-400">ห้อง</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-2">
            คิดเป็น {((data.vacantRooms / Math.max(1, data.totalRooms)) * 100).toFixed(1)}% ของห้องทั้งหมด
          </div>
        </div>

        {/* Maintenance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#241c12] to-[#1a140d] border border-amber-900/30 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>ปิดปรับปรุง</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-tight">
            {data.maintenanceRooms} <span className="text-xs font-normal text-slate-400">ห้อง</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            อยู่ระหว่างซ่อมแซมหรือเตรียมห้อง
          </div>
        </div>

        {/* Monthly Rental Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#16122d] to-[#120f24] border border-violet-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>มูลค่าค่าเช่าต่อเดือน</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ฿{data.actualOccupiedRent.toLocaleString("th-TH")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            จากเพดานเต็ม ฿{data.totalCapacityRent.toLocaleString("th-TH")}
          </div>
        </div>
      </div>

      {/* 2-Columns: Floor Stats & Room Type Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Floor Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-400" /> สัดส่วนการเข้าพักแยกตามชั้น
          </h2>

          <div className="space-y-3 pt-1">
            {data.floorStats.map((f) => (
              <div key={f.floor} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">ชั้น {f.floor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      มีผู้เช่า {f.occupied}/{f.total} ห้อง (ว่าง {f.vacant})
                    </span>
                    <span className="font-bold text-violet-300 font-mono">{f.rate.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div style={{ width: `${f.rate}%` }} className="bg-violet-500 h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Type Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" /> สถิติแยกตามประเภทห้องพัก
          </h2>

          <div className="space-y-3 pt-1">
            {data.typeStats.map((t) => (
              <div key={t.type} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white uppercase">{t.type}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      (ค่าเช่าเฉลี่ย ฿{t.avgRent.toLocaleString("th-TH")}/ด.)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">{t.rate.toFixed(0)}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ทั้งหมด {t.total} ห้อง</span>
                  <span className="text-emerald-300">มีผู้เช่า {t.occupied} ห้อง</span>
                  <span className="text-cyan-300">ว่าง {t.vacant} ห้อง</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Inventory List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#120f24] border border-violet-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">ตารางสถานะห้องพักและผู้เช่า</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดง {filteredRooms.length} จาก {data.rooms.length} ห้อง
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Floor filter */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="all">ทุกชั้น ({uniqueFloors.length} ชั้น)</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl}>
                  ชั้น {fl}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="occupied">มีผู้เช่า (Occupied)</option>
              <option value="vacant">ว่าง (Vacant)</option>
              <option value="maintenance">ปรับปรุง (Maintenance)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-left">
            <thead className="bg-black/40 text-slate-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-3">ห้อง</th>
                <th className="py-3 px-3">ชั้น</th>
                <th className="py-3 px-3">ประเภท</th>
                <th className="py-3 px-3 text-right">ค่าเช่าฐาน</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3">ผู้เช่าปัจจุบัน</th>
                <th className="py-3 px-3">เบอร์โทรศัพท์</th>
                <th className="py-3 px-3">วันสิ้นสุดสัญญา</th>
                <th className="py-3 px-3 text-right">ระยะเวลาคงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRooms.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">
                    <Link href={`/rooms/${r.id}`} className="hover:text-violet-300 hover:underline">
                      ห้อง {r.roomNo}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-slate-400">ชั้น {r.floor}</td>
                  <td className="py-3 px-3 text-slate-300 uppercase">{r.roomType}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    ฿{r.baseRent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.status === "occupied" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        มีผู้เช่า
                      </span>
                    )}
                    {r.status === "vacant" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ว่าง
                      </span>
                    )}
                    {r.status === "maintenance" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ปรับปรุง
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-white font-medium">
                    {r.tenantName || <span className="text-slate-600">-</span>}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {r.tenantPhone ? (
                      <a href={`tel:${r.tenantPhone}`} className="hover:text-violet-300">
                        {r.tenantPhone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {r.contractEndDate ? formatThaiDate(r.contractEndDate) : "-"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {r.daysRemaining !== null && r.daysRemaining !== undefined ? (
                      <span
                        className={`font-semibold ${
                          r.daysRemaining < 30 ? "text-amber-400" : "text-slate-300"
                        }`}
                      >
                        {r.daysRemaining} วัน
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    ไม่พบห้องพักตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
