"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { importSampleCatalog } from "@/app/admin/actions";

export function ImportSampleButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => importSampleCatalog())}
      className="flex h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-navy hover:brightness-95 disabled:opacity-60"
    >
      <Download className="size-5" /> {pending ? "Importando…" : `Importar los ${count} productos`}
    </button>
  );
}
