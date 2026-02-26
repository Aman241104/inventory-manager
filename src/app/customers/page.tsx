import { getCustomers } from "@/app/actions/customer";
import CustomerList from "@/components/customers/CustomerList";

export default async function CustomersPage() {
  const result = await getCustomers();
  const initialCustomers = result.success ? result.data : [];

  return <CustomerList initialCustomers={initialCustomers} />;
}
