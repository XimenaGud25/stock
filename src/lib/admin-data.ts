import "server-only";
/** Lecturas del panel: incluyen productos ocultos y pedidos (la tienda no los ve). */
import type { Order, OrderChannel, OrderStatus, PaymentStatus, Product } from "@/types";
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

export async function listOrders(
  filter: { status?: OrderStatus; channel?: OrderChannel; q?: string; payment?: PaymentStatus | "sin_pagar" } = {},
  limit = 200,
): Promise<Order[]> {
  let q = (await db()).from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(limit);
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.channel) q = q.eq("channel", filter.channel);
  if (filter.payment === "sin_pagar") q = q.neq("payment_status", "pagado").neq("status", "cancelado");
  else if (filter.payment) q = q.eq("payment_status", filter.payment).neq("status", "cancelado");
  if (filter.q) {
    const term = filter.q.replace(/[,()%*]/g, " ").trim();
    const id = Number(term.replace(/^#/, ""));
    q = Number.isInteger(id) && id > 0 ? q.eq("id", id) : q.or(`customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  return check(await q).map(rowToOrder);
}

export async function getOrder(id: number): Promise<Order | null> {
  const row = check(await (await db()).from("orders").select("*, order_items(*), order_events(*)").eq("id", id).maybeSingle());
  return row ? rowToOrder(row) : null;
}

/** Pedidos con sus productos desde una fecha (para Reportes). Sin fecha = todos. */
export async function listOrdersSince(fromIso: string | null): Promise<Order[]> {
  const client = await db();
  const out: Order[] = [];
  // Supabase entrega máximo 1,000 filas por consulta: se piden por páginas
  for (let page = 0; ; page++) {
    let q = client.from("orders").select("*, order_items(*)").order("created_at").range(page * 1000, page * 1000 + 999);
    if (fromIso) q = q.gte("created_at", fromIso);
    const rows = check(await q);
    out.push(...rows.map(rowToOrder));
    if (rows.length < 1000) return out;
  }
}

/** Pagos que el cliente dice haber hecho y falta revisar en el banco. */
export async function countPaymentsToConfirm(): Promise<number> {
  const { count } = await (await db())
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "por_confirmar")
    .neq("status", "cancelado");
  return count ?? 0;
}

export async function countOrdersByStatus(channel?: OrderChannel): Promise<Record<OrderStatus, number>> {
  let q = (await db()).from("orders").select("status");
  if (channel) q = q.eq("channel", channel);
  const rows = check(await q);
  const out: Record<OrderStatus, number> = { nuevo: 0, confirmado: 0, preparando: 0, listo: 0, entregado: 0, cancelado: 0 };
  rows.forEach((r: { status: OrderStatus }) => out[r.status]++);
  return out;
}

export async function getDealSettings(): Promise<{ productId: string | null; endsAt: string | null }> {
  const row = check(await (await db()).from("store_settings").select("deal_product_id, deal_ends_at").eq("id", 1).maybeSingle<{ deal_product_id: string | null; deal_ends_at: string | null }>());
  return { productId: row?.deal_product_id ?? null, endsAt: row?.deal_ends_at ?? null };
}

export type OrderEmail = { id: number; toEmail: string; subject: string; html: string; status: "enviado" | "simulado" | "error"; error: string | null; createdAt: string };

/** Correos que se le han mandado al cliente de este pedido (del más reciente al más antiguo). */
export async function getOrderEmails(orderId: number): Promise<OrderEmail[]> {
  const res = await (await db()).from("order_emails").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
  // Si todavía no se corre la parte nueva de schema.sql, la tabla no existe: no rompe la página
  if (res.error) return [];
  return (res.data ?? []).map((r) => ({
    id: r.id,
    toEmail: r.to_email,
    subject: r.subject,
    html: r.html,
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
  }));
}
