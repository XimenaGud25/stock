"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isTrackingToken } from "@/lib/orders";
import { findTrackingToken } from "@/lib/tracking";
import { notifyOrder } from "@/lib/email";

export type LookupState = { error?: string };

/** "Mi pedido": busca con número de pedido + teléfono y lleva a la página de seguimiento. */
export async function lookupOrder(_prev: LookupState, fd: FormData): Promise<LookupState> {
  const orderId = Number(String(fd.get("order") ?? "").replace(/\D/g, ""));
  const phone = String(fd.get("phone") ?? "").replace(/\D/g, "");
  if (!orderId) return { error: "Escribe tu número de pedido." };
  if (phone.length !== 10) return { error: "El teléfono debe tener 10 dígitos." };
  if (!isSupabaseConfigured) return { error: "El seguimiento en línea todavía no está disponible." };

  const token = await findTrackingToken(orderId, phone);
  if (!token) return { error: "No encontramos un pedido con esos datos. Revisa el número y el teléfono con el que compraste." };
  redirect(`/seguimiento/${token}`);
}

export type CancelState = { error?: string; ok?: boolean };

/** El cliente cancela su pedido (solo si aún no se empieza a preparar). */
export async function cancelMyOrder(_prev: CancelState, fd: FormData): Promise<CancelState> {
  const token = String(fd.get("token") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
  if (!isTrackingToken(token)) return { error: "Enlace de seguimiento inválido." };

  const { data, error } = await adminDb().rpc("customer_cancel_order", { p_token: token, p_reason: reason });
  if (error) return { error: error.message };
  await notifyOrder(data as number, { type: "estado", status: "cancelado", note: reason || null });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** El cliente avisa que ya hizo la transferencia: el pago queda "por confirmar" para la tienda. */
export async function reportMyPayment(token: string): Promise<{ error?: string }> {
  if (!isTrackingToken(token)) return { error: "Enlace de seguimiento inválido." };
  const { error } = await adminDb().rpc("customer_report_payment", { p_token: token });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
