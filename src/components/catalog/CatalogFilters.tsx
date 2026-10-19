"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Category } from "@/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/format";

interface Props {
  categories: Category[];
  brands: string[];
}

/** Barra lateral de filtros. Todo se guarda en la URL (?categoria=…&marca=…) para que se pueda compartir. */
export function CatalogFilters({ categories, brands }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const selectedBrands = params.get("marca")?.split(",").filter(Boolean) ?? [];
  const activeCategory = params.get("categoria");

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("pagina");
    router.push(`/catalogo${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  function toggleBrand(brand: string) {
    const list = selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand];
    update({ marca: list.join(",") || null });
  }

  return (
    <aside className="space-y-6">
      <FilterBox title="Categorías">
        <ul className="space-y-1">
          {categories.map((c) => {
            const active = c.slug === activeCategory;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => update({ categoria: active ? null : c.slug })}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-[15px]",
                    active ? "bg-brand-soft font-semibold text-brand" : "font-medium hover:bg-surface",
                  )}
                >
                  <CategoryIcon icon={c.icon} className={cn("size-5 shrink-0", active ? "text-brand" : "text-muted")} />
                  <span className="flex-1">{c.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      active ? "bg-brand text-white" : "bg-surface text-muted",
                    )}
                  >
                    {c.productCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </FilterBox>

      <FilterBox title="Marca">
        <div className="space-y-3.5">
          {brands.map((b) => (
            <Checkbox key={b} label={b} checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} />
          ))}
        </div>
      </FilterBox>

      <FilterBox title="Precio">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <PriceInput label="Mín" value={min} onChange={setMin} placeholder="$500" />
            <PriceInput label="Máx" value={max} onChange={setMax} placeholder="$18,000" />
          </div>
          <button className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-navy hover:bg-surface">Aplicar precio</button>
        </form>
      </FilterBox>

      <FilterBox title="Disponibilidad">
        <div className="space-y-3.5">
          <Checkbox label="Solo en stock" checked={params.get("stock") === "1"} onChange={(v) => update({ stock: v ? "1" : null })} />
          <Checkbox label="Con descuento" checked={params.get("oferta") === "1"} onChange={(v) => update({ oferta: v ? "1" : null })} />
        </div>
      </FilterBox>

      <div className="space-y-3 rounded-3xl bg-accent p-7">
        <p className="text-xs font-bold tracking-[0.18em] text-navy">MAYOREO STOCK</p>
        <p className="font-display text-[26px] font-bold leading-tight text-navy">Lleva 5+ y ahorra 12%</p>
        <p className="text-[15px] text-[#3b3a2e]">Aplica en herramienta eléctrica.</p>
        <Link href="/#mayoreo" className="flex items-center gap-2 pt-2 font-bold text-navy underline">
          Cotizar lote <ArrowRight className="size-4" />
        </Link>
      </div>
    </aside>
  );
}

function FilterBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-3xl border border-line bg-white p-7">
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      {children}
    </section>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cn(
          "grid size-[22px] place-items-center rounded-md border-[1.5px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
          checked ? "border-brand bg-brand text-white" : "border-[#c9d0dc] bg-white",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}

function PriceInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block rounded-xl border border-line px-3.5 py-2.5 focus-within:border-brand">
      <span className="block text-xs text-dim">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-dim"
      />
    </label>
  );
}
