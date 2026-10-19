"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { ProductImage } from "./ProductImage";
import { discountPercent } from "@/lib/format";

/** Imagen mediana arriba + 3 miniaturas debajo. Al dar clic en una miniatura cambia la principal. */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const pct = discountPercent(product);
  const slots = [0, 1, 2];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-white">
        <ProductImage
          product={product}
          index={active}
          priority
          sizes="(min-width:1024px) 760px, 100vw"
          className="aspect-[19/14] w-full bg-white"
          iconClassName="size-[40%] text-navy"
        />
        <div className="absolute left-7 top-7 flex gap-2.5">
          {product.badge && <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-navy">{product.badge}</span>}
          {pct > 0 && <span className="rounded-full bg-danger px-4 py-2 text-sm font-bold text-white">-{pct}%</span>}
        </div>
        <button
          type="button"
          aria-label="Agregar a favoritos"
          className="absolute right-7 top-7 grid size-[52px] place-items-center rounded-full border border-line bg-white hover:text-danger"
        >
          <Heart className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {slots.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={active === i}
            className={`overflow-hidden rounded-[20px] bg-white transition ${
              active === i ? "ring-[2.5px] ring-brand" : "border border-line hover:border-brand"
            }`}
          >
            <ProductImage product={product} index={i} sizes="250px" className="aspect-[4/3] w-full bg-white" iconClassName="size-20 text-[#6b7897]" />
          </button>
        ))}
      </div>
    </div>
  );
}
