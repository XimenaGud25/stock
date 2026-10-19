import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { StoreShell } from "@/components/layout/StoreShell";

export default function NotFound() {
  return (
    <StoreShell>
      <Container className="flex flex-col items-center gap-5 py-32 text-center">
        <p className="font-display text-7xl font-bold text-line">404</p>
        <h1 className="font-display text-4xl font-bold text-navy">No encontramos esta página</h1>
        <p className="text-lg text-muted">Puede que el producto ya no esté disponible.</p>
        <Link href="/catalogo" className="rounded-2xl bg-brand px-8 py-4 font-semibold text-white hover:bg-brand/90">
          Ir al catálogo
        </Link>
      </Container>
    </StoreShell>
  );
}
