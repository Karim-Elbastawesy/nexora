import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    if (pathname === '/auth' || pathname === '/' || pathname === '/login' || pathname === '/register') {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith('/dashboard') && !isLoggedIn) {
        return NextResponse.redirect(new URL('/auth', req.nextUrl));
    }

    return NextResponse.next();
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}