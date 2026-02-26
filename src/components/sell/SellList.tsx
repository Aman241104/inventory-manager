"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, AlertTriangle, CheckCircle2, Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addSale, getProductStockAction } from "@/app/actions/transaction";
import { useRouter, useSearchParams } from "next/navigation";

export default function SellList({
  initialSales,
  products,
  customers
}: {
  initialSales: any[],
  products: any[],
  customers: any[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  // Filter states
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const [formData, setFormData] = useState({
    productId: "",
    customerId: "",
    quantity: "",
    rate: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (fromDate) params.set("fromDate", fromDate);
    else params.delete("fromDate");
    if (toDate) params.set("toDate", toDate);
    else params.delete("toDate");
    router.push(`/sell?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    router.push("/sell");
  };

  // Fetch stock when product is selected
  useEffect(() => {
    if (formData.productId) {
      getProductStockAction(formData.productId).then(res => {
        if (res.success && res.data) setAvailableStock(res.data.available);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableStock(null);
    }
  }, [formData.productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addSale({
      ...formData,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate)
    });
    if (result.success) {
      setIsModalOpen(false);
      setFormData({
        productId: "",
        customerId: "",
        quantity: "",
        rate: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      window.location.reload();
    }
    setLoading(false);
  };

  const isExtraSold = availableStock !== null && Number(formData.quantity) > availableStock;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sell Section</h1>
          <p className="text-slate-500">Record and manage fruit sales.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="flex items-center gap-2">
          <Plus size={18} />
          Record Sale
        </Button>
      </div>

      {/* Filter Section */}
      <Card className="bg-slate-50/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleApplyFilters} className="flex items-center gap-2">
                <Filter size={16} />
                Apply
              </Button>
              {(fromDate || toDate) && (
                <Button variant="ghost" onClick={handleClearFilters} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales History ({initialSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Product</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Quantity</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Rate</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">No sales found for this period.</td>
                  </tr>
                ) : (
                  initialSales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {s.productId?.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{s.customerId?.name}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-600">{s.quantity}</td>
                      <td className="px-4 py-4 text-sm">
                        {s.isExtraSold ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium text-xs bg-rose-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} /> Extra Sold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-right">₹{s.rate}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{s.quantity * s.rate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
              <select
                required value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Product</option>
                {products.filter(p => p.isActive).map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select
                required value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Customer</option>
                {customers.filter(c => c.isActive).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {availableStock !== null && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${availableStock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
              <AlertTriangle size={16} />
              Available Stock: {availableStock} units
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number" required min="1" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${isExtraSold ? "border-rose-300 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
                  }`}
              />
              {isExtraSold && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">This will be marked as Extra Sold!</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate</label>
              <input
                type="number" required min="1" value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date" required value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant={isExtraSold ? "danger" : "secondary"} disabled={loading}>
              {loading ? "Saving..." : "Save Sale"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
