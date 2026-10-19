import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  children?: React.ReactNode;
}

export function SectionHeading({ eyebrow, title, description, link, children }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="space-y-2.5">
        <p className="text-sm font-bold tracking-[0.18em] text-brand">{eyebrow}</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-navy lg:text-[44px]">{title}</h2>
        {description && <p className="text-lg text-muted">{description}</p>}
      </div>
      {link && (
        <Link href={link.href} className="flex items-center gap-2 text-[17px] font-semibold text-brand hover:underline">
          {link.label} <ArrowRight className="size-5" />
        </Link>
      )}
      {children}
    </div>
  );
}
