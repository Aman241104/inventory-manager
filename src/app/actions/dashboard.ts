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
      .sort({ date: -1 });

    const lotSummaries: ILotSummary[] = await Promise.all(
      lots.map(async (lot) => {
        // Find all sales for this specific lot
        const sales = await Sale.find({ purchaseId: lot._id, isDeleted: false })
          .populate("customerId", "name")
          .sort({ date: 1 });

        const totalSold = sales.reduce((acc, sale) => acc + sale.quantity, 0);
        const remainingStock = lot.quantity - totalSold;

        let status: 'OK' | 'REMAINING' | 'EXTRA_SOLD' = 'OK';
        if (remainingStock > 0) status = 'REMAINING';
        if (remainingStock < 0) status = 'EXTRA_SOLD';

        return {
          lotId: lot._id.toString(),
          productName: lot.productId?.name || "Deleted Product",
          unitType: lot.productId?.unitType || "N/A",
          lotName: lot.lotName,
          date: lot.date.toISOString().split('T')[0],
          totalPurchased: lot.quantity,
          sales: sales.map(s => ({
            customerName: s.customerId?.name || "Unknown",
            quantity: s.quantity,
            date: s.date.toISOString().split('T')[0]
          })),
          remainingStock: remainingStock,
          status
        };
      })
    );

    const totalBatchesActive = lotSummaries.filter(l => l.remainingStock > 0).length;
    const totalUnitsInHand = lotSummaries.reduce((acc, l) => acc + (l.remainingStock > 0 ? l.remainingStock : 0), 0);
    const totalShortage = lotSummaries.reduce((acc, l) => acc + (l.remainingStock < 0 ? Math.abs(l.remainingStock) : 0), 0);

    return {
      success: true,
      data: {
        lotSummaries,
        summary: {
          totalBatchesActive,
          totalUnitsInHand,
          totalShortage
        }
      }
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
