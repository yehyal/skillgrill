"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AuthError, Session, User } from "@supabase/supabase-js"

import { getCurrentRelativePath } from "@/lib/auth/redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type AuthStatus =
  | "loading"
  | "anonymous"
  | "authenticated"
  | "error"
  | "unavailable"

export type AuthContextValue = {
  session: Session | null
  user: User | null
  status: AuthStatus
  error: Error | null
  signInWithGitHub: () => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<{ error: AuthError | Error | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    getSupabaseBrowserClient() ? "loading" : "unavailable"
  )
  const [error, setError] = useState<Error | null>(() =>
    getSupabaseBrowserClient()
      ? null
      : new Error("Supabase sign-in is not configured.")
  )

  useEffect(() => {
    const client = getSupabaseBrowserClient()

    if (!client) {
      return
    }

    let mounted = true
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return
      }

      setSession(nextSession)
      setError(null)
      setStatus(nextSession ? "authenticated" : "anonymous")
    })

    void client.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (!mounted) {
        return
      }

      if (sessionError) {
        setError(sessionError)
        setStatus("error")
        return
      }

      setSession(sessionData.session)
      setStatus(sessionData.session ? "authenticated" : "anonymous")
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signInWithGitHub = useCallback(async () => {
    const client = getSupabaseBrowserClient()

    if (!client) {
      const unavailableError = new Error("Supabase sign-in is not configured.")
      setError(unavailableError)
      setStatus("unavailable")
      return { error: unavailableError }
    }

    const redirectTo = new URL(
      `/auth/callback?next=${encodeURIComponent(getCurrentRelativePath())}`,
      window.location.origin
    ).toString()
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    })

    if (signInError) {
      setError(signInError)
      setStatus("error")
    }

    return { error: signInError }
  }, [])

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient()

    if (!client) {
      const unavailableError = new Error("Supabase sign-in is not configured.")
      setError(unavailableError)
      setStatus("unavailable")
      return { error: unavailableError }
    }

    const { error: signOutError } = await client.auth.signOut({ scope: "local" })

    if (signOutError) {
      setError(signOutError)
      setStatus("error")
      return { error: signOutError }
    }

    setSession(null)
    setError(null)
    setStatus("anonymous")
    return { error: null }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      error,
      signInWithGitHub,
      signOut,
    }),
    [error, session, signInWithGitHub, signOut, status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
