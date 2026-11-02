import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/AppProviders";

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
    <html lang="th" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col bg-[#080c15] text-slate-100 transition-colors duration-200">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
