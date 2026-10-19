"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/types";
import { setOrderStatus } from "@/app/admin/actions";
import { cn } from "@/lib/format";
import { ORDER_STATUS } from "./ui";

const HINTS: Record<OrderStatus, string> = {
  nuevo: "Recién llegó; falta confirmar pago o existencias.",
  confirmado: "Ya se confirmó con el cliente.",
  entregado: "El cliente ya recibió su herramienta.",
  cancelado: "Las piezas regresan al stock automáticamente.",
};

export function OrderStatusForm({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const change = (next: OrderStatus) => {
    if (next === current) return;
    if (next === "cancelado" && !confirm("¿Cancelar este pedido? Las piezas se regresarán al stock.")) return;
    start(async () => {
      const res = await setOrderStatus(orderId, next);
      setError(res.error);
      if (!res.error) setCurrent(next);
    });
  };

  return (
    <div className="space-y-2">
      {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          onClick={() => change(s)}
          className={cn(
            "w-full rounded-xl border-[1.5px] px-4 py-3 text-left disabled:opacity-60",
            current === s ? "border-brand bg-brand-soft" : "border-line hover:border-navy",
          )}
        >
          <span className="block font-semibold">{ORDER_STATUS[s].label}</span>
          <span className="text-sm text-muted">{HINTS[s]}</span>
        </button>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
