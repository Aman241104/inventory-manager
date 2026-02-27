import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function DetailsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filter Bar */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6">
        <TableSkeleton rows={10} cols={6} />
      </div>
    </div>
  );
}
