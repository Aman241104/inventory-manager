import { getProducts } from "@/app/actions/product";
import ReportViewer from "@/components/details/ReportViewer";

export default async function DetailsPage() {
  const productsRes = await getProducts();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Detailed Report</h1>
        <p className="text-slate-500">Analyze batches, transactions, and stock in detail.</p>
      </div>
      
      <ReportViewer 
        products={productsRes.success && productsRes.data ? productsRes.data : []} 
      />
    </div>
  );
}
