import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PrintReceiptClient from "./PrintReceiptClient";
import { thaiBahtText, formatPaymentMethod } from "@/lib/payments";
import { getThaiMonthName } from "@/lib/meters";
import { formatThaiDate } from "@/lib/invoices";

export default async function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paymentId = parseInt(id, 10);

  if (isNaN(paymentId)) {
    notFound();
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          contract: {
            include: {
              room: true,
              tenant: true,
            },
          },
          payments: {
            where: { status: "valid" },
          },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const settings = await prisma.systemSetting.findFirst();
  const dormName = settings?.dormName || "หอพักสุขสบาย เพลส";
  const dormAddress = settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200";
  const dormPhone = settings?.dormPhone || "081-234-5678";

  const totalAmount = Number(payment.invoice.totalAmount);
  const totalPaidSum = payment.invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaidSum);

  const paymentAmount = Number(payment.amount);
  const paymentAmountThaiText = thaiBahtText(paymentAmount);
  const billingMonthThai = getThaiMonthName(payment.invoice.billingMonth);
  const paidDateThai = formatThaiDate(payment.paidAt);
  const isVoided = payment.status === "voided";

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 print:bg-white print:text-black print:min-h-0 print:p-0">
      <PrintReceiptClient
        receiptNo={payment.receiptNo}
        roomNo={payment.invoice.contract.room.roomNo}
        isVoided={isVoided}
      />

      {/* A4 Sheet Container */}
      <div className="relative max-w-[210mm] mx-auto bg-white text-zinc-900 shadow-2xl p-10 md:p-14 mb-16 rounded-sm print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full print:rounded-none overflow-hidden">
        {/* VOID WATERMARK STAMP (กฎ UR-2.20.1) */}
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
            <div className="border-8 border-red-600/60 text-red-600/60 font-black text-6xl tracking-widest uppercase p-8 rounded-3xl rotate-[-25deg] text-center shadow-lg">
              ยกเลิก / VOIDED
              <span className="block text-sm font-bold tracking-normal mt-2 text-red-700/80">
                เหตุผล: {payment.voidReason || "-"}
              </span>
              <span className="block text-xs font-normal tracking-normal text-red-700/80">
                เมื่อ {payment.voidedAt ? formatThaiDate(payment.voidedAt) : "-"}
              </span>
            </div>
          </div>
        )}

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
                เลขที่ใบเสร็จ: {payment.receiptNo}
              </span>
              <p className="text-xs text-zinc-500 mt-1">วันที่ชำระเงิน: {paidDateThai}</p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-900 underline underline-offset-4">
              ใบเสร็จรับเงิน
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">OFFICIAL RECEIPT</p>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded bg-zinc-50 border border-zinc-200 text-xs mb-6">
          <div className="space-y-1">
            <p className="text-zinc-500">ได้รับเงินจาก (ผู้เช่า):</p>
            <p className="text-sm font-bold text-zinc-950">
              คุณ {payment.invoice.contract.tenant.firstName}{" "}
              {payment.invoice.contract.tenant.lastName}
            </p>
            <p className="text-zinc-700">
              เบอร์โทรศัพท์: {payment.invoice.contract.tenant.phone}
            </p>
            <p className="text-zinc-600">
              ห้องพัก: <strong>ห้อง {payment.invoice.contract.room.roomNo}</strong> (ชั้น{" "}
              {payment.invoice.contract.room.floor}) • {payment.invoice.contract.room.roomType}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-zinc-500">อ้างอิงใบแจ้งหนี้:</p>
            <p className="font-mono font-bold text-zinc-950 text-sm">
              {payment.invoice.invoiceNo}
            </p>
            <p className="text-zinc-700">รอบประจำเดือน: {billingMonthThai}</p>
            <p className="text-zinc-600">
              วิธีการชำระ:{" "}
              <strong className="text-zinc-900">{formatPaymentMethod(payment.method)}</strong>
            </p>
            {payment.referenceNote && (
              <p className="text-zinc-500 text-[11px]">หมายเลขอ้างอิง: {payment.referenceNote}</p>
            )}
          </div>
        </div>

        {/* Payment Breakdown Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y-2 border-zinc-900 bg-zinc-100 text-zinc-900 font-bold">
                <th className="py-2.5 px-3 text-center w-12 border border-zinc-300">ลำดับ</th>
                <th className="py-2.5 px-4 border border-zinc-300">รายการรับชำระ</th>
                <th className="py-2.5 px-4 text-center border border-zinc-300 w-44">
                  รอบบิล / เลขที่เอกสาร
                </th>
                <th className="py-2.5 px-4 text-right border border-zinc-300 w-36">
                  จำนวนเงิน (บาท)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-3 px-3 text-center font-mono border border-zinc-200">1</td>
                <td className="py-3 px-4 border border-zinc-200 font-semibold text-zinc-900">
                  ชำระค่าเช่าห้องและสาธารณูปโภคประจำเดือน {billingMonthThai}
                  <span className="block text-[11px] text-zinc-500 font-normal mt-0.5">
                    (ห้อง {payment.invoice.contract.room.roomNo})
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-mono border border-zinc-200 text-zinc-600">
                  {payment.invoice.invoiceNo}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-sm border border-zinc-200 text-zinc-950">
                  {paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Amount in Words Row */}
              <tr className="border-t-2 border-zinc-900 bg-zinc-50">
                <td colSpan={2} className="py-3 px-4 border border-zinc-200 font-bold text-zinc-800">
                  จำนวนเงินตัวอักษร:{" "}
                  <span className="font-normal text-zinc-950 font-serif">
                    ({paymentAmountThaiText})
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold border border-zinc-200 text-zinc-800">
                  รวมเงินรับชำระทั้งสิ้น
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-base border border-zinc-200 text-emerald-700">
                  ฿{paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Invoice Summary After Payment */}
        <div className="border border-zinc-200 rounded p-3.5 text-xs flex justify-between items-center mb-8 bg-zinc-50/60">
          <div className="space-y-0.5 text-zinc-600">
            <p>
              ยอดรวมบิลทั้งหมด:{" "}
              <strong className="text-zinc-900">
                ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </p>
            <p>
              รวมยอดที่ชำระแล้ว:{" "}
              <strong className="text-emerald-700">
                ฿{totalPaidSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-zinc-500 text-[11px] block">ยอดคงค้างชำระของบิลนี้:</span>
            <span
              className={`font-mono text-sm font-bold ${
                remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {remainingBalance > 0
                ? `฿${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (ค้างชำระ)`
                : "฿0.00 (ชำระครบถ้วนแล้ว)"}
            </span>
          </div>
        </div>

        {/* Signatures Block */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้รับเงิน</p>
            <p className="font-bold text-zinc-900">({dormName})</p>
            <p className="text-[10px] text-zinc-500">เจ้าหน้าที่ผู้มีอำนาจลงนาม</p>
          </div>

          <div className="space-y-1">
            <p className="pb-8">ลงชื่อ............................................................ ผู้ชำระเงิน</p>
            <p className="font-bold text-zinc-900">
              (คุณ {payment.invoice.contract.tenant.firstName}{" "}
              {payment.invoice.contract.tenant.lastName})
            </p>
            <p className="text-[10px] text-zinc-500">
              ผู้เช่าห้องพัก {payment.invoice.contract.room.roomNo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
