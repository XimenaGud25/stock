import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildQuery, type SearchParams } from "@/lib/filters";
import { cn } from "@/lib/format";

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  searchParams: SearchParams;
  basePath?: string;
}

export function Pagination({ page, totalPages, total, pageSize, searchParams, basePath = "/catalogo" }: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const href = (p: number) => `${basePath}${buildQuery(searchParams, { pagina: p > 1 ? String(p) : undefined })}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-white px-7 py-5">
      <p className="text-[15px] text-muted">
        Mostrando {from}–{to} de {total} productos
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-2" aria-label="Paginación">
          <PageLink href={href(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-4" /> Anterior
          </PageLink>
          {pageList(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="grid size-[46px] place-items-center text-muted">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "grid size-[46px] place-items-center rounded-xl text-[15px] font-semibold",
                  p === page ? "bg-navy text-white" : "border border-line hover:bg-surface",
                )}
              >
                {p}
              </Link>
            ),
          )}
          <PageLink href={href(page + 1)} disabled={page >= totalPages}>
            Siguiente <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const cls = "flex h-[46px] items-center gap-1.5 rounded-xl border border-line px-4 text-[15px] font-semibold";
  if (disabled) return <span className={cn(cls, "text-dim")}>{children}</span>;
  return (
    <Link href={href} className={cn(cls, "hover:bg-surface")}>
      {children}
    </Link>
  );
}
