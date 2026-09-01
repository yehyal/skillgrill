import { Skeleton } from "@/components/ui/skeleton"

export function SkillListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading skills">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="min-h-64 border-t border-border py-6">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-6 h-6 w-40" />
          <Skeleton className="mt-4 h-4 w-full max-w-[24rem]" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className="mt-12 flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading skills.</span>
    </div>
  )
}
