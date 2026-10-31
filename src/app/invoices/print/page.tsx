import { notFound } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { parseReadingMonth, getThaiMonthName } from "@/lib/meters";
import { formatThaiDate } from "@/lib/invoices";

export default async function PrintBatchInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = month || defaultMonthStr;
  const billingMonth = parseReadingMonth(monthStr);

  const invoices = await prisma.invoice.findMany({
    where: {
      billingMonth,
      status: { not: "cancelled" },
    },
    orderBy: [
      { contract: { room: { floor: "asc" } } },
      { contract: { room: { roomNo: "asc" } } },
    ],
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
      meterReading: true,
      payments: {
        where: { status: "valid" },
      },
    },
  });

  const settings = await prisma.systemSetting.findFirst();
  const dormName = settings?.dormName || "หอพักสุขสบาย เพลส";
  const dormAddress = settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200";
  const dormPhone = settings?.dormPhone || "081-234-5678";
  const bankName = settings?.bankName || "ธนาคารกสิกรไทย";
  const bankAccountNo = settings?.bankAccountNo || "123-4-56789-0";
  const bankAccountName = settings?.bankAccountName || "หอพักสุขสบาย เพลส";
  const promptpayId = settings?.promptpayId || "0812345678";

  const billingMonthThai = getThaiMonthName(billingMonth);

  return (
    <div className="min-h-screen bg-[#07050f] text-zinc-100 print:bg-white print:text-black print:min-h-0 print:p-0">
      {/* Top Floating Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-[#0c0a18]/90 backdrop-blur-md border-b border-violet-950/80 px-6 py-3.5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/invoices?month=${monthStr}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 text-xs font-bold border border-violet-800/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้ารายการใบแจ้งหนี้
          </Link>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            พิมพ์ใบแจ้งหนี้ทั้งเดือน: <strong className="text-white">{billingMonthThai}</strong> ({invoices.length} ห้อง)
          </span>
        </div>

        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-violet-950/60 transition-all hover:scale-105"
        >
          <Printer className="w-4 h-4" />
          สั่งพิมพ์ทั้งหมด ({invoices.length} ฉบับ)
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="max-w-md mx-auto p-12 text-center text-zinc-400 bg-[#120f24] rounded-3xl border border-violet-950 mt-12">
          <p className="text-sm font-bold text-white">ไม่มีใบแจ้งหนี้ในรอบเดือน {billingMonthThai}</p>
          <Link
            href={`/invoices/generate?month=${monthStr}`}
            className="inline-block mt-4 text-xs text-emerald-400 font-bold hover:underline"
          >
            ไปที่หน้าออกใบแจ้งหนี้ประจำเดือน →
          </Link>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {invoices.map((invoice, index) => {
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const balance = Math.max(0, totalAmount - paidAmount);
            const dueDateThai = formatThaiDate(invoice.dueDate);
            const issuedDateThai = formatThaiDate(invoice.issuedAt);

            return (
              <div
                key={invoice.id}
                className="max-w-[210mm] mx-auto bg-white text-zinc-900 shadow-2xl p-8 md:p-12 rounded-sm print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full print:rounded-none print:break-after-page"
              >
                {/* Document Header */}
                <div className="border-b-2 border-zinc-900 pb-3 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-lg font-bold tracking-tight text-zinc-950 font-serif">
                        {dormName}
                      </h1>
                      <p className="text-[11px] text-zinc-600">
                        {dormAddress} | โทร: {dormPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 rounded">
                        เลขที่: {invoice.invoiceNo}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">วันที่ออกบิล: {issuedDateThai}</p>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 underline underline-offset-4">
                      ใบแจ้งหนี้ค่าเช่าและสาธารณูปโภค
                    </h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      รอบประจำเดือน {billingMonthThai} (MONTHLY INVOICE)
                    </p>
                  </div>
                </div>

                {/* Info block */}
                <div className="grid grid-cols-2 gap-4 p-3 rounded bg-zinc-50 border border-zinc-200 text-xs mb-4">
                  <div>
                    <p className="text-zinc-500 text-[10px]">ผู้เช่า:</p>
                    <p className="font-bold text-zinc-950">
                      คุณ {invoice.contract.tenant.firstName} {invoice.contract.tenant.lastName}
                    </p>
                    <p className="text-zinc-700 text-[11px]">โทร: {invoice.contract.tenant.phone}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-zinc-500 text-[10px]">ห้องพัก:</p>
                    <p className="font-black text-zinc-950 text-sm">
                      ห้อง {invoice.contract.room.roomNo} (ชั้น {invoice.contract.room.floor})
                    </p>
                    <p className="text-rose-600 font-bold text-[11px]">
                      ครบกำหนดชำระ: {dueDateThai}
                    </p>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left border-collapse text-[11px] mb-4">
                  <thead>
                    <tr className="border-y-2 border-zinc-900 bg-zinc-100 font-bold text-zinc-900">
                      <th className="py-1.5 px-2 text-center w-8 border border-zinc-300">#</th>
                      <th className="py-1.5 px-2 border border-zinc-300">รายการ</th>
                      <th className="py-1.5 px-2 text-center border border-zinc-300 w-44">การคำนวณ</th>
                      <th className="py-1.5 px-2 text-right border border-zinc-300 w-28">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="py-1.5 px-2 text-center font-mono border border-zinc-200">1</td>
                      <td className="py-1.5 px-2 border border-zinc-200 font-semibold">ค่าเช่าห้องพัก</td>
                      <td className="py-1.5 px-2 text-center border border-zinc-200 text-zinc-500">อัตราตามสัญญา</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-zinc-200">
                        {Number(invoice.rentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-1.5 px-2 text-center font-mono border border-zinc-200">2</td>
                      <td className="py-1.5 px-2 border border-zinc-200 font-semibold">ค่าน้ำประปา</td>
                      <td className="py-1.5 px-2 text-center border border-zinc-200 font-mono text-[10px] text-zinc-600">
                        {invoice.meterReading.waterPrev} → {invoice.meterReading.waterCurr} ({invoice.waterUnits} หน่วย @฿{Number(invoice.contract.waterRate)})
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-zinc-200">
                        {Number(invoice.waterAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-1.5 px-2 text-center font-mono border border-zinc-200">3</td>
                      <td className="py-1.5 px-2 border border-zinc-200 font-semibold">ค่าไฟฟ้า</td>
                      <td className="py-1.5 px-2 text-center border border-zinc-200 font-mono text-[10px] text-zinc-600">
                        {invoice.meterReading.elecPrev} → {invoice.meterReading.elecCurr} ({invoice.electricUnits} หน่วย @฿{Number(invoice.contract.electricRate)})
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-zinc-200">
                        {Number(invoice.electricAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {Number(invoice.otherAmount) > 0 && (
                      <tr className="border-b border-zinc-200">
                        <td className="py-1.5 px-2 text-center font-mono border border-zinc-200">4</td>
                        <td className="py-1.5 px-2 border border-zinc-200 font-semibold">
                          ค่าอื่น ๆ {invoice.otherNote ? `(${invoice.otherNote})` : ""}
                        </td>
                        <td className="py-1.5 px-2 text-center border border-zinc-200 text-zinc-500">ค่าบริการเพิ่มเติม</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold border border-zinc-200">
                          {Number(invoice.otherAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    {Number(invoice.lateFee) > 0 && (
                      <tr className="border-b border-zinc-200 bg-amber-50">
                        <td className="py-1.5 px-2 text-center font-mono border border-zinc-200">#</td>
                        <td className="py-1.5 px-2 border border-zinc-200 font-bold text-amber-900">ค่าปรับชำระล่าช้า (BR-09)</td>
                        <td className="py-1.5 px-2 text-center border border-zinc-200 text-amber-800 text-[10px]">คิดค่าปรับตามสัญญา</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold border border-zinc-200 text-amber-900">
                          {Number(invoice.lateFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-zinc-900 bg-zinc-50 font-bold">
                      <td colSpan={3} className="py-2 px-2 text-right border border-zinc-200">ยอดรวมสุทธิทั้งสิ้น</td>
                      <td className="py-2 px-2 text-right font-mono font-black border border-zinc-200 text-zinc-950 text-xs">
                        ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {paidAmount > 0 && (
                      <tr className="bg-zinc-100 font-bold text-rose-700">
                        <td colSpan={3} className="py-1.5 px-2 text-right border border-zinc-200">ยอดคงเหลือที่ต้องชำระ</td>
                        <td className="py-1.5 px-2 text-right font-mono font-black border border-zinc-200 text-xs">
                          ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Footer notes & Bank */}
                <div className="grid grid-cols-2 gap-4 border border-zinc-300 rounded p-2.5 text-[10px] mb-4">
                  <div>
                    <p className="font-bold text-zinc-900">🏦 โอนชำระเงินได้ที่:</p>
                    <p>ธนาคาร {bankName} • บัญชี <strong className="font-mono text-zinc-950">{bankAccountNo}</strong></p>
                    <p>ชื่อบัญชี {bankAccountName}</p>
                    {promptpayId && <p>พร้อมเพย์: <strong className="font-mono">{promptpayId}</strong></p>}
                  </div>
                  <div className="border-l border-zinc-200 pl-3 text-zinc-600">
                    <p className="font-bold text-zinc-900">⚠️ กำหนดชำระ:</p>
                    <p>กรุณาชำระภายในวันที่ <strong>{dueDateThai}</strong></p>
                    <p>หากล่าช้าจะมีค่าปรับวันละ {Number(invoice.contract.lateFee)} บาท ตามระเบียบสัญญา</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6 text-center text-[10px] pt-2">
                  <div>
                    <p className="pb-6">ลงชื่อ............................................................ ผู้ออกบิล</p>
                    <p className="font-bold text-zinc-900">({dormName})</p>
                  </div>
                  <div>
                    <p className="pb-6">ลงชื่อ............................................................ ผู้รับบิล</p>
                    <p className="font-bold text-zinc-900">(คุณ {invoice.contract.tenant.firstName} {invoice.contract.tenant.lastName})</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
