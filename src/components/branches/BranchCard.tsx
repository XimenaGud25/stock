import { Check, Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { Branch } from "@/types";
import { OpenNowBadge } from "./OpenNowBadge";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Agrupa días seguidos con el mismo horario: "Lunes a viernes 8:00 – 19:00". */
function groupHours(hours: Branch["hours"]) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const fmt = (d: number) => {
    const h = hours[d];
    return h ? `${h.open} – ${h.close}` : "Cerrado";
  };
  const groups: { from: number; to: number; text: string }[] = [];
  for (const d of order) {
    const last = groups[groups.length - 1];
    if (last && last.text === fmt(d)) last.to = d;
    else groups.push({ from: d, to: d, text: fmt(d) });
  }
  return groups.map((g) => ({
    days: g.from === g.to ? DAY_NAMES[g.from] : `${DAY_NAMES[g.from]} a ${DAY_NAMES[g.to].toLowerCase()}`,
    text: g.text,
  }));
}

export function BranchCard({ branch }: { branch: Branch }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.mapQuery)}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(branch.mapQuery)}&output=embed`;
  const tel = branch.phone.replace(/\D/g, "");

  return (
    <article className="flex flex-col overflow-hidden rounded-[32px] border border-line bg-white">
      <iframe
        title={`Mapa de ${branch.name}`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[340px] w-full border-0 bg-[#e7edf6]"
      />

      <div className="flex flex-1 flex-col gap-7 p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-brand">
              {branch.tag}
            </span>
            <h2 className="pt-1 font-display text-4xl font-bold text-navy">{branch.name}</h2>
          </div>
          <OpenNowBadge hours={branch.hours} />
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <ul className="space-y-5">
            <InfoRow icon={MapPin} label="Dirección">
              {branch.address}
              <br />
              {branch.city} · C.P. {branch.postalCode}
            </InfoRow>
            <InfoRow icon={Phone} label="Teléfono">
              {branch.phone}
            </InfoRow>
            <InfoRow icon={MessageCircle} label="WhatsApp">
              {branch.whatsapp.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}
            </InfoRow>
          </ul>

          <div className="rounded-[20px] bg-surface px-6 py-5">
            <p className="flex items-center gap-2.5 pb-3 font-bold text-navy">
              <Clock className="size-[18px]" /> Horario
            </p>
            <dl>
              {groupHours(branch.hours).map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-2.5 text-[15px]">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className={`font-semibold ${h.text === "Cerrado" ? "text-danger" : ""}`}>{h.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {branch.services.map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium">
              <Check className="size-3.5 text-ok" strokeWidth={3} /> {s}
            </li>
          ))}
        </ul>

        <div className="mt-auto grid gap-3.5 sm:grid-cols-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-brand font-bold text-white hover:bg-brand/90"
          >
            <Navigation className="size-[18px]" /> Cómo llegar
          </a>
          <a
            href={`tel:+52${tel}`}
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-line font-bold text-navy hover:border-navy"
          >
            <Phone className="size-[18px]" /> Llamar
          </a>
          <a
            href={`https://wa.me/52${branch.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#25d366] font-bold text-white hover:brightness-95"
          >
            <MessageCircle className="size-[18px]" /> WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-[13px] font-medium text-dim">{label}</span>
        <span className="block font-semibold leading-6">{children}</span>
      </span>
    </li>
  );
}
