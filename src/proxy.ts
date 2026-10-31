import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// Route Protection & Role-Based Access Control (RBAC Proxy - Next.js 16)
// แยกสิทธิ์ 3 บทบาทชัดเจน:
// 1. Unauthenticated (ยังไม่ล็อกอิน) -> เข้าได้เฉพาะ / และ /login
// 2. Tenant (ผู้เช่า) -> เข้าได้เฉพาะ /me/* และหน้าพิมพ์ใบแจ้งหนี้/ใบเสร็จของตนเอง
// 3. Staff (เจ้าหน้าที่) -> เข้าหน้าจัดการหอพักได้ทั้งหมด ยกเว้น /admin/users
// 4. Admin (ผู้ดูแลระบบ) -> เข้าได้ทุกหน้า 100%
// -----------------------------------------------------------------------------
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get("webhotel_user_role")?.value;

  const isPublicRoute = pathname === "/" || pathname.startsWith("/login");

  // 1. หากยังไม่ได้ล็อกอิน (ไม่มี roleCookie) และพยายามเข้าหน้าภายใน -> ส่งไปหน้า Login (/)
  if (!roleCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. หากล็อกอินเป็น "ผู้เช่า" (tenant)
  if (roleCookie === "tenant") {
    const isAllowedPrintPage =
      /^\/invoices\/\d+\/print$/.test(pathname) ||
      /^\/payments\/\d+\/receipt$/.test(pathname);

    const isTenantRoute =
      pathname === "/me" ||
      pathname.startsWith("/me/") ||
      isAllowedPrintPage ||
      isPublicRoute;

    // ห้ามเข้าหน้าฝั่ง Admin/Staff ทั้งหมด -> ดีดกลับไป /me
    if (!isTenantRoute) {
      return NextResponse.redirect(new URL("/me", request.url));
    }
  }

  // 3. หากล็อกอินเป็น "เจ้าหน้าที่" (staff) -> ห้ามเข้าหน้าจัดการผู้ใช้และตั้งค่าระบบ (/admin/*)
  if (roleCookie === "staff") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
