import Link from "next/link";
import { X } from "lucide-react";
import type { Category, ProductFilters } from "@/types";
import { buildQuery, type SearchParams } from "@/lib/filters";
import { formatPrice } from "@/lib/format";

/** Chips con los filtros aplicados; cada uno tiene su "x" para quitarlo. */
export function ActiveFilters({ filters, categories, searchParams }: { filters: ProductFilters; categories: Category[]; searchParams: SearchParams }) {
  const chips: { label: string; href: string }[] = [];
  const url = (changes: Record<string, string | undefined>) => `/catalogo${buildQuery(searchParams, changes)}`;

  if (filters.q) chips.push({ label: `“${filters.q}”`, href: url({ q: undefined }) });
  if (filters.category) {
    const c = categories.find((x) => x.slug === filters.category);
    chips.push({ label: c?.name ?? filters.category, href: url({ categoria: undefined }) });
  }
  filters.brands?.forEach((b) => {
    const rest = filters.brands!.filter((x) => x !== b).join(",");
    chips.push({ label: b, href: url({ marca: rest || undefined }) });
  });
  if (filters.minPrice !== undefined) chips.push({ label: `Desde ${formatPrice(filters.minPrice)}`, href: url({ min: undefined }) });
  if (filters.maxPrice !== undefined) chips.push({ label: `Hasta ${formatPrice(filters.maxPrice)}`, href: url({ max: undefined }) });
  if (filters.inStock) chips.push({ label: "En stock", href: url({ stock: undefined }) });
  if (filters.onSale) chips.push({ label: "Con descuento", href: url({ oferta: undefined }) });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-[15px] font-medium text-muted">Filtros:</span>
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          scroll={false}
          className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium hover:border-danger hover:text-danger"
        >
          {c.label} <X className="size-3.5" />
        </Link>
      ))}
      <Link href="/catalogo" className="text-sm font-semibold text-brand underline">
        Limpiar todo
      </Link>
    </div>
  );
}
