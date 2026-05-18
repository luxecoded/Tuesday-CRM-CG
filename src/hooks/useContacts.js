import { useState } from 'react'
import { SEED } from '../lib/seed'

export function useContacts() {
  const [contacts, setContacts] = useState(
    [...SEED.contacts].sort((a, b) => a.name.localeCompare(b.name))
  )

  async function addContact(c) {
    const added = { ...c, id: Math.random().toString(36).slice(2) }
    setContacts(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)))
    return added
  }

  async function updateContact(c) {
    setContacts(prev => prev.map(x => x.id === c.id ? c : x))
  }

  async function deleteContact(id) {
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return { contacts, loading: false, error: null, addContact, updateContact, deleteContact }
}
