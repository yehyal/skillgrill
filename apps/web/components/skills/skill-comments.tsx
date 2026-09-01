"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Cross1Icon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons"
import type { CommentAuthor, ReportReason, SkillStats } from "@skill-grill/shared"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-provider"
import { getGitHubIdentity } from "@/lib/auth/identity"
import { formatSkillDate } from "@/lib/skills"
import { submitCommentReport } from "@/lib/skill-api"
import {
  removeCommentFromCache,
  useSkillCommentMutation,
  useSkillCommentsQuery,
  type OptimisticCommentItem,
} from "@/lib/skill-queries"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const MAX_COMMENT_LENGTH = 2000
const MAX_REPORT_NOTE_LENGTH = 500
const reportReasons: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam or promotion" },
  { value: "abuse", label: "Abuse or harassment" },
  { value: "unsafe", label: "Unsafe content" },
  { value: "off_topic", label: "Off topic" },
  { value: "other", label: "Other" },
]

function getReportedCommentKey(userId: string, commentId: string) {
  return `${userId}:${commentId}`
}

export function SkillComments({ slug, stats }: { slug: string; stats: SkillStats }) {
  const { session, signInWithGitHub, status } = useAuth()
  const queryClient = useQueryClient()
  const commentsQuery = useSkillCommentsQuery(slug)
  const commentMutation = useSkillCommentMutation()
  const [body, setBody] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [reportedCommentKeys, setReportedCommentKeys] = useState<Set<string>>(
    () => new Set()
  )
  const identity = session ? getGitHubIdentity(session.user) : null
  const author: CommentAuthor | null = session && identity
    ? {
        id: session.user.id,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      }
    : null
  const comments = useMemo(() => {
    const seen = new Set<string>()

    return (commentsQuery.data?.pages ?? [])
      .flatMap((page) => page.data as OptimisticCommentItem[])
      .filter((comment) => {
        if (seen.has(comment.id)) {
          return false
        }

        seen.add(comment.id)
        return true
      })
  }, [commentsQuery.data])
  const trimmedBody = body.trim()
  const isBodyValid = trimmedBody.length >= 2 && trimmedBody.length <= MAX_COMMENT_LENGTH
  const canCompose = status === "authenticated" && Boolean(author) && commentsQuery.isSuccess

  function markReported(commentId: string, reportedByUserId: string) {
    if (!session?.user.id || session.user.id !== reportedByUserId) {
      return
    }

    setReportedCommentKeys((current) => {
      const next = new Set(current)
      next.add(getReportedCommentKey(reportedByUserId, commentId))
      return next
    })
  }

  async function handleSignIn() {
    setIsSigningIn(true)
    await signInWithGitHub()
    setIsSigningIn(false)
  }

  function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session || !author || !isBodyValid || commentMutation.isPending) {
      return
    }

    commentMutation.mutate({
      id: crypto.randomUUID(),
      slug,
      userId: session.user.id,
      accessToken: session.access_token,
      body: trimmedBody,
      author,
      baseStats: stats,
    }, {
      onSuccess: () => {
        toast.success("Comment posted")
      },
    })
    setBody("")
  }

  function retryComment(comment: OptimisticCommentItem) {
    if (!session || !author || commentMutation.isPending) {
      return
    }

    commentMutation.mutate({
      id: comment.id,
      slug,
      userId: session.user.id,
      accessToken: session.access_token,
      body: comment.body,
      author,
      baseStats: stats,
    }, {
      onSuccess: () => {
        toast.success("Comment posted")
      },
    })
  }

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="comments-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Discussion
          </p>
          <h2 id="comments-title" className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
            What people are learning
          </h2>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {stats.commentsCount} {stats.commentsCount === 1 ? "comment" : "comments"}
        </p>
      </div>

      <div className="mt-8">
        {status === "authenticated" && author && !commentsQuery.isSuccess ? (
          <div
            className="border-y border-border py-6"
            role={commentsQuery.error ? "alert" : "status"}
          >
            <p className="text-sm font-medium">Load the discussion before posting.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {commentsQuery.isPending
                ? "We’ll enable the comment composer as soon as the discussion is ready."
                : "The discussion could not be loaded, so posting is paused until you retry."}
            </p>
            {commentsQuery.error ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => void commentsQuery.refetch()}
              >
                <ReloadIcon aria-hidden="true" />
                Retry discussion
              </Button>
            ) : null}
          </div>
        ) : canCompose && author ? (
          <form onSubmit={submitComment} className="border-y border-border py-6">
            <label htmlFor="comment-body" className="text-sm font-medium">
              Add to the discussion
            </label>
            <Textarea
              id="comment-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Share a practical note about using this skill…"
              maxLength={MAX_COMMENT_LENGTH}
              aria-describedby="comment-help comment-count"
              disabled={commentMutation.isPending}
              className="mt-3 min-h-28"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p id="comment-help">Keep it useful, specific, and kind. 2–2,000 characters.</p>
              <p id="comment-count" aria-live="polite">
                {body.length}/{MAX_COMMENT_LENGTH}
              </p>
            </div>
            <Button
              type="submit"
              className="mt-4"
              disabled={!isBodyValid || commentMutation.isPending}
            >
              {commentMutation.isPending ? "Posting…" : "Post comment"}
            </Button>
          </form>
        ) : status === "loading" ? (
          <div className="border-y border-border py-6" role="status">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-3 h-10 w-full" />
            <span className="sr-only">Checking your account…</span>
          </div>
        ) : (
          <div className="border-y border-border py-6">
            <p className="text-sm font-medium">Want to add context?</p>
            <p className="mt-2 max-w-[58ch] text-sm leading-6 text-muted-foreground">
              Sign in with GitHub to share what worked, what surprised you, or what others should know.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
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
        )}

        {commentsQuery.isPending ? (
          <CommentListSkeleton />
        ) : commentsQuery.error && comments.length === 0 ? (
          <div className="border-y border-border py-8" role="alert">
            <p className="text-sm font-medium">The discussion is unavailable right now.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try again in a moment to load the latest comments.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => void commentsQuery.refetch()}
            >
              <ReloadIcon aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="border-y border-border py-8">
            <p className="text-sm font-medium">No comments yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Be the first to leave a practical note for the next person trying this skill.
            </p>
          </div>
        ) : (
          <>
            <div>
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  {index > 0 ? <Separator /> : null}
                  <CommentRow
                    comment={comment}
                    onRetry={() => retryComment(comment)}
                    onRemove={() => removeCommentFromCache(queryClient, slug, comment.id)}
                    retryDisabled={commentMutation.isPending}
                    canReport={!session || session.user.id !== comment.author.id}
                    isReported={Boolean(
                      session?.user.id &&
                        reportedCommentKeys.has(
                          getReportedCommentKey(session.user.id, comment.id)
                        )
                    )}
                    onReported={(reportedByUserId) =>
                      markReported(comment.id, reportedByUserId)
                    }
                  />
                </div>
              ))}
            </div>

            {commentsQuery.isFetchNextPageError ? (
              <div className="mt-6" role="alert">
                <p className="text-sm text-destructive">Older comments could not be loaded.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 px-0 text-destructive hover:bg-transparent hover:text-destructive"
                  onClick={() => void commentsQuery.fetchNextPage()}
                >
                  Try again
                </Button>
              </div>
            ) : null}

            {commentsQuery.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                className="mt-7"
                disabled={commentsQuery.isFetchingNextPage}
                onClick={() => void commentsQuery.fetchNextPage()}
              >
                {commentsQuery.isFetchingNextPage ? "Loading older comments…" : "Load more comments"}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function CommentRow({
  comment,
  onRetry,
  onRemove,
  retryDisabled,
  canReport,
  isReported,
  onReported,
}: {
  comment: OptimisticCommentItem
  onRetry: () => void
  onRemove: () => void
  retryDisabled: boolean
  canReport: boolean
  isReported: boolean
  onReported: (userId: string) => void
}) {
  const authorLabel = comment.author.displayName ?? comment.author.username
  const initials = authorLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GH"

  return (
    <article className="flex gap-3 py-6">
      <Avatar className="size-9">
        <AvatarImage src={comment.author.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <p className="font-medium">{authorLabel}</p>
          <p className="text-muted-foreground">@{comment.author.username}</p>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <time dateTime={comment.createdAt} className="text-muted-foreground">
            {formatSkillDate(comment.createdAt)}
          </time>
          {comment.clientStatus === undefined && canReport ? (
            <ReportCommentDialog
              commentId={comment.id}
              isReported={isReported}
              onReported={onReported}
            />
          ) : null}
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
          {comment.body}
        </p>
        {comment.clientStatus === "sending" ? (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            Sending…
          </p>
        ) : null}
        {comment.clientStatus === "failed" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <p className="text-destructive" role="alert">Not sent</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={retryDisabled}>
              <ReloadIcon aria-hidden="true" />
              Retry
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={retryDisabled}>
              <TrashIcon aria-hidden="true" />
              Remove
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function ReportCommentDialog({
  commentId,
  isReported,
  onReported,
}: {
  commentId: string
  isReported: boolean
  onReported: (userId: string) => void
}) {
  const { session, signInWithGitHub, status } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState<ReportReason>("spam")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleId = `report-comment-title-${commentId}`
  const descriptionId = `report-comment-description-${commentId}`
  const reasonName = `report-reason-${commentId}`
  const noteIsValid = note.trim().length <= MAX_REPORT_NOTE_LENGTH

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (showDialog && !dialog.open) {
      dialog.showModal()
    } else if (!showDialog && dialog.open) {
      dialog.close()
    }
  }, [showDialog])

  function openDialog() {
    setError(null)
    setShowDialog(true)
  }

  async function handleSignIn() {
    setIsSigningIn(true)

    try {
      await signInWithGitHub()
    } finally {
      setIsSigningIn(false)
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session || status !== "authenticated" || !noteIsValid || isSubmitting) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const trimmedNote = note.trim()
      await submitCommentReport(commentId, session.access_token, {
        reason,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      })
      toast.success("Report submitted")
      onReported(session.user.id)
      setShowDialog(false)
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : "The report could not be submitted. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isReported) {
    return <span className="ml-auto text-xs text-muted-foreground">Reported</span>
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={openDialog}
      >
        Report
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-md border border-border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-foreground/20 sm:w-[calc(100%-2rem)]"
        onClose={() => setShowDialog(false)}
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
                Community safety
              </p>
              <h2 id={titleId} className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                Report this comment
              </h2>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              autoFocus
              aria-label="Close report dialog"
              onClick={() => dialogRef.current?.close()}
            >
              <Cross1Icon aria-hidden="true" />
            </Button>
          </div>

          <p id={descriptionId} className="mt-4 text-sm leading-6 text-muted-foreground">
            Reports are private signals for future moderation review. They do not hide comments automatically.
          </p>

          {status === "authenticated" && session ? (
            <form onSubmit={(event) => void submitReport(event)} className="mt-6">
              <fieldset disabled={isSubmitting}>
                <legend className="text-sm font-medium">Why are you reporting it?</legend>
                <div className="mt-3 grid gap-3">
                  {reportReasons.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name={reasonName}
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="size-4 accent-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label htmlFor={`report-note-${commentId}`} className="mt-6 block text-sm font-medium">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id={`report-note-${commentId}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={MAX_REPORT_NOTE_LENGTH}
                placeholder="Add context for a moderator…"
                aria-invalid={!noteIsValid}
                disabled={isSubmitting}
                className="mt-3 min-h-24"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <p>
                  {noteIsValid ? "Keep the note factual and concise." : "Notes must be 500 characters or fewer."}
                </p>
                <p aria-live="polite">{note.length}/{MAX_REPORT_NOTE_LENGTH}</p>
              </div>

              {error ? (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="mt-6" disabled={!noteIsValid || isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit report"}
              </Button>
            </form>
          ) : status === "loading" ? (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Checking your account…
            </p>
          ) : (
            <div className="mt-6">
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in with GitHub to send a private report to the moderation team.
              </p>
              <Button
                type="button"
                className="mt-4"
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
          )}
        </div>
      </dialog>
    </>
  )
}

function CommentListSkeleton() {
  return (
    <div role="status" aria-label="Loading comments">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex gap-3 border-b border-border py-6 last:border-b-0">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-3/4 max-w-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading comments.</span>
    </div>
  )
}
