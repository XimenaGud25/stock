"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, Search, Trash2 } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { createCounterSale, type CounterSaleState } from "@/app/admin/actions";
import { cn, formatPrice } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/orders";
import { adminInput, Card } from "./ui";

type ProductOption = { id: string; name: string; brand: string; sku: string; price: number; stock: number };
type BranchOption = { id: string; name: string };

const PAYMENTS: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia"];
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CounterSaleForm({ products, branches }: { products: ProductOption[]; branches: BranchOption[] }) {
  const [state, action, pending] = useActionState<CounterSaleState, FormData>(createCounterSale, {});
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return products.filter((p) => normalize(`${p.name} ${p.brand} ${p.sku}`).includes(q)).slice(0, 8);
  }, [query, products]);

  const items = Object.entries(lines).map(([id, quantity]) => ({ product: byId.get(id)!, quantity }));
  const total = items.reduce((n, i) => n + i.product.price * i.quantity, 0);

  const setQty = (id: string, qty: number) =>
    setLines((prev) => {
      const next = { ...prev };
      const max = byId.get(id)?.stock ?? 0;
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, max);
      return next;
    });

  if (state.orderId) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-ok-soft text-ok">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-display text-2xl font-bold text-navy">Venta #{state.orderId} registrada</h2>
        <p className="text-muted">Se descontó del inventario y ya aparece en Reportes como venta en tienda.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            // Empieza de cero (también vuelve a leer el stock actualizado)
            onClick={() => window.location.reload()}
            className="h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand/90"
          >
            Registrar otra venta
          </button>
          <Link href={`/admin/pedidos/${state.orderId}`} className="flex h-12 items-center rounded-xl border border-line px-6 font-semibold hover:border-navy">
            Ver venta
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_400px]"
    >
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productId: i.product.id, quantity: i.quantity })))} />
      <input type="hidden" name="payment" value={payment} />

      <Card className="space-y-5 p-6">
        <h2 className="text-lg font-bold text-navy">Productos</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (results[0]) {
                  setQty(results[0].id, (lines[results[0].id] ?? 0) + 1);
                  setQuery("");
                }
              }
            }}
            placeholder="Busca por nombre, marca o SKU y presiona Enter"
            className={cn(adminInput, "pl-12")}
            autoFocus
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(15,23,51,0.12)]">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQty(p.id, (lines[p.id] ?? 0) + 1);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-surface"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{p.brand}</span>
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="text-xs text-dim">
                        {p.sku && `${p.sku} · `}
                        {p.stock} en stock
                      </span>
                    </span>
                    <span className="font-semibold">{formatPrice(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl bg-surface px-6 py-10 text-center text-muted">Todavía no agregas productos.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map(({ product: p, quantity }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{p.brand}</span>
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-sm text-muted">
                    {formatPrice(p.price)} c/u · {p.stock} en stock
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button type="button" onClick={() => setQty(p.id, quantity - 1)} className="grid size-9 place-items-center rounded-lg border border-line hover:border-navy" aria-label="Quitar uno">
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(p.id, quantity + 1)}
                    disabled={quantity >= p.stock}
                    className="grid size-9 place-items-center rounded-lg border border-line hover:border-navy disabled:opacity-40"
                    aria-label="Agregar uno"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button type="button" onClick={() => setQty(p.id, 0)} className="ml-1 grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-soft" aria-label="Quitar producto">
                    <Trash2 className="size-4" />
                  </button>
                </span>
                <span className="w-28 text-right font-semibold">{formatPrice(p.price * quantity)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="h-fit space-y-5 p-6">
        <h2 className="text-lg font-bold text-navy">Cobro</h2>
        <div className="space-y-2">
          <span className="text-sm font-semibold">Forma de pago</span>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPayment(m)}
                className={cn(
                  "rounded-xl border-[1.5px] px-2 py-3 text-sm font-semibold",
                  payment === m ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-navy",
                )}
              >
                {PAYMENT_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Sucursal</span>
          <select name="branch" className={adminInput}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Nombre del cliente (opcional)</span>
          <input name="name" className={adminInput} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Teléfono (opcional)</span>
          <input name="phone" inputMode="tel" placeholder="10 dígitos" className={adminInput} />
          <span className="block text-xs text-dim">Con teléfono, la venta cuenta en el resumen de clientes.</span>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Notas (opcional)</span>
          <input name="notes" placeholder="Ej. Requiere factura" className={adminInput} />
        </label>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-muted">Total</span>
          <span className="font-display text-3xl font-bold text-navy">{formatPrice(total)}</span>
        </div>
        {state.error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        <button disabled={pending || items.length === 0} className="h-12 w-full rounded-xl bg-accent font-bold text-navy hover:brightness-95 disabled:opacity-50">
          {pending ? "Registrando…" : "Registrar venta"}
        </button>
      </Card>
    </form>
  );
}
