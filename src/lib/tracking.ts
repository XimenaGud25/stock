import "server-only";
/**
 * Lecturas para la página de seguimiento del cliente. No requieren sesión: el enlace
 * lleva un código secreto (tracking_token) que solo conoce quien hizo el pedido.
 */
import type { Order } from "@/types";
import { adminDb } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { rowToOrder } from "./db";
import { isTrackingToken } from "./orders";

const FIELDS = "*, order_items(*), order_events(*)";

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!isSupabaseConfigured || !isTrackingToken(token)) return null;
  const { data, error } = await adminDb().from("orders").select(FIELDS).eq("tracking_token", token).maybeSingle();
  if (error) throw new Error(`Error de base de datos: ${error.message}`);
  return data ? rowToOrder(data) : null;
}

/** Búsqueda manual: número de pedido + teléfono con el que se hizo. Devuelve el código de seguimiento. */
export async function findTrackingToken(orderId: number, phone: string): Promise<string | null> {
  if (!isSupabaseConfigured || !Number.isInteger(orderId) || orderId <= 0) return null;
  const { data } = await adminDb()
    .from("orders")
    .select("tracking_token")
    .eq("id", orderId)
    .eq("phone", phone)
    .eq("channel", "en_linea")
    .maybeSingle<{ tracking_token: string }>();
  return data?.tracking_token ?? null;
}
