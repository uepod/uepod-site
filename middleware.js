import { NextResponse } from "next/server";

export function middleware(request) {
  if (request.nextUrl.pathname === "/rho") {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/rho";
  return NextResponse.redirect(url, 307);
}

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
  ],
};
