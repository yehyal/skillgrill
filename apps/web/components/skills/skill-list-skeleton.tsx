import { Skeleton } from "@/components/ui/skeleton"

export function SkillListSkeleton({
  view = "list",
  count = 6,
}: {
  view?: "list" | "card"
  count?: number
}) {
  if (view === "card") {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading skills">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="min-h-[18rem] rounded-md border border-border bg-card p-4 sm:p-5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-6 h-6 w-40" />
            <Skeleton className="mt-3 h-3 w-28" />
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <div className="mt-16 flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading skills.</span>
      </div>
    )
  }

  return (
    <div className="border-t border-border" role="status" aria-label="Loading skills">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid gap-3 border-b border-border py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_10.5rem] sm:gap-4">
          <Skeleton className="h-3 w-6" />
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-28" />
            <Skeleton className="mt-3 h-4 w-full max-w-[34rem]" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-28 sm:justify-self-end" />
        </div>
      ))}
      <span className="sr-only">Loading skills.</span>
    </div>
  )
}
