import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import type { Product } from "@/types";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { StarRating } from "@/components/ui/StarRating";
import { discountPercent, formatPrice, savings } from "@/lib/format";

/** Tarjeta grande de la "Oferta del día" con barra de piezas vendidas. */
export function DealOfTheDay({ product, soldPercent = 68 }: { product: Product; soldPercent?: number }) {
  const pct = discountPercent(product);
  const href = `/producto/${product.slug}`;

  return (
    <article className="grid overflow-hidden rounded-[32px] border border-line bg-white lg:grid-cols-[720px_1fr]">
      <Link href={href} className="relative block">
        <ProductImage product={product} className="aspect-[36/23] h-full w-full" iconClassName="size-56 text-navy" />
        <span className="absolute left-8 top-8 flex items-center gap-2 rounded-full bg-danger px-4.5 py-2.5 text-sm font-bold text-white">
          <Flame className="size-4" /> OFERTA DEL DÍA · -{pct}%
        </span>
      </Link>

      <div className="flex flex-col justify-center gap-6 p-10 lg:px-16 lg:py-14">
        <span className="w-fit rounded-lg bg-brand-soft px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
          {product.brand} · {product.highlight}
        </span>
        <Link href={href} className="font-display text-4xl font-bold leading-tight text-navy hover:text-brand lg:text-[44px]">
          {product.name}
        </Link>
        <StarRating rating={product.rating} count={product.reviewCount} full />
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-display text-[52px] font-bold leading-none text-navy">{formatPrice(product.price)}</span>
          {product.compareAtPrice && <span className="text-2xl text-dim line-through">{formatPrice(product.compareAtPrice)}</span>}
          <span className="rounded-full bg-danger-soft px-3 py-1.5 text-[15px] font-bold text-danger">Ahorras {formatPrice(savings(product))}</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between text-[15px] font-semibold">
            <span>Vendidos: {soldPercent}%</span>
            <span className="text-danger">Quedan {product.stock} piezas</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-danger" style={{ width: `${soldPercent}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <AddToCartButton product={product} className="h-[60px] px-8 text-[17px] font-bold" />
          <Link
            href={href}
            className="flex h-[60px] items-center gap-2.5 rounded-2xl border-[1.5px] border-line px-8 text-[17px] font-semibold text-navy hover:border-navy"
          >
            Ver detalle <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
