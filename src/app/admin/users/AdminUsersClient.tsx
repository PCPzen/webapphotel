"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Users,
  Settings,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Building,
  CreditCard,
  Droplet,
  Zap,
  Calendar,
  Save,
  Phone,
  Mail,
  Shield,
  User,
} from "lucide-react";
import {
  createStaffProfile,
  updateUserProfile,
  deleteUserProfile,
  updateSystemSettings,
} from "@/actions/users";
import { formatThaiDate } from "@/lib/invoices";
import { handleEmojiInput } from "@/lib/emoji";

export type ProfileItem = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "staff" | "tenant";
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type SystemSettingsData = {
  id?: number;
  dormName: string;
  dormAddress: string;
  dormPhone: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  promptpayId: string;
  defaultWaterRate: number;
  defaultElectricRate: number;
  defaultLateFee: number;
  defaultDueDay: number;
};

export default function AdminUsersClient({
  profiles,
  settings,
}: {
  profiles: ProfileItem[];
  settings: SystemSettingsData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"users" | "settings">("users");

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);

  // Add form fields
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");

  // Edit form fields
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff" | "tenant">("staff");
  const [editIsActive, setEditIsActive] = useState(true);

  // Settings form fields
  const [dormName, setDormName] = useState(settings.dormName);
  const [dormAddress, setDormAddress] = useState(settings.dormAddress);
  const [dormPhone, setDormPhone] = useState(settings.dormPhone);
  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccountNo, setBankAccountNo] = useState(settings.bankAccountNo);
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName);
  const [promptpayId, setPromptpayId] = useState(settings.promptpayId);
  const [defaultWaterRate, setDefaultWaterRate] = useState(settings.defaultWaterRate.toString());
  const [defaultElectricRate, setDefaultElectricRate] = useState(settings.defaultElectricRate.toString());
  const [defaultLateFee, setDefaultLateFee] = useState(settings.defaultLateFee.toString());
  const [defaultDueDay, setDefaultDueDay] = useState(settings.defaultDueDay.toString());

  // Handle Add User
  const handleAddUser = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("fullName", newFullName);
      fd.append("email", newEmail);
      fd.append("phone", newPhone);
      fd.append("role", newRole);

      const res = await createStaffProfile({}, fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || "เพิ่มผู้ใช้เรียบร้อย");
        setShowAddModal(false);
        setNewFullName("");
        setNewEmail("");
        setNewPhone("");
        router.refresh();
      }
    });
  };

  // Open Edit Modal
  const openEdit = (p: ProfileItem) => {
    setSelectedProfile(p);
    setEditFullName(p.fullName);
    setEditPhone(p.phone || "");
    setEditRole(p.role);
    setEditIsActive(p.isActive);
    setShowEditModal(true);
  };

  // Handle Edit User
  const handleEditUser = () => {
    if (!selectedProfile) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("fullName", editFullName);
      fd.append("phone", editPhone);
      fd.append("role", editRole);
      fd.append("isActive", editIsActive ? "true" : "false");

      const res = await updateUserProfile(selectedProfile.id, fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || "อัปเดตผู้ใช้เรียบร้อย");
        setShowEditModal(false);
        router.refresh();
      }
    });
  };

  // Handle Delete User
  const handleDeleteUser = () => {
    if (!selectedProfile) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await deleteUserProfile(selectedProfile.id);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || "ลบผู้ใช้เรียบร้อย");
        setShowDeleteModal(false);
        router.refresh();
      }
    });
  };

  // Handle Save Settings
  const handleSaveSettings = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("dormName", dormName);
      fd.append("dormAddress", dormAddress);
      fd.append("dormPhone", dormPhone);
      fd.append("bankName", bankName);
      fd.append("bankAccountNo", bankAccountNo);
      fd.append("bankAccountName", bankAccountName);
      fd.append("promptpayId", promptpayId);
      fd.append("defaultWaterRate", defaultWaterRate);
      fd.append("defaultElectricRate", defaultElectricRate);
      fd.append("defaultLateFee", defaultLateFee);
      fd.append("defaultDueDay", defaultDueDay);

      const res = await updateSystemSettings(fd);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || "บันทึกการตั้งค่าเรียบร้อยแล้ว");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            การจัดการผู้ใช้และตั้งค่าระบบ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            จัดการบัญชีเจ้าหน้าที่ กำหนดสิทธิ์ และตั้งค่าอัตราค่าน้ำไฟ-บัญชีรับเงินของหอพัก
          </p>
        </div>

        {activeTab === "users" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>เพิ่มเจ้าหน้าที่</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:text-rose-100">
            ปิด
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs hover:text-emerald-100">
            ปิด
          </button>
        </div>
      )}

      {/* Main Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950/60"
              : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>บัญชีผู้ใช้และเจ้าหน้าที่ ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "settings"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950/60"
              : "bg-[#0b1120] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าระบบหอพัก และอัตราบริการ</span>
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS */}
      {activeTab === "users" && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">รายชื่อผู้ใช้งานทั้งหมดในระบบ</h2>
            <span className="text-xs text-slate-400">บทบาท: Admin, Staff, Tenant</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a] text-slate-300 border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3">อีเมล</th>
                  <th className="py-3 px-3">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-3 text-center">บทบาท</th>
                  <th className="py-3 px-3 text-center">สถานะใช้งาน</th>
                  <th className="py-3 px-3">วันที่สร้าง</th>
                  <th className="py-3 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {p.fullName.charAt(0)}
                      </div>
                      <span>{p.fullName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{p.email}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{p.phone || "-"}</td>
                    <td className="py-3 px-3 text-center">
                      {p.role === "admin" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Admin (ผู้ดูแลระบบ)
                        </span>
                      )}
                      {p.role === "staff" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          Staff (เจ้าหน้าที่)
                        </span>
                      )}
                      {p.role === "tenant" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Tenant (ผู้เช่า)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          ระงับใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{formatThaiDate(p.createdAt)}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg bg-[#080c15] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfile(p);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#080c15] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors"
                          title="ลบผู้ใช้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลผู้ใช้งาน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dormitory Info */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" /> ข้อมูลทั่วไปของหอพัก
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อหอพัก / อาคาร</label>
                  <input
                    type="text"
                    value={dormName}
                    onInput={handleEmojiInput}
                    onChange={(e) => setDormName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ที่อยู่หอพัก</label>
                  <textarea
                    rows={2}
                    value={dormAddress}
                    onInput={handleEmojiInput}
                    onChange={(e) => setDormAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">เบอร์โทรศัพท์สำนักงาน</label>
                  <input
                    type="text"
                    value={dormPhone}
                    onInput={handleEmojiInput}
                    onChange={(e) => setDormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bank & Payment Info */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" /> ข้อมูลบัญชีรับชำระเงิน
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อธนาคาร</label>
                  <input
                    type="text"
                    value={bankName}
                    onInput={handleEmojiInput}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="เช่น ธนาคารกสิกรไทย"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">เลขที่บัญชี</label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onInput={handleEmojiInput}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="xxx-x-xxxxx-x"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">พร้อมเพย์ ID</label>
                    <input
                      type="text"
                      value={promptpayId}
                      onInput={handleEmojiInput}
                      onChange={(e) => setPromptpayId(e.target.value)}
                      placeholder="เบอร์โทรหรือเลขบัตร"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อบัญชีรับโอน</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onInput={handleEmojiInput}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rates & Billing Policy */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" /> อัตราค่าน้ำ-ไฟ และกำหนดการออกบิลเริ่มต้น
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ค่าน้ำประปา (บาท/หน่วย)</label>
                <div className="relative">
                  <Droplet className="w-3.5 h-3.5 absolute left-3 top-2.5 text-sky-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaultWaterRate}
                    onChange={(e) => setDefaultWaterRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ค่าไฟฟ้า (บาท/หน่วย)</label>
                <div className="relative">
                  <Zap className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaultElectricRate}
                    onChange={(e) => setDefaultElectricRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ค่าปรับชำระล่าช้า (บาท)</label>
                <div className="relative">
                  <span className="text-xs absolute left-3 top-2 text-rose-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={defaultLateFee}
                    onChange={(e) => setDefaultLateFee(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">วันครบกำหนด (Due Day)</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-blue-400" />
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={defaultDueDay}
                    onChange={(e) => setDefaultDueDay(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">วันที่ของเดือนถัดไป (เช่น 5)</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> บันทึกการตั้งค่าทั้งหมด
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STAFF */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" /> เพิ่มเจ้าหน้าที่ / ผู้ดูแลใหม่
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={newFullName}
                  onInput={handleEmojiInput}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">อีเมลสำหรับเข้าสู่ระบบ</label>
                <input
                  type="email"
                  value={newEmail}
                  onInput={handleEmojiInput}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@dormitory.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={newPhone}
                  onInput={handleEmojiInput}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0812345678"
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">บทบาท (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="staff" className="bg-[#0b1120]">Staff (เจ้าหน้าที่ทั่วไป)</option>
                  <option value="admin" className="bg-[#0b1120]">Admin (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddUser}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-400" /> แก้ไขข้อมูลผู้ใช้
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">อีเมล</label>
                <input
                  type="text"
                  disabled
                  value={selectedProfile.email}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-800 text-slate-500 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={editFullName}
                  onInput={handleEmojiInput}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={editPhone}
                  onInput={handleEmojiInput}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">บทบาท (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="admin" className="bg-[#0b1120]">Admin (ผู้ดูแลระบบ)</option>
                  <option value="staff" className="bg-[#0b1120]">Staff (เจ้าหน้าที่)</option>
                  <option value="tenant" className="bg-[#0b1120]">Tenant (ผู้เช่า)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#080c15] border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-200 font-medium">
                  เปิดให้เข้าใช้งานระบบ (Active)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleEditUser}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE USER */}
      {showDeleteModal && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" /> ยืนยันการลบผู้ใช้
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              ต้องการลบบัญชีผู้ใช้ <strong>{selectedProfile.fullName}</strong> ({selectedProfile.email}) ออกจากระบบหรือไม่ การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "ยืนยันลบผู้ใช้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
