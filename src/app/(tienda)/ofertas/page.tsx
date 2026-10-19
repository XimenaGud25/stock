import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Clock, Flame } from "lucide-react";
import { getCategories, getDealOfTheDay, getProducts } from "@/lib/api";
import { buildQuery, parseFilters, type SearchParams } from "@/lib/filters";
import { Container } from "@/components/layout/Container";
import { Countdown } from "@/components/offers/Countdown";
import { DealOfTheDay } from "@/components/offers/DealOfTheDay";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductCard";
import { WholesaleBanner } from "@/components/home/WholesaleBanner";

export const metadata: Metadata = { title: "Ofertas" };

export default async function OffersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const parsed = parseFilters(sp);
  const filters = {
    ...parsed,
    onSale: true,
    sort: sp.orden ? parsed.sort : ("descuento" as const),
    pageSize: 8,
  };

  const [deal, offers, categories] = await Promise.all([getDealOfTheDay(), getProducts(filters), getCategories()]);

  const tabs = [
    { label: "Todas las ofertas", slug: undefined },
    ...categories.map((c) => ({ label: c.name, slug: c.slug })),
  ];

  return (
    <>
      <Container className="pt-10">
        <section className="flex flex-wrap items-center justify-between gap-12 rounded-[36px] bg-gradient-to-r from-navy to-navy-2 px-10 py-16 lg:px-20">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold tracking-[0.1em] text-navy">
              <Flame className="size-4" /> OFERTAS DE LA SEMANA
            </span>
            <h1 className="max-w-[820px] font-display text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-[60px]">
              Hasta 30% de descuento en herramienta profesional
            </h1>
            <p className="max-w-[640px] text-lg leading-8 text-[#c9d3ee]">
              Precios con IVA incluido. Existencias limitadas: cuando se agoten, la oferta termina.
            </p>
          </div>
          {deal && (
            <div className="flex flex-col items-center gap-4">
              <span className="flex items-center gap-2 font-medium text-[#c9d3ee]">
                <Clock className="size-5" /> Terminan en
              </span>
              <Countdown endsAt={deal.endsAt} />
            </div>
          )}
        </section>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-4 pt-10">
        <div className="flex flex-wrap gap-3">
          {tabs.map((t) => {
            const active = (parsed.category ?? undefined) === t.slug;
            return (
              <Link
                key={t.label}
                href={`/ofertas${buildQuery(sp, { categoria: t.slug })}`}
                scroll={false}
                className={`rounded-full px-5 py-3 text-[15px] font-medium ${
                  active ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <Suspense>
          <SortSelect basePath="/ofertas" />
        </Suspense>
      </Container>

      {deal && !parsed.category && (
        <Container className="pt-10">
          <DealOfTheDay product={deal.product} />
        </Container>
      )}

      <Container className="space-y-9 pt-24">
        <SectionHeading
          eyebrow="DESCUENTOS"
          title="Más herramienta en oferta"
          description={`${offers.total} productos con descuento esta semana`}
        />
        {offers.items.length ? (
          <ProductGrid products={offers.items} showDiscount />
        ) : (
          <p className="rounded-3xl border border-line bg-white px-8 py-16 text-center text-lg text-muted">
            No hay ofertas en esta categoría por ahora.
          </p>
        )}
        <Pagination
          page={offers.page}
          totalPages={offers.totalPages}
          total={offers.total}
          pageSize={offers.pageSize}
          searchParams={sp}
          basePath="/ofertas"
        />
      </Container>

      <WholesaleBanner />
    </>
  );
}
