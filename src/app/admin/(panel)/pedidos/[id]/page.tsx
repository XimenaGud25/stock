import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { getOrder } from "@/lib/admin-data";
import { getBranches } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { Card, PageTitle, StatusPill } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata = { title: "Pedido" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, branches] = await Promise.all([getOrder(Number(id)), getBranches()]);
  if (!order) notFound();

  const branch = branches.find((b) => b.id === order.branchId);
  const greeting = encodeURIComponent(`Hola ${order.customerName}, te escribimos de Stock Herramienta sobre tu pedido #${order.id}.`);

  return (
    <>
      <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="size-4" /> Pedidos
      </Link>
      <PageTitle title={`Pedido #${order.id}`} description={formatDate(order.createdAt)} action={<StatusPill status={order.status} />} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <h2 className="border-b border-line px-6 py-4 text-lg font-bold text-navy">Productos</h2>
          <ul className="divide-y divide-line">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{i.brand}</span>
                  {i.productId ? (
                    <Link href={`/admin/productos/${i.productId}`} className="font-medium hover:text-brand">
                      {i.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{i.name}</span>
                  )}
                  <span className="block text-sm text-muted">
                    {i.quantity} × {formatPrice(i.price)}
                  </span>
                </span>
                <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-line px-6 py-4">
            <span className="text-muted">Total (IVA incluido)</span>
            <span className="font-display text-2xl font-bold text-navy">{formatPrice(order.total)}</span>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-bold text-navy">Estado</h2>
            <OrderStatusForm orderId={order.id} status={order.status} />
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-bold text-navy">Cliente</h2>
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-muted">{order.phone}</p>
            {order.email && <p className="text-muted">{order.email}</p>}
            <p>
              <span className="font-semibold">Entrega: </span>
              {order.delivery === "recoger" ? `Recoger en ${branch?.name ?? "sucursal"}` : order.address}
            </p>
            {order.notes && (
              <p className="rounded-xl bg-surface px-4 py-3 text-sm">
                <span className="font-semibold">Notas: </span>
                {order.notes}
              </p>
            )}
            <a
              href={`https://wa.me/52${order.phone}?text=${greeting}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25d366] font-bold text-white hover:brightness-95"
            >
              <MessageCircle className="size-5" /> Escribir por WhatsApp
            </a>
          </Card>
        </div>
      </div>
    </>
  );
}
