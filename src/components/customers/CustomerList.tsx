"use client";

import React, { useState } from "react";
import { Plus, Search, Edit2, Power, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { addCustomer, updateCustomer, toggleCustomerStatus, deleteCustomer } from "@/app/actions/customer";

export default function CustomerList({ initialCustomers }: { initialCustomers: any[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });

  React.useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: "", contact: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, contact: customer.contact || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (editingCustomer) {
      result = await updateCustomer(editingCustomer._id, formData);
    } else {
      result = await addCustomer(formData);
    }

    if (result.success) {
      setIsModalOpen(false);

      // Update local state instantly for a much faster feel
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => c._id === editingCustomer._id ? { ...c, ...formData } : c));
      } else if ('customer' in result && result.customer) {
        setCustomers(prev => [result.customer, ...prev]);
      }

      // Revalidate in background without full reload
      router.refresh();
    } else {
      alert("Failed to save customer");
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const previousCustomers = [...customers];
    setCustomers(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));

    try {
      const result = await toggleCustomerStatus(id, !currentStatus);
      if (!result.success) {
        setCustomers(previousCustomers);
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error toggling customer status:", err);
      setCustomers(previousCustomers);
      alert("An error occurred while updating the customer status.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingCustomerId(id);
  };

  const confirmDelete = async () => {
    if (!deletingCustomerId) return;

    const id = deletingCustomerId;
    setDeletingCustomerId(null);

    const previousCustomers = [...customers];
    // Optimistic delete happens BEFORE server action
    setCustomers(prev => prev.filter(c => c._id !== id));

    try {
      const result = await deleteCustomer(id);
      if (!result.success) {
        // Rollback
        setCustomers(previousCustomers);
        alert(result.error || "Failed to delete customer.");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      setCustomers(previousCustomers);
      alert("An error occurred while deleting the customer.");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">Manage your fruit buyers.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <Plus size={18} />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search customers..."
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Customer Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Contact</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-center">Batches</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">{customer.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          {customer.contact || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-center font-bold text-emerald-600">
                        {customer.activeLotsCount || 0}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleToggleStatus(customer._id, customer.isActive)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Power size={16} />
                          </button>
                          <button onClick={() => handleOpenEditModal(customer)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteClick(customer._id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors relative z-50 pointer-events-auto"
                            title="Delete Customer"
                          >
                            <Trash2 size={16} className="pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <input
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
            <input
              type="text" value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Phone or Email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (editingCustomer ? "Update Customer" : "Add Customer")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCustomerId}
        onClose={() => setDeletingCustomerId(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this customer? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCustomerId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Delete Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
