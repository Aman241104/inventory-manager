import { Suspense } from "react";
import { getProducts } from "@/app/actions/product";
import { getVendors } from "@/app/actions/vendor";
import { getCustomers } from "@/app/actions/customer";
import { getPurchases, getSales } from "@/app/actions/transaction";
import { getDashboardStats } from "@/app/actions/dashboard";
import TransactionManager from "@/components/transactions/TransactionManager";
import WriteOffButton from "@/components/dashboard/WriteOffButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  History,
  AlertTriangle
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = new Date().toISOString().split('T')[0];

  const [
    productsRes,
    vendorsRes,
    customersRes,
    todayPurchases,
    todaySales,
    statsRes
  ] = await Promise.all([
    getProducts(),
    getVendors(),
    getCustomers(),
    getPurchases(today),
    getSales(today),
    getDashboardStats()
  ]);

  const lotSummaries = statsRes.success && statsRes.data ? statsRes.data.lotSummaries : [];
  
  // Sort by age: Oldest batches at the top
  const sortedLots = [...lotSummaries].sort((a: any, b: any) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const maxSales = Math.max(0, ...lotSummaries.map((lot: any) => lot.sales.length));

  const calculateAge = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Direct Transaction Hub */}
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Transaction Hub...</div>}>
        <TransactionManager
          products={productsRes.success && productsRes.data ? productsRes.data : []}
          vendors={vendorsRes.success && vendorsRes.data ? vendorsRes.data : []}
          customers={customersRes.success && customersRes.data ? customersRes.data : []}
          initialPurchases={todayPurchases.success && todayPurchases.data ? todayPurchases.data : []}
          initialSales={todaySales.success && todaySales.data ? todaySales.data : []}
        />
      </Suspense>

      {/* 2. Quick Summary Metrics */}
      {statsRes.success && statsRes.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2">
          <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Active Batches</p>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-indigo-600 mt-1">{statsRes.data.summary.totalBatchesActive}</h3>
                <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-tighter">Lots</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Units in Hand</p>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-emerald-600 mt-1">{statsRes.data.summary.totalUnitsInHand}</h3>
                <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-tighter">Units</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Shortage Units</p>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-rose-600 mt-1">{statsRes.data.summary.totalShortage}</h3>
                <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-tighter">Units</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Operational Alerts */}
      {sortedLots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Missing Sales Check */}
          {sortedLots.filter((l: any) => l.remainingStock > 0 && l.remainingStock <= 5).length > 0 && (
            <Card className="border-amber-100 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  POTENTIAL MISSING SALES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-700/70 mb-4">These batches have very low stock. Did you forget to record a final sale?</p>
                <div className="space-y-2">
                  {sortedLots.filter((l: any) => l.remainingStock > 0 && l.remainingStock <= 5).map((l: any) => (
                    <div key={l.lotId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{l.productName} ({l.lotName})</span>
                      <span className="text-xs font-black text-amber-600">{l.remainingStock} Left</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aging Stock Check */}
          {sortedLots.filter((l: any) => calculateAge(l.date) >= 3 && l.remainingStock > 0).length > 0 && (
            <Card className="border-rose-100 bg-rose-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-rose-800 flex items-center gap-2">
                  <Clock size={16} className="text-rose-500" />
                  AGING STOCK ALERT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-rose-700/70 mb-4">These batches are older than 3 days. Prioritize selling these first.</p>
                <div className="space-y-2">
                  {sortedLots.filter((l: any) => calculateAge(l.date) >= 3 && l.remainingStock > 0).map((l: any) => (
                    <div key={l.lotId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{l.productName} ({l.lotName})</span>
                      <span className="text-xs font-black text-rose-600">{calculateAge(l.date)} Days Old</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 4. Direct Stock Ledger (The Mathematics) */}
      <div className="space-y-4">
        <div className="px-2">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Package size={20} className="text-indigo-500" />
            Fruit Stock Ledger
          </h2>
          <p className="text-slate-500 text-xs font-medium">Real-time balance of all active batches.</p>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100 text-slate-400">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-100 sticky left-0 bg-white z-30">Fruit / Lot</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest bg-white">Age</th>
                    <th className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r border-slate-100 bg-emerald-50/50">Purchased</th>

                    {/* Dynamic Sales Columns */}
                    {Array.from({ length: maxSales }).map((_, i) => (
                      <th key={i} className="px-6 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest border-r border-slate-50 last:border-r-0">
                        Sale {i + 1}
                      </th>
                    ))}

                    <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest border-l border-slate-100 sticky right-0 bg-slate-50 z-10 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedLots.length === 0 ? (
                    <tr>
                      <td colSpan={maxSales + 4} className="px-6 py-12 text-center text-slate-400 italic font-medium">No active fruit batches found.</td>
                    </tr>
                  ) : (
                    sortedLots.map((lot: any) => {
                      const age = calculateAge(lot.date);
                      const soldQty = lot.totalPurchased - lot.remainingStock;
                      const soldPercentage = Math.min(100, Math.max(0, (soldQty / lot.totalPurchased) * 100));

                      return (
                        <tr key={lot.lotId} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-5 text-sm font-black text-slate-800 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                {lot.productName}
                                <div className="text-[10px] text-indigo-500 uppercase font-black tracking-tight mt-0.5">{lot.lotName}</div>
                              </div>
                              {lot.remainingStock > 0 && (
                                <WriteOffButton lotId={lot.lotId} />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-5 text-xs text-slate-500">
                            {age >= 3 ? (
                              <div className="flex items-center gap-1 text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                                <Clock size={12} /> {age}d
                              </div>
                            ) : (
                              <span className="font-bold text-slate-400 ml-1">{age}d</span>
                            )}
                          </td>
                          <td className="px-6 py-5 border-r border-slate-100 bg-emerald-50/5">
                            <div className="flex items-center gap-1">
                              <span className="text-base font-black text-emerald-600">{lot.totalPurchased}</span>
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${soldPercentage}%` }} />
                            </div>
                          </td>

                          {Array.from({ length: maxSales }).map((_, i) => {
                            const sale = lot.sales[i];
                            return (
                              <td key={i} className="px-6 py-5 border-r border-slate-50 last:border-r-0">
                                {sale ? (
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <TrendingDown size={14} className="text-indigo-300" />
                                      <span className="text-base font-black text-indigo-600">{sale.quantity}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[100px]">{sale.customerName}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-100 text-xs">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className={`px-6 py-5 border-l border-slate-100 sticky right-0 z-10 text-right group-hover:bg-slate-50 ${lot.remainingStock > 0 ? "bg-amber-50/30" :
                            lot.remainingStock < 0 ? "bg-rose-50/30" :
                              "bg-emerald-50/30"
                            }`}>
                            <div className="flex flex-col items-end">
                              <span className={`text-xl font-black tracking-tighter ${lot.remainingStock > 0 ? "text-amber-600" :
                                lot.remainingStock < 0 ? "text-rose-600" :
                                  "text-emerald-600"
                                }`}>
                                {lot.remainingStock > 0 ? `+${lot.remainingStock}` : lot.remainingStock}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {lot.status === 'REMAINING' ? 'Stock' : lot.status === 'EXTRA_SOLD' ? 'Shortage' : 'Balanced'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
