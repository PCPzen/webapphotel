import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session-core";

// -----------------------------------------------------------------------------
// Route Protection & Role-Based Access Control (RBAC Proxy - Next.js 16)
// ตรวจสอบสิทธิ์จาก Signed Session Token (HMAC-SHA256) ป้องกันการปลอมแปลง Cookie 100%
// แยกสิทธิ์ 3 บทบาทชัดเจน:
// 1. Unauthenticated (ยังไม่ล็อกอิน) -> เข้าได้เฉพาะ / และ /login
// 2. Tenant (ผู้เช่า) -> เข้าได้เฉพาะ /me/* และหน้าพิมพ์ใบแจ้งหนี้/ใบเสร็จของตนเอง
// 3. Staff (เจ้าหน้าที่) -> เข้าหน้าจัดการหอพักได้ทั้งหมด ยกเว้น /admin/users
// 4. Admin (ผู้ดูแลระบบ) -> เข้าได้ทุกหน้า 100%
// -----------------------------------------------------------------------------
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublicRoute = pathname === "/" || pathname.startsWith("/login");

  // 1. หากยังไม่ได้ล็อกอิน (ไม่มี Signed Session หรือ Session ไม่ถูกต้อง) และพยายามเข้าหน้าภายใน -> ส่งไปหน้า Login (/)
  if (!session && !isPublicRoute) {
    const response = NextResponse.redirect(new URL("/", request.url));
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete("webhotel_user_role");
      response.cookies.delete("webhotel_tenant_id");
    }
    return response;
  }

  // 2. หากล็อกอินอยู่แล้ว และเข้าหน้า Login หรือหน้าแรก -> พาไปยังหน้าหลักตามสิทธิ์ทันที
  if (session && isPublicRoute) {
    if (session.role === "tenant") {
      return NextResponse.redirect(new URL("/me", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. หากล็อกอินเป็น "ผู้เช่า" (tenant)
  if (session?.role === "tenant") {
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

  // 4. หากล็อกอินเป็น "เจ้าหน้าที่" (staff) -> ห้ามเข้าหน้าจัดการผู้ใช้และตั้งค่าระบบ (/admin/*)
  if (session?.role === "staff") {
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
