"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  User,
  Wrench,
  CheckCircle2,
  Snowflake,
  Wind,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

type Room = {
  id: number;
  roomNo: string;
  floor: number;
  roomType: string;
  baseRent: number;
  status: "vacant" | "occupied" | "maintenance";
  note: string | null;
  activeTenant?: {
    name: string;
    phone: string;
  } | null;
  activeRepairsCount?: number;
};

export default function RoomListClient({ initialRooms }: { initialRooms: Room[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"floorplan" | "grid">("floorplan");

  // สถิติภาพรวม
  const stats = useMemo(() => {
    const total = initialRooms.length;
    const vacant = initialRooms.filter((r) => r.status === "vacant").length;
    const occupied = initialRooms.filter((r) => r.status === "occupied").length;
    const maintenance = initialRooms.filter((r) => r.status === "maintenance").length;
    const occupancyRate = total > 0 ? ((occupied / (total - maintenance || 1)) * 100).toFixed(1) : "0.0";

    return { total, vacant, occupied, maintenance, occupancyRate };
  }, [initialRooms]);

  // ชั้นทั้งหมดที่มี
  const allFloors = useMemo(() => {
    return Array.from(new Set(initialRooms.map((r) => r.floor))).sort((a, b) => a - b);
  }, [initialRooms]);

  // กรองห้องพัก
  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room) => {
      const matchSearch =
        room.roomNo.toLowerCase().includes(search.toLowerCase()) ||
        (room.activeTenant && room.activeTenant.name.toLowerCase().includes(search.toLowerCase())) ||
        (room.note && room.note.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || room.status === statusFilter;
      const matchFloor = floorFilter === "all" || room.floor.toString() === floorFilter;
      const matchType = typeFilter === "all" || room.roomType.includes(typeFilter);

      return matchSearch && matchStatus && matchFloor && matchType;
    });
  }, [initialRooms, search, statusFilter, floorFilter, typeFilter]);

  // จัดกลุ่มห้องพักตามชั้น (สำหรับโหมด Floor Plan)
  const roomsByFloor = useMemo(() => {
    const map = new Map<number, Room[]>();
    filteredRooms.forEach((room) => {
      if (!map.has(room.floor)) {
        map.set(room.floor, []);
      }
      map.get(room.floor)!.push(room);
    });

    // เรียงห้องตามเลขห้องในแต่ละชั้น
    Array.from(map.values()).forEach((rooms) => {
      rooms.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));
    });

    return Array.from(map.entries()).sort(([floorA], [floorB]) => floorA - floorB);
  }, [filteredRooms]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            ผังสถานะและจัดการห้องพัก
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ภาพรวมห้องพักรายชั้น (Floor Plan), ตรวจสอบห้องว่าง, และทำสัญญาเช่า
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/rooms/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            เพิ่มห้องพัก
          </Link>
        </div>
      </div>

      {/* 2. สรุปสถิติ (Stats Overview Card ในธีมฟ้าดำขาว) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#0b1120] p-4 rounded-2xl border border-slate-800 shadow-md">
          <p className="text-[11px] font-medium text-slate-400">ห้องพักทั้งหมด</p>
          <p className="text-2xl font-black text-white mt-1">
            {stats.total} <span className="text-xs font-normal text-slate-500">ห้อง</span>
          </p>
        </div>

        <div className="bg-[#0b1120] p-4 rounded-2xl border border-emerald-900/30 shadow-md">
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            ห้องว่างพร้อมเช่า
          </p>
          <p className="text-2xl font-black text-emerald-300 mt-1">
            {stats.vacant} <span className="text-xs font-normal text-emerald-500/60">ห้อง</span>
          </p>
        </div>

        <div className="bg-[#0b1120] p-4 rounded-2xl border border-blue-800/40 shadow-md">
          <p className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            มีผู้เช่าแล้ว
          </p>
          <p className="text-2xl font-black text-blue-200 mt-1">
            {stats.occupied} <span className="text-xs font-normal text-blue-400/60">ห้อง</span>
          </p>
        </div>

        <div className="bg-[#0b1120] p-4 rounded-2xl border border-amber-900/30 shadow-md">
          <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            ปิดซ่อมบำรุง
          </p>
          <p className="text-2xl font-black text-amber-300 mt-1">
            {stats.maintenance} <span className="text-xs font-normal text-amber-500/60">ห้อง</span>
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-950/40 via-[#0d162b] to-[#0b1120] p-4 rounded-2xl border border-blue-800/40 shadow-md flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-blue-300/80">อัตราการเข้าพัก (Occupancy)</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-black text-white">{stats.occupancyRate}%</p>
            <span className="text-xs text-blue-300/70">ของห้องพร้อมเช่า</span>
          </div>
        </div>
      </div>

      {/* 3. กล่องค้นหาและตัวกรอง */}
      <div className="bg-[#0b1120] p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60" />
            <input
              type="text"
              placeholder="ค้นหาเลขห้อง (เช่น 101), ชื่อผู้เช่า หรือหมายเหตุ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080c15] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
            />
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080c15] border border-slate-800 self-end md:self-auto">
            <button
              onClick={() => setViewMode("floorplan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "floorplan"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>แยกตามชั้น</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ตารางรวม</span>
            </button>
          </div>
        </div>

        {/* ตัวกรองด่วน: สถานะ, ชั้น, ประเภทห้อง */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">สถานะ:</span>
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "vacant", label: "ว่าง", activeClass: "bg-emerald-600 text-white" },
            { id: "occupied", label: "มีผู้เช่า", activeClass: "bg-blue-600 text-white" },
            { id: "maintenance", label: "ซ่อมบำรุง", activeClass: "bg-amber-600 text-white" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? tab.activeClass || "bg-blue-600 text-white"
                  : "bg-[#080c15] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {allFloors.length > 1 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">ชั้น:</span>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="py-1 px-2.5 rounded-lg bg-[#080c15] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">ทุกชั้น</option>
                {allFloors.map((fl) => (
                  <option key={fl} value={fl.toString()}>
                    ชั้น {fl}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. แสดงผลห้องพัก: ผังชั้น หรือ ตารางรวม */}
      {filteredRooms.length === 0 ? (
        <div className="bg-[#0b1120] p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <Building2 className="w-12 h-12 text-blue-400/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">ไม่พบห้องพักตามเงื่อนไข</h3>
            <p className="text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูห้องทั้งหมด
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setFloorFilter("all");
                setTypeFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              ล้างตัวกรอง
            </button>
            <Link
              href="/rooms/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มห้องใหม่
            </Link>
          </div>
        </div>
      ) : viewMode === "floorplan" ? (
        <div className="space-y-6">
          {roomsByFloor.map(([floor, rooms]) => (
            <FloorSection key={floor} floor={floor} rooms={rooms} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component ย่อย: FloorSection แสดงห้องพักรายชั้น
// -----------------------------------------------------------------------------
function FloorSection({ floor, rooms }: { floor: number; rooms: Room[] }) {
  const floorOccupied = rooms.filter((r) => r.status === "occupied").length;
  const floorVacant = rooms.filter((r) => r.status === "vacant").length;
  const floorMaint = rooms.filter((r) => r.status === "maintenance").length;

  return (
    <div className="bg-[#0b1120] rounded-3xl border border-slate-800 p-5 md:p-6 space-y-4 shadow-xl">
      {/* Floor Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-black text-sm">
            {floor}
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              ชั้นที่ {floor}
              <span className="text-xs text-slate-400 font-normal">
                ({rooms.length} ห้องพัก)
              </span>
            </h2>
          </div>
        </div>

        {/* Floor Quick Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-semibold text-[11px]">
            ว่าง: <strong className="text-emerald-400">{floorVacant}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-semibold text-[11px]">
            เช่าแล้ว: <strong className="text-blue-400">{floorOccupied}</strong>
          </span>
          {floorMaint > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-semibold text-[11px]">
              ซ่อม: <strong className="text-amber-400">{floorMaint}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Floor Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component ย่อย: RoomCard การ์ดห้องพัก
// -----------------------------------------------------------------------------
function RoomCard({ room }: { room: Room }) {
  const isVacant = room.status === "vacant";
  const isOccupied = room.status === "occupied";
  const isMaintenance = room.status === "maintenance";

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:scale-[1.02] ${
        isVacant
          ? "bg-[#0c1815]/60 border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/20"
          : isOccupied
          ? "bg-[#0b162a]/70 border-blue-500/30 hover:border-blue-400/60 shadow-lg shadow-blue-950/30"
          : "bg-[#1c150c]/60 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/20"
      }`}
    >
      <div className="p-3.5 space-y-2.5">
        {/* Room Header: Room No & Status Pill */}
        <div className="flex items-center justify-between">
          <span className="text-lg md:text-xl font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
            {room.roomNo}
          </span>

          {isVacant && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ว่าง
            </span>
          )}
          {isOccupied && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              มีผู้เช่า
            </span>
          )}
          {isMaintenance && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ซ่อมบำรุง
            </span>
          )}
        </div>

        {/* Room Type & Rent */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              {room.roomType.includes("แอร์") ? (
                <Snowflake className="w-3 h-3 text-cyan-400" />
              ) : (
                <Wind className="w-3 h-3 text-slate-400" />
              )}
              {room.roomType}
            </span>
            <span className="font-bold text-slate-200">
              ฿{room.baseRent.toLocaleString()}
            </span>
          </div>

          {/* If occupied, show tenant name */}
          {isOccupied && room.activeTenant ? (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-200 truncate pt-1 border-t border-slate-800">
              <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate">{room.activeTenant.name}</span>
            </div>
          ) : isVacant ? (
            <p className="text-[10px] text-emerald-400/80 italic pt-1 border-t border-emerald-950/40">
              พร้อมทำสัญญาใหม่
            </p>
          ) : (
            <p className="text-[10px] text-amber-400/80 italic pt-1 border-t border-amber-950/40">
              ปิดปรับปรุงชั่วคราว
            </p>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <Link
          href={`/rooms/${room.id}`}
          className="text-slate-400 hover:text-white font-medium transition-colors"
        >
          ดูข้อมูล
        </Link>

        {isVacant ? (
          <Link
            href={`/contracts/new?roomId=${room.id}`}
            className="font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5"
          >
            + สัญญา <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <Link
            href={`/rooms/${room.id}/edit`}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            แก้ไข
          </Link>
        )}
      </div>
    </div>
  );
}
