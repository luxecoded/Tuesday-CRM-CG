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
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode]       = useState(() => localStorage.getItem('tuesday-view-mode') || 'card')
  const [selectedJob, setSelectedJob] = useState(null)
  const [isCreating, setIsCreating]   = useState(false)
  const isDesktop = useIsDesktop()
  const showToast = useToast()
  const userName  = getUserName()
  const initials  = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const location  = useLocation()
  const didOpen   = useRef(false)

  useEffect(() => {
    if (!loading && location.state?.openJobId && !didOpen.current) {
      const job = jobs.find(j => j.id === location.state.openJobId)
      if (job) { didOpen.current = true; openDrawer(job) }
    }
  }, [jobs, loading])

  const setView = mode => { setViewMode(mode); localStorage.setItem('tuesday-view-mode', mode) }

  const visibleJobs = jobs.filter(j => {
    if (j.status === 'lost')     return statusFilter === 'lost'
    if (j.status === 'complete') return statusFilter === 'complete'
    return true
  })
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

  const openDrawer  = job => { setIsCreating(false); setSelectedJob(job) }
  const openNew     = ()  => { setSelectedJob(null);  setIsCreating(true) }
  const closeDrawer = ()  => { setSelectedJob(null);  setIsCreating(false) }

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
    <div className="flex-1 flex items-center justify-center text-ink-muted">
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
        <div className="bg-surface-bar backdrop-blur-xl border-b border-edge px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-700/25">
              <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            <div>
              <p className="text-[10px] text-ink-muted leading-none">Hello,</p>
              <p className="text-xs font-bold text-ink leading-snug mt-0.5">{userName || 'there'}</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-ink">Pipeline</h1>
            <p className="text-xs text-ink-muted">
              {filtered.length} {statusFilter === 'lost' ? 'lost' : statusFilter === 'complete' ? 'complete' : statusFilter !== 'All' ? STATUS_LABELS[statusFilter]?.toLowerCase() : 'active'} job{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="flex bg-surface-toggle rounded-lg p-0.5">
              <button onClick={() => setView('card')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'card'
                    ? 'bg-surface-active text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-ink-soft'}`}>
                ⊞ Grid
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'list'
                    ? 'bg-surface-active text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-ink-soft'}`}>
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="bg-surface-dim backdrop-blur-md border-b border-edge-dim px-4 lg:px-6 py-3 flex-shrink-0 flex gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search jobs…"
            className="flex-1 px-4 py-2.5 bg-surface-input border border-edge-input rounded-full text-sm text-ink placeholder:text-ink-placeholder outline-none focus:border-green-500/55 transition-colors"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-input border border-edge-input rounded-full text-sm text-ink outline-none focus:border-green-500/55 transition-colors cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-surface-raised border border-edge-hi rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-ink">{filtered.length}</div>
              <div className="text-xs text-ink-muted mt-0.5">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                {filtered.filter(j => j.status === 'enquiry').length}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">Enquiries</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-teal-600 dark:text-teal-400">
                {filtered.filter(j => j.status === 'installed').length}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">Installed</div>
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
                  <span className="text-xs font-bold text-ink-muted uppercase tracking-wide">{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-ink-muted bg-surface-chip px-2 py-0.5 rounded-full">{group.length}</span>
                </div>

                {/* Card view */}
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.map(job => (
                      <div key={job.id} onClick={() => openDrawer(job)}
                        className={`bg-surface-card rounded-2xl border p-4 cursor-pointer transition-all relative overflow-hidden shadow-sm
                          ${selectedJob?.id === job.id
                            ? 'border-green-500/60 shadow-md shadow-green-500/10'
                            : 'border-edge-hi hover:border-green-500/50 hover:bg-surface-card-hover'}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                        <div className="pl-3">
                          <div className="mb-1">
                            <span className="font-semibold text-ink text-sm">{job.title || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {job.customerName && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface-chip text-ink-soft">
                                {job.customerName}
                              </span>
                            )}
                            {job.quoteVisit && (
                              <span className="text-xs text-ink-muted">Visit {job.quoteVisit}</span>
                            )}
                          </div>
                          {job.addressLine1 && (
                            <p className="text-xs text-ink-faint mt-1.5 truncate">{job.addressLine1}{job.addressCity ? `, ${job.addressCity}` : ''}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List view */}
                {viewMode === 'list' && (
                  <div className="bg-surface rounded-2xl border border-edge-hi overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-head border-b border-edge-dim">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Job</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Customer</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">Address</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden lg:table-cell">Quote Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((job, i) => (
                          <tr key={job.id} onClick={() => openDrawer(job)}
                            className={`cursor-pointer transition-colors border-l-4
                              ${selectedJob?.id === job.id
                                ? 'bg-surface-selected'
                                : i % 2 === 0
                                  ? 'bg-transparent hover:bg-surface-hover'
                                  : 'bg-surface-row hover:bg-surface-hover-b'
                              }`}
                            style={{ borderLeftColor: color }}>
                            <td className="px-4 py-3 font-medium text-ink">{job.title || '—'}</td>
                            <td className="px-4 py-3 hidden sm:table-cell text-ink-soft">{job.customerName || '—'}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-xs text-ink-muted max-w-xs truncate">
                              {job.addressLine1 ? `${job.addressLine1}${job.addressCity ? `, ${job.addressCity}` : ''}` : '—'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell text-xs text-ink-muted">{job.quoteVisit || '—'}</td>
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
            <div className="text-center py-16 text-ink-muted">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No jobs match your search</p>
            </div>
          )}
        </div>
      </div>

      {(selectedJob || isCreating) && <JobDrawer {...drawerProps} />}

      {/* FAB — New Job */}
      <button onClick={openNew}
        className={`fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-40 group flex items-center gap-3 transition-all duration-300 ease-out
          ${(selectedJob || isCreating) ? 'translate-x-20 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto'}`}>
        <span className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 bg-gray-900/90 dark:bg-gray-800/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
          New Job
        </span>
        <div className="w-14 h-14 rounded-full bg-green-700 hover:bg-green-600 active:scale-95 flex items-center justify-center shadow-lg shadow-green-700/40 transition-all duration-150 hover:scale-105">
          <span className="text-white text-3xl font-extralight leading-none mt-[-2px]">+</span>
        </div>
      </button>
    </div>
  )
}
