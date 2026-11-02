const fs = require('fs');

function replaceInFile(filePath, searchStr, replaceStr) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.includes(searchStr)) {
    text = text.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, text, 'utf8');
    console.log(`[SUCCESS] Replaced in ${filePath}`);
  } else {
    // Try matching normalized line breaks
    const normText = text.replace(/\r\n/g, '\n');
    const normSearch = searchStr.replace(/\r\n/g, '\n');
    if (normText.includes(normSearch)) {
      const normReplace = replaceStr.replace(/\r\n/g, '\n');
      const updated = normText.replace(normSearch, normReplace);
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`[SUCCESS-NORM] Replaced in ${filePath}`);
    } else {
      console.error(`[NOT FOUND] In ${filePath}:\n${searchStr.substring(0, 100)}`);
    }
  }
}

// 1. invoices.ts
replaceInFile(
  'src/actions/invoices.ts',
  `    return {
      success: true,
      message: \`ออกใบแจ้งหนี้สำเร็จเรียบร้อย \${createdInvoiceIds.length} ฉบับ\`,`,
  `    await setToastCookie(\`ออกใบแจ้งหนี้สำเร็จเรียบร้อย \${createdInvoiceIds.length} ฉบับ\`, "success");
    return {
      success: true,
      message: \`ออกใบแจ้งหนี้สำเร็จเรียบร้อย \${createdInvoiceIds.length} ฉบับ\`,`
);

replaceInFile(
  'src/actions/invoices.ts',
  `    return {
      success: true,
      message: "อัปเดตค่าใช้จ่ายอื่น ๆ เรียบร้อยแล้ว",
    };`,
  `    await setToastCookie("อัปเดตค่าใช้จ่ายอื่น ๆ เรียบร้อยแล้ว", "success");
    return {
      success: true,
      message: "อัปเดตค่าใช้จ่ายอื่น ๆ เรียบร้อยแล้ว",
    };`
);

// 2. payments.ts
replaceInFile(
  'src/actions/payments.ts',
  `    return {
      success: true,
      message: "บันทึกการรับชำระเงินและออกใบเสร็จรับเงินสำเร็จ",
      paymentId: paymentResult.id,
      receiptNo,
    };`,
  `    await setToastCookie(\`บันทึกรับเงินสำเร็จ เลขที่ใบเสร็จ \${receiptNo}\`, "success");
    return {
      success: true,
      message: "บันทึกการรับชำระเงินและออกใบเสร็จรับเงินสำเร็จ",
      paymentId: paymentResult.id,
      receiptNo,
    };`
);

replaceInFile(
  'src/actions/payments.ts',
  `    return {
      success: true,
      message: \`ยกเลิกใบเสร็จรับเงิน \${payment.receiptNo} สำเร็จ\`,
    };`,
  `    await setToastCookie(\`ยกเลิกใบเสร็จรับเงิน \${payment.receiptNo} สำเร็จ\`, "info");
    return {
      success: true,
      message: \`ยกเลิกใบเสร็จรับเงิน \${payment.receiptNo} สำเร็จ\`,
    };`
);

// 3. repairs.ts
replaceInFile(
  'src/actions/repairs.ts',
  `  revalidatePath("/");
  redirect(\`/repairs/\${newRequest.id}\`);`,
  `  revalidatePath("/");
  await setToastCookie("ส่งคำขอแจ้งซ่อมสำเร็จ", "success");
  redirect(\`/repairs/\${newRequest.id}\`);`
);

replaceInFile(
  'src/actions/repairs.ts',
  `  revalidatePath("/");
  redirect(\`/repairs/\${id}\`);`,
  `  revalidatePath("/");
  await setToastCookie("อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว", "success");
  redirect(\`/repairs/\${id}\`);`
);

// 4. users.ts
replaceInFile(
  'src/actions/users.ts',
  `    return {
      success: true,
      message: \`สร้างบัญชีผู้ใช้งาน \${profile.fullName} เรียบร้อยแล้ว\`,
    };`,
  `    await setToastCookie(\`สร้างบัญชีผู้ใช้งาน \${profile.fullName} เรียบร้อยแล้ว\`, "success");
    return {
      success: true,
      message: \`สร้างบัญชีผู้ใช้งาน \${profile.fullName} เรียบร้อยแล้ว\`,
    };`
);

replaceInFile(
  'src/actions/users.ts',
  `    return {
      success: true,
      message: \`อัปเดตบทบาทของ \${profile.fullName} เป็น \${roleText} เรียบร้อยแล้ว\`,
    };`,
  `    await setToastCookie(\`อัปเดตบทบาทของ \${profile.fullName} เป็น \${roleText} เรียบร้อยแล้ว\`, "success");
    return {
      success: true,
      message: \`อัปเดตบทบาทของ \${profile.fullName} เป็น \${roleText} เรียบร้อยแล้ว\`,
    };`
);
