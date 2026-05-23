import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useJobs, STATUS_ORDER, STATUS_LABELS, STATUS_COLORS } from '../hooks/useJobs'
import { useCustomers } from '../hooks/useCustomers'
import JobDrawer from '../components/JobDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getUserName } from '../components/PasswordGate'

export default function Pipeline() {
  const { jobs, loading, error, createJob, updateJob, deleteJob } = useJobs()
  const { customers } = useCustomers()
  const { theme, setTheme } = useThemeContext()
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode]     = useState(() => localStorage.getItem('tuesday-view-mode') || 'card')
  const [selectedJob, setSelectedJob] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const isDesktop  = useIsDesktop()
  const showToast  = useToast()
  const userName   = getUserName()
  const initials  = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const location  = useLocation()
  const didOpen   = useRef(false)

  // Auto-open a job when navigated here from another page
  useEffect(() => {
    if (!loading && location.state?.openJobId && !didOpen.current) {
      const job = jobs.find(j => j.id === location.state.openJobId)
      if (job) { didOpen.current = true; openDrawer(job) }
    }
  }, [jobs, loading])

  const setView = mode => { setViewMode(mode); localStorage.setItem('tuesday-view-mode', mode) }

  const visibleJobs = jobs.filter(j => j.status !== 'lost' || statusFilter === 'lost')
  const filtered = visibleJobs.filter(j => {
    const matchStatus = statusFilter === 'All' || j.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (j.title        || '').toLowerCase().includes(q) ||
      (j.customerName || '').toLowerCase().includes(q) ||
      (j.addressLine1 || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const statuses = STATUS_ORDER.filter(s => filtered.some(j => j.status === s))

  const openDrawer = job => { setIsCreating(false); setSelectedJob(job) }
  const openNew    = ()  => { setSelectedJob(null);  setIsCreating(true) }
  const closeDrawer = () => { setSelectedJob(null);  setIsCreating(false) }

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const fresh = await updateJob(data)
        setSelectedJob(fresh)
      } else {
        const created = await createJob(data)
        setIsCreating(false)
        setSelectedJob(created)
      }
      showToast(data.id ? 'Job saved' : 'Job created')
    } catch {
      showToast('Failed to save job', 'error')
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading jobs…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
    </div>
  )

  const drawerProps = {
    job: isCreating ? null : selectedJob,
    onClose: closeDrawer,
    onSave: handleSave,
    onDelete: !isCreating ? deleteJob : undefined,
    customers,
    isDesktop,
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white/35 dark:bg-white/5 backdrop-blur-xl border-b border-white/25 dark:border-white/8 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-700/25">
              <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Hello,</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug mt-0.5">{userName || 'there'}</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pipeline</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} active jobs</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={openNew}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-green-700/25">
              + New Job
            </button>
            <div className="flex bg-black/10 dark:bg-white/8 rounded-lg p-0.5">
              <button onClick={() => setView('card')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'card' ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                ⊞ Grid
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'list' ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-3 flex-shrink-0 flex gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search jobs…"
            className="flex-1 px-4 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500/60 dark:placeholder-gray-400 outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-white/45 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{filtered.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                {filtered.filter(j => j.status === 'enquiry').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enquiries</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-teal-600 dark:text-teal-400">
                {filtered.filter(j => j.status === 'installed').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Installed</div>
            </div>
          </div>
        </div>

        {/* Jobs list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6 space-y-5">
          {statuses.map(status => {
            const group = filtered.filter(j => j.status === status)
            const color = STATUS_COLORS[status] || '#6b7280'
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-white/8 px-2 py-0.5 rounded-full">{group.length}</span>
                </div>

                {/* Card view */}
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.map(job => (
                      <div key={job.id} onClick={() => openDrawer(job)}
                        className={`bg-white/50 dark:bg-white/8 rounded-2xl border p-4 cursor-pointer transition-all relative overflow-hidden shadow-sm
                          ${(selectedJob?.id === job.id || (!isCreating && selectedJob?.id === job.id))
                            ? 'border-green-500/60 shadow-md shadow-green-500/10'
                            : 'border-white/40 dark:border-white/10 hover:border-green-500/50 hover:bg-white/60 dark:hover:bg-white/12'}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                        <div className="pl-3">
                          <div className="mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{job.title || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {job.customerName && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/30 dark:bg-white/8 text-gray-600 dark:text-gray-300">
                                {job.customerName}
                              </span>
                            )}
                            {job.quoteVisit && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Visit {job.quoteVisit}</span>
                            )}
                          </div>
                          {job.addressLine1 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 truncate">{job.addressLine1}{job.addressCity ? `, ${job.addressCity}` : ''}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List view */}
                {viewMode === 'list' && (
                  <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Job</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Customer</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Address</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Quote Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((job, i) => (
                          <tr key={job.id} onClick={() => openDrawer(job)}
                            className={`cursor-pointer transition-colors border-l-4
                              ${selectedJob?.id === job.id
                                ? 'bg-green-400/15 dark:bg-green-500/10'
                                : i % 2 === 0
                                  ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5'
                                  : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6'
                              }`}
                            style={{ borderLeftColor: color }}>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{job.title || '—'}</td>
                            <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-300">{job.customerName || '—'}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {job.addressLine1 ? `${job.addressLine1}${job.addressCity ? `, ${job.addressCity}` : ''}` : '—'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">{job.quoteVisit || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No jobs match your search</p>
            </div>
          )}
        </div>
      </div>

      {(selectedJob || isCreating) && <JobDrawer {...drawerProps} />}
    </div>
  )
}
