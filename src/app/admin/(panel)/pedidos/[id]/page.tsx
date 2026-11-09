import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CreditCard, ExternalLink, Mail, MessageCircle, User } from "lucide-react";
import { getOrder, getOrderEmails } from "@/lib/admin-data";
import { getBranches } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_LABEL, statusLabel } from "@/lib/orders";
import { trackingUrl } from "@/lib/site";
import { Card, ChannelPill, PageTitle, PaymentPill, StatusPill } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { PaymentCard } from "@/components/admin/PaymentCard";

export const metadata = { title: "Pedido" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, branches, emails] = await Promise.all([getOrder(Number(id)), getBranches(), getOrderEmails(Number(id))]);
  if (!order) notFound();

  const branch = branches.find((b) => b.id === order.branchId);
  const isStore = order.channel === "tienda";
  const tracking = await trackingUrl(order.trackingToken);
  const greeting = encodeURIComponent(
    `Hola ${order.customerName}, te escribimos de Stock Herramienta sobre tu pedido #${order.id}.\nSeguimiento: ${tracking}`,
  );

  return (
    <>
      <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="size-4" /> Pedidos
      </Link>
      <PageTitle
        title={isStore ? `Venta #${order.id}` : `Pedido #${order.id}`}
        description={formatDate(order.createdAt)}
        action={
          <span className="flex items-center gap-4">
            <ChannelPill channel={order.channel} />
            <PaymentPill status={order.paymentStatus} />
            <StatusPill status={order.status} delivery={order.delivery} />
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
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

          <Card className="p-6">
            <h2 className="mb-5 text-lg font-bold text-navy">Historial</h2>
            {order.events.length === 0 ? (
              <p className="text-muted">Sin movimientos registrados.</p>
            ) : (
              <ol>
                {[...order.events].reverse().map((e, i, arr) => (
                  <li key={`${e.createdAt}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < arr.length - 1 && <span aria-hidden className="absolute left-[7px] top-5 h-full w-0.5 bg-line" />}
                    <span
                      className={cn(
                        "relative z-10 mt-1 size-4 shrink-0 rounded-full border-[3px]",
                        i === 0 ? (e.status === "cancelado" ? "border-danger bg-danger" : "border-brand bg-brand") : "border-line bg-white",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {e.kind === "pago" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="size-4 text-ok" /> {e.note}
                          </span>
                        ) : (
                          statusLabel(e.status, order.delivery)
                        )}
                        {e.actor === "cliente" && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/25 px-2 py-0.5 text-xs font-bold text-[#8a5a00]">
                            <User className="size-3" /> Lo hizo el cliente
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-dim">{formatDate(e.createdAt)}</p>
                      {e.kind !== "pago" && e.note && <p className="mt-1.5 rounded-xl bg-surface px-3 py-2 text-[15px]">{e.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {!isStore && (
            <Card className="p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-navy">
                <Mail className="size-5 text-brand" /> Correos al cliente
              </h2>
              <p className="mb-4 text-sm text-muted">
                {order.email ? `Se mandan solos a ${order.email} cada vez que cambias el pago o el estado.` : "Este pedido no tiene correo."}
              </p>
              {emails.length === 0 ? (
                <p className="text-sm text-dim">Todavía no se ha mandado ningún correo.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {emails.map((m) => (
                    <li key={m.id} className="py-3">
                      <details>
                        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{m.subject}</span>
                          <span className="flex items-center gap-3 text-sm text-dim">
                            {formatDate(m.createdAt)}
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                                m.status === "enviado" && "bg-ok-soft text-ok",
                                m.status === "simulado" && "bg-accent/25 text-[#8a5a00]",
                                m.status === "error" && "bg-danger-soft text-danger",
                              )}
                            >
                              {m.status === "enviado" ? "Enviado" : m.status === "simulado" ? "Modo prueba" : "Error"}
                            </span>
                          </span>
                        </summary>
                        {m.error && <p className="mt-2 text-sm text-danger">{m.error}</p>}
                        <iframe title={m.subject} srcDoc={m.html} sandbox="" className="mt-3 h-[520px] w-full rounded-xl border border-line" />
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!isStore && (
            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-bold text-navy">Pago</h2>
              <PaymentCard order={order} />
            </Card>
          )}

          {!isStore && (
            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-bold text-navy">Estado</h2>
              <OrderStatusForm order={order} trackingUrl={tracking} />
            </Card>
          )}

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-bold text-navy">Cliente</h2>
            <p className="font-semibold">{order.customerName}</p>
            {order.phone && <p className="text-muted">{order.phone}</p>}
            {order.email && <p className="text-muted">{order.email}</p>}
            {isStore ? (
              <>
                <p>
                  <span className="font-semibold">Sucursal: </span>
                  {branch?.name ?? "—"}
                </p>
                <p>
                  <span className="font-semibold">Pago: </span>
                  {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}
                </p>
              </>
            ) : (
              <p>
                <span className="font-semibold">Entrega: </span>
                {order.delivery === "recoger" ? `Recoger en ${branch?.name ?? "sucursal"}` : order.address}
              </p>
            )}
            {order.notes && (
              <p className="rounded-xl bg-surface px-4 py-3 text-sm">
                <span className="font-semibold">Notas: </span>
                {order.notes}
              </p>
            )}
            {order.phone && (
              <a
                href={`https://wa.me/52${order.phone}?text=${greeting}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25d366] font-bold text-white hover:brightness-95"
              >
                <MessageCircle className="size-5" /> Escribir por WhatsApp
              </a>
            )}
            {!isStore && (
              <a href={tracking} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm font-semibold text-brand hover:underline">
                <ExternalLink className="size-4" /> Ver lo que ve el cliente
              </a>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
