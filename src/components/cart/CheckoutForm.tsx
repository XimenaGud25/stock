"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ShoppingCart, Store, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { placeOrder, type CheckoutState } from "@/app/(tienda)/checkout/actions";
import { cn, formatPrice } from "@/lib/format";

type BranchOption = { id: string; name: string; address: string };

const input =
  "h-[52px] w-full rounded-2xl border border-line bg-white px-4 text-base outline-none placeholder:text-dim focus:border-brand";

export function CheckoutForm({ branches }: { branches: BranchOption[] }) {
  const { items, subtotal, clear } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, { status: "idle" });
  const [delivery, setDelivery] = useState<"recoger" | "envio">("recoger");

  useEffect(() => {
    if (state.status === "ok") clear();
    // `clear` cambia en cada render del carrito; solo nos importa cuando el pedido se confirma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (state.status === "ok") {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[28px] border border-line bg-white p-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-ok-soft text-ok">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-display text-3xl font-bold text-navy">
          {state.orderId ? `¡Pedido #${state.orderId} recibido!` : "¡Pedido listo!"}
        </h2>
        <p className="text-lg text-muted">
          Envíanos el resumen por WhatsApp para confirmar existencias, forma de pago y entrega.
        </p>
        <a
          href={state.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center gap-2.5 rounded-2xl bg-[#25d366] px-8 font-bold text-white hover:brightness-95"
        >
          <MessageCircle className="size-5" /> Enviar por WhatsApp
        </a>
        <Link href="/catalogo" className="font-semibold text-brand hover:underline">
          Seguir comprando
        </Link>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-[28px] border border-line bg-white p-14 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <ShoppingCart className="size-7" />
        </span>
        <p className="text-lg font-semibold">Tu carrito está vacío</p>
        <Link href="/catalogo" className="font-semibold text-brand hover:underline">
          Ver catálogo
        </Link>
      </section>
    );
  }

  return (
    <form
      // onSubmit (en vez de action=) para que React no vacíe los campos si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-10 lg:grid-cols-[1fr_440px]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="delivery" value={delivery} />

      <div className="space-y-8 rounded-[28px] border border-line bg-white p-8">
        <section className="space-y-4">
          <h2 className="text-[22px] font-bold text-navy">Tus datos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">Nombre completo *</span>
              <input name="name" required autoComplete="name" className={input} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Teléfono / WhatsApp *</span>
              <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="10 dígitos" className={input} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Correo (opcional)</span>
              <input name="email" type="email" autoComplete="email" className={input} />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[22px] font-bold text-navy">Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "recoger", label: "Recoger en sucursal", Icon: Store },
                { value: "envio", label: "Envío a domicilio", Icon: Truck },
              ] as const
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDelivery(value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-[1.5px] px-5 py-4 text-left font-semibold",
                  delivery === value ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-navy",
                )}
              >
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>
          {delivery === "recoger" ? (
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Sucursal</span>
              <select name="branch" className={input}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.address}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Dirección de envío *</span>
              <textarea name="address" rows={3} placeholder="Calle, número, colonia, ciudad y C.P." className={cn(input, "h-auto py-3")} />
            </label>
          )}
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Notas (opcional)</span>
            <textarea name="notes" rows={2} placeholder="¿Necesitas factura? ¿Algún horario?" className={cn(input, "h-auto py-3")} />
          </label>
        </section>
      </div>

      <aside className="h-fit space-y-5 rounded-[28px] border border-line bg-white p-8">
        <h2 className="text-[22px] font-bold text-navy">Resumen</h2>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{i.brand}</span>
                <span className="block font-medium">
                  {i.quantity} × {i.name}
                </span>
              </span>
              <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-muted">Total (IVA incluido)</span>
          <span className="font-display text-3xl font-bold text-navy">{formatPrice(subtotal)}</span>
        </div>
        {state.status === "error" && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {state.message}
          </p>
        )}
        <button
          disabled={pending}
          className="h-14 w-full rounded-2xl bg-accent font-bold text-navy hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Confirmar pedido"}
        </button>
        <p className="text-center text-[13px] text-dim">Pago por transferencia o en sucursal. Te confirmamos por WhatsApp.</p>
      </aside>
    </form>
  );
}
