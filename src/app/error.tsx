"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle size={40} className="text-rose-500" />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Something went wrong</h1>
      <p className="text-slate-500 max-w-md mb-8">
        An unexpected error occurred while processing your request. Our team has been notified.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={reset}
          className="gap-2 px-8"
        >
          <RefreshCcw size={18} />
          Try Again
        </Button>
        
        <Link href="/">
          <Button variant="outline" className="gap-2 px-8 w-full">
            <Home size={18} />
            Back to Home
          </Button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
