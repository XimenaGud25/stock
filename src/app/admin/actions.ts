"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, ProductSpec } from "@/types";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { PHOTOS_BUCKET, SUPABASE_URL } from "@/lib/supabase/config";
import { sessionDb } from "@/lib/supabase/server";
import { productToRow, slugify } from "@/lib/db";
import { products as sampleProducts } from "@/lib/data/products";

export type FormState = { error?: string; ok?: string };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const money = (v: string) => (v === "" ? null : Number(v.replace(/[$,\s]/g, "")));
/** Después de cualquier cambio, la tienda y el panel muestran los datos nuevos. */
const refresh = () => revalidatePath("/", "layout");

/* ------------------------------ Sesión ------------------------------ */

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((e) => e.trim());
  if (!admins.includes(email)) return { error: "Este correo no tiene acceso al panel." };

  const { error } = await (await sessionDb()).auth.signInWithPassword({ email, password: text(fd, "password") });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/admin");
}

export async function signOut() {
  await (await sessionDb()).auth.signOut();
  redirect("/admin/login");
}

/* ----------------------------- Productos ---------------------------- */

const MAX_PHOTO_MB = 5;

/** Sube las fotos nuevas a Supabase Storage y devuelve sus URLs públicas. */
async function uploadPhotos(slug: string, files: File[]) {
  const db = adminDb();
  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" no es una imagen.`);
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) throw new Error(`"${file.name}" pesa más de ${MAX_PHOTO_MB} MB.`);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${slug}/${Date.now()}-${i}.${ext}`;
    const { error } = await db.storage.from(PHOTOS_BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
    urls.push(db.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

/** Borra del almacenamiento las fotos que se quitaron del producto. */
async function deletePhotos(urls: string[]) {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/`;
  const paths = urls.filter((u) => u.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (paths.length) await adminDb().storage.from(PHOTOS_BUCKET).remove(paths);
}

/** "Voltaje: 20V" por renglón → [{ label: "Voltaje", value: "20V" }] */
function parseSpecs(raw: string): ProductSpec[] {
  return raw
    .split("\n")
    .map((line) => line.split(":"))
    .filter((parts) => parts.length >= 2 && parts[0].trim())
    .map(([label, ...rest]) => ({ label: label.trim(), value: rest.join(":").trim() }));
}

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id") || null;
  const name = text(fd, "name");
  const brand = text(fd, "brand");
  const categoryId = text(fd, "categoryId");
  const price = money(text(fd, "price"));
  const compareAt = money(text(fd, "compareAtPrice"));
  const stock = Number(text(fd, "stock") || 0);

  if (!name || !brand || !categoryId) return { error: "Nombre, marca y categoría son obligatorios." };
  if (price === null || Number.isNaN(price) || price < 0) return { error: "Escribe un precio válido." };
  if (compareAt !== null && (Number.isNaN(compareAt) || compareAt <= price))
    return { error: "El precio anterior debe ser mayor al precio actual (o déjalo vacío)." };
  if (!Number.isInteger(stock) || stock < 0) return { error: "El stock debe ser un número entero, 0 o mayor." };

  const db = adminDb();
  // Al editar se conserva la dirección (slug) para no romper enlaces ya compartidos
  const slug = text(fd, "slug") || slugify(`${name} ${brand}`);
  const dup = await db.from("products").select("id").eq("slug", slug).maybeSingle();
  if (dup.data && dup.data.id !== id) return { error: "Ya existe un producto con ese nombre y marca. Cambia el nombre." };

  let keep: string[] = [];
  try {
    keep = JSON.parse(text(fd, "keepImages") || "[]");
  } catch {
    /* sin fotos previas */
  }
  const files = fd.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);

  let images: string[];
  try {
    images = [...keep, ...(await uploadPhotos(slug, files))];
  } catch (e) {
    return { error: (e as Error).message };
  }

  const row = {
    slug,
    sku: text(fd, "sku"),
    name,
    brand,
    highlight: text(fd, "highlight"),
    category_id: categoryId,
    price,
    compare_at_price: compareAt,
    stock,
    low_stock_threshold: Math.max(0, Number(text(fd, "lowStockThreshold") || 3)),
    badge: text(fd, "badge") || null,
    featured: fd.get("featured") === "on",
    active: fd.get("active") === "on",
    description: text(fd, "description"),
    includes: text(fd, "includes").split("\n").map((l) => l.trim()).filter(Boolean),
    specs: parseSpecs(text(fd, "specs")),
    images,
  };

  if (id) {
    const before = await db.from("products").select("images").eq("id", id).single();
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) return { error: error.message };
    await deletePhotos((before.data?.images ?? []).filter((u: string) => !keep.includes(u)));
  } else {
    const { error } = await db.from("products").insert(row);
    if (error) return { error: error.message };
  }

  refresh();
  redirect(`/admin/productos?guardado=${encodeURIComponent(name)}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const db = adminDb();
  const { data } = await db.from("products").select("images").eq("id", id).single();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await deletePhotos(data?.images ?? []);
  refresh();
  redirect("/admin/productos");
}

export async function updateStock(id: string, stock: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock inválido" };
  const { error } = await adminDb().from("products").update({ stock }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: "Guardado" };
}

/** Carga los productos de ejemplo cuando la base está vacía. */
export async function importSampleCatalog() {
  await requireAdmin();
  const db = adminDb();
  const { error } = await db.from("products").upsert(sampleProducts.map(productToRow), { onConflict: "id" });
  if (error) throw new Error(error.message);
  const deal = sampleProducts.find((p) => p.badge === "Oferta del día");
  if (deal) {
    await db
      .from("store_settings")
      .update({ deal_product_id: deal.id, deal_ends_at: new Date(Date.now() + 3 * 86400000).toISOString() })
      .eq("id", 1);
  }
  refresh();
}

/* ------------------------------ Ofertas ----------------------------- */

export async function updatePricing(id: string, price: number, compareAt: number | null): Promise<FormState> {
  await requireAdmin();
  if (Number.isNaN(price) || price < 0) return { error: "Precio inválido" };
  if (compareAt !== null && (Number.isNaN(compareAt) || compareAt <= price))
    return { error: "El precio anterior debe ser mayor" };
  const { error } = await adminDb().from("products").update({ price, compare_at_price: compareAt }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: "Guardado" };
}

export async function saveDeal(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = text(fd, "productId") || null;
  const endsAt = text(fd, "endsAt");
  if (productId && !endsAt) return { error: "Elige cuándo termina la oferta." };
  const { error } = await adminDb()
    .from("store_settings")
    .update({
      deal_product_id: productId,
      // El valor del formulario viene en hora del centro de México (UTC-6)
      deal_ends_at: productId ? new Date(`${endsAt}:00-06:00`).toISOString() : null,
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  refresh();
  return { ok: productId ? "Oferta del día actualizada" : "Oferta del día desactivada" };
}

/* ------------------------------ Pedidos ----------------------------- */

export async function setOrderStatus(id: number, status: OrderStatus): Promise<FormState> {
  await requireAdmin();
  const { error } = await adminDb().rpc("set_order_status", { p_order_id: id, p_status: status });
  if (error) return { error: error.message };
  refresh();
  return { ok: "Estado actualizado" };
}
