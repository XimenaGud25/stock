import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Cliente con permisos completos (llave secreta). SOLO se usa en el servidor,
 * después de comprobar que quien llama es administrador o desde el checkout.
 */
export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
