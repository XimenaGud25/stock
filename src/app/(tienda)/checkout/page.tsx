import type { Metadata } from "next";
import { getBranches } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata: Metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const branches = await getBranches();
  return (
    <Container className="space-y-8 pb-28 pt-9">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Finalizar pedido" }]} />
      <h1 className="font-display text-4xl font-bold tracking-tight text-navy lg:text-5xl">Finalizar pedido</h1>
      <CheckoutForm branches={branches.map((b) => ({ id: b.id, name: b.name, address: b.address }))} />
    </Container>
  );
}
