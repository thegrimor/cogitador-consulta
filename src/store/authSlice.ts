import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  id: string
  username: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authLoading: state => {
      state.status = 'loading'
      state.error = null
    },

    credentialsSet: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.status = 'authenticated'
      state.error = null
    },

    credentialsCleared: state => {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
    },

    authFailed: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.error = action.payload
      state.user = null
      state.token = null
    },
  },
})

export const { authLoading, credentialsSet, credentialsCleared, authFailed } = authSlice.actions
export const authReducer = authSlice.reducer

export function selectAuthUser(state: { auth: AuthState }): AuthUser | null {
  return state.auth.user
}

export function selectAuthToken(state: { auth: AuthState }): string | null {
  return state.auth.token
}

export function selectAuthStatus(state: { auth: AuthState }): AuthState['status'] {
  return state.auth.status
}

export function selectAuthError(state: { auth: AuthState }): string | null {
  return state.auth.error
}
