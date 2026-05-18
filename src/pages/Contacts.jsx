import { useState } from 'react'
import { useContacts } from '../hooks/useContacts'
import { useDeals } from '../hooks/useDeals'
import ContactDrawer from '../components/ContactDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'

const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Paradise Windows': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Elite Windows':    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const COMPANY_AVATAR = {
  'Isis Windows':     'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  'Paradise Windows': 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  'Elite Windows':    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
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

  const isDesktop = window.innerWidth >= 1024
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
    setSelected(null)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading contacts…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{contacts.length} contacts</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button onClick={() => setView('card')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                ⊞ Cards
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                ☰ List
              </button>
            </div>
            <button onClick={() => setSelected(EMPTY)}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex-shrink-0 space-y-2 transition-colors">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search contacts…"
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...COMPANIES].map(c => (
              <button key={c} onClick={() => setCompanyFilter(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${companyFilter === c
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0 bg-gray-100 dark:bg-gray-900 transition-colors">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex justify-around transition-colors">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{contacts.length}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Total</div>
            </div>
            {COMPANIES.map(co => {
              const count = contacts.filter(c => c.company === co).length
              if (count === 0) return null
              return (
                <div key={co} className="text-center">
                  <div className="text-base font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{co.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6 bg-gray-100 dark:bg-gray-900 transition-colors">

          {/* Card view */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(contact => (
                <div key={contact.id} onClick={() => setSelected(contact)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all
                    ${selected?.id === contact.id
                      ? 'border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${COMPANY_AVATAR[contact.company] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {initials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {contact.name || '—'}
                      </div>
                      {contact.company && (
                        <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[contact.company] || 'bg-gray-50 dark:bg-gray-700 text-gray-500'}`}>
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                  {(contact.email || contact.phone) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                      {contact.email && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">✉ {contact.email}</div>}
                      {contact.phone && <div className="text-xs text-gray-400 dark:text-gray-500">📞 {contact.phone}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filtered.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:table-cell">Company</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden lg:table-cell">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact, i) => (
                    <tr key={contact.id} onClick={() => setSelected(contact)}
                      className={`cursor-pointer transition-colors
                        ${selected?.id === contact.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : i % 2 === 0
                            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            : 'bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${COMPANY_AVATAR[contact.company] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {initials(contact.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{contact.name || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {contact.company && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[contact.company] || 'bg-gray-50 dark:bg-gray-700 text-gray-500'}`}>
                            {contact.company}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400 dark:text-gray-500">{contact.email || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 dark:text-gray-500">{contact.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length === 0 && contacts.length > 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No contacts match your search</p>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm font-medium mb-2">No contacts yet</p>
              <button onClick={() => setSelected(EMPTY)}
                className="text-sm text-indigo-500 hover:text-indigo-600 font-medium">
                Add your first contact →
              </button>
            </div>
          )}
        </div>
      </div>

      {selected !== null && isDesktop && (
        <ContactDrawer
          contact={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={selected.id ? handleDelete : null}
          isDesktop={true}
          deals={deals}
        />
      )}

      {selected !== null && !isDesktop && (
        <ContactDrawer
          contact={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={selected.id ? handleDelete : null}
          isDesktop={false}
          deals={deals}
        />
      )}
    </div>
  )
}
