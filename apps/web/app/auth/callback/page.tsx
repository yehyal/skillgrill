"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import { sanitizeRedirectPath } from "@/lib/auth/redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type CallbackState = "checking" | "error"

function CallbackFallback() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <p className="text-sm text-muted-foreground" role="status">
        Finishing GitHub sign-in...
      </p>
    </main>
  )
}

function CallbackView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signInWithGitHub } = useAuth()
  const next = sanitizeRedirectPath(searchParams.get("next"))
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error")
  const client = getSupabaseBrowserClient()
  const [state, setState] = useState<CallbackState>(
    providerError || !client ? "error" : "checking"
  )
  const [message, setMessage] = useState<string | null>(
    providerError
      ? `GitHub sign-in was not completed. ${providerError}`
      : !client
        ? "GitHub sign-in is unavailable until Supabase is configured."
        : null
  )

  useEffect(() => {
    if (providerError) {
      return
    }

    if (!client) {
      return
    }

    let finished = false
    const missingSessionTimer = window.setTimeout(() => {
      if (!finished) {
        setState("error")
        setMessage(
          "GitHub sign-in did not return a session. You can try the sign-in again."
        )
      }
    }, 3500)

    const redirectToNext = () => {
      if (finished) {
        return
      }

      finished = true
      window.clearTimeout(missingSessionTimer)
      router.replace(next)
    }

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        redirectToNext()
      }
    })

    void client.auth.getSession().then(({ data: sessionData, error }) => {
      if (finished) {
        return
      }

      if (error) {
        finished = true
        window.clearTimeout(missingSessionTimer)
        setState("error")
        setMessage(`GitHub sign-in failed. ${error.message}`)
        return
      }

      if (sessionData.session) {
        redirectToNext()
      }
    })

    return () => {
      finished = true
      window.clearTimeout(missingSessionTimer)
      data.subscription.unsubscribe()
    }
  }, [client, next, providerError, router])

  async function handleRetry() {
    setState("checking")
    setMessage(null)
    const result = await signInWithGitHub()

    if (result.error) {
      setState("error")
      setMessage(`GitHub sign-in failed. ${result.error.message}`)
    }
  }

  if (state === "checking") {
    return <CallbackFallback />
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <section
        className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-sm sm:p-8"
        aria-labelledby="callback-title"
      >
        <p className="text-sm font-medium text-primary">Sign-in problem</p>
        <h1
          id="callback-title"
          className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-card-foreground"
        >
          We could not finish your GitHub sign-in.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground" role="alert">
          {message ?? "Please try again."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => void handleRetry()}
            disabled={!getSupabaseBrowserClient()}
          >
            Try GitHub sign-in again
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href={next}>Return</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackView />
    </Suspense>
  )
}
