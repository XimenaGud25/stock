import { MapPin, Receipt, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/layout/Container";

const benefits = [
  { icon: Truck, title: "Envío 24/48 h", text: "A obra o sucursal" },
  { icon: Receipt, title: "Facturación inmediata", text: "CFDI al momento de tu compra" },
  { icon: ShieldCheck, title: "Garantía de marca", text: "Distribuidor autorizado" },
  { icon: MapPin, title: "Envío nacional", text: "A toda la República" },
];

export function Benefits() {
  return (
    <Container className="pt-10">
      <ul className="grid gap-8 rounded-3xl border border-line bg-white px-12 py-8 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold">{title}</span>
              <span className="text-[15px] text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
