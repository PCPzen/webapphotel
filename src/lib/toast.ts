import { cookies } from "next/headers";

export type ToastType = "success" | "error" | "info" | "warning";

export async function setToastCookie(message: string, type: ToastType = "success") {
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "webhotel_toast",
      encodeURIComponent(JSON.stringify({ message, type })),
      {
        path: "/",
        maxAge: 15,
        httpOnly: false,
        sameSite: "lax",
      }
    );
  } catch (e) {
    // ignore if called outside request context
  }
}
