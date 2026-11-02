import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PrintContractClient from "./PrintContractClient";

function formatThaiDate(date: Date) {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${d} ${m} ${y}`;
}

function formatThaiIdDisplay(id: string) {
  if (id.length !== 13) return id;
  return `${id[0]}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id[12]}`;
}

export default async function PrintContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractId = parseInt(id, 10);

  if (isNaN(contractId)) {
    notFound();
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      room: true,
      tenant: true,
    },
  });

  if (!contract) {
    notFound();
  }

  const settings = await prisma.systemSetting.findFirst();
  const dormName = settings?.dormName || "หอพักสุขสบาย เพลส";
  const dormAddress = settings?.dormAddress || "123 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200";
  const dormPhone = settings?.dormPhone || "081-234-5678";

  const contractNo = `CTR-${String(contract.id).padStart(5, "0")}`;
  const contractDateThai = formatThaiDate(contract.createdAt);
  const startDateThai = formatThaiDate(contract.startDate);
  const endDateThai = formatThaiDate(contract.endDate);

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 print:bg-white print:text-black print:min-h-0 print:p-0">
      <PrintContractClient contractId={contract.id} roomNo={contract.room.roomNo} />

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
              <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 rounded">
                เลขที่สัญญา: {contractNo}
              </span>
              <p className="text-xs text-zinc-500 mt-1">วันที่ทำสัญญา: {contractDateThai}</p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-bold uppercase tracking-wide text-zinc-900 underline underline-offset-4">
              หนังสือสัญญาเช่าห้องพัก
            </h2>
            <p className="text-xs text-zinc-500 mt-1">DORMITORY LEASE AGREEMENT</p>
          </div>
        </div>

        {/* Contract Parties */}
        <div className="space-y-4 text-xs leading-relaxed text-zinc-800">
          <p className="indent-8 text-justify">
            สัญญานี้ทำขึ้น ณ <strong>{dormName}</strong> เมื่อวันที่ <strong>{contractDateThai}</strong> ระหว่าง{" "}
            <strong>{dormName}</strong> (ซึ่งต่อไปนี้ในสัญญาจะเรียกว่า &ldquo;<strong>ผู้ให้เช่า</strong>&rdquo;) ฝ่ายหนึ่ง กับ
          </p>

          <div className="bg-zinc-50 p-4 rounded border border-zinc-200 space-y-1.5">
            <p>
              <strong>ผู้เช่า:</strong> นาย / นาง / นางสาว{" "}
              <span className="text-sm font-bold text-zinc-950">
                {contract.tenant.firstName} {contract.tenant.lastName}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-zinc-700">
              <p>
                <strong>เลขประจำตัวประชาชน:</strong>{" "}
                <span className="font-mono">{formatThaiIdDisplay(contract.tenant.idCardNo)}</span>
              </p>
              <p>
                <strong>เบอร์โทรศัพท์:</strong> {contract.tenant.phone}
              </p>
            </div>
            <p className="text-zinc-700">
              <strong>ที่อยู่ตามทะเบียนบ้าน/บัตรประชาชน:</strong> {contract.tenant.address}
            </p>
            {contract.tenant.coTenantName && (
              <p className="text-zinc-700">
                <strong>ผู้พักอาศัยร่วม (รูมเมท):</strong> {contract.tenant.coTenantName}
              </p>
            )}
            {contract.tenant.vehicleInfo && (
              <p className="text-zinc-700">
                <strong>ยานพาหนะ / ทะเบียนรถ:</strong> {contract.tenant.vehicleInfo}
              </p>
            )}
            <p className="text-[11px] text-zinc-500">
              (ซึ่งต่อไปนี้ในสัญญาจะเรียกว่า &ldquo;<strong>ผู้เช่า</strong>&rdquo;) อีกฝ่ายหนึ่ง
            </p>
          </div>

          <p className="font-bold text-zinc-900 pt-2">
            คู่สัญญาทั้งสองฝ่ายได้ตกลงทำสัญญาเช่าห้องพัก โดยมีข้อความและเงื่อนไขดังต่อไปนี้:
          </p>

          {/* Clauses */}
          <div className="space-y-3 pt-1">
            <p className="text-justify">
              <strong>ข้อ 1. ทรัพย์สินที่เช่า:</strong> ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักเลขที่{" "}
              <strong className="underline text-sm">{contract.room.roomNo}</strong> ชั้น{" "}
              <strong>{contract.room.floor}</strong> ประเภทห้อง <strong>{contract.room.roomType}</strong> ของ{" "}
              {dormName} เพื่อใช้เป็นที่พักอาศัยส่วนบุคคลเท่านั้น ห้ามมิให้นำไปใช้เพื่อการค้า หรือประกอบกิจการอันผิดกฎหมาย
            </p>

            <p className="text-justify">
              <strong>ข้อ 2. ระยะเวลาการเช่า:</strong> สัญญาเช่ามีกำหนดระยะเวลา เริ่มตั้งแต่วันที่{" "}
              <strong>{startDateThai}</strong> ถึงวันที่ <strong>{endDateThai}</strong> เมื่อครบกำหนดเวลาดังกล่าวแล้ว
              หากผู้เช่าประสงค์จะเช่าต่อ จะต้องแจ้งให้ผู้ให้เช่าทราบล่วงหน้าเป็นลายลักษณ์อักษรไม่น้อยกว่า 30 วันก่อนสัญญาหมดอายุ
            </p>

            <p className="text-justify">
              <strong>ข้อ 3. อัตราค่าเช่าและกำหนดการชำระ:</strong> ผู้เช่าตกลงชำระค่าเช่าห้องพักในอัตราเดือนละ{" "}
              <strong className="text-sm">{Number(contract.monthlyRent).toLocaleString()} บาท</strong> (
              {Number(contract.monthlyRent).toLocaleString()} บาทถ้วน) โดยต้องชำระล่วงหน้าภายในวันที่{" "}
              <strong>{contract.dueDay}</strong> ของทุกเดือน หากผู้เช่าชำระค่าเช่าล่าช้าเกินกว่ากำหนด
              ผู้เช่ายินยอมเสียค่าปรับให้แก่ผู้ให้เช่าในอัตราวันละ{" "}
              <strong>{Number(contract.lateFee).toLocaleString()} บาท</strong> นับแต่วันที่ผิดนัดจนถึงวันที่ชำระเสร็จสิ้น
            </p>

            <p className="text-justify">
              <strong>ข้อ 4. เงินประกันความเสียหายและเงินมัดจำ:</strong> ในวันทำสัญญานี้ ผู้เช่าได้วางเงินประกันการเช่าและมัดจำไว้แก่ผู้ให้เช่าเป็นจำนวนเงิน{" "}
              <strong className="text-sm">{Number(contract.deposit).toLocaleString()} บาท</strong> โดยผู้ให้เช่าจะคืนเงินประกันนี้ให้แก่ผู้เช่าเมื่อสัญญาสิ้นสุดลง และผู้เช่าได้ส่งมอบห้องพักคืนในสภาพเรียบร้อย หลังจากหักลบค่าเสียหาย ค่าทำความสะอาด ค่าซ่อมแซม และหนี้สินค้างชำระทั้งหมดตามกฎ BR-10 แล้ว
            </p>

            <p className="text-justify">
              <strong>ข้อ 5. อัตราค่าสาธารณูปโภค (ค่าน้ำ-ค่าไฟ):</strong> ผู้เช่าตกลงชำระค่าบริการสาธารณูปโภคตามปริมาณหน่วยที่ใช้จริงในแต่ละเดือน ดังนี้:
            </p>
            <div className="grid grid-cols-2 gap-4 pl-6 text-zinc-800">
              <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                <p>
                  • <strong>ค่าน้ำประปา:</strong> หน่วยละ {Number(contract.waterRate).toLocaleString()} บาท
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  (เลขมิเตอร์เริ่มต้น: <span className="font-mono font-bold text-zinc-900">{contract.startWaterMeter ?? 0}</span> หน่วย)
                </p>
              </div>
              <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                <p>
                  • <strong>ค่ากระแสไฟฟ้า:</strong> หน่วยละ {Number(contract.electricRate).toLocaleString()} บาท
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  (เลขมิเตอร์เริ่มต้น: <span className="font-mono font-bold text-zinc-900">{contract.startElectricMeter ?? 0}</span> หน่วย)
                </p>
              </div>
            </div>

            <p className="text-justify">
              <strong>ข้อ 6. ทรัพย์สินและอุปกรณ์ที่ส่งมอบ:</strong> ผู้เช่าได้รับมอบกุญแจห้องพักจำนวน{" "}
              <strong>{contract.keyCount ?? 1} ดอก</strong> และบัตรคีย์การ์ด/เหรียญเข้าออกจำนวน{" "}
              <strong>{contract.keyCardCount ?? 0} ใบ</strong> ไว้ในความดูแล หากชำรุดหรือสูญหาย ผู้เช่ายินยอมชดใช้ค่าเสียหายตามอัตราที่หอพักกำหนด
            </p>

            <p className="text-justify">
              <strong>ข้อ 7. กฎระเบียบและข้อห้ามทั่วไป:</strong>
            </p>
            <ul className="list-disc pl-8 space-y-1 text-zinc-700">
              <li>ห้ามส่งเสียงดัง หรือกระทำการใดๆ อันเป็นการรบกวนความสงบสุขของผู้อื่นในอาคารหลังเวลา 22:00 น.</li>
              <li>ห้ามสูบบุหรี่ เสพสิ่งเสพติด เล่นการพนัน หรือกระทำการอันผิดกฎหมายภายในห้องพักและพื้นที่ส่วนกลางโดยเด็ดขาด</li>
              <li>ห้ามเลี้ยงสัตว์ทุกชนิดภายในห้องพัก (เว้นแต่จะได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า)</li>
              <li>ห้ามเจาะ ต่อเติม หรือดัดแปลงสภาพห้องพัก ผนัง หรือเฟอร์นิเจอร์โดยไม่ได้รับอนุญาต</li>
              <li>หากประสงค์จะย้ายออก ผู้เช่าต้องแจ้งล่วงหน้าไม่น้อยกว่า 30 วัน มิฉะนั้นจะถูกริบเงินประกันตามระเบียบ</li>
            </ul>
          </div>

          <p className="indent-8 text-justify pt-3">
            สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญานี้โดยละเอียดตลอดแล้ว
            เห็นว่าถูกต้องตรงตามเจตนา จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน และต่างยึดถือไว้ฝ่ายละหนึ่งฉบับ
          </p>

          {/* Signature Block */}
          <div className="pt-8 pb-4 grid grid-cols-2 gap-y-10 gap-x-8 text-center text-xs">
            <div className="space-y-1">
              <p className="pb-8">ลงชื่อ............................................................ ผู้ให้เช่า</p>
              <p className="font-bold text-zinc-900">({dormName})</p>
              <p className="text-[11px] text-zinc-500">ผู้มีอำนาจลงนาม / เจ้าของหอพัก</p>
            </div>

            <div className="space-y-1">
              <p className="pb-8">ลงชื่อ............................................................ ผู้เช่า</p>
              <p className="font-bold text-zinc-900">
                ({contract.tenant.firstName} {contract.tenant.lastName})
              </p>
              <p className="text-[11px] text-zinc-500">ผู้เช่าห้องพัก {contract.room.roomNo}</p>
            </div>

            <div className="space-y-1">
              <p className="pb-8">ลงชื่อ............................................................ พยาน</p>
              <p className="text-zinc-600">( ............................................................ )</p>
            </div>

            <div className="space-y-1">
              <p className="pb-8">ลงชื่อ............................................................ พยาน</p>
              <p className="text-zinc-600">( ............................................................ )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
