import { Suspense } from "react";
import { getProducts } from "@/app/actions/product";
import { getVendors } from "@/app/actions/vendor";
import { getCustomers } from "@/app/actions/customer";
import { getPurchases, getSales } from "@/app/actions/transaction";
import TransactionManager from "@/components/transactions/TransactionManager";

export default async function TransactionsPage() {
  const today = new Date().toISOString().split('T')[0];
  
  const [productsRes, vendorsRes, customersRes, todayPurchases, todaySales] = await Promise.all([
    getProducts(),
    getVendors(),
    getCustomers(),
    getPurchases(today),
    getSales(today)
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Transaction Module...</div>}>
      <TransactionManager 
        products={productsRes.success && productsRes.data ? productsRes.data : []}
        vendors={vendorsRes.success && vendorsRes.data ? vendorsRes.data : []}
        customers={customersRes.success && customersRes.data ? customersRes.data : []}
        initialPurchases={todayPurchases.success && todayPurchases.data ? todayPurchases.data : []}
        initialSales={todaySales.success && todaySales.data ? todaySales.data : []}
      />
    </Suspense>
  );
}
