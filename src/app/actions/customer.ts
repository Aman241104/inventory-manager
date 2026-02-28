"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import mongoose from "mongoose";
import { MOCK_CUSTOMERS } from "@/lib/mockData";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getCustomers() {
  if (USE_MOCK) return { success: true, data: MOCK_CUSTOMERS };
  try {
    await connectDB();
    const customers = await Customer.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

    const customersWithStats = await Promise.all(customers.map(async (c: any) => {
      const distinctLotsSold = await Sale.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(c._id), isDeleted: false } },
        { $group: { _id: "$purchaseId" } }
      ]);
      return {
        ...c,
        _id: c._id.toString(),
        activeLotsCount: distinctLotsSold.length
      };
    }));

    return { success: true, data: customersWithStats };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

export async function addCustomer(formData: { name: string; contact: string }) {
  if (USE_MOCK) return { success: true, customer: { _id: Date.now().toString(), ...formData, isActive: true, activeLotsCount: 0 } };
  try {
    await connectDB();
    const newCustomer = new Customer(formData);
    await newCustomer.save();
    try { revalidatePath("/customers"); } catch (e) { }
    return {
      success: true,
      customer: {
        name: newCustomer.name,
        contact: newCustomer.contact,
        _id: newCustomer._id.toString(),
        isActive: newCustomer.isActive !== undefined ? newCustomer.isActive : true,
        activeLotsCount: 0
      }
    };
  } catch (error) {
    console.error("Failed to add customer:", error);
    return { success: false, error: "Failed to add customer" };
  }
}

export async function updateCustomer(id: string, formData: { name: string; contact: string }) {
  if (USE_MOCK) return { success: true, formData };
  try {
    await connectDB();
    await Customer.findByIdAndUpdate(id, formData);
    try { revalidatePath("/customers"); } catch (e) { }
    return { success: true, formData };
  } catch (error) {
    console.error("Failed to update customer:", error);
    return { success: false, error: "Failed to update customer" };
  }
}

export async function deleteCustomer(id: string) {
  if (USE_MOCK) return { success: true };
  try {
    await connectDB();

    // Soft delete
    await Customer.findByIdAndUpdate(id, { isDeleted: true });

    try { revalidatePath("/customers"); } catch (e) { }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return { success: false, error: "Failed to delete customer" };
  }
}

export async function toggleCustomerStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    await Customer.findByIdAndUpdate(id, { isActive });
    try { revalidatePath("/customers"); } catch (e) { }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update customer" };
  }
}
