import { useState, useEffect } from 'react'
import type { MissionsData } from '@/types'

interface MissionsDataState {
  missions: MissionsData | null
  loading: boolean
  error: string | null
}

export function useMissionsData(): MissionsDataState {
  const [state, setState] = useState<MissionsDataState>({ missions: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/data/missions.json')
        if (!res.ok) throw new Error(`Error cargando missions.json: ${res.status}`)
        const data = (await res.json()) as MissionsData
        if (!cancelled) setState({ missions: data, loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ missions: null, loading: false, error: String(err) })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
