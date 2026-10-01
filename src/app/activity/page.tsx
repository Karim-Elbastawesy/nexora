'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GitCommit, GitPullRequest, GitBranch, Star, Folder, Zap, Filter } from 'lucide-react'
import { useGitHubData, GitHubEvent } from '@/hooks/useGitHubData'

const iv = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }
const cv = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }

type FilterType = 'All' | 'Push' | 'PR' | 'Create' | 'Star'

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PushEvent: { label: 'Push', icon: GitCommit, color: 'text-cyan-400', bg: 'rgba(34,211,238,0.1)' },
  PullRequestEvent: { label: 'Pull Request', icon: GitPullRequest, color: 'text-indigo-400', bg: 'rgba(129,140,248,0.1)' },
  CreateEvent: { label: 'Branch/Repo', icon: GitBranch, color: 'text-green-400', bg: 'rgba(74,222,128,0.1)' },
  WatchEvent: { label: 'Starred', icon: Star, color: 'text-yellow-400', bg: 'rgba(250,204,21,0.1)' },
  ForkEvent: { label: 'Fork', icon: GitBranch, color: 'text-purple-400', bg: 'rgba(192,132,252,0.1)' },
  DeleteEvent: { label: 'Delete', icon: Folder, color: 'text-red-400', bg: 'rgba(248,113,113,0.1)' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function eventSummary(event: GitHubEvent): string {
  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload.commits?.length ?? 0
      const msg = event.payload.commits?.[0]?.message ?? ''
      const branch = event.payload.ref?.replace('refs/heads/', '') ?? 'main'
      return count === 1 ? `"${msg.split('\n')[0]}" → ${branch}` : `${count} commits to ${branch}`
    }
    case 'PullRequestEvent': {
      const pr = event.payload.pull_request
      return `${event.payload.pull_request?.merged ? 'Merged' : 'Opened'} PR #${pr?.number}: ${pr?.title}`
    }
    case 'CreateEvent':
      return `Created ${event.payload.ref_type} ${event.payload.ref ? `"${event.payload.ref}"` : ''}`
    case 'WatchEvent':
      return 'Starred repository'
    case 'ForkEvent':
      return 'Forked repository'
    default:
      return event.type.replace('Event', '')
  }
}

function filterType(type: string): FilterType {
  if (type === 'PushEvent') return 'Push'
  if (type === 'PullRequestEvent') return 'PR'
  if (type === 'CreateEvent') return 'Create'
  if (type === 'WatchEvent') return 'Star'
  return 'All'
}

function groupByDate(events: GitHubEvent[]) {
  const groups: Record<string, GitHubEvent[]> = {}
  events.forEach(e => {
    const d = new Date(e.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    let key: string
    if (d.toDateString() === today.toDateString()) key = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/40 ${className}`} />
}

export default function ActivityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const gh = useGitHubData()
  const [filter, setFilter] = useState<FilterType>('All')

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

  const FILTERS: FilterType[] = ['All', 'Push', 'PR', 'Create', 'Star']
  const filtered = filter === 'All' ? gh.events : gh.events.filter(e => filterType(e.type) === filter)
  const grouped = groupByDate(filtered)

  const pushCount = gh.events.filter(e => e.type === 'PushEvent').length
  const prCount = gh.events.filter(e => e.type === 'PullRequestEvent').length
  const createCount = gh.events.filter(e => e.type === 'CreateEvent').length

  return (
    <main className="min-h-svh bg-black pt-28 pb-20 px-5 md:px-10">
      <div className="fixed top-0 right-0 w-[500px] h-[400px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div variants={cv} initial="hidden" animate="show" className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div variants={iv}>
          <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1">System Feed</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
            Activity <span className="text-cyan-400/40">Log</span>
          </h1>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: 'Push Events', value: pushCount, color: 'rgba(34,211,238,0.1)', text: 'text-cyan-400', border: 'rgba(34,211,238,0.2)' },
              { label: 'Pull Requests', value: prCount, color: 'rgba(129,140,248,0.1)', text: 'text-indigo-400', border: 'rgba(129,140,248,0.2)' },
              { label: 'Created', value: createCount, color: 'rgba(74,222,128,0.1)', text: 'text-green-400', border: 'rgba(74,222,128,0.2)' },
              { label: 'Total Events', value: gh.events.length, color: 'rgba(255,255,255,0.04)', text: 'text-zinc-300', border: 'rgba(255,255,255,0.08)' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
                style={{ background: stat.color, border: `1px solid ${stat.border}` }}>
                <span className={`font-black ${stat.text}`}>{stat.value}</span>
                <span className="text-zinc-600">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(39,39,42,0.6)' }}>
            <Filter size={12} className="text-zinc-600 ml-2" />
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="relative px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200"
                style={{ color: filter === f ? '#fff' : '#71717a' }}>
                {filter === f && (
                  <motion.div layoutId="filterBg" className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.2)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="relative">{f}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div variants={iv} className="flex flex-col gap-8">
          {gh.loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 font-mono text-sm">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              No {filter === 'All' ? '' : filter} events found.
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-zinc-600 font-mono text-xs uppercase tracking-widest">{dateLabel}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(39,39,42,0.6)' }} />
                  <span className="text-zinc-700 font-mono text-xs">{dayEvents.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {dayEvents.map((event, i) => {
                      const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG['PushEvent']
                      const Icon = cfg.icon
                      const repoName = event.repo.name.split('/')[1]
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className="flex items-start gap-4 p-4 rounded-2xl group transition-all duration-300 hover:-translate-y-px"
                          style={{ background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(39,39,42,0.5)' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.bg }}>
                            <Icon size={15} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-300 text-sm leading-snug truncate">
                              {eventSummary(event)}
                            </p>
                            <p className="text-zinc-600 text-xs font-mono mt-1">
                              <span className="text-indigo-400/60">{repoName}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-zinc-700 text-xs font-mono">{timeAgo(event.created_at)}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                              style={{ background: cfg.bg, color: cfg.color.replace('text-', '') }}>
                              {cfg.label}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </motion.div>

      </motion.div>
    </main>
  )
}