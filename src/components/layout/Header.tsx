"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/components/cart/CartProvider";
import { cn, formatPrice } from "@/lib/format";

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/#mayoreo", label: "Mayoreo" },
  { href: "/sucursales", label: "Sucursales" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  if (href === "/catalogo") return pathname.startsWith("/catalogo") || pathname.startsWith("/producto");
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const { count, subtotal, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-6 py-5 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative pb-1.5 text-[17px] transition-colors",
                  active ? "font-semibold text-navy" : "font-medium text-muted hover:text-navy",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 mx-auto h-[3px] w-6 rounded-full bg-accent transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <form action="/catalogo" className="hidden xl:block">
            <label className="flex h-[52px] w-[380px] items-center gap-3 rounded-2xl border border-line bg-surface px-5 focus-within:border-brand">
              <Search className="size-5 text-dim" />
              <input
                name="q"
                type="search"
                placeholder="Buscar herramienta, marca o modelo…"
                className="w-full bg-transparent text-base outline-none placeholder:text-dim"
              />
            </label>
          </form>
          <Link
            href="#"
            className="hidden h-[52px] items-center gap-2.5 rounded-2xl border border-line px-4 text-[15px] font-medium hover:bg-surface md:flex"
          >
            <User className="size-5" /> Mi cuenta
          </Link>
          <button
            type="button"
            onClick={open}
            className="flex h-[52px] items-center gap-2.5 rounded-2xl bg-brand px-5 font-semibold text-white hover:bg-brand/90"
          >
            <ShoppingCart className="size-5" />
            <span>{formatPrice(subtotal)}</span>
            <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-navy">{count}</span>
          </button>
        </div>
      </div>

      {/* Menú en pantallas chicas */}
      <nav className="flex gap-6 overflow-x-auto border-t border-line px-6 py-3 lg:hidden" aria-label="Principal móvil">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("whitespace-nowrap text-[15px]", isActive(pathname, item.href) ? "font-semibold text-navy" : "text-muted")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
