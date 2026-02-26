"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  Filter, 
  X, 
  Printer, 
  Download, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Info,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDetailedReport, deleteLot, deleteSale } from "@/app/actions/report";

export default function ReportViewer({ products }: { products: any[] }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    productId: ""
  });

  const fetchReport = async () => {
    setLoading(true);
    const res = await getDetailedReport(filters);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const toggleLot = (id: string) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedLots(newExpanded);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteLot = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure? This will delete the ENTIRE batch and all its sales!")) {
      const res = await deleteLot(id);
      if (res.success) fetchReport();
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      const res = await deleteSale(id);
      if (res.success) fetchReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white shadow-sm border-slate-200 no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
              <select 
                value={filters.productId}
                onChange={(e) => setFilters({...filters, productId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                value={filters.fromDate}
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchReport} className="flex-1" disabled={loading}>
                {loading ? "Loading..." : "Filter"}
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700">Lot Info</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700">Vendor</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700 text-right">Qty</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700 text-right">Rate</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700 text-right">Total</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase border-r border-slate-700 text-right">Sold</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase text-right">Balance</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row) => (
                  <React.Fragment key={row.lotId}>
                    <tr 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => toggleLot(row.lotId)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-100 group-hover:bg-white no-print">
                            {expandedLots.has(row.lotId) ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{row.productName}</div>
                            <div className="text-[10px] text-indigo-600 font-black uppercase">{row.lotName} • {row.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{row.vendorName}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700 text-right">{row.purchasedQty} <span className="text-[10px] text-slate-400">{row.unitType}</span></td>
                      <td className="px-4 py-4 text-sm text-slate-600 text-right">₹{row.purchasedRate}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{row.purchasedTotal}</td>
                      <td className="px-4 py-4 text-sm font-bold text-indigo-600 text-right">
                        {row.totalSoldQty}
                      </td>
                      <td className={`px-4 py-4 text-sm font-black text-right ${
                        row.remainingQty > 0 ? "text-amber-600" : row.remainingQty < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {row.remainingQty > 0 ? `+${row.remainingQty}` : row.remainingQty}
                      </td>
                      <td className="px-4 py-4 text-center no-print">
                        <button 
                          onClick={(e) => handleDeleteLot(e, row.lotId)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Sales Data */}
                    {expandedLots.has(row.lotId) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-8 py-4">
                          <div className="border-l-4 border-indigo-200 pl-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <TrendingDown size={14} className="text-indigo-400" />
                              Sales Transactions for this Lot
                            </h4>
                            {row.sales.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400 border-b border-slate-200">
                                    <th className="py-2 text-left">Date</th>
                                    <th className="py-2 text-left">Customer</th>
                                    <th className="py-2 text-right">Qty</th>
                                    <th className="py-2 text-right">Rate</th>
                                    <th className="py-2 text-right">Total</th>
                                    <th className="py-2 text-right">Balance</th>
                                    <th className="py-2 text-center no-print">Del</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    let runningBal = row.purchasedQty;
                                    return row.sales.map((s: any) => {
                                      runningBal -= s.quantity;
                                      return (
                                        <tr key={s.saleId} className="border-b border-slate-100 last:border-0">
                                          <td className="py-2">{s.date}</td>
                                          <td className="py-2 font-medium">{s.customerName}</td>
                                          <td className="py-2 text-right font-bold">{s.quantity}</td>
                                          <td className="py-2 text-right">₹{s.rate}</td>
                                          <td className="py-2 text-right font-bold text-slate-700">₹{s.total}</td>
                                          <td className="py-2 text-right font-mono text-slate-400">{runningBal}</td>
                                          <td className="py-2 text-center no-print">
                                            <button 
                                              onClick={() => handleDeleteSale(s.saleId)}
                                              className="text-slate-300 hover:text-rose-500"
                                            >
                                              <X size={14} />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            ) : (
                              <div className="text-slate-400 italic text-xs py-2">No sales recorded yet for this batch.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-20 text-center text-slate-400 italic">
                      No matching records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Print Only Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 p-4 border-t text-center text-[10px] text-slate-400">
        Generated by FruitManager System on {new Date().toLocaleString()}
      </div>
    </div>
  );
}
