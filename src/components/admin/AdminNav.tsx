"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutDashboard, LogOut, Package, ShoppingBag, Tag } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { cn } from "@/lib/format";

export function AdminNav({ email, newOrders, lowStock }: { email: string; newOrders: number; lowStock: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Resumen", Icon: LayoutDashboard, count: 0 },
    { href: "/admin/productos", label: "Productos", Icon: Package, count: lowStock, warn: true },
    { href: "/admin/pedidos", label: "Pedidos", Icon: ShoppingBag, count: newOrders },
    { href: "/admin/ofertas", label: "Ofertas", Icon: Tag, count: 0 },
  ];
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-30 border-b border-white/10 bg-navy text-[#c9d3ee] lg:h-screen lg:border-b-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:block lg:space-y-8 lg:py-8">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent font-display text-xl font-bold text-navy">S</span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-[0.08em] text-white">STOCK</span>
            <span className="block text-[11px] font-semibold tracking-[0.2em] text-[#a9b6da]">PANEL</span>
          </span>
        </Link>
        <form action={signOut} className="lg:hidden">
          <button className="flex items-center gap-2 text-sm font-medium hover:text-white" aria-label="Cerrar sesión">
            <LogOut className="size-4" /> Salir
          </button>
        </form>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 sm:px-4 lg:flex-col lg:px-4 lg:pb-0" aria-label="Panel">
        {items.map(({ href, label, Icon, count, warn }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium",
              active(href) ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-5" />
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "ml-auto rounded-md px-2 py-0.5 text-xs font-bold",
                  warn ? "bg-danger text-white" : "bg-accent text-navy",
                )}
                title={warn ? "Productos con poco stock" : "Pedidos nuevos"}
              >
                {count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="hidden space-y-3 px-8 pt-10 text-sm lg:block">
        <Link href="/" target="_blank" className="flex items-center gap-2 hover:text-white">
          <ExternalLink className="size-4" /> Ver tienda
        </Link>
        <p className="truncate text-[#8594c0]" title={email}>
          {email}
        </p>
        <form action={signOut}>
          <button className="flex items-center gap-2 hover:text-white">
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
