"use client";

import { useState } from "react";
import { Heart, Minus, Plus, Receipt, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/components/cart/CartProvider";
import { AddToCartButton } from "./AddToCartButton";
import { formatPrice, savings } from "@/lib/format";

/** Tarjeta de compra de la pantalla de detalle: precio, cantidad, agregar al carrito y comprar ahora. */
export function ProductPurchase({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const max = Math.max(product.stock, 1);
  const saved = savings(product);
  const soldOut = product.stock <= 0;

  return (
    <section className="space-y-6 rounded-[28px] border border-line bg-white p-8">
      <div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-display text-5xl font-bold text-navy">{formatPrice(product.price)}</span>
          {product.compareAtPrice && <span className="text-xl text-dim line-through">{formatPrice(product.compareAtPrice)}</span>}
          {saved > 0 && (
            <span className="rounded-full bg-danger-soft px-3 py-1.5 text-sm font-bold text-danger">Ahorras {formatPrice(saved)}</span>
          )}
        </div>
        <p className="mt-2 text-[15px] text-muted">IVA incluido · Hasta 6 meses sin intereses</p>
      </div>

      <div className="flex gap-3.5">
        <div className="flex h-[60px] items-center rounded-2xl border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-full w-[52px] place-items-center"
            aria-label="Menos"
          >
            <Minus className="size-5" />
          </button>
          <span className="w-12 text-center text-lg font-semibold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="grid h-full w-[52px] place-items-center"
            aria-label="Más"
          >
            <Plus className="size-5" />
          </button>
        </div>
        <AddToCartButton product={product} quantity={qty} className="h-[60px] flex-1 text-lg font-bold" />
        <button
          type="button"
          aria-label="Agregar a favoritos"
          className="grid size-[60px] shrink-0 place-items-center rounded-2xl border border-line hover:text-danger"
        >
          <Heart className="size-6" />
        </button>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => addItem(product, qty)}
        className="h-[60px] w-full rounded-2xl bg-accent text-lg font-bold text-navy hover:brightness-95 disabled:opacity-50"
      >
        Comprar ahora
      </button>

      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, label: "Envío 24/48 h" },
          { icon: Receipt, label: "Factura inmediata" },
          { icon: ShieldCheck, label: "Garantía de marca" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2.5 rounded-xl bg-surface p-3.5 text-sm font-medium">
            <Icon className="size-5 text-brand" /> {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
