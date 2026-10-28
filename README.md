# 🏢 ระบบจัดการหอพัก (Dormitory Management System)

เว็บแอปพลิเคชันบริหารจัดการหอพักเต็มรูปแบบ พัฒนาขึ้นสำหรับรายวิชา **การพัฒนาระบบฐานข้อมูล (31903-2011)** สอดคล้องตามข้อกำหนดในเอกสาร **Software Requirements Document (SRD v1.0)** ครอบคลุมทั้งฝั่งผู้ดูแลระบบ (Admin/Staff) และผู้เช่า (Tenant/User)

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend & Backend Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **ORM & Database Client:** [Prisma 6.19.3](https://www.prisma.io/)
- **Database & Cloud Platform:** [Supabase](https://supabase.com/) (PostgreSQL Tokyo Region, Supavisor Connection Pooling)
- **Authentication & Storage:** Supabase Auth & Supabase Storage
- **Icons:** Lucide React

---

## 📋 แผนผังลำดับขั้นตอนการทำงาน (9-Step Implementation Roadmap)

ระบบถูกออกแบบให้ทำงานต่อเนื่องกันเป็นลำดับขั้น พร้อมแยกสิทธิ์การใช้งาน (RBAC):

1. **สเต็ป 1: ระบบจัดการห้องพัก (Rooms Management)** `[Admin / Staff]`
   - รายการห้องพัก (`/rooms`), เพิ่มห้องใหม่ (`/rooms/new`), ดูและแก้ไขห้อง (`/rooms/[id]`)
   - กฎ BR-03: ตรวจสอบเลขห้องซ้ำ, ค่าเช่ามาตรฐาน > 0 บาท, ป้องกันการเปลี่ยนสถานะขณะมีสัญญา
2. **สเต็ป 2: ระบบทะเบียนผู้เช่า (Tenants Management)** `[Admin / Staff]`
   - รายชื่อผู้เช่า (`/tenants`), ลงทะเบียนผู้เช่า (`/tenants/new`)
   - กฎ BR-01: ตรวจสอบเลขบัตรประชาชน 13 หลักด้วย Modulo 11 Checksum และการ Masking ตาม PDPA
3. **สเต็ป 3: ระบบสัญญาเช่า (Contracts Management)** `[Admin / Staff]`
   - ทำสัญญาเช่า (`/contracts/new`), คืนมัดจำ, กฎ BR-02 (ล็อก 1 ห้องมีได้ 1 สัญญา Active)
4. **สเต็ป 4: ระบบจดมิเตอร์น้ำ-ไฟ (Meters Management)** `[Admin / Staff]`
   - ตารางจดเลขมิเตอร์ประจำเดือน (`/meters`), กฎ BR-04 (เลขใหม่ ≥ เลขเก่า)
5. **สเต็ป 5: ระบบใบแจ้งหนี้ (Invoices Management)** `[Admin / Staff]`
   - คำนวณบิลค่าน้ำ-ไฟ และออกใบแจ้งหนี้รายเดือนอัตโนมัติ (`/invoices`), กฎ BR-05 (Decimal Half-Up)
6. **สเต็ป 6: ระบบรับชำระเงิน & ใบเสร็จ (Payments & Receipts)** `[Admin / Staff]`
   - ตรวจสอบสลิปโอนเงิน และออกใบเสร็จรับเงินเลขที่ RCP (`/payments`), กฎ BR-08, BR-11
7. **สเต็ป 7: ระบบแจ้งซ่อมแซม (Repairs Management)** `[ทั้งสองฝ่าย Admin & User]`
   - ผู้เช่าแจ้งซ่อม (`/repairs/new`) และแอดมินมอบหมายช่าง (`/repairs`)
8. **สเต็ป 8: แดชบอร์ด & รายงานสรุป (Dashboard & Analytics)** `[Admin / Staff]`
   - สรุปรายรับ-รายจ่าย, อัตราการเข้าพัก, และรายงานหนี้ค้างชำระ (`/dashboard`, `/reports/...`)
9. **สเต็ป 9: พอร์ทัลผู้เช่า & ระบบล็อกอิน (Tenant Portal & Auth)** `[เฉพาะผู้เช่า User]`
   - พอร์ทัลส่วนตัวสำหรับผู้เช่าดูบิลและติดตามสถานะงานซ่อม (`/me`, `/me/invoices`, `/me/repairs`)

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. โคลนคลังโค้ด (Clone Repository)
```bash
git clone https://github.com/PCPzen/webapphotel.git
cd webapphotel
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:
```bash
cp .env.example .env.local
```
จากนั้นกำหนดค่า `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 4. ซิงค์ฐานข้อมูลและสร้าง Prisma Client
```bash
npx prisma generate
```

### 5. เริ่มรันโปรเจกต์ในโหมดพัฒนา
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔒 นโยบายความปลอดภัยของข้อมูล
- ไฟล์ที่มีกุญแจและรหัสผ่าน (`.env`, `.env.local`) ได้รับการตั้งค่าให้อยู่ใน `.gitignore` เพื่อป้องกันการรั่วไหลขึ้นสู่คลังโค้ดสาธารณะ
