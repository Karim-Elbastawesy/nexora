'use client'

import { AnimatedStars } from '@/app/page'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence } from 'motion/react'
import React, { useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { Shield, Activity, GitCommit } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/* ─── Typing text hook ─── */
function useTypingText(lines: string[], speed = 38) {
    const full = lines.join('\n')
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        let i = 0
        const interval = setInterval(() => {
            if (i >= full.length) { setDone(true); clearInterval(interval); return }
            setDisplayed(full.slice(0, i + 1))
            i++
        }, speed)
        return () => clearInterval(interval)
    }, [full, speed])

    return { displayed, done }
}

/* ─── Scramble hook ─── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'
function useScramble(target: string, delay = 0) {
    const [display, setDisplay] = useState(''.padStart(target.length, '_'))
    useEffect(() => {
        let frame = 0
        const totalFrames = 18
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                if (frame >= totalFrames) { setDisplay(target); clearInterval(interval); return }
                const progress = frame / totalFrames
                const revealed = Math.floor(progress * target.length)
                setDisplay(target.split('').map((c, i) => {
                    if (c === ' ') return ' '
                    if (i < revealed) return c
                    return CHARS[Math.floor(Math.random() * CHARS.length)]
                }).join(''))
                frame++
            }, 45)
        }, delay)
        return () => clearTimeout(timeout)
    }, [target, delay])
    return display
}

/* ─── Terminal log lines ─── */
function TerminalLog() {
    const LINES = [
        '> initializing nexora auth...',
        '> scanning commit history...',
        '> behavior engine: standby',
        '> awaiting github token...',
        '> ready._',
    ]
    const { displayed } = useTypingText(LINES, 32)

    return (
        <div
            className="w-full rounded-xl p-4 mb-8 font-mono text-xs text-left overflow-hidden"
            style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(34,211,238,0.1)',
                minHeight: '108px',
            }}
        >
            {displayed.split('\n').map((line, i) => (
                <div key={i} className="leading-6">
                    {line.startsWith('>') ? (
                        <>
                            <span className="text-cyan-400/60">{'>'}</span>
                            <span className="text-zinc-400">{line.slice(1)}</span>
                        </>
                    ) : (
                        <span className="text-zinc-600">{line}</span>
                    )}
                </div>
            ))}
        </div>
    )
}

/* ─── Permission pill ─── */
function PermissionPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono text-zinc-500"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <Icon size={12} className="text-cyan-400/60" />
            {label}
        </div>
    )
}

/* ─── Main Page ─── */
export default function LoginPage() {
    const [isConnecting, setIsConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const headline = useScramble('IDENTIFY YOURSELF', 1200)
    const { data: session, status } = useSession()
    const router = useRouter()

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/')
        }
    }, [status, router])

    const handleConnect = async () => {
        try {
            setIsConnecting(true)
            setError(null)
            await signIn('github', { callbackUrl: '/dashboard' })
            // signIn redirects — connected state shown briefly before redirect
            setConnected(true)
        } catch (err) {
            setError('Authentication failed. Try again.')
            setIsConnecting(false)
        }
    }

    return (
        <section className="relative w-full min-h-svh flex items-center justify-center overflow-hidden bg-black py-32">

            {/* Star field */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <Canvas camera={{ position: [0, 0, 1] }}>
                    <AnimatedStars />
                </Canvas>
            </div>

            {/* Radial glow */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute z-0 pointer-events-none rounded-full"
                style={{
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* Scan lines */}
            <div
                className="absolute inset-0 z-10 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)' }}
            />

            {/* ─── Card ─── */}
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-20 max-w-md w-full mx-5 rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(9,9,11,0.85)',
                    border: '1px solid rgba(39,39,42,0.8)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 0 0 1px rgba(34,211,238,0.04), 0 40px 80px rgba(0,0,0,0.6)',
                }}
            >
                {/* Top cyan line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 right-0 h-px origin-left"
                    style={{ background: 'linear-gradient(to right, transparent, #22d3ee, rgba(99,102,241,0.6), transparent)' }}
                />

                <div className="p-10">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-center mb-6"
                    >
                        <span
                            className="text-cyan-400 font-mono text-[10px] tracking-[0.35em] uppercase font-semibold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}
                        >
                            ◈ System Gateway
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="font-black text-3xl md:text-4xl text-white mb-3 tracking-tighter uppercase text-center leading-none"
                    >
                        {headline}
                    </motion.h1>

                    {/* Divider */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="w-16 h-px mx-auto mb-5 origin-center"
                        style={{ background: 'linear-gradient(to right, transparent, #22d3ee, transparent)' }}
                    />

                    {/* Subtext */}
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.85 }}
                        className="text-zinc-500 text-sm mb-8 leading-relaxed text-center"
                    >
                        Nexora requires read-access to your commit history.{' '}
                        <span className="text-zinc-300">We track. We judge.</span>{' '}
                        We do not write code for you.
                    </motion.p>

                    {/* Terminal */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                    >
                        <TerminalLog />
                    </motion.div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-4 px-4 py-2 rounded-lg text-xs font-mono text-red-400 text-center"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                ✕ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Connect button */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        className="relative"
                    >
                        <motion.button
                            onClick={handleConnect}
                            disabled={isConnecting || connected || status === 'loading'}
                            whileHover={!isConnecting && !connected ? { scale: 1.02, y: -2 } : {}}
                            whileTap={!isConnecting && !connected ? { scale: 0.98 } : {}}
                            className="relative w-full flex justify-center items-center gap-3 py-4 rounded-xl font-bold text-base overflow-hidden transition-all duration-500"
                            style={{
                                background: connected
                                    ? 'rgba(34,211,238,0.1)'
                                    : isConnecting
                                        ? 'rgba(255,255,255,0.04)'
                                        : 'rgba(255,255,255,0.06)',
                                border: connected
                                    ? '1px solid rgba(34,211,238,0.4)'
                                    : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: connected ? '0 0 24px rgba(34,211,238,0.2)' : 'none',
                            }}
                        >
                            {/* Hover fill */}
                            <motion.span
                                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(99,102,241,0.08))' }}
                            />

                            <AnimatePresence mode="wait">
                                {connected ? (
                                    <motion.span
                                        key="connected"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-cyan-400"
                                    >
                                        <Activity size={16} />
                                        <span className="font-mono text-sm tracking-widest">ACCESS GRANTED</span>
                                    </motion.span>
                                ) : isConnecting ? (
                                    <motion.span
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 text-zinc-400"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-t border-cyan-400 rounded-full"
                                        />
                                        <span className="font-mono text-xs tracking-widest">AUTHENTICATING...</span>
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 text-white"
                                    >
                                        <FaGithub className="text-xl" />
                                        Connect GitHub
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </motion.div>

                    {/* Permissions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="mt-5 flex flex-wrap justify-center gap-2"
                    >
                        <PermissionPill icon={GitCommit} label="read:commits" />
                        <PermissionPill icon={Shield} label="read:repos" />
                        <PermissionPill icon={Activity} label="read:activity" />
                    </motion.div>

                    {/* Footer note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="mt-6 text-center text-zinc-700 text-xs font-mono"
                    >
                        No write access. No BS. Read-only.
                    </motion.p>

                </div>

                {/* Bottom fade line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-px opacity-30"
                    style={{ background: 'linear-gradient(to right, transparent, #22d3ee44, transparent)' }}
                />
            </motion.div>

        </section>
    )
}