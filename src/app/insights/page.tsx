'use client'

import { motion } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Target, Clock, Zap, BarChart3 } from 'lucide-react'
import { useGitHubData } from '@/hooks/useGitHubData'

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', CSS: '#563d7c', HTML: '#e34c26',
  Java: '#b07219', 'C++': '#f34b7d', Ruby: '#701516', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883', default: '#22d3ee',
}
const lc = (l: string) => LANG_COLORS[l] ?? LANG_COLORS.default

const iv = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }
const cv = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.09 } } }

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/40 ${className}`} />
}

function InsightCard({ icon: Icon, iconColor, title, value, sub, trend }: {
  icon: React.ElementType; iconColor: string; title: string; value: string | number; sub?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#22d3ee' : trend === 'down' ? '#f87171' : '#71717a'
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl"
      style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
      <div className="flex justify-between items-start">
        <Icon size={20} style={{ color: iconColor, filter: `drop-shadow(0 0 6px ${iconColor}66)` }} />
        {trend && <TrendIcon size={14} style={{ color: trendColor }} />}
      </div>
      <div>
        <div className="text-3xl font-black text-white leading-none mb-1">{value}</div>
        <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{title}</div>
        {sub && <div className="text-zinc-700 text-xs mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function VerdictBlock({ score, streak, totalCommits, weeklyActivity, topLanguages }: {
  score: number; streak: number; totalCommits: number; weeklyActivity: number[]; topLanguages: { name: string; percentage: number }[]
}) {
  const maxDay = weeklyActivity.indexOf(Math.max(...weeklyActivity))
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dominantLang = topLanguages[0]?.name
  const langDiversity = topLanguages.length

  const verdicts: { type: 'warn' | 'ok' | 'info'; text: string }[] = []

  if (streak === 0) verdicts.push({ type: 'warn', text: 'No active streak. You have gone cold. Every day without commits is a day your competitors gain ground.' })
  else if (streak >= 14) verdicts.push({ type: 'ok', text: `${streak}-day streak. You have built a habit. The question is: are the commits meaningful or just noise?` })
  else verdicts.push({ type: 'info', text: `${streak}-day streak in progress. Fragile. It only takes one lazy afternoon to break it.` })

  if (totalCommits < 5) verdicts.push({ type: 'warn', text: 'Less than 5 commits in the last 30 days. That is not a slowdown — that is abandonment.' })
  else if (totalCommits >= 50) verdicts.push({ type: 'ok', text: `${totalCommits} commits this month. High output detected. Watch for quality over quantity.` })

  if (langDiversity <= 1) verdicts.push({ type: 'warn', text: `You only use ${dominantLang ?? 'one language'}. Stack diversity matters. Branch out or become obsolete.` })
  else if (langDiversity >= 4) verdicts.push({ type: 'ok', text: `${langDiversity} languages active. Broad exposure. Make sure depth exists beneath the breadth.` })

  const weekendActivity = weeklyActivity[0] + weeklyActivity[6]
  if (weekendActivity === 0) verdicts.push({ type: 'info', text: 'Zero weekend activity. Healthy boundary or sign of stagnation? Only you know which.' })

  verdicts.push({ type: 'info', text: `Peak productivity on ${DAYS[maxDay]}. Schedule your hardest problems for this window.` })

  if (dominantLang) {
    const pct = topLanguages[0]?.percentage ?? 0
    if (pct > 80) verdicts.push({ type: 'warn', text: `${pct}% of your repos are ${dominantLang}. You are a specialist. Is that intentional or a comfort zone?` })
  }

  return (
    <div className="flex flex-col gap-3">
      {verdicts.map((v, i) => {
        const Icon = v.type === 'warn' ? AlertTriangle : v.type === 'ok' ? CheckCircle : Brain
        const color = v.type === 'warn' ? '#f87171' : v.type === 'ok' ? '#22d3ee' : '#818cf8'
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            className="flex gap-4 p-5 rounded-2xl"
            style={{ background: 'rgba(9,9,11,0.7)', border: `1px solid ${color}18`, backdropFilter: 'blur(20px)' }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon size={16} style={{ color, filter: `drop-shadow(0 0 4px ${color}66)` }} />
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">{v.text}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 200
  const center = size / 2
  const maxR = 70
  const n = data.length
  const points = data.map((d, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    const r = (d.value / 100) * maxR
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), lx: center + (maxR + 20) * Math.cos(angle), ly: center + (maxR + 20) * Math.sin(angle), label: d.label, value: d.value }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const gridLines = gridLevels.map(level => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2
      const r = level * maxR
      return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`
    })
    return pts.join(' ')
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto">
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {points.map((p, i) => (
        <line key={i} x1={center} y1={center} x2={(center + maxR * Math.cos((2 * Math.PI * i) / n - Math.PI / 2)).toFixed(1)}
          y2={(center + maxR * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)).toFixed(1)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <motion.polygon
        points={points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="rgba(34,211,238,0.1)"
        stroke="#22d3ee"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${center}px ${center}px`, filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.3))' }}
        transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#22d3ee" />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
            className="text-[8px]" fill="rgba(113,113,122,1)" fontSize="7" fontFamily="monospace">
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function InsightsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const gh = useGitHubData()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth')
  }, [status, router])

  if (status === 'loading') return (
    <div className="min-h-svh bg-black flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-t-2 border-cyan-400 rounded-full" />
    </div>
  )
  if (status === 'unauthenticated') return null

  const user = session?.user as { name?: string | null; username?: string }

  const avgCommitsPerDay = gh.contributions.length > 0
    ? (gh.contributions.reduce((a, c) => a + c.count, 0) / 90).toFixed(1)
    : '0'

  const activeDays = gh.contributions.filter(c => c.count > 0).length
  const consistency = gh.contributions.length > 0 ? Math.round((activeDays / 90) * 100) : 0

  const peakDay = gh.weeklyActivity.reduce((max, v, i) => v > gh.weeklyActivity[max] ? i : max, 0)
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const radarData = [
    { label: 'Consistency', value: consistency },
    { label: 'Output', value: Math.min(gh.totalCommits * 2, 100) },
    { label: 'Streak', value: Math.min(gh.streak * 5, 100) },
    { label: 'Diversity', value: Math.min(gh.topLanguages.length * 15, 100) },
    { label: 'Repos', value: Math.min(gh.repos.filter(r => !r.private).length * 3, 100) },
    { label: 'Score', value: gh.devScore },
  ]

  return (
    <main className="min-h-svh bg-black pt-28 pb-20 px-5 md:px-10">
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div variants={cv} initial="hidden" animate="show" className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div variants={iv}>
          <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1">Behavioral Intelligence</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            Insights <span className="text-cyan-400/40">Report</span>
          </h1>
        </motion.div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gh.loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)
          ) : (
            <>
              <motion.div variants={iv}><InsightCard icon={BarChart3} iconColor="#22d3ee" title="Dev Score" value={gh.devScore} sub="30-day analysis" trend={gh.devScore >= 70 ? 'up' : gh.devScore >= 40 ? 'neutral' : 'down'} /></motion.div>
              <motion.div variants={iv}><InsightCard icon={Target} iconColor="#818cf8" title="Consistency" value={`${consistency}%`} sub={`${activeDays} active days`} trend={consistency >= 50 ? 'up' : 'down'} /></motion.div>
              <motion.div variants={iv}><InsightCard icon={Zap} iconColor="#f97316" title="Avg Daily Commits" value={avgCommitsPerDay} sub="Past 90 days" trend="neutral" /></motion.div>
              <motion.div variants={iv}><InsightCard icon={Clock} iconColor="#4ade80" title="Peak Day" value={DAYS[peakDay]} sub={`${gh.weeklyActivity[peakDay]} commits`} /></motion.div>
            </>
          )}
        </div>

        {/* Main analysis row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Radar */}
          <motion.div variants={iv}
            className="rounded-3xl p-7 flex flex-col"
            style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1 flex items-center gap-2">
              <Brain size={12} className="text-indigo-400" /> Skill Radar
            </span>
            <p className="text-zinc-700 text-xs mb-5">Composite behavior profile</p>
            {gh.loading ? <Skeleton className="h-48 w-full" /> : <RadarChart data={radarData} />}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {radarData.map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <span className="text-zinc-600 text-[10px] font-mono">{d.label}</span>
                  <span className="text-zinc-400 text-[10px] font-mono font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Language breakdown */}
          <motion.div variants={iv}
            className="rounded-3xl p-7"
            style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1 flex items-center gap-2">
              <TrendingUp size={12} className="text-cyan-400" /> Language Breakdown
            </span>
            <p className="text-zinc-700 text-xs mb-6">Repo distribution by primary language</p>

            {gh.loading ? (
              <div className="flex flex-col gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : gh.topLanguages.length === 0 ? (
              <p className="text-zinc-600 text-sm font-mono">No language data available.</p>
            ) : (
              <>
                {/* Stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden mb-6 gap-px">
                  {gh.topLanguages.map(lang => (
                    <motion.div key={lang.name}
                      style={{ background: lc(lang.name), width: 0 }}
                      animate={{ width: `${lang.percentage}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  {gh.topLanguages.map((lang, i) => (
                    <motion.div key={lang.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: lc(lang.name) }} />
                          <span className="text-zinc-300 text-xs font-mono">{lang.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 text-xs font-mono">{lang.count} repos</span>
                          <span className="text-zinc-400 text-xs font-mono font-bold">{lang.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: lc(lang.name) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${lang.percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Activity heatmap by hour simulation */}
          <motion.div variants={iv}
            className="rounded-3xl p-7"
            style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1 flex items-center gap-2">
              <Clock size={12} className="text-indigo-400" /> Activity by Weekday
            </span>
            <p className="text-zinc-700 text-xs mb-6">Commit volume per day of week</p>

            {gh.loading ? <Skeleton className="h-40 w-full" /> : (
              <div className="flex flex-col gap-2.5">
                {DAYS.map((day, i) => {
                  const val = gh.weeklyActivity[i]
                  const max = Math.max(...gh.weeklyActivity, 1)
                  const pct = (val / max) * 100
                  const isToday = i === new Date().getDay()
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono w-7 ${isToday ? 'text-cyan-400' : 'text-zinc-600'}`}>{day}</span>
                      <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: isToday ? '#22d3ee' : 'rgba(34,211,238,0.3)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-700 w-4 text-right">{val}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Behavioral verdicts */}
        <motion.div variants={iv}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
              <Brain size={12} className="text-indigo-400" /> System Behavioral Analysis
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(39,39,42,0.6)' }} />
          </div>
          {gh.loading ? (
            <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <VerdictBlock
              score={gh.devScore}
              streak={gh.streak}
              totalCommits={gh.totalCommits}
              weeklyActivity={gh.weeklyActivity}
              topLanguages={gh.topLanguages}
            />
          )}
        </motion.div>

        {/* Recommendations */}
        {!gh.loading && (
          <motion.div variants={iv}
            className="rounded-3xl p-7"
            style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-3 mb-5">
              <Target size={16} className="text-cyan-400" />
              <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Action Targets</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: gh.streak < 7 ? 'Build a 7-day streak' : gh.streak < 30 ? 'Reach 30-day streak' : 'Maintain your streak',
                  detail: gh.streak < 7 ? `${7 - gh.streak} days remaining` : gh.streak < 30 ? `${30 - gh.streak} days to go` : 'Already achieved',
                  color: '#f97316',
                  done: gh.streak >= 30,
                },
                {
                  label: gh.topLanguages.length < 3 ? 'Learn a second language' : 'Deepen your stack',
                  detail: gh.topLanguages.length < 3 ? 'Expand beyond your primary language' : `${gh.topLanguages.length} languages detected`,
                  color: '#818cf8',
                  done: gh.topLanguages.length >= 4,
                },
                {
                  label: gh.devScore >= 80 ? 'Score maintained' : `Reach score ${Math.min(gh.devScore + 15, 100)}`,
                  detail: `Currently at ${gh.devScore}/100`,
                  color: '#22d3ee',
                  done: gh.devScore >= 90,
                },
              ].map((target, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex flex-col gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${target.color}18` }}>
                  <div className="flex items-center gap-2">
                    {target.done
                      ? <CheckCircle size={14} style={{ color: '#22d3ee' }} />
                      : <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: target.color }} />
                    }
                    <span className="text-zinc-200 text-sm font-medium">{target.label}</span>
                  </div>
                  <p className="text-zinc-600 text-xs font-mono">{target.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </main>
  )
}