"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORT_LABELS } from "@/lib/filters";
import type { SortOption } from "@/types";

export function SortSelect({ basePath = "/catalogo" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get("orden") as SortOption) ?? "relevancia";

  return (
    <label className="relative flex h-14 items-center rounded-2xl border border-line bg-white pl-5 pr-12 text-base font-medium">
      <span className="text-muted">Ordenar:&nbsp;</span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("orden", e.target.value);
          next.delete("pagina");
          router.push(`${basePath}?${next}`, { scroll: false });
        }}
        className="appearance-none bg-transparent font-medium text-ink outline-none"
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-5 text-muted" />
    </label>
  );
}
