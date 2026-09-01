"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, Cross1Icon } from "@radix-ui/react-icons"
import type { SkillStats, VoteValue } from "@skill-grill/shared"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
        toast.success(nextVote === null ? "Vote removed" : "Vote saved")
      },
      onError: () => {
        toast.error("Vote rolled back", {
          description: "Your vote could not be saved. Try again when the API is available.",
        })
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
    <aside
      className="h-fit rounded-md border border-border bg-card p-5"
      aria-labelledby="community-title"
    >
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
        Community pulse
      </p>
      <h2 id="community-title" className="mt-3 text-xl font-semibold tracking-[-0.04em]">
        Cast your signal
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Vote once to help agents find skills that hold up in practice.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Vote on this skill">
        <Button
          type="button"
          variant={myVote === 1 ? "default" : "outline"}
          aria-pressed={myVote === 1}
          aria-label={`Upvote ${slug}`}
          disabled={controlsDisabled}
          onClick={() => handleVote(1)}
        >
          <ArrowUpIcon aria-hidden="true" />
          Upvote
        </Button>
        <Button
          type="button"
          variant={myVote === -1 ? "default" : "outline"}
          aria-pressed={myVote === -1}
          aria-label={`Downvote ${slug}`}
          disabled={controlsDisabled}
          onClick={() => handleVote(-1)}
        >
          <ArrowDownIcon aria-hidden="true" />
          Downvote
        </Button>
      </div>

      {status === "loading" ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Checking your account…
        </p>
      ) : null}

      {meQuery.error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm text-destructive">Could not load your vote state.</p>
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

      <Separator className="my-5" />
      <dl className="grid gap-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Score</dt>
          <dd className="font-semibold tabular-nums" aria-live="polite">
            {stats.score}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Upvotes</dt>
          <dd className="font-semibold tabular-nums">{stats.upvotesCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Downvotes</dt>
          <dd className="font-semibold tabular-nums">{stats.downvotesCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Comments</dt>
          <dd className="font-semibold tabular-nums">{stats.commentsCount}</dd>
        </div>
      </dl>
      {statsIsPending ? (
        <p className="mt-4 text-xs text-muted-foreground" role="status">
          Refreshing community stats…
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
                Community signal
              </p>
              <h2 id="sign-in-title" className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                Sign in to vote
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
            Sign in with GitHub to save your vote and keep one signal per skill.
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
    </aside>
  )
}
