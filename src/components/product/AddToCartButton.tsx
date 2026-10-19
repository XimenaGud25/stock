"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types";
import { cn } from "@/lib/format";

export function AddToCartButton({
  product,
  quantity = 1,
  label = "Agregar al carrito",
  className,
}: {
  product: Product;
  quantity?: number;
  label?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const disabled = product.stock <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem(product, quantity)}
      className={cn(
        "flex items-center justify-center gap-2.5 rounded-2xl bg-brand font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-line disabled:text-dim",
        className,
      )}
    >
      <ShoppingCart className="size-5" />
      {disabled ? "Agotado" : label}
    </button>
  );
}
