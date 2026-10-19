import Link from "next/link";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/format";

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
  entregado: { label: "Entregado", className: "bg-ok-soft text-ok" },
  cancelado: { label: "Cancelado", className: "bg-danger-soft text-danger" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", s.className)}>{s.label}</span>;
}

export function StockPill({ stock, threshold = 3 }: { stock: number; threshold?: number }) {
  if (stock <= 0) return <span className="rounded-full bg-danger-soft px-3 py-1 text-[13px] font-bold text-danger">Agotado</span>;
  if (stock <= threshold)
    return <span className="rounded-full bg-accent/25 px-3 py-1 text-[13px] font-bold text-[#8a5a00]">Poco stock</span>;
  return null;
}
