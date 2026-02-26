import { getProducts } from "@/app/actions/product";
import ProductList from "@/components/products/ProductList";

export default async function ProductsPage() {
  const result = await getProducts();
  const initialProducts = result.success && result.data ? result.data : [];

  return <ProductList initialProducts={initialProducts} />;
}
