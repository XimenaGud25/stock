import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import type { Product } from "@/types";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";
import { StarRating, StockStatus } from "@/components/ui/StarRating";
import { discountPercent, formatPrice } from "@/lib/format";

/** Tarjeta de producto. showDiscount = muestra la etiqueta roja con el % (pantalla de Ofertas). */
export function ProductCard({ product, showDiscount = false }: { product: Product; showDiscount?: boolean }) {
  const href = `/producto/${product.slug}`;
  const pct = discountPercent(product);
  const label = showDiscount && pct ? `-${pct}%` : product.badge;
  const red = showDiscount && pct > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_8px_24px_rgba(15,23,51,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,51,0.10)]">
      <div className="relative">
        <Link href={href} aria-label={product.name}>
          <ProductImage product={product} className="aspect-[5/4] w-full" iconClassName="size-32" sizes="(min-width:1280px) 25vw, 50vw" />
        </Link>
        {label && (
          <span className={`absolute left-5 top-5 rounded-full px-3.5 py-1.5 text-[13px] font-bold ${red ? "bg-danger text-white" : "bg-accent text-navy"}`}>
            {label}
          </span>
        )}
        <button
          type="button"
          aria-label="Agregar a favoritos"
          className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white shadow-md hover:text-danger"
        >
          <Heart className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-7">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-brand">
          {product.brand} · {product.highlight}
        </p>
        <Link href={href} className="text-xl font-semibold leading-7 hover:text-brand">
          {product.name}
        </Link>
        <div className="flex items-center gap-3">
          <StarRating rating={product.rating} count={product.reviewCount} />
          <StockStatus stock={product.stock} />
        </div>
        <div className="mt-auto">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[32px] font-bold text-navy">{formatPrice(product.price)}</span>
            {product.compareAtPrice && <span className="text-base text-dim line-through">{formatPrice(product.compareAtPrice)}</span>}
          </div>
          <p className="text-[13px] text-dim">IVA incluido</p>
        </div>
        <div className="flex gap-3">
          <AddToCartButton product={product} className="h-[54px] flex-1" />
          <Link
            href={href}
            aria-label="Ver detalle"
            className="grid size-[54px] shrink-0 place-items-center rounded-2xl border border-line hover:bg-surface"
          >
            <Eye className="size-5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, columns = 4, showDiscount }: { products: Product[]; columns?: 3 | 4; showDiscount?: boolean }) {
  return (
    <div className={`grid gap-8 sm:grid-cols-2 ${columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} showDiscount={showDiscount} />
      ))}
    </div>
  );
}
