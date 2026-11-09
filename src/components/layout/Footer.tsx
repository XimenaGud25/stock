import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";

const columns = [
  {
    title: "Catálogo",
    links: [
      { label: "Generadores", href: "/catalogo?categoria=generadores" },
      { label: "Rotomartillos", href: "/catalogo?categoria=rotomartillos" },
      { label: "Demoledores", href: "/catalogo?categoria=demoledores-de-concreto" },
      { label: "Kits inalámbricos", href: "/catalogo?categoria=kits-inalambricos" },
      { label: "Ofertas", href: "/ofertas" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Mayoreo", href: "/#mayoreo" },
      { label: "Sucursales", href: "/sucursales" },
      { label: "Nosotros", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Rastrear mi pedido", href: "/seguimiento" },
      { label: "Envíos", href: "#" },
      { label: "Facturación", href: "#" },
      { label: "Garantías", href: "#" },
      { label: "Contacto", href: "/sucursales" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy text-[#a9b6da]">
      <Container className="py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Logo variant="light" />
            <p className="max-w-sm leading-relaxed">
              Herramienta profesional para los que construyen. Envío a toda la República y facturación inmediata.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h3 className="text-[17px] font-semibold text-white">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-7 text-sm text-[#8594c0] sm:flex-row">
          <p>© {new Date().getFullYear()} Herramienta Stock. Todos los derechos reservados.</p>
          <p>Envío a toda la República · Facturamos</p>
        </div>
      </Container>
    </footer>
  );
}
