"use client"

import { useEffect, useRef, useState } from "react"
import { ThickArrowDownIcon, ThickArrowUpIcon, Cross1Icon } from "@radix-ui/react-icons"
import type { SkillStats, VoteValue } from "@skill-grill/shared"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import { useSkillMeQuery, useSkillVoteMutation } from "@/lib/skill-queries"
import { toast } from "sonner"

export function SkillVoteBox({
  slug,
  stats,
  statsIsPending,
}: {
  slug: string
  stats: SkillStats
  statsIsPending: boolean
}) {
  const { session, signInWithGitHub, status } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const meQuery = useSkillMeQuery(slug, session?.user.id, session?.access_token)
  const voteMutation = useSkillVoteMutation()
  const myVote: VoteValue = meQuery.data?.data.myVote ?? null
  const controlsDisabled =
    status === "loading" ||
    (status === "authenticated" && meQuery.isPending) ||
    voteMutation.isPending

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (showSignIn && !dialog.open) {
      dialog.showModal()
    } else if (!showSignIn && dialog.open) {
      dialog.close()
    }
  }, [showSignIn])

  function handleVote(value: 1 | -1) {
    if (!session) {
      setShowSignIn(true)
      return
    }

    if (!meQuery.isSuccess) {
      return
    }

    setShowSignIn(false)
    const nextVote = myVote === value ? null : value

    voteMutation.mutate({
      slug,
      userId: session.user.id,
      accessToken: session.access_token,
      value: nextVote,
      baseStats: stats,
    }, {
      onSuccess: () => {
        toast.success(
          nextVote === null
            ? "Rating removed."
            : nextVote === 1
              ? "Marked Well done."
              : "Marked Undercooked."
        )
      },
      onError: () => {
        toast.error("Couldn’t save your rating. Your previous choice has been restored.")
      },
    })
  }

  async function handleSignIn() {
    setIsSigningIn(true)
    const result = await signInWithGitHub()

    if (!result.error) {
      setShowSignIn(false)
    }

    setIsSigningIn(false)
  }

  return (
    <section
      className="h-fit w-full border-y border-border py-3"
      aria-labelledby="verdict-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p
              id="verdict-title"
              className="font-mono text-lg uppercase tracking-[0.18em] text-primary"
            >
              The verdict
            </p>
            {/*<h2 id="verdict-title" className="text-base font-semibold">
              Did it deliver?
            </h2>*/}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tried it? Add your take.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Rate this skill">
          <Button
            type="button"
            size="sm"
            variant={myVote === 1 ? "default" : "outline"}
            aria-pressed={myVote === 1}
            aria-label={`Mark this skill Well done. ${stats.upvotesCount} positive votes.`}
            disabled={controlsDisabled}
            onClick={() => handleVote(1)}
            className="gap-1.5 px-2.5"
          >
            <span className="inline-flex items-center gap-1.5">
              <ThickArrowUpIcon aria-hidden="true" />
              Well done
            </span>
            <span className="font-mono text-xs tabular-nums">{stats.upvotesCount}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={myVote === -1 ? "default" : "outline"}
            aria-pressed={myVote === -1}
            aria-label={`Mark this skill Undercooked. ${stats.downvotesCount} negative votes.`}
            disabled={controlsDisabled}
            onClick={() => handleVote(-1)}
            className="gap-1.5 px-2.5"
          >
            <span className="inline-flex items-center gap-1.5">
              <ThickArrowDownIcon aria-hidden="true" />
              Undercooked
            </span>
            <span className="font-mono text-xs tabular-nums">{stats.downvotesCount}</span>
          </Button>
        </div>
      </div>

      {status === "loading" ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Checking your account…
        </p>
      ) : null}

      {meQuery.error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm text-destructive">Could not load your rating.</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-1 px-0 text-destructive hover:bg-transparent hover:text-destructive"
            onClick={() => void meQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {voteMutation.isPending ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Saving your rating…
        </p>
      ) : null}
      {voteMutation.isError ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          Couldn’t save your rating. Your previous choice has been restored.
        </p>
      ) : null}
      {statsIsPending ? (
        <p className="mt-4 text-xs text-muted-foreground" role="status">
          Updating votes…
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="sign-in-title"
        aria-describedby="sign-in-description"
        aria-modal="true"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-md border border-border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-foreground/20 sm:w-[calc(100%-2rem)]"
        onClose={() => setShowSignIn(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close()
          }
        }}
      >
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                Your take
              </p>
              <h2 id="sign-in-title" className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                Sign in to rate
              </h2>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              autoFocus
              aria-label="Close sign-in dialog"
              onClick={() => dialogRef.current?.close()}
            >
              <Cross1Icon aria-hidden="true" />
            </Button>
          </div>
          <p id="sign-in-description" className="mt-4 text-sm leading-6 text-muted-foreground">
            Sign in with GitHub to add one rating per skill.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => void handleSignIn()}
            disabled={status === "unavailable" || isSigningIn}
          >
            {status === "unavailable"
              ? "GitHub sign-in unavailable"
              : isSigningIn
                ? "Opening GitHub…"
                : "Sign in with GitHub"}
          </Button>
        </div>
      </dialog>
    </section>
  )
}
