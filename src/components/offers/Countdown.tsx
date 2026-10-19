"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    días: Math.floor(ms / 86_400_000),
    horas: Math.floor(ms / 3_600_000) % 24,
    min: Math.floor(ms / 60_000) % 60,
    seg: Math.floor(ms / 1000) % 60,
  };
}

/** Contador regresivo. Se calcula solo en el navegador para evitar diferencias con el servidor. */
export function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [time, setTime] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = ["días", "horas", "min", "seg"] as const;

  return (
    <div className="flex gap-3" role="timer" aria-live="off">
      {units.map((u) => (
        <div key={u} className="grid h-28 w-26 place-content-center rounded-[18px] border border-white/20 bg-white/10 text-center">
          <span className="font-display text-[44px] font-bold leading-none text-white tabular-nums">
            {time ? String(time[u]).padStart(2, "0") : "--"}
          </span>
          <span className="mt-1.5 text-sm font-medium text-[#a9b6da]">{u}</span>
        </div>
      ))}
    </div>
  );
}
