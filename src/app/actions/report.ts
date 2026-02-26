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
      .populate("vendorId", "name")
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
      // Filter sales for this specific lot from the pre-fetched list
      const lotSales = allSales.filter((s: any) => s.purchaseId.toString() === lot._id.toString());
      const totalSold = lotSales.reduce((acc: number, s: any) => acc + s.quantity, 0);

      return {
        lotId: lot._id.toString(),
        date: new Date(lot.date).toISOString().split('T')[0],
        productName: lot.productId?.name || "Deleted Product",
        unitType: lot.productId?.unitType || "N/A",
        lotName: lot.lotName,
        vendorName: lot.vendorId?.name || "N/A",
        purchasedQty: lot.quantity,
        purchasedRate: lot.rate,
        purchasedTotal: lot.totalAmount || (lot.quantity * lot.rate),
        sales: lotSales.map((s: any) => ({
          saleId: s._id.toString(),
          date: new Date(s.date).toISOString().split('T')[0],
          customerName: s.customerId?.name || "N/A",
          quantity: s.quantity,
          rate: s.rate,
          total: s.totalAmount || (s.quantity * s.rate)
        })),
        totalSoldQty: totalSold,
        remainingQty: lot.quantity - totalSold
      };
    });

    return { success: true, data: detailedRows };
  } catch (error) {
    console.error("Report error:", error);
    return { success: false, error: "Failed to fetch detailed report" };
  }
}
