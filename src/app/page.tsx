import { 
  History,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  LayoutGrid,
  Scale
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500">Real-time batch performance and stock health.</p>
        </div>
        <div className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
          <History size={12} />
          Refreshed: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* High Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-indigo-600 border-none text-white overflow-hidden relative">
          <div className="absolute right-[-10%] top-[-10%] opacity-10">
            <LayoutGrid size={120} />
          </div>
          <CardContent className="pt-6">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Active Batches</p>
            <h3 className="text-4xl font-black mt-1">{summary.totalBatchesActive}</h3>
            <p className="text-indigo-200 text-[10px] mt-2 italic">Batches currently in stock</p>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-600 border-none text-white overflow-hidden relative">
          <div className="absolute right-[-10%] top-[-10%] opacity-10">
            <Scale size={120} />
          </div>
          <CardContent className="pt-6">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Units in Hand</p>
            <h3 className="text-4xl font-black mt-1">{summary.totalUnitsInHand}</h3>
            <p className="text-emerald-200 text-[10px] mt-2 italic">Total quantity available across all lots</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-600 border-none text-white overflow-hidden relative">
          <div className="absolute right-[-10%] top-[-10%] opacity-10">
            <AlertTriangle size={120} />
          </div>
          <CardContent className="pt-6">
            <p className="text-rose-100 text-xs font-bold uppercase tracking-widest">Shortage Units</p>
            <h3 className="text-4xl font-black mt-1">{summary.totalShortage}</h3>
            <p className="text-rose-200 text-[10px] mt-2 italic">Total units over-sold (mismatch)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-md">
        <CardHeader className="bg-white border-b border-slate-100 py-4">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Package size={18} className="text-indigo-500" />
            Stock Inventory Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-r border-slate-100 sticky left-0 bg-slate-50 z-10">Fruit / Lot</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100">Age</th>
                  <th className="px-4 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-tighter border-b border-r border-slate-100 bg-emerald-50/20">Purchased</th>
                  
                  {/* Dynamic Sales Columns */}
                  {Array.from({ length: maxSales }).map((_, i) => (
                    <th key={i} className="px-4 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-tighter border-b border-slate-100">
                      Sale {i + 1}
                    </th>
                  ))}
                  
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-l border-slate-100 sticky right-0 bg-slate-50 z-10 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lotSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={maxSales + 4} className="px-4 py-12 text-center text-slate-400 italic">No lot data available. Start by recording a purchase.</td>
                  </tr>
                ) : (
                  lotSummaries.map((lot) => {
                    const age = calculateAge(lot.date);
                    const soldQty = lot.totalPurchased - lot.remainingStock;
                    const soldPercentage = Math.min(100, Math.max(0, (soldQty / lot.totalPurchased) * 100));

                    return (
                      <tr key={lot.lotId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-4 text-sm font-bold text-slate-800 border-r border-slate-100 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <div>
                              {lot.productName}
                              <div className="text-[10px] text-indigo-500 uppercase font-black tracking-tight">{lot.lotName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            {age >= 3 ? (
                              <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                <Clock size={12} /> {age}d
                              </div>
                            ) : (
                              <span className="text-slate-400">{age}d</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-emerald-600 border-r border-slate-100 bg-emerald-50/5">
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} className="opacity-50" />
                            {lot.totalPurchased}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">{lot.unitType}</div>
                          
                          {/* Progress Pill */}
                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-500" 
                              style={{ width: `${soldPercentage}%` }}
                            />
                          </div>
                        </td>

                        {/* Render Sales or Empty Cells */}
                        {Array.from({ length: maxSales }).map((_, i) => {
                          const sale = lot.sales[i];
                          return (
                            <td key={i} className="px-4 py-4 text-sm border-r border-slate-50 last:border-r-0">
                              {sale ? (
                                <div className="animate-in fade-in slide-in-from-left-1 duration-300">
                                  <div className="font-bold text-indigo-600 flex items-center gap-1">
                                    <TrendingDown size={14} className="opacity-50" />
                                    {sale.quantity}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[80px] font-medium" title={sale.customerName}>
                                    {sale.customerName}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-100">-</span>
                              )}
                            </td>
                          );
                        })}

                        <td className={`px-4 py-4 text-sm font-black border-l border-slate-100 sticky right-0 z-10 text-right ${
                          lot.remainingStock > 0 ? "text-amber-600 bg-amber-50/20" : 
                          lot.remainingStock < 0 ? "text-rose-600 bg-rose-50/20" : 
                          "text-emerald-600 bg-emerald-50/20"
                        }`}>
                          <div className="flex flex-col items-end">
                            <span className="text-base tracking-tighter">
                              {lot.remainingStock > 0 ? `+${lot.remainingStock}` : lot.remainingStock}
                            </span>
                            <span className="text-[9px] uppercase tracking-tighter opacity-70">
                              {lot.status === 'REMAINING' ? 'Remaining' : lot.status === 'EXTRA_SOLD' ? 'Shortage' : 'Balanced'}
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
      <div className="flex flex-wrap gap-x-8 gap-y-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
          <span>Balanced</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
          <span>Remaining Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
          <span>Shortage</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-amber-600" />
          <span>Old Stock (3+ Days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
          <span>Sales Progress</span>
        </div>
      </div>
    </div>
  );
}
