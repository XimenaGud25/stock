import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatteryFull, ChevronLeft, Package, Plug, Wrench } from "lucide-react";
import { getCategories, getProductBySlug, getRelatedProducts } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StarRating, StockStatus } from "@/components/ui/StarRating";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductGrid } from "@/components/product/ProductCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.description } : { title: "Producto no encontrado" };
}

/** Ícono para cada renglón de "¿Qué incluye?" según el texto. */
function includeIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("bater")) return BatteryFull;
  if (t.includes("cargador")) return Plug;
  if (t.includes("maletín") || t.includes("estuche") || t.includes("funda")) return Package;
  return Wrench;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([getCategories(), getRelatedProducts(product)]);
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <>
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 pt-9">
          <Breadcrumbs
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo", href: "/catalogo" },
              ...(category ? [{ label: category.name, href: `/catalogo?categoria=${category.slug}` }] : []),
              { label: product.name },
            ]}
          />
          <Link href="/catalogo" className="flex items-center gap-2 text-[15px] font-semibold text-brand hover:underline">
            <ChevronLeft className="size-4" /> Volver al catálogo
          </Link>
        </div>

        <div className="grid gap-16 lg:grid-cols-[minmax(0,760px)_1fr] lg:gap-20">
          {/* Izquierda: imagen mediana + 3 miniaturas */}
          <ProductGallery product={product} />

          {/* Derecha: información, qué incluye y compra */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-brand">
                  {product.brand}
                </span>
                <span className="text-sm text-dim">SKU: {product.sku}</span>
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-navy lg:text-5xl">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <StarRating rating={product.rating} count={product.reviewCount} full />
                <StockStatus stock={product.stock} showCount />
              </div>
            </div>

            <ProductPurchase product={product} />

            <section className="space-y-3.5">
              <h2 className="text-[22px] font-bold text-navy">Descripción</h2>
              <p className="text-[17px] leading-7 text-muted">{product.description}</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[22px] font-bold text-navy">¿Qué incluye?</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {product.includes.map((item) => {
                  const Icon = includeIcon(item);
                  return (
                    <li key={item} className="flex items-center gap-3.5 rounded-2xl border border-line bg-white px-4.5 py-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ok-soft text-ok">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-[15px] font-medium">{item}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </Container>

      <Container className="space-y-7 pt-24">
        <h2 className="font-display text-4xl font-bold text-navy">Especificaciones técnicas</h2>
        <dl className="grid overflow-hidden rounded-3xl border border-line bg-white md:grid-cols-2">
          {product.specs.map((s, i) => (
            <div key={s.label} className={`flex justify-between gap-6 px-8 py-5 ${Math.floor(i / 2) % 2 ? "bg-surface" : ""}`}>
              <dt className="font-medium text-muted">{s.label}</dt>
              <dd className="text-right font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {related.length > 0 && (
        <Container className="space-y-9 py-28">
          <SectionHeading eyebrow="TE PUEDE INTERESAR" title="Productos relacionados" link={{ href: "/catalogo", label: "Ver catálogo" }} />
          <ProductGrid products={related} />
        </Container>
      )}
    </>
  );
}
