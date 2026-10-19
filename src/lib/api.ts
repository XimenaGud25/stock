/**
 * Capa de datos de la tienda. TODAS las pantallas piden información a través de estas funciones.
 *
 * - Si Supabase está configurado (.env.local) → se lee de la base de datos.
 * - Si no → se usan los datos de ejemplo de src/lib/data, para poder ver la tienda sin backend.
 */
import type { Branch, Category, Paginated, Product, ProductFilters } from "@/types";
import { categories as mockCategories, brands as mockBrands } from "./data/categories";
import { products as mockProducts, getDealEndsAt } from "./data/products";
import { branches as mockBranches } from "./data/branches";
import { discountPercent } from "./format";
import { isSupabaseConfigured } from "./supabase/config";
import { publicDb } from "./supabase/public";
import { rowToProduct, type ProductRow } from "./db";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Error de base de datos: ${res.error.message}`);
  return res.data as T;
}

/* ---------------------------- Categorías ---------------------------- */

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return mockCategories;

  const db = publicDb();
  const [cats, prods] = await Promise.all([
    db.from("categories").select("id, slug, name, icon").order("sort"),
    db.from("products").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  check(prods).forEach((p: { category_id: string }) => counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));
  return check(cats).map((c: Omit<Category, "productCount">) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function getBrands(): Promise<string[]> {
  if (!isSupabaseConfigured) return mockBrands;
  const rows = check(await publicDb().from("products").select("brand"));
  return [...new Set(rows.map((r: { brand: string }) => r.brand))].sort();
}

/* ----------------------------- Productos ---------------------------- */

export async function getProducts(filters: ProductFilters = {}): Promise<Paginated<Product>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 9;

  if (isSupabaseConfigured) {
    let query = publicDb().from("products").select("*", { count: "exact" });
    if (filters.q) {
      const q = filters.q.replace(/[%,()]/g, " ");
      query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,sku.ilike.%${q}%`);
    }
    if (filters.category) {
      const cat = await getCategoryBySlug(filters.category);
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (filters.brands?.length) query = query.in("brand", filters.brands);
    if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
    if (filters.inStock) query = query.gt("stock", 0);
    if (filters.onSale) query = query.eq("on_sale", true);

    switch (filters.sort) {
      case "precio-asc": query = query.order("price"); break;
      case "precio-desc": query = query.order("price", { ascending: false }); break;
      case "descuento": query = query.order("discount_pct", { ascending: false }); break;
      case "nuevos": query = query.order("created_at", { ascending: false }); break;
      case "calificacion": query = query.order("rating", { ascending: false }); break;
      default: query = query.order("review_count", { ascending: false }); // "Más vendidos"
    }

    const from = (page - 1) * pageSize;
    const res = await query.range(from, from + pageSize - 1);
    const total = res.count ?? 0;
    return {
      items: check(res).map((r) => rowToProduct(r as ProductRow)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // ---- Filtrado local sobre los datos de ejemplo ----
  let list = [...mockProducts];
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q));
  }
  if (filters.category) {
    const cat = mockCategories.find((c) => c.slug === filters.category);
    if (cat) list = list.filter((p) => p.categoryId === cat.id);
  }
  if (filters.brands?.length) list = list.filter((p) => filters.brands!.includes(p.brand));
  if (filters.minPrice !== undefined) list = list.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) list = list.filter((p) => p.price <= filters.maxPrice!);
  if (filters.inStock) list = list.filter((p) => p.stock > 0);
  if (filters.onSale) list = list.filter((p) => discountPercent(p) > 0);

  switch (filters.sort) {
    case "precio-asc": list.sort((a, b) => a.price - b.price); break;
    case "precio-desc": list.sort((a, b) => b.price - a.price); break;
    case "descuento": list.sort((a, b) => discountPercent(b) - discountPercent(a)); break;
    case "nuevos": list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    case "calificacion": list.sort((a, b) => b.rating - a.rating); break;
    default: list.sort((a, b) => b.reviewCount - a.reviewCount); // "Más vendidos"
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = list.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, totalPages };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const rows = check(await publicDb().from("products").select("*").eq("featured", true).order("review_count", { ascending: false }).limit(limit));
    const featured = rows.map((r) => rowToProduct(r as ProductRow));
    // Si el admin marcó menos de `limit` como destacados, se completa con los más vendidos
    if (featured.length >= limit) return featured;
    const { items } = await getProducts({ pageSize: limit * 2 });
    return [...featured, ...items.filter((p) => !featured.some((f) => f.id === p.id))].slice(0, limit);
  }
  return mockProducts.filter((p) => p.featured).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    const row = check(await publicDb().from("products").select("*").eq("slug", slug).maybeSingle());
    return row ? rowToProduct(row as ProductRow) : null;
  }
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const cat = (await getCategories()).find((c) => c.id === product.categoryId);
  const { items } = await getProducts({ category: cat?.slug, pageSize: limit + 1 });
  const related = items.filter((p) => p.id !== product.id);
  if (related.length >= limit) return related.slice(0, limit);
  const extra = (await getFeaturedProducts(limit + 2)).filter(
    (p) => p.id !== product.id && !related.some((r) => r.id === p.id),
  );
  return [...related, ...extra].slice(0, limit);
}

/* ------------------------------ Ofertas ----------------------------- */

export async function getDealOfTheDay(): Promise<{ product: Product; endsAt: string } | null> {
  if (isSupabaseConfigured) {
    const db = publicDb();
    const settings = check(await db.from("store_settings").select("deal_product_id, deal_ends_at").eq("id", 1).maybeSingle<{ deal_product_id: string | null; deal_ends_at: string | null }>());
    const id = settings?.deal_product_id;
    const endsAt = settings?.deal_ends_at;
    if (!id || !endsAt || new Date(endsAt) < new Date()) return null;
    const row = check(await db.from("products").select("*").eq("id", id).maybeSingle());
    return row ? { product: rowToProduct(row as ProductRow), endsAt } : null;
  }
  const product = mockProducts.find((p) => p.badge === "Oferta del día") ?? mockProducts[0];
  return { product, endsAt: getDealEndsAt() };
}

/* ----------------------------- Sucursales --------------------------- */

export async function getBranches(): Promise<Branch[]> {
  return mockBranches;
}
