"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, CreditCard, Mail, Undo2 } from "lucide-react";
import type { Order, PaymentMethod } from "@/types";
import { setPayment } from "@/app/admin/actions";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/orders";
import { BANK_ACCOUNT } from "@/lib/data/payment";
import { PaymentPill } from "./ui";

type Props = { order: Pick<Order, "id" | "status" | "total" | "paymentMethod" | "paymentStatus" | "paidAt" | "createdAt" | "paymentRef" | "email"> };

/** Cómo se cobró realmente. "Pago en sucursal" se convierte en efectivo o tarjeta al cobrar. */
const COLLECT: PaymentMethod[] = ["transferencia", "efectivo", "tarjeta"];

export function PaymentCard({ order }: Props) {
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod === "en_sucursal" || !order.paymentMethod ? "efectivo" : order.paymentMethod);
  const [error, setError] = useState<string>();
  const [ok, setOk] = useState<string>();
  const online = order.paymentMethod === "en_linea";
  const [pending, start] = useTransition();
  const cancelled = order.status === "cancelado";
  const paid = order.paymentStatus === "pagado";
  const hoursWaiting = (Date.now() - Date.parse(order.createdAt)) / 3600000;
  const overdue = !paid && !cancelled && order.paymentMethod === "transferencia" && hoursWaiting > BANK_ACCOUNT.holdHours;

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const res = await fn();
      setError(res.error);
      setOk((res as { ok?: string }).ok);
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <PaymentPill status={order.paymentStatus} />
        <span className="font-display text-xl font-bold text-navy">{formatPrice(order.total)}</span>
      </div>
      <p className="text-sm text-muted">
        El cliente eligió: <b className="text-ink">{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "—"}</b>
      </p>

      {order.paymentRef && (
        <p className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 font-mono text-sm text-muted">
          <CreditCard className="size-4 shrink-0" /> {order.paymentRef}
        </p>
      )}

      {order.paymentStatus === "por_confirmar" && online && (
        <p className="rounded-xl bg-accent/20 px-4 py-3 text-sm text-[#8a5a00]">
          El cliente pagó en línea (modo de prueba). Revisa que el cobro esté bien y confírmalo: le llega un correo de “Pago confirmado”.
        </p>
      )}
      {order.paymentStatus === "por_confirmar" && !online && (
        <p className="rounded-xl bg-accent/20 px-4 py-3 text-sm text-[#8a5a00]">
          El cliente avisó que ya pagó. Revisa tu banco o el comprobante que mandó por WhatsApp y confírmalo aquí.
        </p>
      )}
      {overdue && (
        <p className="flex gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Lleva más de {BANK_ACCOUNT.holdHours} h sin pago. Puedes escribirle al cliente o cancelar el pedido para liberar el stock.
        </p>
      )}

      {paid ? (
        <div className="space-y-3">
          <p className="flex items-start gap-3 rounded-xl bg-ok-soft px-4 py-3 text-ok">
            <BadgeCheck className="mt-0.5 size-5 shrink-0" />
            <span>
              <b className="block">Cobrado · {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : ""}</b>
              {order.paidAt && <span className="text-sm">{formatDate(order.paidAt)}</span>}
            </span>
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => confirm("¿Regresar este pago a pendiente?") && run(() => setPayment(order.id, "pendiente"))}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger disabled:opacity-50"
          >
            <Undo2 className="size-4" /> Me equivoqué, deshacer pago
          </button>
        </div>
      ) : cancelled ? (
        <p className="text-sm text-muted">Pedido cancelado: no hay nada que cobrar.</p>
      ) : online ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setPayment(order.id, "pagado", "en_linea"))}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ok font-semibold text-white hover:brightness-95 disabled:opacity-50"
        >
          <BadgeCheck className="size-5" /> {pending ? "Guardando…" : "Pago confirmado"}
        </button>
      ) : (
        <div className="space-y-3">
          <span className="text-sm font-semibold">¿Cómo te pagó?</span>
          <div className="grid grid-cols-3 gap-2">
            {COLLECT.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-xl border-[1.5px] px-2 py-2.5 text-sm font-semibold",
                  method === m ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-navy",
                )}
              >
                {PAYMENT_LABEL[m]}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setPayment(order.id, "pagado", method))}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ok font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            <BadgeCheck className="size-5" /> {pending ? "Guardando…" : `Marcar como pagado (${formatPrice(order.total)})`}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {ok && !error && <p className="text-sm font-medium text-ok">✓ {ok}</p>}
      {!paid && !cancelled && order.email && (
        <p className="flex items-center gap-1.5 text-xs text-dim">
          <Mail className="size-3.5" /> Al confirmar el pago le avisamos a {order.email}
        </p>
      )}
    </div>
  );
}
