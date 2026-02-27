import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center px-2">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Entry Forms Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-white border border-slate-100 rounded-3xl animate-pulse" />
        <div className="h-[400px] bg-white border border-slate-100 rounded-3xl animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-slate-200 animate-pulse rounded-lg ml-2" />
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    </div>
  );
}
