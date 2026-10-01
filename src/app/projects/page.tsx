'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Star, GitFork, AlertCircle, ExternalLink, Search, ArrowUpDown, Lock } from 'lucide-react'
import { useGitHubData, GitHubRepo } from '@/hooks/useGitHubData'

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', CSS: '#563d7c', HTML: '#e34c26',
  Java: '#b07219', 'C++': '#f34b7d', Ruby: '#701516', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883', default: '#22d3ee',
}
const lc = (l: string) => LANG_COLORS[l] ?? LANG_COLORS.default

type SortKey = 'updated' | 'stars' | 'name' | 'issues'

const iv = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }
const cv = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}mo ago`
  return `${Math.floor(m / 12)}y ago`
}

function RepoCard({ repo, index }: { repo: GitHubRepo; index: number }) {
  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col gap-4 p-5 rounded-2xl transition-all duration-300 cursor-pointer"
      style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(39,39,42,0.6)', backdropFilter: 'blur(20px)' }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(34,211,238,0.04) 0%, transparent 60%)' }} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {repo.private && <Lock size={12} className="text-zinc-600 flex-shrink-0" />}
          <h3 className="text-white font-bold text-sm truncate group-hover:text-cyan-400 transition-colors duration-300">
            {repo.name}
          </h3>
        </div>
        <ExternalLink size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <p className="text-zinc-600 text-xs leading-relaxed flex-1 line-clamp-2">
        {repo.description ?? 'No description provided.'}
      </p>

      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 3).map(topic => (
            <span key={topic} className="text-[10px] font-mono px-2 py-0.5 rounded-full text-cyan-400/60"
              style={{ background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.12)' }}>
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
          <span className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors">
            <Star size={12} />{repo.stargazers_count}
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork size={12} />{repo.forks_count}
          </span>
          {repo.open_issues_count > 0 && (
            <span className="flex items-center gap-1.5 text-orange-400/60">
              <AlertCircle size={12} />{repo.open_issues_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {repo.language && (
            <>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lc(repo.language) }} />
              <span className="text-[10px] font-mono text-zinc-500">{repo.language}</span>
            </>
          )}
          <span className="text-zinc-700 text-[10px] font-mono ml-2">{timeAgo(repo.updated_at)}</span>
        </div>
      </div>
    </motion.a>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-800/40 ${className}`} />
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const gh = useGitHubData()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [langFilter, setLangFilter] = useState<string>('All')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth')
  }, [status, router])

  const languages = useMemo(() => {
    const langs = Array.from(new Set(gh.repos.map(r => r.language).filter(Boolean) as string[]))
    return ['All', ...langs.slice(0, 8)]
  }, [gh.repos])

  const filtered = useMemo(() => {
    let repos = [...gh.repos]
    if (search) repos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || (r.description ?? '').toLowerCase().includes(search.toLowerCase()))
    if (langFilter !== 'All') repos = repos.filter(r => r.language === langFilter)
    switch (sort) {
      case 'stars': return repos.sort((a, b) => b.stargazers_count - a.stargazers_count)
      case 'name': return repos.sort((a, b) => a.name.localeCompare(b.name))
      case 'issues': return repos.sort((a, b) => b.open_issues_count - a.open_issues_count)
      default: return repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
  }, [gh.repos, search, sort, langFilter])

  if (status === 'loading') return (
    <div className="min-h-svh bg-black flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-t-2 border-cyan-400 rounded-full" />
    </div>
  )
  if (status === 'unauthenticated') return null

  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'updated', label: 'Recent' },
    { key: 'stars', label: 'Stars' },
    { key: 'name', label: 'Name' },
    { key: 'issues', label: 'Issues' },
  ]

  return (
    <main className="min-h-svh bg-black pt-28 pb-20 px-5 md:px-10">
      <div className="fixed top-0 left-0 w-[600px] h-[400px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse, rgba(74,222,128,0.02) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <motion.div variants={cv} initial="hidden" animate="show" className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div variants={iv}>
          <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mb-1">Repository Index</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            Projects <span className="text-cyan-400/40">({gh.repos.length})</span>
          </h1>
          <p className="text-zinc-600 text-sm font-mono mb-6">
            {gh.repos.filter(r => !r.private).length} public · {gh.repos.filter(r => r.private).length} private
          </p>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono text-zinc-300 placeholder-zinc-700 outline-none focus:border-cyan-400/30 transition-colors"
                style={{ background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(39,39,42,0.7)' }}
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(39,39,42,0.6)' }}>
              <ArrowUpDown size={12} className="text-zinc-600 ml-2" />
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className="relative px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200"
                  style={{ color: sort === s.key ? '#fff' : '#71717a' }}>
                  {sort === s.key && (
                    <motion.div layoutId="sortBg" className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.2)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language filters */}
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <button key={lang} onClick={() => setLangFilter(lang)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all duration-200"
                style={{
                  background: langFilter === lang ? (lang === 'All' ? 'rgba(34,211,238,0.12)' : `${lc(lang)}18`) : 'rgba(9,9,11,0.6)',
                  border: `1px solid ${langFilter === lang ? (lang === 'All' ? 'rgba(34,211,238,0.3)' : `${lc(lang)}40`) : 'rgba(39,39,42,0.6)'}`,
                  color: langFilter === lang ? (lang === 'All' ? '#22d3ee' : lc(lang)) : '#52525b',
                }}>
                {lang !== 'All' && <div className="w-2 h-2 rounded-full" style={{ background: lc(lang) }} />}
                {lang}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        {!gh.loading && (
          <motion.div variants={iv} className="text-zinc-600 text-xs font-mono">
            {filtered.length} repositories{search && ` matching "${search}"`}
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gh.loading ? (
            [...Array(9)].map((_, i) => <Skeleton key={i} className="h-44" />)
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((repo, i) => <RepoCard key={repo.id} repo={repo} index={i} />)}
            </AnimatePresence>
          )}
        </div>

        {!gh.loading && filtered.length === 0 && (
          <motion.div variants={iv} className="text-center py-20 text-zinc-600 font-mono text-sm">
            No repositories match your filters.
          </motion.div>
        )}

      </motion.div>
    </main>
  )
}