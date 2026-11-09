import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { OrderChannel, OrderStatus } from "@/types";
import { countOrdersByStatus, countPaymentsToConfirm, listOrders } from "@/lib/admin-data";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { ALL_STATUSES, CHANNEL_LABEL } from "@/lib/orders";
import { adminInput, ButtonLink, Card, ChannelPill, ORDER_STATUS, PageTitle, PaymentPill, StatusPill } from "@/components/admin/ui";

export const metadata = { title: "Pedidos" };

const CHANNELS: OrderChannel[] = ["en_linea", "tienda"];

type SearchParams = { estado?: string; canal?: string; q?: string; pago?: string };
const PAYMENT_FILTERS = { por_confirmar: "Pagos por confirmar", sin_pagar: "Sin pagar" } as const;
type PaymentFilter = keyof typeof PAYMENT_FILTERS;

function href(params: SearchParams) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const status = ALL_STATUSES.includes(sp.estado as OrderStatus) ? (sp.estado as OrderStatus) : undefined;
  const channel = CHANNELS.includes(sp.canal as OrderChannel) ? (sp.canal as OrderChannel) : undefined;
  const q = sp.q?.trim() || undefined;
  const payment = sp.pago && sp.pago in PAYMENT_FILTERS ? (sp.pago as PaymentFilter) : undefined;
  const [orders, counts, toConfirm] = await Promise.all([
    listOrders({ status, channel, q, payment }),
    countOrdersByStatus(channel),
    countPaymentsToConfirm(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs = [{ value: undefined, label: "Todos", count: total }, ...ALL_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS[s].label, count: counts[s] }))];

  return (
    <>
      <PageTitle
        title="Pedidos y ventas"
        description="Pedidos de la tienda en línea y ventas de mostrador. Al cancelar uno, las piezas regresan al stock."
        action={
          <ButtonLink href="/admin/ventas/nueva">
            <Plus className="size-5" /> Venta en mostrador
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-line bg-white p-1">
          {[undefined, ...CHANNELS].map((c) => (
            <Link
              key={c ?? "all"}
              href={href({ canal: c, q })}
              className={cn("rounded-lg px-4 py-2 text-sm font-semibold", channel === c ? "bg-navy text-white" : "text-muted hover:text-navy")}
            >
              {c ? CHANNEL_LABEL[c] : "Todos los canales"}
            </Link>
          ))}
        </div>
        {(Object.keys(PAYMENT_FILTERS) as PaymentFilter[]).map((f) => (
          <Link
            key={f}
            href={href({ pago: payment === f ? undefined : f, canal: channel, q })}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-semibold",
              payment === f ? "border-navy bg-navy text-white" : "border-line bg-white text-muted hover:text-navy",
              f === "por_confirmar" && toConfirm > 0 && payment !== f && "border-accent bg-accent/15 text-[#8a5a00]",
            )}
          >
            {PAYMENT_FILTERS[f]}
            {f === "por_confirmar" && <span className="ml-1.5 opacity-80">({toConfirm})</span>}
          </Link>
        ))}
        <form action="/admin/pedidos" className="relative min-w-[240px] flex-1">
          {channel && <input type="hidden" name="canal" value={channel} />}
          {status && <input type="hidden" name="estado" value={status} />}
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-dim" />
          <input name="q" defaultValue={q} placeholder="Buscar por #pedido, nombre o teléfono" className={cn(adminInput, "pl-12")} />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={href({ estado: t.value, canal: channel, q })}
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
        <table className="w-full min-w-[980px] text-left">
          <thead className="border-b border-line text-sm text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Canal</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Entrega</th>
              <th className="px-5 py-3 font-medium">Piezas</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Pago</th>
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
                  <ChannelPill channel={o.channel} />
                </td>
                <td className="px-5 py-3">
                  <span className="block font-medium">{o.customerName}</span>
                  <span className="text-sm text-muted">{o.phone || "—"}</span>
                </td>
                <td className="px-5 py-3 text-sm">
                  {o.channel === "tienda" ? "En mostrador" : o.delivery === "recoger" ? "Recoger en sucursal" : "Envío a domicilio"}
                </td>
                <td className="px-5 py-3">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-5 py-3 font-semibold">{formatPrice(o.total)}</td>
                <td className="px-5 py-3">{o.status === "cancelado" ? <span className="text-sm text-dim">—</span> : <PaymentPill status={o.paymentStatus} />}</td>
                <td className="px-5 py-3">
                  <StatusPill status={o.status} delivery={o.delivery} />
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
