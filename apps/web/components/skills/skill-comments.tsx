"use client"

import { useMemo, useState } from "react"
import { ReloadIcon, TrashIcon } from "@radix-ui/react-icons"
import type { CommentAuthor, SkillStats } from "@skill-grill/shared"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-provider"
import { getGitHubIdentity } from "@/lib/auth/identity"
import { formatSkillDate } from "@/lib/skills"
import {
  removeCommentFromCache,
  useSkillCommentMutation,
  useSkillCommentsQuery,
  type OptimisticCommentItem,
} from "@/lib/skill-queries"
import { useQueryClient } from "@tanstack/react-query"

const MAX_COMMENT_LENGTH = 2000

export function SkillComments({ slug, stats }: { slug: string; stats: SkillStats }) {
  const { session, signInWithGitHub, status } = useAuth()
  const queryClient = useQueryClient()
  const commentsQuery = useSkillCommentsQuery(slug)
  const commentMutation = useSkillCommentMutation()
  const [body, setBody] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
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

        {commentMutation.error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            Your comment could not be posted. You can retry it below.
          </p>
        ) : null}

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
}: {
  comment: OptimisticCommentItem
  onRetry: () => void
  onRemove: () => void
  retryDisabled: boolean
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
