import type { RosterList } from '@/types'

// Same-origin '/api' works whenever the backend serves this frontend (production, single
// Railway service) or Vite's dev proxy is in front of it (local dev — see vite.config.ts).
// When the frontend is deployed separately from the backend (its own Railway service,
// Vercel, Netlify...), point it at the backend's public URL via this build-time env var.
// Exported for call sites that can't use the `request` helper below (e.g. ChatWidget's
// SSE stream, which needs a raw `fetch` instead of a JSON response).
export const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`
const BASE = API_BASE_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (res.status === 204) return undefined as T

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // empty/non-JSON body — leave as null
  }

  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error ?? `Error ${res.status}`
    throw new ApiError(res.status, message)
  }
  return body as T
}

export interface AuthUser {
  id: string
  username: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const api = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: (token: string) => request<{ user: AuthUser }>('/auth/me', { token }),

  listRosters: (token: string) => request<{ rosters: RosterList[] }>('/rosters', { token }),

  putRoster: (token: string, roster: RosterList) =>
    request<{ roster: RosterList }>(`/rosters/${roster.id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(roster),
    }),

  deleteRoster: (token: string, id: string) =>
    request<void>(`/rosters/${id}`, { method: 'DELETE', token }),
}
