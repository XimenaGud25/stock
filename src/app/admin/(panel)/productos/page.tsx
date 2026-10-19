import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, EyeOff, Pencil, Plus, Search } from "lucide-react";
import { listAllProducts } from "@/lib/admin-data";
import { getCategories } from "@/lib/api";
import { isLowStock } from "@/lib/db";
import { cn, formatPrice } from "@/lib/format";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ButtonLink, Card, PageTitle, StockPill, adminInput } from "@/components/admin/ui";
import { StockEditor } from "@/components/admin/StockEditor";

export const metadata = { title: "Productos" };

type SP = Promise<{ q?: string; categoria?: string; filtro?: string; guardado?: string }>;

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "bajo", label: "Poco stock" },
  { value: "agotado", label: "Agotados" },
  { value: "oculto", label: "Ocultos" },
];

export default async function ProductsAdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [all, categories] = await Promise.all([listAllProducts(), getCategories()]);

  let list = all;
  if (sp.q) {
    const q = sp.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q));
  }
  if (sp.categoria) list = list.filter((p) => p.categoryId === sp.categoria);
  if (sp.filtro === "bajo") list = list.filter((p) => p.active && isLowStock(p));
  if (sp.filtro === "agotado") list = list.filter((p) => p.stock <= 0);
  if (sp.filtro === "oculto") list = list.filter((p) => !p.active);

  const catName = (id: string) => categories.find((c) => c.id === id);
  const href = (changes: Record<string, string>) => {
    const qs = new URLSearchParams({ q: sp.q ?? "", categoria: sp.categoria ?? "", filtro: sp.filtro ?? "", ...changes });
    [...qs.keys()].forEach((k) => !qs.get(k) && qs.delete(k));
    return `/admin/productos?${qs}`;
  };

  return (
    <>
      <PageTitle
        title="Productos"
        description={`${all.length} productos · ${all.reduce((n, p) => n + p.stock, 0).toLocaleString("es-MX")} piezas en stock`}
        action={
          <ButtonLink href="/admin/productos/nuevo">
            <Plus className="size-5" /> Nuevo producto
          </ButtonLink>
        }
      />

      {sp.guardado && (
        <p className="flex items-center gap-2 rounded-2xl bg-ok-soft px-5 py-3 font-medium text-ok">
          <CheckCircle2 className="size-5" /> Se guardó “{sp.guardado}”.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form className="relative min-w-[240px] flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-dim" />
          <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, marca o SKU" className={cn(adminInput, "pl-12")} />
          {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
          {sp.filtro && <input type="hidden" name="filtro" value={sp.filtro} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={href({ filtro: f.value })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium",
                (sp.filtro ?? "") === f.value ? "bg-navy text-white" : "border border-line bg-white text-muted hover:text-navy",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={href({ categoria: "" })}
          className={cn("rounded-full px-4 py-2 text-sm font-medium", !sp.categoria ? "bg-brand text-white" : "border border-line bg-white text-muted hover:text-navy")}
        >
          Todas las categorías
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={href({ categoria: c.id })}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              sp.categoria === c.id ? "bg-brand text-white" : "border border-line bg-white text-muted hover:text-navy",
            )}
          >
            <CategoryIcon icon={c.icon} className="size-4" /> {c.name}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-line text-sm text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Producto</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const cat = catName(p.categoryId);
              return (
                <tr key={p.id} className={cn(!p.active && "bg-surface/60 text-muted")}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-4 hover:text-brand">
                      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt="" fill sizes="56px" className="object-contain p-1" />
                        ) : (
                          cat && <CategoryIcon icon={cat.icon} className="size-6 text-dim" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{p.brand}</span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="block text-xs text-dim">
                          {p.sku || "Sin SKU"} · {p.images.length} {p.images.length === 1 ? "foto" : "fotos"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm">{cat?.name}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold">{formatPrice(p.price)}</span>
                    {p.compareAtPrice && <span className="block text-xs text-dim line-through">{formatPrice(p.compareAtPrice)}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StockEditor key={p.stock} productId={p.id} stock={p.stock} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex flex-wrap gap-1.5">
                      {!p.active && (
                        <span className="flex items-center gap-1 rounded-full bg-line px-3 py-1 text-[13px] font-bold text-muted">
                          <EyeOff className="size-3.5" /> Oculto
                        </span>
                      )}
                      <StockPill stock={p.stock} threshold={p.lowStockThreshold} />
                      {p.compareAtPrice && <span className="rounded-full bg-danger px-3 py-1 text-[13px] font-bold text-white">Oferta</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:border-navy"
                    >
                      <Pencil className="size-4" /> Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="px-6 py-12 text-center text-muted">No hay productos con estos filtros.</p>}
      </Card>
    </>
  );
}
