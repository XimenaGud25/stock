import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listAllProducts } from "@/lib/admin-data";
import { getBranches } from "@/lib/api";
import { PageTitle } from "@/components/admin/ui";
import { CounterSaleForm } from "@/components/admin/CounterSaleForm";

export const metadata = { title: "Venta en mostrador" };

export default async function CounterSalePage() {
  const [products, branches] = await Promise.all([listAllProducts(), getBranches()]);
  const options = products
    .filter((p) => p.active && p.stock > 0)
    .map((p) => ({ id: p.id, name: p.name, brand: p.brand, sku: p.sku, price: p.price, stock: p.stock }));

  return (
    <>
      <Link href="/admin/pedidos?canal=tienda" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="size-4" /> Ventas en tienda
      </Link>
      <PageTitle title="Venta en mostrador" description="Registra lo que se vende en sucursal: se descuenta del stock y cuenta en Reportes." />
      <CounterSaleForm products={options} branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
    </>
  );
}
