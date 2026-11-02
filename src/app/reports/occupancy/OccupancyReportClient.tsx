"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PieChart,
  Building2,
  Users,
  DoorOpen,
  Wrench,
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
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-400" />
            รายงานอัตราการเข้าพักและสถานะห้องพัก
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            วิเคราะห์อัตราการเข้าพัก สัดส่วนรายชั้น และมูลค่าสร้างรายได้ของหอพัก
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b1120] hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold self-start sm:self-auto transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          <span>พิมพ์รายงาน</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Occupancy Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-blue-300 text-xs mb-2">
            <span>อัตราเข้าพักรวม</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {data.occupancyRate.toFixed(1)}%
          </div>
          <div className="w-full bg-[#080c15] border border-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, data.occupancyRate))}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            มีผู้เช่า {data.occupiedRooms} / {data.totalRooms} ห้อง
          </div>
        </div>

        {/* Vacant Rooms */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>ห้องว่างพร้อมเช่า</span>
            <DoorOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {data.vacantRooms} <span className="text-xs font-normal text-slate-400">ห้อง</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-2">
            คิดเป็น {((data.vacantRooms / Math.max(1, data.totalRooms)) * 100).toFixed(1)}% ของห้องทั้งหมด
          </div>
        </div>

        {/* Maintenance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>ปิดปรับปรุง</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            {data.maintenanceRooms} <span className="text-xs font-normal text-slate-400">ห้อง</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            อยู่ระหว่างซ่อมแซมหรือเตรียมห้อง
          </div>
        </div>

        {/* Monthly Rental Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>มูลค่าค่าเช่าต่อเดือน</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> สัดส่วนการเข้าพักแยกตามชั้น
          </h2>

          <div className="space-y-3 pt-1">
            {data.floorStats.map((f) => (
              <div key={f.floor} className="p-3 rounded-xl bg-[#080c15] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">ชั้น {f.floor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      มีผู้เช่า {f.occupied}/{f.total} ห้อง (ว่าง {f.vacant})
                    </span>
                    <span className="font-bold text-blue-400 font-mono">{f.rate.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div style={{ width: `${f.rate}%` }} className="bg-blue-600 h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Type Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> สถิติแยกตามประเภทห้องพัก
          </h2>

          <div className="space-y-3 pt-1">
            {data.typeStats.map((t) => (
              <div key={t.type} className="p-3.5 rounded-xl bg-[#080c15] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white uppercase">{t.type}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      (ค่าเช่าเฉลี่ย ฿{t.avgRent.toLocaleString("th-TH")}/ด.)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">{t.rate.toFixed(0)}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ทั้งหมด {t.total} ห้อง</span>
                  <span className="text-emerald-400">มีผู้เช่า {t.occupied} ห้อง</span>
                  <span className="text-sky-400">ว่าง {t.vacant} ห้อง</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Inventory List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">ตารางสถานะห้องพักและผู้เช่า</h2>
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
              className="px-3 py-1.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="all" className="bg-[#0b1120]">ทุกชั้น ({uniqueFloors.length} ชั้น)</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl} className="bg-[#0b1120]">
                  ชั้น {fl}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="all" className="bg-[#0b1120]">ทุกสถานะ</option>
              <option value="occupied" className="bg-[#0b1120]">มีผู้เช่า (Occupied)</option>
              <option value="vacant" className="bg-[#0b1120]">ว่าง (Vacant)</option>
              <option value="maintenance" className="bg-[#0b1120]">ปรับปรุง (Maintenance)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0f172a] text-slate-300 border-b border-slate-800 font-bold">
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
            <tbody className="divide-y divide-slate-800/80">
              {filteredRooms.map((r) => (
                <tr key={r.id} className="hover:bg-[#0f172a]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">
                    <Link href={`/rooms/${r.id}`} className="hover:text-blue-400 hover:underline">
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        มีผู้เช่า
                      </span>
                    )}
                    {r.status === "vacant" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ว่าง
                      </span>
                    )}
                    {r.status === "maintenance" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        ปรับปรุง
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-white font-medium">
                    {r.tenantName || <span className="text-slate-500">-</span>}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {r.tenantPhone ? (
                      <a href={`tel:${r.tenantPhone}`} className="hover:text-blue-400">
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
                        className={`font-bold ${
                          r.daysRemaining < 30 ? "text-amber-400" : "text-slate-300"
                        }`}
                      >
                        {r.daysRemaining} วัน
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
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
