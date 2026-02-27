"use client";

import React, { useState } from "react";
import {
  Plus,
  ShoppingCart,
  BadgeDollarSign,
  History,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import BuyList from "@/components/buy/BuyList";
import SellList from "@/components/sell/SellList";
import BulkEntry from "@/components/transactions/BulkEntry";

export default function TransactionManager({
  products,
  vendors,
  customers,
  initialPurchases,
  initialSales
}: {
  products: any[],
  vendors: any[],
  customers: any[],
  initialPurchases: any[],
  initialSales: any[]
}) {
  const [activeType, setActiveType] = useState<"buy" | "sell" | "bulk" | "split">("buy");

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleGlobalOpen = (e: any) => {
      if (e.detail && e.detail.type) {
        setActiveType(e.detail.type);
      }
    };

    window.addEventListener("open-transaction", handleGlobalOpen);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Switch to Buy: Alt + B
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        setActiveType("buy");
      }
      // Switch to Sell: Alt + S
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setActiveType("sell");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener("open-transaction", handleGlobalOpen);
    };
  }, []);

  const handleSuccess = () => {
    // Small timeout to allow Next.js cache to revalidate and then force a reload
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            New Transaction
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Log a new fruit batch or sale.
          </p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap gap-4 p-1 bg-slate-100 rounded-xl w-fit mb-8 border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveType("buy")}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-black transition-all ${activeType === "buy"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <ShoppingCart size={18} />
            PURCHASE (BUY)
          </button>
          <button
            onClick={() => setActiveType("sell")}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-black transition-all ${activeType === "sell"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <BadgeDollarSign size={18} />
            SALE (SELL)
          </button>
          <button
            onClick={() => setActiveType("bulk")}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-black transition-all ${activeType === "bulk"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <Layers size={18} />
            BULK (FAST)
          </button>
          <button
            onClick={() => setActiveType("split")}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-black transition-all ${activeType === "split"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <Activity size={18} />
            SPLIT VIEW
          </button>
        </div>

        {activeType === "buy" ? (
          <BuyList
            initialPurchases={initialPurchases}
            products={products}
            vendors={vendors}
            isInline={true}
            onSuccess={handleSuccess}
          />
        ) : activeType === "sell" ? (
          <SellList
            initialSales={initialSales}
            products={products}
            customers={customers}
            isInline={true}
            onSuccess={handleSuccess}
          />
        ) : activeType === "bulk" ? (
          <BulkEntry
            products={products}
            vendors={vendors}
            customers={customers}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <ShoppingCart size={14} className="text-indigo-500" />
                Quick Purchase
              </h3>
              <BuyList
                initialPurchases={[]}
                products={products}
                vendors={vendors}
                isInline={true}
                onSuccess={handleSuccess}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <BadgeDollarSign size={14} className="text-emerald-500" />
                Quick Sale
              </h3>
              <SellList
                initialSales={[]}
                products={products}
                customers={customers}
                isInline={true}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
