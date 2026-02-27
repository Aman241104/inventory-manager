"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // We use a small hack to detect internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor && 
        anchor.href && 
        anchor.href.startsWith(window.location.origin) && 
        !anchor.target &&
        anchor.href !== window.location.href
      ) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-1">
      <div className="h-full bg-indigo-600 animate-infinite-loading shadow-[0_0_10px_#4f46e5]" />
      <style jsx>{`
        @keyframes loading {
          0% { width: 0; left: 0; }
          50% { width: 70%; left: 20%; }
          100% { width: 100%; left: 100%; }
        }
        .animate-infinite-loading {
          position: absolute;
          animation: loading 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
