import { Landmark } from "lucide-react";
import { BANK_ACCOUNT, formatClabe } from "@/lib/data/payment";
import { formatPrice } from "@/lib/format";
import { CopyButton } from "./CopyButton";

/** Datos para transferir: monto, CLABE y referencia, cada uno con botón de copiar. */
export function BankDetails({ orderId, total }: { orderId: number | null; total: number }) {
  const rows = [
    { label: "Monto exacto", value: formatPrice(total), copy: total.toFixed(2), strong: true },
    { label: "CLABE interbancaria", value: formatClabe(BANK_ACCOUNT.clabe), copy: BANK_ACCOUNT.clabe, mono: true },
    ...(orderId ? [{ label: "Concepto / referencia", value: `Pedido ${orderId}`, copy: `Pedido ${orderId}` }] : []),
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-5 text-left">
      <p className="flex items-center gap-2 font-semibold text-navy">
        <Landmark className="size-5 text-brand" /> {BANK_ACCOUNT.bank}
      </p>
      <p className="text-sm text-muted">
        A nombre de <b className="text-ink">{BANK_ACCOUNT.holder}</b>
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
            <span className="min-w-0">
              <span className="block text-xs font-medium text-dim">{r.label}</span>
              <span className={`block break-all ${r.strong ? "font-display text-xl font-bold text-navy" : "font-semibold"} ${r.mono ? "tabular-nums tracking-wide" : ""}`}>
                {r.value}
              </span>
            </span>
            <CopyButton value={r.copy} />
          </li>
        ))}
      </ul>
    </div>
  );
}
