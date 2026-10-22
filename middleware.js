import { NextResponse } from "next/server";

// Invisible characters that sneak into copied links (e.g. the show notes wrap
// "uepod.com/rho" in U+2060 word joiners): zero-width space/non-joiner/joiner,
// LRM/RLM, word joiner, BOM, soft hyphen.
const INVISIBLE = /[\u200B-\u200F\u2060\uFEFF\u00AD]/g;

function cleanPath(pathname) {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (err) {
    // leave as-is
  }
  return decoded.replace(INVISIBLE, "");
}

export function middleware(request) {
  if (request.nextUrl.pathname === "/rho") {
    return NextResponse.next();
  }
  const cleaned = cleanPath(request.nextUrl.pathname).replace(/\/+$/, "");
  if (cleaned.toLowerCase() !== "/rho") {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/rho";
  return NextResponse.redirect(url, 307);
}

// Percent-encoded invisible characters (UTF-8): U+200B-U+200F, U+2060, U+FEFF, U+00AD.
// Path-to-regexp patterns below only match /rho variants carrying at least one of them.
// Bare /rho never enters the middleware.

export const config = {
  matcher: [
    "/Rho",
    "/Rho/",
    "/rHo",
    "/rHo/",
    "/rhO",
    "/rhO/",
    "/RHo",
    "/RHo/",
    "/RhO",
    "/RhO/",
    "/rHO",
    "/rHO/",
    "/RHO",
    "/RHO/",
    "/rho/",
    // invisible character(s) after rho, optionally mixed with slashes
    "/:rho([rR][hH][oO](?:%E2%80%8[B-Fb-f]|%e2%80%8[b-f]|%E2%81%A0|%e2%81%a0|%EF%BB%BF|%ef%bb%bf|%C2%AD|%c2%ad|/)*(?:%E2%80%8[B-Fb-f]|%e2%80%8[b-f]|%E2%81%A0|%e2%81%a0|%EF%BB%BF|%ef%bb%bf|%C2%AD|%c2%ad)/?)",
    // invisible character(s) before rho
    "/:rho((?:%E2%80%8[B-Fb-f]|%e2%80%8[b-f]|%E2%81%A0|%e2%81%a0|%EF%BB%BF|%ef%bb%bf|%C2%AD|%c2%ad)+[rR][hH][oO](?:%E2%80%8[B-Fb-f]|%e2%80%8[b-f]|%E2%81%A0|%e2%81%a0|%EF%BB%BF|%ef%bb%bf|%C2%AD|%c2%ad|/)*)",
  ],
};
