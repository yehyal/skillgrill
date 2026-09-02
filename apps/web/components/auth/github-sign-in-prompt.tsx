"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import { cn } from "@/lib/utils"

export function GitHubSignInPrompt({
  description,
  className,
  onSignedIn,
}: {
  description: ReactNode
  className?: string
  onSignedIn?: () => void
}) {
  const { signInWithGitHub, status } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function handleSignIn() {
    setIsSigningIn(true)
    const result = await signInWithGitHub()

    if (!result.error) {
      onSignedIn?.()
    }

    setIsSigningIn(false)
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <Button
        type="button"
        className="w-fit"
        onClick={() => void handleSignIn()}
        disabled={status === "unavailable" || status === "loading" || isSigningIn}
      >
        {status === "unavailable"
          ? "GitHub sign-in unavailable"
          : isSigningIn
            ? "Opening GitHub…"
            : "Sign in with GitHub"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link
          href="/privacy"
          className="text-foreground underline decoration-border underline-offset-4 outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms"
          className="text-foreground underline decoration-border underline-offset-4 outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Terms
        </Link>
        .
      </p>
    </div>
  )
}
