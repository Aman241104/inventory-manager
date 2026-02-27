"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import { revalidatePath } from "next/cache";

export async function deleteLot(id: string) {
  try {
    await connectDB();
    // Soft delete the lot
    await Purchase.findByIdAndUpdate(id, { isDeleted: true });
    // Also soft delete associated sales
    await Sale.updateMany({ purchaseId: id }, { isDeleted: true });
    revalidatePath("/details");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete lot" };
  }
}

export async function deleteSale(id: string) {
  try {
    await connectDB();
    // Soft delete the sale
    await Sale.findByIdAndUpdate(id, { isDeleted: true });
    revalidatePath("/details");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete sale" };
  }
}

export async function getDetailedReport(filters: {
  fromDate?: string;
  toDate?: string;
  productId?: string;
}) {
  try {
    await connectDB();
    
    // Explicitly register schemas for population
    const _v = Vendor;
    const _c = Customer;
    const _p = Product;
    
    const query: any = { isDeleted: false };
    if (filters.productId) query.productId = filters.productId;
    if (filters.fromDate || filters.toDate) {
      query.date = {};
      if (filters.fromDate) query.date.$gte = new Date(filters.fromDate);
      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Get all lots matching filters
    const lots = await Purchase.find(query)
      .populate("productId", "name unitType")
      .populate("vendorIds", "name")
      .sort({ date: -1 })
      .lean();

    const lotIds = lots.map((l: any) => l._id);

    // Fetch all sales for these lots in ONE query
    const allSales = await Sale.find({ 
      purchaseId: { $in: lotIds }, 
      isDeleted: false 
    })
    .populate("customerId", "name")
    .sort({ date: 1 })
    .lean();

    const detailedRows = lots.map((lot: any) => {
      try {
        const lotSales = allSales.filter((s: any) => s.purchaseId && s.purchaseId.toString() === lot._id.toString());
        const totalSold = lotSales.reduce((acc: number, s: any) => acc + s.quantity, 0);
        
        const lotDate = lot.date ? new Date(lot.date) : new Date();
        
        return {
          lotId: lot._id.toString(),
          date: lotDate.toISOString().split('T')[0],
          productName: lot.productId?.name || "Deleted Product",
          unitType: lot.productId?.unitType || "N/A",
          lotName: lot.lotName || "Unnamed Batch",
          vendorName: lot.vendorNames && lot.vendorNames.length > 0 
            ? lot.vendorNames.join(", ") 
            : (lot.vendorIds && lot.vendorIds.length > 0 
                ? lot.vendorIds.map((v: any) => v.name || "Unknown").join(", ") 
                : "N/A"),
          vendorNames: lot.vendorNames || [],
          purchasedQty: lot.quantity || 0,
          purchasedRate: lot.rate || 0,
          purchasedTotal: lot.totalAmount || (lot.quantity * lot.rate) || 0,
          sales: lotSales.map((s: any) => ({
            saleId: s._id.toString(),
            date: s.date ? new Date(s.date).toISOString().split('T')[0] : lotDate.toISOString().split('T')[0],
            customerName: s.customerId?.name || "N/A",
            quantity: s.quantity || 0,
            rate: s.rate || 0,
            total: s.totalAmount || (s.quantity * s.rate) || 0
          })),
          totalSoldQty: totalSold,
          remainingQty: (lot.quantity || 0) - totalSold
        };
      } catch (err) {
        console.error("Error processing lot row:", err);
        return null;
      }
    }).filter(Boolean);

    return { success: true, data: JSON.parse(JSON.stringify(detailedRows)) };
  } catch (error: any) {
    console.error("Report error detail:", error);
    return { success: false, error: error.message || "Failed to fetch detailed report" };
  }
}
