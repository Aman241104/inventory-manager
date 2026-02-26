"use server";

import connectDB from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import Product from "@/models/Product";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getDashboardStats() {
  if (USE_MOCK) {
    return {
      success: true,
      data: {
        purchaseToday: 24500,
        saleToday: 18200,
        productCount: 4,
        extraSoldCount: 1,
        inventorySummary: [
          { _id: '1', name: 'Kiwi', unitType: 'Box', totalBuy: 10, totalSell: 4, status: 'Remaining', diff: 6 },
          { _id: '2', name: 'Mango', unitType: 'Box', totalBuy: 20, totalSell: 25, status: 'Extra Sold', diff: 5 },
          { _id: '3', name: 'Grapes', unitType: 'Kg', totalBuy: 50, totalSell: 50, status: 'OK', diff: 0 },
        ],
        dailyData: [
          { name: 'Mon', purchase: 4000, sale: 2400 },
          { name: 'Tue', purchase: 3000, sale: 1398 },
          { name: 'Wed', purchase: 2000, sale: 9800 },
          { name: 'Thu', purchase: 2780, sale: 3908 },
          { name: 'Fri', purchase: 1890, sale: 4800 },
          { name: 'Sat', purchase: 2390, sale: 3800 },
          { name: 'Sun', purchase: 3490, sale: 4300 },
        ]
      }
    };
  }
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total Purchase Today
    const purchaseToday = await Purchase.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$rate"] } } } }
    ]);

    // Total Sale Today
    const saleToday = await Sale.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$rate"] } } } }
    ]);

    // Total Products
    const productCount = await Product.countDocuments({ isActive: true });

    // Extra Sold Count
    const extraSoldCount = await Sale.countDocuments({ isExtraSold: true });

    // Daily Data for Charts (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const pDay = await Purchase.aggregate([
        { $match: { date: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$rate"] } } } }
      ]);

      const sDay = await Sale.aggregate([
        { $match: { date: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$rate"] } } } }
      ]);

      last7Days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        purchase: pDay[0]?.total || 0,
        sale: sDay[0]?.total || 0
      });
    }

    // Inventory Summary (Product-wise)
    const products = await Product.find({ isActive: true }).select("name unitType");
    
    const inventorySummary = await Promise.all(products.map(async (p) => {
      const pId = p._id;
      
      const purchases = await Purchase.aggregate([
        { $match: { productId: pId } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);
      
      const sales = await Sale.aggregate([
        { $match: { productId: pId } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);

      const totalBuy = purchases[0]?.total || 0;
      const totalSell = sales[0]?.total || 0;
      
      let status = "OK";
      let diff = 0;
      
      if (totalSell > totalBuy) {
        status = "Extra Sold";
        diff = totalSell - totalBuy;
      } else if (totalBuy > totalSell) {
        status = "Remaining";
        diff = totalBuy - totalSell;
      }

      return {
        _id: p._id,
        name: p.name,
        unitType: p.unitType,
        totalBuy,
        totalSell,
        status,
        diff
      };
    }));

    return {
      success: true,
      data: {
        purchaseToday: purchaseToday[0]?.total || 0,
        saleToday: saleToday[0]?.total || 0,
        productCount,
        extraSoldCount,
        inventorySummary,
        dailyData: last7Days
      }
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
