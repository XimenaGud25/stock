import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2.5 text-[15px] font-medium">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-2.5">
            {item.href && !last ? (
              <Link href={item.href} className="text-muted hover:text-navy">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "font-semibold text-brand" : "text-muted"}>{item.label}</span>
            )}
            {!last && <ChevronRight className="size-3.5 text-dim" />}
          </span>
        );
      })}
    </nav>
  );
}
