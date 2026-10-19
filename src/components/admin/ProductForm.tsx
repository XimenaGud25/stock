"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Star, Trash2, X } from "lucide-react";
import type { Category, Product } from "@/types";
import { deleteProduct, saveProduct, type FormState } from "@/app/admin/actions";
import { cn } from "@/lib/format";
import { Card, adminInput } from "./ui";

interface Props {
  product?: Product;
  categories: Pick<Category, "id" | "name">[];
  brands: string[];
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-dim">{hint}</span>}
    </label>
  );
}

const textarea = cn(adminInput, "h-auto py-3 leading-6");

export function ProductForm({ product, categories, brands }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [keep, setKeep] = useState<string[]>(product?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // Vistas previas de las fotos nuevas (se liberan al cambiar)
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  // El input de archivos debe contener exactamente las fotos nuevas que siguen en la lista
  useEffect(() => {
    if (!fileInput.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    fileInput.current.files = dt.files;
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (list) setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const makeMain = (url: string) => setKeep((prev) => [url, ...prev.filter((u) => u !== url)]);
  const totalPhotos = keep.length + files.length;

  return (
    <form
      // onSubmit (en vez de action=) para que React no vacíe los campos si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_400px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      {product && <input type="hidden" name="slug" value={product.slug} />}
      <input type="hidden" name="keepImages" value={JSON.stringify(keep)} />

      <div className="space-y-6">
        <Card className="space-y-5 p-6">
          <h2 className="text-lg font-bold text-navy">Datos principales</h2>
          <Field label="Nombre *" hint='Ej. "Generador de luz a gasolina 6,500W"'>
            <input name="name" required defaultValue={product?.name} className={adminInput} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Categoría *">
              <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className={adminInput}>
                <option value="" disabled>
                  Elige una categoría
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Marca *" hint="Escribe una nueva o elige de la lista">
              <input name="brand" required list="brand-list" defaultValue={product?.brand} className={adminInput} />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>
            <Field label="SKU / Modelo">
              <input name="sku" defaultValue={product?.sku} className={adminInput} />
            </Field>
            <Field label="Dato destacado" hint='Aparece junto a la marca: "6,500W", "22 KG", "4 EN 1"'>
              <input name="highlight" defaultValue={product?.highlight} className={adminInput} />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea name="description" rows={4} defaultValue={product?.description} className={textarea} />
          </Field>
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Fotos</h2>
            <span className="text-sm text-muted">{totalPhotos} en total · la primera es la principal</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {keep.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-contain p-2" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy">Principal</span>}
                <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                  {i > 0 && (
                    <button type="button" onClick={() => makeMain(url)} title="Hacer principal" className="grid size-8 place-items-center rounded-lg bg-white shadow">
                      <Star className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setKeep((prev) => prev.filter((u) => u !== url))}
                    title="Quitar foto"
                    className="grid size-8 place-items-center rounded-lg bg-white text-danger shadow"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-brand bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-contain p-2" />
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                  {keep.length === 0 && i === 0 ? "Principal · nueva" : "Nueva"}
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  title="Quitar"
                  className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-lg bg-white text-danger shadow"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted hover:border-brand hover:text-brand"
            >
              <ImagePlus className="size-8" />
              <span className="text-sm font-semibold">Agregar fotos</span>
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            name="newImages"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <p className="text-xs text-dim">JPG, PNG o WebP de hasta 5 MB. Mejor con fondo blanco y cuadradas.</p>
        </Card>

        <Card className="grid gap-5 p-6 md:grid-cols-2">
          <Field label="¿Qué incluye?" hint="Un elemento por renglón">
            <textarea name="includes" rows={6} defaultValue={product?.includes.join("\n")} className={textarea} />
          </Field>
          <Field label="Especificaciones técnicas" hint='Una por renglón con el formato "Nombre: valor"'>
            <textarea
              name="specs"
              rows={6}
              defaultValue={product?.specs.map((s) => `${s.label}: ${s.value}`).join("\n")}
              placeholder={"Potencia: 6,500 W\nMotor: 4 tiempos"}
              className={textarea}
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-6">
          <h2 className="text-lg font-bold text-navy">Precio e inventario</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (IVA incl.) *">
              <input name="price" required inputMode="decimal" defaultValue={product?.price} className={adminInput} />
            </Field>
            <Field label="Precio anterior" hint="Llénalo para mostrarlo en oferta">
              <input name="compareAtPrice" inputMode="decimal" defaultValue={product?.compareAtPrice} className={adminInput} />
            </Field>
            <Field label="Piezas en stock *">
              <input name="stock" required type="number" min={0} defaultValue={product?.stock ?? 0} className={adminInput} />
            </Field>
            <Field label="Avisar cuando queden" hint="Alerta de poco stock">
              <input name="lowStockThreshold" type="number" min={0} defaultValue={product?.lowStockThreshold ?? 3} className={adminInput} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-bold text-navy">Publicación</h2>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="mt-1 size-5 accent-brand" />
            <span>
              <span className="block font-semibold">Visible en la tienda</span>
              <span className="text-sm text-muted">Desmárcalo para ocultarlo sin borrarlo.</span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="mt-1 size-5 accent-brand" />
            <span>
              <span className="block font-semibold">Destacado en el inicio</span>
              <span className="text-sm text-muted">Aparece en “Herramienta destacada”.</span>
            </span>
          </label>
          <Field label="Etiqueta" hint='Opcional: "Más vendido", "Nuevo", "Obra pesada"…'>
            <input name="badge" defaultValue={product?.badge} className={adminInput} />
          </Field>
        </Card>

        {state.error && <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}

        <div className="flex gap-3">
          <Link href="/admin/productos" className="grid h-14 flex-1 place-items-center rounded-2xl border border-line bg-white font-semibold hover:border-navy">
            Cancelar
          </Link>
          <button disabled={pending} className="h-14 flex-[2] rounded-2xl bg-brand font-bold text-white hover:bg-brand/90 disabled:opacity-60">
            {pending ? (files.length ? "Subiendo fotos…" : "Guardando…") : product ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>

        {product && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Borrar "${product.name}"? Esta acción no se puede deshacer.\n\nSi solo quieres quitarlo de la tienda, desmarca "Visible en la tienda".`))
                deleteProduct(product.id);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-4" /> Borrar producto
          </button>
        )}
      </div>
    </form>
  );
}
