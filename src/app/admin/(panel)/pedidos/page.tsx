import Link from "next/link";
import type { OrderStatus } from "@/types";
import { countOrdersByStatus, listOrders } from "@/lib/admin-data";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { Card, ORDER_STATUS, PageTitle, StatusPill } from "@/components/admin/ui";

export const metadata = { title: "Pedidos" };

const STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const status = STATUSES.includes(estado as OrderStatus) ? (estado as OrderStatus) : undefined;
  const [orders, counts] = await Promise.all([listOrders(status), countOrdersByStatus()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs = [{ value: undefined, label: "Todos", count: total }, ...STATUSES.map((s) => ({ value: s, label: ORDER_STATUS[s].label, count: counts[s] }))];

  return (
    <>
      <PageTitle title="Pedidos" description="Los pedidos que hacen los clientes desde la tienda. Al cancelar uno, las piezas regresan al stock." />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.value ? `/admin/pedidos?estado=${t.value}` : "/admin/pedidos"}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              status === t.value ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy",
            )}
          >
            {t.label} <span className="opacity-70">({t.count})</span>
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-line text-sm text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Entrega</th>
              <th className="px-5 py-3 font-medium">Piezas</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface">
                <td className="px-5 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand hover:underline">
                    #{o.id}
                  </Link>
                  <span className="block text-xs text-dim">{formatDate(o.createdAt)}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="block font-medium">{o.customerName}</span>
                  <span className="text-sm text-muted">{o.phone}</span>
                </td>
                <td className="px-5 py-3 text-sm">{o.delivery === "recoger" ? "Recoger en sucursal" : "Envío a domicilio"}</td>
                <td className="px-5 py-3">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-5 py-3 font-semibold">{formatPrice(o.total)}</td>
                <td className="px-5 py-3">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="px-6 py-12 text-center text-muted">No hay pedidos aquí.</p>}
      </Card>
    </>
  );
}
