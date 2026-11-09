import type { Metadata } from "next";
import { MapPinned, MessageCircle, PackageCheck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TrackLookupForm } from "@/components/tracking/TrackLookupForm";

export const metadata: Metadata = { title: "Mi pedido", robots: { index: false } };

const tips = [
  { Icon: MapPinned, title: "Sigue cada paso", text: "Recibido, confirmado, en preparación, listo o en camino y entregado." },
  { Icon: PackageCheck, title: "Paga y avísanos", text: "Ve los datos para transferir y avísanos con un toque cuando ya pagaste." },
  { Icon: MessageCircle, title: "Te avisamos por WhatsApp", text: "Cada vez que tu pedido avance te mandamos el enlace actualizado." },
];

export default function TrackPage() {
  return (
    <Container className="space-y-8 pb-28 pt-9">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Mi pedido" }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_480px]">
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold tracking-tight text-navy lg:text-5xl">¿Dónde está mi pedido?</h1>
          <p className="max-w-xl text-lg text-muted">
            Escribe tu número de pedido y el teléfono con el que compraste. También puedes abrir el enlace de seguimiento que te enviamos por
            WhatsApp.
          </p>
          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {tips.map(({ Icon, title, text }) => (
              <li key={title} className="space-y-2 rounded-3xl border border-line bg-white p-5">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Icon className="size-5" />
                </span>
                <p className="font-semibold text-navy">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <section className="h-fit rounded-[28px] border border-line bg-white p-8">
          <TrackLookupForm />
        </section>
      </div>
    </Container>
  );
}
