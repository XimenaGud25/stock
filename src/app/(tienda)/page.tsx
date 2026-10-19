import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories, getDealOfTheDay, getFeaturedProducts, getBrands } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { Hero } from "@/components/home/Hero";
import { Benefits } from "@/components/home/Benefits";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { WholesaleBanner } from "@/components/home/WholesaleBanner";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductCard";

export default async function HomePage() {
  const [categories, featured, deal, brands] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getDealOfTheDay(),
    getBrands(),
  ]);

  const chips = [
    { label: "Todos", href: "/catalogo" },
    { label: "Ofertas", href: "/ofertas" },
    { label: "Más vendidos", href: "/catalogo?orden=relevancia" },
    { label: "Nuevos", href: "/catalogo?orden=nuevos" },
    ...brands.slice(0, 5).map((b) => ({ label: b, href: `/catalogo?marca=${encodeURIComponent(b)}` })),
  ];

  return (
    <>
      <Hero deal={deal?.product} productCount={categories.reduce((n, c) => n + c.productCount, 0)} />
      <Benefits />

      <Container className="space-y-9 pt-28">
        <SectionHeading eyebrow="CATEGORÍAS" title="Explora por tipo de herramienta" link={{ href: "/catalogo", label: "Ver todas" }} />
        <CategoryGrid categories={categories} />
      </Container>

      <Container className="space-y-9 pt-28">
        <SectionHeading eyebrow="CATÁLOGO" title="Herramienta destacada" description="Precios con IVA incluido" />
        <div className="flex flex-wrap gap-3">
          {chips.map((c, i) => (
            <Link
              key={c.label}
              href={c.href}
              className={`rounded-full px-5 py-3 text-[15px] font-medium ${
                i === 0 ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <ProductGrid products={featured} />
        <div className="flex justify-center pt-3">
          <Link
            href="/catalogo"
            className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-8 py-4 text-[17px] font-semibold text-navy hover:border-navy"
          >
            Ver todo el catálogo <ArrowRight className="size-5" />
          </Link>
        </div>
      </Container>

      <WholesaleBanner />
    </>
  );
}
