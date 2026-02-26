import { NextResponse } from "next/server";
import { getCurrentStock } from "@/services/stockService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const stock = await getCurrentStock(productId);
    return NextResponse.json(stock);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}
