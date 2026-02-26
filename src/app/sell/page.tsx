import { getSales } from "@/app/actions/transaction";
import { getProducts } from "@/app/actions/product";
import { getCustomers } from "@/app/actions/customer";
import SellList from "@/components/sell/SellList";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ fromDate?: string; toDate?: string }>;
}) {
  const params = await searchParams;
  const [salesRes, productRes, customerRes] = await Promise.all([
    getSales(params.fromDate, params.toDate),
    getProducts(),
    getCustomers()
  ]);

  return (
    <SellList 
      initialSales={salesRes.success ? salesRes.data : []}
      products={productRes.success ? productRes.data : []}
      customers={customerRes.success ? customerRes.data : []}
    />
  );
}
