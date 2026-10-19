import Link from "next/link";
import type { Category } from "@/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function CategoryGrid({ categories, activeSlug }: { categories: Category[]; activeSlug?: string }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-7">
      {categories.map((c, i) => {
        const active = activeSlug ? c.slug === activeSlug : i === 0;
        return (
          <Link
            key={c.id}
            href={`/catalogo?categoria=${c.slug}`}
            className={`flex flex-col gap-6 rounded-[22px] p-7 transition hover:-translate-y-1 ${
              active ? "bg-navy text-white" : "border border-line bg-white hover:border-brand"
            }`}
          >
            <span className={`grid size-[60px] place-items-center rounded-2xl ${active ? "bg-accent text-navy" : "bg-brand-soft text-brand"}`}>
              <CategoryIcon icon={c.icon} className="size-7" />
            </span>
            <span>
              <span className="block text-[17px] font-semibold leading-6">{c.name}</span>
              <span className={`mt-1.5 block text-sm ${active ? "text-[#a9b6da]" : "text-muted"}`}>{c.productCount} productos</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
