/** Datos de conexión a Supabase (se configuran en .env.local). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** false = todavía no hay Supabase y la tienda usa los datos de ejemplo de src/lib/data. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const PHOTOS_BUCKET = "productos";
