"use client";

import { useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { updateStock } from "@/app/admin/actions";
import { cn } from "@/lib/format";

/** Cambia el stock directamente desde la tabla: botones +/- o escribir el número y Guardar. */
export function StockEditor({ productId, stock }: { productId: string; stock: number }) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(stock);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const n = Number(value);
  const dirty = n !== saved;

  const save = () =>
    start(async () => {
      const res = await updateStock(productId, n);
      setError(res.error);
      if (!res.error) setSaved(n);
    });

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-line bg-white">
        <button type="button" onClick={() => setValue(String(Math.max(0, n - 1)))} className="grid size-9 place-items-center" aria-label="Restar">
          <Minus className="size-4" />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && dirty && save()}
          inputMode="numeric"
          aria-label="Stock"
          className={cn("w-12 bg-transparent text-center font-semibold outline-none", saved <= 0 && !dirty && "text-danger")}
        />
        <button type="button" onClick={() => setValue(String(n + 1))} className="grid size-9 place-items-center" aria-label="Sumar">
          <Plus className="size-4" />
        </button>
      </div>
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={pending || value === ""}
          className="flex h-9 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Check className="size-4" /> {pending ? "…" : "Guardar"}
        </button>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
