"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, Users, FileText, Gauge, Receipt, CreditCard, 
  Wrench, BarChart3, UserCircle2, ArrowRight, ShieldAlert, 
  CheckCircle2, Lock, Unlock, Eye, Sparkles, Shield, User
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
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      desc: "คำนวณเงินอัตโนมัติจากยูนิตมิเตอร์และออกบิลรายเดือน (BR-05)",
      primaryLink: { label: "เข้ารายการใบแจ้งหนี้", href: "/invoices" },
      subLinks: [{ label: "คำนวณ & ออกบิลพร้อมกัน (P14)", href: "/invoices/generate" }],
      nextStep: { label: "สเต็ป 6: รับชำระเงิน", href: "/payments" },
      permissionNote: "เจ้าหน้าที่ออกบิลรวม / ผู้เช่าดูเฉพาะบิลของห้องตนเอง",
    },
    {
      stepNumber: 6,
      title: "ระบบรับชำระเงิน & ใบเสร็จ (Payments)",
      icon: CreditCard,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
      roleBadgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      desc: "ผู้เช่าแจ้งปัญหาซ่อมแซม เจ้าหน้าที่มอบหมายช่าง และสรุปค่าใช้จ่าย (UR-2.19)",
      primaryLink: { label: "เข้าจัดการงานแจ้งซ่อม", href: "/repairs" },
      subLinks: [{ label: "+ แจ้งซ่อมใหม่ (P19)", href: "/repairs/new" }],
      nextStep: { label: "สเต็ป 8: รายงานสรุป", href: "/dashboard" },
      permissionNote: "ผู้เช่าสร้างงานซ่อมของห้องตนเองได้ / เจ้าหน้าที่คุมสถานะ",
    },
    {
      stepNumber: 8,
      title: "แดชบอร์ด & รายงานสรุป (Dashboard & Reports)",
      icon: BarChart3,
      role: "admin",
      roleLabel: "ผู้ดูแลระบบ (Admin / Staff)",
      roleBadgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      desc: "ภาพรวมรายรับ อัตราการเข้าพัก หนี้ค้างชำระ และสถิติต่างๆ (UR-2.22)",
      primaryLink: { label: "เข้าหน้าแดชบอร์ดหลัก", href: "/dashboard" },
      subLinks: [
        { label: "รายงานรายได้", href: "/reports/income" },
        { label: "อัตราเข้าพัก", href: "/reports/occupancy" },
        { label: "หนี้ค้างชำระ", href: "/reports/overdue" },
      ],
      nextStep: { label: "สเต็ป 9: พอร์ทัลผู้เช่า", href: "/me" },
      permissionNote: "สำหรับผู้บริหารและเจ้าหน้าที่ดูสถิติทางการเงินเชิงลึก",
    },
    {
      stepNumber: 9,
      title: "พอร์ทัลผู้เช่า (Tenant Portal & Auth)",
      icon: UserCircle2,
      role: "tenant",
      roleLabel: "สำหรับผู้เช่า (Tenant)",
      roleBadgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      desc: "หน้าบริการตนเองของผู้เช่า: ดูบิลค่าเช่า ตรวจสอบสถานะการซ่อม (UR-2.24)",
      primaryLink: { label: "เข้าสู่พอร์ทัลผู้เช่า (/me)", href: "/me" },
      subLinks: [
        { label: "บิลของฉัน", href: "/me/invoices" },
        { label: "แจ้งซ่อมห้องฉัน", href: "/me/repairs" },
      ],
      nextStep: { label: "วนรอบการทำงาน (สเต็ป 4 มิเตอร์)", href: "/meters" },
      permissionNote: "ผู้เช่าล็อกอินเห็นเฉพาะข้อมูลห้องและประวัติของตนเองเท่านั้น",
    },
  ];

  const filteredSteps = steps.filter((st) => {
    if (activeRole === "all") return true;
    if (activeRole === "admin") return st.role === "admin" || st.role === "both";
    if (activeRole === "tenant") return st.role === "tenant" || st.role === "both";
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0b1120] border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Eye className="w-4 h-4 text-blue-400" />
          <span>กรองตามสิทธิ์การใช้งาน (RBAC):</span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveRole("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRole === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            ทั้งหมด (9 สเต็ป)
          </button>
          <button
            onClick={() => setActiveRole("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRole === "admin"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Admin / Staff
          </button>
          <button
            onClick={() => setActiveRole("tenant")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRole === "tenant"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            ผู้เช่า (Tenant)
          </button>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSteps.map((st) => {
          const Icon = st.icon;

          return (
            <div
              key={st.stepNumber}
              className="bg-[#0b1120] rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/20 transition-all group"
            >
              <div className="space-y-3">
                
                {/* Header: เลขสเต็ป & ป้ายสิทธิ์ */}
                <div className="flex items-start justify-between gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {st.stepNumber}
                  </span>

                  {/* ป้ายสิทธิ์การใช้งาน */}
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${st.roleBadgeColor}`}>
                    {st.role === "admin" && "Admin / Staff"}
                    {st.role === "tenant" && "ผู้เช่า (User)"}
                    {st.role === "both" && "ทั้งสองฝ่าย"}
                  </span>
                </div>

                {/* หัวข้อและคำอธิบาย */}
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                </div>

                {/* หมายเหตุด้านสิทธิ์ */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 text-[11px] text-slate-300 border border-slate-800 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{st.permissionNote}</span>
                </div>

              </div>

              {/* ลิงก์และปุ่มเชื่อมต่อ */}
              <div className="space-y-2 pt-3 border-t border-slate-800 mt-4">
                {/* ปุ่มหลักเข้าหน้างาน */}
                <Link
                  href={st.primaryLink.href}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/40 transition-colors flex items-center justify-center gap-1.5"
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
                        className="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* ปุ่มลัดไปสเต็ปถัดไป */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>ถัดไป:</span>
                  <Link
                    href={st.nextStep.href}
                    className="font-semibold text-slate-400 hover:text-blue-400 hover:underline inline-flex items-center gap-0.5"
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
