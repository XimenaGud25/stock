"use client";

import { useEffect, useState } from "react";
import type { Branch } from "@/types";

/** Calcula si la sucursal está abierta según la hora de Ciudad de México. */
function isOpen(hours: Branch["hours"]) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const today = hours[now.getDay()];
  if (!today) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return minutes >= toMin(today.open) && minutes < toMin(today.close);
}

export function OpenNowBadge({ hours }: { hours: Branch["hours"] }) {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => setOpen(isOpen(hours)), [hours]);

  if (open === null) return <span className="h-9 w-32" />;
  return (
    <span
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${
        open ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"
      }`}
    >
      <span className={`size-2 rounded-full ${open ? "bg-ok" : "bg-danger"}`} />
      {open ? "Abierto ahora" : "Cerrado ahora"}
    </span>
  );
}
