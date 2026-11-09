"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { bucketLabel } from "@/lib/reports";

type Point = { key: string; en_linea: number; tienda: number };

/** Mismos colores que CHANNEL_COLOR (validados para daltonismo y contraste). */
const COLORS = { en_linea: "#1f4fd8", tienda: "#d97706" };

const compact = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`;

/** Redondea el máximo hacia arriba a un número "bonito" (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((s) => s * p >= v) ?? 10) * p;
}

export function SalesChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = niceMax(Math.max(...data.map((d) => d.en_linea + d.tienda), 0));
  const every = Math.max(1, Math.ceil(data.length / 8));
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex gap-5 text-sm text-muted" aria-label="Leyenda">
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-[3px]" style={{ background: COLORS.en_linea }} /> En línea
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-[3px]" style={{ background: COLORS.tienda }} /> En tienda
          </li>
        </ul>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-sm font-semibold text-brand hover:underline">
          {asTable ? "Ver gráfica" : "Ver como tabla"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 text-right font-medium">En línea</th>
                <th className="px-4 py-2 text-right font-medium">En tienda</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d) => (
                <tr key={d.key}>
                  <td className="px-4 py-2">{bucketLabel(d.key)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(d.en_linea)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(d.tienda)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatPrice(d.en_linea + d.tienda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative pl-12">
          {/* Eje Y y líneas guía (discretas) */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 bottom-7">
            {[1, 0.5, 0].map((f) => (
              <div key={f} className="absolute inset-x-0 flex items-center" style={{ top: `${(1 - f) * 100}%` }}>
                <span className="w-12 -translate-y-1/2 pr-2 text-right text-xs tabular-nums text-dim">{compact(max * f)}</span>
                <span className={`h-px flex-1 -translate-y-1/2 ${f === 0 ? "bg-[#c9d0dc]" : "bg-line"}`} />
              </div>
            ))}
          </div>

          <div className="relative flex h-[260px] items-end gap-[2px] pb-7" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const total = d.en_linea + d.tienda;
              return (
                <div
                  key={d.key}
                  className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${bucketLabel(d.key)}: en línea ${formatPrice(d.en_linea)}, en tienda ${formatPrice(d.tienda)}`}
                >
                  <div className={`mx-auto flex w-full max-w-[28px] flex-col justify-end gap-[2px] ${hover !== null && hover !== i ? "opacity-50" : ""}`}>
                    {d.tienda > 0 && (
                      <span
                        className="block rounded-t-[4px]"
                        style={{ height: `${(d.tienda / max) * 232}px`, background: COLORS.tienda, minHeight: 2 }}
                      />
                    )}
                    {d.en_linea > 0 && (
                      <span
                        className={`block ${d.tienda > 0 ? "" : "rounded-t-[4px]"}`}
                        style={{ height: `${(d.en_linea / max) * 232}px`, background: COLORS.en_linea, minHeight: 2 }}
                      />
                    )}
                    {total === 0 && <span className="block h-[2px]" />}
                  </div>
                  {i % every === 0 && (
                    <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-dim">{bucketLabel(d.key)}</span>
                  )}
                </div>
              );
            })}
          </div>

          {h && hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-48 rounded-xl border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgba(15,23,51,0.14)]"
              style={{ left: `clamp(0px, calc(${((hover + 0.5) / data.length) * 100}% - 96px + 24px), calc(100% - 192px))` }}
            >
              <p className="mb-1.5 font-semibold text-navy">{bucketLabel(h.key)}</p>
              <p className="flex items-center justify-between gap-2 text-muted">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-[3px]" style={{ background: COLORS.en_linea }} /> En línea
                </span>
                <span className="tabular-nums text-ink">{formatPrice(h.en_linea)}</span>
              </p>
              <p className="flex items-center justify-between gap-2 text-muted">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-[3px]" style={{ background: COLORS.tienda }} /> En tienda
                </span>
                <span className="tabular-nums text-ink">{formatPrice(h.tienda)}</span>
              </p>
              <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(h.en_linea + h.tienda)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
