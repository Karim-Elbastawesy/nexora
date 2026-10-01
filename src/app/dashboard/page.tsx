'use client'

import { motion } from 'motion/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Activity, Flame, Terminal, LogOut, Star, GitFork, TrendingUp, Zap, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useGitHubData } from '@/hooks/useGitHubData'

const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
    Rust: '#dea584', Go: '#00ADD8', CSS: '#563d7c', HTML: '#e34c26',
    Java: '#b07219', 'C++': '#f34b7d', Ruby: '#701516', Swift: '#F05138',
    Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883', default: '#22d3ee',
}
const langColor = (l: string) => LANG_COLORS[l] ?? LANG_COLORS.default

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const iv = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }
const cv = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }

function ScoreRing({ score }: { score: number }) {
    const r = 60, circ = 2 * Math.PI * r
    const label = score >= 90 ? 'Architect' : score >= 75 ? 'Optimal' : score >= 55 ? 'Active' : score >= 35 ? 'Warming Up' : 'Inactive'
    const color = score >= 75 ? '#22d3ee' : score >= 50 ? '#818cf8' : '#f97316'

    return (
        <div className="flex items-center gap-8">
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                    <motion.circle
                        cx="72" cy="72" r={r}
                        stroke={color}
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
                        transition={{ duration: 1.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-white leading-none">{score}</span>
                    <span className="text-zinc-600 text-[10px] font-mono mt-1">/ 100</span>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <div>
                    <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Status</div>
                    <div className="font-black text-lg uppercase tracking-wider" style={{ color }}>{label}</div>
                </div>
                <div>
                    <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Next Rank</div>
                    <div className="text-zinc-300 font-bold text-sm uppercase">
                        {score >= 90 ? 'MAX LEVEL' : score >= 75 ? 'Architect (90)' : score >= 55 ? 'Optimal (75)' : 'Active (55)'}
                    </div>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden" style={{ maxWidth: 120 }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>
            </div>
        </div>
    )
}

function ContributionGrid({ contributions }: { contributions: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] }) {
    const colors = ['rgba(255,255,255,0.04)', 'rgba(34,211,238,0.25)', 'rgba(34,211,238,0.5)', 'rgba(34,211,238,0.75)', '#22d3ee']
    const weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = []
    for (let i = 0; i < contributions.length; i += 7) weeks.push(contributions.slice(i, i + 7))

    return (
        <div className="flex gap-1 overflow-x-auto pb-1">
            {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                    {week.map((day, di) => (
                        <motion.div
                            key={di}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (wi * 7 + di) * 0.003, duration: 0.3 }}
                            title={`${day.date}: ${day.count} commits`}
                            className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                            style={{ background: colors[day.level], boxShadow: day.level === 4 ? '0 0 6px rgba(34,211,238,0.6)' : 'none' }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

function WeekdayBars({ data }: { data: number[] }) {
    const max = Math.max(...data, 1)
    return (
        <div className="flex items-end gap-2 h-24">
            {data.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                    <motion.div
                        className="w-full rounded-t-sm"
                        style={{ background: i === new Date().getDay() ? '#22d3ee' : 'rgba(34,211,238,0.2)', minHeight: 4 }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(val / max) * 80}px` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <span className="text-[9px] font-mono text-zinc-600">{DAY_LABELS[i]}</span>
                </div>
            ))}
        </div>
    )
}

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const gh = useGitHubData()

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth')
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="min-h-svh bg-black flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-t-2 border-cyan-400 rounded-full" />
            </div>
        )
    }
    if (status === 'unauthenticated') return null

    const user = session?.user as { name?: string | null; image?: string | null; email?: string | null; username?: string }
    const recentPushes = gh.events.filter(e => e.type === 'PushEvent').slice(0, 5)
    const topRepos = [...gh.repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3)

    return (
        <main className="min-h-svh bg-black pt-28 pb-20 px-5 md:px-10">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-100 pointer-events-none z-0"
                style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

            <motion.div variants={cv} initial="hidden" animate="show" className="relative z-10 max-w-7xl mx-auto flex flex-col gap-5">

                {/* Header */}
                <motion.div variants={iv} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div className="flex items-center gap-5">
                        {user?.image ? (
                            <Image src={user.image} alt={user.name ?? ''} width={56} height={56} className="rounded-2xl ring-2 ring-cyan-400/20" />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-xl font-black">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mb-0.5">Welcome back</p>
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                                {user?.name ?? user?.username}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/auth' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400/70 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 text-xs font-mono tracking-widest uppercase"
                    >
                        <LogOut size={13} />Terminate Session
                    </button>
                </motion.div>

                {gh.error && (
                    <motion.div variants={iv} className="flex items-center gap-3 px-5 py-3 rounded-xl text-amber-400 text-sm font-mono"
                        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <AlertCircle size={16} />{gh.error}
                    </motion.div>
                )}

                {/* Primary bento row */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">

                    {/* Dev Score */}
                    <motion.div variants={iv}
                        className="md:col-span-2 rounded-3xl p-7 relative overflow-hidden"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none -mr-16 -mt-16"
                            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />
                        <div className="mb-5">
                            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Developer Score</span>
                            <p className="text-zinc-700 text-xs mt-0.5">30-day commit consistency analysis</p>
                        </div>
                        {gh.loading ? <Skeleton className="h-28 w-full" /> : <ScoreRing score={gh.devScore} />}
                        <div className="absolute bottom-0 left-0 right-0 h-px"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)' }} />
                    </motion.div>

                    {/* Streak */}
                    <motion.div variants={iv}
                        className="rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <Flame size={22} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,146,60,0.5))' }} />
                        <div>
                            {gh.loading ? <Skeleton className="h-12 w-24 mb-2" /> : (
                                <motion.div className="text-5xl font-black text-white leading-none mb-1"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                    {gh.streak}
                                </motion.div>
                            )}
                            <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Day Streak</div>
                            {!gh.loading && gh.streak === 0 && (
                                <p className="text-orange-400/60 text-xs mt-2 font-mono">Start coding today.</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Total Commits */}
                    <motion.div variants={iv}
                        className="rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <Terminal size={22} className="text-indigo-400" style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.4))' }} />
                        <div>
                            {gh.loading ? <Skeleton className="h-12 w-24 mb-2" /> : (
                                <motion.div className="text-5xl font-black text-white leading-none mb-1"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                    {gh.totalCommits}
                                </motion.div>
                            )}
                            <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Commits (30d)</div>
                        </div>
                    </motion.div>
                </div>

                {/* Second row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Contribution heatmap */}
                    <motion.div variants={iv}
                        className="lg:col-span-2 rounded-3xl p-7"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Contribution Activity</span>
                                <p className="text-zinc-700 text-xs mt-0.5">Last 90 days</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-700 text-[10px] font-mono">Less</span>
                                {[0, 1, 2, 3, 4].map(l => (
                                    <div key={l} className="w-2.5 h-2.5 rounded-sm"
                                        style={{ background: ['rgba(255,255,255,0.04)', 'rgba(34,211,238,0.25)', 'rgba(34,211,238,0.5)', 'rgba(34,211,238,0.75)', '#22d3ee'][l] }} />
                                ))}
                                <span className="text-zinc-700 text-[10px] font-mono">More</span>
                            </div>
                        </div>
                        {gh.loading ? <Skeleton className="h-28 w-full" /> : <ContributionGrid contributions={gh.contributions} />}
                    </motion.div>

                    {/* Weekly pattern */}
                    <motion.div variants={iv}
                        className="rounded-3xl p-7"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <div className="mb-5">
                            <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
                                <Activity size={12} className="text-cyan-400" /> Weekly Pattern
                            </span>
                            <p className="text-zinc-700 text-xs mt-0.5">Commits by day of week</p>
                        </div>
                        {gh.loading ? <Skeleton className="h-24 w-full" /> : <WeekdayBars data={gh.weeklyActivity} />}
                    </motion.div>
                </div>

                {/* Third row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Languages */}
                    <motion.div variants={iv}
                        className="rounded-3xl p-7"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2 mb-5">
                            <Zap size={12} className="text-cyan-400" /> Language Stack
                        </span>
                        {gh.loading ? (
                            <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                        ) : gh.topLanguages.length === 0 ? (
                            <p className="text-zinc-600 text-sm font-mono">No public repos detected.</p>
                        ) : (
                            <div className="flex flex-col gap-3.5">
                                {gh.topLanguages.map((lang, i) => (
                                    <div key={lang.name}>
                                        <div className="flex justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: langColor(lang.name) }} />
                                                <span className="text-zinc-300 text-xs font-mono">{lang.name}</span>
                                            </div>
                                            <span className="text-zinc-600 text-xs font-mono">{lang.percentage}%</span>
                                        </div>
                                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                            <motion.div className="h-full rounded-full"
                                                style={{ background: langColor(lang.name) }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${lang.percentage}%` }}
                                                transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Recent activity */}
                    <motion.div variants={iv}
                        className="lg:col-span-2 rounded-3xl p-7"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2 mb-5">
                            <TrendingUp size={12} className="text-cyan-400" /> Recent Commits
                        </span>
                        {gh.loading ? (
                            <div className="flex flex-col gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : recentPushes.length === 0 ? (
                            <div className="text-zinc-600 font-mono text-sm py-8 text-center">
                                No recent push events found.
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-zinc-800/50">
                                {recentPushes.map((event, i) => {
                                    const commit = event.payload.commits?.[0]
                                    const branch = event.payload.ref?.replace('refs/heads/', '') ?? 'main'
                                    const repoName = event.repo.name.split('/')[1]
                                    const timeAgo = (() => {
                                        const diff = Date.now() - new Date(event.created_at).getTime()
                                        const h = Math.floor(diff / 3600000)
                                        if (h < 1) return `${Math.floor(diff / 60000)}m ago`
                                        if (h < 24) return `${h}h ago`
                                        return `${Math.floor(h / 24)}d ago`
                                    })()
                                    return (
                                        <motion.div key={event.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + i * 0.08 }}
                                            className="flex items-start gap-4 py-3.5 group">
                                            <div className="w-7 h-7 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-400/20 transition-colors">
                                                <Terminal size={13} className="text-cyan-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-zinc-300 text-sm truncate leading-snug">
                                                    {commit?.message ?? 'Pushed commits'}
                                                </p>
                                                <p className="text-zinc-600 text-xs font-mono mt-0.5">
                                                    <span className="text-indigo-400/70">{repoName}</span>
                                                    <span className="mx-1.5 text-zinc-800">·</span>
                                                    <span className="text-cyan-400/50">{branch}</span>
                                                    <span className="mx-1.5 text-zinc-800">·</span>
                                                    {event.payload.commits?.length ?? 1} commit{(event.payload.commits?.length ?? 1) > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <span className="text-zinc-700 text-xs font-mono shrink-0">{timeAgo}</span>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Top Repos row */}
                {!gh.loading && topRepos.length > 0 && (
                    <motion.div variants={iv}>
                        <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Star size={12} className="text-cyan-400" /> Top Repositories
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {topRepos.map((repo, i) => (
                                <motion.a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    whileHover={{ y: -3 }}
                                    className="rounded-2xl p-5 flex flex-col gap-3 group cursor-pointer transition-all duration-300"
                                    style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors truncate pr-2">{repo.name}</span>
                                        {repo.language && (
                                            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full"
                                                style={{ background: `${langColor(repo.language)}18`, color: langColor(repo.language), border: `1px solid ${langColor(repo.language)}30` }}>
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-600 text-xs leading-relaxed flex-1">
                                        {repo.description ?? 'No description provided.'}
                                    </p>
                                    <div className="flex items-center gap-4 text-zinc-600 text-xs font-mono">
                                        <span className="flex items-center gap-1"><Star size={11} />{repo.stargazers_count}</span>
                                        <span className="flex items-center gap-1"><GitFork size={11} />{repo.forks_count}</span>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Behavioral verdict */}
                {!gh.loading && (
                    <motion.div variants={iv}
                        className="rounded-3xl p-7 relative overflow-hidden"
                        style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}>
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at bottom right, rgba(34,211,238,0.03) 0%, transparent 60%)' }} />
                        <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-3">System Verdict</p>
                        <p className="text-zinc-300 text-lg font-medium leading-relaxed max-w-2xl">
                            {gh.devScore >= 80
                                ? `Strong output. ${gh.streak > 7 ? `${gh.streak}-day streak noted.` : ''} Maintain momentum or it means nothing.`
                                : gh.devScore >= 55
                                    ? `Inconsistent. You have ${gh.totalCommits} commits this month but the pattern shows gaps. Fix your cadence.`
                                    : gh.devScore >= 30
                                        ? `Low activity detected. ${gh.streak === 0 ? 'No active streak.' : ''} You are falling behind. The gap between you and consistent developers grows daily.`
                                        : `Minimal signal detected. Connect your GitHub and start committing. Nexora cannot judge what doesn't exist.`
                            }
                        </p>
                    </motion.div>
                )}

            </motion.div>
        </main>
    )
}