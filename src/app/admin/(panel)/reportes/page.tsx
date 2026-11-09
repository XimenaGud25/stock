import Link from "next/link";
import { Repeat, ShoppingBag, Store, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react";
import { listAllProducts, listOrdersSince } from "@/lib/admin-data";
import { getCategories } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { CHANNEL_LABEL, PAYMENT_LABEL, STATUS_FLOW, statusLabel } from "@/lib/orders";
import { bucketLabel, buildSalesReport, PERIODS, type PeriodValue } from "@/lib/reports";
import { Card, CHANNEL_COLOR, ChannelPill, PageTitle } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/SalesChart";

export const metadata = { title: "Reportes" };

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
      <h2 className="text-lg font-bold text-navy">{children}</h2>
      {aside}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams;
  const period = (PERIODS.some((p) => p.value === periodo) ? periodo : "30d") as PeriodValue;
  const [orders, products, categories] = await Promise.all([listOrdersSince(null), listAllProducts(), getCategories()]);
  const r = buildSalesReport(orders, products, categories, period);

  const { all, en_linea: online, tienda: store } = r.totals;
  const delta = r.previousRevenue ? Math.round(((all.revenue - r.previousRevenue) / r.previousRevenue) * 100) : null;
  const maxUnits = Math.max(...r.topProducts.map((p) => p.units), 1);
  const maxCat = Math.max(...r.categories.map((c) => c.revenue), 1);
  const onlineOrders = Object.values(r.onlineStatus).reduce((a, b) => a + b, 0);
  const rangeText = r.startKey === r.endKey ? bucketLabel(r.endKey) : `${bucketLabel(r.startKey)} – ${bucketLabel(r.endKey)}`;

  return (
    <>
      <PageTitle title="Reportes" description={`Ventas en tienda y en línea, clientes y lo más vendido · ${rangeText}`} />

      <nav className="flex flex-wrap gap-2" aria-label="Periodo">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/admin/reportes?periodo=${p.value}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              period === p.value ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      {/* Indicadores principales */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2 p-6">
          <p className="text-sm font-medium text-muted">Ventas totales</p>
          <p className="font-display text-3xl font-bold text-navy">{formatPrice(all.revenue)}</p>
          <p className="text-sm text-muted">
            {all.orders} {all.orders === 1 ? "venta" : "ventas"} · {all.units} piezas
          </p>
          <div className="space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-surface" aria-hidden>
              {r.collection.collected > 0 && <span className="bg-ok" style={{ width: `${pct(r.collection.collected, all.revenue)}%` }} />}
              {r.collection.pending > 0 && <span className="flex-1 bg-accent" />}
            </div>
            <p className="flex justify-between">
              <span className="text-muted">Cobrado</span> <b className="text-ok">{formatPrice(r.collection.collected)}</b>
            </p>
            <p className="flex justify-between">
              <Link href="/admin/pedidos?pago=sin_pagar" className="text-muted hover:text-brand">
                Por cobrar ({r.collection.pendingOrders})
              </Link>
              <b className="text-[#8a5a00]">{formatPrice(r.collection.pending)}</b>
            </p>
          </div>
          {delta !== null && (
            <p className={cn("flex items-center gap-1 text-sm font-semibold", delta >= 0 ? "text-ok" : "text-danger")}>
              {delta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {delta >= 0 ? "+" : ""}
              {delta}% vs. periodo anterior
            </p>
          )}
        </Card>
        {(
          [
            ["en_linea", online, ShoppingBag],
            ["tienda", store, Store],
          ] as const
        ).map(([ch, t, Icon]) => (
          <Card key={ch} className="space-y-2 p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <Icon className="size-4" style={{ color: CHANNEL_COLOR[ch] }} /> Ventas {CHANNEL_LABEL[ch].toLowerCase()}
            </p>
            <p className="font-display text-3xl font-bold text-navy">{formatPrice(t.revenue)}</p>
            <p className="text-sm text-muted">
              {t.orders} {t.orders === 1 ? "venta" : "ventas"} · ticket promedio {formatPrice(t.avgTicket)}
            </p>
            <p className="text-sm font-semibold text-navy">{pct(t.revenue, all.revenue)}% del total</p>
          </Card>
        ))}
        <Card className="space-y-2 p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Users className="size-4 text-brand" /> Clientes que compraron
          </p>
          <p className="font-display text-3xl font-bold text-navy">{r.customers.active}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <UserPlus className="size-4" /> {r.customers.newOnes} nuevos
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Repeat className="size-4" /> {r.customers.returning} ya habían comprado
          </p>
        </Card>
      </div>

      {/* Ventas en el tiempo */}
      <Card className="overflow-hidden">
        <SectionTitle>Ventas por {r.bucket === "month" ? "mes" : "día"}</SectionTitle>
        <div className="p-6">
          {all.revenue === 0 ? <p className="py-10 text-center text-muted">No hay ventas en este periodo.</p> : <SalesChart data={r.series} />}
        </div>
        {all.revenue > 0 && (
          <div className="border-t border-line px-6 py-4">
            <p className="mb-2 text-sm font-medium text-muted">Participación por canal</p>
            <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`En línea ${pct(online.revenue, all.revenue)}%, en tienda ${pct(store.revenue, all.revenue)}%`}>
              {online.revenue > 0 && <span style={{ width: `${pct(online.revenue, all.revenue)}%`, background: CHANNEL_COLOR.en_linea }} />}
              {store.revenue > 0 && <span className="flex-1" style={{ background: CHANNEL_COLOR.tienda }} />}
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>
                En línea <b>{pct(online.revenue, all.revenue)}%</b>
              </span>
              <span>
                En tienda <b>{100 - pct(online.revenue, all.revenue)}%</b>
              </span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Lo más vendido */}
        <Card className="overflow-hidden">
          <SectionTitle aside={<span className="text-sm text-muted">Por piezas vendidas</span>}>Lo más vendido</SectionTitle>
          {r.topProducts.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">Sin ventas en este periodo.</p>
          ) : (
            <ol className="divide-y divide-line">
              {r.topProducts.map((p, i) => (
                <li key={p.productId ?? p.name} className="grid grid-cols-[28px_1fr_auto] items-center gap-4 px-6 py-3">
                  <span className="font-display text-lg font-bold text-dim">{i + 1}</span>
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate">
                      <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-brand">{p.brand}</span>
                      {p.productId ? (
                        <Link href={`/admin/productos/${p.productId}`} className="font-medium hover:text-brand">
                          {p.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{p.name}</span>
                      )}
                    </p>
                    <div className="flex h-2 gap-[2px]" title={`En línea: ${p.online} · En tienda: ${p.store}`}>
                      {p.online > 0 && <span className="rounded-l-[4px]" style={{ width: `${(p.online / maxUnits) * 100}%`, background: CHANNEL_COLOR.en_linea }} />}
                      {p.store > 0 && <span className="rounded-r-[4px]" style={{ width: `${(p.store / maxUnits) * 100}%`, background: CHANNEL_COLOR.tienda }} />}
                    </div>
                    <p className="text-xs text-dim">
                      {p.online} en línea · {p.store} en tienda
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{p.units} pzas</p>
                    <p className="text-sm text-muted">{formatPrice(p.revenue)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Categorías */}
        <Card className="h-fit overflow-hidden">
          <SectionTitle>Ventas por categoría</SectionTitle>
          {r.categories.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">Sin ventas en este periodo.</p>
          ) : (
            <ul className="space-y-4 p-6">
              {r.categories.map((c) => (
                <li key={c.name} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular-nums">
                      <b>{formatPrice(c.revenue)}</b> <span className="text-dim">· {c.units} pzas</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-r-[4px] bg-brand" style={{ width: `${(c.revenue / maxCat) * 100}%` }} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Clientes */}
        <Card className="overflow-x-auto">
          <SectionTitle aside={<span className="text-sm text-muted">Identificados por teléfono</span>}>Mejores clientes</SectionTitle>
          {r.customers.top.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">Sin clientes en este periodo.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left">
              <thead className="text-sm text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Canal</th>
                  <th className="px-6 py-3 text-right font-medium">Compras</th>
                  <th className="px-6 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {r.customers.top.map((c) => (
                  <tr key={c.phone}>
                    <td className="px-6 py-3">
                      <Link href={`/admin/pedidos?q=${c.phone}`} className="block font-medium hover:text-brand">
                        {c.name}
                      </Link>
                      <span className="text-xs text-dim">
                        {c.phone} · última compra {formatDate(c.lastOrder)}
                      </span>
                    </td>
                    <td className="space-y-1 px-6 py-3">
                      {c.channels.map((ch) => (
                        <ChannelPill key={ch} channel={ch} />
                      ))}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">{c.orders}</td>
                    <td className="px-6 py-3 text-right font-semibold tabular-nums">{formatPrice(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-6">
          {/* Pedidos en línea */}
          <Card className="overflow-hidden">
            <SectionTitle aside={<span className="text-sm text-muted">{onlineOrders} pedidos</span>}>Pedidos en línea</SectionTitle>
            <ul className="divide-y divide-line">
              {[...STATUS_FLOW, "cancelado" as const].map((s) => (
                <li key={s} className="flex items-center justify-between px-6 py-2.5 text-[15px]">
                  <span className={s === "cancelado" ? "text-danger" : ""}>{statusLabel(s)}</span>
                  <Link href={`/admin/pedidos?canal=en_linea&estado=${s}`} className="font-semibold tabular-nums hover:text-brand">
                    {r.onlineStatus[s]}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-line px-6 py-4 text-sm text-muted">
              <p>
                Recoger en sucursal: <b className="text-ink">{r.onlineDelivery.recoger}</b> · Envío: <b className="text-ink">{r.onlineDelivery.envio}</b>
              </p>
              {r.cancelled.orders > 0 && (
                <p>
                  Cancelado: <b className="text-danger">{formatPrice(r.cancelled.amount)}</b> en {r.cancelled.orders} {r.cancelled.orders === 1 ? "pedido" : "pedidos"}
                </p>
              )}
            </div>
          </Card>

          {/* Formas de pago */}
          <Card className="overflow-hidden">
            <SectionTitle>Cobros en tienda</SectionTitle>
            {r.payments.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted">Sin ventas de mostrador en este periodo.</p>
            ) : (
              <ul className="divide-y divide-line">
                {r.payments.map((p) => (
                  <li key={p.method} className="flex items-center justify-between px-6 py-2.5 text-[15px]">
                    <span>
                      {p.method === "sin_dato" ? "Sin dato" : PAYMENT_LABEL[p.method]} <span className="text-sm text-dim">· {p.orders}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatPrice(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
