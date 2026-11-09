import "server-only";
/**
 * Correos al cliente cuando su pedido avanza (recibido, pago confirmado, preparando, enviado…).
 *
 * - Con RESEND_API_KEY en .env.local se mandan de verdad (https://resend.com, 3,000 gratis al mes).
 * - Sin la llave quedan en MODO PRUEBA: no sale nada, pero se guardan y se pueden ver
 *   en el panel, dentro de cada pedido ("Correos al cliente").
 *
 * Nunca truena: si el correo falla, el cambio del pedido ya quedó guardado igual.
 */
import type { Order, OrderStatus } from "@/types";
import { adminDb } from "./supabase/admin";
import { rowToOrder } from "./db";
import { getBranches } from "./api";
import { formatPrice } from "./format";
import { PAYMENT_LABEL, statusLabel, statusMessage } from "./orders";
import { trackingUrl } from "./site";

export type EmailEvent =
  | { type: "recibido" }
  | { type: "pago" }
  | { type: "estado"; status: OrderStatus; note?: string | null; noteOnly?: boolean };

export type EmailResult = { to: string; status: "enviado" | "simulado" | "error" } | null;

const STORE = "Stock Herramienta";
const FROM = () => process.env.EMAIL_FROM || `${STORE} <onboarding@resend.dev>`;

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Asunto, título y texto principal según lo que pasó. */
function content(order: Order, event: EmailEvent, branchName: string) {
  const n = `#${order.id}`;
  if (event.type === "recibido") {
    const pay =
      order.paymentMethod === "en_linea"
        ? `Recibimos tu pago en línea por ${formatPrice(order.total)}. Lo verificamos y te confirmamos por este medio.`
        : `Pagas ${formatPrice(order.total)} al recoger en ${branchName}, en efectivo o con tarjeta.`;
    return { subject: `Recibimos tu pedido ${n}`, title: `¡Gracias por tu compra, ${firstName(order.customerName)}!`, body: [`Tu número de pedido es <b>${n}</b>.`, pay] };
  }
  if (event.type === "pago") {
    return {
      subject: `Pago confirmado · Pedido ${n}`,
      title: "Tu pago está confirmado",
      body: [`Confirmamos tu pago de <b>${formatPrice(order.total)}</b> del pedido ${n}.`, "Te avisaremos por correo en cuanto empecemos a preparar tu herramienta."],
    };
  }
  const { status, note } = event;
  const noteHtml = note ? [`<span style="display:block;background:#f2f4f8;border-radius:10px;padding:12px 14px">${esc(note)}</span>`] : [];
  if (event.noteOnly) {
    // Mismo estado con una nota nueva (ej. número de guía)
    return { subject: `Novedades de tu pedido ${n}`, title: "Tenemos novedades de tu pedido", body: [`Tu pedido sigue en: <b>${statusLabel(status, order.delivery)}</b>.`, ...noteHtml] };
  }
  const subjects: Record<OrderStatus, string> = {
    nuevo: `Tu pedido ${n} fue recibido`,
    confirmado: `Tu pedido ${n} está confirmado`,
    preparando: `Estamos preparando tu pedido ${n}`,
    listo: order.delivery === "envio" ? `Tu pedido ${n} va en camino 🚚` : `Tu pedido ${n} está listo para recoger`,
    entregado: `Tu pedido ${n} fue entregado`,
    cancelado: `Tu pedido ${n} fue cancelado`,
  };
  const extra =
    status === "cancelado" && order.paymentStatus === "pagado"
      ? ["Como ya habías pagado, te contactaremos para hacerte el reembolso."]
      : status === "listo" && order.delivery === "recoger"
        ? [`Pasa a ${esc(branchName)} y muestra tu número de pedido <b>${n}</b>.`]
        : [];
  return { subject: subjects[status], title: statusLabel(status, order.delivery), body: [statusMessage(status, order.delivery), ...extra, ...noteHtml] };
}

function render(order: Order, c: ReturnType<typeof content>, link: string, branchName: string) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e9f0">${i.quantity} × ${esc(i.name)} <span style="color:#8a93a6">(${esc(i.brand)})</span></td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #e6e9f0;text-align:right;white-space:nowrap">${formatPrice(i.price * i.quantity)}</td></tr>`,
    )
    .join("");
  const delivery = order.delivery === "recoger" ? `Recoger en ${esc(branchName)}` : `Envío a ${esc(order.address ?? "")}`;
  const payment = order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—";

  return `<!doctype html><html><body style="margin:0;background:#f2f4f8;font-family:Arial,Helvetica,sans-serif;color:#1b2333">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
  <tr><td style="background:#0f1f4b;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">${STORE}</td></tr>
  <tr><td style="padding:28px">
    <p style="margin:0 0 4px;color:#1f4fd8;font-size:14px;font-weight:bold">Pedido #${order.id}</p>
    <h1 style="margin:0 0 16px;font-size:24px;color:#0f1f4b">${esc(c.title)}</h1>
    ${c.body.map((p) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.5">${p}</p>`).join("")}
    <p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#ffc21a;color:#0f1f4b;font-weight:bold;text-decoration:none;padding:14px 22px;border-radius:12px">Ver mi pedido</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
      <tr><td style="padding:12px 0;font-weight:bold">Total (IVA incluido)</td><td style="padding:12px 0;text-align:right;font-weight:bold;font-size:18px">${formatPrice(order.total)}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#5b6478">Entrega: ${delivery}<br>Pago: ${payment}</p>
  </td></tr>
  <tr><td style="padding:16px 28px;background:#f7f8fb;font-size:12px;color:#8a93a6">Recibiste este correo porque hiciste un pedido en ${STORE}.</td></tr>
</table></td></tr></table></body></html>`;
}

async function deliver(to: string, subject: string, html: string): Promise<{ status: "enviado" | "simulado" | "error"; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[correo · modo prueba] Para: ${to} · ${subject}`);
    return { status: "simulado" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to: [to], subject, html }),
    });
    if (res.ok) return { status: "enviado" };
    return { status: "error", error: `${res.status}: ${(await res.text()).slice(0, 300)}` };
  } catch (e) {
    return { status: "error", error: (e as Error).message };
  }
}

/** Manda (o simula) el correo del pedido y lo deja registrado. */
export async function notifyOrder(orderId: number, event: EmailEvent): Promise<EmailResult> {
  try {
    const db = adminDb();
    const { data } = await db.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
    if (!data) return null;
    const order = rowToOrder(data);
    if (!order.email || order.channel !== "en_linea") return null;

    const branches = await getBranches();
    const branchName = (branches.find((b) => b.id === order.branchId) ?? branches[0])?.name ?? "sucursal";
    const c = content(order, event, branchName);
    const html = render(order, c, await trackingUrl(order.trackingToken), branchName);
    const sent = await deliver(order.email, c.subject, html);
    if (sent.status === "error") console.error(`[correo] No se pudo enviar a ${order.email}: ${sent.error}`);

    await db.from("order_emails").insert({ order_id: orderId, to_email: order.email, subject: c.subject, html, status: sent.status, error: sent.error ?? null });
    return { to: order.email, status: sent.status };
  } catch (e) {
    console.error("[correo]", e);
    return null;
  }
}

/** Texto corto para avisarle al personal qué pasó con el correo. */
export function emailNotice(r: EmailResult) {
  if (!r) return "";
  if (r.status === "enviado") return ` · Correo enviado a ${r.to}`;
  if (r.status === "simulado") return ` · Correo a ${r.to} (modo prueba, no salió)`;
  return ` · ⚠️ No se pudo enviar el correo a ${r.to}`;
}
