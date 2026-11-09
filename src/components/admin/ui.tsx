import Link from "next/link";
import type { Order, OrderChannel, OrderStatus, PaymentStatus } from "@/types";
import { cn } from "@/lib/format";
import { CHANNEL_LABEL, PAYMENT_STATUS_LABEL, statusLabel } from "@/lib/orders";

/** Piezas visuales compartidas por las pantallas del panel. */

export const adminInput =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] outline-none placeholder:text-dim focus:border-brand";

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-3xl border border-line bg-white", className)}>{children}</section>;
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-12 items-center gap-2 rounded-xl px-5 font-semibold",
        variant === "primary" ? "bg-brand text-white hover:bg-brand/90" : "border border-line bg-white hover:border-navy",
      )}
    >
      {children}
    </Link>
  );
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-accent/25 text-[#8a5a00]" },
  confirmado: { label: "Confirmado", className: "bg-brand-soft text-brand" },
  preparando: { label: "Preparando", className: "bg-[#efe9ff] text-[#5b3cc4]" },
  listo: { label: "Listo / En camino", className: "bg-[#e3f4fb] text-[#0b6e99]" },
  entregado: { label: "Entregado", className: "bg-ok-soft text-ok" },
  cancelado: { label: "Cancelado", className: "bg-danger-soft text-danger" },
};

export function StatusPill({ status, delivery }: { status: OrderStatus; delivery?: Order["delivery"] }) {
  const s = ORDER_STATUS[status];
  const label = status === "nuevo" ? s.label : statusLabel(status, delivery);
  return <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold", s.className)}>{label}</span>;
}

const PAYMENT_PILL: Record<PaymentStatus, string> = {
  pendiente: "bg-surface text-muted ring-1 ring-line",
  por_confirmar: "bg-accent/25 text-[#8a5a00]",
  pagado: "bg-ok-soft text-ok",
};

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold", PAYMENT_PILL[status])}>
      {status === "pagado" ? "✓ Pagado" : PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

/** Colores de canal: los mismos que usan las gráficas de Reportes. */
export const CHANNEL_COLOR: Record<OrderChannel, string> = { en_linea: "#1f4fd8", tienda: "#d97706" };

export function ChannelPill({ channel }: { channel: OrderChannel }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted">
      <span className="size-2.5 rounded-full" style={{ background: CHANNEL_COLOR[channel] }} aria-hidden />
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

export function StockPill({ stock, threshold = 3 }: { stock: number; threshold?: number }) {
  if (stock <= 0) return <span className="rounded-full bg-danger-soft px-3 py-1 text-[13px] font-bold text-danger">Agotado</span>;
  if (stock <= threshold)
    return <span className="rounded-full bg-accent/25 px-3 py-1 text-[13px] font-bold text-[#8a5a00]">Poco stock</span>;
  return null;
}
