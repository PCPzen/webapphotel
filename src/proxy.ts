import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// Route Protection & Role-Based Access Control (RBAC Proxy - Next.js 16)
// -----------------------------------------------------------------------------
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get("webhotel_user_role")?.value;

  // หากล็อกอินด้วยสิทธิ์ผู้เช่า (tenant) ห้ามเข้าถึงหน้าจัดการระบบฝั่ง Admin
  // ยกเว้นหน้าพิมพ์ใบแจ้งหนี้ (/invoices/[id]/print) และใบเสร็จ (/payments/[id]/receipt)
  if (roleCookie === "tenant") {
    const isAllowedPrintPage =
      /^\/invoices\/\d+\/print$/.test(pathname) ||
      /^\/payments\/\d+\/receipt$/.test(pathname);

    const isRestrictedAdminRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/rooms") ||
      pathname.startsWith("/tenants") ||
      pathname.startsWith("/contracts") ||
      pathname.startsWith("/meters") ||
      pathname.startsWith("/reports") ||
      (pathname.startsWith("/invoices") && !isAllowedPrintPage) ||
      (pathname.startsWith("/payments") && !isAllowedPrintPage) ||
      pathname.startsWith("/repairs");

    if (isRestrictedAdminRoute) {
      return NextResponse.redirect(new URL("/me", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
