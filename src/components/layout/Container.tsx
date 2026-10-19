import { cn } from "@/lib/format";

/** Ancho máximo de contenido: 1600px con márgenes laterales generosos (diseño 1920). */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1600px] px-6 lg:px-10", className)}>{children}</div>;
}
