import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ระบบบริหารจัดการหอพัก | หอพักสุขสบาย เพลส",
  description:
    "ระบบบริหารจัดการหอพักครบวงจร ผังห้องพัก ทะเบียนผู้เช่า สัญญาเช่า จดมิเตอร์น้ำ-ไฟ ใบแจ้งหนี้ ใบเสร็จรับเงิน แจ้งซ่อมบำรุง และพอร์ทัลผู้เช่าออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0c0a18] text-slate-100">
        {children}
      </body>
    </html>
  );
}
