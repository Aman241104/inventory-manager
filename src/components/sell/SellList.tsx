"use client";

import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, CheckCircle2, Calendar, Filter, X, UserPlus, TrendingUp, Apple } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { addSale, getLotsForProduct, addCustomerAction, addProductAction } from "@/app/actions/transaction";
import { useRouter, useSearchParams } from "next/navigation";

export default function SellList({
  initialSales,
  products: initialProducts,
  customers: initialCustomers
}: {
  initialSales: any[],
  products: any[],
  customers: any[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);

  // Filter states
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const [formData, setFormData] = useState({
    productId: "",
    customerId: "",
    purchaseId: "", // This is the Lot ID
    quantity: "",
    rate: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "" });
  const [newProduct, setNewProduct] = useState({ name: "", unitType: "Box" });

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

  // Fetch Lots when product is selected
  useEffect(() => {
    if (formData.productId) {
      getLotsForProduct(formData.productId).then(res => {
        if (res.success) {
          setAvailableLots(res.data);
          // FIFO: Auto-select oldest lot if none selected
          if (!formData.purchaseId && res.data.length > 0) {
            // Data is already sorted by date descending in action, oldest is last
            const oldest = res.data[res.data.length - 1];
            setFormData(prev => ({ ...prev, purchaseId: oldest._id }));
          }
          // If editing or pre-selected, find that lot
          if (formData.purchaseId) {
             const lot = res.data.find((l: any) => l._id === formData.purchaseId);
             setSelectedLot(lot || null);
          }
        }
      });
    } else {
      setAvailableLots([]);
      setSelectedLot(null);
    }
  }, [formData.productId]); // Removed formData.purchaseId to prevent loop during FIFO select

  // Update selected lot details when purchaseId changes
  useEffect(() => {
    const lot = availableLots.find(l => l._id === formData.purchaseId);
    setSelectedLot(lot || null);
  }, [formData.purchaseId, availableLots]);

  const calculateAge = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

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
        purchaseId: "",
        quantity: "",
        rate: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    }
    setLoading(false);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addCustomerAction(newCustomer.name, newCustomer.contact);
    if (result.success && result.data) {
      setCustomers([result.data, ...customers]);
      setFormData({ ...formData, customerId: result.data._id });
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: "", contact: "" });
    }
    setLoading(false);
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addProductAction(newProduct.name, newProduct.unitType);
    if (result.success && result.data) {
      setProducts([result.data, ...products]);
      setFormData({ ...formData, productId: result.data._id });
      setIsProductModalOpen(false);
      setNewProduct({ name: "", unitType: "Box" });
    }
    setLoading(false);
  };

  const isExtraSold = selectedLot && Number(formData.quantity) > selectedLot.quantity;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sell Section</h1>
          <p className="text-slate-500">Record sales from specific fruit lots.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="flex items-center gap-2">
          <Plus size={18} />
          Record Sale
        </Button>
      </div>

      {/* Filter Section - only if history exists */}
      {initialSales.length > 0 && (
        <Card className="bg-slate-50/50 border-dashed no-print">
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
      )}

      {initialSales.length > 0 && (
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
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Product / Lot</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Customer</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Quantity</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Rate</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {initialSales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        <div className="font-bold">{s.productId?.name}</div>
                        <div className="text-[10px] text-indigo-500 uppercase font-black">{s.purchaseId?.lotName || 'Unknown Lot'}</div>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Sale Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                Product
                <button 
                  type="button" onClick={() => setIsProductModalOpen(true)}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <Apple size={12} /> Quick Add
                </button>
              </label>
              <select
                required value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value, purchaseId: "" })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Product</option>
                {products.filter(p => p.isActive).map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                Customer
                <button 
                  type="button" onClick={() => setIsCustomerModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <UserPlus size={12} /> Quick Add
                </button>
              </label>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Lot / Batch</label>
            <select
              required value={formData.purchaseId}
              disabled={!formData.productId}
              onChange={(e) => setFormData({ ...formData, purchaseId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
            >
              <option value="">{formData.productId ? "Select Batch" : "Select Product First"}</option>
              {availableLots.map(lot => {
                const age = calculateAge(lot.date);
                return (
                  <option key={lot._id} value={lot._id}>
                    {lot.lotName} (Stock: {lot.quantity} | ₹{lot.rate} | {age === 0 ? 'Fresh' : `${age}d old`})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedLot && (
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-between text-xs font-bold uppercase">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} />
                Lot Original Qty: {selectedLot.quantity}
              </div>
              <div>Rate: ₹{selectedLot.rate}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number" required min="0.0001" step="any" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${isExtraSold ? "border-rose-300 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
                  }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Rate</label>
              <input
                type="number" required min="0.0001" step="any" value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sale Date</label>
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

      {/* Quick Add Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input 
              type="text" required value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
            <select 
              value={newProduct.unitType}
              onChange={(e) => setNewProduct({...newProduct, unitType: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Box">Box</option>
              <option value="Kg">Kg</option>
              <option value="Lot">Lot</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Back</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Quick Add Customer">
        <form onSubmit={handleQuickAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <input 
              type="text" required value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
            <input 
              type="text" required value={newCustomer.contact}
              onChange={(e) => setNewCustomer({...newCustomer, contact: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)}>Back</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Customer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
