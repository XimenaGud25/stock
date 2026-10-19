import Link from "next/link";
import { AlertTriangle, Boxes, Package, Plus, ShoppingBag } from "lucide-react";
import { countOrdersByStatus, listAllProducts, listOrders } from "@/lib/admin-data";
import { isLowStock } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { products as sampleProducts } from "@/lib/data/products";
import { ButtonLink, Card, PageTitle, StatusPill, StockPill } from "@/components/admin/ui";
import { StockEditor } from "@/components/admin/StockEditor";
import { ImportSampleButton } from "@/components/admin/ImportSampleButton";

export const metadata = { title: "Resumen" };

export default async function DashboardPage() {
  const [products, orderCounts, recentOrders] = await Promise.all([listAllProducts(), countOrdersByStatus(), listOrders(undefined, 6)]);
  const active = products.filter((p) => p.active);
  const lowStock = active.filter(isLowStock).sort((a, b) => a.stock - b.stock);
  const units = active.reduce((n, p) => n + p.stock, 0);

  const stats = [
    { label: "Productos en tienda", value: active.length, Icon: Package },
    { label: "Piezas en stock", value: units.toLocaleString("es-MX"), Icon: Boxes },
    { label: "Pedidos nuevos", value: orderCounts.nuevo, Icon: ShoppingBag, href: "/admin/pedidos?estado=nuevo" },
    { label: "Con poco stock", value: lowStock.length, Icon: AlertTriangle, href: "/admin/productos?filtro=bajo", warn: lowStock.length > 0 },
  ];

  return (
    <>
      <PageTitle
        title="Resumen"
        description="Así va tu tienda hoy."
        action={
          <ButtonLink href="/admin/productos/nuevo">
            <Plus className="size-5" /> Nuevo producto
          </ButtonLink>
        }
      />

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
        {stats.map(({ label, value, Icon, href, warn }) => {
          const body = (
            <Card className={`flex items-center gap-4 p-6 ${href ? "transition hover:border-brand" : ""}`}>
              <span className={`grid size-12 place-items-center rounded-2xl ${warn ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand"}`}>
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
                      <StatusPill status={o.status} />
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
