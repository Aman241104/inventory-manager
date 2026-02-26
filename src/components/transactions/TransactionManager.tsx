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
  const [activeType, setActiveType] = useState<"buy" | "sell">("buy");
  const [isEntryMode, setIsEntryMode] = useState(false);

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Entry Mode: Alt + N (New)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setIsEntryMode(prev => !prev);
      }
      // Switch to Buy: Alt + B
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        setActiveType("buy");
        setIsEntryMode(true);
      }
      // Switch to Sell: Alt + S
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setActiveType("sell");
        setIsEntryMode(true);
      }
      // Close/Back: Esc
      if (e.key === 'Escape' && isEntryMode) {
        e.preventDefault();
        setIsEntryMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEntryMode]);

  const handleSuccess = () => {
    // Small timeout to allow Next.js cache to revalidate and then force a reload
    setTimeout(() => window.location.reload(), 300);
  };

  // Check if there is any activity today
  const hasTodayActivity = initialPurchases.length > 0 || initialSales.length > 0;

  if (!isEntryMode && !hasTodayActivity) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Transactions</h1>
            <p className="text-slate-500">Record new purchases or sales in one place.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <EmptyState
            icon={Zap}
            title="Start Your Day"
            description="You haven't recorded any transactions today. Start by logging a purchase or a sale to track your fruit inventory."
            actionLabel="Record New Transaction"
            onAction={() => setIsEntryMode(true)}
            secondaryAction={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setActiveType("buy"); setIsEntryMode(true); }} className="gap-2">
                  <ShoppingCart size={16} /> Buy
                </Button>
                <Button variant="outline" onClick={() => { setActiveType("sell"); setIsEntryMode(true); }} className="gap-2">
                  <BadgeDollarSign size={16} /> Sell
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {isEntryMode ? "New Transaction" : "Today's Activity"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isEntryMode ? "Log a new fruit batch or sale." : "Track what's moving through your inventory today."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isEntryMode ? (
            <Button onClick={() => setIsEntryMode(true)} className="gap-2 shadow-indigo-100 shadow-lg w-full md:w-auto justify-center py-4 md:py-2">
              <Plus size={18} />
              New Entry
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEntryMode(false)} className="gap-2 w-full md:w-auto justify-center py-4 md:py-2">
              <History size={18} />
              View Today's List
            </Button>
          ) /* Fixed typo in View Today's List */}
        </div>
      </div>

      {isEntryMode ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit mb-8 border border-slate-200 shadow-inner">
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
          </div>

          {activeType === "buy" ? (
            <BuyList
              initialPurchases={initialPurchases}
              products={products}
              vendors={vendors}
              isInline={true}
              onSuccess={handleSuccess}
            />
          ) : (
            <SellList
              initialSales={initialSales}
              products={products}
              customers={customers}
              isInline={true}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">                      {/* Today's Purchases */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Incoming Today
              </h3>
              <BuyList
                initialPurchases={initialPurchases}
                products={products}
                vendors={vendors}
                isInline={true}
                onSuccess={handleSuccess}
              />
            </div>

            {/* Today's Sales */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Outgoing Today
              </h3>
              <SellList
                initialSales={initialSales}
                products={products}
                customers={customers}
                isInline={true}
                onSuccess={handleSuccess}
              />
            </div>          </div>
        </div>
      )}
    </div>
  );
}
