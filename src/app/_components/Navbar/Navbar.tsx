'use client'

import { ChevronRight, Menu, X, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

/* ─── User avatar dropdown ─── */
function UserMenu({ user }: { user: { name?: string | null; image?: string | null; email?: string | null; username?: string } }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <motion.button
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-300"
                style={{ border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.05)' }}
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? 'User'}
                        width={28}
                        height={28}
                        className="rounded-full ring-1 ring-cyan-400/30"
                    />
                ) : (
                    <div className="w-7 h-7 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
                <span className="text-zinc-300 text-sm font-mono hidden lg:block">
                    {user.username ?? user.name}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight size={14} className="text-zinc-500 rotate-90" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                        style={{
                            background: 'rgba(9,9,11,0.95)',
                            border: '1px solid rgba(39,39,42,0.8)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.04)',
                        }}
                    >
                        <div className="px-4 py-3 border-b border-zinc-800">
                            <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-zinc-500 text-xs font-mono truncate mt-0.5">
                                @{user.username ?? '—'}
                            </p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth' })}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 group"
                        >
                            <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                            Sign out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Navbar ─── */
export default function Navbar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { data: session, status } = useSession()

    const regTabs = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Activity', href: '/activity' },
        { name: 'Projects', href: '/projects' },
        { name: 'Insights', href: '/insights' },
    ]

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 w-full flex justify-between items-center p-5 z-50 backdrop-blur-md transition-all duration-500 ${scrolled
                ? 'bg-black/95 border-b border-cyan-400/10 shadow-[0_1px_0_rgba(34,211,238,0.08)]'
                : 'bg-black/80 border-b border-zinc-900'
                }`}
        >
            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-6 items-center">
                {regTabs.map((tab, i) => {
                    const isActive = pathname === tab.href
                    return (
                        <motion.div
                            key={tab.name}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                            className="relative"
                        >
                            <Link
                                href={tab.href}
                                className={`relative pb-1 transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${isActive ? 'text-cyan-400 font-semibold' : 'text-zinc-400 hover:text-indigo-400'
                                    }`}
                            >
                                {tab.name}
                                {isActive && (
                                    <motion.span
                                        layoutId="activeIndicator"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-cyan-400"
                                        style={{ boxShadow: '0 0 8px #22d3ee, 0 0 16px rgba(34,211,238,0.4)' }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        </motion.div>
                    )
                })}
            </div>

            {/* Logo */}
            <Link href="/" className="md:absolute md:left-1/2 md:-translate-x-1/2">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="tracking-widest text-2xl md:text-3xl text-cyan-400 font-black uppercase hover:-translate-y-0.5 transition-transform duration-300 ease-in-out"
                    style={{ textShadow: '0 0 15px rgba(34,211,238,0.3)' }}
                >
                    <NexoraShimmer />
                </motion.h1>
            </Link>

            {/* Desktop Right */}
            <div className="hidden md:flex gap-4 items-center">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42, duration: 0.5, ease: 'easeOut' }}
                >
                    {status === 'loading' ? (
                        <div className="w-24 h-9 rounded-xl bg-zinc-800/50 animate-pulse" />
                    ) : session?.user ? (
                        <UserMenu user={session.user as { name?: string | null; image?: string | null; email?: string | null; username?: string }} />
                    ) : (
                        <Link
                            href="/auth"
                            className="px-4 group flex gap-2 items-center rounded-2xl text-white font-semibold py-2 transition-all duration-300 hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
                            style={{
                                background: 'linear-gradient(135deg, #06b6d4, #6366f1, #06b6d4)',
                                backgroundSize: '200% 200%',
                                animation: 'gradientShift 3s ease infinite',
                            }}
                        >
                            Join Now!
                            <ChevronRight className="group-hover:translate-x-1 transition-transform duration-200 ease-in-out" height={20} width={20} />
                        </Link>
                    )}
                </motion.div>
            </div>

            {/* Mobile Toggle */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="md:hidden text-zinc-400 hover:text-cyan-400 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <X height={28} width={28} />
                        </motion.div>
                    ) : (
                        <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Menu height={28} width={28} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ originY: 0 }}
                        className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-zinc-900 flex flex-col items-center py-6 gap-6 md:hidden shadow-2xl"
                    >
                        {regTabs.map((tab, i) => {
                            const isActive = pathname === tab.href
                            return (
                                <motion.div
                                    key={tab.name}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07, duration: 0.3, ease: 'easeOut' }}
                                >
                                    <Link
                                        href={tab.href}
                                        onClick={() => setOpen(false)}
                                        className={`text-xl transition-all duration-300 ease-in-out ${isActive
                                            ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                                            : 'text-zinc-400 hover:text-indigo-400'
                                            }`}
                                    >
                                        {tab.name}
                                    </Link>
                                </motion.div>
                            )
                        })}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.32 }}
                            className="flex flex-col gap-4 items-center w-full mt-4 border-t border-zinc-800 pt-6 px-6"
                        >
                            {session?.user ? (
                                <button
                                    onClick={() => { signOut({ callbackUrl: '/auth' }); setOpen(false) }}
                                    className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors text-sm font-mono"
                                >
                                    <LogOut size={14} />
                                    Sign out
                                </button>
                            ) : (
                                <Link
                                    href="/auth"
                                    onClick={() => setOpen(false)}
                                    className="w-full max-w-xs group flex justify-center gap-2 items-center rounded-2xl text-white font-semibold py-3 hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-all duration-300 text-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #06b6d4, #6366f1, #06b6d4)',
                                        backgroundSize: '200% 200%',
                                        animation: 'gradientShift 3s ease infinite',
                                    }}
                                >
                                    Join Now!
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform duration-200 ease-in-out" height={20} width={20} />
                                </Link>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes gradientShift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </motion.nav>
    )
}

function NexoraShimmer() {
    return (
        <motion.span
            animate={{ opacity: [1, 0.88, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block' }}
        >
            Nexora
        </motion.span>
    )
}