import { getVendors } from "@/app/actions/vendor";
import VendorList from "@/components/vendors/VendorList";

export default async function VendorsPage() {
  const result = await getVendors();
  const initialVendors = result.success && result.data ? result.data : [];

  return <VendorList initialVendors={initialVendors} />;
}
