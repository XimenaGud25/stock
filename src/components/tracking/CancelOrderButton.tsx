"use client";

import { useActionState, useState } from "react";
import { XCircle } from "lucide-react";
import { cancelMyOrder, type CancelState } from "@/app/(tienda)/seguimiento/actions";

const REASONS = ["Ya no lo necesito", "Lo encontré en otro lugar", "Me equivoqué de producto o cantidad", "Tarda demasiado", "Otro motivo"];

export function CancelOrderButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelMyOrder, {});

  if (state.ok) return null; // la página se recarga con el estado "Cancelado"

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-danger/40 font-semibold text-danger hover:bg-danger-soft"
      >
        <XCircle className="size-5" /> Cancelar pedido
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-danger/30 bg-danger-soft/50 p-5">
      <input type="hidden" name="token" value={token} />
      <p className="font-semibold text-navy">¿Por qué quieres cancelar?</p>
      <div className="space-y-2">
        {REASONS.map((r, i) => (
          <label key={r} className="flex items-center gap-3 text-[15px]">
            <input type="radio" name="reason" value={r} defaultChecked={i === 0} className="size-4 accent-[var(--color-danger)]" />
            {r}
          </label>
        ))}
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button disabled={pending} className="h-12 flex-1 rounded-2xl bg-danger font-bold text-white hover:brightness-95 disabled:opacity-60">
          {pending ? "Cancelando…" : "Sí, cancelar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-12 flex-1 rounded-2xl border border-line bg-white font-semibold">
          No, conservarlo
        </button>
      </div>
    </form>
  );
}
