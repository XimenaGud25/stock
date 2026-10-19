"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, close, subtotal, setQuantity, removeItem } = useCart();

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-navy/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Carrito"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-7 py-6">
          <h2 className="font-display text-2xl font-bold text-navy">Tu carrito</h2>
          <button onClick={close} className="grid size-10 place-items-center rounded-xl hover:bg-surface" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
              <ShoppingCart className="size-7" />
            </span>
            <p className="font-semibold">Tu carrito está vacío</p>
            <Link href="/catalogo" onClick={close} className="font-semibold text-brand hover:underline">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-7">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">{item.brand}</p>
                    <Link href={`/producto/${item.slug}`} onClick={close} className="line-clamp-2 font-semibold hover:underline">
                      {item.name}
                    </Link>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-xl border border-line">
                        <button onClick={() => setQuantity(item.productId, item.quantity - 1)} className="grid size-9 place-items-center" aria-label="Menos">
                          <Minus className="size-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.productId, item.quantity + 1)} className="grid size-9 place-items-center" aria-label="Más">
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-dim hover:text-danger" aria-label="Quitar">
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-display text-lg font-bold text-navy">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-line px-7 py-6">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal (IVA incluido)</span>
                <span className="font-display text-2xl font-bold text-navy">{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className="grid h-14 w-full place-items-center rounded-2xl bg-accent font-bold text-navy hover:brightness-95"
              >
                Continuar compra
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
