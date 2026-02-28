"use client";

import React, { useState } from "react";
import { Plus, Search, Edit2, Power, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { addVendor, updateVendor, toggleVendorStatus, deleteVendor } from "@/app/actions/vendor";

export default function VendorList({ initialVendors }: { initialVendors: any[] }) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });

  React.useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingVendor(null);
    setFormData({ name: "", contact: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: any) => {
    setEditingVendor(customer);
    setFormData({ name: customer.name, contact: customer.contact || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (editingVendor) {
      result = await updateVendor(editingVendor._id, formData);
    } else {
      result = await addVendor(formData);
    }

    if (result.success) {
      setIsModalOpen(false);

      if (editingVendor) {
        setVendors(prev => prev.map(v => v._id === editingVendor._id ? { ...v, ...formData } : v));
      } else if ('vendor' in result && result.vendor) {
        setVendors(prev => [result.vendor, ...prev]);
      }

      router.refresh();
    } else {
      alert("Failed to save vendor");
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const previousVendors = [...vendors];
    setVendors(prev => prev.map(v => v._id === id ? { ...v, isActive: !currentStatus } : v));

    try {
      const result = await toggleVendorStatus(id, !currentStatus);
      if (!result.success) {
        setVendors(previousVendors);
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error toggling vendor status:", err);
      setVendors(previousVendors);
      alert("An error occurred while updating the vendor status.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingVendorId(id);
  };

  const confirmDelete = async () => {
    if (!deletingVendorId) return;

    const id = deletingVendorId;
    setDeletingVendorId(null);

    const previousVendors = [...vendors];
    // Optimistic delete happens BEFORE server action
    setVendors(prev => prev.filter(v => v._id !== id));

    try {
      const result = await deleteVendor(id);
      if (!result.success) {
        // Rollback
        setVendors(previousVendors);
        alert(result.error || "Failed to delete vendor.");
      }
    } catch (err) {
      console.error("Error deleting vendor:", err);
      setVendors(previousVendors);
      alert("An error occurred while deleting the vendor.");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendors</h1>
          <p className="text-slate-500">Manage your fruit suppliers.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <Plus size={18} />
          Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Vendor List ({filteredVendors.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search vendors..."
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
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Vendor Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Contact</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-center">Batches</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No vendors found.</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">{vendor.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          {vendor.contact || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-center font-bold text-indigo-600">
                        {vendor.activeLotsCount || 0}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                          {vendor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleToggleStatus(vendor._id, vendor.isActive)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Power size={16} />
                          </button>
                          <button onClick={() => handleOpenEditModal(vendor)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteClick(vendor._id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors relative z-50 pointer-events-auto"
                            title="Delete Vendor"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVendor ? "Edit Vendor" : "Add New Vendor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
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
              {loading ? "Saving..." : (editingVendor ? "Update Vendor" : "Add Vendor")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingVendorId}
        onClose={() => setDeletingVendorId(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this vendor? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingVendorId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Delete Vendor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
