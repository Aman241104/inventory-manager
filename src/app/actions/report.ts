"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import Customer from "@/models/Customer";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

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

    // Get sale info before deleting to restore stock
    const sale = await Sale.findById(id);
    if (sale) {
      await Purchase.findByIdAndUpdate(sale.purchaseId, {
        $inc: { remainingQty: sale.quantity }
      });
    }

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

    const matchQuery: any = { isDeleted: false };
    if (filters.productId) matchQuery.productId = new mongoose.Types.ObjectId(filters.productId);
    if (filters.fromDate || filters.toDate) {
      matchQuery.date = {};
      if (filters.fromDate) matchQuery.date.$gte = new Date(filters.fromDate);
      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    }

    const detailedRows = await Purchase.aggregate([
      { $match: matchQuery },
      { $sort: { date: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "vendors",
          localField: "vendorIds",
          foreignField: "_id",
          as: "vendors"
        }
      },
      {
        $lookup: {
          from: "sales",
          let: { lotId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$purchaseId", "$$lotId"] }, { $eq: ["$isDeleted", false] }] } } },
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
                _id: 0,
                saleId: { $toString: "$_id" },
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                customerName: { $ifNull: ["$customer.name", "Unknown"] },
                quantity: 1,
                rate: 1,
                total: "$totalAmount"
              }
            }
          ],
          as: "sales"
        }
      },
      {
        $project: {
          _id: 0,
          lotId: { $toString: "$_id" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          productName: "$product.name",
          unitType: "$product.unitType",
          lotName: 1,
          vendorNames: 1,
          vendorName: {
            $cond: [
              { $gt: [{ $size: "$vendorNames" }, 0] },
              { $reduce: { input: "$vendorNames", initialValue: "", in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", ""] }, "", ", "] }, "$$this"] } } },
              "N/A"
            ]
          },
          purchasedQty: "$quantity",
          purchasedRate: "$rate",
          purchasedTotal: "$totalAmount",
          sales: 1,
          totalSoldQty: { $sum: "$sales.quantity" },
          remainingQty: { $subtract: ["$quantity", { $sum: "$sales.quantity" }] },
          notes: 1
        }
      }
    ]);

    return { success: true, data: JSON.parse(JSON.stringify(detailedRows)) };
  } catch (error: any) {
    console.error("Report error detail:", error);
    return { success: false, error: error.message || "Failed to fetch detailed report" };
  }
}
