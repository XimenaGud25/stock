/** Estados, canales y textos de los pedidos. Lo usan la tienda (seguimiento) y el panel. */
import type { Order, OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

/** Orden en que avanza un pedido normal (cancelado queda aparte). */
export const STATUS_FLOW: OrderStatus[] = ["nuevo", "confirmado", "preparando", "listo", "entregado"];
export const ALL_STATUSES: OrderStatus[] = [...STATUS_FLOW, "cancelado"];

type Delivery = Order["delivery"];

/** Nombre corto del estado. "listo" cambia según si recoge o se le envía. */
export function statusLabel(status: OrderStatus, delivery?: Delivery) {
  switch (status) {
    case "nuevo":
      return "Recibido";
    case "confirmado":
      return "Confirmado";
    case "preparando":
      return "Preparando";
    case "listo":
      return delivery === "envio" ? "En camino" : delivery === "recoger" ? "Listo para recoger" : "Listo / En camino";
    case "entregado":
      return "Entregado";
    case "cancelado":
      return "Cancelado";
  }
}

/** Lo que significa cada estado, explicado al cliente. */
export function statusMessage(status: OrderStatus, delivery: Delivery) {
  switch (status) {
    case "nuevo":
      return "Recibimos tu pedido. Te avisaremos por correo cada vez que avance.";
    case "confirmado":
      return "Tu pedido está confirmado. Lo apartamos para ti.";
    case "preparando":
      return "Estamos revisando y empacando tu herramienta.";
    case "listo":
      return delivery === "envio"
        ? "Tu pedido ya va en camino a la dirección que nos diste."
        : "Tu pedido está listo. Puedes pasar a recogerlo a la sucursal en horario de atención.";
    case "entregado":
      return "Tu pedido fue entregado. ¡Gracias por tu compra!";
    case "cancelado":
      return "Este pedido fue cancelado y las piezas regresaron al inventario.";
  }
}

/** Indicaciones para el personal al elegir cada estado en el panel. */
export const STATUS_HINTS: Record<OrderStatus, string> = {
  nuevo: "Recién llegó; falta confirmar pago o existencias.",
  confirmado: "Ya se confirmó con el cliente.",
  preparando: "Se está surtiendo y empacando.",
  listo: "Listo en sucursal o ya salió a entrega.",
  entregado: "El cliente ya recibió su herramienta.",
  cancelado: "Las piezas regresan al stock automáticamente.",
};

/** El cliente puede cancelar por su cuenta solo antes de que se empiece a preparar. */
export const canCustomerCancel = (order: Pick<Order, "status" | "paymentStatus">) =>
  (order.status === "nuevo" || order.status === "confirmado") && order.paymentStatus !== "pagado";

export const CHANNEL_LABEL: Record<OrderChannel, string> = { en_linea: "En línea", tienda: "En tienda" };

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  en_sucursal: "Pago en sucursal",
  en_linea: "Pago en línea",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pendiente: "Pago pendiente",
  por_confirmar: "Pago por confirmar",
  pagado: "Pagado",
};

/**
 * ¿Se puede pasar a este estado sin pago registrado? Mismas reglas que la base de datos:
 * lo pagado en línea o por transferencia no se prepara sin confirmar el pago, y nada se entrega sin pago.
 */
export function paymentBlocks(order: Pick<Order, "channel" | "paymentStatus" | "paymentMethod">, next: OrderStatus) {
  if (order.channel !== "en_linea" || order.paymentStatus === "pagado") return null;
  if (next === "entregado") return "Primero registra el pago";
  if ((next === "preparando" || next === "listo") && (order.paymentMethod === "transferencia" || order.paymentMethod === "en_linea"))
    return "Primero confirma el pago";
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isTrackingToken = (v: string) => UUID.test(v);

/** Mensaje de WhatsApp que la tienda le manda al cliente cuando cambia su pedido. */
export function customerUpdateMessage(order: Pick<Order, "id" | "customerName" | "delivery">, status: OrderStatus, trackingUrl: string, note?: string) {
  return [
    `Hola ${order.customerName.split(" ")[0]}, te escribimos de Stock Herramienta.`,
    `Tu pedido #${order.id} ahora está: *${statusLabel(status, order.delivery)}*.`,
    statusMessage(status, order.delivery),
    ...(note ? ["", note] : []),
    "",
    `Puedes ver el seguimiento aquí: ${trackingUrl}`,
  ].join("\n");
}
