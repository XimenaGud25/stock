"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";
import { lookupOrder, type LookupState } from "@/app/(tienda)/seguimiento/actions";

const input =
  "h-[52px] w-full rounded-2xl border border-line bg-white px-4 text-base outline-none placeholder:text-dim focus:border-brand";

export function TrackLookupForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder, {});

  return (
    <form action={action} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Número de pedido</span>
        <input name="order" required inputMode="numeric" placeholder="Ej. 128" className={input} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Teléfono con el que compraste</span>
        <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="10 dígitos" className={input} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-accent font-bold text-navy hover:brightness-95 disabled:opacity-60"
      >
        <Search className="size-5" /> {pending ? "Buscando…" : "Ver mi pedido"}
      </button>
    </form>
  );
}
