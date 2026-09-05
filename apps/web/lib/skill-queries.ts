"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import type {
  CommentAuthor,
  CommentCreateResponse,
  CommentItem,
  CommentPageResponse,
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  SkillMeResponse,
  SkillStats,
  SkillStatsResponse,
  VoteRequest,
  VoteResponse,
  VoteValue,
} from "@skill-grill/shared"

import { ApiRequestError } from "@/lib/api"
import {
  fetchSkillComments,
  fetchSkillDetail,
  fetchSkillList,
  fetchSkillMe,
  fetchSkillStats,
  submitSkillComment,
  submitSkillVote,
} from "@/lib/skill-api"

export const COMMENT_PAGE_SIZE = 20

export const skillQueryKeys = {
  all: ["skills"] as const,
  lists: () => ["skills", "list"] as const,
  list: (query: SkillListQuery) => ["skills", "list", query] as const,
  detail: (slug: string) => ["skills", "detail", slug] as const,
  stats: (slug: string) => ["skills", "stats", slug] as const,
  me: (slug: string, userId: string) => ["skills", "me", slug, userId] as const,
  comments: (slug: string) => ["skills", "comments", slug] as const,
}

export function useSkillListQuery(query: SkillListQuery) {
  return useQuery({
    queryKey: skillQueryKeys.list(query),
    queryFn: ({ signal }) => fetchSkillList(query, signal),
    staleTime: 60_000,
    retry: shouldRetry,
  })
}

export function useSkillDetailQuery(slug: string) {
  return useQuery({
    queryKey: skillQueryKeys.detail(slug),
    queryFn: ({ signal }) => fetchSkillDetail(slug, signal),
    staleTime: 5 * 60_000,
    retry: shouldRetry,
    enabled: Boolean(slug),
  })
}

export function useSkillStatsQuery(slug: string) {
  return useQuery({
    queryKey: skillQueryKeys.stats(slug),
    queryFn: ({ signal }) => fetchSkillStats(slug, signal),
    staleTime: 10_000,
    retry: shouldRetry,
    enabled: Boolean(slug),
  })
}

export function useSkillCommentsQuery(slug: string) {
  return useInfiniteQuery({
    queryKey: skillQueryKeys.comments(slug),
    queryFn: ({ pageParam, signal }) =>
      fetchSkillComments(slug, {
        limit: COMMENT_PAGE_SIZE,
        cursor: pageParam,
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: shouldRetry,
    enabled: Boolean(slug),
  })
}

export function useSkillMeQuery(
  slug: string,
  userId: string | undefined,
  accessToken: string | undefined
) {
  return useQuery({
    queryKey: skillQueryKeys.me(slug, userId ?? "anonymous"),
    queryFn: ({ signal }) => fetchSkillMe(slug, accessToken!, signal),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    enabled: Boolean(slug && userId && accessToken),
  })
}

type VoteMutationVariables = {
  slug: string
  userId: string
  accessToken: string
  request: VoteRequest
  baseStats: SkillStats
}

type VoteMutationContext = {
  previousStats: SkillStatsResponse | undefined
  previousDetail: SkillDetailResponse | undefined
  previousMe: SkillMeResponse | undefined
  previousLists: Array<[QueryKey, SkillListResponse | undefined]>
}

export function useSkillVoteMutation() {
  const queryClient = useQueryClient()

  return useMutation<VoteResponse, Error, VoteMutationVariables, VoteMutationContext>({
    mutationFn: ({ slug, accessToken, request }) =>
      submitSkillVote(slug, accessToken, request),
    onMutate: async (variables) => {
      const statsKey = skillQueryKeys.stats(variables.slug)
      const detailKey = skillQueryKeys.detail(variables.slug)
      const meKey = skillQueryKeys.me(variables.slug, variables.userId)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: statsKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: meKey }),
        queryClient.cancelQueries({ queryKey: skillQueryKeys.lists() }),
      ])

      const previousStats = queryClient.getQueryData<SkillStatsResponse>(statsKey)
      const previousDetail = queryClient.getQueryData<SkillDetailResponse>(detailKey)
      const previousMe = queryClient.getQueryData<SkillMeResponse>(meKey)
      const previousLists = queryClient.getQueriesData<SkillListResponse>({
        queryKey: skillQueryKeys.lists(),
      })
      const currentVote = previousMe?.data.myVote ?? null
      const currentStats = previousStats?.data ?? variables.baseStats
      const optimisticStats = applyVoteTransition(
        currentStats,
        currentVote,
        variables.request.value
      )
      const optimisticReason =
        variables.request.value === null ? null : variables.request.reason

      queryClient.setQueryData<SkillStatsResponse>(statsKey, { data: optimisticStats })
      queryClient.setQueryData<SkillDetailResponse>(detailKey, (current) =>
        current ? withStats(current, optimisticStats) : current
      )
      queryClient.setQueryData<SkillMeResponse>(meKey, {
        data: { myVote: variables.request.value, myReason: optimisticReason },
      })
      updateListCaches(queryClient, variables.baseStats.skillId, optimisticStats)

      return { previousStats, previousDetail, previousMe, previousLists }
    },
    onError: (_error, variables, context) => {
      if (!context) {
        return
      }

      queryClient.setQueryData(skillQueryKeys.stats(variables.slug), context.previousStats)
      queryClient.setQueryData(skillQueryKeys.detail(variables.slug), context.previousDetail)
      queryClient.setQueryData(
        skillQueryKeys.me(variables.slug, variables.userId),
        context.previousMe
      )

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data)
      }
    },
    onSuccess: (response, variables) => {
      const authoritativeStats: SkillStats = {
        skillId: response.data.skillId,
        upvotesCount: response.data.upvotesCount,
        downvotesCount: response.data.downvotesCount,
        commentsCount: response.data.commentsCount,
        score: response.data.score,
        reasonCounts: response.data.reasonCounts,
        reasonedVotesCount: response.data.reasonedVotesCount,
        unreasonedVotesCount: response.data.unreasonedVotesCount,
      }

      queryClient.setQueryData<SkillStatsResponse>(skillQueryKeys.stats(variables.slug), {
        data: authoritativeStats,
      })
      queryClient.setQueryData<SkillDetailResponse>(
        skillQueryKeys.detail(variables.slug),
        (current) => (current ? withStats(current, authoritativeStats) : current)
      )
      queryClient.setQueryData<SkillMeResponse>(
        skillQueryKeys.me(variables.slug, variables.userId),
        { data: { myVote: response.data.myVote, myReason: response.data.myReason } }
      )
      updateListCaches(
        queryClient,
        authoritativeStats.skillId,
        authoritativeStats,
        response.data.reasonCounts[0] ?? null
      )
    },
    onSettled: (_response, _error, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.stats(variables.slug),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.detail(variables.slug),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.me(variables.slug, variables.userId),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.lists(),
          refetchType: "none",
        }),
      ])
    },
  })
}

export type OptimisticCommentItem = CommentItem & {
  clientStatus?: "sending" | "failed"
}

type CommentCachePage = Omit<CommentPageResponse, "data"> & {
  data: OptimisticCommentItem[]
}

type CommentCache = InfiniteData<CommentCachePage, string | null>

type CommentMutationVariables = {
  id: string
  slug: string
  userId: string
  accessToken: string
  body: string
  author: CommentAuthor
  baseStats: SkillStats
}

type CommentMutationContext = {
  previousComments: CommentCache | undefined
  previousStats: SkillStatsResponse | undefined
  previousDetail: SkillDetailResponse | undefined
  previousLists: Array<[QueryKey, SkillListResponse | undefined]>
  tempComment: OptimisticCommentItem
}

export function useSkillCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    CommentCreateResponse,
    Error,
    CommentMutationVariables,
    CommentMutationContext
  >({
    mutationFn: ({ id, slug, accessToken, body }) =>
      submitSkillComment(slug, accessToken, { id, body }),
    onMutate: async (variables) => {
      const commentsKey = skillQueryKeys.comments(variables.slug)
      const statsKey = skillQueryKeys.stats(variables.slug)
      const detailKey = skillQueryKeys.detail(variables.slug)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentsKey }),
        queryClient.cancelQueries({ queryKey: statsKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: skillQueryKeys.lists() }),
      ])

      let previousComments = queryClient.getQueryData<CommentCache>(commentsKey)

      if (!previousComments) {
        await queryClient.refetchQueries({ queryKey: commentsKey, type: "active" })
        previousComments = queryClient.getQueryData<CommentCache>(commentsKey)
      }

      const previousStats = queryClient.getQueryData<SkillStatsResponse>(statsKey)
      const previousDetail = queryClient.getQueryData<SkillDetailResponse>(detailKey)
      const previousLists = queryClient.getQueriesData<SkillListResponse>({
        queryKey: skillQueryKeys.lists(),
      })
      const tempComment: OptimisticCommentItem = {
        id: variables.id,
        skillId: variables.baseStats.skillId,
        body: variables.body,
        createdAt: new Date().toISOString(),
        author: variables.author,
        clientStatus: "sending",
      }
      const currentStats = previousStats?.data ?? variables.baseStats
      const optimisticCommentsCount = currentStats.commentsCount + 1

      queryClient.setQueryData<SkillStatsResponse>(statsKey, {
        data: { ...currentStats, commentsCount: optimisticCommentsCount },
      })
      queryClient.setQueryData<SkillDetailResponse>(detailKey, (current) =>
        current
          ? withCommentCount(current, optimisticCommentsCount)
          : current
      )
      updateListCommentCounts(
        queryClient,
        variables.baseStats.skillId,
        optimisticCommentsCount
      )
      queryClient.setQueryData<CommentCache>(
        commentsKey,
        prependComment(previousComments, tempComment)
      )

      return {
        previousComments,
        previousStats,
        previousDetail,
        previousLists,
        tempComment,
      }
    },
    onError: (_error, variables, context) => {
      if (!context) {
        return
      }

      queryClient.setQueryData(skillQueryKeys.stats(variables.slug), context.previousStats)
      queryClient.setQueryData(skillQueryKeys.detail(variables.slug), context.previousDetail)

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data)
      }

      queryClient.setQueryData<CommentCache>(
        skillQueryKeys.comments(variables.slug),
        prependComment(context.previousComments, {
          ...context.tempComment,
          clientStatus: "failed",
        })
      )
    },
    onSuccess: (response, variables, context) => {
      const serverComment = response.data.comment

      updateListCommentCounts(
        queryClient,
        serverComment.skillId,
        response.data.commentsCount
      )
      queryClient.setQueryData<SkillStatsResponse>(
        skillQueryKeys.stats(variables.slug),
        (current) =>
          current
            ? {
                data: {
                  ...current.data,
                  commentsCount: response.data.commentsCount,
                },
              }
            : current
      )
      queryClient.setQueryData<SkillDetailResponse>(
        skillQueryKeys.detail(variables.slug),
        (current) =>
          current
            ? withCommentCount(current, response.data.commentsCount)
            : current
      )
      queryClient.setQueryData<CommentCache>(
        skillQueryKeys.comments(variables.slug),
        (current) =>
          replaceComment(
            current ?? context?.previousComments,
            context?.tempComment.id,
            serverComment
          )
      )
    },
    onSettled: (_response, _error, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.comments(variables.slug),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.stats(variables.slug),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.detail(variables.slug),
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: skillQueryKeys.lists(),
          refetchType: "none",
        }),
      ])
    },
  })
}

export function removeCommentFromCache(
  queryClient: QueryClient,
  slug: string,
  commentId: string
) {
  queryClient.setQueryData<CommentCache>(
    skillQueryKeys.comments(slug),
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.filter((comment) => comment.id !== commentId),
            })),
          }
        : current
  )
}

function shouldRetry(failureCount: number, error: Error) {
  return error instanceof ApiRequestError
    ? error.status >= 500 && failureCount < 1
    : failureCount < 1
}

function applyVoteTransition(
  stats: SkillStats,
  previousVote: VoteValue,
  nextVote: VoteValue
): SkillStats {
  if (previousVote === nextVote) {
    return stats
  }

  let upvotesCount = stats.upvotesCount
  let downvotesCount = stats.downvotesCount

  if (previousVote === 1) {
    upvotesCount -= 1
  } else if (previousVote === -1) {
    downvotesCount -= 1
  }

  if (nextVote === 1) {
    upvotesCount += 1
  } else if (nextVote === -1) {
    downvotesCount += 1
  }

  return {
    ...stats,
    upvotesCount,
    downvotesCount,
    score: upvotesCount - downvotesCount,
  }
}

function withStats(detail: SkillDetailResponse, stats: SkillStats): SkillDetailResponse {
  return { data: { ...detail.data, ...stats } }
}

function updateListCaches(
  queryClient: QueryClient,
  skillId: string,
  stats: SkillStats,
  topReason?: SkillStats["reasonCounts"][number] | null
) {
  queryClient.setQueriesData<SkillListResponse>(
    { queryKey: skillQueryKeys.lists() },
    (current) =>
      current
        ? {
            ...current,
            data: current.data.map((skill) =>
              skill.id === skillId
                ? {
                    ...skill,
                    upvotesCount: stats.upvotesCount,
                    downvotesCount: stats.downvotesCount,
                    commentsCount: stats.commentsCount,
                    score: stats.score,
                    ...(topReason !== undefined ? { topReason } : {}),
                  }
                : skill
            ),
          }
        : current
  )
}

function withCommentCount(
  detail: SkillDetailResponse,
  commentsCount: number
): SkillDetailResponse {
  return { data: { ...detail.data, commentsCount } }
}

function updateListCommentCounts(
  queryClient: QueryClient,
  skillId: string,
  commentsCount: number
) {
  queryClient.setQueriesData<SkillListResponse>(
    { queryKey: skillQueryKeys.lists() },
    (current) =>
      current
        ? {
            ...current,
            data: current.data.map((skill) =>
              skill.id === skillId ? { ...skill, commentsCount } : skill
            ),
          }
        : current
  )
}

function prependComment(
  data: CommentCache | undefined,
  comment: OptimisticCommentItem
): CommentCache {
  const base: CommentCache = data ?? {
    pages: [{ data: [], nextCursor: null }],
    pageParams: [null],
  }
  const pages = base.pages.map((page) => ({
    ...page,
    data: page.data.filter((item) => item.id !== comment.id),
  }))
  const firstPage = pages[0] ?? { data: [], nextCursor: null }

  return {
    ...base,
    pages: [
      { ...firstPage, data: [comment, ...firstPage.data] },
      ...pages.slice(1),
    ],
  }
}

function replaceComment(
  data: CommentCache | undefined,
  temporaryId: string | undefined,
  comment: CommentItem
): CommentCache {
  const base: CommentCache = data ?? {
    pages: [{ data: [], nextCursor: null }],
    pageParams: [null],
  }
  const pages = base.pages.map((page) => ({
    ...page,
    data: page.data.filter(
      (item) => item.id !== temporaryId && item.id !== comment.id
    ),
  }))
  const firstPage = pages[0] ?? { data: [], nextCursor: null }

  return {
    ...base,
    pages: [
      { ...firstPage, data: [comment, ...firstPage.data] },
      ...pages.slice(1),
    ],
  }
}
