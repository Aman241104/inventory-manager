"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Purchase from "@/models/Purchase";
import { MOCK_VENDORS } from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getVendors() {
  if (USE_MOCK) return { success: true, data: MOCK_VENDORS };
  try {
    await connectDB();
    const vendors = await Vendor.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();
    
    const vendorsWithStats = await Promise.all(vendors.map(async (v: any) => {
      const activeLots = await Purchase.countDocuments({ vendorIds: v._id, isDeleted: false });
      return {
        ...v,
        _id: v._id.toString(),
        activeLotsCount: activeLots
      };
    }));

    return { success: true, data: vendorsWithStats };
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return { success: false, error: "Failed to fetch vendors" };
  }
}

export async function addVendor(formData: { name: string; contact: string }) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    const newVendor = new Vendor(formData);
    await newVendor.save();
    try { revalidatePath("/vendors"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to add vendor:", error);
    return { success: false, error: "Failed to add vendor" };
  }
}

export async function updateVendor(id: string, formData: { name: string; contact: string }) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();
    await Vendor.findByIdAndUpdate(id, formData);
    try { revalidatePath("/vendors"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to update vendor:", error);
    return { success: false, error: "Failed to update vendor" };
  }
}

export async function deleteVendor(id: string) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();

    // Soft delete
    await Vendor.findByIdAndUpdate(id, { isDeleted: true });
    
    try { revalidatePath("/vendors"); } catch (e) {}
    return { success: true };
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return { success: false, error: "Failed to delete vendor" };
  }
}

export async function toggleVendorStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    await Vendor.findByIdAndUpdate(id, { isActive });
    try { revalidatePath("/vendors"); } catch (e) {}
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update vendor" };
  }
}
