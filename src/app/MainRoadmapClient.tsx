"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, Users, FileText, Gauge, Receipt, CreditCard, 
  Wrench, BarChart3, UserCircle2, ArrowRight, ShieldAlert, 
  CheckCircle2, Lock, Unlock, Eye, Sparkles
} from "lucide-react";

type RoleFilter = "all" | "admin" | "tenant";

export default function MainRoadmapClient() {
  const [activeRole, setActiveRole] = useState<RoleFilter>("all");

  const steps = [
    {
      stepNumber: 1,
      title: "ระบบจัดการห้องพัก (Rooms)",
      icon: Building2,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "สร้างห้องพัก กำหนดชั้น ประเภทแอร์/พัดลม และราคาเช่ามาตรฐาน (UR-2.3)",
      primaryLink: { label: "เข้าจัดการห้องพัก", href: "/rooms" },
      subLinks: [{ label: "+ เพิ่มห้องใหม่ (P04)", href: "/rooms/new" }],
      nextStep: { label: "สเต็ป 2: ทะเบียนผู้เช่า", href: "/tenants" },
      permissionNote: "ผู้เช่าทั่วไปไม่สามารถเพิ่มหรือแก้ไขราคาห้องได้",
    },
    {
      stepNumber: 2,
      title: "ระบบทะเบียนผู้เช่า (Tenants)",
      icon: Users,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "บันทึกประวัติผู้เช่า ตรวจ Checksum เลขบัตรประชาชน 13 หลัก (BR-01, PDPA)",
      primaryLink: { label: "เข้าทะเบียนผู้เช่า", href: "/tenants" },
      subLinks: [{ label: "+ ลงทะเบียนผู้เช่า (P07)", href: "/tenants/new" }],
      nextStep: { label: "สเต็ป 3: สัญญาเช่า", href: "/contracts" },
      permissionNote: "เก็บข้อมูลส่วนบุคคล มีการปิดบังเลขบัตร (Masking) ตาม PDPA",
    },
    {
      stepNumber: 3,
      title: "ระบบสัญญาเช่า (Contracts)",
      icon: FileText,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "จับคู่ห้องว่างกับผู้เช่า ล็อกสัญญา Active 1 ห้อง (BR-02) และมัดจำ (BR-10)",
      primaryLink: { label: "เข้าจัดการสัญญาเช่า", href: "/contracts" },
      subLinks: [{ label: "+ ทำสัญญาใหม่ (P10)", href: "/contracts/new" }],
      nextStep: { label: "สเต็ป 4: จดมิเตอร์น้ำไฟ", href: "/meters" },
      permissionNote: "ผู้เช่าดูได้เฉพาะสัญญาของตนเองในพอร์ทัลผู้เช่า",
    },
    {
      stepNumber: 4,
      title: "ระบบจดมิเตอร์น้ำ-ไฟ (Meters)",
      icon: Gauge,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "ตารางจดเลขมิเตอร์ประจำเดือน ตรวจสอบเลขใหม่ ≥ เลขเก่า (BR-04)",
      primaryLink: { label: "เข้าตารางจดมิเตอร์", href: "/meters" },
      subLinks: [],
      nextStep: { label: "สเต็ป 5: ออกใบแจ้งหนี้", href: "/invoices" },
      permissionNote: "เฉพาะเจ้าหน้าที่ผู้ดูแลเดินจดเลขมิเตอร์หน้าห้อง",
    },
    {
      stepNumber: 5,
      title: "ระบบใบแจ้งหนี้ (Invoices)",
      icon: Receipt,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "คำนวณเงินอัตโนมัติจากยูนิตมิเตอร์และออกบิลรายเดือน (BR-05)",
      primaryLink: { label: "เข้ารายการใบแจ้งหนี้", href: "/invoices" },
      subLinks: [{ label: "⚡ คำนวณ & ออกบิลพร้อมกัน (P14)", href: "/invoices/generate" }],
      nextStep: { label: "สเต็ป 6: รับชำระเงิน", href: "/payments" },
      permissionNote: "เจ้าหน้าที่ออกบิลรวม / ผู้เช่าดูเฉพาะบิลของห้องตนเอง",
    },
    {
      stepNumber: 6,
      title: "ระบบรับชำระเงิน & ใบเสร็จ (Payments)",
      icon: CreditCard,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "ตรวจสอบสลิปโอนเงิน อนุมัติยอด และออกใบเสร็จรับเงินดิจิทัล (BR-08, BR-11)",
      primaryLink: { label: "เข้าประวัติรับชำระเงิน", href: "/payments" },
      subLinks: [],
      nextStep: { label: "สเต็ป 7: แจ้งซ่อมแซม", href: "/repairs" },
      permissionNote: "ห้ามลบประวัติการเงิน (ใช้วิธี Void โดย Admin เท่านั้น)",
    },
    {
      stepNumber: 7,
      title: "ระบบแจ้งซ่อมแซม (Repairs)",
      icon: Wrench,
      role: "both",
      roleLabel: "ทั้ง Admin และ ผู้เช่า (User)",
      roleBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      desc: "ผู้เช่าแจ้งเรื่องชำรุดเสียหาย เจ้าหน้าที่มอบหมายช่างและอัปเดตสถานะ",
      primaryLink: { label: "เข้าระบบงานซ่อม", href: "/repairs" },
      subLinks: [
        { label: "Admin: รายการงานซ่อม (P18)", href: "/repairs" },
        { label: "ผู้เช่า: แจ้งซ่อมใหม่ (P29)", href: "/me/repairs/new" }
      ],
      nextStep: { label: "สเต็ป 8: รายงานและแดชบอร์ด", href: "/dashboard" },
      permissionNote: "ผู้เช่าแจ้งได้เฉพาะห้องตนเอง / เจ้าหน้าที่จัดการงานซ่อมทุกห้อง",
    },
    {
      stepNumber: 8,
      title: "แดชบอร์ด & รายงานสรุป (Dashboard)",
      icon: BarChart3,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "ภาพรวมสถิติหอพัก ยอดค้างชำระ รายรับประจำเดือน และอัตราการเข้าพัก",
      primaryLink: { label: "เข้าสู่หน้าแดชบอร์ด", href: "/dashboard" },
      subLinks: [
        { label: "รายงานรายได้ (P21)", href: "/reports/income" },
        { label: "รายงานค้างชำระ (P23)", href: "/reports/overdue" }
      ],
      nextStep: { label: "สเต็ป 9: พอร์ทัลผู้เช่า", href: "/me" },
      permissionNote: "เจ้าของหอพักดูภาพรวมกระแสเงินสดและสถิติธุรกิจ",
    },
    {
      stepNumber: 9,
      title: "พอร์ทัลผู้เช่า (Tenant Portal)",
      icon: UserCircle2,
      role: "tenant",
      roleLabel: "เฉพาะผู้เช่า (Tenant / User)",
      roleBadgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      desc: "หน้าจอสำหรับผู้เช่า ตรวจสอบยอดบิล แนบสลิปโอนเงิน และติดตามสถานะงานซ่อม",
      primaryLink: { label: "เข้าสู่พอร์ทัลผู้เช่า", href: "/me" },
      subLinks: [
        { label: "บิล & ประวัติของฉัน (P27)", href: "/me/invoices" },
        { label: "ประวัติแจ้งซ่อมของฉัน (P28)", href: "/me/repairs" }
      ],
      nextStep: { label: "วนกลับสู่สเต็ป 1: จัดการห้อง", href: "/rooms" },
      permissionNote: "ผู้เช่าล็อกอินแล้วเห็นเฉพาะข้อมูลห้องและบิลของตนเองเท่านั้น",
    },
  ];

  // กรองตามสิทธิ์
  const filteredSteps = steps.filter((s) => {
    if (activeRole === "all") return true;
    if (activeRole === "admin") return s.role === "admin" || s.role === "both";
    if (activeRole === "tenant") return s.role === "tenant" || s.role === "both";
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. ตัวเลือกสลับมุมมองสิทธิ์ (Role Switcher Tabs) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">จำลองมุมมองสิทธิ์ (Role-Based View)</span>
          <h3 className="text-sm font-bold text-slate-800 mt-0.5">เลือกบทบาทเพื่อดูว่าหน้าไหนใครมีสิทธิ์เข้าถึงบ้าง:</h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveRole("all")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === "all"
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> ทั้งหมด (9 สเต็ป)
          </button>
          <button
            onClick={() => setActiveRole("admin")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === "admin"
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> มุมมอง Admin / Staff (8 สเต็ป)
          </button>
          <button
            onClick={() => setActiveRole("tenant")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === "tenant"
                ? "bg-teal-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Unlock className="w-3.5 h-3.5" /> มุมมองผู้เช่า (User / Tenant)
          </button>
        </div>
      </div>

      {/* 2. ไดอะแกรมแถบลำดับขั้นตอน (Visual Step Sequence Bar) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[700px]">
          {steps.map((st, idx) => {
            const isMatch = activeRole === "all" || 
              (activeRole === "admin" && (st.role === "admin" || st.role === "both")) ||
              (activeRole === "tenant" && (st.role === "tenant" || st.role === "both"));

            return (
              <div key={st.stepNumber} className="flex items-center gap-2 flex-1">
                <Link
                  href={st.primaryLink.href}
                  className={`flex-1 p-2.5 rounded-xl border text-center transition-all group ${
                    isMatch 
                      ? "bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50" 
                      : "opacity-35 bg-slate-100 border-slate-200 grayscale"
                  }`}
                >
                  <span className="text-[10px] font-bold block text-slate-400 group-hover:text-blue-600">
                    ขั้นที่ {st.stepNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">
                    {st.title.split(" ")[0]}
                  </span>
                </Link>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. รายการการ์ดของแต่ละขั้นตอน (Step Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSteps.map((st) => {
          const Icon = st.icon;

          return (
            <div
              key={st.stepNumber}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                
                {/* Header: เลขสเต็ป & ป้ายสิทธิ์ */}
                <div className="flex items-start justify-between gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    {st.stepNumber}
                  </span>

                  {/* ป้ายสิทธิ์การใช้งาน */}
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${st.roleBadgeColor}`}>
                    {st.role === "admin" && "🛡️ Admin / Staff"}
                    {st.role === "tenant" && "👤 ผู้เช่า (User)"}
                    {st.role === "both" && "👥 ทั้งสองฝ่าย"}
                  </span>
                </div>

                {/* หัวข้อและคำอธิบาย */}
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{st.desc}</p>
                </div>

                {/* หมายเหตุด้านสิทธิ์ */}
                <div className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600 border border-slate-100 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{st.permissionNote}</span>
                </div>

              </div>

              {/* ลิงก์และปุ่มเชื่อมต่อ */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {/* ปุ่มหลักเข้าหน้างาน */}
                <Link
                  href={st.primaryLink.href}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {st.primaryLink.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* ลิงก์ย่อย (ถ้ามี) */}
                {st.subLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {st.subLinks.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* ปุ่มลัดไปสเต็ปถัดไป */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ถัดไป:</span>
                  <Link
                    href={st.nextStep.href}
                    className="font-semibold text-slate-600 hover:text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    {st.nextStep.label} &rarr;
                  </Link>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
