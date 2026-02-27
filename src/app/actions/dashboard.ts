"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import { ILotSummary } from "@/types";

export async function getDashboardStats() {
  try {
    await connectDB();

    // Use aggregation for extreme speed
    const lotSummaries: any[] = await Purchase.aggregate([
      { $match: { isDeleted: false } },
      { $sort: { date: -1 } },
      // Join Product info
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      // Join Sales info
      {
        $lookup: {
          from: "sales",
          let: { lotId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$purchaseId", "$$lotId"] }, { $eq: ["$isDeleted", false] } ] } } },
            { $sort: { date: 1 } },
            {
              $lookup: {
                from: "customers",
                localField: "customerId",
                foreignField: "_id",
                as: "customer"
              }
            },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                customerName: { $ifNull: ["$customer.name", "Unknown"] },
                quantity: 1,
                rate: 1,
                date: 1
              }
            }
          ],
          as: "sales"
        }
      },
      // Final Projection: Send only what the UI needs
      {
        $project: {
          _id: 0,
          lotId: { $toString: "$_id" },
          productName: "$product.name",
          unitType: "$product.unitType",
          lotName: 1,
          purchaseRate: "$rate",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalPurchased: "$quantity",
          remainingStock: "$remainingQty",
          sales: 1,
          status: {
            $cond: [
              { $gt: ["$remainingQty", 0] }, "REMAINING",
              { $cond: [ { $lt: ["$remainingQty", 0] }, "EXTRA_SOLD", "OK" ] }
            ]
          }
        }
      }
    ]);

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

export async function searchAll(query: string) {
  try {
    await connectDB();
    if (!query || query.length < 2) return { success: true, data: [] };

    const regex = new RegExp(query, "i");

    const [lots, customers] = await Promise.all([
      Purchase.find({ 
        $or: [{ lotName: regex }, { vendorNames: regex }],
        isDeleted: false 
      }).limit(5).populate("productId", "name").lean(),
      Customer.find({ name: regex, isActive: true }).limit(5).lean()
    ]);

    const results = [
      ...lots.map((l: any) => ({
        id: l._id.toString(),
        title: l.lotName,
        subtitle: `${l.productId?.name || 'Product'} • ${l.vendorNames?.join(", ")}`,
        type: 'lot',
        href: `/details?fromDate=${new Date(l.date).toISOString().split('T')[0]}&toDate=${new Date(l.date).toISOString().split('T')[0]}`
      })),
      ...customers.map((c: any) => ({
        id: c._id.toString(),
        title: c.name,
        subtitle: `Customer • ${c.contact}`,
        type: 'customer',
        href: `/customers`
      }))
    ];

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: "Search failed" };
  }
}
