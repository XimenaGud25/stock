import "server-only";
/** Lecturas del panel: incluyen productos ocultos y pedidos (la tienda no los ve). */
import type { Order, OrderStatus, Product } from "@/types";
import { adminDb } from "./supabase/admin";
import { requireAdmin } from "./auth";
import { rowToOrder, rowToProduct, type ProductRow } from "./db";

/**
 * Cada lectura comprueba la sesión: en Next.js la página y el layout se ejecutan
 * en paralelo, así que el layout por sí solo no protege los datos.
 */
async function db() {
  await requireAdmin();
  return adminDb();
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Error de base de datos: ${res.error.message}`);
  return res.data as T;
}

export async function listAllProducts(): Promise<Product[]> {
  const rows = check(await (await db()).from("products").select("*").order("category_id").order("name"));
  return rows.map((r) => rowToProduct(r as ProductRow));
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = check(await (await db()).from("products").select("*").eq("id", id).maybeSingle());
  return row ? rowToProduct(row as ProductRow) : null;
}

export async function listOrders(status?: OrderStatus, limit = 200): Promise<Order[]> {
  let q = (await db()).from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(limit);
  if (status) q = q.eq("status", status);
  return check(await q).map(rowToOrder);
}

export async function getOrder(id: number): Promise<Order | null> {
  const row = check(await (await db()).from("orders").select("*, order_items(*)").eq("id", id).maybeSingle());
  return row ? rowToOrder(row) : null;
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const rows = check(await (await db()).from("orders").select("status"));
  const out: Record<OrderStatus, number> = { nuevo: 0, confirmado: 0, entregado: 0, cancelado: 0 };
  rows.forEach((r: { status: OrderStatus }) => out[r.status]++);
  return out;
}

export async function getDealSettings(): Promise<{ productId: string | null; endsAt: string | null }> {
  const row = check(await (await db()).from("store_settings").select("deal_product_id, deal_ends_at").eq("id", 1).maybeSingle<{ deal_product_id: string | null; deal_ends_at: string | null }>());
  return { productId: row?.deal_product_id ?? null, endsAt: row?.deal_ends_at ?? null };
}
