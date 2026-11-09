import "server-only";
import { headers } from "next/headers";

/**
 * Dirección pública de la tienda (para armar enlaces que se mandan por WhatsApp).
 * Usa NEXT_PUBLIC_SITE_URL si está definida; si no, la del navegador que hizo la petición.
 */
export async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const trackingUrl = async (token: string) => `${await siteOrigin()}/seguimiento/${token}`;
