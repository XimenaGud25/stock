import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Stock Herramienta Pro — Herramienta profesional",
    template: "%s · Stock Herramienta Pro",
  },
  description:
    "Generadores, rotomartillos, demoledores, hidrolavadoras, desbrozadoras, motosierras y kits inalámbricos. Precios con IVA incluido, envío 24/48 h y facturación inmediata.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
