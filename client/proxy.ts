import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 로그인 여부 체크 (예시: 쿠키에 토큰이 있는지)
  const token = req.cookies.get("access_token")?.value;

  // 2. 특정 페이지 접근 제어
  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/chat" : "/signin", req.url));
  }

  if (pathname.startsWith("/chat") && !token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if ((pathname.startsWith("/signin") || pathname.startsWith("/signup")) && token) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // 통과
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signup/:path*", "/signin/:path*", "/chat/:path*"],
};
