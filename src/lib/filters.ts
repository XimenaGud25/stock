import type { ProductFilters, SortOption } from "@/types";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: SortOption[] = ["relevancia", "precio-asc", "precio-desc", "descuento", "nuevos", "calificacion"];

export const SORT_LABELS: Record<SortOption, string> = {
  relevancia: "Más vendidos",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  descuento: "Mayor descuento",
  nuevos: "Más nuevos",
  calificacion: "Mejor calificados",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

/** Convierte los parámetros de la URL (?marca=Bosch&min=500…) en filtros para la API. */
export function parseFilters(sp: SearchParams): ProductFilters {
  const sort = one(sp.orden) as SortOption | undefined;
  const brands = one(sp.marca)?.split(",").filter(Boolean);
  return {
    q: one(sp.q) || undefined,
    category: one(sp.categoria) || undefined,
    brands: brands?.length ? brands : undefined,
    minPrice: num(one(sp.min)),
    maxPrice: num(one(sp.max)),
    inStock: one(sp.stock) === "1",
    onSale: one(sp.oferta) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "relevancia",
    page: Math.max(1, num(one(sp.pagina)) ?? 1),
  };
}

/** Arma la URL del catálogo cambiando solo los parámetros indicados. */
export function buildQuery(sp: SearchParams, changes: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    const val = one(v);
    if (val) qs.set(k, val);
  });
  Object.entries(changes).forEach(([k, v]) => (v ? qs.set(k, v) : qs.delete(k)));
  if (!("pagina" in changes)) qs.delete("pagina");
  const s = qs.toString();
  return s ? `?${s}` : "";
}
