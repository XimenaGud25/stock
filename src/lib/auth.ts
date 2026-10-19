import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { sessionDb } from "./supabase/server";

/** Correos con acceso al panel (ADMIN_EMAILS en .env.local, separados por coma). */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Devuelve el usuario si inició sesión y es administrador; si no, null. */
export async function getAdmin() {
  if (!isSupabaseConfigured) return null;
  const { data } = await (await sessionDb()).auth.getUser();
  const email = data.user?.email?.toLowerCase();
  return email && ADMIN_EMAILS.includes(email) ? data.user : null;
}

/** Para páginas y acciones del panel: manda al login si no es administrador. */
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
