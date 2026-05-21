import { useState } from 'react'
import { useContacts } from '../hooks/useContacts'
import { useDeals } from '../hooks/useDeals'
import ContactDrawer from '../components/ContactDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getUserName } from '../components/PasswordGate'

const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-400/20 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Paradise Windows': 'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Elite Windows':    'bg-emerald-400/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
}

const COMPANY_AVATAR = {
  'Isis Windows':     'bg-blue-400/25 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Paradise Windows': 'bg-amber-400/25 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Elite Windows':    'bg-emerald-400/25 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
}

const EMPTY = { name: '', company: '', email: '', phone: '', notes: '' }

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

export default function Contacts() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useContacts()
  const { deals } = useDeals()
  const { theme, setTheme } = useThemeContext()

  const [search, setSearch]           = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [viewMode, setViewMode]       = useState(() => localStorage.getItem('tuesday-contacts-view') || 'card')
  const [selected, setSelected]       = useState(null)

  const isDesktop = useIsDesktop()
  const userName = getUserName()
  const userInitials = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const setView = mode => { setViewMode(mode); localStorage.setItem('tuesday-contacts-view', mode) }

  const filtered = contacts.filter(c => {
    const matchCompany = companyFilter === 'All' || c.company === companyFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    return matchCompany && matchSearch
  })

  const handleSave = async (data) => {
    if (data.id) {
      await updateContact(data)
      setSelected(data)
    } else {
      const added = await addContact(data)
      setSelected(added)
    }
  }

  const handleDelete = async (id) => {
    await deleteContact(id)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading contacts…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white/35 dark:bg-white/5 backdrop-blur-xl border-b border-white/25 dark:border-white/8 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-700/25">
              <span className="text-white font-bold text-xs">{userInitials}</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Hello,</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug mt-0.5">{userName || 'there'}</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{contacts.length} contacts</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
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

        {/* Search + filters */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-3 flex-shrink-0 space-y-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search contacts…"
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500/60 dark:placeholder-gray-400 outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...COMPANIES].map(c => (
              <button key={c} onClick={() => setCompanyFilter(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${companyFilter === c
                    ? 'bg-green-700/90 border-green-700/90 text-white'
                    : 'bg-white/30 dark:bg-white/6 border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-green-500/60 dark:hover:border-green-500/40'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-white/45 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{contacts.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</div>
            </div>
            {COMPANIES.map(co => {
              const count = contacts.filter(c => c.company === co).length
              if (count === 0) return null
              return (
                <div key={co} className="text-center">
                  <div className="text-base font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{co.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">

          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(contact => (
                <div key={contact.id} onClick={() => setSelected(contact)}
                  className={`bg-white/50 dark:bg-white/8 rounded-2xl border p-4 cursor-pointer transition-all shadow-sm
                    ${selected?.id === contact.id
                      ? 'border-green-500/60 shadow-md shadow-green-500/10'
                      : 'border-white/40 dark:border-white/10 hover:border-green-500/50 hover:bg-white/60 dark:hover:bg-white/12'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${COMPANY_AVATAR[contact.company] || 'bg-white/40 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                      {initials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {contact.name || '—'}
                      </div>
                      {contact.company && (
                        <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[contact.company] || 'bg-white/30 dark:bg-white/8 text-gray-500'}`}>
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                  {(contact.email || contact.phone) && (
                    <div className="mt-3 pt-3 border-t border-white/25 dark:border-white/8 space-y-1">
                      {contact.email && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">✉ {contact.email}</div>}
                      {contact.phone && <div className="text-xs text-gray-500 dark:text-gray-400">📞 {contact.phone}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && filtered.length > 0 && (
            <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Company</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact, i) => (
                    <tr key={contact.id} onClick={() => setSelected(contact)}
                      className={`cursor-pointer transition-colors
                        ${selected?.id === contact.id
                          ? 'bg-green-400/15 dark:bg-green-500/10'
                          : i % 2 === 0
                            ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5'
                            : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${COMPANY_AVATAR[contact.company] || 'bg-white/40 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                            {initials(contact.name)}
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">{contact.name || '—'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {contact.company && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[contact.company] || 'bg-white/30 dark:bg-white/8 text-gray-500'}`}>
                            {contact.company}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">{contact.email || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">{contact.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length === 0 && contacts.length > 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No contacts match your search</p>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm font-medium mb-2">No contacts yet</p>
              <button onClick={() => setSelected(EMPTY)} className="text-sm text-green-600 hover:text-green-800 font-medium">
                Add your first contact →
              </button>
            </div>
          )}
        </div>
      </div>

      {selected !== null && isDesktop && (
        <ContactDrawer contact={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={selected.id ? handleDelete : null} isDesktop={true} deals={deals} />
      )}

      {selected !== null && !isDesktop && (
        <ContactDrawer contact={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={selected.id ? handleDelete : null} isDesktop={false} deals={deals} />
      )}

      <button
        onClick={() => setSelected(EMPTY)}
        className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-green-700/30 transition-all z-30">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
