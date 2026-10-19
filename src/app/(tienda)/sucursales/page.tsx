import type { Metadata } from "next";
import { Bell, ShoppingCart, Store } from "lucide-react";
import { getBranches } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BranchCard } from "@/components/branches/BranchCard";

export const metadata: Metadata = { title: "Sucursales" };

const steps = [
  { icon: ShoppingCart, title: "Compra en línea", text: "Agrega tus herramientas y elige “Recoger en sucursal” al pagar." },
  { icon: Bell, title: "Te avisamos", text: "Recibes un mensaje cuando tu pedido está listo, normalmente el mismo día." },
  { icon: Store, title: "Recoge tu pedido", text: "Muestra tu número de pedido en mostrador y llévatelo con tu factura." },
];

export default async function BranchesPage() {
  const branches = await getBranches();

  return (
    <>
      <Container className="space-y-3.5 pb-10 pt-12">
        <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Sucursales" }]} />
        <h1 className="font-display text-5xl font-bold tracking-tight text-navy lg:text-[52px]">Nuestras sucursales</h1>
        <p className="text-lg text-muted">
          Visítanos en cualquiera de nuestras {branches.length} tiendas o compra en línea y recoge sin costo.
        </p>
      </Container>

      <Container className="grid gap-10 xl:grid-cols-2">
        {branches.map((b) => (
          <BranchCard key={b.id} branch={b} />
        ))}
      </Container>

      <Container className="space-y-9 py-28">
        <SectionHeading eyebrow="COMPRA EN LÍNEA" title="Recoge en sucursal sin costo" />
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="space-y-5 rounded-[28px] border border-line bg-white p-9">
              <div className="flex items-center justify-between">
                <span className="grid size-[60px] place-items-center rounded-2xl bg-navy text-accent">
                  <Icon className="size-7" />
                </span>
                <span className="font-display text-6xl font-bold text-line">{i + 1}</span>
              </div>
              <h3 className="text-[22px] font-bold text-navy">{title}</h3>
              <p className="leading-7 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
