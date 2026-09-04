"use client"

import { useEffect, useRef, useState } from "react"
import { ThickArrowDownIcon, ThickArrowUpIcon, Cross1Icon } from "@radix-ui/react-icons"
import type {
  SkillStats,
  UndercookedReason,
  VoteReason,
  VoteRequest,
  VoteValue,
  WellDoneReason,
} from "@skill-grill/shared"

import { GitHubSignInPrompt } from "@/components/auth/github-sign-in-prompt"
import { SkillReasonSummary } from "@/components/skills/skill-reason-display"
import {
  AlwaysVisibleReasonPicker,
  VoteFirstReasonPicker,
} from "@/components/skills/vote-reason-pickers"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import { useSkillMeQuery, useSkillVoteMutation } from "@/lib/skill-queries"
import {
  clearPendingVoteIntent,
  readPendingVoteIntent,
  savePendingVoteIntent,
  type PendingVoteIntent,
} from "@/lib/vote-intent"
import {
  VOTE_REASON_LABELS,
  getReasonValue,
  isReasonForVote,
  voteReasonUi,
} from "@/lib/vote-reasons"
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
  const { session, status } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const [reasonPrompt, setReasonPrompt] = useState<1 | -1 | null>(null)
  const [pendingIntent, setPendingIntent] = useState<PendingVoteIntent | null>(null)
  const [pendingConfirmError, setPendingConfirmError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const oauthStartedRef = useRef(false)
  const meQuery = useSkillMeQuery(slug, session?.user.id, session?.access_token)
  const voteMutation = useSkillVoteMutation()
  const myVote: VoteValue = meQuery.data?.data.myVote ?? null
  const myReason: VoteReason | null = meQuery.data?.data.myReason ?? null
  const activePendingIntent = status === "authenticated" ? pendingIntent : null
  const controlsDisabled =
    status === "loading" ||
    (status === "authenticated" && (!meQuery.isSuccess || meQuery.isPending)) ||
    voteMutation.isPending ||
    activePendingIntent !== null

  useEffect(() => {
    if (status !== "authenticated" || meQuery.isPending || !meQuery.isSuccess) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setPendingIntent(readPendingVoteIntent(slug))
      }
    })

    return () => {
      cancelled = true
    }
  }, [meQuery.isPending, meQuery.isSuccess, slug, status])

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

  function startGuestVote(value: 1 | -1, reason: VoteReason | null) {
    savePendingVoteIntent(slug, value, reason)
    oauthStartedRef.current = false
    setShowSignIn(true)
  }

  function handleVote(value: 1 | -1) {
    if (!session || status !== "authenticated") {
      startGuestVote(value, null)
      return
    }

    if (!meQuery.isSuccess) {
      return
    }

    const nextVote = myVote === value ? null : value
    const previousVote = myVote
    const request = nextVote === null ? { value: null } : makeVoteRequest(nextVote, null)

    submitVote(request, false, () => {
      if (
        voteReasonUi === "vote-first" &&
        nextVote !== null &&
        previousVote !== nextVote
      ) {
        setReasonPrompt(nextVote)
      } else {
        setReasonPrompt(null)
      }
    })
  }

  function handleReasonSelect(reason: VoteReason) {
    const value = getReasonValue(reason)

    if (!session || status !== "authenticated") {
      startGuestVote(value, reason)
      return
    }

    if (!meQuery.isSuccess) {
      return
    }

    const reasonToSave =
      myVote === value && isReasonForVote(myReason, value) && myReason === reason
        ? null
        : reason
    const reasonOnly = myVote === value

    submitVote(makeVoteRequest(value, reasonToSave), reasonOnly, () => {
      setReasonPrompt(null)
      focusVerdict(value)
    })
  }

  function submitVote(
    request: VoteRequest,
    reasonOnly: boolean,
    onSuccess?: () => void,
    onError?: () => void
  ) {
    if (!session || status !== "authenticated" || !meQuery.isSuccess) {
      return
    }

    setPendingConfirmError(null)
    setShowSignIn(false)
    voteMutation.mutate(
      {
        slug,
        userId: session.user.id,
        accessToken: session.access_token,
        request,
        baseStats: stats,
      },
      {
        onSuccess: () => {
          onSuccess?.()

          if (!reasonOnly) {
            toast.success(
              request.value === null
                ? "Rating removed."
                : request.value === 1
                  ? "Marked Well done."
                  : "Marked Undercooked."
            )
          }
        },
        onError: () => {
          onError?.()
          toast.error("Couldn’t save your rating. Your previous choice has been restored.")
        },
      }
    )
  }

  function confirmPendingIntent() {
    if (!activePendingIntent || !session || !meQuery.isSuccess) {
      return
    }

    const intent = activePendingIntent
    const reasonOnly = myVote === intent.value && intent.reason !== null

    submitVote(
      makeVoteRequest(intent.value, intent.reason),
      reasonOnly,
      () => {
        clearPendingVoteIntent()
        setPendingIntent(null)

        if (voteReasonUi === "vote-first" && intent.reason === null && myVote === null) {
          setReasonPrompt(intent.value)
        }
      },
      () => setPendingConfirmError("Could not submit that verdict. You can retry it here.")
    )
  }

  function discardPendingIntent() {
    clearPendingVoteIntent()
    setPendingIntent(null)
    setPendingConfirmError(null)
  }

  function focusVerdict(value: VoteValue) {
    if (value === null || typeof window === "undefined") {
      return
    }

    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-verdict="${value}"]`)?.focus()
    })
  }

  return (
    <section
      className="h-fit w-full border-y border-border py-3"
      aria-labelledby="verdict-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            id="verdict-title"
            className="font-mono text-lg uppercase tracking-[0.18em] text-primary"
          >
            The verdict
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tried it? Add your take.</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Rate this skill">
          <Button
            type="button"
            size="sm"
            data-verdict="1"
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
            data-verdict="-1"
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

      {voteReasonUi === "vote-first" ? (
        <VoteFirstReasonPicker
          promptValue={reasonPrompt}
          currentVote={myVote}
          currentReason={myReason}
          pending={controlsDisabled}
          onReasonSelect={handleReasonSelect}
          onDismiss={() => {
            setReasonPrompt(null)
            focusVerdict(myVote)
          }}
          onChange={() => {
            if (myVote !== null) {
              setReasonPrompt(myVote)
            }
          }}
        />
      ) : (
        <AlwaysVisibleReasonPicker
          currentVote={myVote}
          currentReason={myReason}
          pending={controlsDisabled}
          onReasonSelect={handleReasonSelect}
        />
      )}

      <SkillReasonSummary stats={stats} />

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

      {activePendingIntent ? (
        <PendingVoteConfirmation
          intent={activePendingIntent}
          isLoading={voteMutation.isPending}
          error={pendingConfirmError}
          onConfirm={confirmPendingIntent}
          onDiscard={discardPendingIntent}
        />
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
        onClose={() => {
          setShowSignIn(false)

          if (!oauthStartedRef.current) {
            clearPendingVoteIntent()
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close()
          }
        }}
      >
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Your take</p>
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
          <GitHubSignInPrompt
            className="mt-6"
            description={<span id="sign-in-description">Sign in with GitHub to add one rating per skill.</span>}
            onSignInStarted={() => {
              oauthStartedRef.current = true
            }}
            onSignedIn={() => setShowSignIn(false)}
          />
        </div>
      </dialog>
    </section>
  )
}

function makeVoteRequest(value: 1 | -1, reason: VoteReason | null): VoteRequest {
  if (value === 1) {
    return {
      value,
      reason: reason && getReasonValue(reason) === 1 ? reason as WellDoneReason : null,
    }
  }

  return {
    value,
    reason: reason && getReasonValue(reason) === -1 ? reason as UndercookedReason : null,
  }
}

function PendingVoteConfirmation({
  intent,
  isLoading,
  error,
  onConfirm,
  onDiscard,
}: {
  intent: PendingVoteIntent
  isLoading: boolean
  error: string | null
  onConfirm: () => void
  onDiscard: () => void
}) {
  return (
    <div className="mt-4 border border-primary/35 bg-muted/30 p-3" role="region" aria-label="Pending vote">
      <p className="text-sm font-medium">Ready to submit your verdict?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {intent.value === 1 ? "Well done" : "Undercooked"}
        {intent.reason ? ` · ${VOTE_REASON_LABELS[intent.reason]}` : " · No reason selected"}
      </p>
      {error ? <p className="mt-2 text-xs text-destructive" role="alert">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={isLoading} onClick={onConfirm}>
          {isLoading ? "Submitting…" : "Submit verdict"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={isLoading} onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}
