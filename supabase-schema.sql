-- ==============================================================================
-- ระบบจัดการหอพัก (Web Hotel / Dormitory Management System)
-- Full PostgreSQL / Supabase Schema (พร้อมระบบแนบสลิป & Seed Data เริ่มต้น)
-- สามารถคัดลอกไฟล์นี้ไปวางใน SQL Editor ของ Supabase แล้วกด "Run" ได้ทันที
-- ==============================================================================

-- 1. สร้าง ENUM Types
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('admin', 'staff', 'tenant');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RoomStatus" AS ENUM ('vacant', 'occupied', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContractStatus" AS ENUM ('active', 'ended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('unpaid', 'partial', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bank_transfer', 'deposit_offset', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('valid', 'voided');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RepairCategory" AS ENUM ('electric', 'plumbing', 'aircon', 'furniture', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RepairPriority" AS ENUM ('low', 'normal', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "RepairStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. สร้างตารางทั้งหมด (Tables)
-- ------------------------------------------------------------------------------

-- ตารางที่ 1: การตั้งค่ากลางของหอพัก (System Settings)
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" SERIAL NOT NULL,
    "dorm_name" VARCHAR(120) NOT NULL DEFAULT 'หอพักสุขสบาย เพลส',
    "dorm_address" TEXT,
    "dorm_phone" VARCHAR(20),
    "bank_name" VARCHAR(60),
    "bank_account_no" VARCHAR(30),
    "bank_account_name" VARCHAR(100),
    "promptpay_id" VARCHAR(20),
    "default_water_rate" DECIMAL(8,2) NOT NULL DEFAULT 18.00,
    "default_electric_rate" DECIMAL(8,2) NOT NULL DEFAULT 8.00,
    "default_late_fee" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "default_due_day" SMALLINT NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 2: โปรไฟล์ผู้ใช้และบทบาท (Profiles)
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(120) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'tenant',
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 3: ข้อมูลห้องพัก (Rooms)
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" SERIAL NOT NULL,
    "room_no" VARCHAR(10) NOT NULL,
    "floor" SMALLINT NOT NULL,
    "room_type" VARCHAR(30) NOT NULL,
    "base_rent" DECIMAL(10,2) NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'vacant',
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 4: ข้อมูลผู้เช่า (Tenants)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" SERIAL NOT NULL,
    "auth_user_id" UUID,
    "id_card_no" CHAR(13) NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "last_name" VARCHAR(60) NOT NULL,
    "birth_date" DATE NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "email" VARCHAR(120),
    "line_id" VARCHAR(50),
    "vehicle_info" VARCHAR(100),
    "co_tenant_name" VARCHAR(120),
    "address" TEXT NOT NULL,
    "emergency_name" VARCHAR(120) NOT NULL,
    "emergency_phone" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 5: สัญญาเช่า (Contracts)
CREATE TABLE IF NOT EXISTS "contracts" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "monthly_rent" DECIMAL(10,2) NOT NULL,
    "deposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "water_rate" DECIMAL(8,2) NOT NULL,
    "electric_rate" DECIMAL(8,2) NOT NULL,
    "late_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "due_day" SMALLINT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'active',
    "moved_out_date" DATE,
    "damage_amount" DECIMAL(10,2) DEFAULT 0,
    "deposit_applied" DECIMAL(10,2) DEFAULT 0,
    "deposit_refund" DECIMAL(10,2) DEFAULT 0,
    "exit_note" TEXT,
    "start_water_meter" INTEGER DEFAULT 0,
    "start_electric_meter" INTEGER DEFAULT 0,
    "key_count" INTEGER DEFAULT 1,
    "key_card_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 6: การจดเลขมิเตอร์น้ำและไฟฟ้า (Meter Readings)
CREATE TABLE IF NOT EXISTS "meter_readings" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "reading_month" DATE NOT NULL,
    "water_prev" INTEGER NOT NULL,
    "water_curr" INTEGER NOT NULL,
    "elec_prev" INTEGER NOT NULL,
    "elec_curr" INTEGER NOT NULL,
    "read_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "recorded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 7: ใบแจ้งหนี้รายเดือน (Invoices) - รองรับระบบแนบสลิป
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "meter_reading_id" INTEGER NOT NULL,
    "invoice_no" VARCHAR(30) NOT NULL,
    "billing_month" DATE NOT NULL,
    "rent_amount" DECIMAL(10,2) NOT NULL,
    "water_units" INTEGER NOT NULL,
    "water_amount" DECIMAL(10,2) NOT NULL,
    "electric_units" INTEGER NOT NULL,
    "electric_amount" DECIMAL(10,2) NOT NULL,
    "other_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "other_note" VARCHAR(200),
    "late_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'unpaid',
    "slip_url" TEXT,
    "slip_uploaded_at" TIMESTAMPTZ,
    "slip_note" VARCHAR(200),
    "slip_status" VARCHAR(20) DEFAULT 'not_submitted',
    "slip_rejected_reason" TEXT,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 8: การรับชำระเงินและใบเสร็จ (Payments)
CREATE TABLE IF NOT EXISTS "payments" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "receipt_no" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slip_image_url" TEXT,
    "receipt_pdf_url" TEXT,
    "reference_note" VARCHAR(200),
    "status" "PaymentStatus" NOT NULL DEFAULT 'valid',
    "void_reason" TEXT,
    "voided_by" UUID,
    "voided_at" TIMESTAMPTZ,
    "received_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- ตารางที่ 9: การแจ้งซ่อมแซมและบำรุงรักษา (Repair Requests)
CREATE TABLE IF NOT EXISTS "repair_requests" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "tenant_id" INTEGER,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "category" "RepairCategory" NOT NULL,
    "priority" "RepairPriority" NOT NULL DEFAULT 'normal',
    "status" "RepairStatus" NOT NULL DEFAULT 'open',
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" VARCHAR(120),
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cost" DECIMAL(10,2) DEFAULT 0,
    "resolution_note" TEXT,
    "created_by" UUID,

    CONSTRAINT "repair_requests_pkey" PRIMARY KEY ("id")
);

-- 3. สร้าง Unique Indexes
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_key" ON "profiles"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "rooms_room_no_key" ON "rooms"("room_no");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_auth_user_id_key" ON "tenants"("auth_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_id_card_no_key" ON "tenants"("id_card_no");
CREATE UNIQUE INDEX IF NOT EXISTS "meter_readings_room_id_reading_month_key" ON "meter_readings"("room_id", "reading_month");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_meter_reading_id_key" ON "invoices"("meter_reading_id");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_no_key" ON "invoices"("invoice_no");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_contract_id_billing_month_key" ON "invoices"("contract_id", "billing_month");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_receipt_no_key" ON "payments"("receipt_no");

-- 4. ผูก Foreign Keys
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE "tenants" 
    ADD CONSTRAINT "tenants_auth_user_id_fkey" 
    FOREIGN KEY ("auth_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "contracts" 
    ADD CONSTRAINT "contracts_room_id_fkey" 
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "contracts" 
    ADD CONSTRAINT "contracts_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "meter_readings" 
    ADD CONSTRAINT "meter_readings_room_id_fkey" 
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" 
    ADD CONSTRAINT "invoices_contract_id_fkey" 
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" 
    ADD CONSTRAINT "invoices_meter_reading_id_fkey" 
    FOREIGN KEY ("meter_reading_id") REFERENCES "meter_readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "payments" 
    ADD CONSTRAINT "payments_invoice_id_fkey" 
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "repair_requests" 
    ADD CONSTRAINT "repair_requests_room_id_fkey" 
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "repair_requests" 
    ADD CONSTRAINT "repair_requests_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 5. ข้อมูลตั้งต้นระบบ (Initial Seed Data)
-- ------------------------------------------------------------------------------

-- ตั้งค่ากลางของหอพัก
INSERT INTO "system_settings" (
    "id", "dorm_name", "dorm_address", "dorm_phone", 
    "bank_name", "bank_account_no", "bank_account_name", "promptpay_id", 
    "default_water_rate", "default_electric_rate", "default_late_fee", "default_due_day"
) VALUES (
    1, 
    'หอพักสุขสบาย เพลส', 
    '123 หมู่ 1 ต.เวียง อ.เมือง จ.เชียงใหม่', 
    '081-234-5678', 
    'ธนาคารกสิกรไทย', 
    '123-4-56789-0', 
    'บจก. หอพักสุขสบาย', 
    '0812345678', 
    18.00, 
    8.00, 
    50.00, 
    5
) ON CONFLICT ("id") DO NOTHING;

-- บัญชีผู้ดูแลระบบ (Admin) และเจ้าหน้าที่ (Staff) เริ่มต้น
INSERT INTO "profiles" ("email", "full_name", "role", "is_active")
VALUES 
    ('admin@webhotel.com', 'ผู้ดูแลระบบสูงสุด (System Admin)', 'admin', true),
    ('staff@webhotel.com', 'เจ้าหน้าที่นิติบุคคล (Staff)', 'staff', true)
ON CONFLICT ("email") DO NOTHING;
