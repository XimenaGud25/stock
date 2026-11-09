"use server";

import { revalidatePath } from "next/cache";
import type { CartItem } from "@/types";
import { getBranches } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminDb } from "@/lib/supabase/admin";
import { notifyOrder } from "@/lib/email";

export type CheckoutPayment = "en_linea" | "en_sucursal";

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      orderId: number | null;
      total: number;
      payment: CheckoutPayment;
      paymentRef: string | null;
      delivery: "recoger" | "envio";
      branchName: string;
      email: string;
      whatsappUrl: string;
      trackingPath: string | null;
    };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cobro en línea SIMULADO (solo pruebas): no se conecta a ningún banco.
 * El navegador solo manda los últimos 4 dígitos y la marca; el número completo nunca llega aquí.
 * La tarjeta de prueba 4000 0000 0000 0002 simula un rechazo.
 * Para cobrar de verdad, aquí se conecta la pasarela (Mercado Pago, Stripe, Openpay…).
 */
async function chargeMock(last4: string, brand: string, holder: string) {
  if (!/^\d{4}$/.test(last4) || holder.length < 3) return { ok: false as const, message: "Revisa los datos de la tarjeta." };
  if (last4 === "0002") return { ok: false as const, message: "Tu banco rechazó el pago (tarjeta de prueba de rechazo). Usa otra tarjeta." };
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return { ok: true as const, ref: `PRUEBA-${code} · ${brand} •••• ${last4}` };
}

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const name = text(fd, "name");
  const phone = text(fd, "phone").replace(/\D/g, "");
  const email = text(fd, "email").toLowerCase();
  const delivery = text(fd, "delivery") === "envio" ? "envio" : "recoger";
  const branchId = text(fd, "branch") || null;
  const notes = text(fd, "notes") || null;
  // A domicilio el pago siempre es en línea
  const payment: CheckoutPayment = delivery === "envio" || text(fd, "payment") !== "en_sucursal" ? "en_linea" : "en_sucursal";

  const addr = {
    street: text(fd, "street"),
    colony: text(fd, "colony"),
    city: text(fd, "city"),
    state: text(fd, "state"),
    zip: text(fd, "zip").replace(/\D/g, ""),
    refs: text(fd, "refs"),
  };
  const address =
    delivery === "envio"
      ? [addr.street, `Col. ${addr.colony}`, `${addr.city}, ${addr.state}`, `C.P. ${addr.zip}`, addr.refs && `Referencias: ${addr.refs}`].filter(Boolean).join(", ")
      : null;

  let cart: CartItem[] = [];
  try {
    cart = JSON.parse(text(fd, "items"));
  } catch {
    /* se valida abajo */
  }

  if (!cart.length) return { status: "error", message: "Tu carrito está vacío." };
  if (!EMAIL.test(email)) return { status: "error", message: "Escribe un correo válido." };
  if (name.length < 3) return { status: "error", message: "Escribe tu nombre completo." };
  if (phone.length !== 10) return { status: "error", message: "El teléfono debe tener 10 dígitos." };
  if (delivery === "envio" && (!addr.street || !addr.colony || !addr.city || !addr.state || addr.zip.length !== 5))
    return { status: "error", message: "Completa la dirección de envío (calle, colonia, ciudad, estado y C.P. de 5 dígitos)." };

  let paymentRef: string | null = null;
  if (payment === "en_linea") {
    const charge = await chargeMock(text(fd, "card_last4"), text(fd, "card_brand") || "Tarjeta", text(fd, "card_holder"));
    if (!charge.ok) return { status: "error", message: charge.message };
    paymentRef = charge.ref;
  }

  const branches = await getBranches();
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  let orderId: number | null = null;
  let token: string | null = null;
  let total = cart.reduce((n, i) => n + i.price * i.quantity, 0);

  if (isSupabaseConfigured) {
    const db = adminDb();
    const { data, error } = await db.rpc("create_order", {
      p_customer_name: name,
      p_phone: phone,
      p_email: email,
      p_delivery: delivery,
      p_branch_id: delivery === "recoger" ? branch.id : null,
      p_address: address,
      p_notes: notes,
      p_items: cart.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      p_channel: "en_linea",
      p_payment: payment,
      p_payment_ref: paymentRef,
    });
    if (error) return { status: "error", message: error.message };
    orderId = data as number;

    // Total real con el que quedó el pedido (precios de la base, no los del navegador)
    const order = await db.from("orders").select("tracking_token, total").eq("id", orderId).single<{ tracking_token: string; total: number | string }>();
    token = order.data?.tracking_token ?? null;
    if (order.data) total = Number(order.data.total);

    await notifyOrder(orderId, { type: "recibido" });
    revalidatePath("/", "layout");
  }

  const help = encodeURIComponent(orderId ? `Hola, tengo una duda sobre mi pedido #${orderId}.` : "Hola, tengo una duda sobre mi pedido.");
  return {
    status: "ok",
    orderId,
    total,
    payment,
    paymentRef,
    delivery,
    branchName: branch.name,
    email,
    whatsappUrl: `https://wa.me/52${branch.whatsapp}?text=${help}`,
    trackingPath: token ? `/seguimiento/${token}` : null,
  };
}
