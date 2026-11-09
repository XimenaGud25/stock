"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/format";

/** Copia un texto al portapapeles y muestra "Copiado" un momento. */
export function CopyButton({ value, label = "Copiar", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* el navegador no dio permiso: el texto sigue visible para copiarlo a mano */
        }
      }}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
        copied ? "bg-ok-soft text-ok" : "bg-white text-brand ring-1 ring-line hover:ring-brand",
        className,
      )}
      aria-label={`${label}: ${value}`}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copiado" : label}
    </button>
  );
}
