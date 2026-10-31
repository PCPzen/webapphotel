import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PrintInvoiceClient from "./PrintInvoiceClient";
import { getThaiMonthName } from "@/lib/meters";
import { formatThaiDate } from "@/lib/invoices";

export default async function PrintSingleInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoiceId = parseInt(id, 10);

  if (isNaN(invoiceId)) {
    notFound();
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
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

  if (!invoice) {
    notFound();
  }

  const settings = await prisma.systemSetting.findFirst();
  const dormName = settings?.dormName || "หอพักสุขสบาย เพลส";
  const dormAddress = settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200";
  const dormPhone = settings?.dormPhone || "081-234-5678";
  const bankName = settings?.bankName || "ธนาคารกสิกรไทย";
  const bankAccountNo = settings?.bankAccountNo || "123-4-56789-0";
  const bankAccountName = settings?.bankAccountName || "หอพักสุขสบาย เพลส";
  const promptpayId = settings?.promptpayId || "0812345678";

  const totalAmount = Number(invoice.totalAmount);
  const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, totalAmount - paidAmount);

  const billingMonthThai = getThaiMonthName(invoice.billingMonth);
  const dueDateThai = formatThaiDate(invoice.dueDate);
  const issuedDateThai = formatThaiDate(invoice.issuedAt);

  return (
    <div className="min-h-screen bg-[#07050f] text-zinc-100 print:bg-white print:text-black print:min-h-0 print:p-0">
      <PrintInvoiceClient
        invoiceId={invoice.id}
        invoiceNo={invoice.invoiceNo}
        roomNo={invoice.contract.room.roomNo}
      />

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 shadow-2xl p-10 md:p-14 mb-16 rounded-sm print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full print:rounded-none">
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 font-serif">
                {dormName}
              </h1>
              <p className="text-xs text-zinc-600 mt-0.5">
                {dormAddress} | โทรศัพท์: {dormPhone}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 rounded">
                เลขที่: {invoice.invoiceNo}
              </span>
              <p className="text-xs text-zinc-500 mt-1">วันที่ออกบิล: {issuedDateThai}</p>
            </div>
          </div>

          <div className="text-center mt-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-900 underline underline-offset-4">
              ใบแจ้งหนี้ค่าเช่าและสาธารณูปโภค
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              รอบประจำเดือน {billingMonthThai} (MONTHLY INVOICE)
            </p>
          </div>
        </div>

        {/* Customer & Room Information */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded bg-zinc-50 border border-zinc-200 text-xs mb-6">
          <div>
            <p className="text-zinc-500">ข้อมูลผู้เช่า:</p>
            <p className="text-sm font-bold text-zinc-950 mt-0.5">
              คุณ {invoice.contract.tenant.firstName} {invoice.contract.tenant.lastName}
            </p>
            <p className="text-zinc-700 mt-0.5">โทรศัพท์: {invoice.contract.tenant.phone}</p>
            {invoice.contract.tenant.coTenantName && (
              <p className="text-zinc-600 text-[11px]">
                ผู้พักร่วม: {invoice.contract.tenant.coTenantName}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-zinc-500">ห้องพักที่เช่า:</p>
            <p className="text-sm font-black text-zinc-950 mt-0.5">
              ห้อง {invoice.contract.room.roomNo} (ชั้น {invoice.contract.room.floor})
            </p>
            <p className="text-zinc-700 mt-0.5">ประเภท: {invoice.contract.room.roomType}</p>
            <p className="text-rose-600 font-bold mt-1">
              กำหนดชำระภายใน: <u>{dueDateThai}</u>
            </p>
          </div>
        </div>

        {/* Itemized Table (BR-05) */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y-2 border-zinc-900 bg-zinc-100 text-zinc-900 font-bold">
                <th className="py-2 px-3 text-center w-12 border border-zinc-300">ลำดับ</th>
                <th className="py-2 px-3 border border-zinc-300">รายการค่าใช้จ่าย</th>
                <th className="py-2 px-3 text-center border border-zinc-300 w-48">รายละเอียดการคำนวณ</th>
                <th className="py-2 px-3 text-right border border-zinc-300 w-32">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. ค่าเช่า */}
              <tr className="border-b border-zinc-200">
                <td className="py-2.5 px-3 text-center font-mono border border-zinc-200">1</td>
                <td className="py-2.5 px-3 border border-zinc-200 font-semibold">
                  ค่าเช่าห้องพักประจำเดือน {billingMonthThai}
                </td>
                <td className="py-2.5 px-3 text-center border border-zinc-200 text-zinc-500">
                  อัตราคงที่ตามสัญญา
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold border border-zinc-200">
                  {Number(invoice.rentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* 2. ค่าน้ำ */}
              <tr className="border-b border-zinc-200">
                <td className="py-2.5 px-3 text-center font-mono border border-zinc-200">2</td>
                <td className="py-2.5 px-3 border border-zinc-200 font-semibold">
                  ค่าน้ำประปา
                </td>
                <td className="py-2.5 px-3 text-center border border-zinc-200 font-mono text-[11px] text-zinc-600">
                  {invoice.meterReading.waterPrev} → {invoice.meterReading.waterCurr} ({invoice.waterUnits} หน่วย @฿{Number(invoice.contract.waterRate)})
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold border border-zinc-200">
                  {Number(invoice.waterAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* 3. ค่าไฟ */}
              <tr className="border-b border-zinc-200">
                <td className="py-2.5 px-3 text-center font-mono border border-zinc-200">3</td>
                <td className="py-2.5 px-3 border border-zinc-200 font-semibold">
                  ค่ากระแสไฟฟ้า
                </td>
                <td className="py-2.5 px-3 text-center border border-zinc-200 font-mono text-[11px] text-zinc-600">
                  {invoice.meterReading.elecPrev} → {invoice.meterReading.elecCurr} ({invoice.electricUnits} หน่วย @฿{Number(invoice.contract.electricRate)})
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold border border-zinc-200">
                  {Number(invoice.electricAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* 4. ค่าอื่น ๆ */}
              {Number(invoice.otherAmount) > 0 && (
                <tr className="border-b border-zinc-200">
                  <td className="py-2.5 px-3 text-center font-mono border border-zinc-200">4</td>
                  <td className="py-2.5 px-3 border border-zinc-200 font-semibold">
                    ค่าบริการอื่น ๆ {invoice.otherNote ? `(${invoice.otherNote})` : ""}
                  </td>
                  <td className="py-2.5 px-3 text-center border border-zinc-200 text-zinc-500">
                    ค่าบริการเพิ่มเติม
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold border border-zinc-200">
                    {Number(invoice.otherAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* 5. ค่าปรับ */}
              {Number(invoice.lateFee) > 0 && (
                <tr className="border-b border-zinc-200 bg-amber-50">
                  <td className="py-2.5 px-3 text-center font-mono border border-zinc-200">#</td>
                  <td className="py-2.5 px-3 border border-zinc-200 font-bold text-amber-900">
                    ค่าปรับชำระเกินกำหนด (BR-09)
                  </td>
                  <td className="py-2.5 px-3 text-center border border-zinc-200 text-amber-800 text-[11px]">
                    คิดค่าปรับตามอัตราในสัญญา
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold border border-zinc-200 text-amber-900">
                    {Number(invoice.lateFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* Totals */}
              <tr className="border-t-2 border-zinc-900 bg-zinc-50">
                <td colSpan={3} className="py-2.5 px-3 text-right font-bold border border-zinc-200">
                  รวมยอดเรียกเก็บสุทธิทั้งสิ้น
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-sm border border-zinc-200 text-zinc-950">
                  ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {paidAmount > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-emerald-700 font-bold border border-zinc-200">
                      ยอดที่ชำระแล้ว
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 border border-zinc-200">
                      -฿{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-zinc-100">
                    <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-rose-700 border border-zinc-200">
                      ยอดคงเหลือที่ต้องชำระ
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-rose-700 border border-zinc-200">
                      ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Bank Transfer Details & Notice Box */}
        <div className="grid grid-cols-2 gap-4 border border-zinc-300 rounded p-4 text-xs mb-8">
          <div>
            <p className="font-bold text-zinc-900 mb-1">🏦 ช่องทางการชำระเงิน (โอนผ่านธนาคาร):</p>
            <p>
              ธนาคาร: <strong>{bankName}</strong>
            </p>
            <p>
              เลขที่บัญชี: <strong className="font-mono text-sm">{bankAccountNo}</strong>
            </p>
            <p>
              ชื่อบัญชี: <strong>{bankAccountName}</strong>
            </p>
            {promptpayId && (
              <p className="mt-1 text-zinc-600">
                พร้อมเพย์ (PromptPay): <span className="font-mono font-bold">{promptpayId}</span>
              </p>
            )}
          </div>

          <div className="border-l border-zinc-200 pl-4 text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-900">⚠️ หมายเหตุและข้อกำหนด:</p>
            <p>• กรุณาชำระเงินภายในวันที่ <strong>{dueDateThai}</strong></p>
            <p>• หากชำระล่าช้ากว่ากำหนด จะมีค่าปรับวันละ {Number(invoice.contract.lateFee)} บาท ตามที่ระบุในสัญญาเช่า</p>
            <p>• เมื่อโอนเงินแล้ว กรุณาส่งสลิปหลักฐานการโอนมายังสำนักงานหอพัก หรือแจ้งผ่านไลน์</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้ออกใบแจ้งหนี้</p>
            <p className="font-bold text-zinc-900">({dormName})</p>
            <p className="text-[10px] text-zinc-500">เจ้าหน้าที่ / ฝ่ายจัดการหอพัก</p>
          </div>

          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้รับใบแจ้งหนี้</p>
            <p className="font-bold text-zinc-900">
              (คุณ {invoice.contract.tenant.firstName} {invoice.contract.tenant.lastName})
            </p>
            <p className="text-[10px] text-zinc-500">ผู้เช่าห้องพัก {invoice.contract.room.roomNo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
