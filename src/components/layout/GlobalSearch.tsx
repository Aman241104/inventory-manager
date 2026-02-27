"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Command, X, FileText, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchAll } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      const timer = setTimeout(() => {
        setQuery("");
        setResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const res = await searchAll(query);
      if (res.success) setResults(res.data || []);
      setLoading(false);
      setSelectedIndex(0);
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: any) => {
    router.push(result.href);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all text-xs border border-slate-200 w-full mb-4 group"
    >
      <Search size={14} className="group-hover:text-indigo-600" />
      <span>Search anything...</span>
      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-5 text-base outline-none text-slate-800 placeholder:text-slate-400"
            placeholder="Type to search lots, vendors or customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="py-12 text-center text-slate-400 italic text-sm animate-pulse">Searching the ledger...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
                    index === selectedIndex ? "bg-indigo-50 ring-1 ring-indigo-100 shadow-sm" : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    result.type === 'lot' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {result.type === 'lot' ? <FileText size={18} /> : <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{result.title}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{result.subtitle}</div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 uppercase">JUMP</div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm italic font-medium">No matches found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <Command size={32} className="mx-auto text-slate-200" />
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Quick Commands</p>
              <div className="flex justify-center gap-2">
                <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded border border-slate-100 text-[10px] font-bold">BATCH NAME</span>
                <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded border border-slate-100 text-[10px] font-bold">VENDOR</span>
                <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded border border-slate-100 text-[10px] font-bold">CUSTOMER</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md">↵</kbd> Select
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md">↓↑</kbd> Navigate
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md">ESC</kbd> Close
          </div>
        </div>
      </div>
    </div>
  );
}
