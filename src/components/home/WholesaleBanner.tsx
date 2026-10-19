import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";

export function WholesaleBanner() {
  return (
    <Container className="py-28">
      <section
        id="mayoreo"
        className="flex scroll-mt-32 flex-wrap items-center justify-between gap-10 rounded-[32px] bg-accent px-10 py-16 lg:px-20"
      >
        <div className="space-y-4">
          <p className="text-sm font-bold tracking-[0.18em] text-navy">MAYOREO STOCK</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-navy lg:text-5xl">Lleva 5 o más piezas y ahorra 12%</h2>
          <p className="max-w-[640px] text-lg leading-8 text-[#3b3a2e]">
            Aplica en toda la herramienta eléctrica. Ideal para contratistas, talleres y constructoras.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* TODO backend: formulario de cotización (POST /quotes) */}
          <Link href="/sucursales" className="flex items-center gap-2.5 rounded-2xl bg-navy px-8 py-5 text-[17px] font-semibold text-white hover:bg-navy/90">
            Cotizar lote <ArrowRight className="size-5" />
          </Link>
          <Link
            href="/sucursales"
            className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-navy px-8 py-5 text-[17px] font-semibold text-navy hover:bg-navy/5"
          >
            <Phone className="size-5" /> Hablar con un asesor
          </Link>
        </div>
      </section>
    </Container>
  );
}
