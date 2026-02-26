"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import { ILotSummary } from "@/types";

export async function getDashboardStats() {
  try {
    await connectDB();

    // Get all lots (Purchases)
    const lots = await Purchase.find({ isDeleted: false })
      .populate("productId", "name unitType")
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

    const lotSummaries: ILotSummary[] = lots.map((lot: any) => {
        // Filter sales for this specific lot from the pre-fetched list
        const lotSales = allSales.filter((s: any) => s.purchaseId.toString() === lot._id.toString());

        const totalSold = lotSales.reduce((acc: number, sale: any) => acc + sale.quantity, 0);
        const remainingStock = lot.quantity - totalSold;

        let status: 'OK' | 'REMAINING' | 'EXTRA_SOLD' = 'OK';
        if (remainingStock > 0) status = 'REMAINING';
        if (remainingStock < 0) status = 'EXTRA_SOLD';

        return {
          lotId: lot._id.toString(),
          productName: lot.productId?.name || "Deleted Product",
          unitType: lot.productId?.unitType || "N/A",
          lotName: lot.lotName,
          purchaseRate: lot.rate,
          date: new Date(lot.date).toISOString().split('T')[0],
          totalPurchased: lot.quantity,
          sales: lotSales.map((s: any) => ({
            customerName: s.customerId?.name || "Unknown",
            quantity: s.quantity,
            rate: s.rate,
            date: new Date(s.date).toISOString().split('T')[0]
          })),
          remainingStock: remainingStock,
          status
        };
    });

    const totalBatchesActive = lotSummaries.filter(l => l.remainingStock > 0).length;
    const totalUnitsInHand = lotSummaries.reduce((acc, l) => acc + (l.remainingStock > 0 ? l.remainingStock : 0), 0);
    const totalShortage = lotSummaries.reduce((acc, l) => acc + (l.remainingStock < 0 ? Math.abs(l.remainingStock) : 0), 0);

    // Monetary stats (Secondary)
    const inventoryValue = lotSummaries.reduce((acc, l) => acc + (l.remainingStock > 0 ? l.remainingStock * l.purchaseRate : 0), 0);
    const shortageValue = lotSummaries.reduce((acc, l) => acc + (l.remainingStock < 0 ? Math.abs(l.remainingStock) * l.purchaseRate : 0), 0);

    return {
      success: true,
      data: {
        lotSummaries,
        summary: {
          totalBatchesActive,
          totalUnitsInHand,
          totalShortage,
          inventoryValue,
          shortageValue
        }
      }
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
