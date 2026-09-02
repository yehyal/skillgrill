"use client"

import { useState } from "react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getGitHubIdentity } from "@/lib/auth/identity"
import { useAuth } from "@/lib/auth/auth-provider"
import { cn } from "@/lib/utils"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

function AuthSkeleton() {
  return (
    <div
      className="flex items-center gap-3"
      role="status"
      aria-label="Loading account"
    >
      <span className="h-3 w-16 rounded-sm bg-muted" aria-hidden="true" />
      <span className="size-8 rounded-full bg-muted" aria-hidden="true" />
    </div>
  )
}

export function AppHeader() {
  const { error, session, signInWithGitHub, signOut, status, user } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const identity = user ? getGitHubIdentity(user) : null
  const isAuthenticated = Boolean(session && identity)
  const errorMessage =
    actionError ??
    (status === "unavailable"
      ? "GitHub sign-in is unavailable until Supabase is configured."
      : error?.message
        ? `GitHub sign-in failed. ${error.message}`
        : null)

  async function handleSignIn() {
    setActionError(null)
    setIsSigningIn(true)
    const result = await signInWithGitHub()

    if (result.error) {
      setActionError(`GitHub sign-in failed. ${result.error.message}`)
    }

    setIsSigningIn(false)
  }

  async function handleSignOut() {
    setActionError(null)
    setIsSigningOut(true)

    try {
      const result = await signOut()

      if (result.error) {
        toast.error("Sign-out failed", {
          description: result.error.message,
        })
      } else {
        toast.success("Signed out")
      }
    } catch (signOutError) {
      toast.error("Sign-out failed", {
        description:
          signOutError instanceof Error
            ? signOutError.message
            : "Please try again.",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="border-b border-border bg-background/95">
      <PageContainer className="flex min-h-14 items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:gap-3"
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-[0.6875rem] font-bold text-primary-foreground"
            aria-hidden="true"
          >
            SG
          </span>
          <span className="hidden truncate text-sm font-semibold sm:inline">
            Skill Grill
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/skills"
              className="rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="sm:hidden">Browse</span>
              <span className="hidden sm:inline">Browse skills</span>
            </Link>
          </nav>

          <ThemeToggle />

          {status === "loading" ? (
            <AuthSkeleton />
          ) : isAuthenticated && identity ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-9 items-center gap-2 rounded-md p-1 pr-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Open account menu for ${identity.username}`}
                >
                  <Avatar className="size-7">
                    <AvatarImage src={identity.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>{identity.initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate sm:inline">
                    {identity.username}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">
                  {identity.displayName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isSigningOut}
                  onSelect={() => void handleSignOut()}
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleSignIn()}
              disabled={status === "unavailable" || isSigningIn}
              aria-describedby={errorMessage ? "auth-message" : undefined}
            >
              {status === "unavailable" ? (
                <>
                  <span className="sm:hidden">Unavailable</span>
                  <span className="hidden sm:inline">GitHub sign-in unavailable</span>
                </>
              ) : isSigningIn ? (
                <>
                  <span className="sm:hidden">Opening…</span>
                  <span className="hidden sm:inline">Opening GitHub...</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Sign in</span>
                  <span className="hidden sm:inline">Sign in with GitHub</span>
                </>
              )}
            </Button>
          )}
        </div>
      </PageContainer>

      {errorMessage ? (
        <PageContainer>
          <p
            id="auth-message"
            className={cn(
              "border-t border-border py-3 text-sm text-destructive",
              status === "unavailable" && "text-muted-foreground"
            )}
            role="alert"
          >
            {errorMessage}
          </p>
        </PageContainer>
      ) : null}
    </header>
  )
}
