"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { setOrderStatus } from "@/app/admin/actions";
import { cn } from "@/lib/format";
import { ALL_STATUSES, customerUpdateMessage, paymentBlocks, STATUS_HINTS, statusLabel } from "@/lib/orders";
import { adminInput } from "./ui";

type Props = {
  order: Pick<Order, "id" | "status" | "delivery" | "customerName" | "phone" | "email" | "channel" | "paymentStatus" | "paymentMethod">;
  trackingUrl: string;
};

export function OrderStatusForm({ order, trackingUrl }: Props) {
  const [current, setCurrent] = useState(order.status);
  const [selected, setSelected] = useState(order.status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  // Último cambio guardado: sirve para armar el aviso por WhatsApp
  const [saved, setSaved] = useState<{ status: OrderStatus; note: string; message: string } | null>(null);
  const [pending, start] = useTransition();

  const changed = selected !== current;
  const canSave = changed || note.trim() !== "";

  const save = () => {
    if (!canSave) return;
    if (selected === "cancelado" && changed && !confirm("¿Cancelar este pedido? Las piezas se regresarán al stock.")) return;
    start(async () => {
      const res = await setOrderStatus(order.id, selected, note);
      setError(res.error);
      if (!res.error) {
        setCurrent(selected);
        setSaved({ status: selected, note: note.trim(), message: res.ok ?? "Guardado" });
        setNote("");
      }
    });
  };

  const whatsapp =
    saved && order.phone
      ? `https://wa.me/52${order.phone}?text=${encodeURIComponent(customerUpdateMessage(order, saved.status, trackingUrl, saved.note))}`
      : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ALL_STATUSES.map((s) => {
          const blocked = s !== current ? paymentBlocks(order, s) : null;
          return (
          <button
            key={s}
            type="button"
            disabled={pending || !!blocked}
            title={blocked ?? undefined}
            onClick={() => setSelected(s)}
            className={cn(
              "w-full rounded-xl border-[1.5px] px-4 py-3 text-left disabled:opacity-60",
              selected === s ? (s === "cancelado" ? "border-danger bg-danger-soft" : "border-brand bg-brand-soft") : "border-line hover:border-navy",
            )}
          >
            <span className="flex items-center justify-between gap-2 font-semibold">
              {statusLabel(s, order.delivery)}
              {current === s && <span className="text-xs font-bold uppercase tracking-wider text-brand">Actual</span>}
            </span>
            <span className={cn("text-sm", blocked ? "font-medium text-[#8a5a00]" : "text-muted")}>{blocked ? `🔒 ${blocked}` : STATUS_HINTS[s]}</span>
          </button>
          );
        })}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">Nota para el cliente (opcional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={order.delivery === "envio" ? "Ej. Paquetería Estafeta, guía 1234567890" : "Ej. Ya puedes pasar después de las 4 pm"}
          className={cn(adminInput, "h-auto py-3")}
        />
        <span className="block text-xs text-dim">
          Aparece en la página de seguimiento{order.email ? " y en el correo que le llega al cliente" : ""}.
        </span>
      </label>

      <button
        type="button"
        onClick={save}
        disabled={pending || !canSave}
        className="h-12 w-full rounded-xl bg-brand font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
      >
        {pending ? "Guardando…" : changed ? `Cambiar a “${statusLabel(selected, order.delivery)}”` : "Agregar nota"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}

      {saved && (
        <div className="space-y-3 rounded-xl bg-ok-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ok">
            <CheckCircle2 className="size-4 shrink-0" /> {saved.message}
          </p>
          {whatsapp && <p className="text-sm text-muted">¿Quieres avisarle también por WhatsApp?</p>}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25d366] font-bold text-white hover:brightness-95"
            >
              <MessageCircle className="size-5" /> Avisar por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
