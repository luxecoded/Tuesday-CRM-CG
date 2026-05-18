import { useState } from 'react'
import { SEED } from '../lib/seed'

export function useDeals() {
  const [deals, setDeals] = useState(SEED.deals)

  async function updateDeal(updated) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  return { deals, loading: false, error: null, updateDeal }
}
