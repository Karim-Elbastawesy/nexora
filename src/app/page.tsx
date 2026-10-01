'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

/* ─── Animated star field with slow drift ─── */
export function AnimatedStars() {
  const ref = useRef<THREE.Points>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01
      ref.current.rotation.x += delta * 0.003
    }
  })
  return (
    <Stars
      ref={ref}
      radius={120}
      depth={60}
      count={6000}
      factor={4}
      saturation={0}
      fade
      speed={1.5}
    />
  )
}

/* ─── Cyan grid floor (perspective) ─── */
function GridFloor() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[45%] overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34,211,238,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34,211,238,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(600px) rotateX(60deg)',
          transformOrigin: 'top center',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}
      />
      {/* Horizon glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-cyan-400/20" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.6), transparent)' }}
      />
    </div>
  )
}

/* ─── Cursor-tracking glow orb ─── */
function CursorOrb() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 60, damping: 20 })
  const springY = useSpring(y, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-0"
      style={{
        x: useTransform(springX, v => v - 300),
        y: useTransform(springY, v => v - 300),
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)',
      }}
    />
  )
}

/* ─── Typing scramble hook ─── */
const CHARS = '!@#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function useScramble(target: string, delay = 0) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    let frame = 0
    let timeout: ReturnType<typeof setTimeout>
    timeout = setTimeout(() => {
      const totalFrames = 22
      const interval = setInterval(() => {
        if (frame >= totalFrames) {
          setDisplay(target)
          clearInterval(interval)
          return
        }
        const progress = frame / totalFrames
        const revealedCount = Math.floor(progress * target.length)
        setDisplay(
          target
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' '
              if (i < revealedCount) return char
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            })
            .join('')
        )
        frame++
      }, 40)
    }, delay)
    return () => { clearTimeout(timeout) }
  }, [target, delay])
  return display
}

/* ─── Glitching stat counter ─── */
function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{label}</span>
    </motion.div>
  )
}

/* ─── Scan line overlay ─── */
function ScanLines() {
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none opacity-[0.025]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        backgroundSize: '100% 3px',
      }}
    />
  )
}

/* ─── Main Hero ─── */
export default function HeroSection() {
  const line1 = useScramble('Stop Pretending', 600)
  const line2 = useScramble('You Are Consistent.', 900)
  const badge = useScramble('Behavior Engine: Online', 200)

  return (
    <section className="relative w-full min-h-svh flex items-center justify-center overflow-hidden bg-black py-32">

      {/* Layer 0: Star canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <AnimatedStars />
        </Canvas>
      </div>

      {/* Layer 1: Perspective grid */}
      <GridFloor />

      {/* Layer 2: Scan lines */}
      <ScanLines />

      {/* Layer 3: Cursor orb */}
      <CursorOrb />

      {/* Layer 4: Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_30%,#000_100%)]" />

      {/* Layer 5: Central glow behind text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute z-10 w-150 h-75 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ─── Content ─── */}
      <div className="relative z-20 flex flex-col items-center text-center px-5 max-w-5xl mx-auto mt-12">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="font-mono text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">
            {badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-4 uppercase leading-none"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          <span className="block">{line1}</span>
          <span
            className="block mt-1"
            style={{
              WebkitTextStroke: '1px rgba(113,113,122,0.6)',
              color: 'transparent',
              backgroundImage: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            {line2}
          </span>
        </motion.h1>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 h-px mb-8"
          style={{ background: 'linear-gradient(to right, transparent, #22d3ee, transparent)' }}
        />

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
          className="text-base md:text-lg text-zinc-500 mb-10 max-w-xl leading-relaxed font-light tracking-wide"
        >
          Passive dashboards don't build discipline.{' '}
          <span className="text-zinc-300 font-medium">Nexora</span> tracks your GitHub, grades your activity,
          and{' '}
          <span className="text-cyan-400/80">exposes your weaknesses</span> — without mercy.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.05, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          {/* Primary CTA */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative px-8 py-4 flex items-center gap-2 rounded-xl font-bold text-base overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,211,238,0.3)' }}
          >
            {/* Hover fill */}
            <motion.span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))' }}
            />
            <span className="relative text-white">Calculate My Score</span>
            <ChevronRight
              className="relative text-cyan-400 group-hover:translate-x-1 transition-transform duration-200"
              height={18}
              width={18}
            />
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/60" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/60" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/60" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/60" />
          </motion.button>

          {/* Secondary CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-mono tracking-widest uppercase transition-colors duration-300 flex items-center gap-2"
          >
            <span className="w-6 h-px bg-zinc-700 group-hover:bg-zinc-500 transition-colors" />
            See how it works
            <span className="w-6 h-px bg-zinc-700" />
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.25, ease: 'easeOut' }}
          className="mt-16 flex items-center gap-8 md:gap-16"
        >
          <StatCounter value="10K+" label="Devs tracked" />
          <div className="w-px h-10 bg-zinc-800" />
          <StatCounter value="98%" label="Retention rate" />
          <div className="w-px h-10 bg-zinc-800" />
          <StatCounter value="∅" label="Excuses accepted" />
        </motion.div>

      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-20 pointer-events-none bg-linear-to-t from-black to-transparent" />

      

    </section>
  )
}