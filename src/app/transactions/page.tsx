import { Suspense } from "react";
import { getProducts } from "@/app/actions/product";
import { getVendors } from "@/app/actions/vendor";
import { getCustomers } from "@/app/actions/customer";
import TransactionManager from "@/components/transactions/TransactionManager";

export default async function TransactionsPage() {
  const [productsRes, vendorsRes, customersRes] = await Promise.all([
    getProducts(),
    getVendors(),
    getCustomers()
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Transaction Module...</div>}>
      <TransactionManager 
        products={productsRes.success && productsRes.data ? productsRes.data : []}
        vendors={vendorsRes.success && vendorsRes.data ? vendorsRes.data : []}
        customers={customersRes.success && customersRes.data ? customersRes.data : []}
      />
    </Suspense>
  );
}
