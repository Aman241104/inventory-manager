import { getPurchases } from "@/app/actions/transaction";
import { getProducts } from "@/app/actions/product";
import { getVendors } from "@/app/actions/vendor";
import BuyList from "@/components/buy/BuyList";

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<{ fromDate?: string; toDate?: string }>;
}) {
  const params = await searchParams;
  const [purchaseRes, productRes, vendorRes] = await Promise.all([
    getPurchases(params.fromDate, params.toDate),
    getProducts(),
    getVendors()
  ]);

  return (
    <BuyList 
      initialPurchases={purchaseRes.success ? purchaseRes.data : []}
      products={productRes.success ? productRes.data : []}
      vendors={vendorRes.success ? vendorRes.data : []}
    />
  );
}
