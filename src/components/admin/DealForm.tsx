"use client";

import { useActionState } from "react";
import { saveDeal, type FormState } from "@/app/admin/actions";
import { adminInput } from "./ui";

interface Props {
  products: { id: string; label: string }[];
  productId: string | null;
  /** Fecha guardada, ya convertida a "YYYY-MM-DDTHH:mm" en hora de México */
  endsAt: string;
}

export function DealForm({ products, productId, endsAt }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDeal, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
      <label className="space-y-1.5">
        <span className="text-sm font-semibold">Producto</span>
        <select name="productId" defaultValue={productId ?? ""} className={adminInput}>
          <option value="">— Sin oferta del día —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-sm font-semibold">Termina</span>
        <input name="endsAt" type="datetime-local" defaultValue={endsAt} className={adminInput} />
      </label>
      <button disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:bg-brand/90 disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {state.error && <p className="text-sm font-medium text-danger md:col-span-3">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-ok md:col-span-3">{state.ok}</p>}
    </form>
  );
}
