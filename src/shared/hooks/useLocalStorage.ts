import { useState, useEffect } from 'react'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      const parsed = JSON.parse(raw) as T
      // Shallow-merge over defaultValue so a stale shape (e.g. after a field was
      // renamed/added) backfills missing keys instead of leaving them undefined.
      return isPlainObject(parsed) && isPlainObject(defaultValue)
        ? { ...defaultValue, ...parsed }
        : parsed
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state])

  return [state, setState]
}
