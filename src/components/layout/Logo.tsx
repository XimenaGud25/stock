import Link from "next/link";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const light = variant === "light";
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Stock Herramienta Pro — Inicio">
      <span
        className={`grid size-12 place-items-center rounded-xl font-display text-2xl font-bold ${
          light ? "bg-accent text-navy" : "bg-navy text-accent"
        }`}
      >
        S
      </span>
      <span className="leading-none">
        <span className={`block font-display text-2xl font-bold tracking-[0.1em] ${light ? "text-white" : "text-navy"}`}>
          STOCK
        </span>
        <span className={`mt-1 block text-[11px] font-semibold tracking-[0.24em] ${light ? "text-[#a9b6da]" : "text-muted"}`}>
          HERRAMIENTA PRO
        </span>
      </span>
    </Link>
  );
}
