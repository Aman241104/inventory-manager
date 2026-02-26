import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardCharts from "@/components/dashboard/Charts";
import ExportButton from "@/components/dashboard/ExportButton";

export default async function Dashboard() {
  const result = await getDashboardStats();
  
  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
        Failed to load dashboard data. Please check your database connection.
      </div>
    );
  }

  const stats = result.data;

  const statCards = [
    { 
      title: "Total Purchase Today", 
      value: `₹${stats.purchaseToday.toLocaleString()}`, 
      icon: TrendingUp, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50" 
    },
    { 
      title: "Total Sales Today", 
      value: `₹${stats.saleToday.toLocaleString()}`, 
      icon: TrendingDown, 
      color: "text-indigo-500", 
      bg: "bg-indigo-50" 
    },
    { 
      title: "Active Products", 
      value: stats.productCount.toString(), 
      icon: Package, 
      color: "text-amber-500", 
      bg: "bg-amber-50" 
    },
    { 
      title: "Mismatch Alerts", 
      value: stats.extraSoldCount.toString(), 
      icon: AlertCircle, 
      color: "text-rose-500", 
      bg: "bg-rose-50" 
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Real-time inventory and sales overview.</p>
        </div>
        <div className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
          <History size={12} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <Icon className={`${stat.color}`} size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <DashboardCharts data={stats.dailyData} />

      {/* Inventory Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Inventory Summary (Fruit-wise)</CardTitle>
          <ExportButton data={stats.inventorySummary} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Fruit Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Purchased</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Sold</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Qty (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.inventorySummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No inventory data available.</td>
                  </tr>
                ) : (
                  stats.inventorySummary.map((item: any) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {item.name} <span className="text-[10px] text-slate-400 uppercase ml-1 font-bold">{item.unitType}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 font-medium">{item.totalBuy}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 font-medium">{item.totalSell}</td>
                      <td className="px-4 py-4 text-sm">
                        {item.status === "OK" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs px-2 py-0.5 rounded-md bg-emerald-50">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        )}
                        {item.status === "Remaining" && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-xs px-2 py-0.5 rounded-md bg-amber-50">
                            <Package size={12} /> REMAINING
                          </span>
                        )}
                        {item.status === "Extra Sold" && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs px-2 py-0.5 rounded-md bg-rose-50">
                            <AlertTriangle size={12} /> EXTRA SOLD
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-bold text-slate-800">
                        {item.diff === 0 ? "-" : item.diff}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
