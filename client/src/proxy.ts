import { Role } from "@/constants/type";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { TokenPayload } from "@/types/jwt.types";
import createMiddleware from "next-intl/middleware";
import { defaultLocale } from "@/config";
import { routing } from "@/i18n/routing";
const decodeToken = (token: string) => {
  return jwt.decode(token) as TokenPayload;
};

const managePaths = ["/vi/manage", "/en/manage"];
const guestPaths = ["/vi/guest", "/en/guest"];
const onlyOwnerPaths = ["/vi/manage/accounts", "/en/manage/accounts"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/vi/login", "/en/login"];
const loginPaths = ["/vi/login", "/en/login"];

export function proxy(request: NextRequest) {
  const handleI18nRouting = createMiddleware(routing);
  const response = handleI18nRouting(request);
  const { pathname, searchParams } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const locale = request.cookies.get("NEXT_LOCALE")?.value ?? defaultLocale;
  // If no login, redirect to login page
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL(`/${locale}/login`, request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  // If have login
  if (refreshToken) {
    // If enter login page but already have token, redirect to home page
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      if (loginPaths.some((path) => pathname.startsWith(path)) && searchParams.get("accessToken")) {
        return response;
      }
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // accessToken expired, redirect to refresh token
    if (privatePaths.some((path) => pathname.startsWith(path)) && !accessToken) {
      const url = new URL(`/${locale}/refresh-token`, request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check role
    const role = decodeToken(refreshToken).role;
    // Guest but enter manage path
    const isGuestGoToManagePath = role === Role.Guest && managePaths.some((path) => pathname.startsWith(path));
    // Not Guest but enter guest path
    const isNotGuestGoToGuestPath = role !== Role.Guest && guestPaths.some((path) => pathname.startsWith(path));
    // Not Owner but enter only owner path
    const isNotOwnerGoToOwnerPath = role !== Role.Owner && onlyOwnerPaths.some((path) => pathname.startsWith(path));
    if (isGuestGoToManagePath || isNotGuestGoToGuestPath || isNotOwnerGoToOwnerPath) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    return response;
  }
  return response;
}

export const config = {
  matcher: ["/", "/(vi|en)/:path*"],
};
