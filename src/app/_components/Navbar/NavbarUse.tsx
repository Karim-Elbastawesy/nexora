'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import React from 'react'




export default function NavbarUse() {
    const pathname = usePathname();
    if (pathname === "/login" || pathname === "/register") { return null; }
    return <Navbar />;
}


