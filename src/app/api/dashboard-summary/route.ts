import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import { getCurrentStock } from "@/services/stockService";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // totalPurchaseToday (Amount based on prompt structure logic or Quantity? Prompt says tracking. Usually dashboard-summary shows amounts)
    const purchaseToday = await Purchase.aggregate([
      { $match: { date: { $gte: today }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const saleToday = await Sale.aggregate([
      { $match: { date: { $gte: today }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const products = await Product.find({ isActive: true });

    const productWiseStock = await Promise.all(products.map(async (p) => {
      const stock = await getCurrentStock(p._id.toString());
      return {
        productId: p._id,
        productName: p.name,
        ...stock
      };
    }));

    return NextResponse.json({
      totalPurchaseToday: purchaseToday[0]?.total || 0,
      totalSalesToday: saleToday[0]?.total || 0,
      productWiseStock
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 });
  }
}
