import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Disc3 } from "lucide-react";
import type { Product } from "@/types";
import { Container } from "@/components/layout/Container";
import { discountPercent, formatPrice } from "@/lib/format";

export function Hero({ deal, productCount }: { deal?: Product; productCount: number }) {
  const stats = [
    { value: String(productCount), label: "productos en catálogo" },
    { value: "4.8 ★", label: "calificación promedio" },
    { value: "12%", label: "ahorro en mayoreo" },
  ];

  return (
    <Container className="pt-12">
      <section className="grid items-center gap-16 overflow-hidden rounded-[36px] bg-gradient-to-r from-navy to-navy-2 px-8 py-16 lg:grid-cols-[1.1fr_1fr] lg:px-20 lg:py-20">
        <div className="space-y-8">
          <span className="inline-flex rounded-full bg-accent/15 px-4 py-2 text-sm font-semibold text-accent">
            Nuevo en tienda · Generadores 6,500 W
          </span>
          <h1 className="max-w-[720px] font-display text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-[72px]">
            La herramienta que tu obra necesita, lista para salir hoy.
          </h1>
          <p className="max-w-[640px] text-xl leading-8 text-[#c9d3ee]">
            Generadores, rotomartillos, demoledores, hidrolavadoras, desbrozadoras y más de Honda, DeWalt, Makita, Hilti, Bosch y Stihl. Precios con IVA incluido,
            facturación inmediata y descuentos por mayoreo.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/catalogo"
              className="flex items-center gap-2.5 rounded-2xl bg-accent px-8 py-5 text-[17px] font-bold text-navy hover:brightness-95"
            >
              Ver catálogo <ArrowRight className="size-5" />
            </Link>
            <Link
              href="#mayoreo"
              className="rounded-2xl border border-white/35 px-8 py-5 text-[17px] font-semibold text-white hover:bg-white/10"
            >
              Cotizar mayoreo
            </Link>
          </div>
          <dl className="flex flex-wrap gap-14 pt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-4xl font-bold text-white">{s.value}</dd>
                <dd className="mt-1 text-[15px] text-[#a9b6da]">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative aspect-[32/27] overflow-hidden rounded-[28px] bg-[#2b2b2b]">
          <Image
            src="/hero-herramientas.png"
            alt="Hidrolavadora y generador Honda, rotomartillo Makita y demoledor Hilti"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          {deal && (
            <Link
              href={`/producto/${deal.slug}`}
              className="absolute inset-x-7 bottom-7 flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,51,0.16)] sm:right-auto"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Disc3 className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#c2410c]">
                  Oferta del día · -{discountPercent(deal)}%
                </span>
                <span className="block truncate font-semibold">{deal.name}</span>
              </span>
              <span className="text-right">
                <span className="block font-display text-2xl font-bold text-navy">{formatPrice(deal.price)}</span>
                {deal.compareAtPrice && <span className="text-[13px] text-dim line-through">{formatPrice(deal.compareAtPrice)}</span>}
              </span>
            </Link>
          )}
        </div>
      </section>
    </Container>
  );
}
