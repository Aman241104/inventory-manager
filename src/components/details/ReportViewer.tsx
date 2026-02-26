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
  Trash2,
  AlertTriangle,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDetailedReport, deleteLot, deleteSale } from "@/app/actions/report";
import { updatePurchase } from "@/app/actions/transaction";
import { Modal } from "@/components/ui/Modal";
import LedgerCard from "./LedgerCard";

export default function ReportViewer({ products }: { products: any[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'ledger'>('table');

  // Edit Lot States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    lotName: "",
    quantity: "",
    rate: "",
    date: ""
  });

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    productId: ""
  });

  const fetchReport = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDetailedReport(filters);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData([]);
        if (!res.success) setError(res.error || "Unknown error occurred");
      }
    } catch (err: any) {
      setError("Failed to connect to server");
      console.error(err);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReport]);

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

  const handleOpenEditLot = (e: React.MouseEvent, lot: any) => {
    e.stopPropagation();
    setEditingLot(lot);
    setEditFormData({
      lotName: lot.lotName,
      quantity: lot.purchasedQty.toString(),
      rate: lot.purchasedRate.toString(),
      date: lot.date
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updatePurchase(editingLot.lotId, {
      lotName: editFormData.lotName,
      quantity: Number(editFormData.quantity),
      rate: Number(editFormData.rate),
      date: editFormData.date
    });
    if (res.success) {
      setIsEditModalOpen(false);
      fetchReport();
    } else {
      alert("Failed to update lot");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white shadow-sm border-slate-200 no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
              <select
                value={filters.productId}
                onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 lg:col-span-3">
              <Button onClick={fetchReport} className="flex-1 py-6 lg:py-2" disabled={loading}>
                {loading ? "..." : "Filter"}
              </Button>

              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Table View"
                >
                  Tab
                </button>
                <button
                  onClick={() => setViewMode('ledger')}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Ledger Print View"
                >
                  Led
                </button>
              </div>

              <Button variant="outline" onClick={handlePrint} className="py-6 lg:py-2 px-4">
                <Printer size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Conditional Rendering based on View Mode */}
      {viewMode === 'table' ? (
        <Card className="print:shadow-none print:border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border-slate-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Lot Identification</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Vendor</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 text-right">In Qty</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 text-right">Out Qty</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Current Balance</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.map((row) => (
                    <React.Fragment key={row.lotId}>
                      <tr
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => toggleLot(row.lotId)}
                      >
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded bg-slate-100 group-hover:bg-white no-print">
                              {expandedLots.has(row.lotId) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 uppercase tracking-tight">{row.productName}</div>
                              <div className="text-[10px] text-indigo-600 font-black uppercase">{row.lotName} • {row.date}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.vendorName}</td>
                        <td className="px-4 py-5 text-right">
                          <div className="text-sm font-black text-slate-700">{row.purchasedQty}</div>
                          <div className="text-[10px] font-medium text-slate-400 italic">@ ₹{row.purchasedRate}</div>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <div className="text-sm font-black text-indigo-600">{row.totalSoldQty}</div>
                          <div className="text-[10px] font-medium text-slate-300 italic uppercase">Units Sold</div>
                        </td>
                        <td className={`px-4 py-5 text-right ${row.remainingQty > 0 ? "bg-amber-50/20" : row.remainingQty < 0 ? "bg-rose-50/20" : "bg-emerald-50/20"
                          }`}>
                          <div className={`text-xl font-black tracking-tighter ${row.remainingQty > 0 ? "text-amber-600" : row.remainingQty < 0 ? "text-rose-600" : "text-emerald-600"
                            }`}>
                            {row.remainingQty > 0 ? `+${row.remainingQty}` : row.remainingQty}
                          </div>
                          <div className="text-[9px] font-black uppercase text-slate-400">Current Stock</div>
                        </td>
                        <td className="px-4 py-4 text-center no-print">
                          <div className="flex items-center justify-center gap-1 no-print">
                            <button
                              onClick={(e) => handleOpenEditLot(e, row)}
                              className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                              title="Edit Batch"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteLot(e, row.lotId)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                              title="Delete Batch"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sales Data */}
                      {expandedLots.has(row.lotId) && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-8 py-6">
                            <div className="border-l-4 border-indigo-200 pl-6 space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingDown size={14} className="text-indigo-400" />
                                Physical Units Outflow Ledger
                              </h4>
                              {row.sales.length > 0 ? (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                      <th className="py-3 text-left">Date</th>
                                      <th className="py-3 text-left">Buyer (Customer)</th>
                                      <th className="py-3 text-right">Sold Qty</th>
                                      <th className="py-3 text-right font-medium text-slate-300 italic uppercase">Rate</th>
                                      <th className="py-3 text-right">Running Balance</th>
                                      <th className="py-3 text-center no-print">Del</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      let runningBal = row.purchasedQty;
                                      return row.sales.map((s: any) => {
                                        runningBal -= s.quantity;
                                        return (
                                          <tr key={s.saleId} className="border-b border-slate-100 last:border-0 hover:bg-white/50 transition-colors">
                                            <td className="py-3 font-medium text-slate-500">{s.date}</td>
                                            <td className="py-3 font-black text-slate-700 uppercase tracking-tight">{s.customerName}</td>
                                            <td className="py-3 text-right font-black text-indigo-600 text-sm">{s.quantity}</td>
                                            <td className="py-3 text-right text-slate-300 italic font-medium">₹{s.rate}</td>
                                            <td className="py-3 text-right font-mono font-bold text-slate-400">{runningBal}</td>
                                            <td className="py-3 text-center no-print">
                                              <button
                                                onClick={() => handleDeleteSale(s.saleId)}
                                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
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
                                <div className="text-slate-400 italic text-xs py-4 px-2 bg-white/50 rounded-xl border border-dashed border-slate-200">No units have left this batch yet.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-20 text-center text-slate-400 italic font-medium">
                        No matching records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {data.length === 0 ? (
            <div className="text-center text-slate-400 italic p-12 bg-slate-50 rounded-xl">
              No matching records found for the selected filters to generate ledgers.
            </div>
          ) : (
            data.map((row) => (
              <LedgerCard key={row.lotId} data={row} />
            ))
          )}
        </div>
      )}

      {/* Edit Lot Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Purchase Batch"
      >
        <form onSubmit={handleUpdateLot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lot Name</label>
              <input 
                type="text" 
                required 
                value={editFormData.lotName} 
                onChange={(e) => setEditFormData({...editFormData, lotName: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
              <input 
                type="number" 
                required 
                value={editFormData.quantity} 
                onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate</label>
              <input 
                type="number" 
                required 
                value={editFormData.rate} 
                onChange={(e) => setEditFormData({...editFormData, rate: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={editFormData.date} 
                onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Update Batch"}</Button>
          </div>
        </form>
      </Modal>

      {/* Print Only Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 p-4 border-t text-center text-[10px] text-slate-400">
        Generated by FruitManager System on {new Date().toLocaleString()}
      </div>
    </div>
  );
}
