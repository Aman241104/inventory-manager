"use client";

import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, CheckCircle2, Calendar, Filter, X, UserPlus, TrendingUp, Apple, History, BadgeDollarSign, Edit2, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Combobox } from "@/components/ui/Combobox";
import EditableCell from "@/components/ui/EditableCell";
import { addSale, getLotsForProduct, addCustomerAction, addProductAction, updateSale } from "@/app/actions/transaction";
import { deleteSale } from "@/app/actions/report";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SellList({
  initialSales,
  products: initialProducts,
  customers: initialCustomers,
  isInline = false,
  onSuccess
}: {
  initialSales: any[],
  products: any[],
  customers: any[],
  isInline?: boolean,
  onSuccess?: () => void
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sales, setSales] = useState(initialSales);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinnedFields, setPinnedFields] = useState<Set<string>>(new Set());

  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);

  // Edit Sale States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    quantity: "",
    rate: "",
    date: ""
  });

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
  const [successMessage, setSuccessMessage] = useState("");

  const fruitSelectRef = React.useRef<HTMLInputElement>(null);
  const customerSelectRef = React.useRef<HTMLInputElement>(null);
  const lotSelectRef = React.useRef<HTMLSelectElement>(null);
  const qtyInputRef = React.useRef<HTMLInputElement>(null);
  const rateInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (isModalOpen || isInline) {
      fruitSelectRef.current?.focus();
    }
  }, [isModalOpen, isInline]);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef) {
        nextRef.current?.focus();
      } else {
        // If no nextRef, it's the last field, so submit
        handleSubmit(null, true);
      }
    }
  };

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
            const oldest = res.data[res.data.length - 1];
            setFormData(prev => ({ ...prev, purchaseId: oldest._id }));
          }
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
  }, [formData.productId, formData.purchaseId]);

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

  const handleSubmit = async (e: React.FormEvent | null, addAnother = false) => {
    if (e) e.preventDefault();
    console.log("Submitting sale data:", formData);
    setLoading(true);

    // Optimistic Entry
    const tempId = `temp-${new Date().getTime()}`;
    const optimisticEntry = {
      _id: tempId,
      productId: products.find(p => p._id === formData.productId),
      customerId: customers.find(c => c._id === formData.customerId),
      purchaseId: availableLots.find(l => l._id === formData.purchaseId),
      quantity: Number(formData.quantity),
      rate: Number(formData.rate) || 0,
      date: formData.date,
      isOptimistic: true
    };

    setSales(prev => [optimisticEntry, ...prev]);

    try {
      const result = await addSale({
        ...formData,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate)
      });
      console.log("Sale submission result:", result);
      if (result.success) {
        setSuccessMessage("Sale recorded successfully!");
        if (!addAnother) {
          setIsModalOpen(false);
        }
        
        // Pinned Logic: Only clear fields that are NOT pinned
        setFormData({
          productId: pinnedFields.has("product") ? formData.productId : "",
          customerId: pinnedFields.has("customer") ? formData.customerId : "",
          purchaseId: pinnedFields.has("product") ? formData.purchaseId : "",
          quantity: "", // Quantity is always cleared
          rate: pinnedFields.has("rate") ? formData.rate : "",
          date: formData.date, // Date is always sticky
          notes: ""
        });

        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        setSales(initialSales); // Rollback
        alert(result.error || "Failed to save sale");
      }
    } catch (err) {
      setSales(initialSales); // Rollback
      console.error("HandleSubmit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (sale: any) => {
    setEditingSale(sale);
    setEditFormData({
      quantity: sale.quantity.toString(),
      rate: sale.rate.toString(),
      date: new Date(sale.date).toISOString().split('T')[0]
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSale(editingSale._id, {
      quantity: Number(editFormData.quantity),
      rate: Number(editFormData.rate),
      date: editFormData.date
    });
    if (res.success) {
      setIsEditModalOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      alert("Failed to update");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      const previousSales = [...sales];
      // Optimistic update
      setSales(prev => prev.filter(s => s._id !== id));

      const res = await deleteSale(id);
      if (res.success) {
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        // Rollback
        setSales(previousSales);
        alert(res.error || "Failed to delete sale");
      }
    }
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

  const togglePinnedField = (field: string) => {
    const newPinned = new Set(pinnedFields);
    if (newPinned.has(field)) newPinned.delete(field);
    else newPinned.add(field);
    setPinnedFields(newPinned);
  };

  const isExtraSold = selectedLot && Number(formData.quantity) > selectedLot.availableQty;

  const isFormValid = formData.productId && formData.customerId && formData.purchaseId && Number(formData.quantity) > 0;

  const handleCancel = (isModal: boolean) => {
    if (isModal) {
      setIsModalOpen(false);
    } else {
      setFormData({
        productId: "",
        customerId: "",
        purchaseId: "",
        quantity: "",
        rate: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
    }
  };

  const renderForm = (isModal = true) => (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
      {successMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 animate-in fade-in zoom-in duration-300 mb-6">
          <CheckCircle2 size={20} className="animate-pulse" />
          <span className="font-black text-sm uppercase tracking-widest">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Form Fields Column */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                Fruit
                <button type="button" onClick={() => setIsProductModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold">
                  <Apple size={10} /> Quick Add
                </button>
              </label>
              <Combobox
                ref={fruitSelectRef}
                options={products.filter(p => p.isActive)}
                value={formData.productId}
                onChange={(val) => setFormData({ ...formData, productId: val, purchaseId: "" })}
                onKeyDown={(e) => handleKeyDown(e, customerSelectRef)}
                placeholder="Select Fruit..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                Customer
                <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold">
                  <UserPlus size={10} /> Quick Add
                </button>
              </label>
              <Combobox
                ref={customerSelectRef}
                options={customers.filter(c => c.isActive)}
                value={formData.customerId}
                onChange={(val) => setFormData({ ...formData, customerId: val })}
                onKeyDown={(e) => handleKeyDown(e, lotSelectRef)}
                placeholder="Select Customer..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Batch (Lot) *</label>
            <select
              ref={lotSelectRef}
              required
              value={formData.purchaseId}
              disabled={!formData.productId}
              onChange={(e) => setFormData({ ...formData, purchaseId: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, qtyInputRef)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
            >
              <option value="">{formData.productId ? "Choose a lot..." : "Select product first"}</option>
              {availableLots.map(lot => {
                const age = calculateAge(lot.date);
                return (
                  <option key={lot._id} value={lot._id}>
                    {lot.lotName} (Stock: {lot.availableQty} | ₹{lot.rate} | {age === 0 ? 'Fresh' : `${age}d old`})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
              <input
                ref={qtyInputRef}
                type="number" required min="0.0001" step="any" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, rateInputRef)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 outline-none transition-all ${isExtraSold ? "border-rose-300 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
                  }`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                Selling Rate
                <button type="button" onClick={() => togglePinnedField("rate")} className={pinnedFields.has("rate") ? "text-indigo-600" : "text-slate-300"}>
                  {pinnedFields.has("rate") ? <Pin size={10} fill="currentColor" /> : <PinOff size={10} />}
                </button>
              </label>
              <input
                ref={rateInputRef}
                type="number" min="0" step="any" value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 outline-none transition-all ${selectedLot && Number(formData.rate) > 0 && Number(formData.rate) < selectedLot.rate
                  ? "border-rose-300 text-rose-600 focus:ring-rose-500"
                  : "border-slate-200 focus:ring-indigo-500"
                  }`}
              />
              {selectedLot && Number(formData.rate) > 0 && Number(formData.rate) < selectedLot.rate && (
                <p className="text-[10px] text-rose-500 mt-1 font-bold flex items-center gap-1">
                  <AlertTriangle size={10} /> Below buy price (₹{selectedLot.rate})
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sale Date</label>
            <input
              type="date" required value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Context Panel Column */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lot Summary</h4>
          {selectedLot ? (
            <div className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-black text-indigo-900">{selectedLot.lotName}</div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Selected Batch</p>
                  </div>
                  <div className="bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 text-indigo-600 font-bold text-xs">
                    ₹{selectedLot.rate} <span className="text-[8px] opacity-50">BUY RATE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 p-3 rounded-xl border border-indigo-100/50">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Original</div>
                    <div className="text-lg font-bold text-slate-700">{selectedLot.quantity}</div>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-indigo-100/50">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Available</div>
                    <div className="text-lg font-bold text-indigo-600">{selectedLot.availableQty}</div>
                  </div>
                </div>

                {/* Pulse Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Pulse</span>
                    <span className={`text-xs font-bold ${selectedLot.availableQty - (Number(formData.quantity) || 0) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {selectedLot.availableQty - (Number(formData.quantity) || 0)} Units Remaining
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.max(0, ((selectedLot.availableQty - (Number(formData.quantity) || 0)) / selectedLot.quantity) * 100)}%` }} />
                    <div className="h-full bg-indigo-400 transition-all duration-500 opacity-80" style={{ width: `${Math.min(100, (Number(formData.quantity) || 0) / selectedLot.quantity * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-indigo-100/50 mt-auto">
                <div className="flex flex-col items-end text-indigo-900">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Transaction Summary</div>
                  <div className="text-sm font-bold">
                    <span className="text-indigo-600 font-black">{formData.quantity || 0}</span> Units Sold
                    <span className="mx-2 opacity-20">|</span>
                    <span className="opacity-60 font-medium italic">₹{((Number(formData.quantity) || 0) * (Number(formData.rate) || 0)).toLocaleString()} Total</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-300">
              <TrendingUp size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a lot to see real-time<br />stock pulse and valuations.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
        <Button type="button" variant="ghost" onClick={() => handleCancel(isModal)}>Cancel</Button>
        <Button 
          type="button" 
          variant="outline" 
          disabled={loading || !isFormValid} 
          onClick={(e) => handleSubmit(e, true)} 
          className="border-indigo-200 text-indigo-600 disabled:opacity-30"
        >
          {loading ? "..." : "Save & Add Another"}
        </Button>
        <Button 
          type="submit" 
          variant={isExtraSold ? "danger" : "primary"} 
          disabled={loading || !isFormValid} 
          className="px-10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </form>
  );

  if (isInline) {
    return (
      <div className="space-y-6">
        <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <BadgeDollarSign size={20} className="text-emerald-400" />
              New Sale Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            {renderForm(false)}
          </CardContent>
        </Card>

        {/* Modals for Quick Add within Inline Mode */}
        {/* Quick Add Product Modal */}
        <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
          <form onSubmit={handleQuickAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
              <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
              <input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
              <input type="text" required value={newCustomer.contact} onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

  return (
    <div className="space-y-6">
      {!isInline && (
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
      )}

      {/* Filter Section */}
      {!isInline && initialSales.length > 0 && (
        <Card className="bg-slate-50/50 border-dashed no-print">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

      {sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales History ({sales.length})</CardTitle>
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
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((s) => (
                    <tr key={s._id} className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      s.isOptimistic && "opacity-50 grayscale animate-pulse"
                    )}>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        <div className="font-bold">{s.productId?.name}</div>
                        <div className="text-[10px] text-indigo-500 uppercase font-black">{s.purchaseId?.lotName || 'Unknown Lot'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{s.customerId?.name}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-600">
                        <EditableCell 
                          value={s.quantity} 
                          onSave={async (val) => {
                            await updateSale(s._id, { quantity: val });
                          }}
                          className="text-emerald-600"
                        />
                      </td>
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
                      <td className="px-4 py-4 text-sm text-right">
                        <EditableCell 
                          value={s.rate} 
                          prefix="₹"
                          onSave={async (val) => {
                            await updateSale(s._id, { rate: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{s.quantity * s.rate}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(s)} disabled={s.isOptimistic} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-0">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(s._id)} disabled={s.isOptimistic} className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-0 relative z-10">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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
        {renderForm(true)}
      </Modal>

      {/* Edit Sale Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sale Entry">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
              <input type="number" required min="0.0001" step="any" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate</label>
              <input type="number" required min="0" step="any" value={editFormData.rate} onChange={(e) => setEditFormData({ ...editFormData, rate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" required value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Update Sale"}</Button>
          </div>
        </form>
      </Modal>

      {/* Product & Customer Modals for Modal Mode */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Quick Add Product">
        <form onSubmit={handleQuickAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
            <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Quick Add Customer">
        <form onSubmit={handleQuickAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
            <input type="text" required value={newCustomer.contact} onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
