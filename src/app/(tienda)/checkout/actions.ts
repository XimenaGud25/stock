"use server";

import { revalidatePath } from "next/cache";
import type { CartItem } from "@/types";
import { getBranches } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminDb } from "@/lib/supabase/admin";

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok"; orderId: number | null; whatsappUrl: string };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const name = text(fd, "name");
  const phone = text(fd, "phone").replace(/\D/g, "");
  const email = text(fd, "email") || null;
  const delivery = text(fd, "delivery") === "envio" ? "envio" : "recoger";
  const branchId = text(fd, "branch") || null;
  const address = text(fd, "address") || null;
  const notes = text(fd, "notes") || null;

  let cart: CartItem[] = [];
  try {
    cart = JSON.parse(text(fd, "items"));
  } catch {
    /* se valida abajo */
  }

  if (!cart.length) return { status: "error", message: "Tu carrito está vacío." };
  if (name.length < 3) return { status: "error", message: "Escribe tu nombre completo." };
  if (phone.length !== 10) return { status: "error", message: "El teléfono debe tener 10 dígitos." };
  if (delivery === "envio" && !address) return { status: "error", message: "Escribe la dirección de envío." };

  const branches = await getBranches();
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  let orderId: number | null = null;
  let lines = cart.map((i) => ({ name: i.name, brand: i.brand, price: i.price, quantity: i.quantity }));

  if (isSupabaseConfigured) {
    const db = adminDb();
    const { data, error } = await db.rpc("create_order", {
      p_customer_name: name,
      p_phone: phone,
      p_email: email,
      p_delivery: delivery,
      p_branch_id: delivery === "recoger" ? branch.id : null,
      p_address: delivery === "envio" ? address : null,
      p_notes: notes,
      p_items: cart.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    });
    if (error) return { status: "error", message: error.message };
    orderId = data as number;

    // Precios reales con los que quedó el pedido (no los del navegador)
    const items = await db.from("order_items").select("name, brand, price, quantity").eq("order_id", orderId);
    if (items.data) lines = items.data.map((i) => ({ ...i, price: Number(i.price) }));
    revalidatePath("/", "layout");
  }

  const total = lines.reduce((n, i) => n + i.price * i.quantity, 0);
  const message = [
    orderId ? `Hola, quiero confirmar mi pedido #${orderId}:` : "Hola, quiero hacer este pedido:",
    "",
    ...lines.map((i) => `• ${i.quantity} × ${i.name} (${i.brand}) — ${formatPrice(i.price * i.quantity)}`),
    "",
    `Total: ${formatPrice(total)} (IVA incluido)`,
    "",
    `Nombre: ${name}`,
    `Teléfono: ${phone}`,
    delivery === "recoger" ? `Entrega: Recoger en ${branch.name}` : `Entrega: Envío a ${address}`,
    ...(notes ? [`Notas: ${notes}`] : []),
  ].join("\n");

  return {
    status: "ok",
    orderId,
    whatsappUrl: `https://wa.me/52${branch.whatsapp}?text=${encodeURIComponent(message)}`,
  };
}
