import React from "react";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <Search size={40} className="text-indigo-500" />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Page Not Found</h1>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        The page you are looking for doesn&apos;t exist or has been moved to a new location.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="gap-2 px-8 w-full">
            <Home size={18} />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="mt-12 text-slate-300 font-black text-9xl select-none opacity-20">
        404
      </div>
    </div>
  );
}
