import { Suspense } from "react";
import TrashList from "@/components/layout/TrashList";

export const dynamic = 'force-dynamic';

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Trash Bin
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Review and restore recently deleted items.
          </p>
        </div>
      </div>
      
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Trash Bin...</div>}>
        <TrashList />
      </Suspense>
    </div>
  );
}
