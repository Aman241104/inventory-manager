"use client";

import React, { useState } from "react";
import { Plus, ShoppingCart, BadgeDollarSign, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import BuyList from "@/components/buy/BuyList"; // We can reuse the form logic or refactor
import SellList from "@/components/sell/SellList";
import { addPurchase, addSale } from "@/app/actions/transaction";
import { useRouter } from "next/navigation";

export default function TransactionManager({ 
  products, 
  vendors, 
  customers 
}: { 
  products: any[], 
  vendors: any[], 
  customers: any[] 
}) {
  const [activeType, setActiveType] = useState<"buy" | "sell">("buy");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-500">Record new purchases or sales in one place.</p>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveType("buy")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeType === "buy" 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShoppingCart size={18} />
          BUY (PURCHASE)
        </button>
        <button
          onClick={() => setActiveType("sell")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeType === "sell" 
              ? "bg-white text-emerald-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BadgeDollarSign size={18} />
          SELL (SALE)
        </button>
      </div>

      {activeType === "buy" ? (
        <BuyList 
          initialPurchases={[]} // We don't necessarily need the list here if it's in details
          products={products}
          vendors={vendors}
        />
      ) : (
        <SellList 
          initialSales={[]}
          products={products}
          customers={customers}
        />
      )}
    </div>
  );
}
