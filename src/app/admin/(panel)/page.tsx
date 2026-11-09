import Link from "next/link";
import { AlertTriangle, BarChart3, Clock, Package, Plus, ShoppingBag, Store } from "lucide-react";
import { countOrdersByStatus, countPaymentsToConfirm, listAllProducts, listOrders, listOrdersSince } from "@/lib/admin-data";
import { dayKey } from "@/lib/reports";
import { isLowStock } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { products as sampleProducts } from "@/lib/data/products";
import { ButtonLink, Card, CHANNEL_COLOR, ChannelPill, PageTitle, StatusPill, StockPill } from "@/components/admin/ui";
import { StockEditor } from "@/components/admin/StockEditor";
import { ImportSampleButton } from "@/components/admin/ImportSampleButton";

export const metadata = { title: "Resumen" };

export default async function DashboardPage() {
  // Desde 35 días atrás alcanza para cubrir "este mes" en cualquier zona horaria
  const since = new Date(Date.now() - 35 * 86400000).toISOString();
  const [products, orderCounts, recentOrders, monthOrders, toConfirm] = await Promise.all([
    listAllProducts(),
    countOrdersByStatus(),
    listOrders({}, 6),
    listOrdersSince(since),
    countPaymentsToConfirm(),
  ]);
  const today = dayKey(new Date());
  const sold = monthOrders.filter((o) => o.status !== "cancelado");
  const sumBy = (prefix: string) => {
    const rows = sold.filter((o) => dayKey(o.createdAt).startsWith(prefix));
    const by = (ch: "en_linea" | "tienda") => rows.filter((o) => o.channel === ch).reduce((n, o) => n + o.total, 0);
    return { total: by("en_linea") + by("tienda"), en_linea: by("en_linea"), tienda: by("tienda"), count: rows.length };
  };
  const salesStrip = [
    { label: "Ventas de hoy", ...sumBy(today) },
    { label: "Ventas del mes", ...sumBy(today.slice(0, 8)) },
  ];
  const active = products.filter((p) => p.active);
  const lowStock = active.filter(isLowStock).sort((a, b) => a.stock - b.stock);

  const stats = [
    { label: "Productos en tienda", value: active.length, Icon: Package, attention: false },
    { label: "Pagos por confirmar", value: toConfirm, Icon: Clock, href: "/admin/pedidos?pago=por_confirmar", warn: false, attention: toConfirm > 0 },
    { label: "Pedidos nuevos", value: orderCounts.nuevo, Icon: ShoppingBag, href: "/admin/pedidos?estado=nuevo", attention: false },
    { label: "Con poco stock", value: lowStock.length, Icon: AlertTriangle, href: "/admin/productos?filtro=bajo", warn: lowStock.length > 0, attention: false },
  ];

  return (
    <>
      <PageTitle
        title="Resumen"
        description="Así va tu tienda hoy."
        action={
          <span className="flex flex-wrap gap-3">
            <ButtonLink href="/admin/ventas/nueva" variant="ghost">
              <Store className="size-5" /> Venta en mostrador
            </ButtonLink>
            <ButtonLink href="/admin/productos/nuevo">
              <Plus className="size-5" /> Nuevo producto
            </ButtonLink>
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        {salesStrip.map((s) => (
          <Card key={s.label} className="space-y-3 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-muted">{s.label}</span>
              <span className="text-sm text-dim">
                {s.count} {s.count === 1 ? "venta" : "ventas"}
              </span>
            </div>
            <p className="font-display text-3xl font-bold text-navy">{formatPrice(s.total)}</p>
            <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-surface">
              {s.en_linea > 0 && <span style={{ width: `${(s.en_linea / s.total) * 100}%`, background: CHANNEL_COLOR.en_linea }} />}
              {s.tienda > 0 && <span className="flex-1" style={{ background: CHANNEL_COLOR.tienda }} />}
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <ChannelPill channel="en_linea" /> <b>{formatPrice(s.en_linea)}</b>
              </span>
              <span className="flex items-center gap-2">
                <ChannelPill channel="tienda" /> <b>{formatPrice(s.tienda)}</b>
              </span>
            </div>
          </Card>
        ))}
        <Link
          href="/admin/reportes"
          className="flex items-center justify-center gap-2 rounded-3xl border border-line bg-white px-8 py-6 font-semibold text-brand hover:border-brand"
        >
          <BarChart3 className="size-5" /> Ver reportes
        </Link>
      </div>

      {products.length === 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-5 border-accent bg-accent/10 p-6">
          <div>
            <h2 className="text-lg font-bold text-navy">Tu catálogo está vacío</h2>
            <p className="text-muted">Puedes empezar con las herramientas que ya habíamos cargado y luego ajustar precios, stock y fotos.</p>
          </div>
          <ImportSampleButton count={sampleProducts.length} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon, href, warn, attention }) => {
          const body = (
            <Card className={`flex items-center gap-4 p-6 ${href ? "transition hover:border-brand" : ""}`}>
              <span className={`grid size-12 place-items-center rounded-2xl ${warn ? "bg-danger-soft text-danger" : attention ? "bg-accent/25 text-[#8a5a00]" : "bg-brand-soft text-brand"}`}>
                <Icon className="size-6" />
              </span>
              <span>
                <span className="block font-display text-3xl font-bold text-navy">{value}</span>
                <span className="text-sm text-muted">{label}</span>
              </span>
            </Card>
          );
          return href ? (
            <Link key={label} href={href}>
              {body}
            </Link>
          ) : (
            <div key={label}>{body}</div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <AlertTriangle className="size-5 text-danger" /> Se están acabando
            </h2>
            <Link href="/admin/productos?filtro=bajo" className="text-sm font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">Todo el inventario está bien surtido.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <Link href={`/admin/productos/${p.id}`} className="min-w-0 hover:text-brand">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{p.brand}</span>
                    <span className="block truncate font-medium">{p.name}</span>
                  </Link>
                  <span className="flex items-center gap-3">
                    <StockPill stock={p.stock} threshold={p.lowStockThreshold} />
                    <StockEditor key={p.stock} productId={p.id} stock={p.stock} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <ShoppingBag className="size-5 text-brand" /> Pedidos recientes
            </h2>
            <Link href="/admin/pedidos" className="text-sm font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">Todavía no hay pedidos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-surface">
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        #{o.id} · {o.customerName}
                      </span>
                      <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{formatPrice(o.total)}</span>
                      <StatusPill status={o.status} delivery={o.delivery} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
