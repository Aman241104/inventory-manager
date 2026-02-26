import { 
  History,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  LayoutGrid,
  Scale,
  Coins
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDashboardStats } from "@/app/actions/dashboard";

export default async function Dashboard() {
  const result = await getDashboardStats();
  
  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
        Failed to load dashboard data. Please check your database connection.
      </div>
    );
  }

  const { lotSummaries, summary } = result.data;

  // Find the maximum number of sales across all lots to determine column count
  const maxSales = Math.max(0, ...lotSummaries.map(lot => lot.sales.length));

  const calculateAge = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Physical inventory tracking and batch movement.</p>
        </div>
        <div className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm flex items-center gap-2 uppercase tracking-widest">
          <History size={12} />
          Sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* High Level Summary Cards - Quantity First */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative group">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Batches</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-indigo-600 mt-1">{summary.totalBatchesActive}</h3>
              <span className="text-slate-300 text-xs font-bold uppercase tracking-tighter">Lots</span>
            </div>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Currently in-stock and tradable</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Units in Hand</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-emerald-600 mt-1">{summary.totalUnitsInHand}</h3>
              <span className="text-slate-300 text-xs font-bold uppercase tracking-tighter">Units</span>
            </div>
            <p className="text-slate-400 text-[10px] mt-2 font-medium flex items-center gap-1">
              <Coins size={10} /> Value: ₹{summary.inventoryValue.toLocaleString()} (Secondary Detail)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm overflow-hidden relative">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Shortage Units</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-rose-600 mt-1">{summary.totalShortage}</h3>
              <span className="text-slate-300 text-xs font-bold uppercase tracking-tighter">Units</span>
            </div>
            <p className="text-rose-400 text-[10px] mt-2 font-black flex items-center gap-1">
              <AlertTriangle size={10} /> Mismatch Value: ₹{summary.shortageValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Package size={18} className="text-emerald-400" />
            Stock Inventory Ledger
          </CardTitle>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Showing all active and closed lots</div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 sticky left-0 bg-slate-50 z-10">Fruit / Lot</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</th>
                  <th className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-r border-slate-100 bg-emerald-50/20">Purchased Qty</th>
                  
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
                {lotSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={maxSales + 4} className="px-6 py-12 text-center text-slate-400 italic">No lot data available.</td>
                  </tr>
                ) : (
                  lotSummaries.map((lot) => {
                    const age = calculateAge(lot.date);
                    const soldQty = lot.totalPurchased - lot.remainingStock;
                    const soldPercentage = Math.min(100, Math.max(0, (soldQty / lot.totalPurchased) * 100));

                    return (
                      <tr key={lot.lotId} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5 text-sm font-black text-slate-800 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                          {lot.productName}
                          <div className="text-[10px] text-indigo-500 uppercase font-black tracking-tight mt-0.5">{lot.lotName}</div>
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{lot.unitType}</span>
                          </div>
                          {/* Secondary Financial Info */}
                          <div className="text-[10px] font-medium text-slate-400 italic">@ ₹{lot.purchaseRate}</div>
                          
                          {/* Progress Pill */}
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-700" 
                              style={{ width: `${soldPercentage}%` }}
                            />
                          </div>
                        </td>

                        {/* Render Sales */}
                        {Array.from({ length: maxSales }).map((_, i) => {
                          const sale = lot.sales[i];
                          return (
                            <td key={i} className="px-6 py-5 border-r border-slate-50 last:border-r-0">
                              {sale ? (
                                <div className="animate-in fade-in zoom-in duration-300">
                                  <div className="flex items-center gap-1">
                                    <TrendingDown size={14} className="text-indigo-300" />
                                    <span className="text-base font-black text-indigo-600">{sale.quantity}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[100px]" title={sale.customerName}>
                                    {sale.customerName}
                                  </div>
                                  {/* Secondary Financial Info */}
                                  <div className="text-[9px] font-medium text-slate-300 italic">@ ₹{sale.rate}</div>
                                </div>
                              ) : (
                                <span className="text-slate-100 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}

                        <td className={`px-6 py-5 border-l border-slate-100 sticky right-0 z-10 text-right group-hover:bg-slate-50 ${
                          lot.remainingStock > 0 ? "bg-amber-50/30" : 
                          lot.remainingStock < 0 ? "bg-rose-50/30" : 
                          "bg-emerald-50/30"
                        }`}>
                          <div className="flex flex-col items-end">
                            <span className={`text-xl font-black tracking-tighter ${
                              lot.remainingStock > 0 ? "text-amber-600" : 
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

      {/* Summary Legend */}
      <div className="flex flex-wrap gap-x-10 gap-y-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-200"></div>
          <span>Balanced / Sold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500 shadow-sm shadow-amber-200"></div>
          <span>Units Remaining</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-rose-500 shadow-sm shadow-rose-200"></div>
          <span>Shortage / Over-sold</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Clock size={12} className="text-amber-600" />
          <span>Batch Age (Days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
          <span>Physical Outflow</span>
        </div>
      </div>
    </div>
  );
}
