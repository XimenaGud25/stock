import Link from "next/link";
import { Flame } from "lucide-react";
import { getDealSettings, listAllProducts } from "@/lib/admin-data";
import { getCategories } from "@/lib/api";
import { cn, discountPercent, formatDate, formatPrice } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import { DealForm } from "@/components/admin/DealForm";
import { PriceEditor } from "@/components/admin/PriceEditor";

export const metadata = { title: "Ofertas" };

/** ISO → "YYYY-MM-DDTHH:mm" en hora de la Ciudad de México (para <input type="datetime-local">). */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function OffersAdminPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const [products, deal, categories] = await Promise.all([listAllProducts(), getDealSettings(), getCategories()]);
  const active = products.filter((p) => p.active);
  const onSale = active.filter((p) => discountPercent(p) > 0);
  const list = ver === "todos" ? active : onSale;
  const dealProduct = active.find((p) => p.id === deal.productId);
  const expired = deal.endsAt ? new Date(deal.endsAt) < new Date() : false;

  return (
    <>
      <PageTitle
        title="Ofertas"
        description="Pon un precio anterior más alto que el actual y el producto aparece en /ofertas con su % de descuento."
      />

      <Card className="space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <Flame className="size-5 text-danger" /> Oferta del día
        </h2>
        {dealProduct && (
          <p className={cn("text-sm", expired ? "text-danger" : "text-muted")}>
            {expired ? "Terminó el " : "Activa hasta el "}
            {formatDate(deal.endsAt!)} · {dealProduct.brand} {dealProduct.name}
            {expired && " — elige una nueva fecha para volver a mostrarla."}
          </p>
        )}
        <DealForm
          products={active.map((p) => ({ id: p.id, label: `${p.brand} · ${p.name} — ${formatPrice(p.price)}` }))}
          productId={deal.productId}
          endsAt={toLocalInput(deal.endsAt)}
        />
      </Card>

      <div className="flex gap-2">
        {[
          { value: undefined, label: `En oferta (${onSale.length})` },
          { value: "todos", label: `Todos los productos (${active.length})` },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.value ? `/admin/ofertas?ver=${t.value}` : "/admin/ofertas"}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              ver === t.value ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card className="divide-y divide-line">
        {list.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-[220px]">
              <span className="block text-xs font-semibold uppercase tracking-wider text-brand">
                {p.brand} · {categories.find((c) => c.id === p.categoryId)?.name}
              </span>
              <Link href={`/admin/productos/${p.id}`} className="font-medium hover:text-brand">
                {p.name}
              </Link>
            </div>
            <PriceEditor key={`${p.price}-${p.compareAtPrice}`} productId={p.id} price={p.price} compareAtPrice={p.compareAtPrice} />
          </div>
        ))}
        {list.length === 0 && (
          <p className="px-6 py-12 text-center text-muted">
            No hay productos en oferta.{" "}
            <Link href="/admin/ofertas?ver=todos" className="font-semibold text-brand hover:underline">
              Ver todos para crear una
            </Link>
          </p>
        )}
      </Card>
    </>
  );
}
