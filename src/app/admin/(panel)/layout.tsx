import { requireAdmin } from "@/lib/auth";
import { countOrdersByStatus, listAllProducts } from "@/lib/admin-data";
import { isLowStock } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [orders, products] = await Promise.all([countOrdersByStatus(), listAllProducts()]);
  const lowStock = products.filter((p) => p.active && isLowStock(p)).length;

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
      <AdminNav email={user.email ?? ""} newOrders={orders.nuevo} lowStock={lowStock} />
      <main className="mx-auto w-full max-w-[1280px] space-y-8 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
