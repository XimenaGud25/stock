import type { Metadata } from "next";
import { Suspense } from "react";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import { parseFilters, type SearchParams } from "@/lib/filters";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ActiveFilters } from "@/components/catalog/ActiveFilters";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [result, categories, brands] = await Promise.all([getProducts(filters), getCategories(), getBrands()]);
  const category = categories.find((c) => c.slug === filters.category);

  return (
    <Container className="pb-28">
      <div className="space-y-6 pb-8 pt-10">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Catálogo", href: category ? "/catalogo" : undefined },
            ...(category ? [{ label: category.name }] : []),
          ]}
        />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2.5">
            <h1 className="font-display text-5xl font-bold tracking-tight text-navy lg:text-[52px]">
              {category ? category.name : "Catálogo de herramienta"}
            </h1>
            <p className="text-lg text-muted">{result.total} productos · Envío 24/48 h a obra · Facturación inmediata</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <form action="/catalogo">
              <label className="flex h-14 w-[340px] max-w-full items-center gap-3 rounded-2xl border border-line bg-white px-5 focus-within:border-brand">
                <Search className="size-5 text-dim" />
                <input
                  name="q"
                  type="search"
                  defaultValue={filters.q}
                  placeholder="Buscar taladro, sierra, marca…"
                  className="w-full bg-transparent outline-none placeholder:text-dim"
                />
              </label>
            </form>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[340px_1fr]">
        <Suspense>
          {/* key: reinicia los campos de precio cuando se quitan desde los chips */}
          <CatalogFilters key={`${sp.min ?? ""}-${sp.max ?? ""}`} categories={categories} brands={brands} />
        </Suspense>

        <div className="space-y-7">
          <ActiveFilters filters={filters} categories={categories} searchParams={sp} />
          {result.items.length ? (
            <ProductGrid products={result.items} columns={3} />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-8 py-20 text-center">
              <SearchX className="size-12 text-dim" />
              <p className="text-xl font-semibold">No encontramos productos con esos filtros</p>
              <Link href="/catalogo" className="font-semibold text-brand hover:underline">
                Ver todo el catálogo
              </Link>
            </div>
          )}
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            searchParams={sp}
          />
        </div>
      </div>
    </Container>
  );
}
