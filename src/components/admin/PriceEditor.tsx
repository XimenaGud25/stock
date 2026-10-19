"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updatePricing } from "@/app/admin/actions";
import { discountPercent } from "@/lib/format";

const toNum = (v: string) => Number(v.replace(/[$,\s]/g, ""));

/** Renglón editable de la tabla de ofertas: precio actual, precio anterior y % de descuento. */
export function PriceEditor({ productId, price, compareAtPrice }: { productId: string; price: number; compareAtPrice?: number }) {
  const [p, setP] = useState(String(price));
  const [c, setC] = useState(compareAtPrice ? String(compareAtPrice) : "");
  const [saved, setSaved] = useState({ p: String(price), c: compareAtPrice ? String(compareAtPrice) : "" });
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const dirty = p !== saved.p || c !== saved.c;
  const pct = discountPercent({ price: toNum(p), compareAtPrice: c ? toNum(c) : undefined });

  const save = (nextC = c) =>
    start(async () => {
      const res = await updatePricing(productId, toNum(p), nextC ? toNum(nextC) : null);
      setError(res.error);
      if (!res.error) {
        setC(nextC);
        setSaved({ p, c: nextC });
      }
    });

  /** Pone el precio anterior = precio actual y baja el actual el % indicado. */
  const applyPercent = (percent: number) => {
    const base = c ? toNum(c) : toNum(p);
    setC(String(base));
    setP(String(Math.round(base * (1 - percent / 100))));
  };

  const input = "h-10 w-28 rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-brand";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs text-muted">
        Precio
        <input value={p} onChange={(e) => setP(e.target.value)} inputMode="decimal" className={`${input} block`} />
      </label>
      <label className="text-xs text-muted">
        Precio anterior
        <input value={c} onChange={(e) => setC(e.target.value)} inputMode="decimal" placeholder="Sin oferta" className={`${input} block`} />
      </label>
      <span className={`mt-4 w-14 text-center font-bold ${pct ? "text-danger" : "text-dim"}`}>{pct ? `-${pct}%` : "—"}</span>
      <span className="mt-4 flex gap-1">
        {[10, 15, 20].map((n) => (
          <button key={n} type="button" onClick={() => applyPercent(n)} className="rounded-lg border border-line px-2 py-1.5 text-xs font-semibold hover:border-navy">
            -{n}%
          </button>
        ))}
      </span>
      <span className="mt-4 flex gap-2">
        {dirty && (
          <button
            type="button"
            disabled={pending}
            onClick={() => save()}
            className="flex h-9 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Check className="size-4" /> Guardar
          </button>
        )}
        {saved.c && !dirty && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setP(saved.c);
              start(async () => {
                const res = await updatePricing(productId, toNum(saved.c), null);
                setError(res.error);
                if (!res.error) {
                  setC("");
                  setSaved({ p: saved.c, c: "" });
                }
              });
            }}
            className="h-9 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
            title="Regresa al precio anterior y quita la oferta"
          >
            Quitar oferta
          </button>
        )}
      </span>
      {error && <span className="w-full text-xs text-danger">{error}</span>}
    </div>
  );
}
