"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Shift
      if (e.ctrlKey && e.shiftKey) {
        const key = e.key.toLowerCase();

        // Ctrl + Shift + + (Plus) -> Add Purchase
        // Note: key might be '+' or '=' depending on keyboard
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          router.push("/");
          // Dispatch a custom event that TransactionManager can listen to
          window.dispatchEvent(new CustomEvent("open-transaction", { detail: { type: "buy" } }));
        }

        // Ctrl + Shift + - (Minus) -> Add Sale
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          router.push("/");
          window.dispatchEvent(new CustomEvent("open-transaction", { detail: { type: "sell" } }));
        }

        // Ctrl + Shift + D -> Detail Page
        if (key === "d") {
          e.preventDefault();
          router.push("/details");
        }

        // Ctrl + Shift + S -> Summary (Home)
        if (key === "s") {
          e.preventDefault();
          router.push("/");
        }

        // Ctrl + Shift + B -> Bulk Entry
        if (key === "b") {
          e.preventDefault();
          router.push("/");
          window.dispatchEvent(new CustomEvent("open-transaction", { detail: { type: "bulk" } }));
        }

        // Ctrl + Shift + T -> Split View
        if (key === "t") {
          e.preventDefault();
          router.push("/");
          window.dispatchEvent(new CustomEvent("open-transaction", { detail: { type: "split" } }));
        }

        // Ctrl + Shift + P -> Print Ledger for Today
        if (key === "p") {
          e.preventDefault();
          // We can navigate to details page with special params
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          router.push(`/details?fromDate=${today}&toDate=${today}&view=ledger&print=true`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
