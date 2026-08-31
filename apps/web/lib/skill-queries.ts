"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import type {
  SkillDetailResponse,
  SkillListQuery,
  SkillListResponse,
  SkillMeResponse,
  SkillStats,
  SkillStatsResponse,
  VoteResponse,
  VoteValue,
} from "@skill-grill/shared"

import { ApiRequestError } from "@/lib/api"
import {
  fetchSkillDetail,
  fetchSkillList,
  fetchSkillMe,
  fetchSkillStats,
  submitSkillVote,
} from "@/lib/skill-api"

export const skillQueryKeys = {
  all: ["skills"] as const,
  lists: () => ["skills", "list"] as const,
  list: (query: SkillListQuery) => ["skills", "list", query] as const,
  detail: (slug: string) => ["skills", "detail", slug] as const,
  stats: (slug: string) => ["skills", "stats", slug] as const,
  me: (slug: string, userId: string) => ["skills", "me", slug, userId] as const,
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
  value: VoteValue
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
    mutationFn: ({ slug, accessToken, value }) =>
      submitSkillVote(slug, accessToken, { value }),
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
        variables.value
      )

      queryClient.setQueryData<SkillStatsResponse>(statsKey, { data: optimisticStats })
      queryClient.setQueryData<SkillDetailResponse>(detailKey, (current) =>
        current ? withStats(current, optimisticStats) : current
      )
      queryClient.setQueryData<SkillMeResponse>(meKey, {
        data: { myVote: variables.value },
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
        { data: { myVote: response.data.myVote } }
      )
      updateListCaches(queryClient, authoritativeStats.skillId, authoritativeStats)
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
  stats: SkillStats
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
                  }
                : skill
            ),
          }
        : current
  )
}
